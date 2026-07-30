import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, TextInput, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useSettingsStore, ListDisplay, ListOrder } from '../store/useSettingsStore';
import { useNotesStore } from '../../notes/store/useNotesStore';
import { getStoredFirebaseConfig, saveFirebaseConfig, isFirebaseConfigured, clearFirebaseConfig } from '../../../services/firebaseConfig';
import { useTheme } from '../../../theme/useTheme';
import { ThemeMode } from '../../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation }: Props) => {
  const { listDisplay, listOrder, theme, setListDisplay, setListOrder, setTheme } = useSettingsStore();
  const { syncWithCloud, isSyncing, lastSyncedAt } = useNotesStore();
  const { colors } = useTheme();
  
  const [displayModalVisible, setDisplayModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [firebaseModalVisible, setFirebaseModalVisible] = useState(false);

  const existingConfig = getStoredFirebaseConfig();
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(existingConfig?.projectId || '');
  const [appId, setAppId] = useState(existingConfig?.appId || '');

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
    dark: 'Dark Mode 🌙',
    light: 'Light Mode ☀️'
  };

  const handleSaveFirebase = () => {
    if (!apiKey.trim() || !projectId.trim()) {
      Alert.alert('Invalid Config', 'API Key and Project ID are required.');
      return;
    }
    saveFirebaseConfig({
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      appId: appId.trim() || 'ledger-app',
    });
    setFirebaseModalVisible(false);
    Alert.alert('Saved ☁️', 'Firebase configuration updated successfully.');
  };

  const handleClearFirebase = () => {
    clearFirebaseConfig();
    setApiKey('');
    setProjectId('');
    setAppId('');
    setFirebaseModalVisible(false);
    Alert.alert('Cleared', 'Firebase configuration removed.');
  };

  const handleManualSync = async () => {
    const res = await syncWithCloud();
    if (res.success) {
      Alert.alert('Sync Complete ☁️', 'All notes synced with Firestore cloud!');
    } else {
      Alert.alert('Sync Failed ⚠️', res.error || 'Check your credentials or connection.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={[styles.iconText, { color: colors.textPrimary }]}>❮</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.settingItem} onPress={() => setThemeModalVisible(true)}>
          <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Theme</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{themeLabels[theme]}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('RecentlyDeleted')}>
          <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Recently deleted</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setDisplayModalVisible(true)}>
          <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>List display</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{displayLabels[listDisplay]}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setOrderModalVisible(true)}>
          <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>List order</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{orderLabels[listOrder]}</Text>
        </TouchableOpacity>

        {/* Cloud Synchronization Setting */}
        <TouchableOpacity style={styles.settingItem} onPress={() => setFirebaseModalVisible(true)}>
          <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Firebase Cloud Sync ☁️</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
            {isFirebaseConfigured() 
              ? (lastSyncedAt ? `Synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Configured (Tap to sync/edit)') 
              : 'Not Configured (Tap to setup)'}
          </Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Version</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>V3.1.5.55</Text>
        </View>
      </View>

      {/* Theme Modal */}
      <Modal visible={themeModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setThemeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
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
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>List display</Text>
                
                {(Object.keys(displayLabels) as ListDisplay[]).map((key) => (
                  <TouchableOpacity key={key} style={styles.radioRow} onPress={() => { setListDisplay(key); setDisplayModalVisible(false); }}>
                    <Text style={styles.radioText}>{displayLabels[key]}</Text>
                    <View style={[styles.radioCircle, listDisplay === key && styles.radioCircleActive]} />
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
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>List order</Text>
                
                {(Object.keys(orderLabels) as ListOrder[]).map((key) => (
                  <TouchableOpacity key={key} style={styles.radioRow} onPress={() => { setListOrder(key); setOrderModalVisible(false); }}>
                    <Text style={styles.radioText}>{orderLabels[key]}</Text>
                    <View style={[styles.radioCircle, listOrder === key && styles.radioCircleActive]} />
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

      {/* Firebase Setup Modal */}
      <Modal visible={firebaseModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setFirebaseModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Firebase Cloud Sync Setup</Text>
                <Text style={styles.inputLabel}>Firebase API Key *</Text>
                <TextInput 
                  style={styles.input} 
                  value={apiKey} 
                  onChangeText={setApiKey} 
                  placeholder="AIzaSy..." 
                  placeholderTextColor="#6B7280"
                />

                <Text style={styles.inputLabel}>Project ID *</Text>
                <TextInput 
                  style={styles.input} 
                  value={projectId} 
                  onChangeText={setProjectId} 
                  placeholder="my-ledger-app" 
                  placeholderTextColor="#6B7280"
                />

                <Text style={styles.inputLabel}>App ID (Optional)</Text>
                <TextInput 
                  style={styles.input} 
                  value={appId} 
                  onChangeText={setAppId} 
                  placeholder="1:12345:web:abcdef" 
                  placeholderTextColor="#6B7280"
                />

                {isFirebaseConfigured() && (
                  <TouchableOpacity style={styles.syncBtn} onPress={handleManualSync} disabled={isSyncing}>
                    <Text style={styles.syncBtnText}>{isSyncing ? 'Syncing...' : 'Sync Now 🔄'}</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFirebase}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                  {isFirebaseConfigured() && (
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClearFirebase}>
                      <Text style={styles.clearBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setFirebaseModalVisible(false)}>
                  <Text style={styles.cancelText}>Close</Text>
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
  iconBtn: { padding: 8 },
  iconText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  content: { padding: 16 },
  settingItem: { marginBottom: 32 },
  settingTitle: { color: '#E5E7EB', fontSize: 18, marginBottom: 4 },
  settingSubtitle: { color: '#6B7280', fontSize: 14 },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2D2D2D',
    width: '85%',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  radioText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B7280',
  },
  radioCircleActive: {
    borderColor: '#FBBF24',
    borderWidth: 4,
  },
  syncBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FBBF24',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SettingsScreen;

