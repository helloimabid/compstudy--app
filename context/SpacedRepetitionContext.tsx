/**
 * Spaced Repetition Context Provider
 * Manages state for the spaced repetition system
 */

import { useAuth } from "@/components/AppwriteProvider";
import {
  addTopicToSR,
  calculateDashboardStats,
  deleteSRItem,
  getDueItems,
  getUserSRItems,
  getUserSRSettings,
  resetSRItem,
  updateSRItemCustom,
  updateSRItemSM2,
  updateSRItemStatus,
  updateUserSRSettings,
} from "@/services/spacedRepetitionService";
import { updateSRNotifications } from "@/services/srNotificationService";
import {
  DEFAULT_SR_SETTINGS,
  ReviewQuality,
  ReviewSessionState,
  SpacedRepetitionItem,
  TopicStatus,
  UserSRSettings,
} from "@/types/spacedRepetition";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface SpacedRepetitionContextType {
  // Data
  items: SpacedRepetitionItem[];
  dueItems: SpacedRepetitionItem[];
  settings: UserSRSettings | null;

  // Loading states
  loading: boolean;
  loadingSettings: boolean;

  // Dashboard stats
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

  // Review session
  reviewSession: ReviewSessionState | null;

  // Actions
  refreshItems: () => Promise<void>;
  refreshDueItems: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Topic management
  addTopic: (topic: {
    topicId: string;
    topicName: string;
    subjectId: string;
    subjectName?: string;
    curriculumId: string;
    curriculumName?: string;
  }) => Promise<boolean>;
  removeTopic: (itemId: string) => Promise<boolean>;
  updateTopicStatus: (itemId: string, status: TopicStatus) => Promise<boolean>;
  resetTopic: (itemId: string) => Promise<boolean>;

  // Settings management
  updateSettings: (
    data: Partial<
      Omit<UserSRSettings, "$id" | "$createdAt" | "$updatedAt" | "userId">
    >,
  ) => Promise<boolean>;

  // Review session management
  startReviewSession: (items?: SpacedRepetitionItem[]) => void;
  submitSM2Review: (quality: ReviewQuality) => Promise<void>;
  submitCustomReview: (remembered: boolean) => Promise<void>;
  showAnswer: () => void;
  skipItem: () => void;
  endSession: () => void;
}

const SpacedRepetitionContext = createContext<
  SpacedRepetitionContextType | undefined
>(undefined);

// ============================================================================
// HOOK
// ============================================================================

export function useSpacedRepetition() {
  const context = useContext(SpacedRepetitionContext);
  if (context === undefined) {
    throw new Error(
      "useSpacedRepetition must be used within a SpacedRepetitionProvider",
    );
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface SpacedRepetitionProviderProps {
  children: ReactNode;
}

export function SpacedRepetitionProvider({
  children,
}: SpacedRepetitionProviderProps) {
  const { user } = useAuth();

  // Data state
  const [items, setItems] = useState<SpacedRepetitionItem[]>([]);
  const [dueItems, setDueItems] = useState<SpacedRepetitionItem[]>([]);
  const [settings, setSettings] = useState<UserSRSettings | null>(null);
  const [stats, setStats] = useState({
    dueToday: 0,
    totalActive: 0,
    overallRetention: 0,
    byStatus: { active: 0, paused: 0, completed: 0, archived: 0 },
    upcomingReviews: { tomorrow: 0, thisWeek: 0, thisMonth: 0 },
  });

  // Loading state
  const [loading, setLoading] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Review session state
  const [reviewSession, setReviewSession] = useState<ReviewSessionState | null>(
    null,
  );

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const refreshItems = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserSRItems(user.$id);
      setItems(data);
    } catch (error) {
      console.error("Error refreshing items:", error);
    }
  }, [user]);

  const refreshDueItems = useCallback(async () => {
    if (!user) return;
    try {
      const maxItems =
        settings?.maxDailyReviews || DEFAULT_SR_SETTINGS.maxDailyReviews;
      const data = await getDueItems(user.$id, maxItems);
      setDueItems(data);
    } catch (error) {
      console.error("Error refreshing due items:", error);
    }
  }, [user, settings?.maxDailyReviews]);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    try {
      const data = await calculateDashboardStats(user.$id);
      setStats(data);
    } catch (error) {
      console.error("Error refreshing stats:", error);
    }
  }, [user]);

  const refreshSettings = useCallback(async () => {
    if (!user) return;
    setLoadingSettings(true);
    try {
      const data = await getUserSRSettings(user.$id);
      setSettings(data);
    } catch (error) {
      console.error("Error refreshing settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  }, [user]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshSettings(),
        refreshItems(),
        refreshDueItems(),
        refreshStats(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [refreshSettings, refreshItems, refreshDueItems, refreshStats]);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshAll();
    } else {
      // Reset state when user logs out
      setItems([]);
      setDueItems([]);
      setSettings(null);
      setStats({
        dueToday: 0,
        totalActive: 0,
        overallRetention: 0,
        byStatus: { active: 0, paused: 0, completed: 0, archived: 0 },
        upcomingReviews: { tomorrow: 0, thisWeek: 0, thisMonth: 0 },
      });
      setLoading(false);
      setLoadingSettings(false);
    }
  }, [user, refreshAll]);

  // Setup push notifications when settings are loaded
  useEffect(() => {
    if (settings) {
      const pushEnabled = settings.pushRemindersEnabled ?? true;
      updateSRNotifications(
        pushEnabled,
        settings.reminderTime,
        settings.weekendReminders,
      ).catch(console.error);
    }
  }, [settings]);

  // ============================================================================
  // TOPIC MANAGEMENT
  // ============================================================================

  const addTopic = useCallback(
    async (topic: {
      topicId: string;
      topicName: string;
      subjectId: string;
      subjectName?: string;
      curriculumId: string;
      curriculumName?: string;
    }): Promise<boolean> => {
      if (!user || !settings) return false;

      try {
        const result = await addTopicToSR(user.$id, topic, settings);
        if (result) {
          await refreshItems();
          await refreshStats();
          await refreshDueItems();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error adding topic:", error);
        return false;
      }
    },
    [user, settings, refreshItems, refreshStats, refreshDueItems],
  );

  const removeTopic = useCallback(
    async (itemId: string): Promise<boolean> => {
      try {
        const success = await deleteSRItem(itemId);
        if (success) {
          setItems((prev) => prev.filter((item) => item.$id !== itemId));
          setDueItems((prev) => prev.filter((item) => item.$id !== itemId));
          await refreshStats();
        }
        return success;
      } catch (error) {
        console.error("Error removing topic:", error);
        return false;
      }
    },
    [refreshStats],
  );

  const updateTopicStatus = useCallback(
    async (itemId: string, status: TopicStatus): Promise<boolean> => {
      try {
        const result = await updateSRItemStatus(itemId, status);
        if (result) {
          setItems((prev) =>
            prev.map((item) =>
              item.$id === itemId ? { ...item, status } : item,
            ),
          );
          if (status !== "active") {
            setDueItems((prev) => prev.filter((item) => item.$id !== itemId));
          }
          await refreshStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating topic status:", error);
        return false;
      }
    },
    [refreshStats],
  );

  const resetTopic = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!settings) return false;

      try {
        const result = await resetSRItem(itemId, settings);
        if (result) {
          setItems((prev) =>
            prev.map((item) => (item.$id === itemId ? result : item)),
          );
          await refreshDueItems();
          await refreshStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error resetting topic:", error);
        return false;
      }
    },
    [settings, refreshDueItems, refreshStats],
  );

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  const updateSettings = useCallback(
    async (
      data: Partial<
        Omit<UserSRSettings, "$id" | "$createdAt" | "$updatedAt" | "userId">
      >,
    ): Promise<boolean> => {
      if (!settings) return false;

      try {
        const result = await updateUserSRSettings(settings.$id, data);
        if (result) {
          setSettings(result);

          // Update push notifications based on new settings
          const pushEnabled =
            data.pushRemindersEnabled ?? result.pushRemindersEnabled ?? true;
          const reminderTime = data.reminderTime ?? result.reminderTime;
          const weekendReminders =
            data.weekendReminders ?? result.weekendReminders;

          await updateSRNotifications(
            pushEnabled,
            reminderTime,
            weekendReminders,
          );

          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating settings:", error);
        return false;
      }
    },
    [settings],
  );

  // ============================================================================
  // REVIEW SESSION MANAGEMENT
  // ============================================================================

  const startReviewSession = useCallback(
    (itemsToReview?: SpacedRepetitionItem[]) => {
      const sessionItems = itemsToReview || dueItems;
      if (sessionItems.length === 0) return;

      setReviewSession({
        items: sessionItems,
        currentIndex: 0,
        showAnswer: false,
        sessionStats: {
          reviewed: 0,
          correct: 0,
          incorrect: 0,
        },
        isComplete: false,
      });
    },
    [dueItems],
  );

  const showAnswer = useCallback(() => {
    setReviewSession((prev) => {
      if (!prev) return prev;
      return { ...prev, showAnswer: true };
    });
  }, []);

  const moveToNextItem = useCallback(() => {
    setReviewSession((prev) => {
      if (!prev) return prev;

      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.items.length) {
        return { ...prev, isComplete: true };
      }

      return {
        ...prev,
        currentIndex: nextIndex,
        showAnswer: false,
      };
    });
  }, []);

  const submitSM2Review = useCallback(
    async (quality: ReviewQuality) => {
      if (!reviewSession) return;

      const currentItem = reviewSession.items[reviewSession.currentIndex];
      const isCorrect = quality >= 3;

      // Update in database
      await updateSRItemSM2(currentItem.$id, currentItem, quality);

      // Update session stats
      setReviewSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sessionStats: {
            reviewed: prev.sessionStats.reviewed + 1,
            correct: prev.sessionStats.correct + (isCorrect ? 1 : 0),
            incorrect: prev.sessionStats.incorrect + (isCorrect ? 0 : 1),
          },
        };
      });

      // Move to next item
      moveToNextItem();

      // Refresh data
      await refreshDueItems();
      await refreshStats();
    },
    [reviewSession, moveToNextItem, refreshDueItems, refreshStats],
  );

  const submitCustomReview = useCallback(
    async (remembered: boolean) => {
      if (!reviewSession) return;

      const currentItem = reviewSession.items[reviewSession.currentIndex];

      // Update in database
      await updateSRItemCustom(currentItem.$id, currentItem, remembered);

      // Update session stats
      setReviewSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sessionStats: {
            reviewed: prev.sessionStats.reviewed + 1,
            correct: prev.sessionStats.correct + (remembered ? 1 : 0),
            incorrect: prev.sessionStats.incorrect + (remembered ? 0 : 1),
          },
        };
      });

      // Move to next item
      moveToNextItem();

      // Refresh data
      await refreshDueItems();
      await refreshStats();
    },
    [reviewSession, moveToNextItem, refreshDueItems, refreshStats],
  );

  const skipItem = useCallback(() => {
    moveToNextItem();
  }, [moveToNextItem]);

  const endSession = useCallback(() => {
    setReviewSession(null);
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: SpacedRepetitionContextType = {
    items,
    dueItems,
    settings,
    loading,
    loadingSettings,
    stats,
    reviewSession,
    refreshItems,
    refreshDueItems,
    refreshStats,
    refreshSettings,
    refreshAll,
    addTopic,
    removeTopic,
    updateTopicStatus,
    resetTopic,
    updateSettings,
    startReviewSession,
    submitSM2Review,
    submitCustomReview,
    showAnswer,
    skipItem,
    endSession,
  };

  return (
    <SpacedRepetitionContext.Provider value={value}>
      {children}
    </SpacedRepetitionContext.Provider>
  );
}
