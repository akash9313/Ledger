import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { ThemeMode } from '../../../theme/colors';

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

export type ListDisplay = 'none' | 'skins' | 'folder_colors';
export type ListOrder = 'creation_time' | 'modified';

interface SettingsState {
  listDisplay: ListDisplay;
  listOrder: ListOrder;
  theme: ThemeMode;
  setListDisplay: (display: ListDisplay) => void;
  setListOrder: (order: ListOrder) => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      listDisplay: 'folder_colors',
      listOrder: 'modified',
      theme: 'dark',
      setListDisplay: (display) => set({ listDisplay: display }),
      setListOrder: (order) => set({ listOrder: order }),
      setTheme: (theme) => {
        set({ theme });
        try {
          const { useNotesStore } = require('../../notes/store/useNotesStore');
          const notes = useNotesStore.getState().notes || [];
          const { updateWidgetWithLatestNotes } = require('../../../services/widgetService');
          updateWidgetWithLatestNotes(notes, theme);
        } catch (e) {
          // fallback
        }
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
