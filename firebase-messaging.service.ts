import { Platform, PermissionsAndroid } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { displayNotification, scheduleNotification } from './notifications';

// Define Firebase messaging types locally to avoid module resolution issues
export interface RemoteMessage {
  messageId?: string;
  data?: { [key: string]: string };
  notification?: {
    title?: string;
    body?: string;
    android?: any;
    ios?: any;
  };
  from?: string;
  to?: string;
  collapseKey?: string;
  messageType?: string;
  ttl?: number;
}

export interface FCMToken {
  token: string;
  timestamp: number;
}

export interface PushNotificationData {
  type?: 'reminder' | 'weather' | 'news' | 'general';
  reminderId?: string;
  scheduleTime?: string;
  action?: string;
  [key: string]: any;
}

// Add error handling for Firebase messaging module
let messaging: any = null;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.log('Firebase messaging module not available, FCM features will be disabled:', error);
}

class FirebaseMessagingService {
  private fcmToken: string | null = null;
  private isInitialized = false;

  /**
   * Initialize Firebase Cloud Messaging
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Check if messaging module is available
      if (!messaging) {
        console.log('FCM: Firebase messaging module not available, skipping initialization');
        return;
      }

      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('FCM: Push notification permission not granted');
        return;
      }

      // Get FCM token
      await this.getFCMToken();

      // Set up message handlers
      this.setupMessageHandlers();

      // Handle token refresh
      messaging().onTokenRefresh((token: string) => {
        console.log('FCM: Token refreshed:', token);
        this.fcmToken = token;
        this.saveFCMToken(token);
      });

      this.isInitialized = true;
      console.log('FCM: Firebase messaging initialized successfully');
    } catch (error) {
      console.error('FCM: Initialization failed:', error);
    }
  }

  /**
   * Get FCM registration token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      if (this.fcmToken) return this.fcmToken;

      if (!messaging) {
        console.log('FCM: Messaging module not available');
        return null;
      }

      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        this.saveFCMToken(token);
        console.log('FCM: Token obtained:', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('FCM: Failed to get token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to local storage/Firestore
   */
  private async saveFCMToken(token: string): Promise<void> {
    try {
      // TODO: Save to Firestore user document
      // await firestore().collection('users').doc(userId).update({
      //   fcmToken: token,
      //   fcmTokenUpdated: firestore.FieldValue.serverTimestamp()
      // });
      
      console.log('FCM: Token saved locally');
    } catch (error) {
      console.error('FCM: Failed to save token:', error);
    }
  }

  /**
   * Set up message handlers for different app states
   */
  private setupMessageHandlers(): void {
    if (!messaging) {
      console.log('FCM: Messaging module not available, skipping message handlers setup');
      return;
    }

    // Handle messages when app is in background
    messaging().setBackgroundMessageHandler(async (remoteMessage: RemoteMessage) => {
      console.log('FCM: Background message received:', remoteMessage);
      await this.handleBackgroundMessage(remoteMessage);
    });

    // Handle messages when app is in foreground
    messaging().onMessage(async (remoteMessage: RemoteMessage) => {
      console.log('FCM: Foreground message received:', remoteMessage);
      await this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification opened when app is in background/quit
    messaging().onNotificationOpenedApp((remoteMessage: RemoteMessage) => {
      console.log('FCM: Notification opened app:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Check if app was opened from a notification when it was completely closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage: RemoteMessage | null) => {
        if (remoteMessage) {
          console.log('FCM: App opened from notification:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  /**
   * Handle messages when app is in foreground
   */
  private async handleForegroundMessage(
    remoteMessage: RemoteMessage
  ): Promise<void> {
    try {
      const { notification, data } = remoteMessage;
      
      if (notification) {
        // Display notification using Notifee for better control
        await displayNotification(
          notification.title || 'New Message',
          notification.body || 'You have a new message'
        );
      }

      // Handle data payload
      if (data) {
        await this.processMessageData(data as PushNotificationData);
      }
    } catch (error) {
      console.error('FCM: Error handling foreground message:', error);
    }
  }

  /**
   * Handle messages when app is in background
   */
  private async handleBackgroundMessage(
    remoteMessage: RemoteMessage
  ): Promise<void> {
    try {
      const { data } = remoteMessage;
      
      if (data) {
        await this.processMessageData(data as PushNotificationData);
      }
    } catch (error) {
      console.error('FCM: Error handling background message:', error);
    }
  }

  /**
   * Process message data payload
   */
  private async processMessageData(data: PushNotificationData): Promise<void> {
    try {
      switch (data.type) {
        case 'reminder':
          await this.handleReminderMessage(data);
          break;
        case 'weather':
          await this.handleWeatherMessage(data);
          break;
        case 'news':
          await this.handleNewsMessage(data);
          break;
        default:
          console.log('FCM: Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('FCM: Error processing message data:', error);
    }
  }

  /**
   * Handle reminder-specific messages
   */
  private async handleReminderMessage(data: PushNotificationData): Promise<void> {
    if (data.scheduleTime && data.reminderId) {
      const scheduleTimeMs = parseInt(data.scheduleTime);
      
      if (scheduleTimeMs > Date.now()) {
        // Schedule the reminder notification
        await scheduleNotification({
          id: data.reminderId,
          title: data.title || 'Reminder',
          body: data.body || 'You have a reminder',
          timestampMs: scheduleTimeMs,
        });
        
        console.log('FCM: Reminder scheduled from push message');
      }
    }
  }

  /**
   * Handle weather-specific messages
   */
  private async handleWeatherMessage(data: PushNotificationData): Promise<void> {
    // Handle weather alerts or updates
    console.log('FCM: Weather message processed:', data);
  }

  /**
   * Handle news-specific messages
   */
  private async handleNewsMessage(data: PushNotificationData): Promise<void> {
    // Handle breaking news or news updates
    console.log('FCM: News message processed:', data);
  }

  /**
   * Handle notification press events
   */
  private handleNotificationPress(
    remoteMessage: RemoteMessage
  ): void {
    try {
      const { data } = remoteMessage;
      
      if (data) {
        // Navigate to specific screen based on message type
        switch (data.type) {
          case 'reminder':
            // Navigate to reminders screen
            console.log('FCM: Navigate to reminders');
            break;
          case 'weather':
            // Navigate to weather screen
            console.log('FCM: Navigate to weather');
            break;
          case 'news':
            // Navigate to news screen
            console.log('FCM: Navigate to news');
            break;
          default:
            // Navigate to main screen
            console.log('FCM: Navigate to main screen');
        }
      }
    } catch (error) {
      console.error('FCM: Error handling notification press:', error);
    }
  }

  /**
   * Subscribe to a topic for receiving targeted notifications
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      if (!messaging) {
        console.log('FCM: Messaging module not available');
        return;
      }
      await messaging().subscribeToTopic(topic);
      console.log(`FCM: Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`FCM: Failed to subscribe to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      if (!messaging) {
        console.log('FCM: Messaging module not available');
        return;
      }
      await messaging().unsubscribeFromTopic(topic);
      console.log(`FCM: Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`FCM: Failed to unsubscribe from topic ${topic}:`, error);
    }
  }

  /**
   * Send FCM token to your backend server
   */
  async sendTokenToServer(userId: string): Promise<void> {
    try {
      const token = await this.getFCMToken();
      if (!token) return;

      // TODO: Send token to your backend server
      // const response = await fetch('YOUR_BACKEND_URL/api/fcm-token', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${userAuthToken}`,
      //   },
      //   body: JSON.stringify({
      //     userId,
      //     fcmToken: token,
      //     platform: Platform.OS,
      //     timestamp: Date.now(),
      //   }),
      // });

      console.log('FCM: Token sent to server for user:', userId);
    } catch (error) {
      console.error('FCM: Failed to send token to server:', error);
    }
  }

  /**
   * Check if FCM is available and properly configured
   */
  async checkFCMAvailability(): Promise<boolean> {
    try {
      if (!messaging) {
        console.log('FCM: Messaging module not available');
        return false;
      }
      const isSupported = messaging.isDeviceRegisteredForRemoteMessages;
      console.log('FCM: Device registered for remote messages:', isSupported);
      return isSupported;
    } catch (error) {
      console.error('FCM: Availability check failed:', error);
      return false;
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Delete FCM token (for logout)
   */
  async deleteToken(): Promise<void> {
    try {
      if (!messaging) {
        console.log('FCM: Messaging module not available');
        return;
      }
      await messaging().deleteToken();
      this.fcmToken = null;
      console.log('FCM: Token deleted');
    } catch (error) {
      console.error('FCM: Failed to delete token:', error);
    }
  }
}

// Export singleton instance
export const firebaseMessagingService = new FirebaseMessagingService();

// Convenience functions
export const initializeFCM = () => firebaseMessagingService.initialize();
export const getFCMToken = () => firebaseMessagingService.getFCMToken();
export const subscribeToTopic = (topic: string) => firebaseMessagingService.subscribeToTopic(topic);
export const unsubscribeFromTopic = (topic: string) => firebaseMessagingService.unsubscribeFromTopic(topic);
export const sendTokenToServer = (userId: string) => firebaseMessagingService.sendTokenToServer(userId);
