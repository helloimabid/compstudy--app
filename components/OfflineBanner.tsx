import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface OfflineBannerProps {
  showOnTop?: boolean;
}

export default function OfflineBanner({
  showOnTop = true,
}: OfflineBannerProps) {
  const { isOffline } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      // Slide in and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        showOnTop ? styles.top : styles.bottom,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <WifiOff size={18} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>You're Offline</Text>
          <Text style={styles.subtitle}>
            Some features may be unavailable. Check your connection.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 9999,
    elevation: 10,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
});
