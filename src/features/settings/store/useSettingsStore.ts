import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

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

export type ListDisplay = 'none' | 'skins' | 'folder_colors';
export type ListOrder = 'creation_time' | 'modified';

interface SettingsState {
  listDisplay: ListDisplay;
  listOrder: ListOrder;
  setListDisplay: (display: ListDisplay) => void;
  setListOrder: (order: ListOrder) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      listDisplay: 'folder_colors',
      listOrder: 'modified',
      setListDisplay: (display) => set({ listDisplay: display }),
      setListOrder: (order) => set({ listOrder: order }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
