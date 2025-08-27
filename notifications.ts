import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';

export type ScheduleInput = {
  id?: string;
  title: string;
  body: string;
  timestampMs: number; // time in ms since epoch
};

const ANDROID_CHANNEL_ID = 'reminders_default_channel';

export async function initNotifications(): Promise<void> {
  try {
    await notifee.requestPermission();

    await notifee.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'reminder',
      vibration: true,
    });
  } catch (error) {
    // Fail gracefully; app should continue even if notifications are unavailable
    console.log('Notification init failed:', error);
  }
}

export async function scheduleNotification(input: ScheduleInput): Promise<string | undefined> {
  try {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: input.timestampMs,
      alarmManager: true,
    };

    const notificationId = await notifee.createTriggerNotification(
      {
        id: input.id, // let caller control id if needed
        title: input.title,
        body: input.body,
        android: {
          channelId: ANDROID_CHANNEL_ID,
          smallIcon: 'ic_launcher',
          sound: 'reminder',
          pressAction: { id: 'default' },
          importance: AndroidImportance.HIGH,
        },
        ios: {
          sound: 'default',
        },
      },
      trigger
    );

    return notificationId;
  } catch (error) {
    console.log('Schedule notification failed:', error);
    return undefined;
  }
}

export async function cancelNotification(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    await notifee.cancelNotification(notificationId);
  } catch (error) {
    console.log('Cancel notification failed:', error);
  }
}
