import { databases, DB_ID } from '@/lib/appwrite';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Linking, Platform } from 'react-native';

const APP_CONFIG_COLLECTION = 'app_config';
const APP_CONFIG_DOC_ID = 'version_control';

interface VersionConfig {
  minVersion: string;
  latestVersion: string;
  updateUrl: string;
  updateMessage?: string;
  forceUpdate: boolean;
}

/**
 * Compare two version strings (e.g., "1.0.0" vs "1.1.0")
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      // Get current app version
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      
      // Fetch version config from Appwrite
      const config = await databases.getDocument(
        DB_ID,
        APP_CONFIG_COLLECTION,
        APP_CONFIG_DOC_ID
      ) as unknown as VersionConfig;

      const needsUpdate = compareVersions(currentVersion, config.minVersion) < 0;
      const updateExists = compareVersions(currentVersion, config.latestVersion) < 0;

      if (needsUpdate && config.forceUpdate) {
        // Force update - user must update to continue
        setIsForceUpdate(true);
        setUpdateAvailable(true);
        showForceUpdateAlert(config);
      } else if (updateExists) {
        // Optional update available
        setUpdateAvailable(true);
        showOptionalUpdateAlert(config);
      }
    } catch (error) {
      // Config doesn't exist or network error - silently continue
    }
  };

  const showForceUpdateAlert = (config: VersionConfig) => {
    Alert.alert(
      '🚀 Update Required',
      config.updateMessage || 'A new version of CompStudy is available with important updates. Please update to continue using the app.',
      [
        {
          text: 'Update Now',
          onPress: () => openUpdateUrl(config.updateUrl),
        },
      ],
      { cancelable: false }
    );

    // Prevent back button on Android
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', () => true);
    }
  };

  const showOptionalUpdateAlert = (config: VersionConfig) => {
    Alert.alert(
      '✨ Update Available',
      config.updateMessage || 'A new version of CompStudy is available with exciting new features!',
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: () => openUpdateUrl(config.updateUrl),
        },
      ]
    );
  };

  const openUpdateUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open update link. Please update manually from APKPure.');
    });
  };

  return { updateAvailable, isForceUpdate, checkForUpdate };
}
