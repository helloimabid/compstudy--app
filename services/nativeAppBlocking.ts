import { Alert, Linking, NativeModules, Platform } from 'react-native';

interface AppBlockingModuleInterface {
  hasUsageStatsPermission(): Promise<boolean>;
  hasOverlayPermission(): Promise<boolean>;
  openUsageStatsSettings(): void;
  openOverlaySettings(): void;
  setBlockedApps(apps: string[]): Promise<boolean>;
  setBlockingEnabled(enabled: boolean): Promise<boolean>;
  getBlockingStatus(): Promise<{
    enabled: boolean;
    blockedApps: string[];
  }>;
}

// Check if native module is available
const isNativeModuleAvailable = (): boolean => {
  if (Platform.OS !== 'android') return false;
  const module = NativeModules.AppBlockingModule;
  console.log('[AppBlocking] Native module available:', !!module);
  return !!module;
};

// Default app package names for common distracting apps
export const COMMON_BLOCKED_APPS = {
  social: [
    'com.instagram.android',
    'com.facebook.katana',
    'com.facebook.orca', // Messenger
    'com.twitter.android',
    'com.zhiliaoapp.musically', // TikTok
    'com.snapchat.android',
    'com.linkedin.android',
    'com.pinterest',
    'com.reddit.frontpage',
    'com.tumblr',
  ],
  messaging: [
    'com.whatsapp',
    'org.telegram.messenger',
    'com.discord',
    'com.Slack',
    'com.viber.voip',
    'jp.naver.line.android',
    'com.imo.android.imoim',
  ],
  entertainment: [
    'com.google.android.youtube',
    'com.netflix.mediaclient',
    'com.amazon.avod.thirdpartyclient',
    'com.hulu.plus',
    'com.disney.disneyplus',
    'com.spotify.music',
    'com.zhiliaoapp.musically',
  ],
  gaming: [
    'com.supercell.clashofclans',
    'com.supercell.clashroyale',
    'com.mojang.minecraftpe',
    'com.kiloo.subwaysurf',
    'com.king.candycrushsaga',
    'com.pubg.krmobile',
    'com.tencent.ig',
    'com.mobile.legends',
  ],
  shopping: [
    'com.amazon.mShop.android.shopping',
    'com.flipkart.android',
    'com.ebay.mobile',
    'com.alibaba.aliexpresshd',
    'com.shopee.id',
  ],
  news: [
    'com.twitter.android',
    'com.google.android.apps.magazines',
    'flipboard.app',
    'com.nytimes.android',
  ],
};

// Flatten all apps into a single array
export const ALL_BLOCKED_APPS = Object.values(COMMON_BLOCKED_APPS).flat();

// Get the native module (only available on Android)
const AppBlockingNative: AppBlockingModuleInterface | null = 
  Platform.OS === 'android' ? NativeModules.AppBlockingModule : null;

export const AppBlockingModule = {
  /**
   * Check if the app has permission to access usage stats
   */
  async hasUsageStatsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    
    // If native module not available, use fallback
    if (!isNativeModuleAvailable()) {
      console.log('[AppBlocking] Native module not available, cannot check usage stats');
      return false;
    }
    
    try {
      const result = await NativeModules.AppBlockingModule.hasUsageStatsPermission();
      console.log('[AppBlocking] Usage stats permission:', result);
      return result;
    } catch (error) {
      console.error('[AppBlocking] Error checking usage stats permission:', error);
      return false;
    }
  },

  /**
   * Check if the app has permission to draw overlays
   */
  async hasOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    
    if (!isNativeModuleAvailable()) {
      console.log('[AppBlocking] Native module not available, cannot check overlay');
      return false;
    }
    
    try {
      const result = await NativeModules.AppBlockingModule.hasOverlayPermission();
      console.log('[AppBlocking] Overlay permission:', result);
      return result;
    } catch (error) {
      console.error('[AppBlocking] Error checking overlay permission:', error);
      return false;
    }
  },

  /**
   * Check if all required permissions are granted
   */
  async hasAllPermissions(): Promise<{
    hasUsageStats: boolean;
    hasOverlay: boolean;
    allGranted: boolean;
  }> {
    const hasUsageStats = await this.hasUsageStatsPermission();
    const hasOverlay = await this.hasOverlayPermission();
    return {
      hasUsageStats,
      hasOverlay,
      allGranted: hasUsageStats && hasOverlay,
    };
  },

  /**
   * Open the usage stats settings screen
   */
  openUsageStatsSettings(): void {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'This feature is only available on Android.');
      return;
    }
    
    // Try native module first
    if (isNativeModuleAvailable()) {
      try {
        NativeModules.AppBlockingModule.openUsageStatsSettings();
        return;
      } catch (error) {
        console.error('[AppBlocking] Error opening usage stats settings via native:', error);
      }
    }
    
    // Fallback: Open settings via Intent URL
    console.log('[AppBlocking] Using fallback to open usage stats settings');
    Linking.openSettings().catch(() => {
      Alert.alert(
        'Open Settings Manually',
        'Please go to Settings > Apps > Special app access > Usage access and enable CompStudy.',
        [{ text: 'OK' }]
      );
    });
  },

  /**
   * Open the overlay permission settings screen
   */
  openOverlaySettings(): void {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'This feature is only available on Android.');
      return;
    }
    
    // Try native module first
    if (isNativeModuleAvailable()) {
      try {
        NativeModules.AppBlockingModule.openOverlaySettings();
        return;
      } catch (error) {
        console.error('[AppBlocking] Error opening overlay settings via native:', error);
      }
    }
    
    // Fallback: Open settings via Intent URL
    console.log('[AppBlocking] Using fallback to open overlay settings');
    Linking.openSettings().catch(() => {
      Alert.alert(
        'Open Settings Manually',
        'Please go to Settings > Apps > Special app access > Display over other apps and enable CompStudy.',
        [{ text: 'OK' }]
      );
    });
  },

  /**
   * Set the list of apps to block
   */
  async setBlockedApps(apps: string[]): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    
    if (!isNativeModuleAvailable()) {
      console.log('[AppBlocking] Native module not available for setBlockedApps');
      return false;
    }
    
    try {
      return await NativeModules.AppBlockingModule.setBlockedApps(apps);
    } catch (error) {
      console.error('[AppBlocking] Error setting blocked apps:', error);
      return false;
    }
  },

  /**
   * Enable or disable app blocking
   */
  async setBlockingEnabled(enabled: boolean): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    
    if (!isNativeModuleAvailable()) {
      console.log('[AppBlocking] Native module not available for setBlockingEnabled');
      Alert.alert(
        'Native Module Not Available',
        'The app blocking native module is not loaded. Please rebuild the app with:\n\nnpx expo run:android',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    try {
      return await NativeModules.AppBlockingModule.setBlockingEnabled(enabled);
    } catch (error) {
      console.error('[AppBlocking] Error setting blocking enabled:', error);
      return false;
    }
  },

  /**
   * Get the current blocking status
   */
  async getBlockingStatus(): Promise<{
    enabled: boolean;
    blockedApps: string[];
  }> {
    if (Platform.OS !== 'android') {
      return { enabled: false, blockedApps: [] };
    }
    
    if (!isNativeModuleAvailable()) {
      return { enabled: false, blockedApps: [] };
    }
    
    try {
      return await NativeModules.AppBlockingModule.getBlockingStatus();
    } catch (error) {
      console.error('[AppBlocking] Error getting blocking status:', error);
      return { enabled: false, blockedApps: [] };
    }
  },

  /**
   * Check if app blocking is supported on this platform
   */
  isSupported(): boolean {
    return Platform.OS === 'android';
  },
  
  /**
   * Check if native module is loaded (requires rebuild)
   */
  isNativeModuleLoaded(): boolean {
    return isNativeModuleAvailable();
  },

  /**
   * Get friendly names for app categories
   */
  getAppCategories(): { id: string; name: string; apps: string[] }[] {
    return [
      { id: 'social', name: 'Social Media', apps: COMMON_BLOCKED_APPS.social },
      { id: 'messaging', name: 'Messaging', apps: COMMON_BLOCKED_APPS.messaging },
      { id: 'entertainment', name: 'Entertainment', apps: COMMON_BLOCKED_APPS.entertainment },
      { id: 'gaming', name: 'Gaming', apps: COMMON_BLOCKED_APPS.gaming },
      { id: 'shopping', name: 'Shopping', apps: COMMON_BLOCKED_APPS.shopping },
      { id: 'news', name: 'News', apps: COMMON_BLOCKED_APPS.news },
    ];
  },
};

export default AppBlockingModule;
