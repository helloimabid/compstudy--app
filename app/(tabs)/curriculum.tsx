import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { router } from "expo-router";
import { Book, ChevronRight, GraduationCap } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

interface Subject {
    $id: string;
    name: string;
    userId: string;
    topics: string[];
}

export default function CurriculumScreen() {
    const { user, loading: authLoading } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCurriculum = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.SUBJECTS,
                [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
            );
            setSubjects(response.documents as unknown as Subject[]);
        } catch (error) {
            console.error("Failed to fetch curriculum:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchCurriculum();
        }
    }, [user, authLoading]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCurriculum();
    };

    if (authLoading || loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Your</Text>
                        <Text style={styles.titleHighlight}>Curriculum</Text>
                    </View>
                    <View style={styles.loginPrompt}>
                        <GraduationCap size={48} color={Colors.dark.textMuted} />
                        <Text style={styles.loginPromptTitle}>Login Required</Text>
                        <Text style={styles.loginPromptText}>
                            Sign in to manage your subjects and topics.
                        </Text>
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => router.push("/login")}
                        >
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.dark.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Your</Text>
                    <Text style={styles.titleHighlight}>Curriculum</Text>
                    <Text style={styles.description}>
                        Manage your subjects and track progress.
                    </Text>
                </View>

                {/* Subjects List */}
                {subjects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Book size={48} color={Colors.dark.textMuted} />
                        <Text style={styles.emptyStateTitle}>No subjects yet</Text>
                        <Text style={styles.emptyStateText}>
                            Add subjects from the website to track your study progress.
                        </Text>
                    </View>
                ) : (
                    subjects.map((subject) => (
                        <View key={subject.$id} style={styles.subjectCard}>
                            <View style={styles.subjectHeader}>
                                <View style={styles.subjectIcon}>
                                    <Book size={20} color={Colors.dark.primary} />
                                </View>
                                <View style={styles.subjectInfo}>
                                    <Text style={styles.subjectName}>{subject.name}</Text>
                                    <Text style={styles.subjectTopics}>
                                        {subject.topics?.length || 0} topics
                                    </Text>
                                </View>
                                <ChevronRight size={20} color={Colors.dark.textMuted} />
                            </View>

                            {subject.topics && subject.topics.length > 0 && (
                                <View style={styles.topicsList}>
                                    {subject.topics.slice(0, 3).map((topic, index) => (
                                        <View key={index} style={styles.topicItem}>
                                            <View style={styles.topicDot} />
                                            <Text style={styles.topicText}>{topic}</Text>
                                        </View>
                                    ))}
                                    {subject.topics.length > 3 && (
                                        <Text style={styles.moreTopics}>
                                            +{subject.topics.length - 3} more
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    ))
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>💡 Pro Tip</Text>
                    <Text style={styles.infoText}>
                        Use the website to add, edit, or remove subjects. Changes sync automatically to the app.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "600",
        color: Colors.dark.text,
    },
    titleHighlight: {
        fontSize: 32,
        fontWeight: "600",
        color: Colors.dark.primary,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: Colors.dark.textMuted,
    },
    subjectCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    subjectHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    subjectIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 2,
    },
    subjectTopics: {
        fontSize: 13,
        color: Colors.dark.textMuted,
    },
    topicsList: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    topicItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    topicDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.primary,
        marginRight: 10,
    },
    topicText: {
        fontSize: 14,
        color: Colors.dark.text,
    },
    moreTopics: {
        fontSize: 13,
        color: Colors.dark.textMuted,
        marginTop: 4,
    },
    emptyState: {
        alignItems: "center",
        padding: 48,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        textAlign: "center",
    },
    loginPrompt: {
        alignItems: "center",
        padding: 48,
    },
    loginPromptTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
        marginTop: 16,
        marginBottom: 8,
    },
    loginPromptText: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        textAlign: "center",
        marginBottom: 24,
    },
    loginButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    loginButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    infoCard: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "rgba(99, 102, 241, 0.2)",
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.dark.primary,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        lineHeight: 20,
    },
});
