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
import Ionicons from 'react-native-vector-icons/Ionicons';

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
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            {item.phoneNumber ? `${item.phoneNumber} • ` : ''}Balance: {total === 0 ? 'Cleared' : `${total > 0 ? '+₹' : '-₹'}${Math.abs(total).toLocaleString('en-IN')}`}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.restoreBtn} 
            onPress={() => restoreNote(item.id)}
          >
            <Ionicons name="refresh-outline" size={14} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={styles.restoreText}>Restore</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => handlePermanentDelete(item.id, item.title)}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
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
            <Ionicons name="trash-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { paddingVertical: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { padding: 20 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  restoreText: { color: '#10B981', fontWeight: '700', fontSize: 12 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deleteText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, marginTop: 4, textAlign: 'center' },
});

export default RecentlyDeletedScreen;
