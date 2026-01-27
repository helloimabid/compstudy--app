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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, LogOut } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, profile, logout, refetchUser } = useAuth();
  const [uploading, setUploading] = useState(false);

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

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.row} onPress={logout}>
            <View style={styles.rowLeft}>
              <LogOut size={20} color={Colors.dark.error} />
              <Text style={[styles.rowText, { color: Colors.dark.error }]}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
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
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: Colors.dark.surface,
    padding: 24,
    borderRadius: 24,
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.dark.text,
  },
});
