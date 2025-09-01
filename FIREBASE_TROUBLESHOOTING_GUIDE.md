# Firebase Troubleshooting Guide - Fix Authentication & Firestore Errors

## 🚨 IMMEDIATE ACTIONS REQUIRED

### Step 1: Update Firestore Security Rules (CRITICAL)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `aipowered-d6194`
3. **Navigate to**: Firestore Database → Rules tab
4. **Replace existing rules** with these corrected rules:

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

5. **Click "Publish"** to apply the rules

### Step 2: Verify Firebase Authentication Setup

1. **Go to**: Authentication → Sign-in method
2. **Ensure Email/Password is ENABLED**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

### Step 3: Check Project Configuration

1. **Verify Project ID**: Ensure you're working with `aipowered-d6194`
2. **Check google-services.json**: Ensure it matches your project
3. **Verify App Registration**: Check that your Android app is registered

## 🔧 ERROR-SPECIFIC FIXES

### Fix 1: [auth/invalid-credential] Error
**Cause**: Invalid email/password combination or expired session
**Solutions**:
- Try with a known working email/password
- Clear app data and try again
- Check if user account exists in Firebase Console → Authentication → Users

### Fix 2: [firestore/permission-denied] Error
**Cause**: Security rules blocking access
**Solutions**:
- Apply the corrected security rules above
- Ensure user is properly authenticated before Firestore operations
- Verify userId is correctly set in documents

### Fix 3: [auth/email-already-in-use] Error
**Cause**: Trying to create account with existing email
**Solutions**:
- Use sign-in instead of sign-up
- Check existing users in Firebase Console
- The updated LoginScreen.tsx now automatically switches to login mode

## 🧪 TESTING STEPS

### Test 1: Authentication Flow
1. Try creating a new account with a fresh email
2. Try logging in with existing credentials
3. Check Firebase Console → Authentication → Users for new entries

### Test 2: Firestore Access
1. After successful login, try creating a reminder
2. Check Firebase Console → Firestore Database for new documents
3. Verify documents have correct userId field

### Test 3: Security Rules
1. Go to Firestore Database → Rules tab
2. Click "Simulator"
3. Test with authenticated user scenarios

## 🚨 EMERGENCY WORKAROUND (Temporary Only)

If the production rules still cause issues, temporarily use these development rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING**: Only use for debugging. Switch back to production rules once working.

## 📋 VERIFICATION CHECKLIST

- [ ] Firestore security rules updated and published
- [ ] Email/Password authentication enabled in Firebase Console
- [ ] google-services.json file is correct for project `aipowered-d6194`
- [ ] App can create new user accounts
- [ ] App can sign in existing users
- [ ] Firestore operations work after authentication
- [ ] No permission denied errors in console

## 🆘 STILL HAVING ISSUES?

1. **Check Firebase Console logs**: Go to your project → Analytics → DebugView
2. **Verify network connectivity**: Ensure device/emulator has internet
3. **Clear app cache**: Uninstall and reinstall the app
4. **Check React Native Firebase setup**: Ensure all packages are properly installed

## 📞 NEXT STEPS

After applying these fixes:
1. Test the authentication flow
2. Verify Firestore operations work
3. Check that all error messages are resolved
4. Monitor Firebase Console for any new errors

**Expected Result**: All authentication and Firestore permission errors should be resolved.
