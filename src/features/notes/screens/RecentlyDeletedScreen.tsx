import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useNotesStore } from '../store/useNotesStore';

const RecentlyDeletedScreen = () => {
  const { deletedNotes, restoreNote, permanentlyDeleteNote } = useNotesStore();
  const navigation = useNavigation();

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
    <TouchableOpacity style={styles.card} onPress={() => handleNotePress(item.id)}>
      <Text style={styles.title}>{item.title || 'Untitled'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={styles.iconText}>❮</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recently Deleted</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={deletedNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No recently deleted notes.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconBtn: {
    padding: 8,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
});

export default RecentlyDeletedScreen;
