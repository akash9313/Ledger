import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useNotesStore } from '../store/useNotesStore';
import { useTheme } from '../../../theme/useTheme';

const RecentlyDeletedScreen = () => {
  const { deletedNotes, restoreNote, permanentlyDeleteNote } = useNotesStore();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleNotePress = (id: string) => {
    Alert.alert(
      'Restore Note',
      'Do you want to restore this note or permanently delete it?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => permanentlyDeleteNote(id) },
        { text: 'Restore', onPress: () => restoreNote(id) }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardInfo}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.title || 'Untitled'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Tap action to restore or delete</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionChip, { backgroundColor: colors.positiveBg }]} 
          onPress={() => restoreNote(item.id)}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionChipText, { color: colors.positive }]}>Restore ↺</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionChip, { backgroundColor: colors.negativeBg }]} 
          onPress={() => permanentlyDeleteNote(item.id)}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionChipText, { color: colors.negative }]}>Delete 🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
          <Text style={[styles.iconText, { color: colors.icon }]}>❮</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Recently Deleted</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={deletedNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗑</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No deleted notes</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Notes you delete will stay here until permanently removed.</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  iconBtn: {
    padding: 8,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: { padding: 16 },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: {
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default RecentlyDeletedScreen;
