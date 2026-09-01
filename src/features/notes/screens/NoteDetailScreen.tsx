import React, { useState, useRef, useEffect } from 'react';
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
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/RootNavigator';
import { useNotesStore } from '../store/useNotesStore';
import { useTheme } from '../../../theme/useTheme';
import { calculateTotal } from '../utils/calculator';
import { AppIcon } from '../../../core/components/AppIcon';
import { pickContactFromPhonebook, getDeviceContacts, ContactItem } from '../../../services/contactService';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteDetail'>;

const NoteDetailScreen = ({ navigation, route }: Props) => {
  const { noteId, fromWidget } = (route.params || {}) as { noteId?: string; fromWidget?: boolean | string };
  const isFromWidget = fromWidget === true || fromWidget === 'true' || !navigation.canGoBack();

  const { notes, addNote, updateNote, deleteNote } = useNotesStore();
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const existingNote = notes.find((n) => n.id === noteId);

  const [title, setTitle] = useState(existingNote?.title || '');
  const [phoneNumber, setPhoneNumber] = useState(existingNote?.phoneNumber || '');
  const [upiId, setUpiId] = useState(existingNote?.upiId || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [allDeviceContacts, setAllDeviceContacts] = useState<ContactItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const handleOpenContactPickerModal = async () => {
    setIsLoadingContacts(true);
    setContactModalVisible(true);
    setContactSearchQuery('');
    const contacts = await getDeviceContacts();
    setAllDeviceContacts(contacts);
    setIsLoadingContacts(false);
  };

  const handleNativeSystemPick = async () => {
    setContactModalVisible(false);
    const contact = await pickContactFromPhonebook();
    if (contact) {
      if (contact.phoneNumber) setPhoneNumber(contact.phoneNumber);
      if (contact.name && (!title || title.trim() === '')) setTitle(contact.name);
    }
  };

  const filteredContactsList = React.useMemo(() => {
    if (!contactSearchQuery.trim()) return allDeviceContacts;
    const query = contactSearchQuery.toLowerCase();
    return allDeviceContacts.filter(
      (c) => c.name?.toLowerCase().includes(query) || c.phoneNumber?.toLowerCase().includes(query)
    );
  }, [allDeviceContacts, contactSearchQuery]);

  const handleSelectContactFromModal = (contact: ContactItem) => {
    if (contact.phoneNumber) setPhoneNumber(contact.phoneNumber);
    if (contact.name) setTitle(contact.name);
    setContactModalVisible(false);
    setContactSearchQuery('');
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardPadding(e.endCoordinates.height + 40)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardPadding(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const total = calculateTotal(content);
  const isPositive = total > 0;
  const isNegative = total < 0;
  const dueAmountStr = Math.abs(total).toLocaleString('en-IN');

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for this account.');
      return;
    }

    if (existingNote) {
      await updateNote(existingNote.id, {
        title: title.trim(),
        phoneNumber: phoneNumber.trim(),
        upiId: upiId.trim(),
        content,
      });
    } else {
      await addNote({
        title: title.trim(),
        phoneNumber: phoneNumber.trim(),
        upiId: upiId.trim(),
        content,
      });
    }

    if (isFromWidget) {
      BackHandler.exitApp();
    } else {
      navigation.goBack();
    }
  };

  const handleBack = () => {
    if (isFromWidget) {
      BackHandler.exitApp();
    } else {
      navigation.goBack();
    }
  };

  const handleCall = () => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handlePayUPI = async () => {
    const payAmount = Math.abs(total).toFixed(2);
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const payeeVpa = upiId.trim() || (cleanPhone ? `${cleanPhone}@upi` : '');

    if (!payeeVpa) {
      Alert.alert(
        'UPI ID Required',
        'Please enter a UPI ID (e.g., 9876543210@paytm or name@upi) for this account to make payments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enter UPI ID', onPress: () => setIsEditingInfo(true) }
        ]
      );
      return;
    }

    const encodedName = encodeURIComponent(title || 'Ledger Payee');
    const encodedNote = encodeURIComponent(`Ledger payment to ${title}`);
    
    // Official Android UPI Intent Deep Link
    const upiUrl = `upi://pay?pa=${payeeVpa}&pn=${encodedName}&am=${payAmount}&cu=INR&tn=${encodedNote}`;

    try {
      await Linking.openURL(upiUrl);
    } catch (error) {
      Alert.alert(
        'UPI Payment',
        `No installed UPI app (Google Pay, PhonePe, Paytm, BHIM) responded. Payee VPA: ${payeeVpa}`
      );
    }
  };

  const formatWhatsAppNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.slice(1);
    }
    return cleaned;
  };

  const handleSendWhatsApp = () => {
    setReminderModalVisible(false);
    const message = `Hi ${title}, your balance on Ledger is ₹${dueAmountStr}. Please settle the payment at your convenience. Thank you!`;
    const waPhone = formatWhatsAppNumber(phoneNumber);
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(waUrl).catch(() => {
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      Linking.openURL(smsUrl);
    });
  };

  const handleSendSMS = () => {
    setReminderModalVisible(false);
    const message = `Hi ${title}, your balance on Ledger is ₹${dueAmountStr}. Please settle the payment at your convenience. Thank you!`;
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    Linking.openURL(smsUrl);
  };

  const handleRequestReminder = () => {
    if (phoneNumber) {
      setReminderModalVisible(true);
    } else {
      const message = `Hi ${title}, your balance on Ledger is ₹${dueAmountStr}. Please settle the payment at your convenience. Thank you!`;
      Alert.alert('Payment Reminder', message);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <AppIcon name="arrow-back" size={20} color={colors.textPrimary} />
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + keyboardPadding }]} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Existing Note View Mode Header */}
          {existingNote && !isEditingInfo ? (
            <View style={[styles.accountHeaderCard, { backgroundColor: colors.card, borderColor: colors.cardBorder || colors.border }]}>
              <View style={styles.accountNameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountName, { color: colors.textPrimary }]}>{title || 'Customer'}</Text>
                  {phoneNumber ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <AppIcon name="call" size={13} color={colors.textMuted} />
                      <Text style={[styles.accountPhone, { color: colors.textMuted, marginLeft: 4 }]}>{phoneNumber}</Text>
                    </View>
                  ) : null}
                  {upiId ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <AppIcon name="card" size={13} color="#6366F1" />
                      <Text style={[styles.accountUpi, { marginLeft: 4 }]}>{upiId}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.accountActions}>
                  {phoneNumber ? (
                    <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                      <AppIcon name="call" size={13} color="#10B981" />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={[styles.editBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]} onPress={() => setIsEditingInfo(true)}>
                    <AppIcon name="pencil" size={12} color={colors.textMuted} />
                    <Text style={[styles.editBtnText, { color: colors.textMuted, marginLeft: 4 }]}>Edit Info</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Net Balance Summary Card */}
              <View style={[styles.balanceCard, { backgroundColor: isDark ? '#1A1E29' : '#F1F5F9', borderColor: colors.border }]}>
                <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Net Balance Summary</Text>
                <Text style={[
                  styles.balanceValue,
                  isPositive && { color: colors.positive || '#10B981' },
                  isNegative && { color: colors.negative || '#EF4444' },
                  !isPositive && !isNegative && { color: colors.textMuted }
                ]}>
                  {total === 0 ? 'Cleared (₹0)' : `${total > 0 ? '+' : ''}₹${Math.abs(total).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
                </Text>

                {/* UPI Pay Button when Money is Negative (Pay Due) */}
                {isNegative && (
                  <TouchableOpacity style={styles.upiPayBtn} onPress={handlePayUPI} activeOpacity={0.85}>
                    <AppIcon name="card" size={18} color="#FFF" />
                    <Text style={styles.upiPayBtnText}>Pay ₹{Math.abs(total).toLocaleString('en-IN')} via UPI</Text>
                  </TouchableOpacity>
                )}

                {/* Request Reminder Button when Money is Positive (Receive Due) */}
                {isPositive && (
                  <TouchableOpacity style={styles.upiRemindBtn} onPress={handleRequestReminder} activeOpacity={0.85}>
                    <AppIcon name="send" size={16} color="#6366F1" />
                    <Text style={styles.upiRemindBtnText}>Remind to Pay ₹{Math.abs(total).toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* New Account Creation or Editing Info Mode */
            <View>
              {/* Net Balance Summary */}
              <View style={[styles.balanceCard, { backgroundColor: isDark ? '#1A1E29' : '#F1F5F9', borderColor: colors.border }]}>
                <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Net Balance Summary</Text>
                <Text style={[
                  styles.balanceValue,
                  isPositive && { color: colors.positive || '#10B981' },
                  isNegative && { color: colors.negative || '#EF4444' },
                  !isPositive && !isNegative && { color: colors.textMuted }
                ]}>
                  {total === 0 ? 'Cleared (₹0)' : `${total > 0 ? '+' : ''}₹${Math.abs(total).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
                </Text>

                {isNegative && (
                  <TouchableOpacity style={styles.upiPayBtn} onPress={handlePayUPI} activeOpacity={0.85}>
                    <AppIcon name="card" size={18} color="#FFF" />
                    <Text style={styles.upiPayBtnText}>Pay ₹{Math.abs(total).toLocaleString('en-IN')} via UPI</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Account Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Account / Customer Name *</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.inputBg || colors.surface, borderColor: colors.border }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Rahul Sharma / Grocery Account"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Mobile Number */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.textMuted, marginBottom: 0 }]}>Mobile Number (Optional)</Text>
                  <TouchableOpacity
                    style={[styles.importContactBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}
                    onPress={handleOpenContactPickerModal}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="call" size={12} color="#6366F1" />
                    <Text style={styles.importContactBadgeText}>Import from Contacts</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.phoneInputWrapper}>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.phoneTextInput,
                      { color: colors.textPrimary, backgroundColor: colors.inputBg || colors.surface, borderColor: colors.border }
                    ]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="e.g. +91 98765 43210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity
                    style={styles.phoneContactIconBtn}
                    onPress={handleOpenContactPickerModal}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="user" size={18} color={colors.accent || '#6366F1'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* UPI ID / VPA */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>UPI ID / VPA (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.inputBg || colors.surface, borderColor: colors.border }]}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="e.g. 9876543210@paytm or rahul@ybl"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
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
            <Text style={[styles.label, { color: colors.textMuted }]}>Transactions Ledger (Line by Line)</Text>
            <TextInput
              style={[
                styles.textInput, 
                styles.contentInput,
                { color: colors.textPrimary, backgroundColor: colors.inputBg || colors.surface, borderColor: colors.border }
              ]}
              value={content}
              onChangeText={setContent}
              placeholder="Write money entries line by line, e.g.:&#10;500 advance&#10;-80 paid&#10;cleared"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>

          {existingNote && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <AppIcon name="trash" size={16} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Styled Responsive Payment Reminder Modal (Supports Light & Dark Modes) */}
      <Modal visible={reminderModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setReminderModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: colors.modalBg || colors.card, borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Send Payment Reminder</Text>
                <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                  Remind <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{title}</Text> for <Text style={{ color: colors.positive || '#10B981', fontWeight: '800' }}>₹{dueAmountStr}</Text>
                </Text>

                <TouchableOpacity style={styles.waOptionBtn} onPress={handleSendWhatsApp} activeOpacity={0.85}>
                  <AppIcon name="whatsapp" size={20} color="#FFF" />
                  <Text style={styles.waOptionText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.smsOptionBtn, { backgroundColor: colors.accent || '#6366F1' }]} onPress={handleSendSMS} activeOpacity={0.85}>
                  <AppIcon name="sms" size={18} color="#FFF" />
                  <Text style={styles.smsOptionText}>SMS Message</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setReminderModalVisible(false)}>
                  <Text style={[styles.cancelModalText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Full Phonebook Contact Picker & Search Modal */}
      <Modal visible={contactModalVisible} animationType="slide" transparent>
        <SafeAreaView style={[styles.contactModalContainer, { backgroundColor: colors.background }]}>
          <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
          
          {/* Modal Header */}
          <View style={[styles.contactModalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactModalTitle, { color: colors.textPrimary }]}>Select Contact</Text>
              <Text style={[styles.contactModalSub, { color: colors.textMuted }]}>
                Search contact name to import mobile number
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.closeContactModalBtn} 
              onPress={() => setContactModalVisible(false)}
            >
              <AppIcon name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Input Bar */}
          <View style={styles.contactSearchWrapper}>
            <View style={[styles.contactSearchBox, { backgroundColor: colors.card || colors.surface, borderColor: colors.border }]}>
              <AppIcon name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.contactSearchInput, { color: colors.textPrimary }]}
                placeholder="Search contact by name or phone..."
                placeholderTextColor={colors.textMuted}
                value={contactSearchQuery}
                onChangeText={setContactSearchQuery}
                autoFocus
              />
              {contactSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setContactSearchQuery('')}>
                  <AppIcon name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* System Contact Picker Shortcut */}
          <TouchableOpacity 
            style={[styles.systemPickerBtn, { backgroundColor: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.25)' }]} 
            onPress={handleNativeSystemPick}
          >
            <AppIcon name="person" size={16} color="#6366F1" />
            <Text style={styles.systemPickerBtnText}>Open System Phonebook</Text>
          </TouchableOpacity>

          {/* Contacts List */}
          {isLoadingContacts ? (
            <View style={styles.emptyContactsContainer}>
              <Text style={[styles.emptyContactsText, { color: colors.textMuted }]}>
                Accessing phone contacts...
              </Text>
            </View>
          ) : filteredContactsList.length === 0 ? (
            <View style={styles.emptyContactsContainer}>
              <AppIcon name="person" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyContactsTitle, { color: colors.textPrimary, marginTop: 12 }]}>
                No contacts found
              </Text>
              <Text style={[styles.emptyContactsText, { color: colors.textMuted, marginTop: 4 }]}>
                {contactSearchQuery ? `No contact matching "${contactSearchQuery}"` : 'No phone contacts available or permission denied.'}
              </Text>
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.contactsListContent} 
              keyboardShouldPersistTaps="handled"
            >
              {filteredContactsList.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.contactRowItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectContactFromModal(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.contactAvatarCircle, { backgroundColor: '#6366F1' }]}>
                    <Text style={styles.contactAvatarText}>
                      {(item.name[0] || 'C').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.contactItemName, { color: colors.textPrimary }]}>
                      {item.name || 'Unnamed Contact'}
                    </Text>
                    <Text style={[styles.contactItemPhone, { color: colors.textMuted }]}>
                      {item.phoneNumber}
                    </Text>
                  </View>
                  <AppIcon name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { paddingVertical: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  saveBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  content: { padding: 20, paddingBottom: 40 },
  accountHeaderCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
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
  },
  accountPhone: {
    fontSize: 13,
  },
  accountUpi: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  accountActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  callBtnText: { color: '#10B981', fontWeight: '700', fontSize: 12, marginLeft: 4 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBtnText: { fontWeight: '600', fontSize: 12 },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  balanceLabel: { fontSize: 13 },
  balanceValue: { fontSize: 32, fontWeight: '800', marginTop: 6 },
  upiPayBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  upiPayBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
    marginLeft: 8,
  },
  upiRemindBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  upiRemindBtnText: {
    color: '#6366F1',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 8,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: '600' },
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  importContactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  importContactBadgeText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '700',
  },
  phoneInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  phoneTextInput: {
    paddingRight: 48,
  },
  phoneContactIconBtn: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  suggestionBox: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 6,
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionPhone: {
    fontSize: 12,
    marginTop: 1,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },

  // Styled Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '90%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  waOptionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  waOptionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  smsOptionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  smsOptionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelModalBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Contact Picker Modal Styles
  contactModalContainer: {
    flex: 1,
  },
  contactModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  contactModalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  contactModalSub: {
    fontSize: 13,
    marginTop: 2,
  },
  closeContactModalBtn: {
    padding: 6,
  },
  contactSearchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  contactSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  systemPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  systemPickerBtnText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContactsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContactsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyContactsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  contactsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  contactRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  contactAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
  contactItemName: {
    fontSize: 16,
    fontWeight: '700',
  },
  contactItemPhone: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default NoteDetailScreen;
