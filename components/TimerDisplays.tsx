import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

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

  const textColor = isBreak ? "#22c55e" : colorMap[themeColor] || "#ffffff";

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return 48;
      case "md":
        return 80;
      case "lg":
        return 100;
      default:
        return 80;
    }
  };

  return (
    <Text
      style={[
        styles.digitalText,
        {
          color: textColor,
          fontSize: getFontSize(),
          textShadowColor:
            themeColor === "indigo"
              ? "rgba(99, 102, 241, 0.6)"
              : themeColor === "green"
                ? "rgba(34, 197, 94, 0.6)"
                : textColor + "80", // Add glow based on theme
          textShadowRadius: 15,
        },
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
      case "sm":
        return 200;
      case "md":
        return 300;
      case "lg":
        return 350;
      default:
        return 300;
    }
  };

  const s = getSize();
  const strokeWidth = 12;
  const center = s / 2;
  const radius = (s - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.circleContainer, { width: s, height: s }]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            justifyContent: "center",
            alignItems: "center",
            transform: [{ scale: 0.9 }],
            opacity: 0.1,
          },
        ]}
      >
        <View
          style={{
            width: s,
            height: s,
            borderRadius: s / 2,
            backgroundColor: strokeColor,
            opacity: 0.2,
            shadowColor: strokeColor,
            shadowOpacity: 0.8,
            shadowRadius: 30,
            elevation: 10,
          }}
        />
      </View>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
          />
        </G>
      </Svg>

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

  const textColor = isBreak ? "#22c55e" : colorMap[themeColor] || "#ffffff";

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return 32;
      case "md":
        return 64;
      case "lg":
        return 96;
      default:
        return 64;
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
