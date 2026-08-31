import { NativeModules, Platform } from 'react-native';
import { calculateTotal } from '../features/notes/utils/calculator';
import { useSettingsStore } from '../features/settings/store/useSettingsStore';

const { LedgerWidget } = NativeModules;

export const updateWidgetWithLatestNotes = (notes: any[], themeMode?: string) => {
  if (Platform.OS !== 'android' || !LedgerWidget) {
    return;
  }

  try {
    const currentTheme = themeMode || useSettingsStore.getState().theme || 'dark';
    const activeNotes = (notes || []).filter(note => !note.isDeleted);

    const formattedNotes = activeNotes
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map(note => {
        const exactTotal = calculateTotal(note.content || '');
        return {
          id: note.id,
          title: note.title || 'Untitled Account',
          phoneNumber: note.phoneNumber || '',
          upiId: note.upiId || '',
          content: note.content || '',
          total: exactTotal,
          updatedAt: note.updatedAt || Date.now(),
        };
      });

    const jsonString = JSON.stringify(formattedNotes);
    LedgerWidget.updateWidget(jsonString, currentTheme);
  } catch (error) {
    console.error('Failed to update Android widget:', error);
  }
};
