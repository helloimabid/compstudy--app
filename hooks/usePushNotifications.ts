import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const usePushNotifications = () => {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received:', response);
      // Handle notification tap here
      // You can navigate to a specific screen based on the notification data
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Navigate to the screen specified in the notification
        // router.push(data.screen);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
    
    if (Platform.OS === 'android') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }

    return false;
  };

  const getPushToken = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Push notification permissions not granted');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'b8a1785f-2be9-4b89-bb99-85d4d12e5557', // Your EAS project ID
      });

      console.log('Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      throw error;
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: trigger || null, // null means immediate
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  };

  const cancelScheduledNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
      throw error;
    }
  };

  const getBadgeCount = async () => {
    return await Notifications.getBadgeCountAsync();
  };

  const setBadgeCount = async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  };

  const clearBadgeCount = async () => {
    await Notifications.setBadgeCountAsync(0);
  };

  return {
    requestPermissions,
    getPushToken,
    scheduleLocalNotification,
    cancelScheduledNotification,
    getBadgeCount,
    setBadgeCount,
    clearBadgeCount,
  };
};
