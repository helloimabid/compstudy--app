import { Colors } from "@/constants/Colors";
import { Clock, Layout, Palette, Repeat, Type, Volume2, VolumeX, X, Zap } from "lucide-react-native";
import React from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export type ThemeColor =
    | "indigo"
    | "cyan"
    | "green"
    | "amber"
    | "rose"
    | "violet";
export type VisualMode = "grid" | "minimal" | "cyber";
export type TimerStyle = "grid" | "digital" | "circular" | "minimal";
export type TimerFont =
    | "default"
    | "orbitron"
    | "quantico"
    | "audiowide"
    | "electrolize"
    | "zendots";

interface TimerSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    themeColor: ThemeColor;
    setThemeColor: (color: ThemeColor) => void;
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    visualMode: VisualMode;
    setVisualMode: (mode: VisualMode) => void;
    timerStyle: TimerStyle;
    setTimerStyle: (style: TimerStyle) => void;
    timerFont: TimerFont;
    setTimerFont: (font: TimerFont) => void;
    autoStartFocus: boolean;
    setAutoStartFocus: (enabled: boolean) => void;
    autoStartBreak: boolean;
    setAutoStartBreak: (enabled: boolean) => void;
    targetDuration: number;
    setTargetDuration: (duration: number) => void;
    applyPreset: (focus: number) => void;
    timerMode: "timer" | "stopwatch";
    setTimerMode: (mode: "timer" | "stopwatch") => void;
}

const THEMES: { id: ThemeColor; name: string; color: string }[] = [
    { id: "indigo", name: "Deep Space", color: "#6366f1" },
    { id: "cyan", name: "Cyberpunk", color: "#06b6d4" },
    { id: "green", name: "Matrix", color: "#22c55e" },
    { id: "amber", name: "Industrial", color: "#f59e0b" },
    { id: "rose", name: "Neon City", color: "#f43f5e" },
    { id: "violet", name: "Synthwave", color: "#8b5cf6" },
];

const PRESETS = [
    { name: "Pomodoro", focus: 25, break: 5 },
    { name: "Deep Work", focus: 50, break: 10 },
    { name: "Quick Sprint", focus: 15, break: 3 },
];

export default function TimerSettings({
    isOpen,
    onClose,
    themeColor,
    setThemeColor,
    soundEnabled,
    setSoundEnabled,
    visualMode,
    setVisualMode,
    timerStyle,
    setTimerStyle,
    timerFont,
    setTimerFont,
    autoStartFocus,
    setAutoStartFocus,
    autoStartBreak,
    setAutoStartBreak,
    targetDuration,
    setTargetDuration,
    applyPreset,
    timerMode,
    setTimerMode,
}: TimerSettingsProps) {
    // Helper to parse duration into hours, minutes, seconds
    const hours = Math.floor(targetDuration / 3600);
    const minutes = Math.floor((targetDuration % 3600) / 60);
    const seconds = targetDuration % 60;

    const updateDuration = (h: number, m: number, s: number) => {
        const total = Math.max(0, h * 3600 + m * 60 + s);
        setTargetDuration(total > 0 ? total : 60); // Minimum 1 minute
    };

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <View style={[styles.headerIndicator, { backgroundColor: THEMES.find(t => t.id === themeColor)?.color || Colors.dark.primary }]} />
                            <Text style={styles.headerTitle}>System Configuration</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={Colors.dark.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* Theme Selection */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Palette size={16} color={Colors.dark.textMuted} />
                                <Text style={styles.sectionTitle}>Interface Theme</Text>
                            </View>
                            <View style={styles.gridContainer}>
                                {THEMES.map((theme) => (
                                    <TouchableOpacity
                                        key={theme.id}
                                        onPress={() => setThemeColor(theme.id)}
                                        style={[
                                            styles.themeButton,
                                            themeColor === theme.id && styles.themeButtonActive
                                        ]}
                                    >
                                        <View style={[styles.colorDot, { backgroundColor: theme.color }]} />
                                        <Text style={styles.themeName}>{theme.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Visual Mode */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Layout size={16} color={Colors.dark.textMuted} />
                                <Text style={styles.sectionTitle}>Visual Mode</Text>
                            </View>
                            <View style={styles.segmentControl}>
                                {(["grid", "minimal", "cyber"] as VisualMode[]).map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => setVisualMode(m)}
                                        style={[
                                            styles.segmentButton,
                                            visualMode === m && styles.segmentButtonActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.segmentText,
                                            visualMode === m && styles.segmentTextActive
                                        ]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Timer Mode */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Clock size={16} color={Colors.dark.textMuted} />
                                <Text style={styles.sectionTitle}>Timer Mode</Text>
                            </View>
                            <View style={styles.segmentControl}>
                                {(["timer", "stopwatch"] as const).map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => setTimerMode(m)}
                                        style={[
                                            styles.segmentButton,
                                            timerMode === m && styles.segmentButtonActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.segmentText,
                                            timerMode === m && styles.segmentTextActive
                                        ]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Timer Style */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Type size={16} color={Colors.dark.textMuted} />
                                <Text style={styles.sectionTitle}>Timer Style</Text>
                            </View>
                            <View style={styles.gridContainer}>
                                {(["grid", "digital", "circular", "minimal"] as TimerStyle[]).map((style) => (
                                    <TouchableOpacity
                                        key={style}
                                        onPress={() => setTimerStyle(style)}
                                        style={[
                                            styles.styleButton,
                                            timerStyle === style && styles.styleButtonActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.styleButtonText,
                                            timerStyle === style && styles.styleButtonTextActive
                                        ]}>{style}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Automation */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Zap size={16} color={Colors.dark.textMuted} />
                                <Text style={styles.sectionTitle}>Automation</Text>
                            </View>

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <View style={[styles.iconBox, { backgroundColor: autoStartBreak ? 'rgba(34, 197, 94, 0.1)' : Colors.dark.surface }]}>
                                        <Repeat size={20} color={autoStartBreak ? Colors.dark.success : Colors.dark.textMuted} />
                                    </View>
                                    <View>
                                        <Text style={styles.settingLabel}>Auto-start Break</Text>
                                        <Text style={styles.settingDescription}>Start break when focus ends</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={autoStartBreak}
                                    onValueChange={setAutoStartBreak}
                                    trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.success }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <View style={[styles.iconBox, { backgroundColor: autoStartFocus ? 'rgba(99, 102, 241, 0.1)' : Colors.dark.surface }]}>
                                        <Repeat size={20} color={autoStartFocus ? Colors.dark.primary : Colors.dark.textMuted} />
                                    </View>
                                    <View>
                                        <Text style={styles.settingLabel}>Auto-start Focus</Text>
                                        <Text style={styles.settingDescription}>Start focus when break ends</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={autoStartFocus}
                                    onValueChange={setAutoStartFocus}
                                    trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.primary }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>

                        {/* Custom Duration */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Clock size={16} color={Colors.dark.textMuted} />
                                <Text style={styles.sectionTitle}>Custom Duration</Text>
                            </View>
                            <View style={styles.durationContainer}>
                                <View style={styles.timeColumn}>
                                    <Text style={styles.timeLabel}>Hours</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={hours.toString()}
                                        onChangeText={(text) => updateDuration(parseInt(text) || 0, minutes, seconds)}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <Text style={styles.timeSeparator}>:</Text>
                                <View style={styles.timeColumn}>
                                    <Text style={styles.timeLabel}>Minutes</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={minutes.toString()}
                                        onChangeText={(text) => updateDuration(hours, parseInt(text) || 0, seconds)}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <Text style={styles.timeSeparator}>:</Text>
                                <View style={styles.timeColumn}>
                                    <Text style={styles.timeLabel}>Seconds</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={seconds.toString()}
                                        onChangeText={(text) => updateDuration(hours, minutes, parseInt(text) || 0)}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                            <Text style={styles.durationSummary}>
                                Total: {hours > 0 ? `${hours}h ` : ""}
                                {minutes > 0 ? `${minutes}m ` : ""}
                                {seconds > 0 ? `${seconds}s` : ""}
                            </Text>
                        </View>

                        {/* Presets */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Clock size={16} color={Colors.dark.textMuted} />
                                <Text style={styles.sectionTitle}>Quick Presets</Text>
                            </View>
                            <View style={styles.presetsContainer}>
                                {PRESETS.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.name}
                                        onPress={() => {
                                            applyPreset(preset.focus);
                                            onClose();
                                        }}
                                        style={styles.presetButton}
                                    >
                                        <Text style={styles.presetName}>{preset.name}</Text>
                                        <View style={styles.presetBadge}>
                                            <Text style={styles.presetBadgeText}>{preset.focus}m Focus</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Sound Settings */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Volume2 size={16} color={Colors.dark.textMuted} />
                                <Text style={styles.sectionTitle}>Audio Feedback</Text>
                            </View>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <View style={[styles.iconBox, { backgroundColor: soundEnabled ? 'rgba(99, 102, 241, 0.1)' : Colors.dark.surface }]}>
                                        {soundEnabled ? (
                                            <Volume2 size={20} color={Colors.dark.primary} />
                                        ) : (
                                            <VolumeX size={20} color={Colors.dark.textMuted} />
                                        )}
                                    </View>
                                    <View>
                                        <Text style={styles.settingLabel}>Sound Effects</Text>
                                        <Text style={styles.settingDescription}>Timer ticks and completion alarms</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={soundEnabled}
                                    onValueChange={setSoundEnabled}
                                    trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.primary }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Colors.dark.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "85%",
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    headerIndicator: {
        width: 4,
        height: 24,
        borderRadius: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 48,
        gap: 32,
    },
    section: {
        gap: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.dark.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    themeButton: {
        flexDirection: "row",
        alignItems: "center",
        width: "48%", // approx half with gap
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        backgroundColor: "transparent",
        gap: 12,
    },
    themeButtonActive: {
        backgroundColor: Colors.dark.surfaceHighlight,
        borderColor: Colors.dark.border,
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    themeName: {
        fontSize: 14,
        color: Colors.dark.text,
    },
    segmentControl: {
        flexDirection: "row",
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 8,
    },
    segmentButtonActive: {
        backgroundColor: Colors.dark.surfaceHighlight,
    },
    segmentText: {
        fontSize: 13,
        color: Colors.dark.textMuted,
        fontWeight: "500",
        textTransform: "capitalize",
    },
    segmentTextActive: {
        color: Colors.dark.text,
        fontWeight: "600",
    },
    styleButton: {
        width: "48%",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        backgroundColor: Colors.dark.surface,
        alignItems: "center",
    },
    styleButtonActive: {
        backgroundColor: Colors.dark.surfaceHighlight,
        borderColor: Colors.dark.border,
    },
    styleButtonText: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        textTransform: "capitalize",
        fontWeight: "500",
    },
    styleButtonTextActive: {
        color: Colors.dark.text,
        fontWeight: "600",
    },
    settingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 8,
    },
    settingInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: "500",
        color: Colors.dark.text,
    },
    settingDescription: {
        fontSize: 12,
        color: Colors.dark.textMuted,
        marginTop: 2,
    },
    durationContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        gap: 12,
    },
    timeColumn: {
        alignItems: "center",
    },
    timeLabel: {
        fontSize: 10,
        color: Colors.dark.textMuted,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    timeInput: {
        width: 60,
        height: 60,
        backgroundColor: Colors.dark.background,
        borderRadius: 12,
        color: Colors.dark.text,
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    timeSeparator: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.dark.textMuted,
        marginTop: 16, // align with input
    },
    durationSummary: {
        textAlign: "center",
        fontSize: 13,
        color: Colors.dark.textMuted,
        marginTop: 8,
    },
    presetsContainer: {
        gap: 12,
    },
    presetButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    presetName: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.dark.text,
    },
    presetBadge: {
        backgroundColor: Colors.dark.surfaceHighlight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    presetBadgeText: {
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
});
