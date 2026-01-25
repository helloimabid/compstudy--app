import { Colors } from "@/constants/Colors";
import { useStrictMode } from "@/hooks/useStrictMode";
import { COLLECTIONS, databases, DB_ID, Query } from "@/lib/appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  Book,
  Brain,
  CalendarDays,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Users,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";
import { ID, Permission, Role } from "react-native-appwrite";
import { useAuth } from "./AppwriteProvider";
import SessionDesigner from "./SessionDesigner";
import {
  CircularTimerDisplay,
  DigitalTimerDisplay,
  MinimalTimerDisplay,
} from "./TimerDisplays";
import TimerSettings, {
  ThemeColor,
  TimerFont,
  TimerStyle,
  VisualMode,
} from "./TimerSettings";

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
  const [strictMode, setStrictMode] = useState(false);
  const [targetDuration, setTargetDuration] = useState(25 * 60);
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);
  const completionNotificationId = useRef<string | null>(null);

  // Convert mode to the format expected by useStrictMode hook
  const timerState: "focus" | "break" | "idle" = isActive ? mode : "idle";

  // Apply Strict Mode Hook
  const { isStrictModeActive } = useStrictMode(
    strictMode,
    isActive && !isPaused, // Only active when running and not paused
    timerState,
    () => {
      // Force stop callback - when user forces timer to stop from strict mode
      resetTimer();
    }
  );

  // Load Settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem("studyTimerSettings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.themeColor) setThemeColor(parsed.themeColor);
          if (parsed.soundEnabled !== undefined)
            setSoundEnabled(parsed.soundEnabled);
          if (parsed.visualMode) setVisualMode(parsed.visualMode);
          if (parsed.timerStyle) setTimerStyle(parsed.timerStyle);
          if (parsed.timerFont) setTimerFont(parsed.timerFont);
          if (parsed.autoStartFocus !== undefined)
            setAutoStartFocus(parsed.autoStartFocus);
          if (parsed.autoStartBreak !== undefined)
            setAutoStartBreak(parsed.autoStartBreak);
          if (parsed.strictMode !== undefined) setStrictMode(parsed.strictMode);
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
        const [currRes, subjRes, topRes, peersRes, scheduledRes] = await Promise.all([
          databases.listDocuments(DB_ID, COLLECTIONS.CURRICULUM, [
            Query.equal("userId", user.$id),
          ]),
          databases.listDocuments(DB_ID, COLLECTIONS.SUBJECTS, [
            Query.equal("userId", user.$id),
          ]),
          databases.listDocuments(DB_ID, COLLECTIONS.TOPICS, [
            Query.equal("userId", user.$id),
          ]),
          databases.listDocuments(DB_ID, COLLECTIONS.LIVE_SESSIONS, [
            Query.equal("status", "active"),
            Query.limit(1),
          ]),
          databases.listDocuments(DB_ID, COLLECTIONS.STUDY_SESSIONS, [
            Query.equal("userId", user.$id),
            Query.equal("status", "scheduled"),
            Query.orderDesc("scheduledAt"),
            Query.limit(50),
          ]),
        ]);

        setCurriculums(currRes.documents);
        setSubjects(subjRes.documents);
        setTopics(topRes.documents);
        setLivePeersCount(peersRes.total);
        setScheduledSessions(scheduledRes.documents);

        if (subjRes.documents.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subjRes.documents[0].$id);
        }
      } catch (e) {
        console.error("Failed to fetch timer metadata", e);
      }
    };
    fetchData();
  }, [user]);

  const filteredTopics = topics.filter(
    (t: any) => t.subjectId === selectedSubjectId
  );

  // Save Settings
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(
          "studyTimerSettings",
          JSON.stringify({
            themeColor,
            soundEnabled,
            visualMode,
            timerStyle,
            timerFont,
            autoStartFocus,
            autoStartBreak,
            strictMode,
            targetDuration,
            timerMode,
          })
        );
      } catch (e) {
        console.error("Failed to save settings", e);
      }
    };
    saveSettings();

    // Sync duration with targetDuration if timer is idle
    if (!isActive && elapsed === 0 && mode === "focus") {
      setDuration(targetDuration);
    }
  }, [
    themeColor,
    soundEnabled,
    visualMode,
    timerStyle,
    timerFont,
    autoStartFocus,
    autoStartBreak,
    strictMode,
    targetDuration,
    isActive,
    elapsed,
    mode,
    timerMode,
  ]);

  // Restore Timer State
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem("timerState");
        if (savedState) {
          const parsed = JSON.parse(savedState);

          // Only restore if user matches (or anonymous)
          if (!user || parsed.userId === user.$id) {
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
  }, [
    isActive,
    isPaused,
    elapsed,
    duration,
    mode,
    sessionId,
    liveSessionId,
    user,
  ]);

  // Schedule/Cancel completion notification
  useEffect(() => {
    const manageNotification = async () => {
      // Cancel existing
      if (completionNotificationId.current) {
        await Notifications.cancelScheduledNotificationAsync(
          completionNotificationId.current
        );
        completionNotificationId.current = null;
      }

      // Schedule new if active, running, and in timer mode
      if (isActive && !isPaused && timerMode === "timer") {
        const secondsRemaining = duration - elapsed;
        if (secondsRemaining > 0) {
          completionNotificationId.current =
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Timer Finished!",
                body:
                  mode === "focus"
                    ? "Focus session complete. Time for a break!"
                    : "Break over. Time to focus!",
                sound: true,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsRemaining,
                repeats: false,
              },
            });
        }
      }
    };
    manageNotification();
  }, [isActive, isPaused, duration, mode, timerMode]); // Removed elapsed to avoid re-scheduling every second

  const handleComplete = async () => {
    if (soundEnabled) {
      Vibration.vibrate([500, 500, 500]);
      Alert.alert(
        "Timer Finished!",
        mode === "focus" ? "Time for a break!" : "Time to focus!"
      );
    }

    setIsActive(false);
    setIsPaused(false);
    setElapsed(duration); // Clamp to duration

    // Logic to switch modes automatically
    const nextMode = mode === "focus" ? "break" : "focus";
    const shouldAutoStart = mode === "focus" ? autoStartBreak : autoStartFocus;

    setTimeout(() => {
      switchMode(nextMode);
      if (shouldAutoStart) {
        setTimeout(() => setIsActive(true), 100);
      }
    }, 1500);

    // Cleanup sessions - update status first, then delete
    if (liveSessionId) {
      try {
        // First update status to completed
        await updateLiveSession(liveSessionId, {
          status: "completed",
          elapsedTime: duration,
        });
        // Then delete the session
        await deleteLiveSession(liveSessionId);
      } catch (e) {
        console.error("Failed to cleanup live session on completion", e);
      }
      setLiveSessionId(null);
    }

    if (sessionId) {
      await databases
        .updateDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, sessionId, {
          status: "completed",
          duration: duration,
        })
        .catch((e) => console.log("Failed to complete session", e));
      setSessionId(null);
    }
  };

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
          } else if (
            mode === "break" &&
            newElapsed >= duration &&
            duration > 0
          ) {
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
  }, [isActive, isPaused, duration, mode, timerMode, handleComplete]);

  // Store latest elapsed in a ref for cleanup
  const elapsedRef = useRef(elapsed);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  // Cleanup live sessions on unmount only
  useEffect(() => {
    return () => {
      const sessionIdToCleanup = liveSessionId;
      if (sessionIdToCleanup) {
        // Update status to completed and delete
        updateLiveSession(sessionIdToCleanup, {
          status: "completed",
          elapsedTime: elapsedRef.current,
        })
          .then(() => deleteLiveSession(sessionIdToCleanup))
          .catch((error) => {
            console.error("Failed to cleanup live session on unmount:", error);
            // If update fails, try to at least delete
            deleteLiveSession(sessionIdToCleanup).catch((e) => 
              console.error("Failed to delete live session on unmount:", e)
            );
          });
      }
    };
  }, []); // Only run on mount/unmount

  // AppState handling (Background/Foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
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
                updateLiveSession(liveSessionId, {
                  elapsedTime: newElapsed,
                  status: "active",
                });
              }
            }
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isActive, isPaused, liveSessionId]);

  // DB Operations
  const createLiveSession = async (sessionData: {
    subject: string;
    goal: string;
    duration?: number;
  }) => {
    if (!user) return null;
    try {
      const liveSession = await databases.createDocument(
        DB_ID,
        COLLECTIONS.LIVE_SESSIONS,
        ID.unique(),
        {
          userId: user.$id,
          username: profile?.username || user.name || "Anonymous",
          subject:
            sessionData.subject ||
            subjects.find((s) => s.$id === selectedSubjectId)?.name ||
            "Focus Session",
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

  const updateLiveSession = async (
    liveId: string,
    updates: {
      status?: "active" | "paused" | "completed";
      elapsedTime?: number;
    }
  ) => {
    if (!liveId) return;
    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.LIVE_SESSIONS, liveId, {
        ...updates,
        lastUpdateTime: new Date().toISOString(),
      });
    } catch (e: any) {
      // Document not found - clear the ID to prevent repeated errors
      if (e.code === 404 || e.message?.includes("could not be found")) {
        console.log("Live session not found, clearing ID");
        setLiveSessionId(null);
      } else {
        console.log("Failed to update live session", e);
      }
    }
  };

  const deleteLiveSession = async (liveId: string) => {
    if (!liveId) return;
    try {
      await databases.deleteDocument(DB_ID, COLLECTIONS.LIVE_SESSIONS, liveId);
    } catch (e: any) {
      // Silently ignore if document doesn't exist - it's already gone
      if (e.code === 404 || e.message?.includes("could not be found")) {
        console.log("Live session already deleted or doesn't exist");
      } else {
        console.log("Failed to delete live session", e);
      }
    }
  };

  const createStudySession = async (sessionData: {
    subject: string;
    goal: string;
  }) => {
    if (!user) return null;
    try {
      const session = await databases.createDocument(
        DB_ID,
        COLLECTIONS.STUDY_SESSIONS,
        ID.unique(),
        {
          userId: user.$id,
          subject:
            sessionData.subject ||
            subjects.find((s) => s.$id === selectedSubjectId)?.name ||
            "Focus Session",
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

  // Helper to start new session
  const startFocusSession = async () => {
    const subjName =
      subjects.find((s) => s.$id === selectedSubjectId)?.name ||
      "Focus Session";
    const sId = await createStudySession({
      subject: subjName,
      goal: sessionGoal,
    });
    const lId = await createLiveSession({
      subject: subjName,
      goal: sessionGoal,
      duration,
    });
    if (sId) setSessionId(sId);
    if (lId) setLiveSessionId(lId);
  };

  // Controls
  const toggleTimer = async () => {
    if (!isActive) {
      // START

      // Check for existing active sessions if starting fresh focus session
      if (user && !sessionId && mode === "focus") {
        try {
          const activeSessions = await databases.listDocuments(
            DB_ID,
            COLLECTIONS.STUDY_SESSIONS,
            [
              Query.equal("userId", user.$id),
              Query.equal("status", "active"),
              Query.limit(1),
            ]
          );

          if (activeSessions.total > 0) {
            const existingSession = activeSessions.documents[0];
            Alert.alert(
              "Active Session Found",
              "You already have an active focus session. What would you like to do?",
              [
                {
                  text: "Resume Existing",
                  onPress: () => {
                    setSessionId(existingSession.$id);
                    setIsActive(true);
                    setIsPaused(false);
                  },
                },
                {
                  text: "Start New (End Old)",
                  style: "destructive",
                  onPress: async () => {
                    // End old session
                    await databases.updateDocument(
                      DB_ID,
                      COLLECTIONS.STUDY_SESSIONS,
                      existingSession.$id,
                      {
                        status: "completed",
                        endTime: new Date().toISOString(),
                      }
                    );

                    setIsActive(true);
                    setIsPaused(false);
                    await startFocusSession();
                  },
                },
                {
                  text: "Cancel",
                  style: "cancel",
                },
              ]
            );
            return;
          }
        } catch (e) {
          console.error("Error checking active sessions", e);
        }
      }

      setIsActive(true);
      setIsPaused(false);

      // Create sessions if not existing
      if (user && !sessionId && mode === "focus") {
        await startFocusSession();
      } else if (liveSessionId) {
        // Resume live session
        updateLiveSession(liveSessionId, { status: "active" });
      }
    } else if (!isPaused) {
      // PAUSE
      setIsPaused(true);
      startTimeRef.current = null;

      if (liveSessionId) {
        updateLiveSession(liveSessionId, {
          status: "paused",
          elapsedTime: elapsed,
        });
      }
    } else {
      // RESUME
      setIsPaused(false);
      if (liveSessionId) {
        updateLiveSession(liveSessionId, {
          status: "active",
          elapsedTime: elapsed,
        });
      }
    }
  };

  const resetTimer = async () => {
    setIsActive(false);
    setIsPaused(false);
    setElapsed(0);
    startTimeRef.current = null;

    if (liveSessionId) {
      try {
        // Update status to completed before deleting
        await updateLiveSession(liveSessionId, {
          status: "completed",
          elapsedTime: elapsed,
        });
        await deleteLiveSession(liveSessionId);
      } catch (e) {
        console.error("Failed to cleanup live session on reset", e);
      }
      setLiveSessionId(null);
    }

    // Determine status for study session
    if (sessionId) {
      // If very short, maybe delete? For now just mark incomplete or completed based on time?
      // Usually we might just leave it or mark as cancelled.
      // Let's mark as completed if reasonable time passed, or delete.
      if (elapsed > 60) {
        await databases
          .updateDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, sessionId, {
            status: "completed", // Or stopped
            duration: elapsed,
            endTime: new Date().toISOString(),
          })
          .catch((e) => {});
      } else {
        await databases
          .deleteDocument(DB_ID, COLLECTIONS.STUDY_SESSIONS, sessionId)
          .catch((e) => {});
      }
      setSessionId(null);
    }
  };

  const switchMode = async (newMode: "focus" | "break") => {
    // Stop current if running
    if (isActive) await resetTimer();

    setMode(newMode);
    setDuration(
      newMode === "focus" ? targetDuration : autoStartBreak ? 5 * 60 : 5 * 60
    ); // Simple break duration for now
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate remaining (if timer) or just elapsed (if stopwatch)
  const displaySeconds =
    timerMode === "timer" ? Math.max(0, duration - elapsed) : elapsed;
  const progress =
    timerMode === "timer" ? Math.min(100, (elapsed / duration) * 100) : 100;
  const displayTimeStr = formatTime(displaySeconds);

  // Apply color theme
  const getColor = (colorName: string) => {
    const theme = THEMES.find((t) => t.id === themeColor);
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

  const activeColor =
    mode === "break"
      ? "#22c55e"
      : THEMES.find((t) => t.id === themeColor)?.color || "#6366f1";

  return (
    <View style={styles.container}>
      {/* Strict Mode Indicator */}
      {isStrictModeActive && (
        <View style={styles.strictModeIndicator}>
          <Text style={styles.strictModeText}>
            🔒 Strict Mode Active - Cannot exit during focus
          </Text>
        </View>
      )}

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === "focus" && { backgroundColor: activeColor + "20" },
            ]}
            onPress={() => switchMode("focus")}
          >
            <Brain
              size={16}
              color={mode === "focus" ? activeColor : Colors.dark.textMuted}
            />
            <Text
              style={[
                styles.modeText,
                mode === "focus" && { color: activeColor },
              ]}
            >
              Focus
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === "break" && { backgroundColor: "#22c55e20" },
            ]}
            onPress={() => switchMode("break")}
          >
            <Coffee
              size={16}
              color={mode === "break" ? "#22c55e" : Colors.dark.textMuted}
            />
            <Text
              style={[
                styles.modeText,
                mode === "break" && { color: "#22c55e" },
              ]}
            >
              Break
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() =>
              setTimerMode(timerMode === "timer" ? "stopwatch" : "timer")
            }
            style={[
              styles.settingsButton,
              { backgroundColor: Colors.dark.surfaceHighlight },
            ]}
          >
            <Text
              style={{ color: activeColor, fontSize: 10, fontWeight: "700" }}
            >
              {timerMode.toUpperCase()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              // Refetch scheduled sessions before opening
              if (user) {
                try {
                  const scheduledRes = await databases.listDocuments(
                    DB_ID,
                    COLLECTIONS.STUDY_SESSIONS,
                    [
                      Query.equal("userId", user.$id),
                      Query.equal("status", "scheduled"),
                      Query.orderDesc("scheduledAt"),
                      Query.limit(50),
                    ]
                  );
                  setScheduledSessions(scheduledRes.documents);
                } catch (e) {
                  console.error("Failed to fetch scheduled sessions", e);
                }
              }
              setShowDesigner(true);
            }}
            style={styles.settingsButton}
          >
            <CalendarDays size={24} color={Colors.dark.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.settingsButton}
          >
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
            {subjects.find((s) => s.$id === selectedSubjectId)?.name ||
              "Select Subject"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickerWrapper, { flex: 0.8 }]}
          onPress={() => setShowTopicPicker(true)}
        >
          <Text style={styles.pickerText} numberOfLines={1}>
            {topics.find((t) => t.$id === selectedTopicId)?.name ||
              "Select Topic"}
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
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.$id}
                  style={[
                    styles.subjectItem,
                    selectedSubjectId === s.$id && {
                      backgroundColor: activeColor + "20",
                      borderColor: activeColor,
                    },
                  ]}
                  onPress={() => {
                    setSelectedSubjectId(s.$id);
                    setShowSubjectPicker(false);
                  }}
                >
                  <View
                    style={[
                      styles.subjectColor,
                      { backgroundColor: s.color || activeColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.subjectItemText,
                      selectedSubjectId === s.$id && { color: activeColor },
                    ]}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {subjects.length === 0 && (
                <Text style={styles.emptyText}>
                  No subjects found. Create one in "My Subjects".
                </Text>
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
              {filteredTopics.map((t) => (
                <TouchableOpacity
                  key={t.$id}
                  style={[
                    styles.subjectItem,
                    selectedTopicId === t.$id && {
                      backgroundColor: activeColor + "20",
                      borderColor: activeColor,
                    },
                  ]}
                  onPress={() => {
                    setSelectedTopicId(t.$id);
                    setShowTopicPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.subjectItemText,
                      selectedTopicId === t.$id && { color: activeColor },
                    ]}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.subjectItem,
                  !selectedTopicId && {
                    backgroundColor: activeColor + "20",
                    borderColor: activeColor,
                  },
                ]}
                onPress={() => {
                  setSelectedTopicId("");
                  setShowTopicPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.subjectItemText,
                    !selectedTopicId && { color: activeColor },
                  ]}
                >
                  None / General
                </Text>
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
          {isActive
            ? isPaused
              ? "PAUSED"
              : mode === "focus"
              ? "FOCUSING"
              : "BREAK"
            : "READY"}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: activeColor + "20" },
          ]}
          onPress={toggleTimer}
        >
          {isActive && !isPaused ? (
            <Pause size={32} color={activeColor} />
          ) : (
            <Play size={32} color={activeColor} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: Colors.dark.surfaceHighlight },
          ]}
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
          // Save schedule to Appwrite
          if (!user || blocks.length === 0) {
            setShowDesigner(false);
            return;
          }

          try {
            // Parse start time and create scheduled sessions
            const [hours, minutes] = startTime.split(":").map(Number);
            const scheduledDate = new Date();
            scheduledDate.setHours(hours, minutes, 0, 0);

            // If the time has passed today, schedule for tomorrow
            if (scheduledDate < new Date()) {
              scheduledDate.setDate(scheduledDate.getDate() + 1);
            }

            let currentScheduleTime = new Date(scheduledDate);

            // Create a scheduled session for each block
            for (const block of blocks) {
              const goalData = block.goals && block.goals.length > 0
                ? JSON.stringify(block.goals)
                : (block.goal || null);

              const sessionData: any = {
                userId: user.$id,
                subject:
                  block.subject ||
                  (block.type === "focus" ? "Focus Session" : "Break"),
                goal: goalData,
                type: block.type,
                duration: block.duration * 60, // Convert to seconds
                plannedDuration: block.duration * 60, // Store planned duration
                startTime: currentScheduleTime.toISOString(),
                endTime: new Date(
                  currentScheduleTime.getTime() + block.duration * 60 * 1000
                ).toISOString(),
                scheduledAt: currentScheduleTime.toISOString(),
                status: "scheduled",
                isPublic: block.isPublic ?? false, // Use block's public setting
                curriculumId: null, // Can be enhanced later
                timerMode: "timer", // Default to timer mode for scheduled sessions
              };

              await databases.createDocument(
                DB_ID,
                COLLECTIONS.STUDY_SESSIONS,
                ID.unique(),
                sessionData
              );

              // Move schedule time forward by block duration
              currentScheduleTime = new Date(
                currentScheduleTime.getTime() + block.duration * 60 * 1000
              );
            }

            Alert.alert(
              "Schedule Saved!",
              `${blocks.length} session(s) scheduled starting at ${startTime}`
            );

            // Refetch scheduled sessions to update the list
            if (user) {
              const scheduledRes = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.STUDY_SESSIONS,
                [
                  Query.equal("userId", user.$id),
                  Query.equal("status", "scheduled"),
                  Query.orderDesc("scheduledAt"),
                  Query.limit(50),
                ]
              );
              setScheduledSessions(scheduledRes.documents);
            }

            setShowDesigner(false);
          } catch (e) {
            console.error("Failed to save schedule", e);
            Alert.alert("Error", "Failed to save schedule. Please try again.");
          }
        }}
        onDeleteScheduledItem={async (id: string) => {
          try {
            await databases.deleteDocument(
              DB_ID,
              COLLECTIONS.STUDY_SESSIONS,
              id
            );

            // Update local state
            setScheduledSessions((prev) => prev.filter((s) => s.$id !== id));
            Alert.alert("Success", "Scheduled session deleted");
          } catch (e) {
            console.error("Failed to delete scheduled session", e);
            Alert.alert("Error", "Failed to delete session");
          }
        }}
        onStartScheduledSession={async (id: string) => {
          try {
            const session = scheduledSessions.find((s) => s.$id === id);
            if (!session) return;

            // Set up timer with session data
            setMode(session.type || "focus");
            setDuration(session.plannedDuration || session.duration || 25 * 60);
            setTargetDuration(
              session.plannedDuration || session.duration || 25 * 60
            );
            setTimerMode(session.timerMode || "timer");

            // Find and set subject if it exists
            if (session.subject) {
              const foundSubj = subjects.find((s) => s.name === session.subject);
              if (foundSubj) {
                setSelectedSubjectId(foundSubj.$id);
              }
            }

            // Set goal if exists
            if (session.goal) {
              try {
                const goals = JSON.parse(session.goal);
                if (Array.isArray(goals) && goals.length > 0) {
                  setSessionGoal(goals[0].text || "");
                } else {
                  setSessionGoal(session.goal);
                }
              } catch {
                setSessionGoal(session.goal);
              }
            }

            // Update session status to active and link it
            await databases.updateDocument(
              DB_ID,
              COLLECTIONS.STUDY_SESSIONS,
              id,
              {
                status: "active",
                startTime: new Date().toISOString(),
              }
            );

            setSessionId(id);

            // Close designer and start timer
            setShowDesigner(false);
            setTimeout(() => {
              setIsActive(true);
              setIsPaused(false);
            }, 500);
          } catch (e) {
            console.error("Failed to start scheduled session", e);
            Alert.alert("Error", "Failed to start session");
          }
        }}
        existingSchedule={scheduledSessions}
        curriculums={curriculums}
        subjects={subjects}
        topics={topics}
        onStartNow={(blocks) => {
          if (blocks.length > 0) {
            const first = blocks[0];
            setDuration(first.duration * 60);
            setTargetDuration(first.duration * 60);
            setMode(first.type);

            if (first.subject) {
              const foundSubj = subjects.find((s) => s.name === first.subject);
              if (foundSubj) {
                setSelectedSubjectId(foundSubj.$id);
                if (first.topic) {
                  const foundTopic = topics.find(
                    (t) =>
                      t.name === first.topic && t.subjectId === foundSubj.$id
                  );
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
        strictMode={strictMode}
        setStrictMode={setStrictMode}
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

      {/* Strict Mode Overlay - Blocks internal navigation */}
      <Modal
        visible={isStrictModeActive}
        animationType="none"
        transparent={false}
        onRequestClose={() => {
          /* Handle back button if needed, though BackHandler does it */
        }}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: Colors.dark.background },
          ]}
        >
          <View style={styles.strictModeIndicator}>
            <Text style={styles.strictModeText}>
              🔒 Strict Mode Active - Cannot exit during focus
            </Text>
          </View>

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
                size="lg"
                timerFont={timerFont}
              />
            ) : (
              <MinimalTimerDisplay
                time={displayTimeStr}
                themeColor={themeColor}
                isBreak={mode === "break"}
                size="lg"
                timerFont={timerFont}
              />
            )}
            <Text style={[styles.statusText, { color: activeColor }]}>
              STRICT FOCUS MODE
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: "#ef4444" }]}
              onPress={() => {
                Alert.alert(
                  "Give Up?",
                  "Are you sure you want to stop your focus session? Your progress will be lost.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Stop Timer",
                      style: "destructive",
                      onPress: () => {
                        resetTimer();
                      },
                    },
                  ]
                );
              }}
            >
              <X size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: Colors.dark.textMuted, marginTop: 20 }}>
            Tap X to give up and exit
          </Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    width: "100%",
    alignItems: "center",
    flex: 1,
  },
  strictModeIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ef4444",
    padding: 12,
    alignItems: "center",
    zIndex: 1000,
  },
  strictModeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  topBar: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 48,
  },
  modeContainer: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 4,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  modeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
  },
  timerDisplayContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 64,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    marginTop: 24,
    fontWeight: "600",
    letterSpacing: 4,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
    marginBottom: 24,
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  pickerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  peersBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  peersText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerModal: {
    width: "100%",
    maxHeight: "60%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  pickerList: {
    flexGrow: 0,
  },
  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  subjectColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  subjectItemText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500",
  },
  emptyText: {
    color: Colors.dark.textMuted,
    textAlign: "center",
    padding: 20,
    fontSize: 14,
  },
});
