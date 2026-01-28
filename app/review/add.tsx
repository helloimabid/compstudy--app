/**
 * Add Topics to Spaced Repetition Screen
 * Browse curriculum and select topics to add to the review schedule
 */

import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { useSpacedRepetition } from "@/context/SpacedRepetitionContext";
import { COLLECTIONS, databases, DB_ID } from "@/lib/appwrite";
import { router } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle,
  ChevronRight,
  Circle,
  GraduationCap,
  Search,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// ============================================================================
// TYPES
// ============================================================================

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

interface SelectedTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  curriculumId: string;
  curriculumName: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AddTopicsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { addTopic, items, refreshAll } = useSpacedRepetition();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("curriculums");
  const [selectedCurriculum, setSelectedCurriculum] =
    useState<Curriculum | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Data state
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsInSR, setTopicsInSR] = useState<Set<string>>(new Set());

  // Selection state
  const [selectedTopics, setSelectedTopics] = useState<SelectedTopic[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchCurriculums = useCallback(async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.CURRICULUM,
        [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")],
      );
      setCurriculums(response.documents as unknown as Curriculum[]);
    } catch (error) {
      console.error("Failed to fetch curriculums:", error);
    }
  }, [user]);

  const fetchSubjects = useCallback(
    async (curriculumId: string) => {
      if (!user) return;
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.SUBJECTS,
          [
            Query.equal("curriculumId", curriculumId),
            Query.equal("userId", user.$id),
            Query.orderDesc("$createdAt"),
          ],
        );
        setSubjects(response.documents as unknown as Subject[]);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      }
    },
    [user],
  );

  const fetchTopics = useCallback(
    async (subjectId: string) => {
      if (!user) return;
      try {
        const response = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.TOPICS,
          [
            Query.equal("subjectId", subjectId),
            Query.equal("userId", user.$id),
            Query.orderDesc("$createdAt"),
          ],
        );
        setTopics(response.documents as unknown as Topic[]);

        // Check which topics are already in SR
        const existingIds = new Set(items.map((item) => item.topicId));
        setTopicsInSR(existingIds);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      }
    },
    [user, items],
  );

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
    }
  }, [
    user,
    viewMode,
    selectedCurriculum,
    selectedSubject,
    fetchCurriculums,
    fetchSubjects,
    fetchTopics,
  ]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const handleGoBack = () => {
    if (viewMode === "topics") {
      setViewMode("subjects");
      setSelectedSubject(null);
      setTopics([]);
    } else if (viewMode === "subjects") {
      setViewMode("curriculums");
      setSelectedCurriculum(null);
      setSubjects([]);
    } else {
      router.back();
    }
  };

  const handleSelectCurriculum = (curriculum: Curriculum) => {
    setSelectedCurriculum(curriculum);
    setViewMode("subjects");
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setViewMode("topics");
  };

  // ============================================================================
  // TOPIC SELECTION
  // ============================================================================

  const isTopicSelected = (topicId: string) =>
    selectedTopics.some((t) => t.topicId === topicId);

  const handleToggleTopic = (topic: Topic) => {
    if (topicsInSR.has(topic.$id)) return; // Already in SR

    if (isTopicSelected(topic.$id)) {
      setSelectedTopics((prev) => prev.filter((t) => t.topicId !== topic.$id));
    } else {
      setSelectedTopics((prev) => [
        ...prev,
        {
          topicId: topic.$id,
          topicName: topic.name,
          subjectId: selectedSubject!.$id,
          subjectName: selectedSubject!.name,
          curriculumId: selectedCurriculum!.$id,
          curriculumName: selectedCurriculum!.name,
        },
      ]);
    }
  };

  const handleSelectAll = () => {
    const availableTopics = topics.filter((t) => !topicsInSR.has(t.$id));
    const allSelected = availableTopics.every((t) => isTopicSelected(t.$id));

    if (allSelected) {
      // Deselect all from current subject
      setSelectedTopics((prev) =>
        prev.filter((t) => t.subjectId !== selectedSubject?.$id),
      );
    } else {
      // Select all available
      const newSelections = availableTopics
        .filter((t) => !isTopicSelected(t.$id))
        .map((topic) => ({
          topicId: topic.$id,
          topicName: topic.name,
          subjectId: selectedSubject!.$id,
          subjectName: selectedSubject!.name,
          curriculumId: selectedCurriculum!.$id,
          curriculumName: selectedCurriculum!.name,
        }));
      setSelectedTopics((prev) => [...prev, ...newSelections]);
    }
  };

  // ============================================================================
  // ADD TOPICS
  // ============================================================================

  const handleAddTopics = async () => {
    if (selectedTopics.length === 0) return;

    setAdding(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const topic of selectedTopics) {
        const success = await addTopic(topic);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      await refreshAll();

      if (failCount === 0) {
        Alert.alert(
          "Success",
          `Added ${successCount} topic${successCount > 1 ? "s" : ""} to your review schedule.`,
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          "Partial Success",
          `Added ${successCount} topics. ${failCount} topics failed (may already exist).`,
          [{ text: "OK", onPress: () => router.back() }],
        );
      }
    } catch (error) {
      console.error("Error adding topics:", error);
      Alert.alert("Error", "Failed to add topics. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredItems = (() => {
    const query = searchQuery.toLowerCase();
    if (!query) {
      if (viewMode === "curriculums") return curriculums;
      if (viewMode === "subjects") return subjects;
      return topics;
    }

    if (viewMode === "curriculums") {
      return curriculums.filter((c) => c.name.toLowerCase().includes(query));
    }
    if (viewMode === "subjects") {
      return subjects.filter((s) => s.name.toLowerCase().includes(query));
    }
    return topics.filter((t) => t.name.toLowerCase().includes(query));
  })();

  // ============================================================================
  // RENDER
  // ============================================================================

  if (authLoading || (loading && viewMode === "curriculums")) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
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
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to add topics.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getHeaderTitle = () => {
    if (viewMode === "curriculums") return "Select Curriculum";
    if (viewMode === "subjects")
      return selectedCurriculum?.name || "Select Subject";
    return selectedSubject?.name || "Select Topics";
  };

  const getHeaderSubtitle = () => {
    if (viewMode === "curriculums")
      return "Choose a curriculum to browse topics";
    if (viewMode === "subjects") return "Choose a subject";
    return `${selectedTopics.filter((t) => t.subjectId === selectedSubject?.$id).length} selected`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title} numberOfLines={1}>
            {getHeaderTitle()}
          </Text>
          <Text style={styles.subtitle}>{getHeaderSubtitle()}</Text>
        </View>
        {viewMode === "topics" && (
          <TouchableOpacity
            onPress={handleSelectAll}
            style={styles.selectAllButton}
          >
            <Text style={styles.selectAllText}>
              {topics
                .filter((t) => !topicsInSR.has(t.$id))
                .every((t) => isTopicSelected(t.$id))
                ? "Deselect All"
                : "Select All"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.dark.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${viewMode}...`}
          placeholderTextColor={Colors.dark.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={20} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            {viewMode === "curriculums" ? (
              <>
                <GraduationCap size={64} color={Colors.dark.textMuted} />
                <Text style={styles.emptyStateTitle}>No curriculums found</Text>
                <Text style={styles.emptyStateText}>
                  Create a curriculum in the My Subjects tab first.
                </Text>
              </>
            ) : viewMode === "subjects" ? (
              <>
                <BookOpen size={64} color={Colors.dark.textMuted} />
                <Text style={styles.emptyStateTitle}>No subjects found</Text>
                <Text style={styles.emptyStateText}>
                  Add subjects to this curriculum first.
                </Text>
              </>
            ) : (
              <>
                <BookOpen size={64} color={Colors.dark.textMuted} />
                <Text style={styles.emptyStateTitle}>No topics found</Text>
                <Text style={styles.emptyStateText}>
                  Add topics to this subject first.
                </Text>
              </>
            )}
          </View>
        ) : viewMode === "curriculums" ? (
          (filteredItems as Curriculum[]).map((curriculum) => (
            <TouchableOpacity
              key={curriculum.$id}
              style={styles.itemCard}
              onPress={() => handleSelectCurriculum(curriculum)}
            >
              <View style={styles.itemInfo}>
                <GraduationCap size={24} color={Colors.dark.primary} />
                <Text style={styles.itemName}>{curriculum.name}</Text>
              </View>
              <ChevronRight size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          ))
        ) : viewMode === "subjects" ? (
          (filteredItems as Subject[]).map((subject) => (
            <TouchableOpacity
              key={subject.$id}
              style={styles.itemCard}
              onPress={() => handleSelectSubject(subject)}
            >
              <View style={styles.itemInfo}>
                <BookOpen size={24} color={Colors.dark.primary} />
                <Text style={styles.itemName}>{subject.name}</Text>
              </View>
              <ChevronRight size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          ))
        ) : (
          (filteredItems as Topic[]).map((topic) => {
            const inSR = topicsInSR.has(topic.$id);
            const selected = isTopicSelected(topic.$id);

            return (
              <TouchableOpacity
                key={topic.$id}
                style={[styles.topicCard, inSR && styles.topicCardDisabled]}
                onPress={() => handleToggleTopic(topic)}
                disabled={inSR}
              >
                <View style={styles.topicCheckbox}>
                  {inSR ? (
                    <CheckCircle size={24} color={Colors.dark.success} />
                  ) : selected ? (
                    <CheckCircle size={24} color={Colors.dark.primary} />
                  ) : (
                    <Circle size={24} color={Colors.dark.textMuted} />
                  )}
                </View>
                <View style={styles.topicInfo}>
                  <Text
                    style={[styles.topicName, inSR && styles.topicNameDisabled]}
                  >
                    {topic.name}
                  </Text>
                  {inSR && (
                    <Text style={styles.topicAlreadyAdded}>Already added</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Selection Summary & Add Button */}
      {selectedTopics.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.selectionSummary}>
            <Text style={styles.selectionCount}>
              {selectedTopics.length} topic
              {selectedTopics.length > 1 ? "s" : ""} selected
            </Text>
            <TouchableOpacity onPress={() => setSelectedTopics([])}>
              <Text style={styles.clearSelection}>Clear</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.addButton, adding && styles.addButtonDisabled]}
            onPress={handleAddTopics}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add to Review Schedule</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.dark.textMuted,
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.primary,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
  },

  // Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  // Item Cards (Curriculums/Subjects)
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.dark.text,
    flex: 1,
  },

  // Topic Cards
  topicCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  topicCardDisabled: {
    opacity: 0.6,
  },
  topicCheckbox: {
    marginRight: 14,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  topicNameDisabled: {
    color: Colors.dark.textMuted,
  },
  topicAlreadyAdded: {
    fontSize: 12,
    color: Colors.dark.success,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  selectionSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectionCount: {
    fontSize: 14,
    color: Colors.dark.textMuted,
  },
  clearSelection: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
