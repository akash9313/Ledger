import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  StatusBar,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { useNotesStore } from '../../notes/store/useNotesStore';
import { useTheme } from '../../../theme/useTheme';
import { AppIcon } from '../../../core/components/AppIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const AuthScreen = ({ navigation }: Props) => {
  const { user, isLoading, error, signInWithGoogle, logout, clearError, resetLoading } = useAuthStore();
  const { lastSyncedAt, isSyncing, uploadAllToCloud } = useNotesStore();
  const { colors } = useTheme();

  useEffect(() => {
    resetLoading();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Authentication Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      await uploadAllToCloud();
    } catch (e) {
      // handled by store error listener
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your offline data will remain safe on your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppIcon name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Account & Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <AppIcon name="cloud" size={32} color="#6366F1" />
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>LEDGER CLOUD</Text>
          <Text style={[styles.appTagline, { color: colors.textMuted }]}>
            {user ? 'Online Cloud Synchronization Active' : 'Sign in to back up & sync your financial data online'}
          </Text>
        </View>

        {user ? (
          /* Logged In User Card */
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>
                {isSyncing ? 'Syncing to Firestore...' : 'Firestore Online'}
              </Text>
            </View>

            <View style={styles.userProfileRow}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}

              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.displayName || 'Google User'}</Text>
                <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user.email || 'No email provided'}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Database Type</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Firebase Firestore ☁️</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Last Synced</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, styles.signOutBtn]} 
              onPress={handleSignOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name="trash" size={18} color="#EF4444" />
                  <Text style={[styles.signOutBtnText, { marginLeft: 8 }]}>Sign Out from Google</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Guest / Sign In Card */
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Features showcase */}
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <AppIcon name="cloud" size={22} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Online Firestore Storage</Text>
                <Text style={[styles.featureSubtitle, { color: colors.textMuted }]}>Store your transactions safely in your personal online cloud database</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <AppIcon name="journal" size={22} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Multi-Device Sync</Text>
                <Text style={[styles.featureSubtitle, { color: colors.textMuted }]}>Access your ledger balance anywhere by logging into your Google account</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <AppIcon name="check" size={22} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>100% Private & Encrypted</Text>
                <Text style={[styles.featureSubtitle, { color: colors.textMuted }]}>Protected with official Google OAuth 2.0 and Firebase Security Rules</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Google Sign In Button */}
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={styles.googleBtnInner}>
                  <View style={styles.gLogoCircle}>
                    <Text style={styles.gLogoText}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>Sign in with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Login Later / Guest Option */}
            <TouchableOpacity 
              style={styles.guestLink} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.guestLinkText}>Continue as Guest (Login Later)</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  appTagline: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  avatarFallback: {
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  featureSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gLogoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gLogoText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
  },
  googleBtnText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
  },
  guestLink: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestLinkText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default AuthScreen;
