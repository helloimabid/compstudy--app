import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Clock, Flame, Zap } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
    bio?: string;
    profilePicture?: string;
    totalHours: number;
    streak: number;
    xp: number;
}

interface StudySession {
    $id: string;
    subject: string;
    duration: number;
    endTime: string;
    type: "focus" | "break";
}

export default function ProfileScreen() {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        if (!userId) return;

        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.PROFILES,
                [Query.equal("userId", userId)]
            );

            if (response.documents.length > 0) {
                setProfile(response.documents[0] as unknown as Profile);

                // Fetch recent sessions
                const sessionsResponse = await databases.listDocuments(
                    DB_ID,
                    COLLECTIONS.STUDY_SESSIONS,
                    [
                        Query.equal("userId", userId),
                        Query.equal("status", "completed"),
                        Query.orderDesc("endTime"),
                        Query.limit(10),
                    ]
                );
                setRecentSessions(sessionsResponse.documents as unknown as StudySession[]);
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
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

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Profile not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Info */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {profile.username[0]?.toUpperCase() || "?"}
                        </Text>
                    </View>
                    <Text style={styles.username}>{profile.username}</Text>
                    {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, styles.iconBlue]}>
                            <Clock size={20} color={Colors.dark.primary} />
                        </View>
                        <Text style={styles.statValue}>
                            {profile.totalHours.toFixed(1)}h
                        </Text>
                        <Text style={styles.statLabel}>Total Hours</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, styles.iconOrange]}>
                            <Flame size={20} color="#f97316" />
                        </View>
                        <Text style={styles.statValue}>{profile.streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, styles.iconYellow]}>
                            <Zap size={20} color={Colors.dark.warning} />
                        </View>
                        <Text style={styles.statValue}>{profile.xp}</Text>
                        <Text style={styles.statLabel}>XP</Text>
                    </View>
                </View>

                {/* Recent Sessions */}
                <View style={styles.sessionsSection}>
                    <Text style={styles.sectionTitle}>Recent Sessions</Text>
                    {recentSessions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No sessions yet</Text>
                        </View>
                    ) : (
                        recentSessions.map((session) => (
                            <View key={session.$id} style={styles.sessionRow}>
                                <View
                                    style={[
                                        styles.sessionIcon,
                                        session.type === "break"
                                            ? styles.sessionIconBreak
                                            : styles.sessionIconFocus,
                                    ]}
                                >
                                    <Text style={styles.sessionEmoji}>
                                        {session.type === "break" ? "☕" : "🎯"}
                                    </Text>
                                </View>
                                <View style={styles.sessionInfo}>
                                    <Text style={styles.sessionSubject}>
                                        {session.subject || "Study Session"}
                                    </Text>
                                    <Text style={styles.sessionDuration}>
                                        {Math.floor(session.duration / 60)} min
                                    </Text>
                                </View>
                                <Text style={styles.sessionTime}>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    profileCard: {
        alignItems: "center",
        marginBottom: 24,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.dark.primary,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: "700",
        color: "#fff",
    },
    username: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.dark.text,
        marginBottom: 4,
    },
    bio: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        textAlign: "center",
        maxWidth: "80%",
    },
    statsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    iconBlue: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
    },
    iconOrange: {
        backgroundColor: "rgba(249, 115, 22, 0.1)",
    },
    iconYellow: {
        backgroundColor: "rgba(234, 179, 8, 0.1)",
    },
    statValue: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.dark.text,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.dark.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    sessionsSection: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 16,
    },
    sessionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    sessionIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    sessionIconFocus: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
    },
    sessionIconBreak: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
    },
    sessionEmoji: {
        fontSize: 16,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionSubject: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.dark.text,
    },
    sessionDuration: {
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
    sessionTime: {
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
