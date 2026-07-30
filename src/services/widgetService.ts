import { NativeModules, Platform } from 'react-native';

const { LedgerWidget } = NativeModules;

export const updateWidgetWithLatestNotes = (notes: any[], themeMode: string = 'dark') => {
  if (Platform.OS !== 'android' || !LedgerWidget) {
    return;
  }

  try {
    const latestThreeNotes = notes
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 3)
      .map(note => ({
        id: note.id,
        title: note.title || 'Untitled',
        content: note.content || '',
        updatedAt: note.updatedAt || Date.now(),
      }));

    const jsonString = JSON.stringify(latestThreeNotes);
    LedgerWidget.updateWidget(jsonString, themeMode);
  } catch (error) {
    console.error('Failed to update Android widget:', error);
  }
};
