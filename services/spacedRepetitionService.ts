/**
 * Spaced Repetition Service
 * Handles all database operations and algorithm calculations for the SR system
 */

import {
    COLLECTIONS,
    databases,
    DB_ID,
    ID,
    Permission,
    Query,
    Role,
} from '@/lib/appwrite';
import {
    DEFAULT_SR_ITEM,
    DEFAULT_SR_SETTINGS,
    PRESET_PATTERNS,
    ReviewQuality,
    SpacedRepetitionItem,
    TopicStatus,
    UserSRSettings
} from '@/types/spacedRepetition';

// Use collection names from COLLECTIONS
const SR_COLLECTION = COLLECTIONS.SPACED_REPETITION;
const SR_SETTINGS_COLLECTION = COLLECTIONS.USER_SR_SETTINGS;

// ============================================================================
// ALGORITHM FUNCTIONS
// ============================================================================

/**
 * SM-2 Algorithm Implementation
 * Calculates the next review date based on quality of response
 */
export function calculateSM2Review(
  easeFactor: number,
  interval: number,
  repetitions: number,
  quality: ReviewQuality
): {
  newEaseFactor: number;
  newInterval: number;
  newRepetitions: number;
  nextReviewDate: Date;
} {
  // Update ease factor based on quality
  let newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum 1.3

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Failed review - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful review
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return { newEaseFactor, newInterval, newRepetitions, nextReviewDate };
}

/**
 * Custom Pattern Algorithm
 * Moves through fixed intervals based on correct/incorrect responses
 */
export function calculateCustomPatternReview(
  currentStep: number,
  intervals: number[],
  isCorrect: boolean
): {
  newInterval: number;
  nextReviewDate: Date;
  newStep: number;
} {
  let newStep = currentStep;

  if (isCorrect) {
    // Move to next step in pattern
    newStep = Math.min(currentStep + 1, intervals.length - 1);
  } else {
    // Go back one step (minimum 0)
    newStep = Math.max(0, currentStep - 1);
  }

  const newInterval = intervals[newStep];
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return { newInterval, nextReviewDate, newStep };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get items due for review (nextReviewDate <= today)
 */
export function filterDueItems(
  items: SpacedRepetitionItem[],
  maxItems: number = 20
): SpacedRepetitionItem[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return items
    .filter(
      (item) =>
        item.status === 'active' && new Date(item.nextReviewDate) <= today
    )
    .sort(
      (a, b) =>
        new Date(a.nextReviewDate).getTime() -
        new Date(b.nextReviewDate).getTime()
    )
    .slice(0, maxItems);
}

/**
 * Calculate retention rate
 */
export function calculateRetentionRate(
  correctReviews: number,
  totalReviews: number
): number {
  if (totalReviews === 0) return 0;
  return Math.round((correctReviews / totalReviews) * 100);
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

/**
 * Parse custom intervals from string input
 */
export function parseCustomIntervals(input: string): number[] {
  try {
    // If it's a JSON array string
    if (input.startsWith('[')) {
      return JSON.parse(input);
    }
    // Otherwise, parse comma-separated values
    return input
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);
  } catch {
    return [1, 4, 7, 14, 30]; // Default fallback
  }
}

/**
 * Get intervals for a given pattern
 */
export function getIntervalsForPattern(
  patternId: string,
  customIntervals?: string
): number[] {
  if (patternId === 'custom' && customIntervals) {
    return parseCustomIntervals(customIntervals);
  }
  const pattern = PRESET_PATTERNS.find((p) => p.id === patternId);
  return pattern?.intervals || PRESET_PATTERNS[0].intervals;
}

/**
 * Calculate days until next review
 */
export function getDaysUntilReview(nextReviewDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  const diffTime = reviewDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format next review date for display
 */
export function formatNextReview(nextReviewDate: string): string {
  const days = getDaysUntilReview(nextReviewDate);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  return new Date(nextReviewDate).toLocaleDateString();
}

// ============================================================================
// DATABASE OPERATIONS - USER SETTINGS
// ============================================================================

/**
 * Get user SR settings, creating defaults if none exist
 */
export async function getUserSRSettings(
  userId: string
): Promise<UserSRSettings | null> {
  try {
    const response = await databases.listDocuments(
      DB_ID,
      SR_SETTINGS_COLLECTION,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      return response.documents[0] as unknown as UserSRSettings;
    }

    // Create default settings if none exist
    return await createUserSRSettings(userId);
  } catch (error) {
    console.error('Error getting user SR settings:', error);
    return null;
  }
}

/**
 * Create default user SR settings
 */
export async function createUserSRSettings(
  userId: string
): Promise<UserSRSettings | null> {
  try {
    const doc = await databases.createDocument(
      DB_ID,
      SR_SETTINGS_COLLECTION,
      ID.unique(),
      {
        userId,
        ...DEFAULT_SR_SETTINGS,
      },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );
    return doc as unknown as UserSRSettings;
  } catch (error) {
    console.error('Error creating user SR settings:', error);
    return null;
  }
}

/**
 * Update user SR settings
 */
export async function updateUserSRSettings(
  settingsId: string,
  data: Partial<Omit<UserSRSettings, '$id' | '$createdAt' | '$updatedAt' | 'userId'>>
): Promise<UserSRSettings | null> {
  try {
    const doc = await databases.updateDocument(
      DB_ID,
      SR_SETTINGS_COLLECTION,
      settingsId,
      data
    );
    return doc as unknown as UserSRSettings;
  } catch (error) {
    console.error('Error updating user SR settings:', error);
    return null;
  }
}

// ============================================================================
// DATABASE OPERATIONS - SPACED REPETITION ITEMS
// ============================================================================

/**
 * Get all SR items for a user
 */
export async function getUserSRItems(
  userId: string,
  statusFilter?: TopicStatus
): Promise<SpacedRepetitionItem[]> {
  try {
    const queries = [Query.equal('userId', userId), Query.limit(1000)];

    if (statusFilter) {
      queries.push(Query.equal('status', statusFilter));
    }

    const response = await databases.listDocuments(
      DB_ID,
      SR_COLLECTION,
      queries
    );

    return response.documents as unknown as SpacedRepetitionItem[];
  } catch (error) {
    console.error('Error getting SR items:', error);
    return [];
  }
}

/**
 * Get due items for a user
 */
export async function getDueItems(
  userId: string,
  maxItems: number = 20
): Promise<SpacedRepetitionItem[]> {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const response = await databases.listDocuments(
      DB_ID,
      SR_COLLECTION,
      [
        Query.equal('userId', userId),
        Query.equal('status', 'active'),
        Query.lessThanEqual('nextReviewDate', today.toISOString()),
        Query.orderAsc('nextReviewDate'),
        Query.limit(maxItems),
      ]
    );

    return response.documents as unknown as SpacedRepetitionItem[];
  } catch (error) {
    console.error('Error getting due items:', error);
    return [];
  }
}

/**
 * Check if a topic is already in SR
 */
export async function isTopicInSR(
  userId: string,
  topicId: string
): Promise<boolean> {
  try {
    const response = await databases.listDocuments(
      DB_ID,
      SR_COLLECTION,
      [
        Query.equal('userId', userId),
        Query.equal('topicId', topicId),
        Query.limit(1),
      ]
    );
    return response.documents.length > 0;
  } catch (error) {
    console.error('Error checking if topic is in SR:', error);
    return false;
  }
}

/**
 * Add a topic to spaced repetition
 */
export async function addTopicToSR(
  userId: string,
  topic: {
    topicId: string;
    topicName: string;
    subjectId: string;
    subjectName?: string;
    curriculumId: string;
    curriculumName?: string;
  },
  settings: UserSRSettings
): Promise<SpacedRepetitionItem | null> {
  try {
    // Check for duplicates first
    const exists = await isTopicInSR(userId, topic.topicId);
    if (exists) {
      console.warn('Topic already exists in SR');
      return null;
    }

    // Calculate first review date based on settings
    const intervals = getIntervalsForPattern(
      settings.selectedPatternId,
      settings.customIntervals
    );
    const firstInterval = intervals[0];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + firstInterval);
    nextReviewDate.setHours(0, 0, 0, 0);

    const doc = await databases.createDocument(
      DB_ID,
      SR_COLLECTION,
      ID.unique(),
      {
        userId,
        ...topic,
        ...DEFAULT_SR_ITEM,
        reviewMode: settings.reviewMode,
        patternId: settings.selectedPatternId,
        customIntervals: settings.customIntervals,
        interval: firstInterval,
        nextReviewDate: nextReviewDate.toISOString(),
      },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );

    return doc as unknown as SpacedRepetitionItem;
  } catch (error) {
    console.error('Error adding topic to SR:', error);
    return null;
  }
}

/**
 * Add multiple topics to SR
 */
export async function addMultipleTopicsToSR(
  userId: string,
  topics: Array<{
    topicId: string;
    topicName: string;
    subjectId: string;
    subjectName?: string;
    curriculumId: string;
    curriculumName?: string;
  }>,
  settings: UserSRSettings
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const topic of topics) {
    const result = await addTopicToSR(userId, topic, settings);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Update SR item after review (SM-2 mode)
 */
export async function updateSRItemSM2(
  itemId: string,
  item: SpacedRepetitionItem,
  quality: ReviewQuality
): Promise<SpacedRepetitionItem | null> {
  try {
    const { newEaseFactor, newInterval, newRepetitions, nextReviewDate } =
      calculateSM2Review(
        item.easeFactor,
        item.interval,
        item.repetitions,
        quality
      );

    const isCorrect = quality >= 3;

    const doc = await databases.updateDocument(
      DB_ID,
      SR_COLLECTION,
      itemId,
      {
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        nextReviewDate: nextReviewDate.toISOString(),
        lastReviewDate: new Date().toISOString(),
        totalReviews: item.totalReviews + 1,
        correctReviews: item.correctReviews + (isCorrect ? 1 : 0),
        emailReminderSent: false,
      }
    );

    return doc as unknown as SpacedRepetitionItem;
  } catch (error) {
    console.error('Error updating SR item (SM-2):', error);
    return null;
  }
}

/**
 * Update SR item after review (Custom Pattern mode)
 */
export async function updateSRItemCustom(
  itemId: string,
  item: SpacedRepetitionItem,
  isCorrect: boolean
): Promise<SpacedRepetitionItem | null> {
  try {
    const intervals = getIntervalsForPattern(
      item.patternId || 'standard',
      item.customIntervals
    );

    const { newInterval, nextReviewDate, newStep } = calculateCustomPatternReview(
      item.currentStep,
      intervals,
      isCorrect
    );

    const doc = await databases.updateDocument(
      DB_ID,
      SR_COLLECTION,
      itemId,
      {
        interval: newInterval,
        currentStep: newStep,
        nextReviewDate: nextReviewDate.toISOString(),
        lastReviewDate: new Date().toISOString(),
        totalReviews: item.totalReviews + 1,
        correctReviews: item.correctReviews + (isCorrect ? 1 : 0),
        emailReminderSent: false,
      }
    );

    return doc as unknown as SpacedRepetitionItem;
  } catch (error) {
    console.error('Error updating SR item (Custom):', error);
    return null;
  }
}

/**
 * Update SR item status
 */
export async function updateSRItemStatus(
  itemId: string,
  status: TopicStatus
): Promise<SpacedRepetitionItem | null> {
  try {
    const doc = await databases.updateDocument(
      DB_ID,
      SR_COLLECTION,
      itemId,
      { status }
    );
    return doc as unknown as SpacedRepetitionItem;
  } catch (error) {
    console.error('Error updating SR item status:', error);
    return null;
  }
}

/**
 * Delete SR item
 */
export async function deleteSRItem(itemId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      DB_ID,
      SR_COLLECTION,
      itemId
    );
    return true;
  } catch (error) {
    console.error('Error deleting SR item:', error);
    return false;
  }
}

/**
 * Reset SR item (restart from beginning)
 */
export async function resetSRItem(
  itemId: string,
  settings: UserSRSettings
): Promise<SpacedRepetitionItem | null> {
  try {
    const intervals = getIntervalsForPattern(
      settings.selectedPatternId,
      settings.customIntervals
    );
    const firstInterval = intervals[0];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + firstInterval);
    nextReviewDate.setHours(0, 0, 0, 0);

    const doc = await databases.updateDocument(
      DB_ID,
      SR_COLLECTION,
      itemId,
      {
        ...DEFAULT_SR_ITEM,
        interval: firstInterval,
        nextReviewDate: nextReviewDate.toISOString(),
        reviewMode: settings.reviewMode,
        patternId: settings.selectedPatternId,
        customIntervals: settings.customIntervals,
      }
    );

    return doc as unknown as SpacedRepetitionItem;
  } catch (error) {
    console.error('Error resetting SR item:', error);
    return null;
  }
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Calculate dashboard stats
 */
export async function calculateDashboardStats(
  userId: string
): Promise<{
  dueToday: number;
  totalActive: number;
  overallRetention: number;
  byStatus: { active: number; paused: number; completed: number; archived: number };
  upcomingReviews: { tomorrow: number; thisWeek: number; thisMonth: number };
}> {
  try {
    const items = await getUserSRItems(userId);
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(23, 59, 59, 999);

    // Count by status
    const byStatus = {
      active: 0,
      paused: 0,
      completed: 0,
      archived: 0,
    };

    // Calculate retention
    let totalReviews = 0;
    let correctReviews = 0;

    // Count due items
    let dueToday = 0;
    let dueTomorrow = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;

    items.forEach((item) => {
      // Status counts
      byStatus[item.status]++;

      // Retention
      totalReviews += item.totalReviews;
      correctReviews += item.correctReviews;

      // Due counts (only for active items)
      if (item.status === 'active') {
        const reviewDate = new Date(item.nextReviewDate);
        if (reviewDate <= today) dueToday++;
        else if (reviewDate <= tomorrow) dueTomorrow++;
        if (reviewDate <= nextWeek) dueThisWeek++;
        if (reviewDate <= nextMonth) dueThisMonth++;
      }
    });

    return {
      dueToday,
      totalActive: byStatus.active,
      overallRetention: calculateRetentionRate(correctReviews, totalReviews),
      byStatus,
      upcomingReviews: {
        tomorrow: dueTomorrow,
        thisWeek: dueThisWeek - dueToday,
        thisMonth: dueThisMonth - dueThisWeek,
      },
    };
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    return {
      dueToday: 0,
      totalActive: 0,
      overallRetention: 0,
      byStatus: { active: 0, paused: 0, completed: 0, archived: 0 },
      upcomingReviews: { tomorrow: 0, thisWeek: 0, thisMonth: 0 },
    };
  }
}

/**
 * Get statistics grouped by subject
 */
export async function getStatsBySubject(
  userId: string
): Promise<Array<{
  subjectId: string;
  subjectName: string;
  totalTopics: number;
  retentionRate: number;
  dueCount: number;
}>> {
  try {
    const items = await getUserSRItems(userId);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const subjectMap = new Map<
      string,
      {
        subjectId: string;
        subjectName: string;
        totalTopics: number;
        totalReviews: number;
        correctReviews: number;
        dueCount: number;
      }
    >();

    items.forEach((item) => {
      const existing = subjectMap.get(item.subjectId) || {
        subjectId: item.subjectId,
        subjectName: item.subjectName || 'Unknown Subject',
        totalTopics: 0,
        totalReviews: 0,
        correctReviews: 0,
        dueCount: 0,
      };

      existing.totalTopics++;
      existing.totalReviews += item.totalReviews;
      existing.correctReviews += item.correctReviews;

      if (
        item.status === 'active' &&
        new Date(item.nextReviewDate) <= today
      ) {
        existing.dueCount++;
      }

      subjectMap.set(item.subjectId, existing);
    });

    return Array.from(subjectMap.values()).map((stat) => ({
      subjectId: stat.subjectId,
      subjectName: stat.subjectName,
      totalTopics: stat.totalTopics,
      retentionRate: calculateRetentionRate(
        stat.correctReviews,
        stat.totalReviews
      ),
      dueCount: stat.dueCount,
    }));
  } catch (error) {
    console.error('Error getting stats by subject:', error);
    return [];
  }
}
