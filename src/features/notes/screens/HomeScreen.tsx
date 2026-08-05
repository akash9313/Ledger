import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Share, Alert, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-restore / sync notes from Cloud Firestore on app startup
  useEffect(() => {
    syncWithCloud();
  }, []);

  useEffect(() => {
    try {
      const { updateWidgetWithLatestNotes } = require('../../../services/widgetService');
      updateWidgetWithLatestNotes(notes, colors.statusBar === 'dark-content' ? 'light' : 'dark');
    } catch (e) {
      // fallback
    }
  }, [notes, colors.statusBar]);

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteNote(id));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleCloudSync = async () => {
    setIsMenuOpen(false);
    const res = await syncWithCloud();
    if (res.success) {
      Alert.alert('Cloud Sync Complete ☁️', 'Your notes are synchronized with Firebase Firestore.');
    } else {
      Alert.alert(
        'Cloud Sync Status',
        res.error ? `Sync notice: ${res.error}` : 'Unable to connect to Cloud Sync. Please check your internet connection.',
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
    const snippet = item.content ? item.content.split('\n').filter((l: string) => l.trim().length > 0)[0] || '' : '';

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        style={[
          styles.card, 
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          isSelected && { backgroundColor: colors.surfaceSelected, borderColor: colors.accent, borderWidth: 2 }
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
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
          {isSelectionMode ? (
             <Text style={[styles.iconText, { color: colors.accent }]}>{isSelected ? '☑' : '☐'}</Text>
          ) : (
            <View style={[
              styles.totalBadge, 
              { backgroundColor: total < 0 ? colors.negativeBg : colors.positiveBg }
            ]}>
              <Text style={[styles.totalText, total < 0 ? { color: colors.negative } : { color: colors.positive }]}>
                {total > 0 ? `+${total}` : `${total}`}
              </Text>
            </View>
          )}
        </View>

        {snippet ? (
          <Text style={[styles.snippet, { color: colors.textMuted }]} numberOfLines={2}>
            {snippet}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {new Date(item.updatedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
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
             style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]} 
             placeholder="Search notes..." 
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
             <Text style={[styles.iconText, { color: '#F87171' }]}>🗑</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ledger</Text>
          </View>
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

      {/* Dropdown Backdrop & Menu Overlay */}
      {isMenuOpen && (
        <>
          <TouchableOpacity 
            style={styles.menuBackdrop} 
            activeOpacity={1} 
            onPress={() => setIsMenuOpen(false)} 
          />
          <View style={[styles.dropdownMenu, { backgroundColor: colors.dropdownBg, borderColor: colors.border }]}>
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
        </>
      )}

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No accounts yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Tap the + button below to add your first ledger account!</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        activeOpacity={0.85}
        style={[
          styles.fab, 
          { 
            backgroundColor: colors.accent,
            bottom: Math.max(insets.bottom + 48, 80),
            shadowColor: colors.accent,
          }
        ]}
        onPress={() => navigation.navigate('NoteDetail', { noteId: undefined })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
  },
  iconText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 90,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 75,
    right: 20,
    borderRadius: 16,
    paddingVertical: 6,
    minWidth: 170,
    zIndex: 100,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderWidth: 1,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: { padding: 16, paddingBottom: 160 },
  card: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  snippet: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  totalText: {
    fontSize: 15,
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
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  fabText: { 
    color: '#FFFFFF', 
    fontSize: 38, 
    lineHeight: 40, 
    fontWeight: '300',
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

export default HomeScreen;
