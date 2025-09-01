# How to Get Firebase Configuration Values

## Step-by-Step Instructions

### 1. Access Firebase Console
- Go to: https://console.firebase.google.com/
- Select your project: `aipowered-d6194`
- Click gear icon (⚙️) → "Project settings"

### 2. Navigate to App Configuration
- Scroll down to "Your apps" section
- If you see an Android app, click on it
- If no app exists, click "Add app" → Android icon

### 3. Get Configuration Values

You'll see a code block that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // ← Copy this value
  authDomain: "aipowered-d6194.firebaseapp.com", // ← Copy this
  projectId: "aipowered-d6194", // ← You already have this
  storageBucket: "aipowered-d6194.appspot.com", // ← Copy this
  messagingSenderId: "222809660841", // ← Copy this
  appId: "1:222809660841:android:54f22155a8492f717838b8", // ← You have this
  measurementId: "G-XXXXXXXXXX" // ← Copy this (if Analytics enabled)
};
```

## What Each Value Is:

### apiKey
- **Location**: Firebase Console → Project Settings → General tab → Your apps
- **Format**: Starts with "AIzaSy..."
- **Purpose**: Authenticates your app with Firebase services

### authDomain
- **Location**: Same place as apiKey
- **Format**: `your-project-id.firebaseapp.com`
- **Purpose**: Domain for Firebase Authentication

### projectId
- **Location**: Same place, or visible in URL
- **Format**: Your project name (you already have: `aipowered-d6194`)
- **Purpose**: Identifies your Firebase project

### storageBucket
- **Location**: Same configuration block
- **Format**: `your-project-id.appspot.com`
- **Purpose**: Cloud Storage bucket for file uploads

### messagingSenderId
- **Location**: Same configuration block
- **Format**: Numbers only (like: `222809660841`)
- **Purpose**: Firebase Cloud Messaging sender ID

### appId
- **Location**: Same configuration block
- **Format**: `1:numbers:android:hash` (you already have this)
- **Purpose**: Unique identifier for your Android app

### measurementId (Optional)
- **Location**: Same place (only if Google Analytics enabled)
- **Format**: Starts with "G-"
- **Purpose**: Google Analytics tracking

## Quick Copy Method

1. In Firebase Console → Project Settings
2. Find your Android app
3. Click "Config" or look for the configuration object
4. **Copy each value exactly** (including quotes if shown)
5. Paste into your `firebase.config.js`

## If You Don't See Configuration Values

### Add Android App:
1. Click "Add app" → Android icon
2. **Android package name**: `com.aipoweredpa`
3. **App nickname**: "AI Powered PA"
4. Click "Register app"
5. You'll see the configuration values

### Enable Required Services:
- **Authentication**: Go to Authentication → Sign-in method → Enable Email/Password
- **Firestore**: Go to Firestore Database → Create database
- **Cloud Messaging**: Go to Cloud Messaging (auto-enabled)
- **Analytics**: Go to Analytics → Enable (optional for measurementId)

## Example of What Your Final Config Should Look Like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnop", // Real API key
  authDomain: "aipowered-d6194.firebaseapp.com", // Your domain
  projectId: "aipowered-d6194", // Your project ID
  storageBucket: "aipowered-d6194.appspot.com", // Your storage bucket
  messagingSenderId: "222809660841", // Your sender ID
  appId: "1:222809660841:android:54f22155a8492f717838b8", // Your app ID
  measurementId: "G-ABC123DEF456" // Your measurement ID (if Analytics enabled)
};
```

## Troubleshooting

- **Can't find config**: Make sure you've added an Android app to your project
- **Values missing**: Enable the required Firebase services (Auth, Firestore, etc.)
- **Still getting errors**: Double-check you copied values exactly without extra spaces
