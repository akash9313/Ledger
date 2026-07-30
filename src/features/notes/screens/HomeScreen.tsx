import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Share, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotesStore } from '../store/useNotesStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { calculateTotal } from '../utils/calculator';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useTheme } from '../../../theme/useTheme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const { notes, deleteNote, syncWithCloud, isSyncing, syncError, lastSyncedAt } = useNotesStore();
  const { listOrder } = useSettingsStore();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-restore / sync notes from Cloud Firestore on app startup
  useEffect(() => {
    syncWithCloud();
  }, []);

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteNote(id));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleCloudSync = async () => {
    setIsMenuOpen(false);
    const res = await syncWithCloud();
    if (res.success) {
      Alert.alert('Cloud Sync Success ☁️', 'Your notes have been synchronized with Firebase Firestore.');
    } else {
      Alert.alert(
        'Cloud Sync Required',
        `${res.error || 'Failed to sync.'}\n\nWould you like to configure your Firebase credentials in Settings?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') },
        ]
      );
    }
  };

  const handleBackup = async () => {
    setIsMenuOpen(false);
    const data = JSON.stringify(notes, null, 2);
    try {
      await Share.share({
        message: data,
        title: 'Ledger Backup'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate backup.');
    }
  };

  const filteredNotes = notes
    .filter(note => {
      if (!isSearchMode || !searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      return (note.title?.toLowerCase().includes(lowerQuery) || note.content?.toLowerCase().includes(lowerQuery));
    })
    .sort((a, b) => {
      if (listOrder === 'creation_time') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      return b.updatedAt - a.updatedAt;
    });

  const renderItem = ({ item }: { item: any }) => {
    const total = calculateTotal(item.content);
    const isSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity 
        style={[
          styles.card, 
          { backgroundColor: colors.card },
          isSelected && { backgroundColor: colors.surfaceSelected, borderColor: colors.accent, borderWidth: 1 }
        ]}
        onPress={() => {
          if (isSelectionMode) {
            if (isSelected) {
              setSelectedIds(selectedIds.filter(id => id !== item.id));
            } else {
              setSelectedIds([...selectedIds, item.id]);
            }
          } else {
            navigation.navigate('NoteDetail', { noteId: item.id });
          }
        }}
        onLongPress={() => {
           if (!isSelectionMode) {
             setIsSelectionMode(true);
             setSelectedIds([item.id]);
           }
        }}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title || 'Untitled'}</Text>
        {isSelectionMode ? (
           <Text style={[styles.iconText, { color: colors.icon }]}>{isSelected ? '☑' : '☐'}</Text>
        ) : (
          <Text style={[styles.total, total < 0 ? { color: colors.negative } : { color: colors.positive }]}>
            Total: {total}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      {/* Dynamic Header */}
      {isSearchMode ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setIsSearchMode(false); setSearchQuery(''); }} style={styles.iconBtn}>
             <Text style={[styles.iconText, { color: colors.icon }]}>❮</Text>
          </TouchableOpacity>
          <TextInput 
             style={[styles.searchInput, { color: colors.textPrimary }]} 
             placeholder="Search..." 
             placeholderTextColor={colors.textMuted}
             value={searchQuery}
             onChangeText={setSearchQuery}
             autoFocus
          />
        </View>
      ) : isSelectionMode ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedIds([]); }} style={styles.iconBtn}>
             <Text style={[styles.iconText, { color: colors.icon }]}>❮</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{selectedIds.length} Selected</Text>
          <TouchableOpacity onPress={handleBulkDelete} style={styles.iconBtn}>
             <Text style={[styles.iconText, { color: colors.icon }]}>🗑</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ledger</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSelectionMode(true)}>
              <Text style={[styles.iconText, { color: colors.icon }]}>☑</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearchMode(true)}>
              <Text style={[styles.iconText, { color: colors.icon }]}>⌕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsMenuOpen(!isMenuOpen)}>
              <Text style={[styles.iconText, { color: colors.icon }]}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Dropdown Menu Overlay */}
      {isMenuOpen && (
        <View style={[styles.dropdownMenu, { backgroundColor: colors.dropdownBg }]}>
          <TouchableOpacity style={styles.dropdownItem} onPress={handleCloudSync}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{isSyncing ? 'Syncing... 🔄' : 'Cloud Sync ☁️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownItem} onPress={handleBackup}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>Local Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { setIsMenuOpen(false); navigation.navigate('Settings'); }}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textMuted }]}>No notes yet. Tap + to create one.</Text>}
      />
      
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('NoteDetail', { noteId: undefined })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '400',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    paddingBottom: 4,
  },
  iconBtn: {
    padding: 4,
  },
  iconText: {
    color: '#E5E7EB',
    fontSize: 26,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSelected: {
    backgroundColor: '#374151',
    borderColor: '#60A5FA',
    borderWidth: 1,
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  total: { fontSize: 16, fontWeight: 'bold' },
  positive: { color: '#4ADE80' },
  negative: { color: '#F87171' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    backgroundColor: '#3B82F6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 32, lineHeight: 34 },
});

export default HomeScreen;
