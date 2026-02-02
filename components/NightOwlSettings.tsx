import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import {
  DAY_RESET_OPTIONS,
  DayResetHour,
  getResetHourShortLabel,
} from "@/utils/dayBoundary";
import * as Haptics from "expo-haptics";
import { Moon, ChevronDown, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NightOwlSettingsProps {
  profileId: string;
  currentValue: DayResetHour;
  onUpdate: (newValue: DayResetHour) => void;
  hapticsEnabled?: boolean;
}

export default function NightOwlSettings({
  profileId,
  currentValue,
  onUpdate,
  hapticsEnabled = true,
}: NightOwlSettingsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedValue, setSelectedValue] = useState<DayResetHour>(currentValue);

  const handleSelect = async (value: DayResetHour) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSelectedValue(value);
    setIsSaving(true);

    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.PROFILES, profileId, {
        dayResetHour: value,
      });
      
      onUpdate(value);
      setIsPickerOpen(false);
      
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to update day reset hour:", error);
      Alert.alert("Error", "Failed to save setting. Please try again.");
      setSelectedValue(currentValue);
    } finally {
      setIsSaving(false);
    }
  };

  const currentOption = DAY_RESET_OPTIONS.find(opt => opt.value === currentValue);

  return (
    <>
      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => setIsPickerOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, styles.moonIconContainer]}>
            <Moon size={18} color="#a78bfa" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Night Owl Mode</Text>
            <Text style={styles.settingSubtitle}>
              Day resets at {getResetHourShortLabel(currentValue)}
            </Text>
          </View>
        </View>
        <View style={styles.settingRight}>
          <Text style={styles.valueText}>{currentOption?.shortLabel}</Text>
          <ChevronDown size={16} color={Colors.dark.textMuted} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isPickerOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPickerOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setIsPickerOpen(false)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Day Reset Time</Text>
              <TouchableOpacity
                onPress={() => setIsPickerOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Perfect for night owls! Study sessions before your reset time will
              count towards the previous day's stats.
            </Text>

            <View style={styles.optionsList}>
              {DAY_RESET_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionRow,
                    selectedValue === option.value && styles.optionRowSelected,
                  ]}
                  onPress={() => handleSelect(option.value)}
                  disabled={isSaving}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionLabel,
                        selectedValue === option.value && styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {option.value === 0 && (
                      <Text style={styles.optionHint}>Default</Text>
                    )}
                    {option.value >= 3 && option.value <= 5 && (
                      <Text style={styles.optionHint}>Popular</Text>
                    )}
                  </View>
                  {selectedValue === option.value && (
                    isSaving ? (
                      <ActivityIndicator size="small" color={Colors.dark.primary} />
                    ) : (
                      <Check size={20} color={Colors.dark.primary} />
                    )
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.exampleContainer}>
              <Text style={styles.exampleTitle}>Example:</Text>
              <Text style={styles.exampleText}>
                If you set it to {getResetHourShortLabel(selectedValue)}, studying at 2 AM on
                January 2nd will count as January {selectedValue > 2 ? "1st" : "2nd"}'s study time.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  moonIconContainer: {
    backgroundColor: "rgba(167, 139, 250, 0.15)",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  valueText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.primary,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    paddingHorizontal: 20,
    paddingVertical: 16,
    lineHeight: 20,
  },
  optionsList: {
    paddingHorizontal: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  optionRowSelected: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    fontSize: 15,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  optionLabelSelected: {
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  optionHint: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exampleContainer: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.2)",
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#a78bfa",
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    lineHeight: 18,
  },
});
