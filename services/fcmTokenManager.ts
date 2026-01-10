import { account, databases, DB_ID, ID } from '@/lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export class FCMTokenManager {
  private static readonly TOKEN_KEY = 'fcm_token';

  /**
   * Initialize FCM token for the current user
   * This should be called when user logs in or registers
   */
  static async initializeToken() {
    try {
      // Get current user
      const currentUser = await account.get();
      
      // Get FCM token from expo-notifications
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'b8a1785f-2be9-4b89-bb99-85d4d12e5557'
      });
      
      const token = tokenData.data;
      
      if (!token) {
        console.warn('No FCM token available');
        return;
      }

      // Save token locally
      await AsyncStorage.setItem(this.TOKEN_KEY, token);

      // Save token to Appwrite FCM Tokens collection
      await this.saveTokenToAppwrite(currentUser.$id, token);

      console.log('FCM token initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FCM token:', error);
    }
  }

  /**
   * Save FCM token to Appwrite FCM Tokens collection
   */
  static async saveTokenToAppwrite(userId: string, token: string) {
    try {
      // Check if token already exists for this user
      const existingTokens = await databases.listDocuments(
        DB_ID,
        'fcm_tokens', // This should be your FCM tokens collection name
        [
          // Query to check if token exists for this user
        ]
      );

      // If token doesn't exist, create new one
      if (existingTokens.total === 0) {
        await databases.createDocument(
          DB_ID,
          'fcm_tokens', // Collection name
          ID.unique(),
          {
            userId: userId,
            token: token,
            platform: 'mobile', // This will be 'android' or 'ios'
            userAgent: 'Expo Go', // or your custom app name
            createdAt: new Date().toISOString(),
            isActive: true
          }
        );
      } else {
        // Update existing token
        const existingToken = existingTokens.documents[0];
        await databases.updateDocument(
          DB_ID,
          'fcm_tokens',
          existingToken.$id,
          {
            token: token,
            isActive: true,
            updatedAt: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Failed to save FCM token to Appwrite:', error);
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
      await AsyncStorage.removeItem(this.TOKEN_KEY);
      
      // Optionally deactivate token in Appwrite
      const currentUser = await account.get();
      const token = await this.getStoredToken();
      
      if (token) {
        const existingTokens = await databases.listDocuments(
          DB_ID,
          'fcm_tokens',
          [
            // Query to find user's token
          ]
        );
        
        if (existingTokens.total > 0) {
          await databases.updateDocument(
            DB_ID,
            'fcm_tokens',
            existingTokens.documents[0].$id,
            { isActive: false }
          );
        }
      }
    } catch (error) {
      console.error('Failed to clear FCM token:', error);
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
