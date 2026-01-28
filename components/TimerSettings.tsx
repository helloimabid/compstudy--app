import { Colors } from "@/constants/Colors";
import {
  Clock,
  Minus,
  Palette,
  Plus,
  Repeat,
  Timer,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type ThemeColor =
  | "indigo"
  | "cyan"
  | "green"
  | "amber"
  | "rose"
  | "violet";
export type VisualMode = "grid" | "minimal" | "cyber";
export type TimerStyle = "grid" | "digital" | "circular" | "minimal";
export type TimerFont =
  | "default"
  | "orbitron"
  | "quantico"
  | "audiowide"
  | "electrolize"
  | "zendots";

interface TimerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  visualMode: VisualMode;
  setVisualMode: (mode: VisualMode) => void;
  timerStyle: TimerStyle;
  setTimerStyle: (style: TimerStyle) => void;
  timerFont: TimerFont;
  setTimerFont: (font: TimerFont) => void;
  autoStartFocus: boolean;
  setAutoStartFocus: (enabled: boolean) => void;
  autoStartBreak: boolean;
  setAutoStartBreak: (enabled: boolean) => void;
  targetDuration: number;
  setTargetDuration: (duration: number) => void;
  applyPreset: (focus: number) => void;
  timerMode: "timer" | "stopwatch";
  setTimerMode: (mode: "timer" | "stopwatch") => void;
  strictMode: boolean;
  setStrictMode: (enabled: boolean) => void;
}

const THEMES: { id: ThemeColor; name: string; color: string }[] = [
  { id: "indigo", name: "Deep Space", color: "#6366f1" },
  { id: "cyan", name: "Cyberpunk", color: "#06b6d4" },
  { id: "green", name: "Matrix", color: "#22c55e" },
  { id: "amber", name: "Industrial", color: "#f59e0b" },
  { id: "rose", name: "Neon City", color: "#f43f5e" },
  { id: "violet", name: "Synthwave", color: "#8b5cf6" },
];

const PRESETS = [
  { name: "Pomodoro", focus: 25, description: "Classic 25 min focus" },
  { name: "Deep Work", focus: 50, description: "Extended 50 min focus" },
  { name: "Quick Sprint", focus: 15, description: "Short 15 min burst" },
];

const FONTS: { id: TimerFont; name: string }[] = [
  { id: "default", name: "Default" },
  { id: "orbitron", name: "Orbitron" },
  { id: "quantico", name: "Quantico" },
  { id: "audiowide", name: "Audiowide" },
  { id: "electrolize", name: "Electrolize" },
  { id: "zendots", name: "Zen Dots" },
];

export default function TimerSettings({
  isOpen,
  onClose,
  themeColor,
  setThemeColor,
  soundEnabled,
  setSoundEnabled,
  visualMode,
  setVisualMode,
  timerStyle,
  setTimerStyle,
  timerFont,
  setTimerFont,
  autoStartFocus,
  setAutoStartFocus,
  autoStartBreak,
  setAutoStartBreak,
  targetDuration,
  setTargetDuration,
  applyPreset,
  timerMode,
  setTimerMode,
  strictMode,
  setStrictMode,
}: TimerSettingsProps) {
  // Helper to parse duration into hours, minutes, seconds
  const hours = Math.floor(targetDuration / 3600);
  const minutes = Math.floor((targetDuration % 3600) / 60);
  const seconds = targetDuration % 60;

  const updateDuration = (h: number, m: number, s: number) => {
    const total = Math.max(0, h * 3600 + m * 60 + s);
    setTargetDuration(total > 0 ? total : 60); // Minimum 1 minute
  };

  const activeTheme = THEMES.find((t) => t.id === themeColor) || THEMES[0];

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Modal Content */}
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Handle Indicator */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View
                style={[
                  styles.headerIndicator,
                  { backgroundColor: activeTheme.color },
                ]}
              />
              <Text style={styles.headerTitle}>System Configuration</Text>
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
            {/* Theme Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Palette size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Interface Theme</Text>
              </View>
              <View style={styles.themeGrid}>
                {THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setThemeColor(theme.id)}
                    style={[
                      styles.themeButton,
                      themeColor === theme.id && styles.themeButtonActive,
                      themeColor === theme.id && {
                        borderColor: theme.color + "40",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        {
                          backgroundColor: theme.color,
                          shadowColor: theme.color,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.themeName,
                        themeColor === theme.id && { color: "#fff" },
                      ]}
                    >
                      {theme.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timer Mode */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Timer size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Timer Mode</Text>
              </View>
              <View style={styles.segmentControl}>
                {(["timer", "stopwatch"] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setTimerMode(m)}
                    style={[
                      styles.segmentButton,
                      timerMode === m && [
                        styles.segmentButtonActive,
                        { backgroundColor: activeTheme.color + "20" },
                      ],
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        timerMode === m && {
                          color: activeTheme.color,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Automation */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Zap size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Automation</Text>
              </View>

              {/* Auto-start Break */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: autoStartBreak
                          ? "rgba(34, 197, 94, 0.15)"
                          : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  >
                    <Repeat
                      size={20}
                      color={autoStartBreak ? "#22c55e" : Colors.dark.textMuted}
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Auto-start Break</Text>
                    <Text style={styles.settingDescription}>
                      Start break when focus ends
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setAutoStartBreak(!autoStartBreak)}
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: autoStartBreak
                        ? "#22c55e"
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      { left: autoStartBreak ? 22 : 2 },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Auto-start Focus */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: autoStartFocus
                          ? activeTheme.color + "20"
                          : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  >
                    <Repeat
                      size={20}
                      color={
                        autoStartFocus
                          ? activeTheme.color
                          : Colors.dark.textMuted
                      }
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Auto-start Focus</Text>
                    <Text style={styles.settingDescription}>
                      Start focus when break ends
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setAutoStartFocus(!autoStartFocus)}
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: autoStartFocus
                        ? activeTheme.color
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      { left: autoStartFocus ? 22 : 2 },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Strict Mode */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: strictMode
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  >
                    <Zap
                      size={20}
                      color={strictMode ? "#ef4444" : Colors.dark.textMuted}
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Strict Mode</Text>
                    <Text style={styles.settingDescription}>
                      Prevent exiting while focusing
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setStrictMode(!strictMode)}
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: strictMode
                        ? "#ef4444"
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[styles.switchThumb, { left: strictMode ? 22 : 2 }]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Duration */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Custom Timer Duration</Text>
              </View>
              <View style={styles.durationContainer}>
                <View style={styles.durationRow}>
                  {/* Hours */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Hours</Text>
                    <View style={styles.timeControls}>
                      <TouchableOpacity
                        onPress={() =>
                          updateDuration(hours + 1, minutes, seconds)
                        }
                        style={styles.timeButton}
                        activeOpacity={0.7}
                      >
                        <Plus size={18} color={Colors.dark.textMuted} />
                      </TouchableOpacity>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeValue}>
                          {hours.toString().padStart(2, "0")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          updateDuration(
                            Math.max(0, hours - 1),
                            minutes,
                            seconds,
                          )
                        }
                        style={styles.timeButton}
                        activeOpacity={0.7}
                      >
                        <Minus size={18} color={Colors.dark.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  {/* Minutes */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Minutes</Text>
                    <View style={styles.timeControls}>
                      <TouchableOpacity
                        onPress={() =>
                          updateDuration(
                            hours,
                            Math.min(59, minutes + 1),
                            seconds,
                          )
                        }
                        style={styles.timeButton}
                        activeOpacity={0.7}
                      >
                        <Plus size={18} color={Colors.dark.textMuted} />
                      </TouchableOpacity>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeValue}>
                          {minutes.toString().padStart(2, "0")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          updateDuration(
                            hours,
                            Math.max(0, minutes - 1),
                            seconds,
                          )
                        }
                        style={styles.timeButton}
                        activeOpacity={0.7}
                      >
                        <Minus size={18} color={Colors.dark.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  {/* Seconds */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Seconds</Text>
                    <View style={styles.timeControls}>
                      <TouchableOpacity
                        onPress={() =>
                          updateDuration(
                            hours,
                            minutes,
                            Math.min(59, seconds + 1),
                          )
                        }
                        style={styles.timeButton}
                        activeOpacity={0.7}
                      >
                        <Plus size={18} color={Colors.dark.textMuted} />
                      </TouchableOpacity>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeValue}>
                          {seconds.toString().padStart(2, "0")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          updateDuration(
                            hours,
                            minutes,
                            Math.max(0, seconds - 1),
                          )
                        }
                        style={styles.timeButton}
                        activeOpacity={0.7}
                      >
                        <Minus size={18} color={Colors.dark.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={styles.durationSummary}>
                  Total: {hours > 0 ? `${hours}h ` : ""}
                  {minutes > 0 ? `${minutes}m ` : ""}
                  {seconds > 0 ? `${seconds}s` : ""}
                  {hours === 0 && minutes === 0 && seconds === 0 ? "0s" : ""}
                </Text>
              </View>
            </View>

            {/* Quick Presets */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Quick Presets</Text>
              </View>
              <View style={styles.presetsContainer}>
                {PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.name}
                    onPress={() => {
                      applyPreset(preset.focus);
                      onClose();
                    }}
                    style={styles.presetButton}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      <Text style={styles.presetDescription}>
                        {preset.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.presetBadge,
                        { backgroundColor: activeTheme.color + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetBadgeText,
                          { color: activeTheme.color },
                        ]}
                      >
                        {preset.focus}m
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sound Settings */}
            <View style={[styles.section, { marginBottom: 40 }]}>
              <View style={styles.sectionHeader}>
                <Volume2 size={14} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Audio Feedback</Text>
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: soundEnabled
                          ? activeTheme.color + "20"
                          : "rgba(255,255,255,0.05)",
                      },
                    ]}
                  >
                    {soundEnabled ? (
                      <Volume2 size={20} color={activeTheme.color} />
                    ) : (
                      <VolumeX size={20} color={Colors.dark.textMuted} />
                    )}
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Sound Effects</Text>
                    <Text style={styles.settingDescription}>
                      Timer ticks and completion alarms
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSoundEnabled(!soundEnabled)}
                  style={[
                    styles.customSwitch,
                    {
                      backgroundColor: soundEnabled
                        ? activeTheme.color
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      { left: soundEnabled ? 22 : 2 },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
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
    gap: 32,
  },
  section: {
    gap: 16,
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
  },

  // Theme Grid
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  themeButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 10,
  },
  themeButtonActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  themeName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#a1a1aa",
  },

  // Segment Control
  segmentControl: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  segmentButtonActive: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentText: {
    fontSize: 13,
    color: "#71717a",
    fontWeight: "500",
    textTransform: "capitalize",
  },

  // Style Grid
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  styleButton: {
    width: "48%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
  },
  styleButtonActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  styleButtonText: {
    fontSize: 13,
    color: "#a1a1aa",
    textTransform: "capitalize",
    fontWeight: "500",
  },

  // Font Grid
  fontGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fontButton: {
    width: "48%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    gap: 4,
  },
  fontButtonActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  fontPreview: {
    fontSize: 18,
    fontWeight: "600",
    color: "#a1a1aa",
    fontVariant: ["tabular-nums"],
  },
  fontName: {
    fontSize: 11,
    color: "#71717a",
  },

  // Settings Row
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

  // Custom Switch
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

  // Duration
  durationContainer: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  timeColumn: {
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 10,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  timeControls: {
    alignItems: "center",
    gap: 6,
  },
  timeButton: {
    width: 48,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
  timeInputContainer: {
    width: 56,
    height: 56,
    backgroundColor: "#18181b",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  timeValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3f3f46",
    marginHorizontal: 8,
    marginTop: 24,
  },
  durationSummary: {
    textAlign: "center",
    fontSize: 13,
    color: "#71717a",
    marginTop: 16,
  },

  // Presets
  presetsContainer: {
    gap: 10,
  },
  presetButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  presetName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  presetDescription: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  presetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
