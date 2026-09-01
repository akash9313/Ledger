import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { ContactPicker } = NativeModules;

export interface ContactItem {
  name: string;
  phoneNumber: string;
}

export const requestContactsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Contacts Permission Required',
        message: 'Ledger needs access to your contacts so you can quickly pick and auto-fill mobile numbers for accounts.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Contacts permission error:', err);
    return false;
  }
};

export const pickContactFromPhonebook = async (): Promise<ContactItem | null> => {
  if (!ContactPicker || typeof ContactPicker.pickContact !== 'function') {
    console.warn('Native ContactPicker module not available');
    return null;
  }

  try {
    const result = await ContactPicker.pickContact();
    if (result && (result.name || result.phoneNumber)) {
      return {
        name: result.name || '',
        phoneNumber: result.phoneNumber || '',
      };
    }
    return null;
  } catch (err) {
    console.warn('Error picking contact:', err);
    return null;
  }
};

export const getDeviceContacts = async (): Promise<ContactItem[]> => {
  if (!ContactPicker || typeof ContactPicker.getContacts !== 'function') {
    return [];
  }

  const hasPermission = await requestContactsPermission();
  if (!hasPermission) {
    return [];
  }

  try {
    const contacts: ContactItem[] = await ContactPicker.getContacts();
    return contacts || [];
  } catch (err) {
    console.warn('Error fetching contacts:', err);
    return [];
  }
};
