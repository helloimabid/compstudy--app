import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  DoorOpen,
  Flame,
  Play,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap
} from "lucide-react-native";
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

interface ActiveRoom {
  $id: string;
  roomId: string;
  name: string;
  subject: string;
  activeUsers: number;
  timerState: "idle" | "running" | "paused";
}

interface StudySession {
  $id: string;
  subject: string;
  duration: number;
  endTime: string;
  type: "focus" | "break";
}

export default function HomeScreen() {
  const { user, profile, loading, logout } = useAuth();
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const fetchData = async () => {
    if (!user) {
      setFetchingData(false);
      return;
    }

    try {
      // Fetch active room
      const roomResponse = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.ROOMS,
        [Query.equal("creatorId", user.$id), Query.limit(1)]
      );
      if (roomResponse.documents.length > 0) {
        setActiveRoom(roomResponse.documents[0] as unknown as ActiveRoom);
      } else {
        setActiveRoom(null);
      }

      // Fetch recent sessions
      const sessionsResponse = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.STUDY_SESSIONS,
        [
          Query.equal("userId", user.$id),
          Query.equal("status", "completed"),
          Query.orderDesc("endTime"),
          Query.limit(5),
        ]
      );
      setRecentSessions(sessionsResponse.documents as unknown as StudySession[]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setFetchingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else if (!loading) {
      setFetchingData(false);
    }
  }, [user, loading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading || fetchingData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  // Not logged in - show public stats
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Study alone,</Text>
            <Text style={styles.titleHighlight}>compete together.</Text>
            <Text style={styles.description}>
              Turn isolation into motivation. Join real-time study rooms.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>Login to Get Started</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.welcomeText}>
              Welcome back, {profile?.username || user.name || "Student"} ✨
            </Text>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid - Section 1 */}
        <View style={styles.gridSection}>
          {/* Streak Card - Full Width */}
          <LinearGradient
            colors={
              profile?.streak && profile.streak > 0
                ? Colors.dark.gradients.streak
                : ["rgba(249, 115, 22, 0.1)", "rgba(239, 68, 68, 0.05)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.streakCard]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconBox, styles.streakIconBox]}>
                  <Flame size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.cardLabel}>CURRENT STREAK</Text>
                  <Text style={styles.cardSubLabel}>Keep it going! 🔥</Text>
                </View>
              </View>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueLarge}>{profile?.streak || 0}</Text>
              <Text style={styles.unit}>days</Text>
            </View>
            <View style={styles.streakFooter}>
              <TrendingUp size={14} color="#fb923c" />
              <Text style={styles.streakFooterText}>
                {profile?.streak > 0
                  ? `${profile.streak} day${profile.streak > 1 ? "s" : ""} strong!`
                  : "Start your streak today"}
              </Text>
            </View>
          </LinearGradient>

          {/* Hours & XP Row */}
          <View style={styles.gridRow}>
            {/* Hours Card */}
            <LinearGradient
              colors={["rgba(99, 102, 241, 0.1)", "rgba(59, 130, 246, 0.05)"]}
              style={[styles.card, styles.halfCard]}
            >
              <View style={[styles.iconBox, styles.hoursIconBox]}>
                <Clock size={18} color="#818cf8" />
              </View>
              <Text style={styles.cardLabel}>TOTAL HOURS</Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueMedium}>
                  {profile?.totalHours?.toFixed(1) || "0.0"}
                </Text>
                <Text style={styles.unitSmall}>h</Text>
              </View>
            </LinearGradient>

            {/* XP Card */}
            <LinearGradient
              colors={["rgba(234, 179, 8, 0.1)", "rgba(245, 158, 11, 0.05)"]}
              style={[styles.card, styles.halfCard]}
            >
              <View style={[styles.iconBox, styles.xpIconBox]}>
                <Zap size={18} color="#facc15" />
              </View>
              <Text style={styles.cardLabel}>EXPERIENCE</Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueMedium}>{profile?.xp || 0}</Text>
                <Text style={styles.unitSmall}>XP</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Navigation Grid - Section 2 */}
        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            {/* Analytics */}
            <TouchableOpacity
              style={[styles.card, styles.halfCard, styles.navCard]}
              onPress={() => router.push("/(tabs)/stats")}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, styles.analyticsIconBox]}>
                <TrendingUp size={18} color="#818cf8" />
              </View>
              <Text style={styles.cardLabel}>ANALYTICS</Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkText}>View Stats</Text>
                <ArrowRight size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Curriculum */}
            <TouchableOpacity
              style={[styles.card, styles.halfCard, styles.navCard]}
              // onPress={() => router.push("/curriculum")} // Route doesn't exist yet
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, styles.curriculumIconBox]}>
                <BookOpen size={18} color="#34d399" />
              </View>
              <Text style={styles.cardLabel}>CURRICULUM</Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkText}>Manage</Text>
                <ArrowRight size={12} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Active Room Card */}
          {activeRoom && (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/rooms`)} // Ideally deep link to room
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["rgba(168, 85, 247, 0.15)", "rgba(236, 72, 153, 0.15)"]}
                style={[styles.card, styles.activeRoomCard]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.iconBox, styles.roomIconBox]}>
                      <DoorOpen size={20} color="#c084fc" />
                    </View>
                    <View>
                      <Text style={styles.cardLabel}>YOUR ACTIVE ROOM</Text>
                      <Text style={styles.cardTitle}>{activeRoom.name}</Text>
                    </View>
                  </View>
                  <View>
                    {activeRoom.timerState === "running" && (
                      <View style={styles.statusBadge}>
                        <View style={styles.pingDot} />
                        <Text style={styles.statusText}>Running</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.roomFooter}>
                  <Text style={styles.subjectText}>
                    📚 {activeRoom.subject || "General"}
                  </Text>
                  <View style={styles.enterRoomLink}>
                    <Play size={12} color="#c084fc" style={{ marginRight: 4 }} />
                    <Text style={styles.enterRoomText}>Enter Room</Text>
                    <ArrowRight size={12} color="#c084fc" style={{ marginLeft: 4 }} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Cards - Section 3 */}
        <View style={styles.gridSection}>
          {/* Start Studying Solo */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/timer")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(99, 102, 241, 0.15)", "rgba(168, 85, 247, 0.15)"]}
              style={styles.actionCard}
            >
              <View style={[styles.iconBox, styles.iconBoxLarge, styles.focusIconBox]}>
                <BookOpen size={24} color="#818cf8" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Start Studying Solo</Text>
                <Text style={styles.actionSubtitle}>Begin a new focus session</Text>
                <View style={[styles.linkRow, { marginTop: 4 }]}>
                  <Text style={[styles.linkText, { color: "#818cf8" }]}>Let's go</Text>
                  <ArrowRight size={14} color="#818cf8" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Leaderboards */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/leaderboard")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(234, 179, 8, 0.15)", "rgba(249, 115, 22, 0.15)"]}
              style={styles.actionCard}
            >
              <View style={[styles.iconBox, styles.iconBoxLarge, styles.leaderboardIconBox]}>
                <Trophy size={24} color="#facc15" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Leaderboards</Text>
                <Text style={styles.actionSubtitle}>Check your ranking</Text>
                <View style={[styles.linkRow, { marginTop: 4 }]}>
                  <Text style={[styles.linkText, { color: "#facc15" }]}>View</Text>
                  <ArrowRight size={14} color="#facc15" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Live Sessions */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/stats")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(34, 197, 94, 0.15)", "rgba(16, 185, 129, 0.15)"]}
              style={styles.actionCard}
            >
              <View style={[styles.iconBox, styles.iconBoxLarge, styles.liveIconBox]}>
                <Sparkles size={24} color="#4ade80" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Live Sessions</Text>
                <Text style={styles.actionSubtitle}>See who's studying</Text>
                <View style={[styles.linkRow, { marginTop: 4 }]}>
                  <Text style={[styles.linkText, { color: "#4ade80" }]}>Watch</Text>
                  <ArrowRight size={14} color="#4ade80" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={[styles.card, styles.activityCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Calendar size={18} color="#818cf8" />
              <Text style={[styles.cardTitle, { fontSize: 16, marginLeft: 8 }]}>Recent Activity</Text>
            </View>
            <TouchableOpacity onPress={() => router.push(`/profile/${user.$id}`)}>
              <View style={styles.linkRow}>
                <Text style={styles.smallLinkText}>View All</Text>
                <ChevronRight size={14} color={Colors.dark.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No sessions yet. Start studying!
              </Text>
            </View>
          ) : (
            recentSessions.slice(0, 3).map((session) => (
              <View key={session.$id} style={styles.activityRow}>
                <View style={styles.activityLeft}>
                  <View
                    style={[
                      styles.activityIcon,
                      session.type === "break"
                        ? styles.breakIconBg
                        : styles.focusIconBg,
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {session.type === "break" ? "☕" : "🎯"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.activitySubject}>
                      {session.subject || "Study Session"}
                    </Text>
                    <Text style={styles.activityDuration}>
                      {Math.floor(session.duration / 60)} minutes
                    </Text>
                  </View>
                </View>
                <Text style={styles.activityTime}>
                  {new Date(session.endTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
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
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  // Header
  dashboardHeader: {
    marginTop: 20,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "transparent",
  },
  logoutText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  // Public Landing (Logged out)
  header: {
    marginTop: 40,
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
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    lineHeight: 24,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Grid System
  gridSection: {
    gap: 12,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  // Cards
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,10,10,0.6)", // Fallback/Base
  },
  halfCard: {
    flex: 1,
    minHeight: 140,
    justifyContent: "space-between",
    backgroundColor: "#0a0a0a", // Solid dark bg for nav cards
  },
  streakCard: {
    minHeight: 180,
    borderColor: "rgba(249, 115, 22, 0.2)",
    justifyContent: "space-between",
  },
  activeRoomCard: {
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  navCard: {
    backgroundColor: "#0a0a0a",
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  activityCard: {
    backgroundColor: "#0a0a0a",
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 12,
  },
  // Card Components
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flexDirection: "row",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxLarge: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  streakIconBox: {
    backgroundColor: "rgba(249, 115, 22, 1)", // solid orange equivalent to gradient start
    shadowColor: "#f97316",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  hoursIconBox: { backgroundColor: "rgba(99, 102, 241, 0.2)" },
  xpIconBox: { backgroundColor: "rgba(234, 179, 8, 0.2)" },
  analyticsIconBox: { backgroundColor: "rgba(99, 102, 241, 0.1)" },
  curriculumIconBox: { backgroundColor: "rgba(16, 185, 129, 0.1)" },
  roomIconBox: { backgroundColor: "rgba(168, 85, 247, 0.2)" },
  focusIconBox: { backgroundColor: "rgba(99, 102, 241, 0.2)" },
  leaderboardIconBox: { backgroundColor: "rgba(234, 179, 8, 0.2)" },
  liveIconBox: { backgroundColor: "rgba(34, 197, 94, 0.2)" },

  // Typography & Labels
  cardLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.dark.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardSubLabel: {
    fontSize: 13,
    color: "#fb923c", // orange-400
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 16,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  valueLarge: {
    fontSize: 56,
    fontWeight: "700",
    color: "#fff",
  },
  valueMedium: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },
  unit: {
    fontSize: 20,
    fontWeight: "500",
    color: Colors.dark.textMuted,
  },
  unitSmall: {
    fontSize: 16,
    color: Colors.dark.textMuted,
  },
  streakFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  streakFooterText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  smallLinkText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },

  // Active Room specific
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  statusText: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "600",
  },
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  subjectText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
  },
  enterRoomLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  enterRoomText: {
    color: "#c084fc", // purple-400
    fontWeight: "600",
    fontSize: 13,
  },

  // Action Cards
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },

  // Activity List
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyStateText: {
    color: Colors.dark.textMuted,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  focusIconBg: { backgroundColor: "rgba(99, 102, 241, 0.15)" },
  breakIconBg: { backgroundColor: "rgba(34, 197, 94, 0.15)" },
  activitySubject: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  activityDuration: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
});
