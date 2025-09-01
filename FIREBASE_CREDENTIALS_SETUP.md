# Firebase Credentials Setup Guide

## The Error: "supplied auth credential is incorrect, malformed or has expired"

This error occurs because your `firebase.config.js` file contains placeholder credentials that aren't connected to a real Firebase project.

## Step-by-Step Solution

### 1. Create or Access Your Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Either:
   - **Create a new project**: Click "Create a project"
   - **Use existing project**: Select your existing project

### 2. Add Android App to Your Firebase Project

1. In your Firebase project dashboard, click the **Android icon** or "Add app"
2. Fill in the required information:
   - **Android package name**: `com.aipoweredpa` (or your actual package name)
   - **App nickname**: "AI Powered PA" (optional)
   - **Debug signing certificate SHA-1**: Leave blank for now (optional)

### 3. Download and Get Configuration

1. After adding the app, you'll see the configuration screen
2. **Copy the configuration values** (don't download the file for React Native)
3. You'll need these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId` (optional)

### 4. Update Your firebase.config.js

Replace the placeholder values in `d:\AIPOWEREDPA\firebase.config.js` with your actual values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:android:abcdef1234567890abcdef",
  measurementId: "G-XXXXXXXXXX" // Optional for Analytics
};
```

### 5. Enable Authentication Methods

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable the sign-in methods you want to use:
   - **Email/Password** (recommended for testing)
   - **Google** (if you want Google sign-in)
   - **Anonymous** (for guest users)

### 6. Set Up Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location for your database

### 7. Configure Security Rules (Important!)

For development, you can use these test rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Quick Fix for Testing

If you want to test immediately without setting up a full Firebase project:

1. **Disable Firebase temporarily** by commenting out Firebase imports in `App.tsx`
2. **Use demo mode** - the app has fallback logic for when Firebase isn't available

## Troubleshooting

### Common Issues:

1. **Wrong package name**: Make sure the Android package name in Firebase matches your app
2. **Missing authentication methods**: Enable Email/Password in Firebase Console
3. **Firestore not set up**: Create a Firestore database in your Firebase project
4. **Network issues**: Check your internet connection
5. **Outdated credentials**: Regenerate credentials if they're old

### Verification Steps:

1. Check that all values in `firebase.config.js` are real (no "YOUR_ACTUAL_" placeholders)
2. Verify your Firebase project exists and is active
3. Ensure Authentication and Firestore are enabled in Firebase Console
4. Test with a simple authentication flow

## Need Help?

If you're still having issues:
1. Double-check all configuration values
2. Try creating a fresh Firebase project
3. Ensure your internet connection is stable
4. Check Firebase Console for any error messages
