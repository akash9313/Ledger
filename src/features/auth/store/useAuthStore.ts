import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { 
  UserProfile, 
  signInWithGoogle as googleSignInService, 
  signOutUser as signOutService,
  subscribeToAuthState,
  checkAndRestoreSession
} from '../../../services/authService';
import { saveUserProfileToFirestore } from '../../../services/firestoreService';

const storage = createMMKV();

const zustandAuthStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.remove(name),
};

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  resetLoading: () => void;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const userProfile = await googleSignInService();
          await saveUserProfileToFirestore(userProfile);
          set({ user: userProfile, isLoading: false, error: null });
        } catch (err: any) {
          const msg = err.message || 'Google Sign-In failed';
          console.error('useAuthStore signIn error:', msg);
          set({ error: msg, isLoading: false });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await signOutService();
          set({ user: null, isLoading: false, error: null });
        } catch (err: any) {
          set({ error: err.message || 'Logout failed', isLoading: false });
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
      resetLoading: () => set({ isLoading: false, error: null }),

      initAuthListener: () => {
        // Silently restore session on startup if signed in
        checkAndRestoreSession().then((restoredUser) => {
          if (restoredUser) {
            set({ user: restoredUser, isInitialized: true, isLoading: false });
          }
        });

        const unsubscribe = subscribeToAuthState(async (userProfile) => {
          if (userProfile) {
            set({ user: userProfile, isInitialized: true, isLoading: false });
            await saveUserProfileToFirestore(userProfile);
          } else {
            // Do not wipe user if MMKV holds persistent session
            if (!get().user) {
              set({ isInitialized: true, isLoading: false });
            }
          }
        });
        return unsubscribe;
      },
    }),
    {
      name: 'ledger-auth-storage',
      storage: createJSONStorage(() => zustandAuthStorage),
      // CRITICAL: Only persist user object, NEVER persist transient state like isLoading
      partialize: (state) => ({ user: state.user }),
    }
  )
);
