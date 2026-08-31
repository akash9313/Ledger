import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Note } from '../models/Note';
import { calculateTotal } from '../utils/calculator';
import { 
  saveNoteToFirestore, 
  deleteNoteFromFirestore, 
  syncAllNotesToFirestore,
  subscribeToUserNotes,
  fetchUserNotesFromFirestore
} from '../../../services/firestoreService';
import { useAuthStore } from '../../auth/store/useAuthStore';

const storage = createMMKV();

const zustandNotesStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.remove(name),
};

interface NotesState {
  notes: Note[];
  lastSyncedAt: number | null;
  isSyncing: boolean;

  addNote: (note: { title: string; phoneNumber?: string; upiId?: string; content: string }) => Promise<void>;
  updateNote: (id: string, updates: { title?: string; phoneNumber?: string; upiId?: string; content?: string }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  bulkDeleteNotes: (ids: string[]) => Promise<void>;
  
  // Real-time Firestore synchronization
  syncCloud: (userUid: string) => () => void;
  uploadAllToCloud: () => Promise<void>;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [
        {
          id: 'sample-chat-1',
          title: 'John Smith',
          phoneNumber: '+1 555-0199',
          content: '150 Advance payment\n-50 Grocery item\n-20 Coffee',
          total: 80,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
          isDeleted: false,
        },
        {
          id: 'sample-chat-2',
          title: 'Store Ledger Account',
          phoneNumber: '+91 9876543210',
          upiId: '9876543210@paytm',
          content: '500\n-200 paid\ncleared\n-120 items taken',
          total: -120,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDeleted: false,
        }
      ],
      lastSyncedAt: null,
      isSyncing: false,

      addNote: async ({ title, phoneNumber, upiId, content }) => {
        const total = calculateTotal(content);
        const newNote: Note = {
          id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title,
          phoneNumber,
          upiId,
          content,
          total,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDeleted: false,
        };

        set((state) => ({ notes: [newNote, ...state.notes] }));

        const user = useAuthStore.getState().user;
        if (user?.uid) {
          await saveNoteToFirestore(user.uid, newNote);
          set({ lastSyncedAt: Date.now() });
        }
      },

      updateNote: async (id, updates) => {
        set((state) => ({
          notes: state.notes.map((item) => {
            if (item.id === id) {
              const updatedContent = updates.content !== undefined ? updates.content : item.content;
              return {
                ...item,
                ...updates,
                total: calculateTotal(updatedContent),
                updatedAt: Date.now(),
              };
            }
            return item;
          }),
        }));

        const user = useAuthStore.getState().user;
        if (user?.uid) {
          const updated = get().notes.find((n) => n.id === id);
          if (updated) {
            await saveNoteToFirestore(user.uid, updated);
            set({ lastSyncedAt: Date.now() });
          }
        }
      },

      deleteNote: async (id) => {
        set((state) => ({
          notes: state.notes.map((item) =>
            item.id === id ? { ...item, isDeleted: true, deletedAt: Date.now(), updatedAt: Date.now() } : item
          ),
        }));

        const user = useAuthStore.getState().user;
        if (user?.uid) {
          await deleteNoteFromFirestore(user.uid, id, false);
          set({ lastSyncedAt: Date.now() });
        }
      },

      bulkDeleteNotes: async (ids) => {
        set((state) => ({
          notes: state.notes.map((item) =>
            ids.includes(item.id) ? { ...item, isDeleted: true, deletedAt: Date.now(), updatedAt: Date.now() } : item
          ),
        }));

        const user = useAuthStore.getState().user;
        if (user?.uid) {
          for (const id of ids) {
            await deleteNoteFromFirestore(user.uid, id, false);
          }
          set({ lastSyncedAt: Date.now() });
        }
      },

      restoreNote: async (id) => {
        set((state) => ({
          notes: state.notes.map((item) =>
            item.id === id ? { ...item, isDeleted: false, deletedAt: null, updatedAt: Date.now() } : item
          ),
        }));

        const user = useAuthStore.getState().user;
        if (user?.uid) {
          const restored = get().notes.find((n) => n.id === id);
          if (restored) {
            await saveNoteToFirestore(user.uid, restored);
            set({ lastSyncedAt: Date.now() });
          }
        }
      },

      permanentlyDeleteNote: async (id) => {
        set((state) => ({
          notes: state.notes.filter((item) => item.id !== id),
        }));

        const user = useAuthStore.getState().user;
        if (user?.uid) {
          await deleteNoteFromFirestore(user.uid, id, true);
          set({ lastSyncedAt: Date.now() });
        }
      },

      uploadAllToCloud: async () => {
        const user = useAuthStore.getState().user;
        if (!user?.uid) return;

        set({ isSyncing: true });
        try {
          // Only upload user-created non-sample notes
          const currentNotes = get().notes.filter(n => !n.id.startsWith('sample-chat-'));
          if (currentNotes.length > 0) {
            await syncAllNotesToFirestore(user.uid, currentNotes);
          }
          set({ lastSyncedAt: Date.now(), isSyncing: false });
        } catch (e) {
          console.error('Failed to upload all notes to cloud:', e);
          set({ isSyncing: false });
        }
      },

      syncCloud: (userUid: string) => {
        set({ isSyncing: true });

        // Initial one-time fetch to restore user data on login/reinstall
        fetchUserNotesFromFirestore(userUid).then((initialCloudNotes) => {
          if (initialCloudNotes && initialCloudNotes.length > 0) {
            const formatted = initialCloudNotes.map((item) => ({
              ...item,
              total: calculateTotal(item.content || ''),
            }));
            set({
              notes: formatted.sort((a, b) => b.updatedAt - a.updatedAt),
              lastSyncedAt: Date.now(),
              isSyncing: false,
            });
          } else {
            // Upload any local non-sample notes if user was offline
            get().uploadAllToCloud();
          }
        }).catch((err) => {
          console.error('Error restoring initial cloud notes:', err);
        });

        // Real-time listener for ongoing updates across devices
        const unsubscribe = subscribeToUserNotes(userUid, (cloudNotes) => {
          if (cloudNotes && cloudNotes.length > 0) {
            set((state) => {
              const mergedMap = new Map<string, Note>();
              
              // Keep non-sample local notes
              state.notes
                .filter(n => !n.id.startsWith('sample-chat-'))
                .forEach((item) => mergedMap.set(item.id, item));

              cloudNotes.forEach((cloudItem) => {
                const existing = mergedMap.get(cloudItem.id);
                if (!existing || cloudItem.updatedAt >= existing.updatedAt) {
                  mergedMap.set(cloudItem.id, {
                    ...cloudItem,
                    total: calculateTotal(cloudItem.content || ''),
                  });
                }
              });

              const mergedList = Array.from(mergedMap.values()).sort(
                (a, b) => b.updatedAt - a.updatedAt
              );

              return {
                notes: mergedList,
                lastSyncedAt: Date.now(),
                isSyncing: false,
              };
            });
          } else {
            set({ isSyncing: false });
          }
        });

        return unsubscribe;
      },
    }),
    {
      name: 'ledger-notes-storage',
      storage: createJSONStorage(() => zustandNotesStorage),
    }
  )
);
