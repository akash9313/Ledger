import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { createMMKV } from 'react-native-mmkv';
import { getDb, isFirebaseConfigured } from './firebaseConfig';
import { Note } from '../features/notes/models/Note';

const storage = createMMKV();
const DEVICE_ID_KEY = 'ledger_device_id';

// Generate or retrieve unique private device identifier for each phone installation
export const getDeviceId = (): string => {
  let deviceId = storage.getString(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    storage.set(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// Returns reference to device-specific private notes sub-collection
const getDeviceNotesCollection = (db: any) => {
  const deviceId = getDeviceId();
  return collection(db, 'user_devices', deviceId, 'notes');
};

const getDeviceNoteDoc = (db: any, noteId: string) => {
  const deviceId = getDeviceId();
  return doc(db, 'user_devices', deviceId, 'notes', noteId);
};

export const syncNotesToCloud = async (
  localNotes: Note[],
  deletedNotes: Note[] = []
): Promise<{ success: boolean; notes?: Note[]; error?: string }> => {
  if (!isFirebaseConfigured()) {
    return { 
      success: false, 
      error: 'Firebase is not configured.' 
    };
  }

  const db = getDb();
  if (!db) {
    return { success: false, error: 'Could not connect to Firestore database.' };
  }

  try {
    const notesRef = getDeviceNotesCollection(db);
    
    // 1. Fetch remote notes for THIS device only
    const querySnapshot = await getDocs(notesRef);
    const remoteNotesMap = new Map<string, Note>();
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Note;
      if (data && data.id) {
        remoteNotesMap.set(data.id, data);
      }
    });

    const localNotesMap = new Map<string, Note>(localNotes.map(n => [n.id, n]));
    const deletedIdsSet = new Set<string>(deletedNotes.map(n => n.id));
    const mergedNotesMap = new Map<string, Note>();
    const batch = writeBatch(db);
    let batchOperations = 0;

    // 2. Merge active local notes into device remote storage
    for (const localNote of localNotes) {
      if (deletedIdsSet.has(localNote.id)) continue;
      
      const remoteNote = remoteNotesMap.get(localNote.id);
      if (!remoteNote) {
        // Upload local note to cloud for this device
        mergedNotesMap.set(localNote.id, localNote);
        const docRef = getDeviceNoteDoc(db, localNote.id);
        batch.set(docRef, localNote);
        batchOperations++;
      } else {
        // Conflict resolution: compare updatedAt
        if ((localNote.updatedAt || 0) >= (remoteNote.updatedAt || 0)) {
          mergedNotesMap.set(localNote.id, localNote);
          if (localNote.updatedAt !== remoteNote.updatedAt) {
            const docRef = getDeviceNoteDoc(db, localNote.id);
            batch.set(docRef, localNote);
            batchOperations++;
          }
        } else {
          // Remote note is newer
          mergedNotesMap.set(remoteNote.id, remoteNote);
        }
      }
    }

    // 3. Process remote notes (Include if new; Delete from cloud if locally deleted)
    remoteNotesMap.forEach((remoteNote, id) => {
      if (deletedIdsSet.has(id)) {
        // Delete remote document because note was deleted locally on this device
        const docRef = getDeviceNoteDoc(db, id);
        batch.delete(docRef);
        batchOperations++;
      } else if (!localNotesMap.has(id)) {
        mergedNotesMap.set(id, remoteNote);
      }
    });

    // Commit batch if changes exist
    if (batchOperations > 0) {
      await batch.commit();
    }

    const mergedNotesArray = Array.from(mergedNotesMap.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    return {
      success: true,
      notes: mergedNotesArray,
    };
  } catch (err: any) {
    console.error('Error during Firestore device cloud sync:', err);
    return {
      success: false,
      error: err?.message || 'Failed to sync with cloud storage.',
    };
  }
};

export const deleteNoteFromCloud = async (noteId: string): Promise<boolean> => {
  if (!isFirebaseConfigured()) return false;
  const db = getDb();
  if (!db) return false;

  try {
    const docRef = getDeviceNoteDoc(db, noteId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Failed to delete note ${noteId} from Firestore:`, error);
    return false;
  }
};
