import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  StatusBar,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useNotesStore } from '../store/useNotesStore';
import { useTheme } from '../../../theme/useTheme';
import { Note } from '../models/Note';
import { calculateTotal } from '../utils/calculator';

type Props = NativeStackScreenProps<RootStackParamList, 'RecentlyDeleted'>;

const RecentlyDeletedScreen = ({ navigation }: Props) => {
  const { notes, restoreNote, permanentlyDeleteNote } = useNotesStore();
  const { colors } = useTheme();

  const deletedNotes = notes.filter((n) => n.isDeleted);

  const handlePermanentDelete = (id: string, title: string) => {
    Alert.alert(
      'Permanent Delete',
      `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Forever', 
          style: 'destructive', 
          onPress: () => permanentlyDeleteNote(id) 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Note }) => {
    const total = calculateTotal(item.content || '');

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>
            {item.phoneNumber ? `📱 ${item.phoneNumber} • ` : ''}Balance: {total === 0 ? 'Cleared' : `${total > 0 ? '+₹' : '-₹'}${Math.abs(total).toLocaleString('en-IN')}`}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.restoreBtn} 
            onPress={() => restoreNote(item.id)}
          >
            <Text style={styles.restoreText}>Restore</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => handlePermanentDelete(item.id, item.title)}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textPrimary }]}>❮ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Recently Deleted</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={deletedNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🗑️</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Trash is empty</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Deleted ledger chat accounts will show up here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { padding: 20 },
  card: {
    backgroundColor: '#161622',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cardSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  restoreBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  restoreText: { color: '#10B981', fontWeight: '700', fontSize: 12 },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deleteText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, marginTop: 4, textAlign: 'center' },
});

export default RecentlyDeletedScreen;
