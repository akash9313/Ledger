import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StatusBar,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useNotesStore } from '../store/useNotesStore';
import { useTheme } from '../../../theme/useTheme';
import { calculateTotal } from '../utils/calculator';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteDetail'>;

const NoteDetailScreen = ({ navigation, route }: Props) => {
  const { noteId } = route.params || {};
  const { notes, addNote, updateNote, deleteNote } = useNotesStore();
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const existingNote = notes.find((n) => n.id === noteId);

  const [title, setTitle] = useState(existingNote?.title || '');
  const [phoneNumber, setPhoneNumber] = useState(existingNote?.phoneNumber || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const total = calculateTotal(content);
  const isPositive = total > 0;
  const isNegative = total < 0;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for this account.');
      return;
    }

    if (existingNote) {
      await updateNote(existingNote.id, {
        title: title.trim(),
        phoneNumber: phoneNumber.trim(),
        content,
      });
    } else {
      await addNote({
        title: title.trim(),
        phoneNumber: phoneNumber.trim(),
        content,
      });
    }

    navigation.goBack();
  };

  const handleCall = () => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleDelete = () => {
    if (!existingNote) return;
    Alert.alert(
      'Delete Account',
      `Move "${existingNote.title}" to Recently Deleted?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await deleteNote(existingNote.id);
            navigation.goBack();
          } 
        }
      ]
    );
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textPrimary }]}>❮ Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {existingNote ? (title || 'Account Details') : 'New Account'}
        </Text>

        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.content} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Existing Note View Mode Header */}
          {existingNote && !isEditingInfo ? (
            <View style={styles.accountHeaderCard}>
              <View style={styles.accountNameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{title || 'Customer'}</Text>
                  {phoneNumber ? (
                    <Text style={styles.accountPhone}>📱 {phoneNumber}</Text>
                  ) : null}
                </View>

                <View style={styles.accountActions}>
                  {phoneNumber ? (
                    <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                      <Text style={styles.callBtnText}>📞 Call</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditingInfo(true)}>
                    <Text style={styles.editBtnText}>✏️ Edit Info</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Net Balance Summary in Rupees */}
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Net Balance Summary</Text>
                <Text style={[
                  styles.balanceValue,
                  isPositive && { color: '#10B981' },
                  isNegative && { color: '#EF4444' },
                  !isPositive && !isNegative && { color: '#9CA3AF' }
                ]}>
                  {total === 0 ? 'Cleared (₹0)' : `${total > 0 ? '+' : ''}₹${Math.abs(total).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
                </Text>
              </View>
            </View>
          ) : (
            /* New Account Creation or Editing Info Mode */
            <View>
              {/* Net Balance Summary */}
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Net Balance Summary</Text>
                <Text style={[
                  styles.balanceValue,
                  isPositive && { color: '#10B981' },
                  isNegative && { color: '#EF4444' },
                  !isPositive && !isNegative && { color: '#9CA3AF' }
                ]}>
                  {total === 0 ? 'Cleared (₹0)' : `${total > 0 ? '+' : ''}₹${Math.abs(total).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
                </Text>
              </View>

              {/* Account Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account / Customer Name *</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.surface || '#161622', borderColor: colors.border }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Rahul Sharma / Grocery Account"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Mobile Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.surface || '#161622', borderColor: colors.border }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              {existingNote && (
                <TouchableOpacity style={styles.doneEditBtn} onPress={() => setIsEditingInfo(false)}>
                  <Text style={styles.doneEditText}>Done Editing Info</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Ledger Entries Editor */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transactions Ledger (Line by Line)</Text>
            <TextInput
              style={[
                styles.textInput, 
                styles.contentInput,
                { color: colors.textPrimary, backgroundColor: colors.surface || '#161622', borderColor: colors.border }
              ]}
              value={content}
              onChangeText={(text) => {
                setContent(text);
                scrollToBottom();
              }}
              onFocus={scrollToBottom}
              placeholder="Write money entries line by line, e.g.:&#10;500 advance&#10;-80 paid&#10;cleared"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>

          {existingNote && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑 Delete Account</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  saveBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  content: { padding: 20, paddingBottom: 380 },
  accountHeaderCard: {
    backgroundColor: '#161622',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  accountNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  accountName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  accountPhone: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  accountActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  callBtnText: { color: '#10B981', fontWeight: '700', fontSize: 12 },
  editBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: 12 },
  balanceCard: {
    backgroundColor: '#161622',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceLabel: { fontSize: 13, color: '#9CA3AF' },
  balanceValue: { fontSize: 32, fontWeight: '800', marginTop: 6 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: '#9CA3AF', marginBottom: 8, fontWeight: '600' },
  textInput: {
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  contentInput: {
    minHeight: 250,
    fontSize: 16,
    lineHeight: 24,
  },
  doneEditBtn: {
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 14,
  },
  doneEditText: { color: '#6366F1', fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});

export default NoteDetailScreen;
