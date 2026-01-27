import { account, ID } from '@/lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class FCMTokenManager {
  private static readonly TOKEN_KEY = 'fcm_token';
  private static readonly TARGET_ID_KEY = 'appwrite_push_target_id';

  /**
   * Initialize FCM token for the current user
   * This should be called when user logs in or registers
   */
  static async initializeToken() {
    try {
      // Get current user
      const currentUser = await account.get();

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const request = await Notifications.requestPermissionsAsync();
        if (request.status !== 'granted') {
          console.warn('Push notification permissions not granted');
          return;
        }
      }

      if (Platform.OS === 'web') {
        console.warn('FCM device tokens are not available on web');
        return;
      }

      const tokenData = await Notifications.getDevicePushTokenAsync();
      
      const token = tokenData.data;
      
      if (!token) {
        console.warn('No FCM token available');
        return;
      }

      // Save token locally
      await AsyncStorage.setItem(this.TOKEN_KEY, token);

      // Log token for debugging - COPY THIS TOKEN TO SEND NOTIFICATIONS
      console.log('='.repeat(60));
      console.log('FCM PUSH TOKEN (copy this to send notifications):');
      console.log(token);
      console.log('='.repeat(60));

      await this.upsertAppwritePushTarget(currentUser.$id, token);

      console.log('FCM token initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FCM token:', error);
    }
  }

  /**
   * Save FCM token to Appwrite FCM Tokens collection
   */
  private static async upsertAppwritePushTarget(userId: string, token: string) {
    try {
      const providerId = process.env.EXPO_PUBLIC_APPWRITE_FCM_PROVIDER_ID;

      const storedTargetId = await AsyncStorage.getItem(this.TARGET_ID_KEY);
      if (storedTargetId) {
        try {
          await account.updatePushTarget({
            targetId: storedTargetId,
            identifier: token,
          });
          return;
        } catch {
          await AsyncStorage.removeItem(this.TARGET_ID_KEY);
        }
      }

      const created = await account.createPushTarget({
        targetId: ID.unique(),
        identifier: token,
        ...(providerId ? { providerId } : {}),
      });

      await AsyncStorage.setItem(this.TARGET_ID_KEY, created.$id);
    } catch (error) {
      console.error('Failed to upsert Appwrite push target:', error);
    }
  }

  /**
   * Get stored FCM token
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get stored FCM token:', error);
      return null;
    }
  }

  /**
   * Clear FCM token (when user logs out)
   */
  static async clearToken() {
    try {
      const targetId = await AsyncStorage.getItem(this.TARGET_ID_KEY);

      if (targetId) {
        await account.deletePushTarget({ targetId });
      }

      await AsyncStorage.removeItem(this.TOKEN_KEY);
      await AsyncStorage.removeItem(this.TARGET_ID_KEY);
    } catch (error) {
      console.error('Failed to clear FCM token:', error);
    }
  }

  /**
   * Get stored FCM token
   */
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }
}

// How FCM Tokens Work in Mobile Apps:

/*
1. TOKEN GENERATION:
   - When your app starts, Expo generates a unique FCM token
   - This token is different for each device/app installation
   - Tokens can change (app updates, OS updates, etc.)

2. TOKEN STORAGE:
   - Tokens are stored in Appwrite's FCM Tokens collection
   - Each user can have multiple tokens (multiple devices)
   - Tokens are linked to userId for targeting

3. PLATFORM DIFFERENCES:
   - Web: Uses web push tokens (different format)
   - Mobile: Uses FCM tokens (Android/iOS)
   - Your image shows "web" tokens because they're from web browsers

4. TOKEN LIFECYCLE:
   - Generate on app start/login
   - Save to Appwrite with user info
   - Update if token changes
   - Deactivate on logout

5. SENDING NOTIFICATIONS:
   - Appwrite uses FCM tokens to send push notifications
   - Must have valid FCM tokens for mobile devices
   - Web tokens work differently (web push API)

USAGE:
1. Call FCMTokenManager.initializeToken() when user logs in
2. Call FCMTokenManager.clearToken() when user logs out
3. Appwrite will automatically use the tokens for push notifications
*/
