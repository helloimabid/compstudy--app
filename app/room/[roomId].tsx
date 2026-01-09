import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Users } from "lucide-react-native";
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

interface Room {
    $id: string;
    roomId: string;
    name: string;
    subject: string;
    activeUsers: number;
    timerState: "idle" | "running" | "paused";
    timerDuration: number;
    timerRemaining: number;
    creatorId: string;
}

export default function RoomScreen() {
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoom();
    }, [roomId]);

    const fetchRoom = async () => {
        if (!roomId) return;

        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ROOMS,
                [Query.equal("roomId", roomId)]
            );

            if (response.documents.length > 0) {
                setRoom(response.documents[0] as unknown as Room);
            }
        } catch (error) {
            console.error("Failed to fetch room:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

    if (!room) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Room not found</Text>
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
                <Text style={styles.headerTitle}>Study Room</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Room Info */}
                <View style={styles.roomCard}>
                    <Text style={styles.roomName}>{room.name || "Study Room"}</Text>
                    <Text style={styles.roomSubject}>📚 {room.subject || "General"}</Text>

                    <View style={styles.roomStats}>
                        <View style={styles.roomStat}>
                            <Users size={18} color={Colors.dark.primary} />
                            <Text style={styles.roomStatText}>
                                {room.activeUsers || 1} studying
                            </Text>
                        </View>
                        <View style={styles.roomStat}>
                            <View
                                style={[
                                    styles.statusDot,
                                    room.timerState === "running" && styles.statusDotActive,
                                ]}
                            />
                            <Text style={styles.roomStatText}>
                                {room.timerState === "running"
                                    ? "Active"
                                    : room.timerState === "paused"
                                        ? "Paused"
                                        : "Idle"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Timer Card */}
                <View style={styles.timerCard}>
                    <Text style={styles.timerLabel}>Session Timer</Text>
                    <Text style={styles.timerDisplay}>
                        {formatTime(room.timerRemaining || room.timerDuration || 1500)}
                    </Text>
                    <Text style={styles.timerStatus}>
                        {room.timerState === "running"
                            ? "🎯 Focus in progress"
                            : room.timerState === "paused"
                                ? "⏸️ Paused"
                                : "Ready to start"}
                    </Text>
                </View>

                {/* Info Note */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Room Controls</Text>
                    <Text style={styles.infoText}>
                        Room controls are synced with the web version. Start or pause
                        the timer from the website to sync with all participants.
                    </Text>
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
    roomCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    roomName: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.dark.text,
        marginBottom: 8,
    },
    roomSubject: {
        fontSize: 16,
        color: Colors.dark.textMuted,
        marginBottom: 16,
    },
    roomStats: {
        flexDirection: "row",
        gap: 16,
    },
    roomStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    roomStatText: {
        fontSize: 14,
        color: Colors.dark.text,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.dark.textMuted,
    },
    statusDotActive: {
        backgroundColor: Colors.dark.success,
    },
    timerCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 32,
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    timerLabel: {
        fontSize: 12,
        color: Colors.dark.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    timerDisplay: {
        fontSize: 64,
        fontWeight: "700",
        color: Colors.dark.text,
        fontVariant: ["tabular-nums"],
        marginBottom: 8,
    },
    timerStatus: {
        fontSize: 14,
        color: Colors.dark.textMuted,
    },
    infoCard: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(99, 102, 241, 0.2)",
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.dark.primary,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        lineHeight: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyStateText: {
        color: Colors.dark.textMuted,
        fontSize: 16,
    },
});
