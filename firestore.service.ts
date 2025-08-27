import firestore from '@react-native-firebase/firestore';

// Initialize Firestore
const db = firestore();

// Types for common data structures
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceNote {
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
  transcript?: string;
  duration: number;
  createdAt: Date;
}

// Firestore service class
class FirestoreService {
  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const userRef = await db.collection('users').add({
      ...userData,
      createdAt: now,
      updatedAt: now,
    });
    return userRef.id;
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists()) {
        return { id: doc.id, ...doc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      await db.collection('users').doc(userId).update({
        ...updates,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  // Reminder operations
  async createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const reminderRef = await db.collection('reminders').add({
      ...reminderData,
      createdAt: now,
      updatedAt: now,
    });
    return reminderRef.id;
  }

  async getReminders(userId: string): Promise<Reminder[]> {
    try {
      const snapshot = await db
        .collection('reminders')
        .where('userId', '==', userId)
        .orderBy('dueDate', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Reminder);
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<boolean> {
    try {
      await db.collection('reminders').doc(reminderId).update({
        ...updates,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating reminder:', error);
      return false;
    }
  }

  async deleteReminder(reminderId: string): Promise<boolean> {
    try {
      await db.collection('reminders').doc(reminderId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  }

  // Voice note operations
  async createVoiceNote(voiceNoteData: Omit<VoiceNote, 'id' | 'createdAt'>): Promise<string> {
    const now = new Date();
    const voiceNoteRef = await db.collection('voiceNotes').add({
      ...voiceNoteData,
      createdAt: now,
    });
    return voiceNoteRef.id;
  }

  async getVoiceNotes(userId: string): Promise<VoiceNote[]> {
    try {
      const snapshot = await db
        .collection('voiceNotes')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VoiceNote);
    } catch (error) {
      console.error('Error getting voice notes:', error);
      return [];
    }
  }

  async deleteVoiceNote(voiceNoteId: string): Promise<boolean> {
    try {
      await db.collection('voiceNotes').doc(voiceNoteId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting voice note:', error);
      return false;
    }
  }

  // Real-time listeners
  subscribeToReminders(userId: string, callback: (reminders: Reminder[]) => void) {
    return db
      .collection('reminders')
      .where('userId', '==', userId)
      .orderBy('dueDate', 'asc')
      .onSnapshot(snapshot => {
        const reminders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Reminder);
        callback(reminders);
      });
  }

  subscribeToVoiceNotes(userId: string, callback: (voiceNotes: VoiceNote[]) => void) {
    return db
      .collection('voiceNotes')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const voiceNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VoiceNote);
        callback(voiceNotes);
      });
  }

  // Batch operations
  async batchCreate(operations: Array<{ collection: string; data: any }>): Promise<boolean> {
    try {
      const batch = db.batch();
      
      operations.forEach(({ collection, data }) => {
        const docRef = db.collection(collection).doc();
        batch.set(docRef, data);
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error in batch operation:', error);
      return false;
    }
  }
}

export default new FirestoreService();
