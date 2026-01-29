import AsyncStorage from "@react-native-async-storage/async-storage";

// Common distracting apps by package name (Android) and bundle ID patterns
export const COMMON_DISTRACTING_APPS = [
  // Social Media
  { id: "instagram", name: "Instagram", icon: "📸", category: "Social Media" },
  { id: "facebook", name: "Facebook", icon: "📘", category: "Social Media" },
  { id: "twitter", name: "Twitter/X", icon: "🐦", category: "Social Media" },
  { id: "tiktok", name: "TikTok", icon: "🎵", category: "Social Media" },
  { id: "snapchat", name: "Snapchat", icon: "👻", category: "Social Media" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", category: "Social Media" },
  { id: "reddit", name: "Reddit", icon: "🤖", category: "Social Media" },
  { id: "pinterest", name: "Pinterest", icon: "📌", category: "Social Media" },
  { id: "threads", name: "Threads", icon: "🧵", category: "Social Media" },
  { id: "discord", name: "Discord", icon: "💬", category: "Social Media" },
  
  // Messaging
  { id: "whatsapp", name: "WhatsApp", icon: "💚", category: "Messaging" },
  { id: "telegram", name: "Telegram", icon: "✈️", category: "Messaging" },
  { id: "messenger", name: "Messenger", icon: "💙", category: "Messaging" },
  { id: "signal", name: "Signal", icon: "🔵", category: "Messaging" },
  
  // Entertainment
  { id: "youtube", name: "YouTube", icon: "▶️", category: "Entertainment" },
  { id: "netflix", name: "Netflix", icon: "🎬", category: "Entertainment" },
  { id: "spotify", name: "Spotify", icon: "🎧", category: "Entertainment" },
  { id: "twitch", name: "Twitch", icon: "🎮", category: "Entertainment" },
  { id: "primevideo", name: "Prime Video", icon: "📺", category: "Entertainment" },
  
  // Games
  { id: "games", name: "All Games", icon: "🎮", category: "Games" },
  
  // Shopping
  { id: "amazon", name: "Amazon", icon: "📦", category: "Shopping" },
  { id: "ebay", name: "eBay", icon: "🛒", category: "Shopping" },
  
  // News & Reading
  { id: "news", name: "News Apps", icon: "📰", category: "News" },
];

export interface AppBlockingSettings {
  enabled: boolean;
  blockedApps: string[]; // Array of app IDs from COMMON_DISTRACTING_APPS
  blockDuringFocus: boolean;
  blockDuringBreak: boolean;
  customBlockSchedule: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
    days: number[]; // 0-6, Sunday-Saturday
  };
  showWarningOnLeave: boolean;
  warningMessage: string;
  strictBlocking: boolean; // Show overlay when returning from blocked app
}

const DEFAULT_SETTINGS: AppBlockingSettings = {
  enabled: false,
  blockedApps: ["instagram", "facebook", "twitter", "tiktok", "youtube"],
  blockDuringFocus: true,
  blockDuringBreak: false,
  customBlockSchedule: {
    enabled: false,
    startTime: "09:00",
    endTime: "17:00",
    days: [1, 2, 3, 4, 5], // Monday-Friday
  },
  showWarningOnLeave: true,
  warningMessage: "Stay focused! You can check this app after your session.",
  strictBlocking: true,
};

const STORAGE_KEY = "appBlockingSettings";
const VIOLATION_LOG_KEY = "appBlockingViolations";

export interface ViolationLog {
  timestamp: number;
  appId?: string;
  sessionType: "focus" | "break" | "scheduled";
  returned: boolean;
}

class AppBlockingService {
  private settings: AppBlockingSettings = DEFAULT_SETTINGS;
  private violations: ViolationLog[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const [savedSettings, savedViolations] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(VIOLATION_LOG_KEY),
      ]);

      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
      
      if (savedViolations) {
        this.violations = JSON.parse(savedViolations);
        // Keep only last 100 violations
        if (this.violations.length > 100) {
          this.violations = this.violations.slice(-100);
          await this.saveViolations();
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize app blocking service:", error);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  async getSettings(): Promise<AppBlockingSettings> {
    await this.initialize();
    return { ...this.settings };
  }

  async updateSettings(
    updates: Partial<AppBlockingSettings>
  ): Promise<AppBlockingSettings> {
    await this.initialize();
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
    return { ...this.settings };
  }

  async toggleApp(appId: string): Promise<string[]> {
    await this.initialize();
    const index = this.settings.blockedApps.indexOf(appId);
    
    if (index > -1) {
      this.settings.blockedApps.splice(index, 1);
    } else {
      this.settings.blockedApps.push(appId);
    }
    
    await this.saveSettings();
    return [...this.settings.blockedApps];
  }

  async setBlockedApps(appIds: string[]): Promise<void> {
    await this.initialize();
    this.settings.blockedApps = [...appIds];
    await this.saveSettings();
  }

  isAppBlocked(appId: string): boolean {
    return this.settings.blockedApps.includes(appId);
  }

  shouldBlockNow(
    timerState: "focus" | "break" | "idle"
  ): { blocked: boolean; reason: string } {
    if (!this.settings.enabled) {
      return { blocked: false, reason: "App blocking disabled" };
    }

    // Check timer-based blocking
    if (timerState === "focus" && this.settings.blockDuringFocus) {
      return { blocked: true, reason: "Focus session active" };
    }
    
    if (timerState === "break" && this.settings.blockDuringBreak) {
      return { blocked: true, reason: "Break blocking enabled" };
    }

    // Check scheduled blocking
    if (this.settings.customBlockSchedule.enabled) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      if (this.settings.customBlockSchedule.days.includes(currentDay)) {
        const { startTime, endTime } = this.settings.customBlockSchedule;
        if (currentTime >= startTime && currentTime <= endTime) {
          return { blocked: true, reason: "Scheduled block time" };
        }
      }
    }

    return { blocked: false, reason: "No active blocking" };
  }

  async logViolation(
    sessionType: "focus" | "break" | "scheduled",
    appId?: string
  ): Promise<void> {
    await this.initialize();
    
    this.violations.push({
      timestamp: Date.now(),
      appId,
      sessionType,
      returned: false,
    });
    
    await this.saveViolations();
  }

  async markViolationReturned(): Promise<void> {
    await this.initialize();
    
    const lastViolation = this.violations[this.violations.length - 1];
    if (lastViolation && !lastViolation.returned) {
      lastViolation.returned = true;
      await this.saveViolations();
    }
  }

  async getViolationStats(): Promise<{
    total: number;
    today: number;
    thisWeek: number;
    returnRate: number;
  }> {
    await this.initialize();
    
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const today = this.violations.filter((v) => v.timestamp > dayAgo);
    const thisWeek = this.violations.filter((v) => v.timestamp > weekAgo);
    const returned = this.violations.filter((v) => v.returned);

    return {
      total: this.violations.length,
      today: today.length,
      thisWeek: thisWeek.length,
      returnRate:
        this.violations.length > 0
          ? Math.round((returned.length / this.violations.length) * 100)
          : 100,
    };
  }

  async clearViolationLog(): Promise<void> {
    this.violations = [];
    await this.saveViolations();
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error("Failed to save app blocking settings:", error);
    }
  }

  private async saveViolations(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        VIOLATION_LOG_KEY,
        JSON.stringify(this.violations)
      );
    } catch (error) {
      console.error("Failed to save violation log:", error);
    }
  }

  // Get apps grouped by category
  getAppsByCategory(): Record<string, typeof COMMON_DISTRACTING_APPS> {
    return COMMON_DISTRACTING_APPS.reduce(
      (acc, app) => {
        if (!acc[app.category]) {
          acc[app.category] = [];
        }
        acc[app.category].push(app);
        return acc;
      },
      {} as Record<string, typeof COMMON_DISTRACTING_APPS>
    );
  }

  // Select all apps in a category
  async selectCategory(category: string, selected: boolean): Promise<string[]> {
    await this.initialize();
    
    const categoryApps = COMMON_DISTRACTING_APPS.filter(
      (app) => app.category === category
    ).map((app) => app.id);

    if (selected) {
      // Add all apps from category
      const newBlocked = new Set([
        ...this.settings.blockedApps,
        ...categoryApps,
      ]);
      this.settings.blockedApps = Array.from(newBlocked);
    } else {
      // Remove all apps from category
      this.settings.blockedApps = this.settings.blockedApps.filter(
        (id) => !categoryApps.includes(id)
      );
    }

    await this.saveSettings();
    return [...this.settings.blockedApps];
  }
}

export const appBlockingService = new AppBlockingService();
export default appBlockingService;
