/**
 * Spaced Repetition Main Screen
 * Dashboard with stats, quick actions, and review session
 */

import { useAuth } from "@/components/AppwriteProvider";
import { Colors } from "@/constants/Colors";
import { useSpacedRepetition } from "@/context/SpacedRepetitionContext";
import {
  calculateRetentionRate,
  formatInterval,
  formatNextReview,
} from "@/services/spacedRepetitionService";
import {
  REVIEW_QUALITY_COLORS,
  REVIEW_QUALITY_LABELS,
  ReviewQuality,
  SpacedRepetitionItem,
} from "@/types/spacedRepetition";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Settings,
  Target,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

export default function SpacedRepetitionScreen() {
  const { user, loading: authLoading } = useAuth();
  const {
    items,
    dueItems,
    settings,
    loading,
    stats,
    reviewSession,
    refreshAll,
    startReviewSession,
    submitSM2Review,
    submitCustomReview,
    showAnswer,
    skipItem,
    endSession,
    updateTopicStatus,
    removeTopic,
    resetTopic,
  } = useSpacedRepetition();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"dashboard" | "topics">(
    "dashboard",
  );
  const [topicFilter, setTopicFilter] = useState<
    "all" | "due" | "active" | "paused"
  >("all");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  // Filter topics based on selected filter
  const filteredItems = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    switch (topicFilter) {
      case "due":
        return items.filter(
          (item) =>
            item.status === "active" && new Date(item.nextReviewDate) <= today,
        );
      case "active":
        return items.filter((item) => item.status === "active");
      case "paused":
        return items.filter((item) => item.status === "paused");
      default:
        return items;
    }
  }, [items, topicFilter]);

  // ============================================================================
  // AUTH LOADING / NOT LOGGED IN
  // ============================================================================

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading your reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginPrompt}>
          <Brain size={64} color={Colors.dark.textMuted} />
          <Text style={styles.loginPromptTitle}>Spaced Repetition</Text>
          <Text style={styles.loginPromptText}>
            Sign in to track your learning with scientifically-proven spaced
            repetition.
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

  // ============================================================================
  // REVIEW SESSION ACTIVE
  // ============================================================================

  if (reviewSession && !reviewSession.isComplete) {
    return (
      <ReviewSessionView
        reviewSession={reviewSession}
        settings={settings}
        onShowAnswer={showAnswer}
        onSubmitSM2={submitSM2Review}
        onSubmitCustom={submitCustomReview}
        onSkip={skipItem}
        onEnd={endSession}
      />
    );
  }

  // ============================================================================
  // SESSION COMPLETE
  // ============================================================================

  if (reviewSession && reviewSession.isComplete) {
    return (
      <SessionCompleteView
        sessionStats={reviewSession.sessionStats}
        onClose={endSession}
        onRefresh={refreshAll}
      />
    );
  }

  // ============================================================================
  // MAIN DASHBOARD
  // ============================================================================

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
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
          <View>
            <Text style={styles.title}>Spaced Repetition</Text>
            <Text style={styles.subtitle}>Master your subjects over time</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/review/settings" as any)}
          >
            <Settings size={22} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={["rgba(99, 102, 241, 0.15)", "rgba(99, 102, 241, 0.05)"]}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Target size={24} color={Colors.dark.primary} />
            </View>
            <Text style={styles.statValue}>{stats.dueToday}</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(34, 197, 94, 0.15)", "rgba(34, 197, 94, 0.05)"]}
            style={styles.statCard}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "rgba(34, 197, 94, 0.2)" },
              ]}
            >
              <TrendingUp size={24} color={Colors.dark.success} />
            </View>
            <Text style={styles.statValue}>{stats.overallRetention}%</Text>
            <Text style={styles.statLabel}>Retention</Text>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(249, 115, 22, 0.15)", "rgba(249, 115, 22, 0.05)"]}
            style={styles.statCard}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "rgba(249, 115, 22, 0.2)" },
              ]}
            >
              <BookOpen size={24} color={Colors.dark.warning} />
            </View>
            <Text style={styles.statValue}>{stats.totalActive}</Text>
            <Text style={styles.statLabel}>Active Topics</Text>
          </LinearGradient>
        </View>

        {/* Start Review Button */}
        {stats.dueToday > 0 && (
          <TouchableOpacity
            style={styles.startReviewButton}
            onPress={() => startReviewSession()}
          >
            <LinearGradient
              colors={Colors.dark.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startReviewGradient}
            >
              <Play size={24} color="#fff" />
              <Text style={styles.startReviewText}>
                Start Review ({stats.dueToday} items)
              </Text>
              <ArrowRight size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "dashboard" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("dashboard")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "dashboard" && styles.activeTabText,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "topics" && styles.activeTab]}
            onPress={() => setSelectedTab("topics")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "topics" && styles.activeTabText,
              ]}
            >
              Topics ({items.length})
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === "dashboard" ? (
          <DashboardContent
            stats={stats}
            dueItems={dueItems}
            onAddTopics={() => router.push("/review/add" as any)}
          />
        ) : (
          <TopicsContent
            items={filteredItems}
            filter={topicFilter}
            onFilterChange={setTopicFilter}
            onPause={(id) => updateTopicStatus(id, "paused")}
            onResume={(id) => updateTopicStatus(id, "active")}
            onArchive={(id) => updateTopicStatus(id, "archived")}
            onDelete={removeTopic}
            onReset={resetTopic}
            onAddTopics={() => router.push("/review/add" as any)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================

interface DashboardContentProps {
  stats: {
    dueToday: number;
    totalActive: number;
    overallRetention: number;
    byStatus: {
      active: number;
      paused: number;
      completed: number;
      archived: number;
    };
    upcomingReviews: { tomorrow: number; thisWeek: number; thisMonth: number };
  };
  dueItems: SpacedRepetitionItem[];
  onAddTopics: () => void;
}

function DashboardContent({
  stats,
  dueItems,
  onAddTopics,
}: DashboardContentProps) {
  return (
    <>
      {/* Upcoming Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Reviews</Text>
        <View style={styles.upcomingCard}>
          <View style={styles.upcomingRow}>
            <View style={styles.upcomingItem}>
              <Calendar size={18} color={Colors.dark.warning} />
              <Text style={styles.upcomingLabel}>Tomorrow</Text>
              <Text style={styles.upcomingValue}>
                {stats.upcomingReviews.tomorrow}
              </Text>
            </View>
            <View style={styles.upcomingDivider} />
            <View style={styles.upcomingItem}>
              <Clock size={18} color={Colors.dark.primary} />
              <Text style={styles.upcomingLabel}>This Week</Text>
              <Text style={styles.upcomingValue}>
                {stats.upcomingReviews.thisWeek}
              </Text>
            </View>
            <View style={styles.upcomingDivider} />
            <View style={styles.upcomingItem}>
              <Calendar size={18} color={Colors.dark.success} />
              <Text style={styles.upcomingLabel}>This Month</Text>
              <Text style={styles.upcomingValue}>
                {stats.upcomingReviews.thisMonth}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Status Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Breakdown</Text>
        <View style={styles.statusGrid}>
          <View
            style={[
              styles.statusCard,
              { borderLeftColor: Colors.dark.success },
            ]}
          >
            <Text style={styles.statusValue}>{stats.byStatus.active}</Text>
            <Text style={styles.statusLabel}>Active</Text>
          </View>
          <View
            style={[
              styles.statusCard,
              { borderLeftColor: Colors.dark.warning },
            ]}
          >
            <Text style={styles.statusValue}>{stats.byStatus.paused}</Text>
            <Text style={styles.statusLabel}>Paused</Text>
          </View>
          <View
            style={[
              styles.statusCard,
              { borderLeftColor: Colors.dark.primary },
            ]}
          >
            <Text style={styles.statusValue}>{stats.byStatus.completed}</Text>
            <Text style={styles.statusLabel}>Completed</Text>
          </View>
          <View
            style={[
              styles.statusCard,
              { borderLeftColor: Colors.dark.textMuted },
            ]}
          >
            <Text style={styles.statusValue}>{stats.byStatus.archived}</Text>
            <Text style={styles.statusLabel}>Archived</Text>
          </View>
        </View>
      </View>

      {/* Due Items Preview */}
      {dueItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due for Review</Text>
          {dueItems.slice(0, 5).map((item) => (
            <View key={item.$id} style={styles.dueItemCard}>
              <View style={styles.dueItemInfo}>
                <Text style={styles.dueItemName} numberOfLines={1}>
                  {item.topicName}
                </Text>
                <Text style={styles.dueItemSubject} numberOfLines={1}>
                  {item.subjectName || "No subject"}
                </Text>
              </View>
              <View style={styles.dueItemMeta}>
                <Text style={styles.dueItemInterval}>
                  {formatInterval(item.interval)}
                </Text>
                <Text style={styles.dueItemRetention}>
                  {calculateRetentionRate(
                    item.correctReviews,
                    item.totalReviews,
                  )}
                  %
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {stats.totalActive === 0 && (
        <View style={styles.emptyState}>
          <Brain size={64} color={Colors.dark.textMuted} />
          <Text style={styles.emptyStateTitle}>No topics yet</Text>
          <Text style={styles.emptyStateText}>
            Add topics from your curriculum to start learning with spaced
            repetition.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={onAddTopics}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.emptyStateButtonText}>Add Topics</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// ============================================================================
// TOPICS CONTENT
// ============================================================================

interface TopicsContentProps {
  items: SpacedRepetitionItem[];
  filter: "all" | "due" | "active" | "paused";
  onFilterChange: (filter: "all" | "due" | "active" | "paused") => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  onAddTopics: () => void;
}

function TopicsContent({
  items,
  filter,
  onFilterChange,
  onPause,
  onResume,
  onArchive,
  onDelete,
  onReset,
  onAddTopics,
}: TopicsContentProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleDelete = (item: SpacedRepetitionItem) => {
    Alert.alert(
      "Delete Topic",
      `Are you sure you want to remove "${item.topicName}" from spaced repetition?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(item.$id),
        },
      ],
    );
  };

  const handleReset = (item: SpacedRepetitionItem) => {
    Alert.alert(
      "Reset Topic",
      `This will reset "${item.topicName}" to the beginning. All progress will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => onReset(item.$id),
        },
      ],
    );
  };

  return (
    <>
      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(["all", "due", "active", "paused"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => onFilterChange(f)}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === f && styles.filterPillTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Topics List */}
      {items.length > 0 ? (
        items.map((item) => (
          <View key={item.$id} style={styles.topicCard}>
            <TouchableOpacity
              style={styles.topicCardHeader}
              onPress={() =>
                setExpandedItem(expandedItem === item.$id ? null : item.$id)
              }
            >
              <View style={styles.topicInfo}>
                <View
                  style={[
                    styles.statusDot,
                    item.status === "active" && {
                      backgroundColor: Colors.dark.success,
                    },
                    item.status === "paused" && {
                      backgroundColor: Colors.dark.warning,
                    },
                    item.status === "archived" && {
                      backgroundColor: Colors.dark.textMuted,
                    },
                  ]}
                />
                <View style={styles.topicTextContainer}>
                  <Text style={styles.topicName} numberOfLines={1}>
                    {item.topicName}
                  </Text>
                  <Text style={styles.topicSubject} numberOfLines={1}>
                    {item.subjectName || "Unknown"} •{" "}
                    {formatNextReview(item.nextReviewDate)}
                  </Text>
                </View>
              </View>
              <ChevronRight
                size={20}
                color={Colors.dark.textMuted}
                style={[
                  styles.expandIcon,
                  expandedItem === item.$id && styles.expandIconRotated,
                ]}
              />
            </TouchableOpacity>

            {expandedItem === item.$id && (
              <View style={styles.topicCardExpanded}>
                <View style={styles.topicStats}>
                  <View style={styles.topicStatItem}>
                    <Text style={styles.topicStatLabel}>Interval</Text>
                    <Text style={styles.topicStatValue}>
                      {formatInterval(item.interval)}
                    </Text>
                  </View>
                  <View style={styles.topicStatItem}>
                    <Text style={styles.topicStatLabel}>Reviews</Text>
                    <Text style={styles.topicStatValue}>
                      {item.totalReviews}
                    </Text>
                  </View>
                  <View style={styles.topicStatItem}>
                    <Text style={styles.topicStatLabel}>Retention</Text>
                    <Text style={styles.topicStatValue}>
                      {calculateRetentionRate(
                        item.correctReviews,
                        item.totalReviews,
                      )}
                      %
                    </Text>
                  </View>
                  {item.reviewMode === "sm2" && (
                    <View style={styles.topicStatItem}>
                      <Text style={styles.topicStatLabel}>Ease</Text>
                      <Text style={styles.topicStatValue}>
                        {item.easeFactor.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.topicActions}>
                  {item.status === "active" ? (
                    <TouchableOpacity
                      style={styles.topicActionButton}
                      onPress={() => onPause(item.$id)}
                    >
                      <Pause size={16} color={Colors.dark.warning} />
                      <Text
                        style={[
                          styles.topicActionText,
                          { color: Colors.dark.warning },
                        ]}
                      >
                        Pause
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.topicActionButton}
                      onPress={() => onResume(item.$id)}
                    >
                      <Play size={16} color={Colors.dark.success} />
                      <Text
                        style={[
                          styles.topicActionText,
                          { color: Colors.dark.success },
                        ]}
                      >
                        Resume
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.topicActionButton}
                    onPress={() => handleReset(item)}
                  >
                    <RefreshCcw size={16} color={Colors.dark.primary} />
                    <Text
                      style={[
                        styles.topicActionText,
                        { color: Colors.dark.primary },
                      ]}
                    >
                      Reset
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.topicActionButton}
                    onPress={() => handleDelete(item)}
                  >
                    <X size={16} color={Colors.dark.error} />
                    <Text
                      style={[
                        styles.topicActionText,
                        { color: Colors.dark.error },
                      ]}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <AlertCircle size={48} color={Colors.dark.textMuted} />
          <Text style={styles.emptyStateTitle}>No topics found</Text>
          <Text style={styles.emptyStateText}>
            {filter !== "all"
              ? "Try changing the filter to see more topics."
              : "Add topics from your curriculum to get started."}
          </Text>
        </View>
      )}

      {/* Add Topics Button */}
      <TouchableOpacity style={styles.addTopicsButton} onPress={onAddTopics}>
        <Plus size={20} color={Colors.dark.primary} />
        <Text style={styles.addTopicsText}>Add Topics</Text>
      </TouchableOpacity>
    </>
  );
}

// ============================================================================
// REVIEW SESSION VIEW
// ============================================================================

interface ReviewSessionViewProps {
  reviewSession: {
    items: SpacedRepetitionItem[];
    currentIndex: number;
    showAnswer: boolean;
    sessionStats: { reviewed: number; correct: number; incorrect: number };
  };
  settings: any;
  onShowAnswer: () => void;
  onSubmitSM2: (quality: ReviewQuality) => void;
  onSubmitCustom: (remembered: boolean) => void;
  onSkip: () => void;
  onEnd: () => void;
}

function ReviewSessionView({
  reviewSession,
  settings,
  onShowAnswer,
  onSubmitSM2,
  onSubmitCustom,
  onSkip,
  onEnd,
}: ReviewSessionViewProps) {
  const currentItem = reviewSession.items[reviewSession.currentIndex];
  const progress =
    ((reviewSession.currentIndex + 1) / reviewSession.items.length) * 100;
  const reviewMode = currentItem.reviewMode || settings?.reviewMode || "custom";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.sessionHeader}>
        <TouchableOpacity onPress={onEnd} style={styles.sessionCloseButton}>
          <X size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.sessionProgress}>
          <Text style={styles.sessionProgressText}>
            {reviewSession.currentIndex + 1} / {reviewSession.items.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        <TouchableOpacity onPress={onSkip} style={styles.sessionSkipButton}>
          <Text style={styles.sessionSkipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Card */}
      <View style={styles.reviewCard}>
        <View style={styles.reviewCardContent}>
          <Text style={styles.reviewSubject}>{currentItem.subjectName}</Text>
          <Text style={styles.reviewTopicName}>{currentItem.topicName}</Text>

          {reviewSession.showAnswer && (
            <View style={styles.reviewStats}>
              <Text style={styles.reviewStatsText}>
                Interval: {formatInterval(currentItem.interval)} • Reviews:{" "}
                {currentItem.totalReviews}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.reviewActions}>
        {!reviewSession.showAnswer ? (
          <TouchableOpacity
            style={styles.showAnswerButton}
            onPress={onShowAnswer}
          >
            <Eye size={24} color="#fff" />
            <Text style={styles.showAnswerText}>Show Answer</Text>
          </TouchableOpacity>
        ) : reviewMode === "sm2" ? (
          <View style={styles.qualityButtons}>
            {[0, 1, 2, 3, 4, 5].map((q) => (
              <TouchableOpacity
                key={q}
                style={[
                  styles.qualityButton,
                  {
                    backgroundColor:
                      REVIEW_QUALITY_COLORS[q as ReviewQuality] + "20",
                  },
                ]}
                onPress={() => onSubmitSM2(q as ReviewQuality)}
              >
                <Text
                  style={[
                    styles.qualityButtonText,
                    { color: REVIEW_QUALITY_COLORS[q as ReviewQuality] },
                  ]}
                >
                  {q}
                </Text>
                <Text
                  style={[
                    styles.qualityButtonLabel,
                    { color: REVIEW_QUALITY_COLORS[q as ReviewQuality] },
                  ]}
                >
                  {REVIEW_QUALITY_LABELS[q as ReviewQuality]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.customButtons}>
            <TouchableOpacity
              style={[styles.customButton, styles.forgotButton]}
              onPress={() => onSubmitCustom(false)}
            >
              <XCircle size={32} color={Colors.dark.error} />
              <Text
                style={[styles.customButtonText, { color: Colors.dark.error }]}
              >
                Forgot
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.customButton, styles.rememberedButton]}
              onPress={() => onSubmitCustom(true)}
            >
              <CheckCircle size={32} color={Colors.dark.success} />
              <Text
                style={[
                  styles.customButtonText,
                  { color: Colors.dark.success },
                ]}
              >
                Remembered
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// SESSION COMPLETE VIEW
// ============================================================================

interface SessionCompleteViewProps {
  sessionStats: { reviewed: number; correct: number; incorrect: number };
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

function SessionCompleteView({
  sessionStats,
  onClose,
  onRefresh,
}: SessionCompleteViewProps) {
  const retentionRate = calculateRetentionRate(
    sessionStats.correct,
    sessionStats.reviewed,
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.completeContainer}>
        <View style={styles.completeIconContainer}>
          <CheckCircle size={80} color={Colors.dark.success} />
        </View>
        <Text style={styles.completeTitle}>Session Complete!</Text>
        <Text style={styles.completeSubtitle}>
          Great job on your review session
        </Text>

        <View style={styles.completeStats}>
          <View style={styles.completeStatItem}>
            <Text style={styles.completeStatValue}>
              {sessionStats.reviewed}
            </Text>
            <Text style={styles.completeStatLabel}>Reviewed</Text>
          </View>
          <View style={styles.completeStatDivider} />
          <View style={styles.completeStatItem}>
            <Text
              style={[styles.completeStatValue, { color: Colors.dark.success }]}
            >
              {sessionStats.correct}
            </Text>
            <Text style={styles.completeStatLabel}>Correct</Text>
          </View>
          <View style={styles.completeStatDivider} />
          <View style={styles.completeStatItem}>
            <Text style={styles.completeStatValue}>{retentionRate}%</Text>
            <Text style={styles.completeStatLabel}>Retention</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.completeDoneButton}
          onPress={() => {
            onRefresh();
            onClose();
          }}
        >
          <Text style={styles.completeDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.dark.textMuted,
    marginTop: 16,
    fontSize: 16,
  },

  // Auth
  loginPrompt: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },

  // Start Review Button
  startReviewButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  startReviewGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  startReviewText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textMuted,
  },
  activeTabText: {
    color: "#fff",
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 12,
  },

  // Upcoming
  upcomingCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  upcomingItem: {
    flex: 1,
    alignItems: "center",
  },
  upcomingLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 8,
  },
  upcomingValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: 4,
  },
  upcomingDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },

  // Status Grid
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },

  // Due Items
  dueItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  dueItemInfo: {
    flex: 1,
  },
  dueItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  dueItemSubject: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  dueItemMeta: {
    alignItems: "flex-end",
  },
  dueItemInterval: {
    fontSize: 13,
    color: Colors.dark.primary,
    fontWeight: "500",
  },
  dueItemRetention: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
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
    lineHeight: 22,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Filter
  filterContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: Colors.dark.primary,
  },
  filterPillText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    fontWeight: "500",
  },
  filterPillTextActive: {
    color: "#fff",
  },

  // Topic Cards
  topicCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    overflow: "hidden",
  },
  topicCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  topicInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  topicTextContainer: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  topicSubject: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  expandIcon: {
    transform: [{ rotate: "0deg" }],
  },
  expandIconRotated: {
    transform: [{ rotate: "90deg" }],
  },
  topicCardExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  topicStats: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  topicStatItem: {
    alignItems: "center",
  },
  topicStatLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  topicStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginTop: 2,
  },
  topicActions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  topicActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.dark.surfaceHighlight,
    gap: 6,
  },
  topicActionText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Add Topics Button
  addTopicsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    borderStyle: "dashed",
    gap: 8,
  },
  addTopicsText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.primary,
  },

  // Review Session
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  sessionCloseButton: {
    padding: 8,
  },
  sessionProgress: {
    flex: 1,
    marginHorizontal: 16,
  },
  sessionProgressText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.dark.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
  sessionSkipButton: {
    padding: 8,
  },
  sessionSkipText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    fontWeight: "500",
  },

  // Review Card
  reviewCard: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  reviewCardContent: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    minHeight: 300,
    justifyContent: "center",
  },
  reviewSubject: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: "500",
    marginBottom: 12,
  },
  reviewTopicName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
    textAlign: "center",
    lineHeight: 32,
  },
  reviewStats: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  reviewStatsText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },

  // Review Actions
  reviewActions: {
    padding: 24,
  },
  showAnswerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  showAnswerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },

  // Quality Buttons (SM-2)
  qualityButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  qualityButton: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  qualityButtonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  qualityButtonLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },

  // Custom Buttons
  customButtons: {
    flexDirection: "row",
    gap: 16,
  },
  customButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  forgotButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  rememberedButton: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },

  // Session Complete
  completeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  completeIconContainer: {
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    marginBottom: 32,
  },
  completeStats: {
    flexDirection: "row",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  completeStatItem: {
    flex: 1,
    alignItems: "center",
  },
  completeStatValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  completeStatLabel: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  completeStatDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 16,
  },
  completeDoneButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  completeDoneText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
