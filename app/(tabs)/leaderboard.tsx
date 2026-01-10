import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Crown, Flame, Medal, Trophy } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

interface Profile {
  $id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  totalHours: number;
  streak: number;
  xp: number;
}

export default function LeaderboardScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchLeaderboard = async () => {
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.orderDesc("totalHours"), Query.limit(50)]
      );
      setProfiles(response.documents as unknown as Profile[]);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const topThree = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Global</Text>
          <Text style={styles.titleHighlight}>Leaderboards</Text>
          <Text style={styles.description}>
            See where you stand against the most dedicated students.
          </Text>
        </View>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <View style={styles.podiumContainer}>
            {/* 2nd Place */}
            {topThree[1] && (
              <TouchableOpacity
                style={styles.podiumItem}
                onPress={() => router.push(`/profile/${topThree[1].userId}`)}
              >
                <View style={[styles.avatar, styles.avatarSecond]}>
                  {topThree[1].profilePicture ? (
                    <Image
                      source={{ uri: topThree[1].profilePicture }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {topThree[1].username[0]?.toUpperCase() || "?"}
                    </Text>
                  )}
                  <View style={[styles.rankBadge, styles.rankBadgeSecond]}>
                    <Text style={styles.rankBadgeText}>#2</Text>
                  </View>
                </View>
                <Text style={styles.podiumName}>{topThree[1].username}</Text>
                <Text style={styles.podiumHours}>
                  {topThree[1].totalHours.toFixed(1)}h
                </Text>
                <View style={[styles.podiumBar, styles.podiumBarSecond]}>
                  <Medal size={20} color={Colors.dark.textMuted} />
                </View>
              </TouchableOpacity>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <TouchableOpacity
                style={[styles.podiumItem, styles.podiumItemFirst]}
                onPress={() => router.push(`/profile/${topThree[0].userId}`)}
              >
                <Crown
                  size={24}
                  color={Colors.dark.warning}
                  style={styles.crown}
                />
                <View style={[styles.avatar, styles.avatarFirst]}>
                  {topThree[0].profilePicture ? (
                    <Image
                      source={{ uri: topThree[0].profilePicture }}
                      style={[styles.avatarImage, { borderRadius: 34 }]}
                    />
                  ) : (
                    <Text style={[styles.avatarText, styles.avatarTextFirst]}>
                      {topThree[0].username[0]?.toUpperCase() || "?"}
                    </Text>
                  )}
                  <View style={[styles.rankBadge, styles.rankBadgeFirst]}>
                    <Text style={[styles.rankBadgeText, { color: "#000" }]}>
                      #1
                    </Text>
                  </View>
                </View>
                <Text style={[styles.podiumName, styles.podiumNameFirst]}>
                  {topThree[0].username}
                </Text>
                <Text style={[styles.podiumHours, styles.podiumHoursFirst]}>
                  {topThree[0].totalHours.toFixed(1)}h
                </Text>
                <View style={[styles.podiumBar, styles.podiumBarFirst]}>
                  <Trophy size={24} color={Colors.dark.warning} />
                </View>
              </TouchableOpacity>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <TouchableOpacity
                style={styles.podiumItem}
                onPress={() => router.push(`/profile/${topThree[2].userId}`)}
              >
                <View style={[styles.avatar, styles.avatarThird]}>
                  {topThree[2].profilePicture ? (
                    <Image
                      source={{ uri: topThree[2].profilePicture }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {topThree[2].username[0]?.toUpperCase() || "?"}
                    </Text>
                  )}
                  <View style={[styles.rankBadge, styles.rankBadgeThird]}>
                    <Text style={styles.rankBadgeText}>#3</Text>
                  </View>
                </View>
                <Text style={styles.podiumName}>{topThree[2].username}</Text>
                <Text style={styles.podiumHours}>
                  {topThree[2].totalHours.toFixed(1)}h
                </Text>
                <View style={[styles.podiumBar, styles.podiumBarThird]}>
                  <Medal size={20} color="#CD7F32" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Rest of Leaderboard */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={[styles.listHeaderText, { flex: 0.5 }]}>Rank</Text>
            <Text style={[styles.listHeaderText, { flex: 2 }]}>Student</Text>
            <Text
              style={[styles.listHeaderText, { flex: 1, textAlign: "right" }]}
            >
              Hours
            </Text>
            <Text
              style={[styles.listHeaderText, { flex: 0.8, textAlign: "right" }]}
            >
              Streak
            </Text>
          </View>

          {rest.map((profile, index) => (
            <View key={profile.$id} style={styles.listRow}>
              <Text style={[styles.listRank, { flex: 0.5 }]}>#{index + 4}</Text>
              <View style={[styles.listUser, { flex: 2 }]}>
                <View style={styles.listAvatar}>
                  <Text style={styles.listAvatarText}>
                    {profile.username[0]?.toUpperCase() || "?"}
                  </Text>
                </View>
                <Text style={styles.listUsername} numberOfLines={1}>
                  {profile.username}
                </Text>
              </View>
              <Text style={[styles.listHours, { flex: 1 }]}>
                {profile.totalHours.toFixed(1)}h
              </Text>
              <View style={[styles.listStreak, { flex: 0.8 }]}>
                <Text style={styles.listStreakText}>{profile.streak}</Text>
                <Flame size={14} color={Colors.dark.warning} />
              </View>
            </View>
          ))}

          {profiles.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No data available yet.</Text>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  titleHighlight: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.dark.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 32,
    gap: 12,
  },
  podiumItem: {
    alignItems: "center",
    flex: 1,
  },
  podiumItemFirst: {
    marginBottom: 16,
  },
  crown: {
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFirst: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderColor: Colors.dark.warning,
  },
  avatarSecond: {
    borderColor: Colors.dark.textMuted,
  },
  avatarThird: {
    borderColor: "#CD7F32",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.dark.textMuted,
  },
  avatarTextFirst: {
    fontSize: 24,
    color: Colors.dark.warning,
  },
  rankBadge: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rankBadgeFirst: {
    backgroundColor: Colors.dark.warning,
  },
  rankBadgeSecond: {
    backgroundColor: Colors.dark.textMuted,
  },
  rankBadgeThird: {
    backgroundColor: "#CD7F32",
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  podiumNameFirst: {
    fontSize: 16,
  },
  podiumHours: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 8,
  },
  podiumHoursFirst: {
    color: Colors.dark.warning,
    fontWeight: "600",
  },
  podiumBar: {
    width: "100%",
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.dark.border,
  },
  podiumBarFirst: {
    height: 120,
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderColor: "rgba(234, 179, 8, 0.3)",
  },
  podiumBarSecond: {
    height: 80,
  },
  podiumBarThird: {
    height: 60,
  },
  listContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  listHeader: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  listHeaderText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  listRank: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    fontFamily: "monospace",
  },
  listUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Add overflow hidden
  },
  listAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  listAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textMuted,
  },
  listUsername: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.text,
    flex: 1,
  },
  listHours: {
    fontSize: 14,
    color: Colors.dark.text,
    textAlign: "right",
    fontFamily: "monospace",
  },
  listStreak: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  listStreakText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.warning,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyStateText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
});
