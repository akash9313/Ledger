import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useSettingsStore, ListDisplay, ListOrder } from '../store/useSettingsStore';
import { useNotesStore } from '../../notes/store/useNotesStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useTheme } from '../../../theme/useTheme';
import { ThemeMode } from '../../../theme/colors';
import { AppIcon } from '../../../core/components/AppIcon';
import { version } from '../../../../package.json';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation }: Props) => {
  const { listDisplay, listOrder, theme, setListDisplay, setListOrder, setTheme } = useSettingsStore();
  const { lastSyncedAt } = useNotesStore();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  
  const [displayModalVisible, setDisplayModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const displayLabels: Record<ListDisplay, string> = {
    none: 'None',
    skins: 'Skins',
    folder_colors: 'Folder colors'
  };

  const orderLabels: Record<ListOrder, string> = {
    creation_time: 'By creation time',
    modified: 'By modified'
  };

  const themeLabels: Record<ThemeMode, string> = {
    dark: 'Dark Mode',
    light: 'Light Mode'
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <AppIcon name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Google Account & Firestore Cloud Sync Item */}
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Auth')}>
          <View style={styles.settingRow}>
            <View style={styles.iconWrapper}>
              <AppIcon name="cloud" size={20} color={colors.accent || '#6366F1'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>
                Google Account & Cloud Sync
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                {user 
                  ? `Connected: ${user.email} (Firestore Online)` 
                  : 'Guest Mode - Tap to Sign In with Google'}
              </Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setThemeModalVisible(true)}>
          <View style={styles.settingRow}>
            <View style={styles.iconWrapper}>
              <AppIcon name={theme === 'dark' ? 'moon' : 'sun'} size={20} color={colors.accent || '#6366F1'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Theme</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{themeLabels[theme]}</Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('RecentlyDeleted')}>
          <View style={styles.settingRow}>
            <View style={styles.iconWrapper}>
              <AppIcon name="trash" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Recently Deleted</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>Restore or permanently delete accounts</Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setDisplayModalVisible(true)}>
          <View style={styles.settingRow}>
            <View style={styles.iconWrapper}>
              <AppIcon name="settings" size={20} color={colors.accent || '#6366F1'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>List Display</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{displayLabels[listDisplay]}</Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setOrderModalVisible(true)}>
          <View style={styles.settingRow}>
            <View style={styles.iconWrapper}>
              <AppIcon name="settings" size={20} color={colors.accent || '#6366F1'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>List Order</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{orderLabels[listOrder]}</Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <View style={styles.iconWrapper}>
              <AppIcon name="journal" size={20} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Version</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>V{version} (Firestore Secured)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Theme Modal */}
      <Modal visible={themeModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setThemeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.modalBg || colors.card, borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Theme</Text>
                
                {(Object.keys(themeLabels) as ThemeMode[]).map((key) => (
                  <TouchableOpacity key={key} style={styles.radioRow} onPress={() => { setTheme(key); setThemeModalVisible(false); }}>
                    <Text style={[styles.radioText, { color: colors.textPrimary }]}>{themeLabels[key]}</Text>
                    <View style={[styles.radioCircle, { borderColor: colors.textMuted }, theme === key && styles.radioCircleActive]} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setThemeModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* List Display Modal */}
      <Modal visible={displayModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setDisplayModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.modalBg || colors.card, borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>List Display</Text>
                
                {(Object.keys(displayLabels) as ListDisplay[]).map((key) => (
                  <TouchableOpacity key={key} style={styles.radioRow} onPress={() => { setListDisplay(key); setDisplayModalVisible(false); }}>
                    <Text style={[styles.radioText, { color: colors.textPrimary }]}>{displayLabels[key]}</Text>
                    <View style={[styles.radioCircle, { borderColor: colors.textMuted }, listDisplay === key && styles.radioCircleActive]} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setDisplayModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* List Order Modal */}
      <Modal visible={orderModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setOrderModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.modalBg || colors.card, borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>List Order</Text>
                
                {(Object.keys(orderLabels) as ListOrder[]).map((key) => (
                  <TouchableOpacity key={key} style={styles.radioRow} onPress={() => { setListOrder(key); setOrderModalVisible(false); }}>
                    <Text style={[styles.radioText, { color: colors.textPrimary }]}>{orderLabels[key]}</Text>
                    <View style={[styles.radioCircle, { borderColor: colors.textMuted }, listOrder === key && styles.radioCircleActive]} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setOrderModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconBtn: { padding: 4 },
  content: { padding: 20 },
  settingItem: { marginBottom: 24 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
  },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  settingSubtitle: { fontSize: 13 },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  radioText: {
    fontSize: 16,
  },
  radioCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  radioCircleActive: {
    borderColor: '#6366F1',
    borderWidth: 6,
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '700',
  }
});

export default SettingsScreen;
