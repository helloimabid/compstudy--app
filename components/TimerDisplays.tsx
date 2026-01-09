import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type TimerFont =
    | "default"
    | "orbitron"
    | "quantico"
    | "audiowide"
    | "electrolize"
    | "zendots";

// Font map - in React Native we would need to load these fonts
// For now we map to system fonts or variants
const fontStyleMap: Record<TimerFont, any> = {
    default: { fontFamily: "System", fontVariant: ["tabular-nums"] },
    orbitron: { fontFamily: "System", fontVariant: ["tabular-nums"] },
    quantico: { fontFamily: "System", fontVariant: ["tabular-nums"] },
    audiowide: { fontFamily: "System", fontVariant: ["tabular-nums"] },
    electrolize: { fontFamily: "System", fontVariant: ["tabular-nums"] },
    zendots: { fontFamily: "System", fontVariant: ["tabular-nums"] },
};

// --- Digital Display ---
export const DigitalTimerDisplay = ({
    time,
    themeColor = "indigo",
    isBreak = false,
    size = "md",
    timerFont = "default",
}: {
    time: string;
    themeColor?: string;
    isBreak?: boolean;
    size?: "sm" | "md" | "lg";
    timerFont?: TimerFont;
}) => {
    const colorMap: Record<string, string> = {
        indigo: "#6366f1",
        cyan: "#06b6d4",
        green: "#22c55e",
        amber: "#f59e0b",
        rose: "#f43f5e",
        violet: "#8b5cf6",
    };

    const textColor = isBreak
        ? "#22c55e"
        : colorMap[themeColor] || "#ffffff";

    const getFontSize = () => {
        switch (size) {
            case "sm": return 48;
            case "md": return 80;
            case "lg": return 100;
            default: return 80;
        }
    };

    return (
        <Text
            style={[
                styles.digitalText,
                { color: textColor, fontSize: getFontSize() },
                fontStyleMap[timerFont],
            ]}
        >
            {time}
        </Text>
    );
};

// --- Circular Display ---
export const CircularTimerDisplay = ({
    time,
    progress,
    themeColor = "indigo",
    isBreak = false,
    size = "md",
    timerFont = "default",
}: {
    time: string;
    progress: number; // 0 to 100
    themeColor?: string;
    isBreak?: boolean;
    size?: "sm" | "md" | "lg";
    timerFont?: TimerFont;
}) => {
    // Basic circular implementation using a Border Ring (since we don't have SVG installed)
    const colorMap: Record<string, string> = {
        indigo: "#6366f1",
        cyan: "#06b6d4",
        green: "#22c55e",
        amber: "#f59e0b",
        rose: "#f43f5e",
        violet: "#8b5cf6",
    };

    const strokeColor = isBreak ? "#22c55e" : colorMap[themeColor] || "#6366f1";

    const getSize = () => {
        switch (size) {
            case "sm": return 200;
            case "md": return 300;
            case "lg": return 350;
            default: return 300;
        }
    };

    const s = getSize();
    const half = s / 2;

    return (
        <View style={[styles.circleContainer, { width: s, height: s, borderRadius: half }]}>
            {/* Background Ring */}
            <View style={[
                styles.ring,
                {
                    width: s,
                    height: s,
                    borderRadius: half,
                    borderColor: 'rgba(255,255,255,0.1)',
                }
            ]} />

            {/* Active Ring - Simplified as a full ring for now as React Native without SVG cannot do partial stroke easily */}
            <View style={[
                styles.ring,
                {
                    width: s,
                    height: s,
                    borderRadius: half,
                    borderColor: strokeColor,
                    opacity: progress > 0 ? 1 : 0.3 // Just dim it based on progress
                }
            ]} />

            <View style={styles.absoluteCenter}>
                <DigitalTimerDisplay
                    time={time}
                    themeColor={themeColor}
                    isBreak={isBreak}
                    size={size === "lg" ? "md" : "sm"}
                    timerFont={timerFont}
                />
            </View>
        </View>
    );
};

// --- Minimal Display ---
export const MinimalTimerDisplay = ({
    time,
    themeColor = "indigo",
    isBreak = false,
    size = "md",
    timerFont = "default",
}: {
    time: string;
    themeColor?: string;
    isBreak?: boolean;
    size?: "sm" | "md" | "lg";
    timerFont?: TimerFont;
}) => {
    const colorMap: Record<string, string> = {
        indigo: "#6366f1",
        cyan: "#06b6d4",
        green: "#22c55e",
        amber: "#f59e0b",
        rose: "#f43f5e",
        violet: "#8b5cf6",
    };

    const textColor = isBreak
        ? "#22c55e"
        : colorMap[themeColor] || "#ffffff";

    const getFontSize = () => {
        switch (size) {
            case "sm": return 32;
            case "md": return 64;
            case "lg": return 96;
            default: return 64;
        }
    };

    return (
        <View style={styles.minimalContainer}>
            <Text
                style={[
                    styles.minimalText,
                    { color: textColor, fontSize: getFontSize(), opacity: 0.8 },
                    fontStyleMap[timerFont],
                ]}
            >
                {time}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    digitalText: {
        fontWeight: "bold",
        textAlign: "center",
    },
    circleContainer: {
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    ring: {
        position: "absolute",
        borderWidth: 12,
    },
    absoluteCenter: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    minimalContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    minimalText: {
        fontWeight: "300",
        textAlign: "center",
        letterSpacing: 2,
    },
});
