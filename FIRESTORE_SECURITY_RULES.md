# Firestore Security Rules Configuration

## How to Configure Security Rules

### Step 1: Access Rules in Firebase Console
1. Go to Firebase Console → Your Project (`aipowered-d6194`)
2. Navigate to Firestore Database
3. Click on "Rules" tab
4. Replace the existing rules with one of the options below

## Option 1: Development Rules (For Testing)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users only
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Use this for**: Development and testing
**Security Level**: Medium - requires authentication

## Option 2: Production Rules (Recommended for Live App)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own reminders
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own user sessions
    match /userSessions/{sessionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own chat history
    match /chatHistory/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own voice notes
    match /voiceNotes/{voiceNoteId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

**Use this for**: Production deployment
**Security Level**: High - users can only access their own data

## Option 3: Open Rules (NOT RECOMMENDED - Only for Quick Testing)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Use this for**: Quick testing only
**Security Level**: None - anyone can access all data

## Step-by-Step Configuration

### 1. Copy the Rules
- Choose Option 1 (Development) or Option 2 (Production)
- Copy the entire rule block

### 2. Apply in Firebase Console
1. Go to Firestore Database → Rules tab
2. Delete existing rules
3. Paste your chosen rules
4. Click "Publish" button
5. Confirm the changes

### 3. Test the Rules
- Use the Firebase Console simulator to test rules
- Click "Simulate" button in Rules tab
- Test different scenarios (authenticated/unauthenticated users)

## Understanding the Rules

### Key Concepts:
- `request.auth != null`: User must be authenticated
- `request.auth.uid == userId`: User can only access their own data
- `resource.data.userId`: Refers to the userId field in the document
- `request.resource.data.userId`: Refers to the userId in the incoming request

### Collections in Your App:
- **users**: User profile information
- **reminders**: User's reminders and tasks
- **userSessions**: User session data
- **chatHistory**: Chat conversation history
- **voiceNotes**: Voice notes

## Security Best Practices

1. **Always require authentication** for sensitive data
2. **Use user-specific rules** to prevent data leaks
3. **Test rules thoroughly** before deploying
4. **Start with restrictive rules** and loosen as needed
5. **Never use open rules** (`allow read, write: if true`) in production

## Troubleshooting

### Common Issues:
- **Permission denied**: Rules are too restrictive
- **Missing userId field**: Ensure your app sets userId in documents
- **Authentication required**: User must be logged in

### Testing:
- Use Firebase Console simulator
- Check browser console for detailed error messages
- Verify user authentication status in your app
