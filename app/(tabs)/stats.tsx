import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { BarChart2, Clock, Flame, Zap } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

interface StudySession {
    $id: string;
    subject: string;
    duration: number;
    endTime: string;
    type: "focus" | "break";
}

interface GlobalStats {
    totalUsers: number;
    totalHoursGlobal: number;
    activeStudents: number;
}

export default function StatsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [globalStats, setGlobalStats] = useState<GlobalStats>({
        totalUsers: 0,
        totalHoursGlobal: 0,
        activeStudents: 0,
    });
    const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);

    const loadStats = async () => {
        try {
            // Get all profiles for global stats
            const profiles = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.PROFILES,
                [Query.limit(5000)]
            );

            // Calculate total hours globally
            const totalHours = profiles.documents.reduce(
                (sum: number, profile: any) => sum + (profile.totalHours || 0),
                0
            );

            // Get active sessions
            const activeSessions = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.STUDY_SESSIONS,
                [Query.equal("status", "active"), Query.limit(1000)]
            );

            // Get recent completed sessions (global)
            const sessions = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.STUDY_SESSIONS,
                [
                    Query.equal("status", "completed"),
                    Query.orderDesc("endTime"),
                    Query.limit(10),
                ]
            );

            setGlobalStats({
                totalUsers: profiles.total,
                totalHoursGlobal: Math.floor(totalHours),
                activeStudents: activeSessions.total,
            });

            setRecentSessions(sessions.documents as unknown as StudySession[]);
        } catch (error) {
            console.error("Failed to load stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
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
                    <Text style={styles.title}>Community</Text>
                    <Text style={styles.titleHighlight}>Statistics</Text>
                    <Text style={styles.description}>
                        Track global study progress and recent activity.
                    </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Total Hours Card */}
                    <View style={[styles.statCard, styles.statCardPrimary]}>
                        <View style={styles.statIconContainer}>
                            <Clock size={20} color={Colors.dark.primary} />
                        </View>
                        <Text style={styles.statValue}>
                            {globalStats.totalHoursGlobal.toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Total Hours Studied</Text>
                    </View>

                    {/* Total Users Card */}
                    <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, styles.statIconSuccess]}>
                            <BarChart2 size={20} color={Colors.dark.success} />
                        </View>
                        <Text style={styles.statValue}>
                            {globalStats.totalUsers > 1000
                                ? (globalStats.totalUsers / 1000).toFixed(1) + "k"
                                : globalStats.totalUsers}
                        </Text>
                        <Text style={styles.statLabel}>Total Students</Text>
                    </View>

                    {/* Active Now Card */}
                    <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, styles.statIconWarning]}>
                            <Zap size={20} color={Colors.dark.warning} />
                        </View>
                        <Text style={styles.statValue}>{globalStats.activeStudents}</Text>
                        <Text style={styles.statLabel}>Studying Now</Text>
                    </View>

                    {/* Streak Placeholder */}
                    <View style={[styles.statCard, styles.statCardWide]}>
                        <View style={[styles.statIconContainer, styles.statIconWarning]}>
                            <Flame size={20} color={Colors.dark.warning} />
                        </View>
                        <Text style={styles.statCardTitle}>Weekly Consistency</Text>
                        <View style={styles.streakRow}>
                            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                                <View key={i} style={styles.streakDay}>
                                    <View
                                        style={[
                                            styles.streakDot,
                                            i < 4 && styles.streakDotActive,
                                        ]}
                                    />
                                    <Text style={styles.streakDayText}>{day}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activitySection}>
                    <Text style={styles.sectionTitle}>Recent Global Activity</Text>

                    {recentSessions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No recent sessions.</Text>
                        </View>
                    ) : (
                        recentSessions.map((session) => (
                            <View key={session.$id} style={styles.activityRow}>
                                <View
                                    style={[
                                        styles.activityIcon,
                                        session.type === "break"
                                            ? styles.activityIconBreak
                                            : styles.activityIconFocus,
                                    ]}
                                >
                                    <Text style={styles.activityEmoji}>
                                        {session.type === "break" ? "☕" : "🎯"}
                                    </Text>
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activitySubject}>
                                        {session.subject || "Study Session"}
                                    </Text>
                                    <Text style={styles.activityDuration}>
                                        {Math.floor(session.duration / 60)} minutes
                                    </Text>
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
        marginBottom: 24,
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
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        minWidth: "45%",
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statCardPrimary: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderColor: "rgba(99, 102, 241, 0.2)",
    },
    statCardWide: {
        minWidth: "100%",
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    statIconSuccess: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
    },
    statIconWarning: {
        backgroundColor: "rgba(234, 179, 8, 0.1)",
    },
    statValue: {
        fontSize: 28,
        fontWeight: "700",
        color: Colors.dark.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.dark.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    statCardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 16,
    },
    streakRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    streakDay: {
        alignItems: "center",
        gap: 8,
    },
    streakDot: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.dark.surfaceHighlight,
    },
    streakDotActive: {
        backgroundColor: Colors.dark.warning,
    },
    streakDayText: {
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 16,
    },
    activitySection: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    activityRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    activityIconFocus: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
    },
    activityIconBreak: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
    },
    activityEmoji: {
        fontSize: 18,
    },
    activityInfo: {
        flex: 1,
    },
    activitySubject: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 2,
    },
    activityDuration: {
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
    activityTime: {
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
    emptyState: {
        padding: 24,
        alignItems: "center",
    },
    emptyStateText: {
        color: Colors.dark.textMuted,
        fontSize: 14,
    },
});
