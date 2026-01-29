import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';

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

interface OTAUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isAvailable: boolean;
  downloadProgress: number;
  error: string | null;
}

export function useOTAUpdates() {
  const [updateState, setUpdateState] = useState<OTAUpdateState>({
    isChecking: false,
    isDownloading: false,
    isAvailable: false,
    downloadProgress: 0,
    error: null,
  });

  const checkForUpdates = useCallback(async (showAlert = false) => {
    try {
      // Skip in development mode
      if (__DEV__) {
        if (showAlert) {
          Alert.alert("Development Mode", "OTA updates are disabled in development.");
        }
        return;
      }

      setUpdateState(prev => ({ ...prev, isChecking: true, error: null }));

      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setUpdateState(prev => ({ ...prev, isAvailable: true, isChecking: false }));
        
        if (showAlert) {
          Alert.alert(
            "Update Available",
            "A new version is available. Would you like to download it now?",
            [
              { text: "Later", style: "cancel" },
              { text: "Download", onPress: downloadAndApplyUpdate },
            ]
          );
        } else {
          // Auto-download in background
          await downloadAndApplyUpdate();
        }
      } else {
        setUpdateState(prev => ({ ...prev, isChecking: false }));
        if (showAlert) {
          Alert.alert("No Updates", "You're running the latest version!");
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.log("OTA Update check failed:", errorMessage);
      setUpdateState(prev => ({ ...prev, isChecking: false, error: errorMessage }));
    }
  }, []);

  const downloadAndApplyUpdate = useCallback(async () => {
    try {
      setUpdateState(prev => ({ ...prev, isDownloading: true }));

      await Updates.fetchUpdateAsync();
      
      setUpdateState(prev => ({ ...prev, isDownloading: false, downloadProgress: 100 }));

      // Show notification to restart
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Update Ready",
          body: "A new version has been downloaded. Tap to restart and apply the update.",
          data: { type: "ota_update" },
        },
        trigger: null,
      });

      // Also show an in-app alert
      Alert.alert(
        "Update Downloaded",
        "The update has been downloaded. Restart the app to apply changes?",
        [
          { text: "Later", style: "cancel" },
          { 
            text: "Restart Now", 
            onPress: async () => {
              await Updates.reloadAsync();
            }
          },
        ]
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Download failed";
      console.log("OTA Update download failed:", errorMessage);
      setUpdateState(prev => ({ ...prev, isDownloading: false, error: errorMessage }));
      
      Alert.alert(
        "Download Failed",
        "Failed to download the update. Please try again later."
      );
    }
  }, []);

  // Check for updates on mount
  useEffect(() => {
    // Initial check with slight delay to not block app startup
    const initialTimeout = setTimeout(() => {
      checkForUpdates(false);
    }, 3000);

    return () => clearTimeout(initialTimeout);
  }, [checkForUpdates]);

  // Check for updates when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check for updates when app becomes active, but not too frequently
        checkForUpdates(false);
      }
    });

    return () => subscription.remove();
  }, [checkForUpdates]);

  // Handle notification tap to apply update
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.type === "ota_update") {
        Updates.reloadAsync();
      }
    });

    return () => subscription.remove();
  }, []);

  return {
    ...updateState,
    checkForUpdates,
    applyUpdate: async () => {
      await Updates.reloadAsync();
    },
  };
}
