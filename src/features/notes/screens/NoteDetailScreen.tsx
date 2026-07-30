import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useNotesStore } from '../store/useNotesStore';
import { calculateTotal } from '../utils/calculator';
import { useTheme } from '../../../theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteDetail'>;

const NoteDetailScreen = ({ route, navigation }: Props) => {
  const { noteId } = route.params;
  const { notes, addNote, updateNote, deleteNote } = useNotesStore();
  const { colors } = useTheme();
  
  const existingNote = notes.find(n => n.id === noteId);

  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [total, setTotal] = useState(0);

  // Undo / Redo State
  const [history, setHistory] = useState<string[]>([existingNote?.content || '']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Debounced history push
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (history[historyIndex] !== content) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(content);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [content, history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
    }
  };

  useEffect(() => {
    setTotal(calculateTotal(content));
  }, [content]);

  const handleSave = () => {
    if (title.trim() !== '' || content.trim() !== '') {
      if (existingNote) {
        updateNote(existingNote.id, { title, content });
      } else {
        addNote({ title, content });
      }
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={[styles.iconText, { color: colors.icon }]}>❮</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleUndo} style={styles.iconBtn} disabled={historyIndex === 0}>
            <Text style={[styles.iconText, { color: historyIndex === 0 ? colors.textMuted : colors.icon }]}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRedo} style={styles.iconBtn} disabled={historyIndex === history.length - 1}>
            <Text style={[styles.iconText, { color: historyIndex === history.length - 1 ? colors.textMuted : colors.icon }]}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.iconBtn}>
            <Text style={[styles.iconText, { color: colors.icon }]}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={[styles.titleInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
        placeholder="Enter Name..."
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <View style={[styles.totalContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total:</Text>
        <Text style={[styles.totalAmount, total < 0 ? { color: colors.negative } : { color: colors.positive }]}>
          {total}
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 400 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[styles.contentInput, { color: colors.textSecondary }]}
          placeholder="Type numbers here...&#10;e.g. 50&#10;-30&#10;Cleared"
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
          autoFocus
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  disabledIcon: {
    color: '#4B5563', // gray-600
  },
  titleInput: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  totalLabel: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  positive: { color: '#4ADE80' },
  negative: { color: '#F87171' },
  contentInput: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 18,
    padding: 16,
    lineHeight: 28,
  }
});

export default NoteDetailScreen;
