import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, loginWithGoogle, register, loading, user } = useAuth();

    // Animation/Background values
    const blob1Scale = useSharedValue(1);
    const blob2Scale = useSharedValue(1);

    useEffect(() => {
        // Start background animations
        blob1Scale.value = withRepeat(
            withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        blob2Scale.value = withRepeat(
            withTiming(1.3, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const blob1Style = useAnimatedStyle(() => ({
        transform: [{ scale: blob1Scale.value }],
    }));

    const blob2Style = useAnimatedStyle(() => ({
        transform: [{ scale: blob2Scale.value }],
    }));

    useEffect(() => {
        if (!loading && user) {
            router.replace("/(tabs)");
        }
    }, [user, loading]);

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    const handleSubmit = async () => {
        setError("");
        setIsSubmitting(true);

        try {
            if (isRegistering) {
                if (!username) {
                    setError("Username is required");
                    setIsSubmitting(false);
                    return;
                }
                await register(email, password, username);
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            console.error("Google Auth error:", err);
            setError(err.message || "Google login failed");
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError("");
    };

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Background Effects */}
        <View style={styles.backgroundContainer}>
          <Animated.View style={[styles.blob1, blob1Style]} />
          <Animated.View style={[styles.blob2, blob2Style]} />
        </View>

        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Glassmorphic Card */}
              <View style={styles.glassCard}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>
                    {isRegistering ? "Create Account" : "Welcome Back"}
                  </Text>
                  <Text style={styles.subtitle}>
                    {isRegistering
                      ? "Join the competitive study community."
                      : "Enter your credentials to continue."}
                  </Text>
                </View>

                {/* Error */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Form */}
                <View style={styles.form}>
                  {isRegistering && (
                    <View style={styles.inputContainer}>
                      <User
                        size={18}
                        color={Colors.dark.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                      />
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <Mail
                      size={18}
                      color={Colors.dark.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Lock
                      size={18}
                      color={Colors.dark.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Password"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={Colors.dark.textMuted} />
                      ) : (
                        <Eye size={18} color={Colors.dark.textMuted} />
                      )}
                    </Pressable>
                  </View>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={Colors.dark.gradients.primary as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.submitButton,
                        isSubmitting && styles.submitButtonDisabled,
                      ]}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {isRegistering ? "Create Account" : "Sign In"}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Google OAuth Button */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
                  disabled={isSubmitting}
                >
                  <Image
                    source={{
                      uri: "https://img.icons8.com/fluency/48/google-logo.png",
                    }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>
                    Sign in with Google
                  </Text>
                </TouchableOpacity>

                {/* Toggle */}
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleText}>
                    {isRegistering
                      ? "Already have an account?"
                      : "Don't have an account?"}
                  </Text>
                  <TouchableOpacity onPress={toggleMode}>
                    <Text style={styles.toggleLink}>
                      {isRegistering ? "Sign In" : "Create Account"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    blob1: {
        position: "absolute",
        top: -100,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: "rgba(99, 102, 241, 0.15)", // indigo-500/15
    },
    blob2: {
        position: "absolute",
        bottom: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: "rgba(147, 51, 234, 0.15)", // purple-600/15
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },
    glassCard: {
        backgroundColor: "rgba(10, 10, 10, 0.7)",
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        marginBottom: 32,
        alignItems: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.dark.textMuted,
        textAlign: "center",
    },
    errorContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.2)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: "#ef4444",
        fontSize: 14,
        textAlign: "center",
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        color: "#fff",
        fontSize: 16,
    },
    eyeButton: {
        padding: 8,
    },
    submitButton: {
        borderRadius: 12,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    dividerText: {
        color: Colors.dark.textMuted,
        fontSize: 12,
        marginHorizontal: 12,
    },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        height: 52,
        gap: 12,
    },
    googleIcon: {
        width: 20,
        height: 20,
    },
    googleButtonText: {
        color: "#1f2937",
        fontSize: 15,
        fontWeight: "600",
    },
    toggleContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 32,
        gap: 6,
    },
    toggleText: {
        color: Colors.dark.textMuted,
        fontSize: 14,
    },
    toggleLink: {
        color: Colors.dark.primary,
        fontSize: 14,
        fontWeight: "600",
    },
});
