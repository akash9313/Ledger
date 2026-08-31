import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { getDb } from './firebaseConfig';
import { UserProfile } from './authService';
import { Note } from '../features/notes/models/Note';

/**
 * Save user profile online in Firestore under `users/{userId}`
 */
export const saveUserProfileToFirestore = async (user: UserProfile): Promise<void> => {
  const db = getDb();
  if (!db || !user.uid) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      }, { merge: true });
    } else {
      await setDoc(userRef, {
        lastLoginAt: Date.now(),
        displayName: user.displayName || existing.data().displayName,
        photoURL: user.photoURL || existing.data().photoURL,
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
  }
};

/**
 * Save single note/chat to online Firestore
 */
export const saveNoteToFirestore = async (userId: string, note: Note): Promise<void> => {
  const db = getDb();
  if (!db || !userId) return;

  try {
    const noteRef = doc(db, 'users', userId, 'ledger_chats', note.id);
    await setDoc(noteRef, {
      ...note,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error(`Error saving note ${note.id} to Firestore:`, error);
  }
};

/**
 * Sync entire local notes/chats list to Firestore
 */
export const syncAllNotesToFirestore = async (userId: string, notes: Note[]): Promise<void> => {
  const db = getDb();
  if (!db || !userId || !notes.length) return;

  try {
    for (const note of notes) {
      const noteRef = doc(db, 'users', userId, 'ledger_chats', note.id);
      await setDoc(noteRef, {
        ...note,
        updatedAt: note.updatedAt || Date.now(),
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error syncing all notes to Firestore:', error);
  }
};

/**
 * Delete note/chat from online Firestore
 */
export const deleteNoteFromFirestore = async (userId: string, noteId: string, permanent = false): Promise<void> => {
  const db = getDb();
  if (!db || !userId) return;

  try {
    const noteRef = doc(db, 'users', userId, 'ledger_chats', noteId);
    if (permanent) {
      await deleteDoc(noteRef);
    } else {
      await setDoc(noteRef, {
        isDeleted: true,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      }, { merge: true });
    }
  } catch (error) {
    console.error(`Error deleting note ${noteId} from Firestore:`, error);
  }
};

/**
 * Real-time listener for online Firestore ledger chats/notes for a user
 */
export const subscribeToUserNotes = (
  userId: string, 
  onUpdate: (notes: Note[]) => void
) => {
  const db = getDb();
  if (!db || !userId) {
    onUpdate([]);
    return () => {};
  }

  const notesRef = collection(db, 'users', userId, 'ledger_chats');
  
  return onSnapshot(notesRef, (snapshot) => {
    const notes: Note[] = [];
    snapshot.forEach((docSnap) => {
      notes.push(docSnap.data() as Note);
    });
    onUpdate(notes);
  }, (error) => {
    console.error('Firestore subscription error:', error);
  });
};
