import React, { useEffect, useMemo, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

// Data from the provided snippet
const DIGIT_TARGETS = [
  { path1: "M640 400H150V160h490v240z", path2: "M640 640H150V400h490v240z" },
  { path2: "M320 640H0V160h320v480z", path1: "M800 640H480V0h320v640z" },
  { path1: "M640 320H0V160h640v160z", path2: "M800 640H160V480h640v160z" },
  { path1: "M640 320H0V160h640v160z", path2: "M640 640H0V480h640v160z" },
  { path1: "M640 320H160V0h480v320z", path2: "M640 800H0V480h640v320z" },
  { path1: "M800 320H160V160h640v160z", path2: "M640 640H0V480h640v160z" },
  { path1: "M800 320H160V160h640v160z", path2: "M640 640H160V480h480v160z" },
  { path1: "M640 480H0V160h640v320z", path2: "M640 800H0V480h640v320z" },
  { path1: "M640 320H160V160h480v160z", path2: "M640 640H160V480h480v160z" },
  { path1: "M640 320H160V160h480v160z", path2: "M640 640H0V480h640v160z" },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Color themes based on the TimeClock component structure
// The snippet uses: bg (container), accent (bars+stroke), gradient (tile+overlay)
const getThemeColors = (themeColor: string, isBreak: boolean) => {
  const colorMap: Record<
    string,
    { bg: string; accent: string; gradient: string }
  > = {
    // Using the default from snippet as the 'rose'/'default' look
    rose: { bg: "#FC5130", accent: "#FC5130", gradient: "#FFFAFF" },
    indigo: { bg: "#4f46e5", accent: "#4f46e5", gradient: "#eef2ff" },
    cyan: { bg: "#06b6d4", accent: "#06b6d4", gradient: "#ecfeff" },
    green: { bg: "#22c55e", accent: "#22c55e", gradient: "#f0fdf4" },
    amber: { bg: "#f59e0b", accent: "#f59e0b", gradient: "#fffbeb" },
    violet: { bg: "#8b5cf6", accent: "#8b5cf6", gradient: "#f5f3ff" },
  };

  if (isBreak) {
    return { bg: "#22c55e", accent: "#22c55e", gradient: "#f0fdf4" };
  }

  return colorMap[themeColor] || colorMap.rose;
};

// Single Digit Component
const DigitTile = ({
  digit,
  accent,
  gradient,
  size,
  delayIndex = 0,
}: {
  digit: number;
  accent: string;
  gradient: string;
  size: number;
  delayIndex?: number;
}) => {
  const opacity = useSharedValue(1);
  const prevDigit = useRef(digit);
  const currentPath = DIGIT_TARGETS[digit] || DIGIT_TARGETS[0];

  useEffect(() => {
    if (prevDigit.current !== digit) {
      // Fallback animation: quick fade swap
      opacity.value = withSequence(
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
      prevDigit.current = digit;
    }
  }, [digit]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ width: "100%", height: "100%" }, animatedStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 800 800">
          <Defs>
            <LinearGradient
              id={`clock-grad-${delayIndex}`}
              x1="400"
              y1="0"
              x2="400"
              y2="800"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={gradient} stopOpacity="1" />
              <Stop offset="0.5" stopColor="#fff" stopOpacity="0" />
              <Stop offset="1" stopColor={gradient} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background tile */}
          <Rect width="800" height="800" fill={gradient} />

          {/* Soft vertical gradient overlay */}
          <Rect
            width="800"
            height="800"
            fill={`url(#clock-grad-${delayIndex})`}
          />

          {/* Two animated bars */}
          <Path d={currentPath.path1} fill={accent} />
          <Path d={currentPath.path2} fill={accent} />

          {/* Stroke frame */}
          <Rect
            width="800"
            height="800"
            fill="transparent"
            stroke={accent}
            strokeWidth="42"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

// Blinking Colon Divider
const ColonDivider = ({ color, size }: { color: string; size: number }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600, easing: Easing.linear }),
        withTiming(1, { duration: 600, easing: Easing.linear }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Match the SVG path from the snippet
  const dividerPath =
    "M555.56,800H244.44v-311.11h311.11v311.11ZM555.56,311.11H244.44S244.44,0,244.44,0h311.11v311.11Z";

  return (
    <View style={{ width: size * 0.75, height: size }}>
      <Animated.View style={[{ width: "100%", height: "100%" }, animatedStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 800 800">
          <Defs>
            <LinearGradient
              id="clock-grad-divider"
              x1="400"
              y1="0"
              x2="400"
              y2="800"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={color} stopOpacity="1" />
              <Stop offset="0.5" stopColor="#fff" stopOpacity="0" />
              <Stop offset="1" stopColor={color} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Path d={dividerPath} fill={color} opacity={0.6} />
        </Svg>
      </Animated.View>
    </View>
  );
};

// Main Timer Display Component
export const DigitalTimerDisplay = ({
  time,
  themeColor = "rose",
  isBreak = false,
  size = "md",
}: {
  time: string;
  themeColor?: string;
  isBreak?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const colors = getThemeColors(themeColor, isBreak);

  // Calculate digit size based on screen and size prop
  // Adjusted for better fit on mobile screens (4 digits + divider + gaps)
  const digitSize = useMemo(() => {
    const baseSize = Math.min(SCREEN_WIDTH * 0.16, 70);
    switch (size) {
      case "sm":
        return baseSize * 0.75;
      case "lg":
        return baseSize * 1.1; // Slightly larger but ensuring fit
      default:
        return baseSize;
    }
  }, [size]);

  // Parse time string "MM:SS" or "HH:MM:SS"
  const digits = useMemo(() => {
    const parts = time.replace(/:/g, "").split("");
    return parts.map((d) => parseInt(d, 10) || 0);
  }, [time]);

  const [d1, d2, d3, d4] =
    digits.length >= 4 ? digits.slice(-4) : [0, ...digits.slice(-3)];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.clockRow}>
        <DigitTile
          digit={d1}
          accent={colors.accent}
          gradient={colors.gradient}
          size={digitSize}
          delayIndex={0}
        />
        <DigitTile
          digit={d2}
          accent={colors.accent}
          gradient={colors.gradient}
          size={digitSize}
          delayIndex={1}
        />
        <ColonDivider color={colors.gradient} size={digitSize} />
        <DigitTile
          digit={d3}
          accent={colors.accent}
          gradient={colors.gradient}
          size={digitSize}
          delayIndex={2}
        />
        <DigitTile
          digit={d4}
          accent={colors.accent}
          gradient={colors.gradient}
          size={digitSize}
          delayIndex={3}
        />
      </View>
    </View>
  );
};

// Compatibility exports
export const CircularTimerDisplay = DigitalTimerDisplay;
export const MinimalTimerDisplay = DigitalTimerDisplay;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 32,
    borderRadius: 0,
  },
  clockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5, // Reduced gap from 12 to 5
  },
});
