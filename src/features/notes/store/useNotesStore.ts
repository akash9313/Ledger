import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Note } from '../models/Note';

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
    return storage.delete(name);
  },
};

interface NotesState {
  notes: Note[];
  deletedNotes: Note[];
  addNote: (note: Omit<Note, 'id' | 'updatedAt' | 'createdAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDeleteNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      deletedNotes: [],
      addNote: (note) => set((state) => ({
        notes: [
          {
            ...note,
            id: Math.random().toString(36).substring(2, 9),
            updatedAt: Date.now(),
            createdAt: Date.now(),
          },
          ...state.notes,
        ]
      })),
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)
      })),
      deleteNote: (id) => set((state) => {
        const noteToDelete = state.notes.find((n) => n.id === id);
        if (!noteToDelete) return state;
        return {
          notes: state.notes.filter((n) => n.id !== id),
          deletedNotes: [noteToDelete, ...state.deletedNotes]
        };
      }),
      restoreNote: (id) => set((state) => {
        const noteToRestore = state.deletedNotes.find((n) => n.id === id);
        if (!noteToRestore) return state;
        return {
          deletedNotes: state.deletedNotes.filter((n) => n.id !== id),
          notes: [noteToRestore, ...state.notes]
        };
      }),
      permanentlyDeleteNote: (id) => set((state) => ({
        deletedNotes: state.deletedNotes.filter((n) => n.id !== id)
      })),
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
