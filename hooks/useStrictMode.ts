// useStrictMode.ts - Place this in a separate file like hooks/useStrictMode.ts

import { registerForPushNotificationsAsync } from '@/utils/registerPushNotifications';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus, BackHandler } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Custom hook to enforce strict mode during focus sessions
 * Prevents users from leaving the app when timer is running in focus mode
 * Sends notifications if user force quits and blocks in-app navigation
 */
export const useStrictMode = (
  strictMode: boolean,
  isTimerRunning: boolean,
  timerState: 'focus' | 'break' | 'idle',
  onForceStop?: () => void
) => {
  const appState = useRef(AppState.currentState);
  const hasShownWarning = useRef(false);
  const notificationId = useRef<string | null>(null);

  // Check if strict mode should be enforced
  const isStrictModeActive = strictMode && isTimerRunning && timerState === 'focus';

  // Request notification permissions on mount
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
        // In a real app, you would send this token to your backend
    });
  }, []);

  // Handle hardware back button (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isStrictModeActive) {
          // Show warning alert
          Alert.alert(
            '🔒 Strict Mode Active',
            'You cannot exit the app during a focus session. Complete your focus time or stop the timer first.',
            [
              {
                text: 'Stay Focused',
                style: 'cancel',
              },
              {
                text: 'Force Stop Timer',
                style: 'destructive',
                onPress: () => {
                  Alert.alert(
                    'Stop Timer?',
                    'Are you sure you want to stop your focus session? Your progress will be lost.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Stop Timer',
                        style: 'destructive',
                        onPress: () => {
                          onForceStop?.();
                          // Allow exit after stopping
                          BackHandler.exitApp();
                        },
                      },
                    ]
                  );
                },
              },
            ],
            { cancelable: false }
          );
          return true; // Prevent default back behavior
        }
        return false; // Allow back navigation
      }
    );

    return () => backHandler.remove();
  }, [isStrictModeActive, onForceStop]);

  // Handle app state changes (minimize/background)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        // User is trying to background the app
        if (
          appState.current === 'active' &&
          nextAppState.match(/inactive|background/) &&
          isStrictModeActive
        ) {
          // Send immediate local notification
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "⚠️ Come Back!",
              body: "Strict Mode is active! Return to your focus session immediately.",
              data: { type: "strict_mode_warning" },
            },
            trigger: null, // Immediate
          });

          if (!hasShownWarning.current) {
            // Set flag to prevent multiple warnings
            hasShownWarning.current = true;

            // Show warning when app comes back to foreground
            setTimeout(() => {
              if (isStrictModeActive) {
                Alert.alert(
                  '⚠️ Focus Session Active',
                  'Strict Mode is enabled. Minimizing the app during focus time is discouraged. Stay focused!',
                  [{ text: 'OK', onPress: () => (hasShownWarning.current = false) }]
                );
              }
            }, 100);
          }
        }

        // Reset warning flag when app becomes active
        if (nextAppState === 'active') {
          hasShownWarning.current = false;
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isStrictModeActive]);

  return {
    isStrictModeActive,
    canExit: !isStrictModeActive,
  };
};

/**
 * Example usage in your main Timer component:
 */
/*
const TimerScreen = () => {
  const [strictMode, setStrictMode] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerState, setTimerState] = useState<'focus' | 'break' | 'idle'>('idle');
  
  // Use the strict mode hook
  const { isStrictModeActive } = useStrictMode(
    strictMode,
    isTimerRunning,
    timerState,
    () => {
      // Force stop callback
      setIsTimerRunning(false);
      setTimerState('idle');
    }
  );

  // Show indicator when strict mode is active
  return (
    <View>
      {isStrictModeActive && (
        <View style={styles.strictModeIndicator}>
          <Text style={styles.strictModeText}>
            🔒 Strict Mode - Cannot exit during focus
          </Text>
        </View>
      )}
      
      <TimerSettings
        strictMode={strictMode}
        setStrictMode={setStrictMode}
        // ... other props
      />
      
      // ... rest of your timer UI
    </View>
  );
};

const styles = StyleSheet.create({
  strictModeIndicator: {
    backgroundColor: '#ef4444',
    padding: 12,
    alignItems: 'center',
  },
  strictModeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
*/
