import { Colors } from "@/constants/Colors";
import { BUCKET_ID, COLLECTIONS, databases, DB_ID, storage } from "@/lib/appwrite";
import { Image } from "expo-image";
import { router } from "expo-router";
import { BookOpen, Clock, DoorOpen, Flame, Plus, User, Users } from "lucide-react-native";
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

interface Room {
    $id: string;
    roomId: string;
    name: string;
    subject: string;
    activeUsers: number;
    timerState: "idle" | "running" | "paused";
    creatorName?: string;
}

interface StudySession {
    $id: string;
    userId: string;
    username: string;
    subject: string;
    startTime: string;
    status: "active" | "paused" | "completed";
    sessionType: "focus" | "break";
    profilePicture?: string;
    streak?: number;
    totalHours?: number;
    duration?: number;
}

export default function RoomsScreen() {
    const [activeTab, setActiveTab] = useState<"sessions" | "rooms">("sessions");
    const [rooms, setRooms] = useState<Room[]>([]);
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchSessions(), fetchRooms()]);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ROOMS,
                [Query.orderDesc("activeUsers"), Query.limit(50)]
            );
            setRooms(response.documents as unknown as Room[]);
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        }
    };

    const fetchSessions = async () => {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.LIVE_SESSIONS,
                [
                    Query.equal("status", "active"),
                    Query.equal("isPublic", true),
                    Query.orderDesc("startTime"),
                    Query.limit(50)
                ]
            );
            setSessions(response.documents as unknown as StudySession[]);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        // Refresh specific tab or both? Let's refresh both
        fetchData();
    };

    const getDuration = (startTime: string) => {
        const start = new Date(startTime).getTime();
        const diff = Math.floor((Date.now() - start) / 1000);
        const mins = Math.floor(diff / 60);
        return `${mins}m`;
    };

    const renderEmptyState = (type: "sessions" | "rooms") => (
        <View style={styles.emptyState}>
            {type === "sessions" ? (
                <Users size={48} color={Colors.dark.textMuted} />
            ) : (
                <DoorOpen size={48} color={Colors.dark.textMuted} />
            )}
            <Text style={styles.emptyStateTitle}>
                {type === "sessions" ? "No active sessions" : "No rooms available"}
            </Text>
            <Text style={styles.emptyStateText}>
                {type === "sessions"
                    ? "Start a public timer to show up here!"
                    : "Create a room to study with others."}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Live</Text>
                        <Text style={styles.titleHighlight}>Study</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.hostBtn}
                        onPress={() => router.push("/rooms/start")}
                    >
                        <Plus size={18} color="#000" />
                        <Text style={styles.hostBtnText}>Host / Join</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === "sessions" && styles.tabButtonActive]}
                        onPress={() => setActiveTab("sessions")}
                    >
                        <User size={16} color={activeTab === "sessions" ? "#fff" : Colors.dark.textMuted} />
                        <Text style={[styles.tabText, activeTab === "sessions" && styles.tabTextActive]}>Solo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === "rooms" && styles.tabButtonActive]}
                        onPress={() => setActiveTab("rooms")}
                    >
                        <DoorOpen size={16} color={activeTab === "rooms" ? "#fff" : Colors.dark.textMuted} />
                        <Text style={[styles.tabText, activeTab === "rooms" && styles.tabTextActive]}>Rooms</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            ) : (
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
                    {activeTab === "sessions" ? (
                        sessions.length === 0 ? renderEmptyState("sessions") : (
                            sessions.map((session) => (
                                <View key={session.$id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.userContainer}>
                                            <View style={styles.avatar}>
                                                {session.profilePicture ? (
                                                    <Image
                                                        source={{
                                                            uri: session.profilePicture.startsWith("http")
                                                                ? session.profilePicture
                                                                : storage.getFilePreview(BUCKET_ID, session.profilePicture).toString()
                                                        }}
                                                        style={styles.avatarImage}
                                                    />
                                                ) : (
                                                    <Text style={styles.avatarText}>
                                                        {session.username?.[0]?.toUpperCase() || "?"}
                                                    </Text>
                                                )}
                                                <View style={[styles.statusIndicator, { backgroundColor: session.sessionType === "break" ? Colors.dark.success : Colors.dark.primary }]} />
                                            </View>
                                            <View style={styles.userInfo}>
                                                <Text style={styles.userName}>{session.username}</Text>
                                                <View style={styles.statsRow}>
                                                    {session.streak !== undefined && session.streak > 0 && (
                                                        <View style={styles.statBadge}>
                                                            <Flame size={10} color="#f97316" />
                                                            <Text style={styles.statText}>{session.streak}d</Text>
                                                        </View>
                                                    )}
                                                    {session.totalHours !== undefined && session.totalHours > 0 && (
                                                        <View style={styles.statBadge}>
                                                            <BookOpen size={10} color={Colors.dark.textMuted} />
                                                            <Text style={styles.statText}>{Math.round(session.totalHours)}h</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.liveBadge}>
                                            <View style={styles.recordingDot} />
                                            <Text style={styles.liveText}>LIVE</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardBody}>
                                        <Text style={styles.subjectText}>{session.subject || "Focus Session"}</Text>
                                        <View style={styles.timerRow}>
                                            <Clock size={14} color={session.sessionType === "break" ? Colors.dark.success : Colors.dark.primary} />
                                            <Text style={[styles.timerText, { color: session.sessionType === "break" ? Colors.dark.success : Colors.dark.primary }]}>
                                                {getDuration(session.startTime)}
                                            </Text>
                                            <Text style={styles.sessionType}>
                                                {session.sessionType === "break" ? "• Break" : "• Focus"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )
                    ) : (
                        rooms.length === 0 ? renderEmptyState("rooms") : (
                            rooms.map((room) => (
                                <TouchableOpacity
                                    key={room.$id}
                                    style={styles.card}
                                    onPress={() => router.push({
                                        pathname: "/rooms/[roomId]",
                                        params: { roomId: room.roomId }
                                    })}
                                >
                                    <View style={styles.roomHeader}>
                                        <View style={styles.roomIcon}>
                                            <DoorOpen size={20} color={Colors.dark.primary} />
                                        </View>
                                        <View style={styles.roomInfo}>
                                            <Text style={styles.roomName}>{room.name || "Study Room"}</Text>
                                            <Text style={styles.roomSubject}>
                                                📚 {room.subject || "General"}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.roomFooter}>
                                        <View style={styles.roomStat}>
                                            <Users size={14} color={Colors.dark.textMuted} />
                                            <Text style={styles.roomStatText}>
                                                {room.activeUsers || 0} studying
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                room.timerState === "running" && styles.statusBadgeActive,
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.statusDot,
                                                    room.timerState === "running" && styles.statusDotActive,
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    room.timerState === "running" && styles.statusTextActive,
                                                ]}
                                            >
                                                {room.timerState === "running" ? "Active" : "Idle"}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )
                    )}
                </ScrollView>
            )}
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
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    hostBtn: {
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    hostBtnText: {
        color: "#000",
        fontSize: 13,
        fontWeight: "700",
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
        marginBottom: 16,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 4,
        alignSelf: "flex-start",
    },
    tabButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    tabButtonActive: {
        backgroundColor: Colors.dark.surfaceHighlight, // or primary with opacity
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.dark.textMuted,
    },
    tabTextActive: {
        color: "#fff",
        fontWeight: "600",
    },
    card: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    // Session Card Styles
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    userContainer: {
        flexDirection: "row",
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.dark.surfaceHighlight,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.dark.textMuted,
    },
    statusIndicator: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.dark.surface,
    },
    userInfo: {
        justifyContent: "center",
    },
    userName: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: "row",
        gap: 8,
    },
    statBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 11,
        color: Colors.dark.textMuted,
    },
    liveBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(239, 68, 68, 0.1)", // Red/10
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    recordingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#ef4444", // Red
    },
    liveText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#ef4444",
    },
    cardBody: {
        backgroundColor: Colors.dark.background,
        borderRadius: 12,
        padding: 12,
    },
    subjectText: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 4,
    },
    timerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    timerText: {
        fontSize: 14,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    sessionType: {
        fontSize: 14,
        color: Colors.dark.textMuted,
    },
    // Room Card Styles (Reused/Modified)
    roomHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    roomIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    roomInfo: {
        flex: 1,
    },
    roomName: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 2,
    },
    roomSubject: {
        fontSize: 14,
        color: Colors.dark.textMuted,
    },
    roomFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    roomStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    roomStatText: {
        fontSize: 13,
        color: Colors.dark.textMuted,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: Colors.dark.surfaceHighlight,
    },
    statusBadgeActive: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.textMuted,
    },
    statusDotActive: {
        backgroundColor: Colors.dark.success,
    },
    statusText: {
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
    statusTextActive: {
        color: Colors.dark.success,
    },
    emptyState: {
        alignItems: "center",
        padding: 48,
        marginTop: 20,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        textAlign: "center",
    },
});
