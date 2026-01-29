import { Colors } from "@/constants/Colors";
import { useAppBlocking } from "@/hooks/useAppBlocking";
import AppBlockingModule, {
  ALL_BLOCKED_APPS,
} from "@/services/nativeAppBlocking";
import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Info,
  Lock,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  XCircle,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PermissionStatus {
  hasUsageStats: boolean;
  hasOverlay: boolean;
  allGranted: boolean;
}

export default function AppBlockingScreen() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    hasUsageStats: false,
    hasOverlay: false,
    allGranted: false,
  });
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [isNativeBlockingEnabled, setIsNativeBlockingEnabled] = useState(false);
  const [nativeBlockedApps, setNativeBlockedApps] = useState<string[]>([]);
  const [showSetup, setShowSetup] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNativeModuleLoaded, setIsNativeModuleLoaded] = useState(false);

  const isAndroid = Platform.OS === "android";
  const isSupported = AppBlockingModule.isSupported();

  const { settings, updateSettings, openSystemFocusSettings, violationStats } =
    useAppBlocking({
      timerState: "idle",
      isTimerRunning: false,
    });

  // Check permissions on mount and when app comes to foreground
  const checkPermissions = useCallback(async () => {
    if (!isSupported) {
      setIsCheckingPermissions(false);
      return;
    }

    try {
      // Check if native module is loaded
      const moduleLoaded = AppBlockingModule.isNativeModuleLoaded();
      setIsNativeModuleLoaded(moduleLoaded);
      console.log("[AppBlocking] Native module loaded:", moduleLoaded);

      if (!moduleLoaded) {
        setIsCheckingPermissions(false);
        return;
      }

      const status = await AppBlockingModule.hasAllPermissions();
      setPermissions(status);
      setShowSetup(!status.allGranted);

      // Also get blocking status
      const blockingStatus = await AppBlockingModule.getBlockingStatus();
      setIsNativeBlockingEnabled(blockingStatus.enabled);
      setNativeBlockedApps(blockingStatus.blockedApps);
    } catch (error) {
      console.error("Error checking permissions:", error);
    } finally {
      setIsCheckingPermissions(false);
    }
  }, [isSupported]);

  useEffect(() => {
    checkPermissions();

    // Re-check when app comes back to foreground (after user grants permission)
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPermissions();
      }
    });

    return () => subscription.remove();
  }, [checkPermissions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkPermissions();
    setRefreshing(false);
  }, [checkPermissions]);

  // Native app blocking functions
  const handleEnableNativeBlocking = async () => {
    if (!permissions.allGranted) {
      Alert.alert(
        "Permissions Required",
        "Please grant all required permissions first to enable app blocking.",
      );
      return;
    }

    try {
      // Set default blocked apps if none selected
      if (nativeBlockedApps.length === 0) {
        await AppBlockingModule.setBlockedApps(ALL_BLOCKED_APPS);
        setNativeBlockedApps(ALL_BLOCKED_APPS);
      }

      const success = await AppBlockingModule.setBlockingEnabled(true);
      if (success) {
        setIsNativeBlockingEnabled(true);
        Alert.alert(
          "App Blocking Enabled",
          "Distracting apps will now be blocked with a fullscreen overlay when you try to open them.",
        );
      }
    } catch (error) {
      console.error("Error enabling native blocking:", error);
      Alert.alert("Error", "Failed to enable app blocking. Please try again.");
    }
  };

  const handleDisableNativeBlocking = async () => {
    try {
      const success = await AppBlockingModule.setBlockingEnabled(false);
      if (success) {
        setIsNativeBlockingEnabled(false);
      }
    } catch (error) {
      console.error("Error disabling native blocking:", error);
    }
  };

  const handleSelectAllNativeApps = async () => {
    try {
      await AppBlockingModule.setBlockedApps(ALL_BLOCKED_APPS);
      setNativeBlockedApps(ALL_BLOCKED_APPS);
    } catch (error) {
      console.error("Error selecting all apps:", error);
    }
  };

  const handleClearNativeApps = async () => {
    try {
      await AppBlockingModule.setBlockedApps([]);
      setNativeBlockedApps([]);
    } catch (error) {
      console.error("Error clearing apps:", error);
    }
  };

  const handleToggleNativeCategory = async (categoryApps: string[]) => {
    const allSelected = categoryApps.every((app) =>
      nativeBlockedApps.includes(app),
    );

    let newApps: string[];
    if (allSelected) {
      // Remove all apps in this category
      newApps = nativeBlockedApps.filter((app) => !categoryApps.includes(app));
    } else {
      // Add all apps in this category
      newApps = [...new Set([...nativeBlockedApps, ...categoryApps])];
    }

    try {
      await AppBlockingModule.setBlockedApps(newApps);
      setNativeBlockedApps(newApps);
    } catch (error) {
      console.error("Error toggling category:", error);
    }
  };

  const themeColor = "#6366f1"; // Indigo

  // Render rebuild required message when native module not loaded
  const renderRebuildRequired = () => (
    <View style={styles.rebuildCard}>
      <View style={[styles.setupIconBox, { backgroundColor: "#f59e0b20" }]}>
        <AlertTriangle size={32} color="#f59e0b" />
      </View>
      <Text style={styles.rebuildTitle}>Rebuild Required</Text>
      <Text style={styles.rebuildText}>
        The native app blocking module is not loaded. You need to rebuild the
        app with the native code to enable true app blocking.
      </Text>
      <View style={styles.rebuildSteps}>
        <Text style={styles.rebuildStepTitle}>Run this command:</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>npx expo run:android</Text>
        </View>
      </View>
      <Text style={styles.rebuildNote}>
        In the meantime, you can use the notification-based reminders below or
        your device's built-in Digital Wellbeing feature.
      </Text>
    </View>
  );

  const renderPermissionSetup = () => (
    <View style={styles.setupContainer}>
      <View style={styles.setupHeader}>
        <View
          style={[styles.setupIconBox, { backgroundColor: themeColor + "20" }]}
        >
          <Lock size={32} color={themeColor} />
        </View>
        <Text style={styles.setupTitle}>Enable True App Blocking</Text>
        <Text style={styles.setupSubtitle}>
          Grant permissions to block apps with a fullscreen overlay
        </Text>
      </View>

      <View style={styles.permissionsList}>
        {/* Usage Stats Permission */}
        <View style={styles.permissionItem}>
          <View style={styles.permissionLeft}>
            <View
              style={[
                styles.permissionIcon,
                {
                  backgroundColor: permissions.hasUsageStats
                    ? "#22c55e20"
                    : "#71717a20",
                },
              ]}
            >
              {permissions.hasUsageStats ? (
                <CheckCircle2 size={20} color="#22c55e" />
              ) : (
                <Clock size={20} color="#71717a" />
              )}
            </View>
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Usage Access</Text>
              <Text style={styles.permissionDesc}>
                Detect which app is open
              </Text>
            </View>
          </View>
          {permissions.hasUsageStats ? (
            <View style={styles.grantedBadge}>
              <Text style={styles.grantedText}>Granted</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.grantButton}
              onPress={() => AppBlockingModule.openUsageStatsSettings()}
            >
              <Text style={styles.grantButtonText}>Grant</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Overlay Permission */}
        <View style={styles.permissionItem}>
          <View style={styles.permissionLeft}>
            <View
              style={[
                styles.permissionIcon,
                {
                  backgroundColor: permissions.hasOverlay
                    ? "#22c55e20"
                    : "#71717a20",
                },
              ]}
            >
              {permissions.hasOverlay ? (
                <CheckCircle2 size={20} color="#22c55e" />
              ) : (
                <Smartphone size={20} color="#71717a" />
              )}
            </View>
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Display Over Apps</Text>
              <Text style={styles.permissionDesc}>Show blocking overlay</Text>
            </View>
          </View>
          {permissions.hasOverlay ? (
            <View style={styles.grantedBadge}>
              <Text style={styles.grantedText}>Granted</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.grantButton}
              onPress={() => AppBlockingModule.openOverlaySettings()}
            >
              <Text style={styles.grantButtonText}>Grant</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {permissions.allGranted && (
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: themeColor }]}
          onPress={() => setShowSetup(false)}
        >
          <Text style={styles.continueButtonText}>Continue to Settings</Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={styles.setupNote}>
        <Info size={14} color="#71717a" />
        <Text style={styles.setupNoteText}>
          These permissions are required for true app blocking. Your data stays
          on your device.
        </Text>
      </View>
    </View>
  );

  const renderNativeBlockingSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>TRUE APP BLOCKING</Text>
        {isNativeBlockingEnabled && (
          <View style={[styles.activeBadge, { backgroundColor: "#22c55e20" }]}>
            <Zap size={12} color="#22c55e" />
            <Text style={[styles.activeBadgeText, { color: "#22c55e" }]}>
              Running
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.nativeCard,
          {
            borderColor: isNativeBlockingEnabled
              ? "#22c55e30"
              : "rgba(255,255,255,0.05)",
          },
        ]}
      >
        <View style={styles.nativeCardHeader}>
          <View style={styles.nativeCardLeft}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isNativeBlockingEnabled
                    ? "#22c55e20"
                    : themeColor + "20",
                },
              ]}
            >
              <Shield
                size={22}
                color={isNativeBlockingEnabled ? "#22c55e" : themeColor}
              />
            </View>
            <View style={styles.nativeCardText}>
              <Text style={styles.nativeCardTitle}>System-Level Blocking</Text>
              <Text style={styles.nativeCardDesc}>
                {isNativeBlockingEnabled
                  ? `Blocking ${nativeBlockedApps.length} apps with overlay`
                  : "Block apps with fullscreen overlay"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={
              isNativeBlockingEnabled
                ? handleDisableNativeBlocking
                : handleEnableNativeBlocking
            }
            style={[
              styles.customSwitch,
              {
                backgroundColor: isNativeBlockingEnabled
                  ? "#22c55e"
                  : "rgba(255,255,255,0.1)",
              },
            ]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.switchThumb,
                { left: isNativeBlockingEnabled ? 22 : 2 },
              ]}
            />
          </TouchableOpacity>
        </View>

        {isNativeBlockingEnabled && (
          <View style={styles.nativeCardStats}>
            <View style={styles.nativeStatItem}>
              <Text style={styles.nativeStatValue}>
                {nativeBlockedApps.length}
              </Text>
              <Text style={styles.nativeStatLabel}>Apps Blocked</Text>
            </View>
            <View style={styles.nativeStatDivider} />
            <View style={styles.nativeStatItem}>
              <Text style={[styles.nativeStatValue, { color: "#22c55e" }]}>
                Active
              </Text>
              <Text style={styles.nativeStatLabel}>Status</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      {permissions.allGranted && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleSelectAllNativeApps}
          >
            <Check size={16} color={themeColor} />
            <Text style={[styles.quickActionText, { color: themeColor }]}>
              Block All ({ALL_BLOCKED_APPS.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleClearNativeApps}
          >
            <XCircle size={16} color="#ef4444" />
            <Text style={[styles.quickActionText, { color: "#ef4444" }]}>
              Clear All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setShowSetup(true)}
          >
            <ExternalLink size={16} color="#71717a" />
            <Text style={[styles.quickActionText, { color: "#71717a" }]}>
              Permissions
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Native App Categories */}
      {permissions.allGranted && (
        <View style={styles.nativeCategoriesContainer}>
          {AppBlockingModule.getAppCategories().map((category) => {
            const selectedCount = category.apps.filter((app) =>
              nativeBlockedApps.includes(app),
            ).length;
            const allSelected = selectedCount === category.apps.length;

            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.nativeCategoryItem,
                  allSelected && { borderColor: themeColor + "50" },
                ]}
                onPress={() => handleToggleNativeCategory(category.apps)}
              >
                <View style={styles.nativeCategoryLeft}>
                  <View
                    style={[
                      styles.nativeCategoryCheck,
                      allSelected && {
                        backgroundColor: themeColor,
                        borderColor: themeColor,
                      },
                    ]}
                  >
                    {allSelected && <Check size={12} color="#fff" />}
                  </View>
                  <Text style={styles.nativeCategoryName}>{category.name}</Text>
                </View>
                <Text style={styles.nativeCategoryCount}>
                  {selectedCount}/{category.apps.length}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Blocking</Text>
        <View style={styles.headerRight}>
          {(settings.enabled || isNativeBlockingEnabled) && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: themeColor + "20" },
              ]}
            >
              <ShieldCheck size={14} color={themeColor} />
              <Text style={[styles.statusText, { color: themeColor }]}>
                Active
              </Text>
            </View>
          )}
        </View>
      </View>

      {isCheckingPermissions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColor} />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColor}
              colors={[themeColor]}
            />
          }
        >
          {/* Rebuild Required Message (when native module not loaded) */}
          {isAndroid &&
            isSupported &&
            !isNativeModuleLoaded &&
            renderRebuildRequired()}

          {/* Android Permission Setup */}
          {isAndroid &&
            isSupported &&
            isNativeModuleLoaded &&
            showSetup &&
            !permissions.allGranted &&
            renderPermissionSetup()}

          {/* iOS / Not Supported Message */}
          {!isAndroid && (
            <View style={styles.iosCard}>
              <Info size={24} color="#f59e0b" />
              <Text style={styles.iosTitle}>iOS Limitation</Text>
              <Text style={styles.iosText}>
                Apple doesn't allow third-party apps to block other apps. Please
                use the built-in Screen Time feature for app blocking on iOS.
              </Text>
              <TouchableOpacity
                style={styles.iosButton}
                onPress={() => Linking.openURL("app-settings:")}
              >
                <Text style={styles.iosButtonText}>
                  Open Screen Time Settings
                </Text>
                <ExternalLink size={16} color={themeColor} />
              </TouchableOpacity>
            </View>
          )}

          {/* Native Blocking Section (Android only) */}
          {isAndroid &&
            isSupported &&
            isNativeModuleLoaded &&
            (!showSetup || permissions.allGranted) &&
            renderNativeBlockingSection()}

          {/* Stats Card */}
          <View style={[styles.statsCard, { borderColor: themeColor + "30" }]}>
            <View style={styles.statsHeader}>
              <ShieldCheck size={18} color={themeColor} />
              <Text style={styles.statsTitle}>Your Focus Stats</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: themeColor }]}>
                  {violationStats.today}
                </Text>
                <Text style={styles.statLabel}>Distractions Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: themeColor }]}>
                  {violationStats.thisWeek}
                </Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#22c55e" }]}>
                  {violationStats.returnRate}%
                </Text>
                <Text style={styles.statLabel}>Return Rate</Text>
              </View>
            </View>
          </View>

          {/* Reminder-Based Blocking (Fallback) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTIFICATION REMINDERS</Text>
            <View style={styles.infoCard}>
              <Bell size={20} color="#f59e0b" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Reminder-Based Blocking</Text>
                <Text style={styles.infoText}>
                  When enabled, you'll receive reminders every 30 seconds if you
                  leave the app during focus sessions. Works on both Android and
                  iOS.
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: settings.enabled
                        ? themeColor + "20"
                        : "rgba(255,255,255,0.05)",
                    },
                  ]}
                >
                  {settings.enabled ? (
                    <Bell size={22} color={themeColor} />
                  ) : (
                    <ShieldOff size={22} color={Colors.dark.textMuted} />
                  )}
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Enable Reminders</Text>
                  <Text style={styles.settingDescription}>
                    {settings.enabled
                      ? "Sending reminders when you leave"
                      : "Get notified when leaving during focus"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => updateSettings({ enabled: !settings.enabled })}
                style={[
                  styles.customSwitch,
                  {
                    backgroundColor: settings.enabled
                      ? themeColor
                      : "rgba(255,255,255,0.1)",
                  },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.switchThumb,
                    { left: settings.enabled ? 22 : 2 },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* When to Block */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WHEN TO BLOCK</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: settings.blockDuringFocus
                        ? "#ef4444" + "20"
                        : "rgba(255,255,255,0.05)",
                    },
                  ]}
                >
                  <AlertTriangle
                    size={20}
                    color={
                      settings.blockDuringFocus
                        ? "#ef4444"
                        : Colors.dark.textMuted
                    }
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>During Focus Sessions</Text>
                  <Text style={styles.settingDescription}>
                    Block apps when focus timer is running
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  updateSettings({
                    blockDuringFocus: !settings.blockDuringFocus,
                  })
                }
                style={[
                  styles.customSwitch,
                  {
                    backgroundColor: settings.blockDuringFocus
                      ? themeColor
                      : "rgba(255,255,255,0.1)",
                  },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.switchThumb,
                    { left: settings.blockDuringFocus ? 22 : 2 },
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.settingRow, { marginTop: 8 }]}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: settings.blockDuringBreak
                        ? "#22c55e" + "20"
                        : "rgba(255,255,255,0.05)",
                    },
                  ]}
                >
                  <Clock
                    size={20}
                    color={
                      settings.blockDuringBreak
                        ? "#22c55e"
                        : Colors.dark.textMuted
                    }
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>During Break Time</Text>
                  <Text style={styles.settingDescription}>
                    Also block during short breaks
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  updateSettings({
                    blockDuringBreak: !settings.blockDuringBreak,
                  })
                }
                style={[
                  styles.customSwitch,
                  {
                    backgroundColor: settings.blockDuringBreak
                      ? themeColor
                      : "rgba(255,255,255,0.1)",
                  },
                ]}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.switchThumb,
                    { left: settings.blockDuringBreak ? 22 : 2 },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* System Settings Link */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEVICE SETTINGS</Text>
            <TouchableOpacity
              style={styles.systemSettingsButton}
              onPress={openSystemFocusSettings}
            >
              <View style={styles.systemSettingsContent}>
                <View
                  style={[styles.iconBox, { backgroundColor: "#3b82f620" }]}
                >
                  <Smartphone size={20} color="#3b82f6" />
                </View>
                <View style={styles.systemSettingsText}>
                  <Text style={styles.systemSettingsTitle}>
                    {Platform.OS === "ios"
                      ? "Open Screen Time"
                      : "Open Digital Wellbeing"}
                  </Text>
                  <Text style={styles.systemSettingsSubtitle}>
                    Use system features for strictest blocking
                  </Text>
                </View>
              </View>
              <ExternalLink size={18} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Pro Tip */}
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Pro Tip</Text>
            <Text style={styles.tipText}>
              For the most effective blocking on Android, enable both the
              system-level blocking above AND your device's Digital Wellbeing
              Focus Mode. On iOS, use Screen Time App Limits alongside the
              notification reminders.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#71717a",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  // Rebuild Required Card
  rebuildCard: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
  },
  rebuildTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f59e0b",
    marginBottom: 8,
  },
  rebuildText: {
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  rebuildSteps: {
    width: "100%",
    marginBottom: 16,
  },
  rebuildStepTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  codeText: {
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#22c55e",
  },
  rebuildNote: {
    fontSize: 12,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 18,
  },
  // Setup Section
  setupContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  setupHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  setupIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  permissionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  permissionDesc: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  grantedBadge: {
    backgroundColor: "#22c55e20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  grantedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22c55e",
  },
  grantButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  grantButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  setupNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 8,
  },
  setupNoteText: {
    flex: 1,
    fontSize: 12,
    color: "#71717a",
    lineHeight: 18,
  },
  // iOS Card
  iosCard: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    gap: 12,
  },
  iosTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f59e0b",
  },
  iosText: {
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 20,
  },
  iosButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    marginTop: 8,
  },
  iosButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6366f1",
  },
  // Native Blocking Section
  nativeCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  nativeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nativeCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  nativeCardText: {
    flex: 1,
  },
  nativeCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  nativeCardDesc: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  nativeCardStats: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  nativeStatItem: {
    flex: 1,
    alignItems: "center",
  },
  nativeStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  nativeStatLabel: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 4,
  },
  nativeStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 16,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  nativeCategoriesContainer: {
    marginTop: 12,
    gap: 8,
  },
  nativeCategoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  nativeCategoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nativeCategoryCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  nativeCategoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  nativeCategoryCount: {
    fontSize: 12,
    color: "#71717a",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Common Styles
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
    letterSpacing: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#a1a1aa",
    lineHeight: 19,
  },
  statsCard: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 4,
    textAlign: "center",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  settingDescription: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  customSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  switchThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  systemSettingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  systemSettingsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  systemSettingsText: {
    flex: 1,
  },
  systemSettingsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  systemSettingsSubtitle: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  tipCard: {
    padding: 16,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22c55e",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: "#a1a1aa",
    lineHeight: 20,
  },
});
