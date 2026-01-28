import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import {
  BUCKET_ID,
  COLLECTIONS,
  databases,
  DB_ID,
  ID,
  storage,
} from "@/lib/appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import {
  Bell,
  BellOff,
  BookOpen,
  Camera,
  ChevronRight,
  ExternalLink,
  Info,
  LogOut,
  Moon,
  Shield,
  Smartphone,
  Star,
  Trash2,
  User,
  Vibrate,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Storage keys for settings
const SETTINGS_KEYS = {
  HAPTICS_ENABLED: "@settings/haptics_enabled",
  NOTIFICATIONS_ENABLED: "@settings/notifications_enabled",
  KEEP_SCREEN_AWAKE: "@settings/keep_screen_awake",
  AUTO_START_TIMER: "@settings/auto_start_timer",
  SHOW_TIMER_IN_NOTIFICATION: "@settings/show_timer_notification",
};

export default function SettingsScreen() {
  const { user, profile, logout, refetchUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  // Settings state
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [keepScreenAwake, setKeepScreenAwake] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [haptics, notifications, screenAwake] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.HAPTICS_ENABLED),
        AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS_ENABLED),
        AsyncStorage.getItem(SETTINGS_KEYS.KEEP_SCREEN_AWAKE),
      ]);

      if (haptics !== null) setHapticsEnabled(haptics === "true");
      if (notifications !== null)
        setNotificationsEnabled(notifications === "true");
      if (screenAwake !== null) setKeepScreenAwake(screenAwake === "true");
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Failed to save setting:", error);
    }
  };

  const handleHapticsToggle = useCallback(async (value: boolean) => {
    setHapticsEnabled(value);
    await saveSetting(SETTINGS_KEYS.HAPTICS_ENABLED, value);
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleNotificationsToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Notifications Disabled",
            "Please enable notifications in your device settings to receive study reminders.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
      }
      setNotificationsEnabled(value);
      await saveSetting(SETTINGS_KEYS.NOTIFICATIONS_ENABLED, value);
    },
    [hapticsEnabled],
  );

  const handleKeepScreenAwakeToggle = useCallback(
    async (value: boolean) => {
      setKeepScreenAwake(value);
      await saveSetting(SETTINGS_KEYS.KEEP_SCREEN_AWAKE, value);
    },
    [hapticsEnabled],
  );

  const handleClearCache = useCallback(() => {
    Alert.alert(
      "Clear Cache",
      "This will clear temporary data. Your account and study progress will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear image cache or other temporary data
              if (hapticsEnabled) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }
              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache");
            }
          },
        },
      ],
    );
  }, [hapticsEnabled]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Type DELETE to confirm account deletion.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "I understand, delete my account",
                  style: "destructive",
                  onPress: async () => {
                    // TODO: Implement account deletion
                    Alert.alert(
                      "Contact Support",
                      "Please contact support@compstudy.app to request account deletion.",
                    );
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, []);

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const getProfileImageUrl = (fileIdOrUrl?: string) => {
    if (!fileIdOrUrl) return null;
    return fileIdOrUrl.startsWith("http")
      ? fileIdOrUrl
      : storage.getFilePreview(BUCKET_ID, fileIdOrUrl).toString();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleUpload(result.assets[0].uri);
    }
  };

  const handleUpload = async (uri: string) => {
    if (!user || !profile) return;
    setUploading(true);

    try {
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename as string);
      const type = match ? `image/${match[1]}` : `image`;

      const file = {
        name: filename,
        type: type,
        uri: uri,
      } as any;

      // 1. Upload new image
      const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
      const fileId = response.$id;

      // 2. Delete old image if it exists and is not an external URL (e.g. Google)
      const oldPic = profile.profilePicture;
      if (oldPic && !oldPic.startsWith("http")) {
        try {
          await storage.deleteFile(BUCKET_ID, oldPic);
        } catch (e) {
          console.log("Failed to delete old image or already deleted");
        }
      }

      // 3. Update profile
      await databases.updateDocument(DB_ID, COLLECTIONS.PROFILES, profile.$id, {
        profilePicture: fileId,
      });

      // 4. Update local state
      if (refetchUser) {
        await refetchUser();
      }

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Failed to upload image: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {profile?.profilePicture ? (
                <Image
                  source={{
                    uri: getProfileImageUrl(profile.profilePicture) || "",
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {profile?.username?.[0]?.toUpperCase() ||
                      user.name?.[0]?.toUpperCase() ||
                      "?"}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.editButton}
                onPress={pickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Camera size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.name}>{profile?.username || user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          </View>
        </View>

        {/* Study Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Settings</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/review/settings")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(99, 102, 241, 0.15)" },
                ]}
              >
                <BookOpen size={18} color={Colors.dark.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowText}>Spaced Repetition</Text>
                <Text style={styles.rowSubtext}>
                  Configure review schedule & reminders
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(34, 197, 94, 0.15)" },
                ]}
              >
                <Vibrate size={18} color={Colors.dark.success} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowText}>Haptic Feedback</Text>
                <Text style={styles.rowSubtext}>Vibration on interactions</Text>
              </View>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{
                false: Colors.dark.surface,
                true: Colors.dark.primary,
              }}
              thumbColor={hapticsEnabled ? "#fff" : Colors.dark.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(249, 115, 22, 0.15)" },
                ]}
              >
                {notificationsEnabled ? (
                  <Bell size={18} color={Colors.dark.warning} />
                ) : (
                  <BellOff size={18} color={Colors.dark.warning} />
                )}
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowText}>Notifications</Text>
                <Text style={styles.rowSubtext}>Study reminders & updates</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{
                false: Colors.dark.surface,
                true: Colors.dark.primary,
              }}
              thumbColor={notificationsEnabled ? "#fff" : Colors.dark.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(139, 92, 246, 0.15)" },
                ]}
              >
                <Moon size={18} color="#8b5cf6" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowText}>Keep Screen Awake</Text>
                <Text style={styles.rowSubtext}>
                  Prevent sleep during study sessions
                </Text>
              </View>
            </View>
            <Switch
              value={keepScreenAwake}
              onValueChange={handleKeepScreenAwakeToggle}
              trackColor={{
                false: Colors.dark.surface,
                true: Colors.dark.primary,
              }}
              thumbColor={keepScreenAwake ? "#fff" : Colors.dark.textMuted}
            />
          </View>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & About</Text>

          {/* <TouchableOpacity
            style={styles.row}
            onPress={() => openLink("https://compstudy.tech/contact")}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
                <HelpCircle size={18} color="#3b82f6" />
              </View>
              <Text style={styles.rowText}>FAQ & Help</Text>
            </View>
            <ExternalLink size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLink("https://compstudy.tech/contact")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                ]}
              >
                <User size={18} color="#10b981" />
              </View>
              <Text style={styles.rowText}>Contact Support</Text>
            </View>
            <ExternalLink size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLink("https://compstudy.tech/privacy")}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(107, 114, 128, 0.15)" },
                ]}
              >
                <Shield size={18} color="#6b7280" />
              </View>
              <Text style={styles.rowText}>Privacy Policy</Text>
            </View>
            <ExternalLink size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity>

          {Platform.OS !== "ios" && (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                openLink("https://apkpure.com/reviews/com.compstudy.compstudy")
              }
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "rgba(251, 191, 36, 0.15)" },
                  ]}
                >
                  <Star size={18} color="#fbbf24" />
                </View>
                <Text style={styles.rowText}>Rate the App</Text>
              </View>
              <ExternalLink size={18} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          )}

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(99, 102, 241, 0.15)" },
                ]}
              >
                <Info size={18} color={Colors.dark.primary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowText}>App Version</Text>
                <Text style={styles.rowSubtext}>{appVersion}</Text>
              </View>
            </View>
            <View style={styles.versionBadge}>
              <Smartphone size={14} color={Colors.dark.textMuted} />
            </View>
          </View>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>

          <TouchableOpacity style={styles.row} onPress={handleClearCache}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(245, 158, 11, 0.15)" },
                ]}
              >
                <Trash2 size={18} color="#f59e0b" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowText}>Clear Cache</Text>
                <Text style={styles.rowSubtext}>Free up storage space</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.row} onPress={logout}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(239, 68, 68, 0.15)" },
                ]}
              >
                <LogOut size={18} color={Colors.dark.error} />
              </View>
              <Text style={[styles.rowText, { color: Colors.dark.error }]}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                ]}
              >
                <Trash2 size={18} color={Colors.dark.error} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowText, { color: Colors.dark.error }]}>
                  Delete Account
                </Text>
                <Text style={styles.rowSubtext}>
                  Permanently delete your account
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for students</Text>
          <Text style={styles.footerSubtext}>© 2026 CompStudy</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: Colors.dark.surface,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.surfaceHighlight,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "600",
    color: Colors.dark.primary,
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.dark.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.dark.surface,
  },
  infoContainer: {
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.surface,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTextContainer: {
    flex: 1,
  },
  rowText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  rowSubtext: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  versionBadge: {
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    opacity: 0.7,
  },
});
