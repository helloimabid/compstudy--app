import appBlockingService, {
    AppBlockingSettings,
    COMMON_DISTRACTING_APPS,
} from "@/services/appBlockingService";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    AppState,
    AppStateStatus,
    Linking,
    Platform,
    Vibration,
} from "react-native";

// Configure notification handler for immediate display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UseAppBlockingOptions {
  timerState: "focus" | "break" | "idle";
  isTimerRunning: boolean;
  onViolation?: () => void;
}

interface UseAppBlockingReturn {
  settings: AppBlockingSettings;
  isBlocking: boolean;
  blockReason: string;
  violationCount: number;
  showBlockOverlay: boolean;
  dismissOverlay: () => void;
  updateSettings: (updates: Partial<AppBlockingSettings>) => Promise<void>;
  toggleApp: (appId: string) => Promise<void>;
  selectCategory: (category: string, selected: boolean) => Promise<void>;
  openSystemFocusSettings: () => void;
  getAppsByCategory: () => Record<string, typeof COMMON_DISTRACTING_APPS>;
  violationStats: {
    total: number;
    today: number;
    thisWeek: number;
    returnRate: number;
  };
  refreshStats: () => Promise<void>;
}

export function useAppBlocking({
  timerState,
  isTimerRunning,
  onViolation,
}: UseAppBlockingOptions): UseAppBlockingReturn {
  const [settings, setSettings] = useState<AppBlockingSettings>({
    enabled: false,
    blockedApps: [],
    blockDuringFocus: true,
    blockDuringBreak: false,
    customBlockSchedule: {
      enabled: false,
      startTime: "09:00",
      endTime: "17:00",
      days: [1, 2, 3, 4, 5],
    },
    showWarningOnLeave: true,
    warningMessage: "Stay focused! You can check this app after your session.",
    strictBlocking: true,
  });

  const [isBlocking, setIsBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [showBlockOverlay, setShowBlockOverlay] = useState(false);
  const [violationStats, setViolationStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    returnRate: 100,
  });

  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const hasShownWarning = useRef(false);
  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize settings
  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await appBlockingService.getSettings();
      setSettings(savedSettings);
      await refreshStats();
    };
    loadSettings();
  }, []);

  // Update blocking state when timer or settings change
  useEffect(() => {
    const { blocked, reason } = appBlockingService.shouldBlockNow(timerState);
    setIsBlocking(blocked && settings.enabled);
    setBlockReason(reason);
  }, [timerState, isTimerRunning, settings]);

  // Send repeated reminder notifications while user is away
  const startReminderNotifications = useCallback(async () => {
    // Clear any existing interval
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }

    // Send first notification immediately
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚫 Come Back! Focus Mode Active",
        body: settings.warningMessage || "You left during a focus session. Return to CompStudy!",
        data: { type: "app_blocking_warning" },
        sound: true,
      },
      trigger: null,
    });

    // Vibrate pattern
    Vibration.vibrate([100, 200, 100, 200, 100, 200]);

    // Send reminder every 30 seconds while away
    reminderIntervalRef.current = setInterval(async () => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Your Focus Session is Waiting!",
          body: "Don't break your streak! Return to CompStudy now.",
          data: { type: "app_blocking_reminder" },
          sound: true,
        },
        trigger: null,
      });
      Vibration.vibrate([100, 100, 100]);
    }, 30000);
  }, [settings.warningMessage]);

  const stopReminderNotifications = useCallback(() => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        // User is leaving the app
        if (
          appState.current === "active" &&
          nextAppState.match(/inactive|background/)
        ) {
          backgroundTime.current = Date.now();

          if (isBlocking && settings.enabled) {
            // Log violation
            await appBlockingService.logViolation(
              timerState === "focus" ? "focus" : timerState === "break" ? "break" : "scheduled"
            );
            setViolationCount((prev) => prev + 1);

            // Start sending reminder notifications
            if (settings.showWarningOnLeave) {
              startReminderNotifications();
            }

            onViolation?.();
          }
        }

        // User is returning to the app
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // Stop reminder notifications
          stopReminderNotifications();

          // Calculate time spent away
          const timeAway = backgroundTime.current
            ? Date.now() - backgroundTime.current
            : 0;
          backgroundTime.current = null;

          if (isBlocking && settings.enabled && settings.strictBlocking) {
            // Show return overlay if they were away for more than 2 seconds
            if (timeAway > 2000 && !hasShownWarning.current) {
              hasShownWarning.current = true;
              setShowBlockOverlay(true);

              // Mark violation as returned
              await appBlockingService.markViolationReturned();

              // Vibrate to indicate they're back
              Vibration.vibrate([200, 100, 200]);

              // Auto-dismiss overlay after showing
              setTimeout(() => {
                hasShownWarning.current = false;
              }, 5000);
            }
          }

          await refreshStats();
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
      stopReminderNotifications();
    };
  }, [isBlocking, settings, timerState, onViolation, startReminderNotifications, stopReminderNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReminderNotifications();
    };
  }, [stopReminderNotifications]);

  const refreshStats = useCallback(async () => {
    const stats = await appBlockingService.getViolationStats();
    setViolationStats(stats);
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<AppBlockingSettings>) => {
      const newSettings = await appBlockingService.updateSettings(updates);
      setSettings(newSettings);
    },
    []
  );

  const toggleApp = useCallback(async (appId: string) => {
    const newBlockedApps = await appBlockingService.toggleApp(appId);
    setSettings((prev) => ({ ...prev, blockedApps: newBlockedApps }));
  }, []);

  const selectCategory = useCallback(
    async (category: string, selected: boolean) => {
      const newBlockedApps = await appBlockingService.selectCategory(
        category,
        selected
      );
      setSettings((prev) => ({ ...prev, blockedApps: newBlockedApps }));
    },
    []
  );

  const dismissOverlay = useCallback(() => {
    setShowBlockOverlay(false);
  }, []);

  const openSystemFocusSettings = useCallback(() => {
    if (Platform.OS === "android") {
      // Open Digital Wellbeing or Focus mode settings
      Linking.openSettings().catch(() => {
        Alert.alert(
          "Settings",
          "Please enable Focus Mode or Digital Wellbeing in your device settings for enhanced app blocking."
        );
      });
    } else if (Platform.OS === "ios") {
      // On iOS, we can only open app settings
      Linking.openURL("app-settings:").catch(() => {
        Alert.alert(
          "Settings",
          "Please enable Focus Mode in iOS Settings > Focus for enhanced app blocking."
        );
      });
    }
  }, []);

  const getAppsByCategory = useCallback(() => {
    return appBlockingService.getAppsByCategory();
  }, []);

  return {
    settings,
    isBlocking,
    blockReason,
    violationCount,
    showBlockOverlay,
    dismissOverlay,
    updateSettings,
    toggleApp,
    selectCategory,
    openSystemFocusSettings,
    getAppsByCategory,
    violationStats,
    refreshStats,
  };
}

export default useAppBlocking;
