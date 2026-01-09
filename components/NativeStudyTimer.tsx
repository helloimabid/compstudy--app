import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID, Query } from "@/lib/appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Book, Brain, CalendarDays, Coffee, Pause, Play, RotateCcw, Settings, Users, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    AppState,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { ID, Permission, Role } from "react-native-appwrite";
import { useAuth } from "./AppwriteProvider";
import SessionDesigner from "./SessionDesigner";
import { CircularTimerDisplay, DigitalTimerDisplay, MinimalTimerDisplay } from "./TimerDisplays";
import TimerSettings, { ThemeColor, TimerFont, TimerStyle, VisualMode } from "./TimerSettings";

export default function NativeStudyTimer() {
    const { user, profile } = useAuth();

    // Timer State
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [duration, setDuration] = useState(25 * 60); // Default 25 min
    const [mode, setMode] = useState<"focus" | "break">("focus");
    const [timerMode, setTimerMode] = useState<"timer" | "stopwatch">("timer");

    // Subject/Topic State
    const [curriculums, setCurriculums] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [topics, setTopics] = useState<any[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
    const [selectedTopicId, setSelectedTopicId] = useState<string>("");
    const [sessionGoal, setSessionGoal] = useState("");
    const [livePeersCount, setLivePeersCount] = useState(0);

    // IDs for database tracking
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [liveSessionId, setLiveSessionId] = useState<string | null>(null);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [showDesigner, setShowDesigner] = useState(false);
    const [showSubjectPicker, setShowSubjectPicker] = useState(false);
    const [showTopicPicker, setShowTopicPicker] = useState(false);
    const [themeColor, setThemeColor] = useState<ThemeColor>("indigo");
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [visualMode, setVisualMode] = useState<VisualMode>("grid");
    const [timerStyle, setTimerStyle] = useState<TimerStyle>("grid");
    const [timerFont, setTimerFont] = useState<TimerFont>("default");
    const [autoStartFocus, setAutoStartFocus] = useState(false);
    const [autoStartBreak, setAutoStartBreak] = useState(false);
    const [targetDuration, setTargetDuration] = useState(25 * 60);

    const startTimeRef = useRef<number | null>(null);
    const appState = useRef(AppState.currentState);

    // Load Settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const saved = await AsyncStorage.getItem("studyTimerSettings");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.themeColor) setThemeColor(parsed.themeColor);
                    if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
                    if (parsed.visualMode) setVisualMode(parsed.visualMode);
                    if (parsed.timerStyle) setTimerStyle(parsed.timerStyle);
                    if (parsed.timerFont) setTimerFont(parsed.timerFont);
                    if (parsed.autoStartFocus !== undefined) setAutoStartFocus(parsed.autoStartFocus);
                    if (parsed.autoStartBreak !== undefined) setAutoStartBreak(parsed.autoStartBreak);
                    if (parsed.targetDuration) setTargetDuration(parsed.targetDuration);
                    if (parsed.timerMode) setTimerMode(parsed.timerMode);
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        };
        loadSettings();
    }, []);

    // Fetch Subjects & Topics
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [currRes, subjRes, topRes, peersRes] = await Promise.all([
                    databases.listDocuments(DB_ID, COLLECTIONS.CURRICULUM, [Query.equal("userId", user.$id)]),
                    databases.listDocuments(DB_ID, COLLECTIONS.SUBJECTS, [Query.equal("userId", user.$id)]),
                    databases.listDocuments(DB_ID, COLLECTIONS.TOPICS, [Query.equal("userId", user.$id)]),
                    databases.listDocuments(DB_ID, COLLECTIONS.LIVE_SESSIONS, [Query.equal("status", "active"), Query.limit(1)])
                ]);

                setCurriculums(currRes.documents);
                setSubjects(subjRes.documents);
                setTopics(topRes.documents);
                setLivePeersCount(peersRes.total);

                if (subjRes.documents.length > 0 && !selectedSubjectId) {
                    setSelectedSubjectId(subjRes.documents[0].$id);
                }
            } catch (e) {
                console.error("Failed to fetch timer metadata", e);
            }
        };
        fetchData();
    }, [user]);

    const filteredTopics = topics.filter((t: any) => t.subjectId === selectedSubjectId);

    // Save Settings
    useEffect(() => {
        const saveSettings = async () => {
            try {
                await AsyncStorage.setItem("studyTimerSettings", JSON.stringify({
                    themeColor,
                    soundEnabled,
                    visualMode,
                    timerStyle,
                    timerFont,
                    autoStartFocus,
                    autoStartBreak,
                    targetDuration,
                    timerMode
                }));
            } catch (e) {
                console.error("Failed to save settings", e);
            }
        };
        saveSettings();

        // Sync duration with targetDuration if timer is idle
        if (!isActive && elapsed === 0 && mode === "focus") {
            setDuration(targetDuration);
        }
    }, [themeColor, soundEnabled, visualMode, timerStyle, timerFont, autoStartFocus, autoStartBreak, targetDuration, isActive, elapsed, mode, timerMode]);

    // Restore Timer State
    useEffect(() => {
        const loadState = async () => {
            try {
                const savedState = await AsyncStorage.getItem("timerState");
                if (savedState) {
                    const parsed = JSON.parse(savedState);

                    // Only restore if user matches (or anonymous)
                    if (!user || (parsed.userId === user.$id)) {
                        setDuration(parsed.duration || 25 * 60);
                        setMode(parsed.mode || "focus");
                        setSessionId(parsed.sessionId || null);
                        setLiveSessionId(parsed.liveSessionId || null);

                        if (parsed.isActive && !parsed.isPaused) {
                            const now = Date.now();
                            const savedAt = parsed.savedAt || now;
                            const extraElapsed = Math.floor((now - savedAt) / 1000);
                            const totalElapsed = (parsed.elapsed || 0) + extraElapsed;

                            setElapsed(totalElapsed);
                            setIsActive(true);
                            setIsPaused(false);
                            startTimeRef.current = now - totalElapsed * 1000;
                        } else {
                            setElapsed(parsed.elapsed || 0);
                            setIsActive(parsed.isActive);
                            setIsPaused(parsed.isPaused);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load timer state", e);
            }
        };
        loadState();
    }, [user]);

    // Save Timer State
    useEffect(() => {
        const saveState = async () => {
            try {
                if (isActive || elapsed > 0) {
                    await AsyncStorage.setItem(
                        "timerState",
                        JSON.stringify({
                            userId: user?.$id,
                            isActive,
                            isPaused,
                            elapsed,
                            duration,
                            mode,
                            sessionId,
                            liveSessionId,
                            savedAt: Date.now(),
                        })
                    );
                } else {
                    await AsyncStorage.removeItem("timerState");
                }
            } catch (e) {
                console.error("Failed to save timer state", e);
            }
        };
        saveState();
    }, [isActive, isPaused, elapsed, duration, mode, sessionId, liveSessionId, user]);

    // Timer Interval
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isActive && !isPaused) {
            if (!startTimeRef.current) {
                startTimeRef.current = Date.now() - elapsed * 1000;
            }

            interval = setInterval(() => {
                const now = Date.now();
                const newElapsed = Math.floor((now - startTimeRef.current!) / 1000);

                // Check if timer finished (only in countdown mode)
                if (timerMode === "timer") {
                    if (mode === "focus" && newElapsed >= duration && duration > 0) {
                        handleComplete();
                        return;
                    } else if (mode === "break" && newElapsed >= duration && duration > 0) {
                        handleComplete();
                        return;
                    }
                }

                setElapsed(newElapsed);
            }, 1000);
        } else {
            startTimeRef.current = null;
        }

        return () => clearInterval(interval);
    }, [isActive, isPaused, duration, mode]);

    const handleComplete = async () => {
        setIsActive(false);
        setIsPaused(false);
        setElapsed(duration); // Clamp to duration

        // Logic to switch modes automatically
        if (mode === "focus") {
            if (autoStartBreak) {
                setTimeout(() => switchMode("break"), 1500);
            }
        } else {
            if (autoStartFocus) {
                setTimeout(() => switchMode("focus"), 1500);
            }
        }

        // Cleanup sessions
        if (liveSessionId) {
            await updateLiveSession(liveSessionId, { status: "completed", elapsedTime: duration });
            // Optionally delete live session or keep it as completed
            deleteLiveSession(liveSessionId);
            setLiveSessionId(null);
        }

        if (sessionId) {
            await databases.updateDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, sessionId, {
                status: "completed",
                duration: duration
            }).catch(e => console.log("Failed to complete session", e));
            setSessionId(null);
        }
    };

    // AppState handling (Background/Foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener("change", async nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                if (isActive && !isPaused) {
                    const now = Date.now();
                    const saved = await AsyncStorage.getItem("timerState");
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        const savedAt = parsed.savedAt || now;
                        const extraElapsed = Math.floor((now - savedAt) / 1000);
                        const newElapsed = (parsed.elapsed || 0) + extraElapsed;

                        setElapsed(newElapsed);
                        startTimeRef.current = now - newElapsed * 1000;

                        // Sync with Appwrite immediately on resume
                        if (liveSessionId) {
                            updateLiveSession(liveSessionId, { elapsedTime: newElapsed, status: "active" });
                        }
                    }
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isActive, isPaused, liveSessionId]);

    // DB Operations
    const createLiveSession = async (sessionData: { subject: string; goal: string; duration?: number }) => {
        if (!user) return null;
        try {
            const liveSession = await databases.createDocument(
                DB_ID,
                COLLECTIONS.LIVE_SESSIONS,
                ID.unique(),
                {
                    userId: user.$id,
                    username: profile?.username || user.name || "Anonymous",
                    subject: sessionData.subject || subjects.find(s => s.$id === selectedSubjectId)?.name || "Focus Session",
                    goal: sessionData.goal || sessionGoal || "",
                    startTime: new Date().toISOString(),
                    lastUpdateTime: new Date().toISOString(),
                    status: "active",
                    sessionType: mode,
                    duration: sessionData.duration || null,
                    elapsedTime: 0,
                    isPublic: true, // Default to public
                    profilePicture: profile?.profilePicture || null,
                    streak: profile?.streak || 0,
                    totalHours: profile?.totalHours || 0,
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id)),
                ]
            );
            return liveSession.$id;
        } catch (e) {
            console.error("Failed to create live session", e);
            return null;
        }
    };

    const updateLiveSession = async (liveId: string, updates: { status?: "active" | "paused" | "completed"; elapsedTime?: number }) => {
        if (!liveId) return;
        try {
            await databases.updateDocument(DB_ID, COLLECTIONS.LIVE_SESSIONS, liveId, {
                ...updates,
                lastUpdateTime: new Date().toISOString(),
            });
        } catch (e: any) {
            // If 404, maybe recreate? For now just log
            console.log("Failed to update live session", e);
        }
    };

    const deleteLiveSession = async (liveId: string) => {
        if (!liveId) return;
        try {
            await databases.deleteDocument(DB_ID, COLLECTIONS.LIVE_SESSIONS, liveId);
        } catch (e) {
            console.log("Failed to delete live session", e);
        }
    };

    const createStudySession = async (sessionData: { subject: string; goal: string }) => {
        if (!user) return null;
        try {
            const session = await databases.createDocument(
                DB_ID,
                COLLECTIONS.STUDY_SESSIONS,
                ID.unique(),
                {
                    userId: user.$id,
                    subject: sessionData.subject || subjects.find(s => s.$id === selectedSubjectId)?.name || "Focus Session",
                    goal: sessionData.goal || sessionGoal || "",
                    type: mode,
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString(), // Will update this
                    duration: 0,
                    status: "active",
                    isPublic: true,
                }
            );
            return session.$id;
        } catch (e) {
            console.error("Failed to create study session", e);
            return null;
        }
    };

    // Controls
    const toggleTimer = async () => {
        if (!isActive) {
            // START
            setIsActive(true);
            setIsPaused(false);

            // Create sessions if not existing
            if (user && !sessionId && mode === "focus") {
                const subjName = subjects.find(s => s.$id === selectedSubjectId)?.name || "Focus Session";
                const sId = await createStudySession({ subject: subjName, goal: sessionGoal });
                const lId = await createLiveSession({ subject: subjName, goal: sessionGoal, duration });
                if (sId) setSessionId(sId);
                if (lId) setLiveSessionId(lId);
            } else if (liveSessionId) {
                // Resume live session
                updateLiveSession(liveSessionId, { status: "active" });
            }

        } else if (!isPaused) {
            // PAUSE
            setIsPaused(true);
            startTimeRef.current = null;

            if (liveSessionId) {
                updateLiveSession(liveSessionId, { status: "paused", elapsedTime: elapsed });
            }
        } else {
            // RESUME
            setIsPaused(false);
            if (liveSessionId) {
                updateLiveSession(liveSessionId, { status: "active", elapsedTime: elapsed });
            }
        }
    };

    const resetTimer = async () => {
        setIsActive(false);
        setIsPaused(false);
        setElapsed(0);
        startTimeRef.current = null;

        if (liveSessionId) {
            await deleteLiveSession(liveSessionId);
            setLiveSessionId(null);
        }

        // Determine status for study session
        if (sessionId) {
            // If very short, maybe delete? For now just mark incomplete or completed based on time?
            // Usually we might just leave it or mark as cancelled.
            // Let's mark as completed if reasonable time passed, or delete.
            if (elapsed > 60) {
                await databases.updateDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, sessionId, {
                    status: "completed", // Or stopped
                    duration: elapsed,
                    endTime: new Date().toISOString()
                }).catch(e => { });
            } else {
                await databases.deleteDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, sessionId).catch(e => { });
            }
            setSessionId(null);
        }
    };

    const switchMode = async (newMode: "focus" | "break") => {
        // Stop current if running
        if (isActive) await resetTimer();

        setMode(newMode);
        setDuration(newMode === "focus" ? targetDuration : (autoStartBreak ? 5 * 60 : 5 * 60)); // Simple break duration for now
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Calculate remaining (if timer) or just elapsed (if stopwatch)
    const displaySeconds = timerMode === "timer" ? Math.max(0, duration - elapsed) : elapsed;
    const progress = timerMode === "timer" ? Math.min(100, (elapsed / duration) * 100) : 100;
    const displayTimeStr = formatTime(displaySeconds);

    // Apply color theme
    const getColor = (colorName: string) => {
        const theme = THEMES.find(t => t.id === themeColor);
        return theme ? theme.color : Colors.dark.primary;
    };

    // Constants for themes
    const THEMES = [
        { id: "indigo", name: "Deep Space", color: "#6366f1" },
        { id: "cyan", name: "Cyberpunk", color: "#06b6d4" },
        { id: "green", name: "Matrix", color: "#22c55e" },
        { id: "amber", name: "Industrial", color: "#f59e0b" },
        { id: "rose", name: "Neon City", color: "#f43f5e" },
        { id: "violet", name: "Synthwave", color: "#8b5cf6" },
    ];

    const activeColor = mode === "break" ? "#22c55e" : (THEMES.find(t => t.id === themeColor)?.color || "#6366f1");

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <View style={styles.modeContainer}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === "focus" && { backgroundColor: activeColor + '20' }]}
                        onPress={() => switchMode("focus")}
                    >
                        <Brain size={16} color={mode === "focus" ? activeColor : Colors.dark.textMuted} />
                        <Text style={[styles.modeText, mode === "focus" && { color: activeColor }]}>Focus</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === "break" && { backgroundColor: '#22c55e20' }]}
                        onPress={() => switchMode("break")}
                    >
                        <Coffee size={16} color={mode === "break" ? '#22c55e' : Colors.dark.textMuted} />
                        <Text style={[styles.modeText, mode === "break" && { color: '#22c55e' }]}>Break</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => setTimerMode(timerMode === "timer" ? "stopwatch" : "timer")}
                        style={[styles.settingsButton, { backgroundColor: Colors.dark.surfaceHighlight }]}
                    >
                        <Text style={{ color: activeColor, fontSize: 10, fontWeight: '700' }}>
                            {timerMode.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowDesigner(true)} style={styles.settingsButton}>
                        <CalendarDays size={24} color={Colors.dark.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
                        <Settings size={24} color={Colors.dark.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Subject Picker Row */}
            <View style={styles.pickerRow}>
                <TouchableOpacity
                    style={styles.pickerWrapper}
                    onPress={() => setShowSubjectPicker(true)}
                >
                    <Book size={16} color={activeColor} />
                    <Text style={styles.pickerText} numberOfLines={1}>
                        {subjects.find(s => s.$id === selectedSubjectId)?.name || "Select Subject"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.pickerWrapper, { flex: 0.8 }]}
                    onPress={() => setShowTopicPicker(true)}
                >
                    <Text style={styles.pickerText} numberOfLines={1}>
                        {topics.find(t => t.$id === selectedTopicId)?.name || "Select Topic"}
                    </Text>
                </TouchableOpacity>

                {livePeersCount > 0 && (
                    <View style={styles.peersBadge}>
                        <Users size={12} color="#4ade80" />
                        <Text style={styles.peersText}>{livePeersCount}</Text>
                    </View>
                )}
            </View>

            {/* Subject Picker Modal */}
            <Modal
                visible={showSubjectPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSubjectPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSubjectPicker(false)}
                >
                    <View style={styles.pickerModal}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerModalTitle}>Select Subject</Text>
                            <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                                <X size={20} color={Colors.dark.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.pickerList}>
                            {subjects.map(s => (
                                <TouchableOpacity
                                    key={s.$id}
                                    style={[
                                        styles.subjectItem,
                                        selectedSubjectId === s.$id && { backgroundColor: activeColor + '20', borderColor: activeColor }
                                    ]}
                                    onPress={() => {
                                        setSelectedSubjectId(s.$id);
                                        setShowSubjectPicker(false);
                                    }}
                                >
                                    <View style={[styles.subjectColor, { backgroundColor: s.color || activeColor }]} />
                                    <Text style={[styles.subjectItemText, selectedSubjectId === s.$id && { color: activeColor }]}>{s.name}</Text>
                                </TouchableOpacity>
                            ))}
                            {subjects.length === 0 && (
                                <Text style={styles.emptyText}>No subjects found. Create one in 'My Subjects'.</Text>
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Topic Picker Modal */}
            <Modal
                visible={showTopicPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTopicPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTopicPicker(false)}
                >
                    <View style={styles.pickerModal}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerModalTitle}>Select Topic</Text>
                            <TouchableOpacity onPress={() => setShowTopicPicker(false)}>
                                <X size={20} color={Colors.dark.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.pickerList}>
                            {filteredTopics.map(t => (
                                <TouchableOpacity
                                    key={t.$id}
                                    style={[
                                        styles.subjectItem,
                                        selectedTopicId === t.$id && { backgroundColor: activeColor + '20', borderColor: activeColor }
                                    ]}
                                    onPress={() => {
                                        setSelectedTopicId(t.$id);
                                        setShowTopicPicker(false);
                                    }}
                                >
                                    <Text style={[styles.subjectItemText, selectedTopicId === t.$id && { color: activeColor }]}>{t.name}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[
                                    styles.subjectItem,
                                    !selectedTopicId && { backgroundColor: activeColor + '20', borderColor: activeColor }
                                ]}
                                onPress={() => {
                                    setSelectedTopicId("");
                                    setShowTopicPicker(false);
                                }}
                            >
                                <Text style={[styles.subjectItemText, !selectedTopicId && { color: activeColor }]}>None / General</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Timer Display */}
            <View style={styles.timerDisplayContainer}>
                {timerStyle === "grid" || timerStyle === "digital" ? (
                    <DigitalTimerDisplay
                        time={displayTimeStr}
                        themeColor={themeColor}
                        isBreak={mode === "break"}
                        size="lg"
                        timerFont={timerFont}
                    />
                ) : timerStyle === "circular" ? (
                    <CircularTimerDisplay
                        time={displayTimeStr}
                        progress={progress}
                        themeColor={themeColor}
                        isBreak={mode === "break"}
                        size="md"
                        timerFont={timerFont}
                    />
                ) : (
                    <MinimalTimerDisplay
                        time={displayTimeStr}
                        themeColor={themeColor}
                        isBreak={mode === "break"}
                        size="md"
                        timerFont={timerFont}
                    />
                )}

                <Text style={[styles.statusText, { color: activeColor }]}>
                    {isActive ? (isPaused ? "PAUSED" : (mode === "focus" ? "FOCUSING" : "BREAK")) : "READY"}
                </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: activeColor + '20' }]}
                    onPress={toggleTimer}
                >
                    {isActive && !isPaused ? (
                        <Pause size={32} color={activeColor} />
                    ) : (
                        <Play size={32} color={activeColor} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: Colors.dark.surfaceHighlight }]}
                    onPress={resetTimer}
                >
                    <RotateCcw size={28} color={Colors.dark.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Session Designer */}
            <SessionDesigner
                isOpen={showDesigner}
                onClose={() => setShowDesigner(false)}
                onSave={async (blocks, startTime) => {
                    // Save schedule to Appwrite logic here
                    // For now we just implement "Start Now" via onStartNow
                    setShowDesigner(false);
                }}
                onStartNow={(blocks) => {
                    if (blocks.length > 0) {
                        const first = blocks[0];
                        setDuration(first.duration * 60);
                        setTargetDuration(first.duration * 60);
                        setMode(first.type);

                        if (first.subject) {
                            const foundSubj = subjects.find(s => s.name === first.subject);
                            if (foundSubj) {
                                setSelectedSubjectId(foundSubj.$id);
                                if (first.topic) {
                                    const foundTopic = topics.find(t => t.name === first.topic && t.subjectId === foundSubj.$id);
                                    if (foundTopic) setSelectedTopicId(foundTopic.$id);
                                }
                            }
                        }

                        if (first.goal) setSessionGoal(first.goal);

                        setShowDesigner(false);
                        setTimeout(() => toggleTimer(), 500);
                    }
                }}
            />

            {/* Settings Modal */}
            <TimerSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                themeColor={themeColor}
                setThemeColor={setThemeColor}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                visualMode={visualMode}
                setVisualMode={setVisualMode}
                timerStyle={timerStyle}
                setTimerStyle={setTimerStyle}
                timerFont={timerFont}
                setTimerFont={setTimerFont}
                autoStartFocus={autoStartFocus}
                setAutoStartFocus={setAutoStartFocus}
                autoStartBreak={autoStartBreak}
                setAutoStartBreak={setAutoStartBreak}
                targetDuration={targetDuration}
                setTargetDuration={setTargetDuration}
                timerMode={timerMode}
                setTimerMode={setTimerMode}
                applyPreset={(focus) => {
                    setTargetDuration(focus * 60);
                    if (mode === "focus") {
                        setDuration(focus * 60);
                        resetTimer();
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        width: '100%',
        alignItems: "center",
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 48,
    },
    modeContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 4,
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    modeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    settingsButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: Colors.dark.surface,
    },
    timerDisplayContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 64,
        flex: 1,
    },
    statusText: {
        fontSize: 16,
        marginTop: 24,
        fontWeight: '600',
        letterSpacing: 4,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
        marginBottom: 24,
    },
    controlButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 32,
        paddingHorizontal: 4,
    },
    pickerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 10,
        flex: 1,
        marginRight: 12,
    },
    pickerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    peersBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    peersText: {
        color: '#4ade80',
        fontSize: 11,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerModal: {
        width: '100%',
        maxHeight: '60%',
        backgroundColor: Colors.dark.surface,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    pickerModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    pickerList: {
        flexGrow: 0,
    },
    subjectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    subjectColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    subjectItemText: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '500',
    },
    emptyText: {
        color: Colors.dark.textMuted,
        textAlign: 'center',
        padding: 20,
        fontSize: 14,
    }
});
