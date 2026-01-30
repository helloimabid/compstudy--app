import { Colors } from "@/constants/Colors";
import { SearchedUser, useUserSearch } from "@/hooks/useUserSearch";
import { BUCKET_ID, storage } from "@/lib/appwrite";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Search, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UserSearchModal({ visible, onClose }: UserSearchModalProps) {
  const { query, setQuery, results, loading, error, clearSearch } = useUserSearch();
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleClose = () => {
    Keyboard.dismiss();
    clearSearch();
    onClose();
  };

  const handleUserPress = (user: SearchedUser) => {
    Keyboard.dismiss();
    clearSearch();
    onClose();
    // Navigate to user profile
    router.push(`/profile/${user.userId}`);
  };

  const getAvatarUri = (profilePicture?: string) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith("http")) return profilePicture;
    return storage.getFilePreview(BUCKET_ID, profilePicture).toString();
  };

  const renderUserItem = (user: SearchedUser) => {
    const avatarUri = getAvatarUri(user.profilePicture);

    return (
      <TouchableOpacity
        key={user.$id}
        style={styles.userItem}
        onPress={() => handleUserPress(user)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Text style={styles.avatarText}>
              {user.username?.[0]?.toUpperCase() || "?"}
            </Text>
          )}
        </View>
        <Text style={styles.username} numberOfLines={1}>
          {user.username}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    // Show nothing if query is too short
    if (query.length > 0 && query.length < 2) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Type at least 2 characters to search</Text>
        </View>
      );
    }

    // Show loading
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    // Show error
    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    // Show empty state
    if (query.length >= 2 && results.length === 0) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No users found</Text>
        </View>
      );
    }

    // Show results
    if (results.length > 0) {
      return (
        <View style={styles.resultsContainer}>
          {results.map(renderUserItem)}
        </View>
      );
    }

    // Initial state - show hint
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Search for users by username</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.backdrop} onPress={handleClose} />
          
          <Animated.View
            style={[
              styles.container,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Search size={20} color={Colors.dark.textMuted} style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor={Colors.dark.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                selectionColor={Colors.dark.primary}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <X size={18} color={Colors.dark.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Results */}
            {renderContent()}
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingBottom: 8,
    maxHeight: SCREEN_HEIGHT * 0.6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 12,
    margin: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    height: "100%",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 8,
  },
  cancelText: {
    color: Colors.dark.primary,
    fontSize: 15,
    fontWeight: "500",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
  messageContainer: {
    padding: 20,
    alignItems: "center",
  },
  messageText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: 14,
    textAlign: "center",
  },
  resultsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceHighlight,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: Colors.dark.primaryForeground,
    fontSize: 18,
    fontWeight: "600",
  },
  username: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default UserSearchModal;
