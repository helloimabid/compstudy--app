import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/registerPushNotifications';

const HAS_LAUNCHED_KEY = 'has_launched_before';

export function useInitialNotificationPermission() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED_KEY);
        
        if (hasLaunched === null) {
          // First time launch
          setIsFirstLaunch(true);
          
          // Request permissions immediately
          await registerForPushNotificationsAsync();
          
          // Mark as launched
          await AsyncStorage.setItem(HAS_LAUNCHED_KEY, 'true');
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
      }
    }

    checkFirstLaunch();
  }, []);

  return isFirstLaunch;
}
