import firestore from '@react-native-firebase/firestore';

// Initialize Firestore
const db = firestore();

// Types for common data structures
export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  preferences?: UserPreferences;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  voiceEnabled: boolean;
  defaultLocation?: string;
  language: string;
  timezone: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress?: string;
  loginAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
}

export interface ChatHistory {
  id: string;
  userId: string;
  messages: ChatMessage[];
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'weather' | 'news';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  data?: any;
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
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>): Promise<string> {
    try {
      const now = new Date();
      const defaultPreferences: UserPreferences = {
        theme: 'auto',
        notifications: true,
        voiceEnabled: true,
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      
      // Clean userData to remove undefined values
      const cleanUserData = {
        email: userData.email || '',
        name: userData.name || '',
        preferences: userData.preferences || defaultPreferences,
      };
      
      // Validate required fields
      if (!cleanUserData.email || !cleanUserData.name) {
        throw new Error('Email and name are required fields');
      }
      
      const userRef = await db.collection('users').add({
        ...cleanUserData,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
      
      console.log('User created successfully:', userRef.id);
      return userRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) {
        const userData = { id: doc.id, ...doc.data() } as User;
        
        // Convert Firestore timestamps to Date objects
        if (userData.createdAt && typeof userData.createdAt === 'object') {
          userData.createdAt = (userData.createdAt as any).toDate();
        }
        if (userData.updatedAt && typeof userData.updatedAt === 'object') {
          userData.updatedAt = (userData.updatedAt as any).toDate();
        }
        if (userData.lastLoginAt && typeof userData.lastLoginAt === 'object') {
          userData.lastLoginAt = (userData.lastLoginAt as any).toDate();
        }
        
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      // Clean updates to remove undefined values
      const cleanUpdates: any = {};
      
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });
      
      await db.collection('users').doc(userId).update({
        ...cleanUpdates,
        updatedAt: new Date(),
      });
      console.log('User updated successfully:', userId);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  // Find user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await db
        .collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const userData = { id: doc.id, ...doc.data() } as User;
        
        // Convert Firestore timestamps to Date objects
        if (userData.createdAt && typeof userData.createdAt === 'object') {
          userData.createdAt = (userData.createdAt as any).toDate();
        }
        if (userData.updatedAt && typeof userData.updatedAt === 'object') {
          userData.updatedAt = (userData.updatedAt as any).toDate();
        }
        if (userData.lastLoginAt && typeof userData.lastLoginAt === 'object') {
          userData.lastLoginAt = (userData.lastLoginAt as any).toDate();
        }
        
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  // Update user login timestamp
  async updateUserLogin(userId: string): Promise<boolean> {
    try {
      await db.collection('users').doc(userId).update({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating user login:', error);
      return false;
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      // Clean preferences to remove undefined values
      const cleanPreferences: any = {};
      
      Object.keys(preferences).forEach(key => {
        const value = (preferences as any)[key];
        if (value !== undefined) {
          cleanPreferences[key] = value;
        }
      });
      
      await db.collection('users').doc(userId).update({
        preferences: cleanPreferences,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
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
        .get();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      
      const reminders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to Date if needed, default to today's date
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate || today),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || today),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || today),
        } as Reminder;
      });
      
      // Filter out reminders with invalid dates and sort by dueDate
      return reminders
        .filter(reminder => reminder.dueDate instanceof Date && !isNaN(reminder.dueDate.getTime()))
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
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

  // Chat history operations
  async saveChatHistory(userId: string, messages: ChatMessage[], sessionId: string): Promise<string> {
    try {
      const now = new Date();
      const chatRef = await db.collection('chatHistory').add({
        userId,
        messages,
        sessionId,
        createdAt: now,
        updatedAt: now,
      });
      return chatRef.id;
    } catch (error) {
      console.error('Error saving chat history:', error);
      throw error;
    }
  }

  async getChatHistory(userId: string, limit: number = 10): Promise<ChatHistory[]> {
    try {
      const snapshot = await db
        .collection('chatHistory')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ChatHistory;
      });
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  // User session management
  async createUserSession(userId: string, deviceInfo: string, ipAddress?: string): Promise<string> {
    try {
      const now = new Date();
      const sessionRef = await db.collection('userSessions').add({
        userId,
        deviceInfo,
        ipAddress,
        loginAt: now,
        lastActiveAt: now,
        isActive: true,
      });
      return sessionRef.id;
    } catch (error) {
      console.error('Error creating user session:', error);
      throw error;
    }
  }

  async updateSessionActivity(sessionId: string): Promise<boolean> {
    try {
      await db.collection('userSessions').doc(sessionId).update({
        lastActiveAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating session activity:', error);
      return false;
    }
  }

  async endUserSession(sessionId: string): Promise<boolean> {
    try {
      await db.collection('userSessions').doc(sessionId).update({
        isActive: false,
        lastActiveAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error ending user session:', error);
      return false;
    }
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

  // Analytics and user insights
  async getUserStats(userId: string): Promise<{
    totalReminders: number;
    completedReminders: number;
    totalVoiceNotes: number;
    totalChatSessions: number;
    lastActiveDate: Date | null;
  }> {
    try {
      const [remindersSnapshot, voiceNotesSnapshot, chatHistorySnapshot] = await Promise.all([
        db.collection('reminders').where('userId', '==', userId).get(),
        db.collection('voiceNotes').where('userId', '==', userId).get(),
        db.collection('chatHistory').where('userId', '==', userId).get(),
      ]);

      const reminders = remindersSnapshot.docs.map(doc => doc.data());
      const completedReminders = reminders.filter(r => r.completed).length;

      // Get last active date from user sessions
      const sessionsSnapshot = await db
        .collection('userSessions')
        .where('userId', '==', userId)
        .orderBy('lastActiveAt', 'desc')
        .limit(1)
        .get();

      const lastActiveDate = !sessionsSnapshot.empty 
        ? sessionsSnapshot.docs[0].data().lastActiveAt?.toDate() || null
        : null;

      return {
        totalReminders: remindersSnapshot.size,
        completedReminders,
        totalVoiceNotes: voiceNotesSnapshot.size,
        totalChatSessions: chatHistorySnapshot.size,
        lastActiveDate,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalReminders: 0,
        completedReminders: 0,
        totalVoiceNotes: 0,
        totalChatSessions: 0,
        lastActiveDate: null,
      };
    }
  }
}

export default new FirestoreService();
