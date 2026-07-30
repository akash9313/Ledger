import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Note } from '../models/Note';
import { syncNotesToCloud, deleteNoteFromCloud } from '../../../services/cloudSyncService';

const storage = createMMKV();

const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.remove(name);
  },
};

interface NotesState {
  notes: Note[];
  deletedNotes: Note[];
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  
  addNote: (note: Omit<Note, 'id' | 'updatedAt' | 'createdAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDeleteNote: (id: string) => void;
  syncWithCloud: () => Promise<{ success: boolean; error?: string }>;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      deletedNotes: [],
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,

      addNote: (note) => {
        set((state) => ({
          notes: [
            {
              ...note,
              id: Math.random().toString(36).substring(2, 9),
              updatedAt: Date.now(),
              createdAt: Date.now(),
            },
            ...state.notes,
          ]
        }));
        // Auto-sync new note to Cloud Firestore in background
        setTimeout(() => get().syncWithCloud(), 300);
      },
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)
        }));
        // Auto-sync updated note to Cloud Firestore in background
        setTimeout(() => get().syncWithCloud(), 500);
      },
      deleteNote: (id) => {
        set((state) => {
          const noteToDelete = state.notes.find((n) => n.id === id);
          if (!noteToDelete) return state;
          return {
            notes: state.notes.filter((n) => n.id !== id),
            deletedNotes: [noteToDelete, ...state.deletedNotes]
          };
        });
        // Auto-sync after deleting note
        setTimeout(() => get().syncWithCloud(), 300);
      },
      restoreNote: (id) => {
        set((state) => {
          const noteToRestore = state.deletedNotes.find((n) => n.id === id);
          if (!noteToRestore) return state;
          return {
            deletedNotes: state.deletedNotes.filter((n) => n.id !== id),
            notes: [noteToRestore, ...state.notes]
          };
        });
        setTimeout(() => get().syncWithCloud(), 300);
      },
      permanentlyDeleteNote: (id) => {
        deleteNoteFromCloud(id);
        set((state) => ({
          deletedNotes: state.deletedNotes.filter((n) => n.id !== id)
        }));
      },
      syncWithCloud: async () => {
        set({ isSyncing: true, syncError: null });
        const currentLocalNotes = get().notes;
        const result = await syncNotesToCloud(currentLocalNotes);

        if (result.success && result.notes) {
          set({
            notes: result.notes,
            isSyncing: false,
            lastSyncedAt: Date.now(),
            syncError: null,
          });
          return { success: true };
        } else {
          set({
            isSyncing: false,
            syncError: result.error || 'Sync failed',
          });
          return { success: false, error: result.error };
        }
      },
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

