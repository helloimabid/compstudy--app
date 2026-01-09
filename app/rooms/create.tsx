import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, BookOpen, Globe, Lock } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { ID, Permission, Query, Role } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateRoomScreen() {
    const { user, loading } = useAuth();
    const [name, setName] = useState("My Study Room");
    const [subject, setSubject] = useState("General");
    const [curriculumId, setCurriculumId] = useState("");
    const [curriculums, setCurriculums] = useState<any[]>([]);
    const [isStrict, setIsStrict] = useState(false);
    const [visibility, setVisibility] = useState<"public" | "private">("public");
    const [checkingRoom, setCheckingRoom] = useState(true);
    const [existingRoomId, setExistingRoomId] = useState<string | null>(null);

    const [pomodoroMin, setPomodoroMin] = useState("25");
    const [shortBreakMin, setShortBreakMin] = useState("5");
    const [longBreakMin, setLongBreakMin] = useState("15");

    const roomId = useMemo(() => Math.random().toString(36).substring(2, 8), []);
    const joinCode = useMemo(() => Math.random().toString(36).substring(2, 8).toUpperCase(), []);

    useEffect(() => {
        if (user) {
            fetchCurriculums();
            checkExistingRoom();
        }
    }, [user]);

    const checkExistingRoom = async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.ROOMS, [
                Query.equal("creatorId", user.$id),
                Query.limit(1),
            ]);
            if (response.documents.length > 0) {
                setExistingRoomId(response.documents[0].roomId);
            }
        } catch (error) {
            console.error("Error checking existing room:", error);
        } finally {
            setCheckingRoom(false);
        }
    };

    const fetchCurriculums = async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.CURRICULUM,
                [Query.equal("userId", user.$id)]
            );
            setCurriculums(response.documents);
        } catch (error) {
            console.error("Error fetching curriculums:", error);
        }
    };

    const handleCreate = async () => {
        if (!user) return;

        const p = Math.max(1, Math.min(600, parseInt(pomodoroMin) || 25));
        const s = Math.max(1, Math.min(600, parseInt(shortBreakMin) || 5));
        const l = Math.max(1, Math.min(600, parseInt(longBreakMin) || 15));

        const finalRoomId = visibility === "private" ? joinCode : roomId;

        try {
            // Create room document
            await databases.createDocument(
                DB_ID,
                COLLECTIONS.ROOMS,
                ID.unique(),
                {
                    name: name.trim() || "My Study Room",
                    subject: subject.trim() || "General",
                    curriculumId: curriculumId || null,
                    activeUsers: 1,
                    isStrict: isStrict,
                    roomId: finalRoomId,
                    creatorId: user.$id,
                    participants: JSON.stringify({
                        durations: {
                            pomodoro: p * 60,
                            "short-break": s * 60,
                            "long-break": l * 60
                        }
                    }),
                    timerState: "idle",
                    timeRemaining: p * 60,
                    mode: "pomodoro",
                    visibility: visibility,
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id)),
                ]
            );

            router.replace(`/room/${finalRoomId}`);
        } catch (error) {
            console.error("Failed to create room:", error);
            Alert.alert("Error", "Failed to create room. Please try again.");
        }
    };

    if (loading || checkingRoom) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (existingRoomId) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.centered}>
                    <View style={styles.existingIconBox}>
                        <BookOpen size={48} color={Colors.dark.primary} />
                    </View>
                    <Text style={styles.title}>Active Room Found</Text>
                    <Text style={styles.subtitle}>
                        You already have an active room. You can only have one room at a time.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace(`/room/${existingRoomId}`)}
                    >
                        <Text style={styles.buttonText}>Enter Your Room</Text>
                        <ArrowRight size={20} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.secondaryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Room</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formSection}>
                    <Text style={styles.label}>Room Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                        placeholder="My Study Room"
                        placeholderTextColor={Colors.dark.textMuted}
                    />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Subject</Text>
                    <TextInput
                        value={subject}
                        onChangeText={setSubject}
                        style={styles.input}
                        placeholder="General"
                        placeholderTextColor={Colors.dark.textMuted}
                    />
                </View>

                <View style={styles.gridRow}>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Pomodoro (min)</Text>
                        <TextInput
                            value={pomodoroMin}
                            onChangeText={setPomodoroMin}
                            style={styles.input}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.label}>Short Break (min)</Text>
                        <TextInput
                            value={shortBreakMin}
                            onChangeText={setShortBreakMin}
                            style={styles.input}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Long Break (min)</Text>
                    <TextInput
                        value={longBreakMin}
                        onChangeText={setLongBreakMin}
                        style={styles.input}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.toggleRow}>
                    <View>
                        <Text style={styles.toggleTitle}>Strict Mode</Text>
                        <Text style={styles.toggleSubtitle}>Timer cannot be paused by others</Text>
                    </View>
                    <Switch
                        value={isStrict}
                        onValueChange={setIsStrict}
                        trackColor={{ false: "#3f3f46", true: Colors.dark.primary }}
                    />
                </View>

                <Text style={styles.label}>Visibility</Text>
                <View style={styles.visibilityContainer}>
                    <TouchableOpacity
                        style={[styles.visibilityBtn, visibility === "public" && styles.visibilityBtnActive]}
                        onPress={() => setVisibility("public")}
                    >
                        <Globe size={20} color={visibility === "public" ? "#fff" : Colors.dark.textMuted} />
                        <View>
                            <Text style={[styles.visibilityTitle, visibility === "public" && styles.activeText]}>Public</Text>
                            <Text style={styles.visibilityDesc}>Anyone can join</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.visibilityBtn, visibility === "private" && styles.visibilityBtnActivePrivate]}
                        onPress={() => setVisibility("private")}
                    >
                        <Lock size={20} color={visibility === "private" ? "#fff" : Colors.dark.textMuted} />
                        <View>
                            <Text style={[styles.visibilityTitle, visibility === "private" && styles.activeText]}>Private</Text>
                            <Text style={styles.visibilityDesc}>Use join code</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {visibility === "private" && (
                    <View style={styles.joinCodeBox}>
                        <Text style={styles.joinCodeLabel}>Join Code (Auto-generated)</Text>
                        <Text style={styles.joinCodeText}>{joinCode}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
                    <Text style={styles.buttonText}>Create Room</Text>
                    <ArrowRight size={20} color="#000" />
                </TouchableOpacity>
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
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    existingIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: Colors.dark.textMuted,
        textAlign: "center",
        marginBottom: 32,
    },
    formSection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        marginBottom: 8,
        fontWeight: "500",
    },
    input: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 14,
        color: "#fff",
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    gridRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    gridItem: {
        flex: 1,
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Colors.dark.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    toggleTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    toggleSubtitle: {
        color: Colors.dark.textMuted,
        fontSize: 12,
    },
    visibilityContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    visibilityBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        backgroundColor: Colors.dark.surface,
    },
    visibilityBtnActive: {
        borderColor: Colors.dark.primary,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
    },
    visibilityBtnActivePrivate: {
        borderColor: "#a855f7",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
    },
    visibilityTitle: {
        color: Colors.dark.textMuted,
        fontSize: 14,
        fontWeight: "600",
    },
    activeText: {
        color: "#fff",
    },
    visibilityDesc: {
        color: Colors.dark.textMuted,
        fontSize: 10,
    },
    joinCodeBox: {
        backgroundColor: "rgba(168, 85, 247, 0.05)",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(168, 85, 247, 0.2)",
        marginBottom: 24,
        alignItems: "center",
    },
    joinCodeLabel: {
        color: Colors.dark.textMuted,
        fontSize: 12,
        marginBottom: 4,
    },
    joinCodeText: {
        color: "#a855f7",
        fontSize: 24,
        fontWeight: "700",
        letterSpacing: 4,
        fontFamily: "monospace",
    },
    primaryButton: {
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 12,
    },
    buttonText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "700",
    },
    secondaryButton: {
        padding: 16,
        alignItems: "center",
        marginTop: 12,
    },
    secondaryButtonText: {
        color: Colors.dark.textMuted,
        fontSize: 16,
    }
});
