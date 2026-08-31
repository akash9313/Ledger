import { NativeModules, Platform } from 'react-native';

const { LedgerWidget } = NativeModules;

export const updateWidgetWithLatestNotes = (notes: any[], themeMode: string = 'dark') => {
  if (Platform.OS !== 'android' || !LedgerWidget) {
    return;
  }

  try {
    const formattedNotes = (notes || [])
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map(note => ({
        id: note.id,
        title: note.title || 'Untitled',
        content: note.content || '',
        total: typeof note.amount === 'number' ? note.amount : 0,
        updatedAt: note.updatedAt || Date.now(),
      }));

    const jsonString = JSON.stringify(formattedNotes);
    LedgerWidget.updateWidget(jsonString, themeMode);
  } catch (error) {
    console.error('Failed to update Android widget:', error);
  }
};

