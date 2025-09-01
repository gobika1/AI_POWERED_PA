# Firebase Push Notifications Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) push notifications for your AI Personal Assistant React Native app.

## Prerequisites

- Firebase project created and configured
- React Native development environment set up
- Android Studio (for Android) and Xcode (for iOS) installed

## 1. Firebase Console Configuration

### Step 1: Enable Cloud Messaging
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`aipoweredpa-voice`)
3. Navigate to **Project Settings** → **Cloud Messaging**
4. Note down your **Server Key** and **Sender ID**

### Step 2: Add App Configurations
1. **For Android:**
   - Download `google-services.json`
   - Place it in `android/app/google-services.json`

2. **For iOS:**
   - Download `GoogleService-Info.plist`
   - Add it to your iOS project in Xcode

### Step 3: Generate Server Key
1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save the JSON file securely (needed for server-side notifications)

## 2. Package Installation

The required packages are already added to `package.json`:

```bash
npm install @react-native-firebase/messaging
```

## 3. Android Configuration

### AndroidManifest.xml
The following permissions and services are already configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Permissions -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />

<!-- FCM Service -->
<service
  android:name="io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService"
  android:exported="false">
  <intent-filter>
    <action android:name="com.google.firebase.MESSAGING_EVENT" />
  </intent-filter>
</service>

<!-- FCM Receiver -->
<receiver
  android:name="io.invertase.firebase.messaging.ReactNativeFirebaseMessagingReceiver"
  android:exported="true"
  android:permission="com.google.android.c2dm.permission.SEND">
  <intent-filter>
    <action android:name="com.google.android.c2dm.intent.RECEIVE" />
  </intent-filter>
</receiver>
```

### Build Configuration
Ensure `android/app/build.gradle` includes:

```gradle
apply plugin: 'com.google.gms.google-services'
```

And `android/build.gradle` includes:

```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
}
```

## 4. iOS Configuration

### Info.plist
Background modes are already configured in `ios/AIPOWEREDPA/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>background-fetch</string>
</array>
```

### Capabilities
In Xcode:
1. Select your project target
2. Go to **Signing & Capabilities**
3. Add **Push Notifications** capability
4. Add **Background Modes** capability
5. Enable **Remote notifications** and **Background fetch**

### APNs Certificate
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create APNs certificate for your app
3. Upload the certificate to Firebase Console under **Project Settings** → **Cloud Messaging** → **iOS app configuration**

## 5. Implementation

### Firebase Messaging Service
The `firebase-messaging.service.ts` file provides:

- **Token Management**: Automatic FCM token generation and refresh
- **Message Handling**: Foreground, background, and notification press handling
- **Topic Subscription**: Subscribe/unsubscribe from notification topics
- **Integration**: Works with existing Notifee local notifications

### Key Features

```typescript
// Initialize FCM
await initializeFCM();

// Get FCM token
const token = await getFCMToken();

// Subscribe to topics
await subscribeToTopic('weather-alerts');
await subscribeToTopic('news-updates');

// Send token to your backend
await sendTokenToServer(userId);
```

## 6. Testing Push Notifications

### Using Firebase Console
1. Go to **Cloud Messaging** in Firebase Console
2. Click **Send your first message**
3. Enter notification details:
   - **Title**: "Test Notification"
   - **Text**: "This is a test push notification"
4. Select your app
5. Send the notification

### Using cURL (Server Testing)
```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN",
    "notification": {
      "title": "Test Notification",
      "body": "Hello from FCM!"
    },
    "data": {
      "type": "reminder",
      "reminderId": "test123"
    }
  }'
```

## 7. Message Types and Data Payloads

### Reminder Notifications
```json
{
  "notification": {
    "title": "Reminder",
    "body": "Your meeting starts in 15 minutes"
  },
  "data": {
    "type": "reminder",
    "reminderId": "reminder_123",
    "scheduleTime": "1693478400000"
  }
}
```

### Weather Alerts
```json
{
  "notification": {
    "title": "Weather Alert",
    "body": "Heavy rain expected in your area"
  },
  "data": {
    "type": "weather",
    "location": "New York",
    "alertType": "rain"
  }
}
```

### News Updates
```json
{
  "notification": {
    "title": "Breaking News",
    "body": "Important tech news update"
  },
  "data": {
    "type": "news",
    "category": "technology",
    "articleId": "news_456"
  }
}
```

## 8. Troubleshooting

### Common Issues

1. **No FCM Token Generated**
   - Check Firebase configuration files are in correct locations
   - Verify app is properly registered in Firebase Console
   - Check device has Google Play Services (Android)

2. **Notifications Not Received**
   - Verify notification permissions are granted
   - Check if app is in battery optimization whitelist
   - Test with Firebase Console first

3. **Background Messages Not Working**
   - Ensure background message handler is set up
   - Check if app has background app refresh enabled (iOS)
   - Verify background modes are configured

### Debug Commands

```bash
# Check FCM token in logs
npx react-native log-android | grep "FCM:"
npx react-native log-ios | grep "FCM:"

# Test notification permissions
adb shell dumpsys notification
```

## 9. Production Considerations

### Security
- Never expose server keys in client code
- Use Firebase Admin SDK for server-side operations
- Implement token refresh handling
- Validate notification payloads

### Performance
- Cache FCM tokens appropriately
- Handle token refresh events
- Implement retry logic for failed registrations
- Monitor notification delivery rates

### User Experience
- Request notification permissions at appropriate times
- Provide clear notification settings
- Handle notification actions properly
- Implement notification categories

## 10. Backend Integration

### Node.js Example
```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
async function sendNotification(token, title, body, data) {
  const message = {
    token: token,
    notification: {
      title: title,
      body: body
    },
    data: data,
    android: {
      priority: 'high'
    },
    apns: {
      payload: {
        aps: {
          'content-available': 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.log('Error sending message:', error);
  }
}
```

## 11. Next Steps

1. **Set up your backend server** to send notifications
2. **Configure notification topics** for different user segments
3. **Implement analytics** to track notification performance
4. **Add notification preferences** in user settings
5. **Test thoroughly** on both Android and iOS devices

## Support

For issues and questions:
- Check Firebase documentation: https://firebase.google.com/docs/cloud-messaging
- React Native Firebase docs: https://rnfirebase.io/messaging/usage
- File issues in the project repository

---

**Note**: Remember to replace placeholder values (server keys, tokens, etc.) with your actual Firebase project configuration.
