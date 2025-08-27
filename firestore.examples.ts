import firestoreService from './firestore.service';
import { User, Reminder, VoiceNote } from './firestore.service';

// Example usage of the Firestore service

// 1. Create a new user
export const createUserExample = async () => {
  try {
    const userId = await firestoreService.createUser({
      email: 'user@example.com',
      name: 'John Doe',
    });
    console.log('User created with ID:', userId);
    return userId;
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

// 2. Get user data
export const getUserExample = async (userId: string) => {
  try {
    const user = await firestoreService.getUser(userId);
    if (user) {
      console.log('User found:', user);
      return user;
    } else {
      console.log('User not found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
  }
};

// 3. Create a reminder
export const createReminderExample = async (userId: string) => {
  try {
    const reminderId = await firestoreService.createReminder({
      userId,
      title: 'Meeting with team',
      description: 'Discuss project progress',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      completed: false,
    });
    console.log('Reminder created with ID:', reminderId);
    return reminderId;
  } catch (error) {
    console.error('Error creating reminder:', error);
  }
};

// 4. Get user's reminders
export const getRemindersExample = async (userId: string) => {
  try {
    const reminders = await firestoreService.getReminders(userId);
    console.log('User reminders:', reminders);
    return reminders;
  } catch (error) {
    console.error('Error getting reminders:', error);
  }
};

// 5. Update a reminder
export const updateReminderExample = async (reminderId: string) => {
  try {
    const success = await firestoreService.updateReminder(reminderId, {
      completed: true,
    });
    if (success) {
      console.log('Reminder updated successfully');
    } else {
      console.log('Failed to update reminder');
    }
    return success;
  } catch (error) {
    console.error('Error updating reminder:', error);
  }
};

// 6. Create a voice note
export const createVoiceNoteExample = async (userId: string) => {
  try {
    const voiceNoteId = await firestoreService.createVoiceNote({
      userId,
      title: 'Voice memo',
      audioUrl: 'https://example.com/audio.mp3',
      transcript: 'This is a voice memo about the project',
      duration: 30, // seconds
    });
    console.log('Voice note created with ID:', voiceNoteId);
    return voiceNoteId;
  } catch (error) {
    console.error('Error creating voice note:', error);
  }
};

// 7. Real-time subscription to reminders
export const subscribeToRemindersExample = (userId: string) => {
  const unsubscribe = firestoreService.subscribeToReminders(userId, (reminders) => {
    console.log('Reminders updated in real-time:', reminders);
    // Update your UI here
  });
  
  // Return unsubscribe function to clean up when component unmounts
  return unsubscribe;
};

// 8. Real-time subscription to voice notes
export const subscribeToVoiceNotesExample = (userId: string) => {
  const unsubscribe = firestoreService.subscribeToVoiceNotes(userId, (voiceNotes) => {
    console.log('Voice notes updated in real-time:', voiceNotes);
    // Update your UI here
  });
  
  // Return unsubscribe function to clean up when component unmounts
  return unsubscribe;
};

// 9. Batch operations example
export const batchCreateExample = async () => {
  try {
    const operations = [
      {
        collection: 'users',
        data: {
          email: 'batch@example.com',
          name: 'Batch User',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        collection: 'reminders',
        data: {
          userId: 'batch-user-id',
          title: 'Batch Reminder',
          dueDate: new Date(),
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];
    
    const success = await firestoreService.batchCreate(operations);
    if (success) {
      console.log('Batch operation completed successfully');
    } else {
      console.log('Batch operation failed');
    }
    return success;
  } catch (error) {
    console.error('Error in batch operation:', error);
  }
};

// 10. Complete workflow example
export const completeWorkflowExample = async () => {
  try {
    // 1. Create user
    const userId = await createUserExample();
    if (!userId) return;
    
    // 2. Create reminder
    const reminderId = await createReminderExample(userId);
    if (!reminderId) return;
    
    // 3. Create voice note
    const voiceNoteId = await createVoiceNoteExample(userId);
    if (!voiceNoteId) return;
    
    // 4. Get all data
    const user = await getUserExample(userId);
    const reminders = await getRemindersExample(userId);
    
    // 5. Set up real-time listeners
    const unsubscribeReminders = subscribeToRemindersExample(userId);
    const unsubscribeVoiceNotes = subscribeToVoiceNotesExample(userId);
    
    console.log('Complete workflow executed successfully');
    
    // Return cleanup functions
    return {
      unsubscribeReminders,
      unsubscribeVoiceNotes,
    };
  } catch (error) {
    console.error('Error in complete workflow:', error);
  }
};
