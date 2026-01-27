import { Colors } from "@/constants/Colors";
import {
  Clock,
  Layout,
  Palette,
  Repeat,
  Type,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
    Alert,
  AppState,
  AppStateStatus,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
  { name: "Pomodoro", focus: 25, break: 5 },
  { name: "Deep Work", focus: 50, break: 10 },
  { name: "Quick Sprint", focus: 15, break: 3 },
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

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View
                style={[
                  styles.headerIndicator,
                  {
                    backgroundColor:
                      THEMES.find((t) => t.id === themeColor)?.color ||
                      Colors.dark.primary,
                  },
                ]}
              />
              <Text style={styles.headerTitle}>System Configuration</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Theme Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Palette size={16} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Interface Theme</Text>
              </View>
              <View style={styles.gridContainer}>
                {THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setThemeColor(theme.id)}
                    style={[
                      styles.themeButton,
                      themeColor === theme.id && styles.themeButtonActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: theme.color },
                      ]}
                    />
                    <Text style={styles.themeName}>{theme.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Visual Mode */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Layout size={16} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Visual Mode</Text>
              </View>
              <View style={styles.segmentControl}>
                {(["grid", "minimal", "cyber"] as VisualMode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setVisualMode(m)}
                    style={[
                      styles.segmentButton,
                      visualMode === m && styles.segmentButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        visualMode === m && styles.segmentTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timer Mode */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={16} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Timer Mode</Text>
              </View>
              <View style={styles.segmentControl}>
                {(["timer", "stopwatch"] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setTimerMode(m)}
                    style={[
                      styles.segmentButton,
                      timerMode === m && styles.segmentButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        timerMode === m && styles.segmentTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timer Style */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Type size={16} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Timer Style</Text>
              </View>
              <View style={styles.gridContainer}>
                {(
                  ["grid", "digital", "circular", "minimal"] as TimerStyle[]
                ).map((style) => (
                  <TouchableOpacity
                    key={style}
                    onPress={() => setTimerStyle(style)}
                    style={[
                      styles.styleButton,
                      timerStyle === style && styles.styleButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.styleButtonText,
                        timerStyle === style && styles.styleButtonTextActive,
                      ]}
                    >
                      {style}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Automation */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Repeat size={16} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Automation</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: autoStartBreak
                          ? "rgba(34, 197, 94, 0.1)"
                          : Colors.dark.surface,
                      },
                    ]}
                  >
                    <Repeat
                      size={20}
                      color={
                        autoStartBreak
                          ? Colors.dark.success
                          : Colors.dark.textMuted
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Auto-start Break</Text>
                    <Text style={styles.settingDescription}>
                      Start break when focus ends
                    </Text>
                  </View>
                </View>
                <Switch
                  value={autoStartBreak}
                  onValueChange={setAutoStartBreak}
                  trackColor={{
                    false: Colors.dark.surfaceHighlight,
                    true: Colors.dark.success,
                  }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: autoStartFocus
                          ? "rgba(99, 102, 241, 0.1)"
                          : Colors.dark.surface,
                      },
                    ]}
                  >
                    <Repeat
                      size={20}
                      color={
                        autoStartFocus
                          ? Colors.dark.primary
                          : Colors.dark.textMuted
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Auto-start Focus</Text>
                    <Text style={styles.settingDescription}>
                      Start focus when break ends
                    </Text>
                  </View>
                </View>
                <Switch
                  value={autoStartFocus}
                  onValueChange={setAutoStartFocus}
                  trackColor={{
                    false: Colors.dark.surfaceHighlight,
                    true: Colors.dark.primary,
                  }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: strictMode
                          ? "rgba(239, 68, 68, 0.1)"
                          : Colors.dark.surface,
                      },
                    ]}
                  >
                    <Zap
                      size={20}
                      color={strictMode ? "#ef4444" : Colors.dark.textMuted}
                    />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Strict Mode</Text>
                    <Text style={styles.settingDescription}>
                      Prevent exiting while focusing
                    </Text>
                  </View>
                </View>
                <Switch
                  value={strictMode}
                  onValueChange={setStrictMode}
                  trackColor={{
                    false: Colors.dark.surfaceHighlight,
                    true: "#ef4444",
                  }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Custom Duration */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={16} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Custom Duration</Text>
              </View>
              <View style={styles.durationContainer}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Hours</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={hours.toString()}
                    onChangeText={(text) =>
                      updateDuration(parseInt(text) || 0, minutes, seconds)
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Minutes</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={minutes.toString()}
                    onChangeText={(text) =>
                      updateDuration(hours, parseInt(text) || 0, seconds)
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Seconds</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={seconds.toString()}
                    onChangeText={(text) =>
                      updateDuration(hours, minutes, parseInt(text) || 0)
                    }
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <Text style={styles.durationSummary}>
                Total: {hours > 0 ? `${hours}h ` : ""}
                {minutes > 0 ? `${minutes}m ` : ""}
                {seconds > 0 ? `${seconds}s` : ""}
              </Text>
            </View>

            {/* Presets */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={16} color={Colors.dark.textMuted} />
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
                  >
                    <Text style={styles.presetName}>{preset.name}</Text>
                    <View style={styles.presetBadge}>
                      <Text style={styles.presetBadgeText}>
                        {preset.focus}m Focus
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sound Settings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Volume2 size={16} color={Colors.dark.textMuted} />
                <Text style={styles.sectionTitle}>Audio Feedback</Text>
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: soundEnabled
                          ? "rgba(99, 102, 241, 0.1)"
                          : Colors.dark.surface,
                      },
                    ]}
                  >
                    {soundEnabled ? (
                      <Volume2 size={20} color={Colors.dark.primary} />
                    ) : (
                      <VolumeX size={20} color={Colors.dark.textMuted} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Sound Effects</Text>
                    <Text style={styles.settingDescription}>
                      Timer ticks and completion alarms
                    </Text>
                  </View>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{
                    false: Colors.dark.surfaceHighlight,
                    true: Colors.dark.primary,
                  }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#09090b", // Slightly lighter than pure black
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "88%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIndicator: {
    width: 4,
    height: 24,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
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
    paddingBottom: 64,
    gap: 36,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  themeButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 12,
  },
  themeButtonActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: "#000", // Shadow for dot
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  themeName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#f4f4f5",
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentText: {
    fontSize: 13,
    color: "#a1a1aa",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  segmentTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  styleButton: {
    width: "48%",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
  },
  styleButtonActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  styleButtonText: {
    fontSize: 14,
    color: "#a1a1aa",
    textTransform: "capitalize",
    fontWeight: "500",
  },
  styleButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  durationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  timeColumn: {
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  timeInput: {
    width: 60,
    height: 60,
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.textMuted,
    marginTop: 16,
  },
  durationSummary: {
    textAlign: "center",
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 8,
  },
  presetsContainer: {
    gap: 12,
  },
  presetButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  presetName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  presetBadge: {
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetBadgeText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
});
