/**
 * Spaced Repetition Settings Screen
 * Configure review mode, patterns, reminders, and preferences
 */

import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { useSpacedRepetition } from "@/context/SpacedRepetitionContext";
import { ExpoPushTokenManager } from "@/services/expoPushNotifications";
import {
  COMMON_TIMEZONES,
  DEFAULT_SR_SETTINGS,
  PRESET_PATTERNS,
  ReviewMode,
} from "@/types/spacedRepetition";
import { router } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Brain,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Hash,
  Layers,
  Save,
  Smartphone,
  Target,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { settings, loadingSettings, updateSettings, refreshSettings } =
    useSpacedRepetition();

  // Local state for form
  const [formData, setFormData] = useState({
    emailRemindersEnabled: DEFAULT_SR_SETTINGS.emailRemindersEnabled,
    pushRemindersEnabled: DEFAULT_SR_SETTINGS.pushRemindersEnabled,
    reminderTime: DEFAULT_SR_SETTINGS.reminderTime,
    timezone: DEFAULT_SR_SETTINGS.timezone,
    maxDailyReviews: DEFAULT_SR_SETTINGS.maxDailyReviews,
    weekendReminders: DEFAULT_SR_SETTINGS.weekendReminders,
    reminderDaysBefore: DEFAULT_SR_SETTINGS.reminderDaysBefore,
    reviewMode: DEFAULT_SR_SETTINGS.reviewMode as ReviewMode,
    selectedPatternId: DEFAULT_SR_SETTINGS.selectedPatternId,
    customIntervals: DEFAULT_SR_SETTINGS.customIntervals || "",
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modals
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [customIntervalsInput, setCustomIntervalsInput] = useState("");

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setFormData({
        emailRemindersEnabled: settings.emailRemindersEnabled,
        pushRemindersEnabled: settings.pushRemindersEnabled ?? true,
        reminderTime: settings.reminderTime,
        timezone: settings.timezone,
        maxDailyReviews: settings.maxDailyReviews,
        weekendReminders: settings.weekendReminders,
        reminderDaysBefore: settings.reminderDaysBefore,
        reviewMode: settings.reviewMode,
        selectedPatternId: settings.selectedPatternId,
        customIntervals: settings.customIntervals || "",
      });
      setCustomIntervalsInput(
        settings.customIntervals
          ? JSON.parse(settings.customIntervals).join(", ")
          : "1, 4, 7, 14, 30",
      );
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (!settings) return;

    const changed =
      formData.emailRemindersEnabled !== settings.emailRemindersEnabled ||
      formData.pushRemindersEnabled !==
        (settings.pushRemindersEnabled ?? true) ||
      formData.reminderTime !== settings.reminderTime ||
      formData.timezone !== settings.timezone ||
      formData.maxDailyReviews !== settings.maxDailyReviews ||
      formData.weekendReminders !== settings.weekendReminders ||
      formData.reminderDaysBefore !== settings.reminderDaysBefore ||
      formData.reviewMode !== settings.reviewMode ||
      formData.selectedPatternId !== settings.selectedPatternId ||
      formData.customIntervals !== (settings.customIntervals || "");

    setHasChanges(changed);
  }, [formData, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Parse custom intervals if in custom mode
      let customIntervalsJson = formData.customIntervals;
      if (formData.selectedPatternId === "custom") {
        const intervals = customIntervalsInput
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n) && n > 0)
          .sort((a, b) => a - b);

        if (intervals.length === 0) {
          Alert.alert(
            "Error",
            "Please enter valid intervals (comma-separated numbers).",
          );
          setSaving(false);
          return;
        }

        customIntervalsJson = JSON.stringify(intervals);
      }

      const success = await updateSettings({
        ...formData,
        customIntervals: customIntervalsJson,
      });

      if (success) {
        await refreshSettings();
        Alert.alert("Success", "Settings saved successfully.");
        setHasChanges(false);
      } else {
        Alert.alert("Error", "Failed to save settings. Please try again.");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "An error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateFormField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSelectedPattern = () =>
    PRESET_PATTERNS.find((p) => p.id === formData.selectedPatternId) ||
    PRESET_PATTERNS[0];

  const getSelectedTimezone = () =>
    COMMON_TIMEZONES.find((tz) => tz.value === formData.timezone) ||
    COMMON_TIMEZONES[0];

  // Loading states
  if (authLoading || loadingSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Please log in to access settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Settings</Text>
        {hasChanges && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.dark.primary} />
            ) : (
              <Save size={22} color={Colors.dark.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Review Mode Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Brain size={20} color={Colors.dark.primary} />
              <Text style={styles.sectionTitle}>Review Mode</Text>
            </View>

            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  formData.reviewMode === "custom" && styles.modeOptionActive,
                ]}
                onPress={() => updateFormField("reviewMode", "custom")}
              >
                <Layers
                  size={24}
                  color={
                    formData.reviewMode === "custom"
                      ? Colors.dark.primary
                      : Colors.dark.textMuted
                  }
                />
                <Text
                  style={[
                    styles.modeOptionTitle,
                    formData.reviewMode === "custom" &&
                      styles.modeOptionTitleActive,
                  ]}
                >
                  Fixed Intervals
                </Text>
                <Text style={styles.modeOptionDesc}>
                  Simple patterns with preset intervals
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeOption,
                  formData.reviewMode === "sm2" && styles.modeOptionActive,
                ]}
                onPress={() => updateFormField("reviewMode", "sm2")}
              >
                <Brain
                  size={24}
                  color={
                    formData.reviewMode === "sm2"
                      ? Colors.dark.primary
                      : Colors.dark.textMuted
                  }
                />
                <Text
                  style={[
                    styles.modeOptionTitle,
                    formData.reviewMode === "sm2" &&
                      styles.modeOptionTitleActive,
                  ]}
                >
                  SM-2 Algorithm
                </Text>
                <Text style={styles.modeOptionDesc}>
                  Adaptive intervals based on performance
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pattern Selection (for Fixed Intervals) */}
          {formData.reviewMode === "custom" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={20} color={Colors.dark.primary} />
                <Text style={styles.sectionTitle}>Interval Pattern</Text>
              </View>

              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowPatternModal(true)}
              >
                <View style={styles.selectInfo}>
                  <Text style={styles.selectLabel}>
                    {getSelectedPattern().name}
                  </Text>
                  <Text style={styles.selectValue}>
                    {getSelectedPattern().description}
                  </Text>
                </View>
                <ChevronDown size={20} color={Colors.dark.textMuted} />
              </TouchableOpacity>

              {/* Custom intervals input */}
              {formData.selectedPatternId === "custom" && (
                <View style={styles.customInputContainer}>
                  <Text style={styles.customInputLabel}>
                    Custom Intervals (days, comma-separated)
                  </Text>
                  <TextInput
                    style={styles.customInput}
                    value={customIntervalsInput}
                    onChangeText={setCustomIntervalsInput}
                    placeholder="e.g., 1, 3, 7, 14, 30"
                    placeholderTextColor={Colors.dark.textMuted}
                    keyboardType="numbers-and-punctuation"
                  />
                  <Text style={styles.customInputHint}>
                    Example: "1, 3, 7, 14, 30" means review after 1 day, then 3
                    days, etc.
                  </Text>
                </View>
              )}

              {/* Pattern preview */}
              <View style={styles.patternPreview}>
                <Text style={styles.patternPreviewLabel}>Preview:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.patternPreviewScroll}
                >
                  {(formData.selectedPatternId === "custom"
                    ? customIntervalsInput
                        .split(",")
                        .map((s) => parseInt(s.trim(), 10))
                        .filter((n) => !isNaN(n) && n > 0)
                    : getSelectedPattern().intervals
                  ).map((day, index) => (
                    <View key={index} style={styles.patternDay}>
                      <Text style={styles.patternDayValue}>{day}</Text>
                      <Text style={styles.patternDayLabel}>days</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Daily Limit Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Hash size={20} color={Colors.dark.primary} />
              <Text style={styles.sectionTitle}>Daily Limit</Text>
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Max daily reviews</Text>
              <View style={styles.sliderControl}>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() =>
                    updateFormField(
                      "maxDailyReviews",
                      Math.max(5, formData.maxDailyReviews - 5),
                    )
                  }
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.sliderValue}>
                  {formData.maxDailyReviews}
                </Text>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() =>
                    updateFormField(
                      "maxDailyReviews",
                      Math.min(100, formData.maxDailyReviews + 5),
                    )
                  }
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Reminders Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color={Colors.dark.primary} />
              <Text style={styles.sectionTitle}>Reminders</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Smartphone size={16} color={Colors.dark.textMuted} />
                  <Text style={styles.settingLabel}>Push notifications</Text>
                </View>
                <Text style={styles.settingDesc}>
                  Get notified when reviews are due
                </Text>
              </View>
              <Switch
                value={formData.pushRemindersEnabled}
                onValueChange={async (v) => {
                  if (v) {
                    // Request permission when enabling
                    const token = await ExpoPushTokenManager.initializeToken(
                      user?.$id,
                    );
                    if (!token) {
                      Alert.alert(
                        "Permission Required",
                        "Please enable notifications in your device settings to receive review reminders.",
                        [{ text: "OK" }],
                      );
                      return;
                    }
                  }
                  updateFormField("pushRemindersEnabled", v);
                }}
                trackColor={{
                  false: Colors.dark.surface,
                  true: Colors.dark.primary + "50",
                }}
                thumbColor={
                  formData.pushRemindersEnabled
                    ? Colors.dark.primary
                    : Colors.dark.textMuted
                }
              />
            </View>

            {formData.pushRemindersEnabled && (
              <>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowTimeModal(true)}
                >
                  <View style={styles.selectIconRow}>
                    <Clock size={20} color={Colors.dark.textMuted} />
                    <View style={styles.selectInfo}>
                      <Text style={styles.selectLabel}>Reminder Time</Text>
                      <Text style={styles.selectValue}>
                        {formData.reminderTime}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown size={20} color={Colors.dark.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowTimezoneModal(true)}
                >
                  <View style={styles.selectIconRow}>
                    <Globe size={20} color={Colors.dark.textMuted} />
                    <View style={styles.selectInfo}>
                      <Text style={styles.selectLabel}>Timezone</Text>
                      <Text style={styles.selectValue} numberOfLines={1}>
                        {getSelectedTimezone().label}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown size={20} color={Colors.dark.textMuted} />
                </TouchableOpacity>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Weekend reminders</Text>
                    <Text style={styles.settingDesc}>
                      Receive reminders on weekends
                    </Text>
                  </View>
                  <Switch
                    value={formData.weekendReminders}
                    onValueChange={(v) =>
                      updateFormField("weekendReminders", v)
                    }
                    trackColor={{
                      false: Colors.dark.surface,
                      true: Colors.dark.primary + "50",
                    }}
                    thumbColor={
                      formData.weekendReminders
                        ? Colors.dark.primary
                        : Colors.dark.textMuted
                    }
                  />
                </View>
              </>
            )}
          </View>
          <View style={styles.infoSection}>
            <AlertCircle size={18} color={Colors.dark.textMuted} />
            <Text style={styles.infoText}>
              Changes to review mode will only affect new topics added to your
              review schedule. Existing topics will keep their current mode.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button (if changes) */}
      {hasChanges && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveFooterButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" />
                <Text style={styles.saveFooterText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Timezone Modal */}
      <Modal
        visible={showTimezoneModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTimezoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Timezone</Text>
              <TouchableOpacity onPress={() => setShowTimezoneModal(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {COMMON_TIMEZONES.map((tz) => (
                <TouchableOpacity
                  key={tz.value}
                  style={[
                    styles.modalOption,
                    formData.timezone === tz.value && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    updateFormField("timezone", tz.value);
                    setShowTimezoneModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.timezone === tz.value &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    {tz.label}
                  </Text>
                  {formData.timezone === tz.value && (
                    <Check size={20} color={Colors.dark.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pattern Modal */}
      <Modal
        visible={showPatternModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPatternModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pattern</Text>
              <TouchableOpacity onPress={() => setShowPatternModal(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {PRESET_PATTERNS.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.modalOption,
                    formData.selectedPatternId === pattern.id &&
                      styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    updateFormField("selectedPatternId", pattern.id);
                    setShowPatternModal(false);
                  }}
                >
                  <View style={styles.modalOptionInfo}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        formData.selectedPatternId === pattern.id &&
                          styles.modalOptionTextActive,
                      ]}
                    >
                      {pattern.name}
                    </Text>
                    <Text style={styles.modalOptionDesc}>
                      {pattern.description}
                    </Text>
                    <Text style={styles.modalOptionIntervals}>
                      {pattern.intervals.join(" → ")} days
                    </Text>
                  </View>
                  {formData.selectedPatternId === pattern.id && (
                    <Check size={20} color={Colors.dark.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Modal */}
      <Modal
        visible={showTimeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, "0");
                return [`${hour}:00`, `${hour}:30`];
              })
                .flat()
                .map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.modalOption,
                      formData.reminderTime === time &&
                        styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      updateFormField("reminderTime", time);
                      setShowTimeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        formData.reminderTime === time &&
                          styles.modalOptionTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                    {formData.reminderTime === time && (
                      <Check size={20} color={Colors.dark.primary} />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.dark.textMuted,
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  saveButton: {
    padding: 8,
  },

  // Content
  scrollContent: {
    paddingBottom: 120,
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },

  // Mode Selector
  modeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  modeOption: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  modeOptionActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary + "15",
  },
  modeOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: 12,
    textAlign: "center",
  },
  modeOptionTitleActive: {
    color: Colors.dark.primary,
  },
  modeOptionDesc: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginTop: 4,
  },

  // Select Button
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  selectInfo: {
    flex: 1,
  },
  selectLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  selectValue: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },

  // Custom Input
  customInputContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  customInput: {
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.dark.text,
  },
  customInputHint: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 8,
  },

  // Pattern Preview
  patternPreview: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
  },
  patternPreviewLabel: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginBottom: 12,
  },
  patternPreviewScroll: {
    flexDirection: "row",
  },
  patternDay: {
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  patternDayValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.primary,
  },
  patternDayLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },

  // Slider
  sliderContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  sliderControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  sliderButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.dark.primary,
  },
  sliderValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    minWidth: 40,
    textAlign: "center",
  },

  // Setting Row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  settingDesc: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },

  // Info Section
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.textMuted,
    lineHeight: 20,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  saveFooterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveFooterText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.dark.primary,
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  modalOptionActive: {
    backgroundColor: Colors.dark.primary + "15",
  },
  modalOptionInfo: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  modalOptionTextActive: {
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  modalOptionDesc: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  modalOptionIntervals: {
    fontSize: 12,
    color: Colors.dark.primary,
    marginTop: 4,
  },
});
