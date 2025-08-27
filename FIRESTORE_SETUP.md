# Firestore Database Setup Guide

This guide will help you set up and use Firestore database in your React Native AI Personal Assistant app.

## ✅ What's Already Configured

- ✅ Firebase project configuration in `firebase.config.js`
- ✅ Google Services plugin in Android build files
- ✅ Firestore package installed (`@react-native-firebase/firestore`)
- ✅ Firestore service with TypeScript interfaces
- ✅ Example usage patterns
- ✅ Error handling and validation

## 🔧 Setup Steps

### 1. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `aipoweredpa-voice`
3. In the left sidebar, click **Firestore Database**
4. Click **Create Database**
5. Choose **Start in test mode** (for development)
6. Select a location closest to your users
7. Click **Done**

### 2. Security Rules

Update your Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own reminders
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Users can only access their own voice notes
    match /voiceNotes/{voiceNoteId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 3. Enable Authentication (Required for Security Rules)

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** sign-in method
4. Add your first user or implement sign-up in your app

## 📱 Usage in Your App

### Basic Import

```typescript
import firestoreService from './firestore.service';
import { User, Reminder, VoiceNote } from './firestore.service';
```

### Create a User

```typescript
const createUser = async () => {
  try {
    const userId = await firestoreService.createUser({
      email: 'user@example.com',
      name: 'John Doe',
    });
    console.log('User created:', userId);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Create a Reminder

```typescript
const createReminder = async (userId: string) => {
  try {
    const reminderId = await firestoreService.createReminder({
      userId,
      title: 'Team Meeting',
      description: 'Discuss project progress',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      completed: false,
    });
    console.log('Reminder created:', reminderId);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Real-time Updates

```typescript
import React, { useEffect, useState } from 'react';
import firestoreService from './firestore.service';

const RemindersList = ({ userId }: { userId: string }) => {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = firestoreService.subscribeToReminders(userId, (updatedReminders) => {
      setReminders(updatedReminders);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [userId]);

  return (
    <View>
      {reminders.map(reminder => (
        <Text key={reminder.id}>{reminder.title}</Text>
      ))}
    </View>
  );
};
```

## 🧪 Testing Your Setup

Run the test file to verify your Firestore connection:

```bash
node test-firestore.js
```

This will test:
- ✅ Creating a user
- ✅ Retrieving user data
- ✅ Creating a reminder
- ✅ Basic CRUD operations

## 🗂️ Database Collections Structure

### Users Collection
```
users/{userId}
├── email: string
├── name: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Reminders Collection
```
reminders/{reminderId}
├── userId: string (reference to users)
├── title: string
├── description: string (optional)
├── dueDate: timestamp
├── completed: boolean
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Voice Notes Collection
```
voiceNotes/{voiceNoteId}
├── userId: string (reference to users)
├── title: string
├── audioUrl: string
├── transcript: string (optional)
├── duration: number (seconds)
└── createdAt: timestamp
```

## 🔒 Security Best Practices

1. **Always validate user authentication** before database operations
2. **Use security rules** to restrict access to user's own data
3. **Validate input data** before sending to Firestore
4. **Handle errors gracefully** and provide user feedback
5. **Use batch operations** for multiple related writes

## 🚀 Performance Tips

1. **Index your queries** - Firestore will prompt you to create indexes
2. **Use pagination** for large datasets with `limit()` and `startAfter()`
3. **Cache data locally** when appropriate
4. **Use offline persistence** for better user experience
5. **Monitor your usage** in Firebase Console

## 🧪 Testing

Use the examples in `firestore.examples.ts` to test your setup:

```typescript
import { completeWorkflowExample } from './firestore.examples';

// Test the complete workflow
completeWorkflowExample().then((cleanup) => {
  if (cleanup) {
    // Clean up subscriptions when done
    cleanup.unsubscribeReminders();
    cleanup.unsubscribeVoiceNotes();
  }
});
```

## 📊 Monitoring

1. **Firebase Console** - Monitor database usage, performance, and errors
2. **Firestore Rules Playground** - Test your security rules
3. **Firebase Emulator** - Test locally before deploying

## 🆘 Troubleshooting

### Common Issues

1. **Permission Denied**: Check your security rules and authentication
2. **Missing Index**: Create the suggested index in Firebase Console
3. **Network Errors**: Check internet connection and Firebase project status
4. **Type Errors**: Ensure your TypeScript interfaces match your data structure
5. **Module Resolution Errors**: Clear Metro cache with `npx react-native start --reset-cache`

### Debug Mode

Enable debug logging:

```typescript
import firestore from '@react-native-firebase/firestore';

// Enable debug mode (remove in production)
if (__DEV__) {
  firestore().settings({
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
  });
}
```

### Metro Cache Issues

If you encounter module resolution errors:

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Or use the custom script
npm run start:clean
```

## 📚 Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/firestore/usage)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-modeling)

## 🎯 Next Steps

1. ✅ Firestore is now connected and ready to use
2. 🔐 Implement user authentication
3. 📝 Create your first documents
4. 🔄 Set up real-time listeners
5. 🎨 Build your UI components
6. 🧪 Test with real data
7. 🚀 Deploy to production

Your Firestore database is now fully configured and ready to power your AI Personal Assistant app! 🎉
