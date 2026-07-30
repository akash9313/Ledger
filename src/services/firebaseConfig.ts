import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { createMMKV } from 'react-native-mmkv';

declare const process: any;

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

// Fallback config read securely from stored app config
export const getStoredFirebaseConfig = (): FirebaseConfig | null => {
  const saved = storage.getString(FIREBASE_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }

  // Read environment variables if available
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const apiKey = env.FIREBASE_API_KEY || '';
  const projectId = env.FIREBASE_PROJECT_ID || '';
  const appId = env.FIREBASE_APP_ID || '';
  const storageBucket = env.FIREBASE_STORAGE_BUCKET || '';

  if (apiKey && projectId) {
    return {
      apiKey,
      projectId,
      appId,
      storageBucket,
    };
  }

  return null;
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
