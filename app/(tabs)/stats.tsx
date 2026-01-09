import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart2, Calendar, ChevronRight, Clock, Flame, Target, TrendingUp, Zap } from "lucide-react-native";
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
import { TouchableOpacity } from "react-native-gesture-handler";
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
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"personal" | "global">("personal");
    const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");
    const [globalStats, setGlobalStats] = useState<GlobalStats>({
        totalUsers: 0,
        totalHoursGlobal: 0,
        activeStudents: 0,
    });
    const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
    const [personalSessions, setPersonalSessions] = useState<StudySession[]>([]);

    const loadStats = async () => {
        try {
            // Global Stats
            const profiles = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.PROFILES,
                [Query.limit(5000)]
            );

            const totalHours = profiles.documents.reduce(
                (sum: number, profile: any) => sum + (profile.totalHours || 0),
                0
            );

            const activeSessions = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.STUDY_SESSIONS,
                [Query.equal("status", "active"), Query.limit(1000)]
            );

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

            // Personal Stats
            if (user) {
                let queries = [
                    Query.equal("userId", user.$id),
                    Query.equal("status", "completed"),
                    Query.orderDesc("endTime"),
                    Query.limit(100),
                ];

                if (timeRange === "week") {
                    const date = new Date();
                    date.setDate(date.getDate() - 7);
                    queries.push(Query.greaterThan("endTime", date.toISOString()));
                } else if (timeRange === "month") {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 1);
                    queries.push(Query.greaterThan("endTime", date.toISOString()));
                }

                const personalResponse = await databases.listDocuments(
                    DB_ID,
                    COLLECTIONS.STUDY_SESSIONS,
                    queries
                );
                setPersonalSessions(personalResponse.documents as unknown as StudySession[]);
            }
        } catch (error) {
            console.error("Failed to load stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processPersonalData = () => {
        const totalSeconds = personalSessions.reduce((acc, session) => acc + (session.duration || 0), 0);
        const totalHours = (totalSeconds / 3600).toFixed(1);

        // Group by day for the trend list
        const sessionsByDay = personalSessions.reduce((acc: any, session) => {
            const date = new Date(session.endTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
            acc[date] = (acc[date] || 0) + (session.duration || 0) / 3600;
            return acc;
        }, {});

        const dailyData = Object.keys(sessionsByDay).map(date => ({
            date,
            hours: parseFloat(sessionsByDay[date].toFixed(2)),
        }));

        // Subject distribution
        const sessionsBySubject = personalSessions.reduce((acc: any, session) => {
            const subject = session.subject || "Uncategorized";
            acc[subject] = (acc[subject] || 0) + (session.duration || 0);
            return acc;
        }, {});

        const totalDuration = Object.values(sessionsBySubject).reduce((a: any, b: any) => a + b, 0) as number;
        const subjectData = Object.keys(sessionsBySubject).map(subject => {
            const val = sessionsBySubject[subject];
            const pct = totalDuration > 0 ? (val / totalDuration * 100).toFixed(0) : "0";
            return {
                name: subject,
                value: val,
                percentage: pct
            };
        }).sort((a, b) => b.value - a.value);

        return { totalHours, dailyData, subjectData, totalDuration };
    };

    const { totalHours, dailyData, subjectData, totalDuration } = processPersonalData();

    useEffect(() => {
        loadStats();
    }, [user, timeRange]);

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
                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "personal" && styles.activeTab]}
                        onPress={() => setActiveTab("personal")}
                    >
                        <Text style={[styles.tabText, activeTab === "personal" && styles.activeTabText]}>Personal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "global" && styles.activeTab]}
                        onPress={() => setActiveTab("global")}
                    >
                        <Text style={[styles.tabText, activeTab === "global" && styles.activeTabText]}>Community</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === "personal" ? (
                    <>
                        {/* Header for Personal */}
                        <View style={styles.header}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>Study</Text>
                                <Text style={styles.titleHighlight}>Analytics</Text>
                            </View>
                            <Text style={styles.description}>
                                Track your personal habits and optimization.
                            </Text>
                        </View>

                        {/* Time Range Filter */}
                        <View style={styles.rangeContainer}>
                            {[
                                { id: "week", label: "7 Days" },
                                { id: "month", label: "30 Days" },
                                { id: "all", label: "All Time" }
                            ].map((range) => (
                                <TouchableOpacity
                                    key={range.id}
                                    onPress={() => setTimeRange(range.id as any)}
                                    style={[
                                        styles.rangeButton,
                                        timeRange === range.id && styles.activeRangeButton
                                    ]}
                                >
                                    <Text style={[
                                        styles.rangeText,
                                        timeRange === range.id && styles.activeRangeText
                                    ]}>
                                        {range.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Personal Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, styles.personalStatCard]}>
                                <View style={[styles.statIconContainer, styles.personalIconBox]}>
                                    <Clock size={18} color="#818cf8" />
                                </View>
                                <Text style={styles.statLabel}>TOTAL TIME</Text>
                                <Text style={styles.personalStatValue}>{totalHours}h</Text>
                            </View>

                            <View style={[styles.statCard, styles.personalStatCard]}>
                                <View style={[styles.statIconContainer, styles.personalIconBoxEmerald]}>
                                    <Calendar size={18} color="#34d399" />
                                </View>
                                <Text style={styles.statLabel}>SESSIONS</Text>
                                <Text style={styles.personalStatValue}>{personalSessions.length}</Text>
                            </View>

                            <View style={[styles.statCard, styles.personalStatCard]}>
                                <View style={[styles.statIconContainer, styles.personalIconBoxAmber]}>
                                    <Target size={18} color="#fbbf24" />
                                </View>
                                <Text style={styles.statLabel}>AVG. SESSION</Text>
                                <Text style={styles.personalStatValue}>
                                    {personalSessions.length > 0
                                        ? (totalDuration / personalSessions.length / 60).toFixed(0)
                                        : 0}m
                                </Text>
                            </View>
                        </View>

                        {/* Daily Trends Visualization */}
                        <View style={styles.visualizationSection}>
                            <View style={styles.vizHeader}>
                                <TrendingUp size={20} color="#818cf8" />
                                <Text style={styles.vizTitle}>Daily Trends</Text>
                            </View>
                            {dailyData.length > 0 ? (
                                <View style={styles.trendList}>
                                    {dailyData.slice(-7).map((item, idx) => (
                                        <View key={idx} style={styles.trendRow}>
                                            <Text style={styles.trendLabel}>{item.date}</Text>
                                            <View style={styles.trendBarContainer}>
                                                <LinearGradient
                                                    colors={["#818cf8", "#6366f1"]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={[
                                                        styles.trendBar,
                                                        { width: `${Math.min((item.hours / 8) * 100, 100)}%` as any }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.trendValue}>{item.hours}h</Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No data for this range.</Text>
                                </View>
                            )}
                        </View>

                        {/* Subject Distribution */}
                        <View style={styles.visualizationSection}>
                            <View style={styles.vizHeader}>
                                <BarChart2 size={20} color="#34d399" />
                                <Text style={styles.vizTitle}>Subjects</Text>
                            </View>
                            {subjectData.length > 0 ? (
                                <View style={styles.subjectList}>
                                    {subjectData.map((item, idx) => (
                                        <View key={idx} style={styles.subjectRow}>
                                            <View style={styles.subjectHeader}>
                                                <Text style={styles.subjectName}>{item.name}</Text>
                                                <Text style={styles.subjectPercent}>{item.percentage}%</Text>
                                            </View>
                                            <View style={styles.subjectBarContainer}>
                                                <LinearGradient
                                                    colors={["#34d399", "#10b981"]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={[
                                                        styles.subjectBar,
                                                        { width: `${item.percentage}%` as any }
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No recent subjects.</Text>
                                </View>
                            )}
                        </View>

                        {/* Recent Personal Sessions */}
                        <View style={styles.activitySection}>
                            <View style={styles.vizHeader}>
                                <Clock size={20} color="#818cf8" />
                                <Text style={styles.vizTitle}>Recent Sessions</Text>
                            </View>

                            {personalSessions.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No sessions found.</Text>
                                </View>
                            ) : (
                                personalSessions.slice(0, 5).map((session) => (
                                    <View key={session.$id} style={styles.activityRow}>
                                        <View style={[styles.activityIcon, styles.personalIconBox]}>
                                            <Text style={styles.activityEmoji}>🎯</Text>
                                        </View>
                                        <View style={styles.activityInfo}>
                                            <Text style={styles.activitySubject}>{session.subject || "Study Session"}</Text>
                                            <Text style={styles.activityDuration}>{Math.floor(session.duration / 60)}m • {new Date(session.endTime).toLocaleDateString()}</Text>
                                        </View>
                                        <ChevronRight size={16} color={Colors.dark.textMuted} />
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                ) : (
                    <>
                        {/* Global Statistics UI */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Community</Text>
                            <Text style={styles.titleHighlight}>Statistics</Text>
                            <Text style={styles.description}>
                                Track global study progress and recent activity.
                            </Text>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, styles.statCardPrimary]}>
                                <View style={styles.statIconContainer}>
                                    <Clock size={20} color={Colors.dark.primary} />
                                </View>
                                <Text style={styles.statValue}>
                                    {globalStats.totalHoursGlobal.toLocaleString()}
                                </Text>
                                <Text style={styles.statLabel}>Total Hours Studied</Text>
                            </View>

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

                            <View style={styles.statCard}>
                                <View style={[styles.statIconContainer, styles.statIconWarning]}>
                                    <Zap size={20} color={Colors.dark.warning} />
                                </View>
                                <Text style={styles.statValue}>{globalStats.activeStudents}</Text>
                                <Text style={styles.statLabel}>Studying Now</Text>
                            </View>

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
                    </>
                )}
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
    tabContainer: {
        flexDirection: "row",
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: Colors.dark.surfaceHighlight,
    },
    tabText: {
        color: Colors.dark.textMuted,
        fontWeight: "500",
        fontSize: 14,
    },
    activeTabText: {
        color: Colors.dark.text,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    rangeContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    rangeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    activeRangeButton: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    rangeText: {
        fontSize: 12,
        color: Colors.dark.textMuted,
        fontWeight: "500",
    },
    activeRangeText: {
        color: "#fff",
    },
    personalStatCard: {
        backgroundColor: Colors.dark.surface,
        borderColor: Colors.dark.border,
    },
    personalIconBox: {
        backgroundColor: "rgba(129, 140, 248, 0.1)",
    },
    personalIconBoxEmerald: {
        backgroundColor: "rgba(52, 211, 153, 0.1)",
    },
    personalIconBoxAmber: {
        backgroundColor: "rgba(251, 191, 36, 0.1)",
    },
    personalStatValue: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.dark.text,
        marginTop: 4,
    },
    visualizationSection: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    vizHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 20,
    },
    vizTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.dark.text,
    },
    trendList: {
        gap: 12,
    },
    trendRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    trendLabel: {
        width: 50,
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
    trendBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: Colors.dark.surfaceHighlight,
        borderRadius: 4,
        overflow: "hidden",
    },
    trendBar: {
        height: "100%",
        backgroundColor: "#818cf8",
        borderRadius: 4,
    },
    trendValue: {
        width: 40,
        fontSize: 12,
        color: Colors.dark.text,
        textAlign: "right",
    },
    subjectList: {
        gap: 16,
    },
    subjectRow: {
        gap: 8,
    },
    subjectHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    subjectName: {
        flex: 1,
        fontSize: 14,
        color: Colors.dark.text,
    },
    subjectPercent: {
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
    subjectBarContainer: {
        height: 6,
        backgroundColor: Colors.dark.surfaceHighlight,
        borderRadius: 3,
        overflow: "hidden",
    },
    subjectBar: {
        height: "100%",
        borderRadius: 3,
    },
});
