import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  StatusBar, 
  Image, 
  TextInput,
  Alert 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useNotesStore } from '../store/useNotesStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useTheme } from '../../../theme/useTheme';
import { Note } from '../models/Note';
import { calculateTotal } from '../utils/calculator';
import { AppIcon } from '../../../core/components/AppIcon';
import { updateWidgetWithLatestNotes } from '../../../services/widgetService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const { notes, bulkDeleteNotes, syncCloud, isSyncing } = useNotesStore();
  const { user, initAuthListener } = useAuthStore();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize auth listener & cloud sync
  useEffect(() => {
    const unsubAuth = initAuthListener();
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const unsubCloud = syncCloud(user.uid);
      return () => unsubCloud();
    }
  }, [user?.uid]);

  // Auto-sync notes to Android Widget on load/change
  useEffect(() => {
    updateWidgetWithLatestNotes(notes);
  }, [notes]);

  const activeNotes = notes.filter((item) => !item.isDeleted);
  const filteredNotes = activeNotes.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(query);
    const phoneMatch = item.phoneNumber?.toLowerCase().includes(query);
    const contentMatch = item.content?.toLowerCase().includes(query);
    return titleMatch || phoneMatch || contentMatch;
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      const updated = selectedIds.filter((item) => item !== id);
      setSelectedIds(updated);
      if (updated.length === 0) setIsSelectionMode(false);
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Selected Accounts',
      `Are you sure you want to move ${selectedIds.length} ledger account(s) to Recently Deleted?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await bulkDeleteNotes(selectedIds);
            setSelectedIds([]);
            setIsSelectionMode(false);
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Note }) => {
    const isSelected = selectedIds.includes(item.id);
    const total = calculateTotal(item.content || '');
    const isPositive = total > 0;
    const isNegative = total < 0;

    const lines = (item.content || '').split('\n').filter((l) => l.trim().length > 0);
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : 'No transactions recorded';

    return (
      <TouchableOpacity 
        style={[
          styles.card, 
          { 
            backgroundColor: colors.card || '#161622',
            borderColor: isSelected ? colors.accent : colors.border || 'rgba(255, 255, 255, 0.08)'
          }
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelect(item.id);
          } else {
            navigation.navigate('NoteDetail', { noteId: item.id });
          }
        }}
        onLongPress={() => {
          setIsSelectionMode(true);
          toggleSelect(item.id);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            {isSelectionMode && (
              <View style={[styles.checkbox, isSelected && { backgroundColor: colors.accent }]}>
                {isSelected && <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title || 'Untitled Account'}</Text>
              {item.phoneNumber ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <AppIcon name="call" size={12} color={colors.textMuted} />
                  <Text style={[styles.phoneSub, { color: colors.textMuted, marginLeft: 4 }]}>{item.phoneNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Calculated Total Badge */}
          <View style={[
            styles.totalBadge,
            isPositive && { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
            isNegative && { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
            !isPositive && !isNegative && { backgroundColor: 'rgba(156, 163, 175, 0.15)' }
          ]}>
            <Text style={[
              styles.totalText,
              isPositive && { color: '#10B981' },
              isNegative && { color: '#EF4444' },
              !isPositive && !isNegative && { color: '#9CA3AF' }
            ]}>
              {total === 0 ? 'Cleared' : `${total > 0 ? '+₹' : '-₹'}${Math.abs(total).toLocaleString('en-IN')}`}
            </Text>
          </View>
        </View>

        <Text style={[styles.snippet, { color: colors.textMuted }]} numberOfLines={1}>
          Line entry: {lastLine}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            Updated {new Date(item.updatedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* App Header */}
      {isSearchMode ? (
        <View style={styles.searchHeader}>
          <TouchableOpacity onPress={() => { setIsSearchMode(false); setSearchQuery(''); }} style={styles.iconBtn}>
            <AppIcon name="arrow-back" size={20} color={colors.icon || colors.textPrimary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: colors.inputBg || '#161622' }]}
            placeholder="Search accounts by name or phone..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      ) : isSelectionMode ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedIds([]); }} style={styles.iconBtn}>
            <AppIcon name="arrow-back" size={20} color={colors.icon || colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{selectedIds.length} Selected</Text>
          <TouchableOpacity onPress={handleBulkDelete} style={styles.iconBtn}>
            <AppIcon name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerGreeting, { color: colors.textMuted }]}>
              {user ? `Welcome back, ${user.displayName?.split(' ')[0]}` : 'Personal Ledger'}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ledger</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearchMode(true)}>
              <AppIcon name="search" size={20} color={colors.icon || colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <AppIcon name="settings" size={20} color={colors.icon || colors.textPrimary} />
            </TouchableOpacity>

            {/* Profile Avatar Button Shifted to Far Right */}
            <TouchableOpacity 
              style={styles.profileAvatarBtn} 
              onPress={() => navigation.navigate('Auth')}
              activeOpacity={0.8}
            >
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.profileAvatarImg} />
              ) : (
                <View style={styles.profileAvatarFallback}>
                  <AppIcon name="user" size={18} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Guest Mode Banner Prompt */}
      {!user && (
        <TouchableOpacity 
          style={[styles.guestBanner, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF', borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE' }]} 
          onPress={() => navigation.navigate('Auth')}
          activeOpacity={0.9}
        >
          <AppIcon name="cloud" size={22} color={colors.accent || '#6366F1'} />
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={[styles.guestBannerTitle, { color: colors.textPrimary }]}>Enable Online Cloud Backup</Text>
            <Text style={[styles.guestBannerSub, { color: colors.textMuted }]}>Sign in with Google to protect your ledger chats on Firestore</Text>
          </View>
          <AppIcon name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppIcon name="journal" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: 12 }]}>No accounts yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Tap the + button below to create a new account with Name & Mobile Number!
            </Text>
          </View>
        }
      />
      
      {/* Create New Chat Account FAB */}
      <TouchableOpacity 
        activeOpacity={0.85}
        style={[
          styles.fab, 
          { 
            backgroundColor: colors.accent || '#6366F1',
            bottom: Math.max(insets.bottom + 24, 40),
          }
        ]}
        onPress={() => navigation.navigate('NoteDetail', { noteId: undefined })}
      >
        <AppIcon name="add" size={28} color="#FFFFFF" />
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
  headerGreeting: { fontSize: 13, fontWeight: '500' },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  profileAvatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  profileAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  guestBannerTitle: { fontWeight: '700', fontSize: 14 },
  guestBannerSub: { fontSize: 12, marginTop: 2 },

  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: { fontSize: 17, fontWeight: '700' },
  phoneSub: { fontSize: 12 },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalText: { fontSize: 13, fontWeight: '800' },
  snippet: { fontSize: 14, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  dateText: { fontSize: 12 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },

  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default HomeScreen;
