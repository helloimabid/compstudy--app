import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Brain, Coffee, Pause, Play, RotateCcw } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    AppState,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function NativeStudyTimer() {
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [duration, setDuration] = useState(25 * 60); // Default 25 min
    const [mode, setMode] = useState<"focus" | "break">("focus");

    const startTimeRef = useRef<number | null>(null);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        // Restore state from storage
        const loadState = async () => {
            try {
                const savedState = await AsyncStorage.getItem("timerState");
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    setDuration(parsed.duration || 25 * 60);
                    setMode(parsed.mode || "focus");
                    if (parsed.isActive && !parsed.isPaused) {
                        // Calculate elapsed time properly using timestamp
                        const now = Date.now();
                        const savedAt = parsed.savedAt || now;
                        const extraElapsed = Math.floor((now - savedAt) / 1000);
                        setElapsed((parsed.elapsed || 0) + extraElapsed);
                        setIsActive(true);
                        setIsPaused(false);
                        startTimeRef.current = now - ((parsed.elapsed || 0) + extraElapsed) * 1000;
                    } else {
                        setElapsed(parsed.elapsed || 0);
                        setIsActive(parsed.isActive);
                        setIsPaused(parsed.isPaused);
                    }
                }
            } catch (e) {
                console.error("Failed to load timer state", e);
            }
        };
        loadState();
    }, []);

    useEffect(() => {
        const saveState = async () => {
            try {
                await AsyncStorage.setItem(
                    "timerState",
                    JSON.stringify({
                        isActive,
                        isPaused,
                        elapsed,
                        duration,
                        mode,
                        savedAt: Date.now(),
                    })
                );
            } catch (e) {
                console.error("Failed to save timer state", e);
            }
        };
        saveState();
    }, [isActive, isPaused, elapsed, duration, mode]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isActive && !isPaused) {
            if (!startTimeRef.current) {
                startTimeRef.current = Date.now() - elapsed * 1000;
            }

            interval = setInterval(() => {
                const now = Date.now();
                const newElapsed = Math.floor((now - startTimeRef.current!) / 1000);
                setElapsed(newElapsed);
            }, 1000);
        } else {
            startTimeRef.current = null;
        }

        return () => clearInterval(interval);
    }, [isActive, isPaused]);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                if (isActive && !isPaused) {
                    // Refresh logic if needed, but the interval and saveState logic should handle it
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isActive, isPaused]);

    const toggleTimer = () => {
        if (!isActive) {
            setIsActive(true);
            setIsPaused(false);
        } else {
            setIsPaused(!isPaused);
            startTimeRef.current = null; // Reset ref so it recalculates on resume
        }
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsPaused(false);
        setElapsed(0);
        startTimeRef.current = null;
    };

    const switchMode = (newMode: "focus" | "break") => {
        setMode(newMode);
        setDuration(newMode === "focus" ? 25 * 60 : 5 * 60);
        resetTimer();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    // Determine progress
    const remaining = Math.max(0, duration - elapsed);
    const progress = Math.min(100, (elapsed / duration) * 100);

    return (
        <View style={styles.container}>
            <View style={styles.modeContainer}>
                <TouchableOpacity
                    style={[styles.modeButton, mode === "focus" && styles.modeButtonActive]}
                    onPress={() => switchMode("focus")}
                >
                    <Brain size={20} color={mode === "focus" ? Colors.dark.primaryForeground : Colors.dark.textMuted} />
                    <Text style={[styles.modeText, mode === "focus" && styles.modeTextActive]}>Focus</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, mode === "break" && styles.modeButtonActive]}
                    onPress={() => switchMode("break")}
                >
                    <Coffee size={20} color={mode === "break" ? Colors.dark.primaryForeground : Colors.dark.textMuted} />
                    <Text style={[styles.modeText, mode === "break" && styles.modeTextActive]}>Break</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.timerCircle}>
                <Text style={styles.timerText}>{formatTime(remaining)}</Text>
                <Text style={styles.statusText}>{isActive ? (isPaused ? "PAUSED" : "RUNNING") : "READY"}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={toggleTimer}>
                    {isActive && !isPaused ? (
                        <Pause size={32} color={Colors.dark.text} />
                    ) : (
                        <Play size={32} color={Colors.dark.text} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
                    <RotateCcw size={28} color={Colors.dark.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        width: '100%',
        alignItems: "center",
    },
    modeContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 4,
        marginBottom: 48,
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    modeButtonActive: {
        backgroundColor: Colors.dark.primary,
    },
    modeText: {
        color: Colors.dark.textMuted,
        fontWeight: '600',
    },
    modeTextActive: {
        color: Colors.dark.primaryForeground,
    },
    timerCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 4,
        borderColor: Colors.dark.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 48,
        backgroundColor: Colors.dark.surface,
    },
    timerText: {
        fontSize: 64,
        fontWeight: '700',
        color: Colors.dark.text,
        fontVariant: ['tabular-nums'],
    },
    statusText: {
        fontSize: 16,
        color: Colors.dark.primary,
        marginTop: 8,
        fontWeight: '500',
        letterSpacing: 2,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    controlButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.dark.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    }

});
