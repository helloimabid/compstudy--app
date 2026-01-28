/**
 * Spaced Repetition Notification Service
 * Handles scheduling and sending push notifications for review reminders
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { scheduleLocalNotification } from './expoPushNotifications';

// Storage key for scheduled notification IDs
const SR_NOTIFICATION_IDS_KEY = 'sr_scheduled_notification_ids';

// Notification channel for SR reminders (Android)
const SR_NOTIFICATION_CHANNEL = 'sr_reminders';

/**
 * Initialize SR notification channel for Android
 */
export async function initializeSRNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(SR_NOTIFICATION_CHANNEL, {
    name: 'Spaced Repetition Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366f1',
    sound: 'default',
    description: 'Reminders for your spaced repetition reviews',
  });
}

/**
 * Parse time string (HH:MM) to hours and minutes
 */
function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hoursStr, minutesStr] = timeString.split(':');
  return {
    hours: parseInt(hoursStr, 10) || 9,
    minutes: parseInt(minutesStr, 10) || 0,
  };
}

/**
 * Schedule a daily reminder notification
 * @param reminderTime Time in HH:MM format
 * @param dueCount Number of items due (for message customization)
 */
export async function scheduleDailyReviewReminder(
  reminderTime: string,
  dueCount?: number,
  weekendReminders: boolean = true
): Promise<string | null> {
  try {
    const { hours, minutes } = parseTimeString(reminderTime);

    // Check if today is weekend and weekendReminders is disabled
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    if (isWeekend && !weekendReminders) {
      console.log('Skipping weekend reminder');
      return null;
    }

    // Calculate trigger time for today or tomorrow
    const now = new Date();
    let triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    // Skip weekend if needed
    if (!weekendReminders) {
      while (triggerDate.getDay() === 0 || triggerDate.getDay() === 6) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }
    }

    const title = '📚 Time to Review!';
    const body = dueCount && dueCount > 0
      ? `You have ${dueCount} topic${dueCount > 1 ? 's' : ''} due for review. Keep your knowledge fresh!`
      : 'Check your spaced repetition schedule and keep learning!';

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { screen: '/review', type: 'sr_reminder' },
        sound: 'default',
        badge: dueCount || undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    // Store the notification ID
    await storeNotificationId(notificationId);

    console.log(`Scheduled SR reminder for ${triggerDate.toISOString()}, ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule SR reminder:', error);
    return null;
  }
}

/**
 * Schedule recurring daily reminders
 * Note: Expo doesn't support true recurring notifications, so we schedule multiple
 */
export async function scheduleRecurringReminders(
  reminderTime: string,
  daysAhead: number = 7,
  weekendReminders: boolean = true
): Promise<string[]> {
  const notificationIds: string[] = [];
  const { hours, minutes } = parseTimeString(reminderTime);

  try {
    // Clear existing SR notifications first
    await cancelSRNotifications();

    const now = new Date();
    
    for (let i = 1; i <= daysAhead; i++) {
      const triggerDate = new Date();
      triggerDate.setDate(now.getDate() + i);
      triggerDate.setHours(hours, minutes, 0, 0);

      // Skip weekends if needed
      const isWeekend = triggerDate.getDay() === 0 || triggerDate.getDay() === 6;
      if (isWeekend && !weekendReminders) {
        continue;
      }

      const title = '📚 Review Time!';
      const body = 'Your spaced repetition topics are waiting. Don\'t break your learning streak!';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { screen: '/review', type: 'sr_reminder' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      notificationIds.push(notificationId);
    }

    // Store all notification IDs
    await AsyncStorage.setItem(SR_NOTIFICATION_IDS_KEY, JSON.stringify(notificationIds));

    console.log(`Scheduled ${notificationIds.length} SR reminders for next ${daysAhead} days`);
    return notificationIds;
  } catch (error) {
    console.error('Failed to schedule recurring reminders:', error);
    return [];
  }
}

/**
 * Send an immediate push notification for due reviews
 */
export async function sendImmediateDueNotification(
  dueCount: number,
  topicName?: string
): Promise<string | null> {
  try {
    const title = '🔔 Reviews Due Now';
    const body = topicName
      ? `"${topicName}" and ${dueCount - 1} other topic${dueCount > 2 ? 's' : ''} are ready for review.`
      : `You have ${dueCount} topic${dueCount > 1 ? 's' : ''} ready for review.`;

    const notificationId = await scheduleLocalNotification(
      title,
      body,
      null, // null trigger = immediate
      { screen: '/review', type: 'sr_due' }
    );

    return notificationId;
  } catch (error) {
    console.error('Failed to send immediate notification:', error);
    return null;
  }
}

/**
 * Cancel all SR scheduled notifications
 */
export async function cancelSRNotifications(): Promise<void> {
  try {
    const storedIds = await AsyncStorage.getItem(SR_NOTIFICATION_IDS_KEY);
    if (storedIds) {
      const ids: string[] = JSON.parse(storedIds);
      await Promise.all(
        ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
      );
    }
    await AsyncStorage.removeItem(SR_NOTIFICATION_IDS_KEY);
    console.log('Cancelled all SR notifications');
  } catch (error) {
    console.error('Failed to cancel SR notifications:', error);
  }
}

/**
 * Store a notification ID for later cancellation
 */
async function storeNotificationId(id: string): Promise<void> {
  try {
    const storedIds = await AsyncStorage.getItem(SR_NOTIFICATION_IDS_KEY);
    const ids: string[] = storedIds ? JSON.parse(storedIds) : [];
    ids.push(id);
    await AsyncStorage.setItem(SR_NOTIFICATION_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to store notification ID:', error);
  }
}

/**
 * Get all scheduled notification IDs for SR
 */
export async function getScheduledSRNotifications(): Promise<string[]> {
  try {
    const storedIds = await AsyncStorage.getItem(SR_NOTIFICATION_IDS_KEY);
    return storedIds ? JSON.parse(storedIds) : [];
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
}

/**
 * Check if user has push notification permissions
 */
export async function hasPushPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Update SR notifications based on settings
 * Call this when settings change or on app startup
 */
export async function updateSRNotifications(
  enabled: boolean,
  reminderTime: string,
  weekendReminders: boolean = true
): Promise<void> {
  if (!enabled) {
    await cancelSRNotifications();
    return;
  }

  const hasPermission = await hasPushPermissions();
  if (!hasPermission) {
    console.warn('Push permissions not granted, skipping SR notifications');
    return;
  }

  // Schedule reminders for the next 7 days
  await scheduleRecurringReminders(reminderTime, 7, weekendReminders);
}

/**
 * Handle notification response (when user taps notification)
 */
export function setupSRNotificationHandler(
  onNavigate: (screen: string) => void
): Notifications.Subscription {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data?.type === 'sr_reminder' || data?.type === 'sr_due') {
      if (data.screen) {
        onNavigate(data.screen as string);
      }
    }
  });

  return subscription;
}
