import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { COLLECTIONS, databases, DB_ID, ID } from "@/lib/appwrite";
import { router } from "expo-router";
import {
    ArrowLeft,
    CheckCircle,
    ChevronRight,
    Circle,
    Edit2,
    Globe,
    GraduationCap,
    Plus,
    Trash2
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

interface Curriculum {
    $id: string;
    name: string;
    userId: string;
}

interface Subject {
    $id: string;
    name: string;
    curriculumId: string;
    userId: string;
}

interface Topic {
    $id: string;
    name: string;
    subjectId: string;
    userId: string;
    completed: boolean;
}

type ViewMode = "curriculums" | "subjects" | "topics";

export default function CurriculumScreen() {
    const { user, loading: authLoading } = useAuth();

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>("curriculums");
    const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    // Data state
    const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState<"curriculum" | "subject" | "topic">("curriculum");
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchCurriculums = useCallback(async () => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.CURRICULUM,
                [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
            );
            setCurriculums(response.documents as unknown as Curriculum[]);
        } catch (error) {
            console.error("Failed to fetch curriculums:", error);
        }
    }, [user]);

    const fetchSubjects = useCallback(async (curriculumId: string) => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.SUBJECTS,
                [
                    Query.equal("curriculumId", curriculumId),
                    Query.equal("userId", user.$id),
                    Query.orderDesc("$createdAt")
                ]
            );
            setSubjects(response.documents as unknown as Subject[]);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        }
    }, [user]);

    const fetchTopics = useCallback(async (subjectId: string) => {
        if (!user) return;
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.TOPICS,
                [
                    Query.equal("subjectId", subjectId),
                    Query.equal("userId", user.$id),
                    Query.orderDesc("$createdAt")
                ]
            );
            setTopics(response.documents as unknown as Topic[]);
        } catch (error) {
            console.error("Failed to fetch topics:", error);
        }
    }, [user]);

    const loadData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            if (viewMode === "curriculums") {
                await fetchCurriculums();
            } else if (viewMode === "subjects" && selectedCurriculum) {
                await fetchSubjects(selectedCurriculum.$id);
            } else if (viewMode === "topics" && selectedSubject) {
                await fetchTopics(selectedSubject.$id);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, viewMode, selectedCurriculum, selectedSubject, fetchCurriculums, fetchSubjects, fetchTopics]);

    useEffect(() => {
        if (!authLoading) {
            loadData();
        }
    }, [authLoading, loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleGoBack = () => {
        if (viewMode === "topics") {
            setViewMode("subjects");
            setSelectedSubject(null);
        } else if (viewMode === "subjects") {
            setViewMode("curriculums");
            setSelectedCurriculum(null);
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setInputValue("");
        if (viewMode === "curriculums") setModalType("curriculum");
        else if (viewMode === "subjects") setModalType("subject");
        else setModalType("topic");
        setIsModalVisible(true);
    };

    const openEditModal = (item: any) => {
        setEditingItem(item);
        setInputValue(item.name);
        if (viewMode === "curriculums") setModalType("curriculum");
        else if (viewMode === "subjects") setModalType("subject");
        else setModalType("topic");
        setIsModalVisible(true);
    };

    const handleSave = async () => {
        if (!user || !inputValue.trim()) return;
        setSaving(true);
        try {
            const collectionId =
                modalType === "curriculum" ? COLLECTIONS.CURRICULUM :
                    modalType === "subject" ? COLLECTIONS.SUBJECTS :
                        COLLECTIONS.TOPICS;

            const data: any = {
                name: inputValue.trim(),
                userId: user.$id,
            };

            if (modalType === "subject" && selectedCurriculum) {
                data.curriculumId = selectedCurriculum.$id;
            } else if (modalType === "topic" && selectedSubject) {
                data.subjectId = selectedSubject.$id;
                if (!editingItem) data.completed = false;
            }

            if (editingItem) {
                await databases.updateDocument(DB_ID, collectionId, editingItem.$id, data);
            } else {
                await databases.createDocument(DB_ID, collectionId, ID.unique(), data);
            }

            setIsModalVisible(false);
            loadData();
        } catch (error) {
            console.error("Save failed:", error);
            Alert.alert("Error", "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (item: any) => {
        Alert.alert(
            "Delete Item",
            `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const collectionId =
                                viewMode === "curriculums" ? COLLECTIONS.CURRICULUM :
                                    viewMode === "subjects" ? COLLECTIONS.SUBJECTS :
                                        COLLECTIONS.TOPICS;

                            await databases.deleteDocument(DB_ID, collectionId, item.$id);
                            loadData();
                        } catch (error) {
                            console.error("Delete failed:", error);
                            Alert.alert("Error", "Failed to delete item.");
                        }
                    }
                }
            ]
        );
    };

    const toggleTopic = async (topic: Topic) => {
        try {
            await databases.updateDocument(DB_ID, COLLECTIONS.TOPICS, topic.$id, {
                completed: !topic.completed
            });
            // Update local state for immediate feedback
            setTopics(prev => prev.map(t => t.$id === topic.$id ? { ...t, completed: !t.completed } : t));
        } catch (error) {
            console.error("Toggle failed:", error);
        }
    };

    if (authLoading || (loading && !refreshing)) {
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
                <View style={styles.loginPrompt}>
                    <GraduationCap size={64} color={Colors.dark.textMuted} />
                    <Text style={styles.loginPromptTitle}>Join CompStudy</Text>
                    <Text style={styles.loginPromptText}>
                        Sign in to track your curriculums, subjects, and study progress.
                    </Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push("/login")}
                    >
                        <Text style={styles.loginButtonText}>Login to Continue</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const renderHeader = () => {
        let title = "My Curriculum";
        let subtitle = "Your primary study plans";

        if (viewMode === "subjects") {
            title = selectedCurriculum?.name || "Subjects";
            subtitle = "Subjects in this curriculum";
        } else if (viewMode === "topics") {
            title = selectedSubject?.name || "Topics";
            subtitle = "Manage your study focus";
        }

        return (
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {viewMode !== "curriculums" && (
                        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                            <ArrowLeft size={24} color={Colors.dark.text} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => router.push("/curriculum/public")}
                            style={styles.discoveryButton}
                        >
                            <Globe size={22} color={Colors.dark.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
                            <Plus size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderContent = () => {
        const items = viewMode === "curriculums" ? curriculums :
            viewMode === "subjects" ? subjects :
                topics;

        if (items.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <GraduationCap size={48} color={Colors.dark.textMuted} />
                    </View>
                    <Text style={styles.emptyStateTitle}>Nothing here yet</Text>
                    <Text style={styles.emptyStateText}>
                        Tap the + button to add your first {viewMode.slice(0, -1)}.
                    </Text>
                </View>
            );
        }

        return items.map((item: any) => (
            <TouchableOpacity
                key={item.$id}
                style={[styles.itemCard, viewMode === "topics" && item.completed && styles.completedCard]}
                onPress={() => {
                    if (viewMode === "curriculums") {
                        setSelectedCurriculum(item);
                        setViewMode("subjects");
                    } else if (viewMode === "subjects") {
                        setSelectedSubject(item);
                        setViewMode("topics");
                    }
                }}
                activeOpacity={0.7}
            >
                <View style={styles.itemMain}>
                    {viewMode === "topics" && (
                        <TouchableOpacity onPress={() => toggleTopic(item)} style={styles.checkIcon}>
                            {item.completed ? (
                                <CheckCircle size={22} color={Colors.dark.primary} />
                            ) : (
                                <Circle size={22} color={Colors.dark.textMuted} />
                            )}
                        </TouchableOpacity>
                    )}
                    <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, viewMode === "topics" && item.completed && styles.completedText]}>
                            {item.name}
                        </Text>
                        {viewMode !== "topics" && (
                            <Text style={styles.itemSubtitle}>
                                {viewMode === "curriculums" ? "Plan your journey" : "Manage materials"}
                            </Text>
                        )}
                    </View>
                    <View style={styles.itemActions}>
                        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                            <Edit2 size={18} color={Colors.dark.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                        {viewMode !== "topics" && <ChevronRight size={20} color={Colors.dark.textMuted} />}
                    </View>
                </View>
            </TouchableOpacity>
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {renderHeader()}

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
                {renderContent()}
            </ScrollView>

            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingItem ? "Edit" : "Add"} {modalType}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={inputValue}
                            onChangeText={setInputValue}
                            placeholder={`Enter ${modalType} name`}
                            placeholderTextColor={Colors.dark.textMuted}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsModalVisible(false)}
                                disabled={saving}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                                disabled={saving || !inputValue.trim()}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        padding: 16,
        paddingBottom: 40,
    },
    // Header
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.dark.text,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.dark.textMuted,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    discoveryButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(99, 102, 241, 0.2)",
    },
    addButton: {
        backgroundColor: Colors.dark.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    // Item Cards
    itemCard: {
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        overflow: "hidden",
    },
    completedCard: {
        opacity: 0.6,
        backgroundColor: "transparent",
    },
    itemMain: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    checkIcon: {
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.dark.text,
    },
    completedText: {
        textDecorationLine: "line-through",
        color: Colors.dark.textMuted,
    },
    itemSubtitle: {
        fontSize: 12,
        color: Colors.dark.textMuted,
        marginTop: 2,
    },
    itemActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    // Empty State
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 80,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.03)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.dark.text,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: Colors.dark.textMuted,
        textAlign: "center",
        paddingHorizontal: 40,
    },
    // Login Prompt
    loginPrompt: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    loginPromptTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.dark.text,
        marginTop: 24,
        marginBottom: 12,
    },
    loginPromptText: {
        fontSize: 16,
        color: Colors.dark.textMuted,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    loginButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        width: "100%",
        alignItems: "center",
    },
    loginButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        padding: 24,
    },
    modalContent: {
        backgroundColor: "#1a1a1a",
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.dark.text,
        marginBottom: 20,
        textTransform: "capitalize",
    },
    modalInput: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: 16,
        color: Colors.dark.text,
        fontSize: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    cancelButtonText: {
        color: Colors.dark.text,
        fontWeight: "600",
    },
    saveButton: {
        backgroundColor: Colors.dark.primary,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
});
