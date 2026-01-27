import { databases, DB_ID, ID, Permission, Query, Role } from '@/lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const EXPO_PUSH_TOKEN_KEY = 'expo_push_token';
const PUSH_TOKEN_DOC_ID_KEY = 'push_token_doc_id';

// Add push_tokens collection to your COLLECTIONS if not already
const PUSH_TOKENS_COLLECTION = 'push_tokens';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class ExpoPushTokenManager {
  /**
   * Initialize and get Expo Push Token
   * Call this when user logs in
   */
  static async initializeToken(userId?: string): Promise<string | null> {
    try {
      // Check permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return null;
      }

      // Get Expo Push Token (works for both iOS and Android)
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('EAS Project ID not found. Make sure you have configured EAS.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;

      // Save token locally
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);

      // Save token to Appwrite for server-side notifications
      if (userId) {
        await this.saveTokenToAppwrite(userId, token);
      }

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      return token;
    } catch (error) {
      console.error('Failed to initialize Expo push token:', error);
      return null;
    }
  }

  /**
   * Save push token to Appwrite database
   */
  private static async saveTokenToAppwrite(userId: string, token: string): Promise<void> {
    try {
      const storedDocId = await AsyncStorage.getItem(PUSH_TOKEN_DOC_ID_KEY);
      
      // Try to update existing document first (most common case)
      if (storedDocId) {
        try {
          await databases.updateDocument(DB_ID, PUSH_TOKENS_COLLECTION, storedDocId, {
            token,
            updatedAt: new Date().toISOString(),
            active: true,
          });
          return;
        } catch (err) {
          // Document might not exist anymore, create new one
          await AsyncStorage.removeItem(PUSH_TOKEN_DOC_ID_KEY);
        }
      }

      // Create new document with unique ID based on userId + deviceId
      // This avoids duplicate entries per device
      const docId = `${userId}_${Platform.OS}`.substring(0, 36);
      
      try {
        // Try to update if exists
        await databases.updateDocument(DB_ID, PUSH_TOKENS_COLLECTION, docId, {
          token,
          updatedAt: new Date().toISOString(),
          active: true,
        });
        await AsyncStorage.setItem(PUSH_TOKEN_DOC_ID_KEY, docId);
      } catch (updateErr) {
        // Document doesn't exist, create it
        try {
          const doc = await databases.createDocument(
            DB_ID,
            PUSH_TOKENS_COLLECTION,
            docId,
            {
              userId,
              token,
              deviceId: Platform.OS,
              active: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            [
              Permission.read(Role.user(userId)),
              Permission.update(Role.user(userId)),
              Permission.delete(Role.user(userId)),
            ]
          );
          await AsyncStorage.setItem(PUSH_TOKEN_DOC_ID_KEY, doc.$id);
        } catch (createErr: any) {
          // Collection might not exist - silently fail
        }
      }
    } catch (error) {
      // Silently fail - token still works locally
    }
  }

  /**
   * Get stored Expo Push Token
   */
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear token (call on logout)
   */
  static async clearToken(): Promise<void> {
    try {
      // Deactivate token in Appwrite
      const storedDocId = await AsyncStorage.getItem(PUSH_TOKEN_DOC_ID_KEY);
      if (storedDocId) {
        try {
          await databases.updateDocument(DB_ID, PUSH_TOKENS_COLLECTION, storedDocId, {
            active: false,
          });
        } catch (err) {
          // Silently fail
        }
      }
      
      await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
      await AsyncStorage.removeItem(PUSH_TOKEN_DOC_ID_KEY);
    } catch (error) {
      // Silently fail
    }
  }
}

/**
 * Send push notification using Expo's push notification service
 * This can be called from a server or using the Expo Push API directly
 */
export async function sendExpoPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notification to multiple tokens
 */
export async function sendExpoPushNotifications(
  expoPushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const messages = expoPushTokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Push notifications sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notifications:', error);
    throw error;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger?: Notifications.NotificationTriggerInput,
  data?: Record<string, any>
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: trigger || null, // null = immediate
  });
  return id;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/*
HOW TO SEND NOTIFICATIONS:

1. From your app (for testing):
   import { sendExpoPushNotification, ExpoPushTokenManager } from '@/services/expoPushNotifications';
   
   const token = await ExpoPushTokenManager.getToken();
   await sendExpoPushNotification(token, 'Hello!', 'This is a test notification');

2. Using cURL (from terminal):
   curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
     "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
     "title": "Hello!",
     "body": "This is a test notification"
   }'

3. From your backend server:
   POST https://exp.host/--/api/v2/push/send
   Content-Type: application/json
   
   {
     "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
     "title": "Hello!",
     "body": "This is a test notification",
     "data": { "screen": "/room/123" }
   }

EXPO PUSH TOKEN FORMAT:
- Looks like: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
- Unique per device + app installation
- Changes if user reinstalls app

NO FIREBASE/FCM SETUP NEEDED!
Expo handles all the complexity of FCM/APNs behind the scenes.
*/
