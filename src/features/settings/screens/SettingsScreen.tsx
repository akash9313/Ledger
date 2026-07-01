import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useSettingsStore, ListDisplay, ListOrder } from '../store/useSettingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation }: Props) => {
  const { listDisplay, listOrder, setListDisplay, setListOrder } = useSettingsStore();
  
  const [displayModalVisible, setDisplayModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const displayLabels: Record<ListDisplay, string> = {
    none: 'None',
    skins: 'Skins',
    folder_colors: 'Folder colors'
  };

  const orderLabels: Record<ListOrder, string> = {
    creation_time: 'By creation time',
    modified: 'By modified'
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={styles.iconText}>❮</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('RecentlyDeleted')}>
          <Text style={styles.settingTitle}>Recently deleted</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setDisplayModalVisible(true)}>
          <Text style={styles.settingTitle}>List display</Text>
          <Text style={styles.settingSubtitle}>{displayLabels[listDisplay]}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setOrderModalVisible(true)}>
          <Text style={styles.settingTitle}>List order</Text>
          <Text style={styles.settingSubtitle}>{orderLabels[listOrder]}</Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Version</Text>
          <Text style={styles.settingSubtitle}>V3.1.5.55</Text>
        </View>
      </View>

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
    width: '80%',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 24,
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
  cancelBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FBBF24',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SettingsScreen;
