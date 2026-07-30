import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './firebaseConfig';
import { Note } from '../features/notes/models/Note';

const COLLECTION_NAME = 'ledger_notes';

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
    const notesRef = collection(db, COLLECTION_NAME);
    
    // 1. Fetch remote notes
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

    // 2. Merge active local notes into remote (Last-Write-Wins based on updatedAt)
    for (const localNote of localNotes) {
      if (deletedIdsSet.has(localNote.id)) continue;
      
      const remoteNote = remoteNotesMap.get(localNote.id);
      if (!remoteNote) {
        // Upload local note to cloud
        mergedNotesMap.set(localNote.id, localNote);
        const docRef = doc(db, COLLECTION_NAME, localNote.id);
        batch.set(docRef, localNote);
        batchOperations++;
      } else {
        // Conflict resolution: compare updatedAt
        if ((localNote.updatedAt || 0) >= (remoteNote.updatedAt || 0)) {
          mergedNotesMap.set(localNote.id, localNote);
          if (localNote.updatedAt !== remoteNote.updatedAt) {
            const docRef = doc(db, COLLECTION_NAME, localNote.id);
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
        // Delete remote document because note was deleted locally
        const docRef = doc(db, COLLECTION_NAME, id);
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
    console.error('Error during Firestore cloud sync:', err);
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
    const docRef = doc(db, COLLECTION_NAME, noteId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Failed to delete note ${noteId} from Firestore:`, error);
    return false;
  }
};
