import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowRight, BookOpen, Globe, Plus, Sparkles, Users } from "lucide-react-native";
import { useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StartStudyingScreen() {
    const { user, loading } = useAuth();
    const [roomCode, setRoomCode] = useState("");

    const handleJoinRoom = () => {
        if (roomCode.trim()) {
            router.push(`/room/${roomCode.trim()}`);
        }
    };

    if (loading) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Ready to <Text style={styles.titleHighlight}>Focus?</Text></Text>
                    <Text style={styles.subtitle}>
                        Join a collaborative study room or create your own private space.
                    </Text>
                </View>

                {/* Bento Grid */}
                <View style={styles.grid}>
                    {/* Join Room - Large */}
                    <View style={styles.bentoLarge}>
                        <LinearGradient
                            colors={["rgba(99, 102, 241, 0.15)", "rgba(10, 10, 10, 0)"]}
                            style={styles.cardGradient}
                        />
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: "rgba(99, 102, 241, 0.2)" }]}>
                                <Users size={20} color="#818cf8" />
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Quick Join</Text>
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Join a Study Room</Text>
                            <Text style={styles.cardSubtitle}>Enter a room code to join friends</Text>

                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Room code"
                                    placeholderTextColor={Colors.dark.textMuted}
                                    value={roomCode}
                                    onChangeText={setRoomCode}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity style={styles.joinButton} onPress={handleJoinRoom}>
                                    <ArrowRight size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        {/* Solo Study */}
                        <TouchableOpacity
                            style={styles.bentoSmall}
                            onPress={() => router.push("/(tabs)/timer")}
                        >
                            <View style={[styles.iconBox, { backgroundColor: "rgba(16, 185, 129, 0.2)" }]}>
                                <BookOpen size={20} color="#34d399" />
                            </View>
                            <View style={styles.smallCardBody}>
                                <Text style={styles.cardTitleSmall}>Solo Focus</Text>
                                <Text style={styles.cardSubtitleSmall}>Start personal timer</Text>
                                <View style={styles.actionRowEmerald}>
                                    <Text style={styles.actionTextEmerald}>Start</Text>
                                    <Sparkles size={14} color="#34d399" />
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Create Room */}
                        <TouchableOpacity
                            style={styles.bentoSmall}
                            onPress={() => router.push("/rooms/create")}
                        >
                            <View style={[styles.iconBox, { backgroundColor: "rgba(168, 85, 247, 0.2)" }]}>
                                <Plus size={20} color="#a855f7" />
                            </View>
                            <View style={styles.smallCardBody}>
                                <Text style={styles.cardTitleSmall}>Create Room</Text>
                                <Text style={styles.cardSubtitleSmall}>Host a session</Text>
                                <View style={styles.actionRowPurple}>
                                    <Text style={styles.actionTextPurple}>Create</Text>
                                    <ArrowRight size={14} color="#a855f7" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Live Sessions - Wide */}
                    <TouchableOpacity
                        style={styles.bentoWide}
                        onPress={() => router.push("/(tabs)/rooms")}
                    >
                        <LinearGradient
                            colors={["rgba(245, 158, 11, 0.1)", "rgba(10, 10, 10, 0)"]}
                            style={styles.cardGradient}
                        />
                        <View style={styles.liveHeader}>
                            <View style={[styles.iconBox, { backgroundColor: "rgba(245, 158, 11, 0.2)" }]}>
                                <Globe size={20} color="#f59e0b" />
                            </View>
                            <View style={styles.liveBadge}>
                                <View style={styles.pingDot} />
                                <Text style={styles.liveBadgeText}>Live Now</Text>
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Browse Live Sessions</Text>
                            <Text style={styles.cardSubtitle}>See who's studying right now and get inspired</Text>

                            <View style={styles.liveFooter}>
                                <View style={styles.avatarStack}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={[styles.avatarMini, { marginLeft: i === 1 ? 0 : -8, backgroundColor: i === 1 ? "#818cf8" : i === 2 ? "#34d399" : "#f59e0b" }]}>
                                            <Text style={styles.avatarMiniText}>U</Text>
                                        </View>
                                    ))}
                                    <Text style={styles.plusMore}>+12</Text>
                                </View>
                                <View style={styles.viewLiveBtn}>
                                    <Text style={styles.viewLiveText}>View All</Text>
                                    <ArrowRight size={14} color="#f59e0b" />
                                </View>
                            </View>
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
    scrollContent: {
        padding: 20,
    },
    header: {
        marginTop: 20,
        marginBottom: 32,
        alignItems: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 8,
    },
    titleHighlight: {
        color: Colors.dark.primary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        textAlign: "center",
        lineHeight: 20,
        maxWidth: "80%",
    },
    grid: {
        gap: 12,
    },
    bentoLarge: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        minHeight: 220,
        justifyContent: "space-between",
        overflow: "hidden",
    },
    bentoWide: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        minHeight: 180,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    bentoSmall: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        minHeight: 180,
        justifyContent: "space-between",
    },
    cardGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    badge: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(99, 102, 241, 0.2)",
    },
    badgeText: {
        color: "#818cf8",
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    cardBody: {
        marginTop: "auto",
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: Colors.dark.textMuted,
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: "row",
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: "#fff",
        fontSize: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    joinButton: {
        backgroundColor: "#fff",
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    smallCardBody: {
        marginTop: 12,
    },
    cardTitleSmall: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 2,
    },
    cardSubtitleSmall: {
        fontSize: 12,
        color: Colors.dark.textMuted,
        marginBottom: 12,
    },
    actionRowEmerald: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    actionTextEmerald: {
        color: "#34d399",
        fontSize: 13,
        fontWeight: "600",
    },
    actionRowPurple: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    actionTextPurple: {
        color: "#a855f7",
        fontSize: 13,
        fontWeight: "600",
    },
    liveHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    liveBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 6,
    },
    pingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#22c55e",
    },
    liveBadgeText: {
        color: "#22c55e",
        fontSize: 10,
        fontWeight: "700",
    },
    liveFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
    },
    avatarStack: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarMini: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.dark.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarMiniText: {
        color: "#fff",
        fontSize: 8,
        fontWeight: "800",
    },
    plusMore: {
        color: Colors.dark.textMuted,
        fontSize: 11,
        marginLeft: 8,
    },
    viewLiveBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    viewLiveText: {
        color: "#f59e0b",
        fontSize: 13,
        fontWeight: "600",
    }
});
