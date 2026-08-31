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

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const { notes, bulkDeleteNotes, syncCloud, isSyncing } = useNotesStore();
  const { user, initAuthListener } = useAuthStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const activeNotes = notes.filter((item) => !item.isDeleted);
  const filteredNotes = activeNotes.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      (item.phoneNumber && item.phoneNumber.toLowerCase().includes(query)) ||
      item.content.toLowerCase().includes(query)
    );
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    Alert.alert(
      'Delete Selected',
      `Move ${selectedIds.length} account(s) to Recently Deleted?`,
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

    const lines = (item.content || '').split('\n').filter(l => l.trim() !== '');
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
              <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title || 'Untitled Chat'}</Text>
              {item.phoneNumber ? (
                <Text style={[styles.phoneSub, { color: colors.textMuted }]}>📱 {item.phoneNumber}</Text>
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
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Dynamic Header */}
      {isSearchMode ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setIsSearchMode(false); setSearchQuery(''); }} style={styles.iconBtn}>
            <Text style={[styles.iconText, { color: colors.icon || '#FFF' }]}>❮</Text>
          </TouchableOpacity>
          <TextInput 
            style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: colors.surface || '#161622', borderColor: colors.border }]} 
            placeholder="Search by name, mobile, or note..." 
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      ) : isSelectionMode ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedIds([]); }} style={styles.iconBtn}>
            <Text style={[styles.iconText, { color: colors.icon || '#FFF' }]}>❮</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{selectedIds.length} Selected</Text>
          <TouchableOpacity onPress={handleBulkDelete} style={styles.iconBtn}>
            <Text style={[styles.iconText, { color: '#EF4444' }]}>🗑</Text>
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
            {/* Cloud Sync & Auth Button */}
            <TouchableOpacity 
              style={styles.authBadge} 
              onPress={() => navigation.navigate('Auth')}
              activeOpacity={0.8}
            >
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.badgeAvatar} />
              ) : (
                <View style={styles.badgeAvatarFallback}>
                  <Text style={styles.badgeAvatarText}>{user ? 'G' : '👤'}</Text>
                </View>
              )}
              <View style={styles.badgeTextCol}>
                <Text style={styles.badgeTitle}>{user ? 'Synced' : 'Guest'}</Text>
                <Text style={[styles.badgeStatus, { color: user ? '#10B981' : '#F59E0B' }]}>
                  {user ? (isSyncing ? 'Syncing...' : 'Cloud ☁️') : 'Login Later'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearchMode(true)}>
              <Text style={{ fontSize: 20 }}>🔍</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Guest Mode Banner Prompt */}
      {!user && (
        <TouchableOpacity 
          style={styles.guestBanner} 
          onPress={() => navigation.navigate('Auth')}
          activeOpacity={0.9}
        >
          <Text style={styles.guestBannerIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guestBannerTitle}>Enable Online Cloud Backup</Text>
            <Text style={styles.guestBannerSub}>Sign in with Google to protect your ledger chats on Firestore</Text>
          </View>
          <Text style={styles.guestBannerArrow}>❯</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No accounts yet</Text>
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
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B12' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerGreeting: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 8,
  },
  badgeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  badgeAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  badgeAvatarText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
  },
  badgeTextCol: {
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  badgeStatus: {
    fontSize: 9,
    fontWeight: '600',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  guestBannerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  guestBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  guestBannerSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  guestBannerArrow: {
    fontSize: 16,
    color: '#6366F1',
    marginLeft: 8,
  },
  listContent: { padding: 20, paddingBottom: 160 },
  card: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  phoneSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '800',
  },
  snippet: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fabText: { 
    color: '#FFFFFF', 
    fontSize: 32, 
    lineHeight: 34, 
    fontWeight: '400',
  },
});

export default HomeScreen;
