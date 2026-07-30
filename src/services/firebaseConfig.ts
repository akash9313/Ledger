import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
const FIREBASE_CONFIG_KEY = 'ledger_firebase_config';

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyDLJ5-4vvx4P0LlcD7AFGDPz3WHMfun6vk',
  projectId: 'ledger-e0658',
  appId: '1:805649213978:android:90c0271cc127e025f27fa3',
  storageBucket: 'ledger-e0658.firebasestorage.app',
};

// Default or user-customized environment config
export const getStoredFirebaseConfig = (): FirebaseConfig | null => {
  const saved = storage.getString(FIREBASE_CONFIG_KEY);
  if (!saved) return DEFAULT_FIREBASE_CONFIG;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return DEFAULT_FIREBASE_CONFIG;
  }
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  storage.set(FIREBASE_CONFIG_KEY, JSON.stringify(config));
};

export const clearFirebaseConfig = () => {
  storage.remove(FIREBASE_CONFIG_KEY);
};

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export const getDb = (): Firestore | null => {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    firestoreInstance = getFirestore(appInstance);
    return firestoreInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase Firestore:', error);
    return null;
  }
};

export const isFirebaseConfigured = (): boolean => {
  const config = getStoredFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};
