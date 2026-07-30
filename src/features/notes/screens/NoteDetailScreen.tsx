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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
          <Text style={[styles.iconText, { color: colors.icon }]}>❮</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleUndo} style={styles.iconBtn} disabled={historyIndex === 0} activeOpacity={0.7}>
            <Text style={[styles.iconText, { color: historyIndex === 0 ? colors.textMuted : colors.icon }]}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRedo} style={styles.iconBtn} disabled={historyIndex === history.length - 1} activeOpacity={0.7}>
            <Text style={[styles.iconText, { color: historyIndex === history.length - 1 ? colors.textMuted : colors.icon }]}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.accent }]} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save ✓</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={[styles.titleInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
        placeholder="Note Title..."
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Calculated Total</Text>
          <View style={[
            styles.totalBadge, 
            { backgroundColor: total < 0 ? colors.negativeBg : colors.positiveBg }
          ]}>
            <Text style={[styles.totalAmount, total < 0 ? { color: colors.negative } : { color: colors.positive }]}>
              {total > 0 ? `+${total}` : `${total}`}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 400 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[styles.contentInput, { color: colors.textSecondary }]}
          placeholder="Type numbers here line by line...&#10;&#10;e.g.&#10;500  (Income)&#10;-150 (Groceries)&#10;-50  (Coffee)"
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  totalCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  contentInput: {
    flex: 1,
    fontSize: 18,
    padding: 20,
    lineHeight: 28,
  }
});

export default NoteDetailScreen;
