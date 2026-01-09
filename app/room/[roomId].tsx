import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { BUCKET_ID, COLLECTIONS, databases, DB_ID, storage } from "@/lib/appwrite";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
    ArrowLeft,
    BookOpen,
    Check,
    Copy,
    LogOut,
    MessageCircle,
    Pause,
    Play,
    RotateCcw,
    Send,
    Settings,
    Trash2,
    Users,
    X
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
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



interface Room {
    $id: string;
    $updatedAt: string;
    $createdAt: string;
    roomId: string;
    name: string;
    subject: string;
    activeUsers: number;
    timerState: "idle" | "running" | "paused";
    mode: "pomodoro" | "short-break" | "long-break";
    timeRemaining: number;
    creatorId: string;
    isStrict?: boolean;
    participants?: string; // JSON string containing durations
}

const DEFAULT_DURATIONS = {
    pomodoro: 25 * 60,
    "short-break": 5 * 60,
    "long-break": 15 * 60,
};

function estimateServerOffsetMs(room: Room): number {
    const updatedAtMs = new Date(room.$updatedAt || room.$createdAt).getTime();
    return Date.now() - updatedAtMs;
}

function computeDerivedRemaining(room: Room, serverOffsetMs = 0): number {
    if (room.timerState !== "running") return room.timeRemaining;
    const updatedAtMs = new Date(room.$updatedAt || room.$createdAt).getTime();
    const serverNowMs = Date.now() - serverOffsetMs;
    const elapsedSec = Math.max(0, Math.floor((serverNowMs - updatedAtMs) / 1000));
    return Math.max(0, room.timeRemaining - elapsedSec);
}

const CLOUDFLARE_WS_URL = "wss://comp-study-worker.helloimabid.workers.dev";

export default function RoomScreen() {
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const { user, profile } = useAuth();
    const [participantProfiles, setParticipantProfiles] = useState<Map<string, any>>(new Map());
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [participants, setParticipants] = useState<any[]>([]);

    // Timer State
    const [localTimeRemaining, setLocalTimeRemaining] = useState(0);
    const serverOffsetMsRef = useRef(0);

    // WebSocket State
    const wsRef = useRef<WebSocket | null>(null);
    const [wsMessages, setWsMessages] = useState<any[]>([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");

    // Settings Modal State
    const [showSettings, setShowSettings] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);
    const [configDraft, setConfigDraft] = useState({
        name: "",
        subject: "",
        isStrict: false,
        pomodoroMin: "25",
        shortBreakMin: "5",
        longBreakMin: "15"
    });

    const isCreator = user && room && room.creatorId === user.$id;

    // WebSocket Logic
    useEffect(() => {
        if (!roomId || !user) return;

        const connectWs = () => {
            const ws = new WebSocket(`${CLOUDFLARE_WS_URL}/api/room/${roomId}`);

            ws.onopen = () => {
                const presenceMessage = {
                    type: "presence",
                    userId: user.$id,
                    username: user.name || "Anonymous",
                    data: { status: "joined" },
                    timestamp: new Date().toISOString(),
                };
                ws.send(JSON.stringify(presenceMessage));
            };

            ws.onmessage = (event: any) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === "chat") {
                        setWsMessages(prev => [...prev.slice(-49), msg]);
                    } else if (msg.type === "timer-sync" && !isCreator) {
                        // Instant sync from creator
                        if (msg.data.action === "play" || msg.data.action === "pause") {
                            setRoom(prev => prev ? {
                                ...prev,
                                timerState: msg.data.action === "play" ? "running" : "paused",
                                timeRemaining: msg.data.timeRemaining
                            } : null);
                            setLocalTimeRemaining(msg.data.timeRemaining);
                        } else if (msg.data.action === "reset") {
                            setRoom(prev => prev ? {
                                ...prev,
                                timerState: "idle",
                                timeRemaining: msg.data.timeRemaining
                            } : null);
                            setLocalTimeRemaining(msg.data.timeRemaining);
                        }
                    }
                } catch (e) {
                    console.error("WS Parse error", e);
                }
            };

            ws.onclose = () => {
                setTimeout(connectWs, 3000); // Simple reconnect
            };

            wsRef.current = ws;
        };

        connectWs();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [roomId, user?.$id]);

    const sendWsMessage = (type: string, data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && user) {
            wsRef.current.send(JSON.stringify({
                type,
                userId: user.$id,
                username: user.name || "Anonymous",
                data,
                timestamp: new Date().toISOString(),
            }));
        }
    };

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        sendWsMessage("chat", { message: chatInput.trim() });
        setChatInput("");
    };

    const roomDurations = (() => {
        if (!room?.participants) return DEFAULT_DURATIONS;
        try {
            const data = JSON.parse(room.participants);
            return {
                pomodoro: data.durations?.pomodoro || DEFAULT_DURATIONS.pomodoro,
                "short-break": data.durations?.["short-break"] || DEFAULT_DURATIONS["short-break"],
                "long-break": data.durations?.["long-break"] || DEFAULT_DURATIONS["long-break"],
            };
        } catch {
            return DEFAULT_DURATIONS;
        }
    })();

    useEffect(() => {
        fetchRoom();
        fetchParticipants();

        // Subscribe to room changes
        const unsubscribe = databases.client.subscribe(
            `databases.${DB_ID}.collections.${COLLECTIONS.ROOMS}.documents`,
            (response: any) => {
                if (response.events.some((e: string) => e.includes("update"))) {
                    const updatedRoom = response.payload as unknown as Room;
                    if (updatedRoom.roomId === roomId) {
                        serverOffsetMsRef.current = estimateServerOffsetMs(updatedRoom);
                        setRoom(updatedRoom);
                    }
                }
                if (response.events.some((e: string) => e.includes("delete"))) {
                    const deletedDoc = response.payload as any;
                    if (room && deletedDoc.$id === room.$id) {
                        router.replace("/room/start");
                    }
                }
            }
        );

        // Subscribe to participants changes
        const unsubscribeParticipants = databases.client.subscribe(
            `databases.${DB_ID}.collections.${COLLECTIONS.ROOM_PARTICIPANTS}.documents`,
            () => fetchParticipants()
        );

        return () => {
            unsubscribe();
            unsubscribeParticipants();
        };
    }, [roomId, room?.$id]);

    // Derived timer tick
    useEffect(() => {
        if (!room) return;
        const tick = () => setLocalTimeRemaining(computeDerivedRemaining(room, serverOffsetMsRef.current));
        tick();
        const intervalId = setInterval(tick, 250);
        return () => clearInterval(intervalId);
    }, [room?.$id, room?.timerState, room?.timeRemaining, room?.$updatedAt, room?.mode]);

    useEffect(() => {
        if (!room || !isCreator) return;
        setConfigDraft({
            name: room.name || "",
            subject: room.subject || "",
            isStrict: !!room.isStrict,
            pomodoroMin: Math.round(roomDurations.pomodoro / 60).toString(),
            shortBreakMin: Math.round(roomDurations["short-break"] / 60).toString(),
            longBreakMin: Math.round(roomDurations["long-break"] / 60).toString(),
        });
    }, [room?.$id, isCreator, roomDurations.pomodoro]);

    // Join/Leave Room Logic
    useEffect(() => {
        if (!user || !roomId || !profile) return;

        const joinRoom = async () => {
            try {
                // Check if already a participant
                const existing = await databases.listDocuments(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, [
                    Query.equal("roomId", roomId),
                    Query.equal("userId", user.$id)
                ]);

                if (existing.documents.length === 0) {
                    await databases.createDocument(
                        DB_ID,
                        COLLECTIONS.ROOM_PARTICIPANTS,
                        ID.unique(),
                        {
                            roomId,
                            userId: user.$id,
                            username: profile.username || user.name || "Student",
                            joinedAt: new Date().toISOString()
                        },
                        [
                            Permission.read(Role.any()),
                            Permission.update(Role.user(user.$id)),
                            Permission.delete(Role.user(user.$id)),
                        ]
                    );
                }
            } catch (e) {
                console.error("Error joining room:", e);
            }
        };

        joinRoom();

        return () => {
            // Cleanup: remove participant record
            const leaveRoom = async () => {
                try {
                    const participantDocs = await databases.listDocuments(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, [
                        Query.equal("roomId", roomId),
                        Query.equal("userId", user?.$id || "")
                    ]);
                    for (const doc of participantDocs.documents) {
                        try {
                            await databases.deleteDocument(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, doc.$id);
                        } catch {
                            // Ignore deletion errors on unmount
                        }
                    }
                } catch (e) {
                    console.error("Error leaving room:", e);
                }
            };
            leaveRoom();
        };
    }, [user?.$id, roomId, profile]);

    // Fetch profiles for all participants
    useEffect(() => {
        const fetchParticipantProfiles = async () => {
            const userIds = participants.map((p) => p.userId).filter(Boolean);
            if (userIds.length === 0) return;

            try {
                const profilesRes = await databases.listDocuments(
                    DB_ID,
                    COLLECTIONS.PROFILES,
                    [Query.equal("userId", userIds)]
                );

                const profileMap = new Map();
                profilesRes.documents.forEach((p: any) => {
                    profileMap.set(p.userId, p);
                });
                setParticipantProfiles(profileMap);
            } catch (error) {
                console.error("Failed to fetch participant profiles:", error);
            }
        };

        fetchParticipantProfiles();
    }, [participants]);

    const fetchParticipants = async () => {
        if (!roomId) return;
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, [Query.equal("roomId", roomId)]);
            setParticipants(response.documents);
        } catch (error) {
            console.error("Failed to fetch participants:", error);
        }
    };

    const fetchRoom = async () => {
        if (!roomId) return;
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.ROOMS, [Query.equal("roomId", roomId)]);
            if (response.documents.length > 0) {
                const r = response.documents[0] as unknown as Room;
                serverOffsetMsRef.current = estimateServerOffsetMs(r);
                setRoom(r);
            }
        } catch (error) {
            console.error("Failed to fetch room:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayPause = async () => {
        if (!room || !isCreator) return;
        try {
            const newState = room.timerState === "running" ? "paused" : "running";
            const derivedNow = computeDerivedRemaining(room, serverOffsetMsRef.current);

            // 1. Instant broadcast for others
            sendWsMessage("timer-sync", {
                action: newState === "running" ? "play" : "pause",
                timeRemaining: derivedNow
            });

            // 2. Persist in DB
            await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
                timerState: newState,
                timeRemaining: derivedNow,
            });
        } catch (error) {
            console.error("Toggle failed:", error);
        }
    };

    const handleReset = async () => {
        if (!room || !isCreator) return;
        try {
            const dur = roomDurations[room.mode];
            sendWsMessage("timer-sync", { action: "reset", timeRemaining: dur });
            await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
                timerState: "idle",
                timeRemaining: dur,
            });
        } catch (error) {
            console.error("Reset failed:", error);
        }
    };

    const handleModeChange = async (newMode: Room["mode"]) => {
        if (!room || !isCreator) return;
        try {
            await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
                mode: newMode,
                timeRemaining: roomDurations[newMode],
                timerState: "idle",
            });
        } catch (error) {
            console.error("Mode change failed:", error);
        }
    };

    const handleSaveConfig = async () => {
        if (!room || !isCreator) return;
        setConfigSaving(true);
        try {
            const newDurations = {
                pomodoro: (parseInt(configDraft.pomodoroMin) || 25) * 60,
                "short-break": (parseInt(configDraft.shortBreakMin) || 5) * 60,
                "long-break": (parseInt(configDraft.longBreakMin) || 15) * 60,
            };
            const shouldResetIdle = room.timerState === "idle";

            await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, room.$id, {
                name: configDraft.name.trim() || room.name,
                subject: configDraft.subject.trim() || room.subject,
                isStrict: configDraft.isStrict,
                participants: JSON.stringify({ durations: newDurations }),
                ...(shouldResetIdle ? { timeRemaining: newDurations[room.mode] } : {}),
            });
            setShowSettings(false);
        } catch (error) {
            Alert.alert("Error", "Failed to save settings");
        } finally {
            setConfigSaving(false);
        }
    };

    const handleLeaveOrDelete = async () => {
        if (!room) return;

        if (isCreator) {
            Alert.alert("Delete Room", "Are you sure you want to delete this room? Everyone will be kicked.", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Find all participants to delete them first (good practice)
                            const pDocs = await databases.listDocuments(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, [Query.equal("roomId", roomId)]);
                            for (const doc of pDocs.documents) {
                                await databases.deleteDocument(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, doc.$id);
                            }
                            await databases.deleteDocument(DB_ID, COLLECTIONS.ROOMS, room.$id);
                            router.replace("/room/start");
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete room");
                        }
                    }
                }
            ]);
        } else {
            Alert.alert("Leave Room", "Are you sure you want to leave?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Leave",
                    onPress: async () => {
                        try {
                            const pDocs = await databases.listDocuments(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, [
                                Query.equal("roomId", roomId),
                                Query.equal("userId", user?.$id || "")
                            ]);
                            if (pDocs.documents.length > 0) {
                                await databases.deleteDocument(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, pDocs.documents[0].$id);
                            }
                            router.replace("/room/start");
                        } catch (e) {
                            Alert.alert("Error", "Failed to leave");
                        }
                    }
                }
            ]);
        }
    };

    const handleParticipantAction = (p: any) => {
        if (!isCreator || p.userId === user?.$id) return;

        Alert.alert(
            "Manage Participant",
            `Choose an action for ${p.username}`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Kick",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await databases.deleteDocument(DB_ID, COLLECTIONS.ROOM_PARTICIPANTS, p.$id);
                            Alert.alert("Success", "User kicked");
                        } catch (e) {
                            Alert.alert("Error", "Failed to kick user");
                        }
                    }
                },
                {
                    text: "Ban",
                    style: "destructive",
                    onPress: async () => {
                        Alert.alert("Ban User", "This would add them to a ban list. (Ban logic implementation pending for mobile)");
                    }
                }
            ]
        );
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

    const copyJoinCode = async () => {
        if (!room) return;
        await Clipboard.setStringAsync(room.roomId);
        Alert.alert("Success", "Join code copied to clipboard!");
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text numberOfLines={1} style={styles.headerTitle}>{room.name}</Text>
                    <TouchableOpacity onPress={copyJoinCode} style={styles.roomIdBadge}>
                        <Text style={styles.roomIdText}>{room.roomId}</Text>
                        <Copy size={10} color={Colors.dark.textMuted} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setChatOpen(true)} style={styles.iconButton}>
                        <MessageCircle size={24} color={Colors.dark.text} />
                        {wsMessages.length > 0 && <View style={styles.chatBadge} />}
                    </TouchableOpacity>
                    {isCreator ? (
                        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconButton}>
                            <Settings size={24} color={Colors.dark.text} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleLeaveOrDelete} style={styles.iconButton}>
                            <LogOut size={24} color={Colors.dark.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Mode Switcher (Creator Only) */}
                {isCreator && (
                    <View style={styles.modeSwitcher}>
                        {(["pomodoro", "short-break", "long-break"] as const).map((m) => (
                            <TouchableOpacity
                                key={m}
                                onPress={() => handleModeChange(m)}
                                style={[styles.modeBtn, room.mode === m && styles.modeBtnActive]}
                            >
                                <Text style={[styles.modeBtnText, room.mode === m && styles.modeBtnTextActive]}>
                                    {m === "pomodoro" ? "Focus" : m === "short-break" ? "Short" : "Long"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Timer Section */}
                <View style={[styles.timerCard, { borderColor: room.mode === "pomodoro" ? Colors.dark.primary : Colors.dark.success }]}>
                    <View style={styles.timerHeader}>
                        <View style={[styles.modeBadge, { backgroundColor: room.timerState === "running" ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.05)" }]}>
                            <Text style={[styles.modeText, { color: room.timerState === "running" ? Colors.dark.primary : Colors.dark.textMuted }]}>
                                {room.mode.toUpperCase()} - {room.timerState.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.timerDisplay}>{formatTime(localTimeRemaining)}</Text>

                    {/* Creator Controls */}
                    {isCreator && (
                        <View style={styles.controlsRow}>
                            <TouchableOpacity onPress={handleReset} style={styles.controlBtnSecondary}>
                                <RotateCcw size={24} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handlePlayPause} style={styles.controlBtnPrimary}>
                                {room.timerState === "running" ? (
                                    <Pause size={32} color="#000" fill="#000" />
                                ) : (
                                    <Play size={32} color="#000" fill="#000" />
                                )}
                            </TouchableOpacity>

                            <View style={{ width: 44 }} /> {/* Spacer */}
                        </View>
                    )}

                    <View style={styles.roomStatsInline}>
                        <View style={styles.statItem}>
                            <Users size={14} color={Colors.dark.textMuted} />
                            <Text style={styles.statLabel}>{participants.length} online</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <BookOpen size={14} color={Colors.dark.textMuted} />
                            <Text style={styles.statLabel}>{room.subject || "General"}</Text>
                        </View>
                    </View>
                </View>

                {/* Participants Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Participants</Text>
                    <View style={styles.participantCount}>
                        <Text style={styles.participantCountText}>{participants.length}</Text>
                    </View>
                </View>

                <View style={styles.participantsGrid}>
                    {participants.map((p) => {
                        const pProfile = participantProfiles.get(p.userId);
                        return (
                            <TouchableOpacity
                                key={p.$id}
                                style={styles.participantCard}
                                onPress={() => handleParticipantAction(p)}
                                disabled={!isCreator || p.userId === user?.$id}
                            >
                                <View style={[styles.avatar, { overflow: 'hidden' }]}>
                                    {pProfile?.profilePicture ? (
                                        <Image
                                            source={{
                                                uri: pProfile.profilePicture.startsWith("http")
                                                    ? pProfile.profilePicture
                                                    : storage.getFilePreview(BUCKET_ID, pProfile.profilePicture).toString(),
                                            }}
                                            style={styles.avatarImage}
                                            contentFit="cover"
                                            transition={500}
                                        />
                                    ) : (
                                        <Text style={styles.avatarText}>{p.username?.[0]?.toUpperCase() || "?"}</Text>
                                    )}
                                    <View style={styles.onlineDot} />
                                </View>
                                <Text numberOfLines={1} style={styles.participantName}>{p.username}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Danger Zone (Creator Only) */}
                {isCreator && (
                    <TouchableOpacity onPress={handleLeaveOrDelete} style={styles.dangerZoneBtn}>
                        <Trash2 size={18} color={Colors.dark.error} />
                        <Text style={styles.dangerZoneText}>Delete Room</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Chat Modal */}
            <Modal visible={chatOpen} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.chatModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Room Chat</Text>
                            <TouchableOpacity onPress={() => setChatOpen(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.chatScroll}
                            ref={(ref) => ref?.scrollToEnd({ animated: true })}
                        >
                            {wsMessages.length === 0 && (
                                <Text style={styles.emptyChatText}>No messages yet. Say hi!</Text>
                            )}
                            {wsMessages.map((msg, idx) => (
                                <View key={idx} style={[styles.chatMsg, msg.userId === user?.$id && styles.chatMsgSelf]}>
                                    <Text style={styles.chatUsername}>{msg.username}</Text>
                                    <Text style={styles.chatText}>{msg.data.message}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.chatInputRow}>
                            <TextInput
                                style={styles.chatInput}
                                value={chatInput}
                                onChangeText={setChatInput}
                                placeholder="Type a message..."
                                placeholderTextColor={Colors.dark.textMuted}
                                onSubmitEditing={handleSendChat}
                                returnKeyType="send"
                            />
                            <TouchableOpacity onPress={handleSendChat} style={styles.sendBtn}>
                                <Send size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Settings Modal */}
            <Modal visible={showSettings} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Room Settings</Text>
                            <TouchableOpacity onPress={() => setShowSettings(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <Text style={styles.inputLabel}>Room Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={configDraft.name}
                                onChangeText={(t) => setConfigDraft({ ...configDraft, name: t })}
                            />

                            <Text style={styles.inputLabel}>Subject</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={configDraft.subject}
                                onChangeText={(t) => setConfigDraft({ ...configDraft, subject: t })}
                            />

                            <View style={styles.settingToggle}>
                                <View>
                                    <Text style={styles.toggleTitle}>Strict Mode</Text>
                                    <View style={{ width: 220 }}>
                                        <Text style={styles.toggleDesc}>
                                            Only you can control the timer.
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={configDraft.isStrict}
                                    onValueChange={(v) => setConfigDraft({ ...configDraft, isStrict: v })}
                                    trackColor={{ false: "#333", true: Colors.dark.primary }}
                                />
                            </View>

                            <Text style={styles.inputLabel}>Durations (Minutes)</Text>
                            <View style={styles.durationGrid}>
                                <View style={styles.durationItem}>
                                    <Text style={styles.minLabel}>Focus</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        style={styles.durationInput}
                                        value={configDraft.pomodoroMin}
                                        onChangeText={(t) => setConfigDraft({ ...configDraft, pomodoroMin: t })}
                                    />
                                </View>
                                <View style={styles.durationItem}>
                                    <Text style={styles.minLabel}>Short</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        style={styles.durationInput}
                                        value={configDraft.shortBreakMin}
                                        onChangeText={(t) => setConfigDraft({ ...configDraft, shortBreakMin: t })}
                                    />
                                </View>
                                <View style={styles.durationItem}>
                                    <Text style={styles.minLabel}>Long</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        style={styles.durationInput}
                                        value={configDraft.longBreakMin}
                                        onChangeText={(t) => setConfigDraft({ ...configDraft, longBreakMin: t })}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, configSaving && { opacity: 0.7 }]}
                                onPress={handleSaveConfig}
                                disabled={configSaving}
                            >
                                {configSaving ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <>
                                        <Check size={20} color="#000" />
                                        <Text style={styles.saveBtnText}>Save Changes</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    headerCenter: {
        alignItems: "center",
        flex: 1,
    },
    backButton: {
        padding: 8,
    },
    iconButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    roomIdBadge: {
        backgroundColor: "rgba(255,255,255,0.05)",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    roomIdText: {
        fontSize: 10,
        color: Colors.dark.textMuted,
        fontWeight: "600",
        fontFamily: "monospace",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    modeSwitcher: {
        flexDirection: "row",
        backgroundColor: Colors.dark.surface,
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
        gap: 4,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    modeBtnActive: {
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    modeBtnText: {
        color: Colors.dark.textMuted,
        fontSize: 13,
        fontWeight: "600",
    },
    modeBtnTextActive: {
        color: "#fff",
    },
    timerCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 28,
        padding: 32,
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 1.5,
    },
    timerHeader: {
        marginBottom: 12,
    },
    modeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    modeText: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.5,
    },
    timerDisplay: {
        fontSize: 84,
        fontWeight: "800",
        color: "#fff",
        fontVariant: ["tabular-nums"],
        marginBottom: 24,
    },
    controlsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 24,
        marginBottom: 32,
    },
    controlBtnPrimary: {
        backgroundColor: "#fff",
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    controlBtnSecondary: {
        backgroundColor: "rgba(255,255,255,0.1)",
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    roomStatsInline: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.05)",
        paddingTop: 20,
        width: "100%",
        justifyContent: "center",
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statLabel: {
        fontSize: 13,
        color: Colors.dark.textMuted,
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#fff",
    },
    participantCount: {
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    participantCountText: {
        color: Colors.dark.primary,
        fontSize: 11,
        fontWeight: "700",
    },
    participantsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 32,
    },
    participantCard: {
        width: 75,
        alignItems: "center",
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.05)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        position: "relative",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarText: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
    },
    onlineDot: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.dark.success,
        borderWidth: 3,
        borderColor: Colors.dark.background,
    },
    participantName: {
        fontSize: 12,
        color: Colors.dark.textMuted,
        textAlign: "center",
    },
    dangerZoneBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 16,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        gap: 8,
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.2)",
    },
    dangerZoneText: {
        color: Colors.dark.error,
        fontWeight: "700",
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Colors.dark.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: "85%",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#fff",
    },
    modalScroll: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        color: Colors.dark.textMuted,
        marginBottom: 8,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    modalInput: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 14,
        padding: 16,
        color: "#fff",
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    settingToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Colors.dark.surface,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 4,
    },
    toggleDesc: {
        fontSize: 13,
        color: Colors.dark.textMuted,
    },
    durationGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 32,
    },
    durationItem: {
        flex: 1,
        alignItems: "center",
    },
    minLabel: {
        fontSize: 11,
        color: Colors.dark.textMuted,
        marginBottom: 6,
    },
    durationInput: {
        backgroundColor: Colors.dark.surface,
        width: "100%",
        padding: 12,
        borderRadius: 12,
        color: "#fff",
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    saveBtn: {
        backgroundColor: Colors.dark.primary,
        padding: 18,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: 40,
    },
    saveBtnText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "800",
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    chatBadge: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.dark.primary,
        borderWidth: 2,
        borderColor: Colors.dark.background,
    },
    chatModalContent: {
        backgroundColor: Colors.dark.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        height: "80%",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    chatScroll: {
        flex: 1,
        marginBottom: 16,
    },
    emptyChatText: {
        color: Colors.dark.textMuted,
        textAlign: "center",
        marginTop: 40,
        fontSize: 14,
    },
    chatMsg: {
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        alignSelf: "flex-start",
        maxWidth: "80%",
    },
    chatMsgSelf: {
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        alignSelf: "flex-end",
    },
    chatUsername: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.dark.textMuted,
        marginBottom: 2,
        textTransform: "uppercase",
    },
    chatText: {
        color: "#fff",
        fontSize: 15,
        lineHeight: 20,
    },
    chatInputRow: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        paddingBottom: Platform.OS === "ios" ? 20 : 0,
    },
    chatInput: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        borderRadius: 14,
        padding: 14,
        color: "#fff",
        fontSize: 16,
    },
    sendBtn: {
        backgroundColor: Colors.dark.primary,
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
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