/**
 * Spaced Repetition System Types and Constants
 */

// Review Quality Ratings (for SM-2 algorithm)
export enum ReviewQuality {
  BLACKOUT = 0,    // Complete blackout, no recall
  INCORRECT = 1,   // Incorrect, remembered upon seeing answer
  HARD = 2,        // Incorrect, but answer felt familiar
  DIFFICULT = 3,   // Correct with significant difficulty
  GOOD = 4,        // Correct after some hesitation
  PERFECT = 5,     // Perfect response, no hesitation
}

// Review quality labels for UI
export const REVIEW_QUALITY_LABELS: Record<ReviewQuality, string> = {
  [ReviewQuality.BLACKOUT]: 'Blackout',
  [ReviewQuality.INCORRECT]: 'Wrong',
  [ReviewQuality.HARD]: 'Hard',
  [ReviewQuality.DIFFICULT]: 'Difficult',
  [ReviewQuality.GOOD]: 'Good',
  [ReviewQuality.PERFECT]: 'Perfect',
};

// Review quality colors for UI
export const REVIEW_QUALITY_COLORS: Record<ReviewQuality, string> = {
  [ReviewQuality.BLACKOUT]: '#ef4444',   // Red
  [ReviewQuality.INCORRECT]: '#ef4444',  // Red
  [ReviewQuality.HARD]: '#ef4444',       // Red
  [ReviewQuality.DIFFICULT]: '#f59e0b',  // Yellow/Orange
  [ReviewQuality.GOOD]: '#22c55e',       // Green
  [ReviewQuality.PERFECT]: '#22c55e',    // Green
};

// Review Mode Type
export type ReviewMode = 'sm2' | 'custom';

// Topic Status
export type TopicStatus = 'active' | 'paused' | 'completed' | 'archived';

// Preset Pattern Interface
export interface PresetPattern {
  id: string;
  name: string;
  description: string;
  intervals: number[];
}

// Preset Patterns for Fixed Intervals mode
export const PRESET_PATTERNS: PresetPattern[] = [
  {
    id: 'standard',
    name: 'Standard (1-4-7-14-30)',
    description: 'Classic spaced repetition pattern',
    intervals: [1, 4, 7, 14, 30, 60, 120],
  },
  {
    id: 'aggressive',
    name: 'Aggressive (1-2-4-7-14)',
    description: 'More frequent reviews for difficult material',
    intervals: [1, 2, 4, 7, 14, 30, 60],
  },
  {
    id: 'relaxed',
    name: 'Relaxed (1-7-14-30-60)',
    description: 'Longer intervals for easier material',
    intervals: [1, 7, 14, 30, 60, 90, 180],
  },
  {
    id: 'exam-prep',
    name: 'Exam Prep (1-2-3-5-7)',
    description: 'Intensive review for upcoming exams',
    intervals: [1, 2, 3, 5, 7, 10, 14],
  },
  {
    id: 'weekly',
    name: 'Weekly (7-14-21-28)',
    description: 'Review once a week pattern',
    intervals: [7, 14, 21, 28, 35, 42, 56],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own pattern',
    intervals: [1, 3, 7, 14, 30],
  },
];

// Spaced Repetition Item (from database)
export interface SpacedRepetitionItem {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  topicId: string;
  subjectId: string;
  curriculumId: string;
  topicName: string;
  subjectName?: string;
  curriculumName?: string;

  // SM-2 Algorithm Fields
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate?: string;

  // Review Tracking
  totalReviews: number;
  correctReviews: number;

  // Custom Pattern Fields
  reviewMode: ReviewMode;
  patternId?: string;
  customIntervals?: string;
  currentStep: number;

  // Status
  status: TopicStatus;
  emailReminderSent: boolean;
  pushReminderSent: boolean;
}

// User SR Settings (from database)
export interface UserSRSettings {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  emailRemindersEnabled: boolean;
  pushRemindersEnabled: boolean;
  reminderTime: string;
  timezone: string;
  maxDailyReviews: number;
  weekendReminders: boolean;
  reminderDaysBefore: number;
  reviewMode: ReviewMode;
  selectedPatternId: string;
  customIntervals?: string;
}

// Default SR Settings
export const DEFAULT_SR_SETTINGS: Omit<UserSRSettings, '$id' | '$createdAt' | '$updatedAt' | 'userId'> = {
  emailRemindersEnabled: false,
  pushRemindersEnabled: true,
  reminderTime: '09:00',
  timezone: 'UTC',
  maxDailyReviews: 20,
  weekendReminders: true,
  reminderDaysBefore: 0,
  reviewMode: 'custom',
  selectedPatternId: 'standard',
  customIntervals: '[1,4,7,14,30,60,120]',
};

// Default values for a new SR item
export const DEFAULT_SR_ITEM = {
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
  totalReviews: 0,
  correctReviews: 0,
  currentStep: 0,
  status: 'active' as TopicStatus,
  emailReminderSent: false,
  pushReminderSent: false,
};

// Review Session State
export interface ReviewSessionState {
  items: SpacedRepetitionItem[];
  currentIndex: number;
  showAnswer: boolean;
  sessionStats: {
    reviewed: number;
    correct: number;
    incorrect: number;
  };
  isComplete: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  dueToday: number;
  totalActive: number;
  overallRetention: number;
  streak: number;
  byStatus: {
    active: number;
    paused: number;
    completed: number;
    archived: number;
  };
  upcomingReviews: {
    tomorrow: number;
    thisWeek: number;
    thisMonth: number;
  };
}

// Common Timezones
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Europe/Moscow', label: 'Moscow Time' },
  { value: 'Asia/Dubai', label: 'Dubai (Gulf Standard Time)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Asia/Singapore', label: 'Singapore Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time' },
];
