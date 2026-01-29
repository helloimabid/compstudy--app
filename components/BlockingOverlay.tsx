import { Colors } from "@/constants/Colors";
import { AlertTriangle, ArrowLeft, Shield, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BlockingOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  themeColor: string;
  violationCount: number;
  message?: string;
}

const { width, height } = Dimensions.get("window");

export default function BlockingOverlay({
  visible,
  onDismiss,
  themeColor,
  violationCount,
  message = "Stay focused! Return to your study session.",
}: BlockingOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale }],
            borderColor: themeColor + "40",
          },
        ]}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <X size={20} color={Colors.dark.textMuted} />
        </TouchableOpacity>

        {/* Warning Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: "#ef4444" + "20",
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <AlertTriangle size={48} color="#ef4444" />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Focus Mode Active!</Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Violation Counter */}
        <View style={styles.violationContainer}>
          <Shield size={16} color={themeColor} />
          <Text style={[styles.violationText, { color: themeColor }]}>
            {violationCount} distraction{violationCount !== 1 ? "s" : ""}{" "}
            blocked today
          </Text>
        </View>

        {/* Return Button */}
        <TouchableOpacity
          style={[styles.returnButton, { backgroundColor: themeColor }]}
          onPress={handleDismiss}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#fff" />
          <Text style={styles.returnButtonText}>Return to Focus</Text>
        </TouchableOpacity>

        {/* Timer hint */}
        <Text style={styles.hint}>
          This overlay will auto-dismiss in 5 seconds
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    width: width * 0.85,
    backgroundColor: "#0a0a0a",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: "#a1a1aa",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  violationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    marginBottom: 24,
  },
  violationText: {
    fontSize: 13,
    fontWeight: "500",
  },
  returnButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
  },
  returnButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  hint: {
    fontSize: 12,
    color: "#52525b",
  },
});
