import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { router } from "expo-router";
import { DoorOpen, Users } from "lucide-react-native";
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
}

export default function RoomsScreen() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRooms = async () => {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ROOMS,
                [Query.orderDesc("$createdAt"), Query.limit(50)]
            );
            setRooms(response.documents as unknown as Room[]);
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRooms();
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
                    <Text style={styles.title}>Study</Text>
                    <Text style={styles.titleHighlight}>Rooms</Text>
                    <Text style={styles.description}>
                        Join a room to study with others in real-time.
                    </Text>
                </View>

                {/* Rooms List */}
                {rooms.length === 0 ? (
                    <View style={styles.emptyState}>
                        <DoorOpen size={48} color={Colors.dark.textMuted} />
                        <Text style={styles.emptyStateTitle}>No rooms available</Text>
                        <Text style={styles.emptyStateText}>
                            Create a room from the website to get started.
                        </Text>
                    </View>
                ) : (
                    rooms.map((room) => (
                        <TouchableOpacity
                            key={room.$id}
                            style={styles.roomCard}
                            onPress={() => router.push(`/room/${room.roomId}`)}
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
                                        {room.activeUsers || 1} studying
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
    roomCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
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
