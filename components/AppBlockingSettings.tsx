import { Colors } from "@/constants/Colors";
import {
  AppBlockingSettings,
  COMMON_DISTRACTING_APPS,
} from "@/services/appBlockingService";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AppBlockingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppBlockingSettings;
  onUpdateSettings: (updates: Partial<AppBlockingSettings>) => Promise<void>;
  onToggleApp: (appId: string) => Promise<void>;
  onSelectCategory: (category: string, selected: boolean) => Promise<void>;
  onOpenSystemSettings: () => void;
  themeColor: string;
  violationStats: {
    total: number;
    today: number;
    thisWeek: number;
    returnRate: number;
  };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AppBlockingSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onToggleApp,
  onSelectCategory,
  onOpenSystemSettings,
  themeColor,
  violationStats,
}: AppBlockingSettingsModalProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const groupedApps = COMMON_DISTRACTING_APPS.reduce(
    (acc, app) => {
      if (!acc[app.category]) {
        acc[app.category] = [];
      }
      acc[app.category].push(app);
      return acc;
    },
    {} as Record<string, typeof COMMON_DISTRACTING_APPS>,
  );

  const isCategoryFullySelected = (category: string) => {
    const categoryApps = groupedApps[category] || [];
    return categoryApps.every((app) => settings.blockedApps.includes(app.id));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryApps = groupedApps[category] || [];
    const selectedCount = categoryApps.filter((app) =>
      settings.blockedApps.includes(app.id),
    ).length;
    return selectedCount > 0 && selectedCount < categoryApps.length;
  };

  const toggleDay = (day: number) => {
    const currentDays = settings.customBlockSchedule.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    onUpdateSettings({
      customBlockSchedule: {
        ...settings.customBlockSchedule,
        days: newDays,
      },
    });
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View
                style={[
                  styles.headerIndicator,
                  { backgroundColor: themeColor },
                ]}
              />
              <ShieldAlert size={20} color={themeColor} />
              <Text style={styles.headerTitle}>App Blocking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats Card */}
            <View
              style={[styles.statsCard, { borderColor: themeColor + "30" }]}
            >
              <View style={styles.statsHeader}>
                <ShieldCheck size={18} color={themeColor} />
                <Text style={styles.statsTitle}>Focus Stats</Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: themeColor }]}>
                    {violationStats.today}
                  </Text>
                  <Text style={styles.statLabel}>Today</Text>
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

            {/* Main Toggle */}
            <View style={styles.section}>
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
                    <Shield
                      size={22}
                      color={
                        settings.enabled ? themeColor : Colors.dark.textMuted
                      }
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Enable App Blocking</Text>
                    <Text style={styles.settingDescription}>
                      Block distracting apps during focus time
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    onUpdateSettings({ enabled: !settings.enabled })
                  }
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

            {/* Blocking Mode */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>When to Block</Text>
              </View>

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
                    <Text style={styles.settingLabel}>During Focus</Text>
                    <Text style={styles.settingDescription}>
                      Block apps when focus timer is running
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    onUpdateSettings({
                      blockDuringFocus: !settings.blockDuringFocus,
                    })
                  }
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: settings.blockDuringFocus
                        ? "#ef4444"
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

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: settings.blockDuringBreak
                          ? "#f59e0b" + "20"
                          : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  >
                    <Clock
                      size={20}
                      color={
                        settings.blockDuringBreak
                          ? "#f59e0b"
                          : Colors.dark.textMuted
                      }
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>During Breaks</Text>
                    <Text style={styles.settingDescription}>
                      Also block apps during break time
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    onUpdateSettings({
                      blockDuringBreak: !settings.blockDuringBreak,
                    })
                  }
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: settings.blockDuringBreak
                        ? "#f59e0b"
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

            {/* Schedule Blocking */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Scheduled Blocking</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: settings.customBlockSchedule.enabled
                          ? themeColor + "20"
                          : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  >
                    <Calendar
                      size={20}
                      color={
                        settings.customBlockSchedule.enabled
                          ? themeColor
                          : Colors.dark.textMuted
                      }
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Enable Schedule</Text>
                    <Text style={styles.settingDescription}>
                      Block apps at specific times
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    onUpdateSettings({
                      customBlockSchedule: {
                        ...settings.customBlockSchedule,
                        enabled: !settings.customBlockSchedule.enabled,
                      },
                    })
                  }
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: settings.customBlockSchedule.enabled
                        ? themeColor
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      { left: settings.customBlockSchedule.enabled ? 22 : 2 },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {settings.customBlockSchedule.enabled && (
                <>
                  {/* Time Range */}
                  <View style={styles.timeRangeContainer}>
                    <View style={styles.timeInput}>
                      <Text style={styles.timeLabel}>Start</Text>
                      <Text style={styles.timeValue}>
                        {settings.customBlockSchedule.startTime}
                      </Text>
                    </View>
                    <Text style={styles.timeSeparator}>→</Text>
                    <View style={styles.timeInput}>
                      <Text style={styles.timeLabel}>End</Text>
                      <Text style={styles.timeValue}>
                        {settings.customBlockSchedule.endTime}
                      </Text>
                    </View>
                  </View>

                  {/* Days */}
                  <View style={styles.daysContainer}>
                    {DAYS.map((day, index) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => toggleDay(index)}
                        style={[
                          styles.dayButton,
                          settings.customBlockSchedule.days.includes(index) && {
                            backgroundColor: themeColor + "20",
                            borderColor: themeColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            settings.customBlockSchedule.days.includes(
                              index,
                            ) && {
                              color: themeColor,
                            },
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Notification Settings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Bell size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Notifications</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: settings.showWarningOnLeave
                          ? "#f59e0b" + "20"
                          : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  >
                    <Bell
                      size={20}
                      color={
                        settings.showWarningOnLeave
                          ? "#f59e0b"
                          : Colors.dark.textMuted
                      }
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>
                      Warning Notifications
                    </Text>
                    <Text style={styles.settingDescription}>
                      Notify when leaving during focus
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    onUpdateSettings({
                      showWarningOnLeave: !settings.showWarningOnLeave,
                    })
                  }
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: settings.showWarningOnLeave
                        ? "#f59e0b"
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      { left: settings.showWarningOnLeave ? 22 : 2 },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: settings.strictBlocking
                          ? "#ef4444" + "20"
                          : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  >
                    <ShieldAlert
                      size={20}
                      color={
                        settings.strictBlocking
                          ? "#ef4444"
                          : Colors.dark.textMuted
                      }
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Strict Blocking</Text>
                    <Text style={styles.settingDescription}>
                      Show overlay when returning from blocked app
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    onUpdateSettings({
                      strictBlocking: !settings.strictBlocking,
                    })
                  }
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: settings.strictBlocking
                        ? "#ef4444"
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      { left: settings.strictBlocking ? 22 : 2 },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Blocked Apps */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Smartphone size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Blocked Apps</Text>
                <View style={styles.appCount}>
                  <Text style={styles.appCountText}>
                    {settings.blockedApps.length} selected
                  </Text>
                </View>
              </View>

              {Object.entries(groupedApps).map(([category, apps]) => (
                <View key={category} style={styles.categoryContainer}>
                  <TouchableOpacity
                    onPress={() => toggleCategory(category)}
                    style={styles.categoryHeader}
                  >
                    <View style={styles.categoryLeft}>
                      {expandedCategories.includes(category) ? (
                        <ChevronDown size={18} color={Colors.dark.textMuted} />
                      ) : (
                        <ChevronRight size={18} color={Colors.dark.textMuted} />
                      )}
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text style={styles.categoryCount}>
                        (
                        {
                          apps.filter((a) =>
                            settings.blockedApps.includes(a.id),
                          ).length
                        }
                        /{apps.length})
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        onSelectCategory(
                          category,
                          !isCategoryFullySelected(category),
                        )
                      }
                      style={[
                        styles.selectAllButton,
                        isCategoryFullySelected(category) && {
                          backgroundColor: themeColor + "20",
                          borderColor: themeColor,
                        },
                        isCategoryPartiallySelected(category) && {
                          borderColor: themeColor + "60",
                        },
                      ]}
                    >
                      {isCategoryFullySelected(category) && (
                        <Check size={14} color={themeColor} />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {expandedCategories.includes(category) && (
                    <View style={styles.appsGrid}>
                      {apps.map((app) => (
                        <TouchableOpacity
                          key={app.id}
                          onPress={() => onToggleApp(app.id)}
                          style={[
                            styles.appButton,
                            settings.blockedApps.includes(app.id) && {
                              backgroundColor: themeColor + "15",
                              borderColor: themeColor + "40",
                            },
                          ]}
                        >
                          <Text style={styles.appIcon}>{app.icon}</Text>
                          <Text
                            style={[
                              styles.appName,
                              settings.blockedApps.includes(app.id) && {
                                color: "#fff",
                              },
                            ]}
                          >
                            {app.name}
                          </Text>
                          {settings.blockedApps.includes(app.id) && (
                            <Check size={14} color={themeColor} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* System Settings Link */}
            <TouchableOpacity
              onPress={onOpenSystemSettings}
              style={styles.systemSettingsButton}
            >
              <ExternalLink size={18} color={themeColor} />
              <Text style={[styles.systemSettingsText, { color: themeColor }]}>
                Open System Focus Settings
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "90%",
  },
  modalContent: {
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderBottomWidth: 0,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  statsCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 4,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 1,
    flex: 1,
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
  timeRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
  },
  timeInput: {
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 10,
    color: "#71717a",
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  timeSeparator: {
    fontSize: 16,
    color: "#71717a",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  dayText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#71717a",
  },
  appCount: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  appCountText: {
    fontSize: 11,
    color: "#a1a1aa",
  },
  categoryContainer: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  categoryCount: {
    fontSize: 12,
    color: "#71717a",
  },
  selectAllButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  appsGrid: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  appButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 10,
  },
  appIcon: {
    fontSize: 18,
  },
  appName: {
    flex: 1,
    fontSize: 13,
    color: "#a1a1aa",
  },
  systemSettingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
  },
  systemSettingsText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
