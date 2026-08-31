import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
const FIREBASE_CONFIG_KEY = 'ledger_firebase_config';

export const WEB_CLIENT_ID = '805649213978-2r1r1q4e940brjqh2iien22tq0gebtmv.apps.googleusercontent.com';

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

// Retrieve stored or pre-configured Firebase project settings
export const getStoredFirebaseConfig = (): FirebaseConfig => {
  const saved = storage.getString(FIREBASE_CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (e) {
      // fallback
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  storage.set(FIREBASE_CONFIG_KEY, JSON.stringify(config));
};

export const clearFirebaseConfig = () => {
  storage.remove(FIREBASE_CONFIG_KEY);
};

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
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
    return appInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase App:', error);
    return null;
  }
};

export const getDb = (): Firestore | null => {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    if (!firestoreInstance) {
      firestoreInstance = getFirestore(app);
    }
    return firestoreInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase Firestore:', error);
    return null;
  }
};

export const getFirebaseAuth = (): Auth | null => {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    if (!authInstance) {
      authInstance = getAuth(app);
    }
    return authInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase Auth:', error);
    return null;
  }
};

export const isFirebaseConfigured = (): boolean => {
  const config = getStoredFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};
