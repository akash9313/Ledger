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
    dark: 'Dark Mode 🌙',
    light: 'Light Mode ☀️'
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
        {/* Google Account & Firestore Cloud Sync Item */}
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Auth')}>
          <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>
            Google Account & Cloud Sync ☁️
          </Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
            {user 
              ? `Connected: ${user.email} (Firestore Online)` 
              : 'Guest Mode - Tap to Sign In with Google'}
          </Text>
        </TouchableOpacity>

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

        <View style={styles.settingItem}>
          <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Version</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>V3.2.0 (Firestore Connected)</Text>
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
              <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>List display</Text>
                
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
              <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>List order</Text>
                
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
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconBtn: { padding: 8 },
  iconText: { fontSize: 24, fontWeight: 'bold' },
  content: { padding: 16 },
  settingItem: { marginBottom: 32 },
  settingTitle: { fontSize: 18, marginBottom: 4 },
  settingSubtitle: { fontSize: 14 },
  
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
    paddingVertical: 16,
  },
  radioText: {
    fontSize: 16,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SettingsScreen;
