import notifee, { AndroidImportance, TimestampTrigger, TriggerType, EventType } from '@notifee/react-native';

export type ScheduleInput = {
  id?: string;
  title: string;
  body: string;
  timestampMs: number; // time in ms since epoch
};

const ANDROID_CHANNEL_ID = 'reminders_default_channel';

export async function initNotifications(): Promise<void> {
  try {
    // Request notification permissions
    const settings = await notifee.requestPermission();
    console.log('Notification permission status:', settings.authorizationStatus);

    // Create notification channel for Android
    await notifee.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'AI Assistant Reminders',
      description: 'Notifications for scheduled reminders and meetings',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      badge: true,
    });

    // Set up notification categories
    await setupNotificationCategories();

    // Set up notification event handlers
    notifee.onForegroundEvent(({ type, detail }) => {
      console.log('Foreground notification event:', type, detail);
      
      if (type === EventType.PRESS) {
        const actionId = detail.pressAction?.id || 'default';
        const notificationId = detail.notification?.id;
        const data = detail.notification?.data;
        
        if (notificationId) {
          handleNotificationAction(notificationId, actionId, data);
        }
      }
    });

    // Handle background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('Background notification event:', type, detail);
      
      if (type === EventType.PRESS) {
        const actionId = detail.pressAction?.id || 'default';
        const notificationId = detail.notification?.id;
        const data = detail.notification?.data;
        
        if (notificationId) {
          await handleNotificationAction(notificationId, actionId, data);
        }
      }
    });

    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Notification initialization failed:', error);
  }
}

export async function scheduleNotification(input: ScheduleInput): Promise<string | undefined> {
  try {
    // Validate timestamp is in the future
    const now = Date.now();
    if (input.timestampMs <= now) {
      console.warn('Cannot schedule notification in the past:', new Date(input.timestampMs));
      return undefined;
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: input.timestampMs,
      alarmManager: {
        allowWhileIdle: true, // Allow notification even in doze mode
      },
    };

    const notificationId = await notifee.createTriggerNotification(
      {
        id: input.id || `reminder_${Date.now()}`,
        title: input.title,
        body: input.body,
        data: {
          reminderId: input.id || 'unknown',
          scheduledTime: input.timestampMs.toString(),
          type: 'reminder',
        },
        android: {
          channelId: ANDROID_CHANNEL_ID,
          smallIcon: 'ic_launcher',
          sound: 'default',
          pressAction: { id: 'default' },
          importance: AndroidImportance.HIGH,
          autoCancel: false, // Keep notification until user acts
          showTimestamp: true,
          vibrationPattern: [300, 500, 300, 500],
          actions: [
            {
              title: '✓ Complete',
              pressAction: { id: 'mark_complete' },
            },
            {
              title: '⏰ Snooze 10m',
              pressAction: { id: 'snooze_10' },
            },
          ],
        },
        ios: {
          sound: 'default',
          categoryId: 'reminder',
        },
      },
      trigger
    );

    console.log(`Notification scheduled for ${new Date(input.timestampMs).toLocaleString()}:`, notificationId);
    return notificationId;
  } catch (error) {
    console.error('Schedule notification failed:', error);
    return undefined;
  }
}

export async function cancelNotification(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    await notifee.cancelNotification(notificationId);
    console.log('Notification cancelled:', notificationId);
  } catch (error) {
    console.error('Cancel notification failed:', error);
  }
}

// Get all scheduled notifications
export async function getScheduledNotifications(): Promise<any[]> {
  try {
    const notifications = await notifee.getTriggerNotifications();
    return notifications;
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await notifee.cancelAllNotifications();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
}

// Display immediate notification (for testing)
export async function displayNotification(title: string, body: string): Promise<void> {
  try {
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: ANDROID_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
      },
    });
  } catch (error) {
    console.error('Failed to display notification:', error);
  }
}

// Handle notification actions and events
export async function handleNotificationAction(notificationId: string, actionId: string, data?: any): Promise<void> {
  try {
    console.log('Handling notification action:', { notificationId, actionId, data });
    
    switch (actionId) {
      case 'default':
        // Handle default notification press
        console.log('User pressed notification:', notificationId);
        break;
      case 'mark_complete':
        // Handle mark as complete action
        console.log('User marked reminder as complete:', notificationId);
        await cancelNotification(notificationId);
        // TODO: Update reminder status in Firestore
        await displayNotification('Reminder Completed', 'Your reminder has been marked as complete!');
        break;
      case 'snooze_10':
        // Handle snooze action - reschedule for 10 minutes later
        console.log('User snoozed reminder:', notificationId);
        await cancelNotification(notificationId);
        
        if (data?.reminderId) {
          const snoozeTime = Date.now() + (10 * 60 * 1000); // 10 minutes from now
          await scheduleNotification({
            id: `${data.reminderId}_snoozed`,
            title: data.title || 'Snoozed Reminder',
            body: data.body || 'Your snoozed reminder is due now!',
            timestampMs: snoozeTime,
          });
          await displayNotification('Reminder Snoozed', 'Your reminder has been snoozed for 10 minutes.');
        }
        break;
      default:
        console.log('Unknown notification action:', actionId);
    }
  } catch (error) {
    console.error('Failed to handle notification action:', error);
  }
}

// Set up notification action categories (call this during app initialization)
export async function setupNotificationCategories(): Promise<void> {
  try {
    await notifee.setNotificationCategories([
      {
        id: 'reminder',
        actions: [
          {
            id: 'mark_complete',
            title: '✓ Complete',
            destructive: false,
          },
          {
            id: 'snooze_10',
            title: '⏰ Snooze 10m',
            destructive: false,
          },
        ],
      },
    ]);
  } catch (error) {
    console.error('Failed to setup notification categories:', error);
  }
}

// Schedule multiple reminder notifications (e.g., 15 min before, 5 min before, at time)
export async function scheduleReminderWithAlerts(input: ScheduleInput & { alertMinutes?: number[] }): Promise<string[]> {
  try {
    const notificationIds: string[] = [];
    const alertTimes = input.alertMinutes || [15, 5, 0]; // Default: 15 min, 5 min, and at time
    
    for (const minutesBefore of alertTimes) {
      const alertTime = input.timestampMs - (minutesBefore * 60 * 1000);
      
      if (alertTime > Date.now()) {
        const alertTitle = minutesBefore === 0 
          ? input.title 
          : `⏰ Reminder in ${minutesBefore} minutes`;
        
        const alertBody = minutesBefore === 0 
          ? input.body 
          : `${input.title} is coming up in ${minutesBefore} minutes`;
        
        const nid = await scheduleNotification({
          id: `${input.id}_alert_${minutesBefore}`,
          title: alertTitle,
          body: alertBody,
          timestampMs: alertTime,
        });
        
        if (nid) {
          notificationIds.push(nid);
        }
      }
    }
    
    console.log(`Scheduled ${notificationIds.length} reminder alerts`);
    return notificationIds;
  } catch (error) {
    console.error('Failed to schedule reminder alerts:', error);
    return [];
  }
}

// Get reminder notification status
export async function getReminderNotificationStatus(reminderId: string): Promise<{
  scheduled: number;
  pending: any[];
}> {
  try {
    const allNotifications = await getScheduledNotifications();
    const reminderNotifications = allNotifications.filter(n => 
      n.notification?.data?.reminderId === reminderId ||
      n.notification?.id?.includes(reminderId)
    );
    
    return {
      scheduled: reminderNotifications.length,
      pending: reminderNotifications,
    };
  } catch (error) {
    console.error('Failed to get reminder notification status:', error);
    return { scheduled: 0, pending: [] };
  }
}
