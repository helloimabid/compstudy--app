import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

// Ensure notifications are handled even if app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useOTAUpdates() {
  useEffect(() => {
    async function checkUpdates() {
      try {
        if (__DEV__) return;

        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Update Available",
              body: "A new version has been downloaded. Tap to restart.",
              data: { type: "ota_update" },
            },
            trigger: null,
          });
        }
      } catch (e) {
        console.log("OTA Update check failed:", e);
      }
    }

    checkUpdates();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.type === "ota_update") {
        Updates.reloadAsync();
      }
    });

    return () => subscription.remove();
  }, []);
}
