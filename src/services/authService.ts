import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as onFirebaseAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { getFirebaseAuth, WEB_CLIENT_ID } from './firebaseConfig';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

let isGoogleConfigured = false;

export const configureGoogleSignin = () => {
  if (isGoogleConfigured) return;
  try {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });
    isGoogleConfigured = true;
  } catch (error) {
    console.error('GoogleSignin configuration error:', error);
  }
};

export const signInWithGoogle = async (): Promise<UserProfile> => {
  configureGoogleSignin();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Trigger Google Sign-In flow
    const response = await GoogleSignin.signIn();

    // Handle payload structure for google-signin library v16+
    const idToken = response.data?.idToken || (response as any).idToken;

    if (!idToken) {
      throw new Error('Google Sign-In failed: No ID Token retrieved.');
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check network/config.');
    }

    // Create Firebase Credential with Google ID token
    const credential = GoogleAuthProvider.credential(idToken);
    
    // Sign in to Firebase Auth
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    const errString = String(error.message || error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in is currently in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is not available or outdated');
    } else if (errString.includes('DEVELOPER_ERROR') || error.code === '10' || error.code === 10) {
      throw new Error('DEVELOPER_ERROR: Google Sign-In failed (Code 10). Please verify Google Play Services and SHA-1 setup.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred during Google Sign In');
    }
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    configureGoogleSignin();
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore if not signed into google native
    }

    const auth = getFirebaseAuth();
    if (auth) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

export const checkAndRestoreSession = async (): Promise<UserProfile | null> => {
  configureGoogleSignin();
  try {
    const auth = getFirebaseAuth();
    if (auth?.currentUser) {
      const u = auth.currentUser;
      return {
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
        isAnonymous: u.isAnonymous,
      };
    }

    const response = await GoogleSignin.signInSilently();
    const idToken = response.data?.idToken || (response as any).idToken;
    if (idToken && auth) {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const u = userCredential.user;
      return {
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
        isAnonymous: u.isAnonymous,
      };
    }
  } catch (e) {
    // Not signed in silently
  }
  return null;
};

export const subscribeToAuthState = (callback: (user: UserProfile | null) => void) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onFirebaseAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        isAnonymous: firebaseUser.isAnonymous,
      });
    } else {
      callback(null);
    }
  });
};
