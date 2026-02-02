/**
 * Day Boundary Utilities for Night Owl Mode
 * 
 * Night owls who study past midnight want their late-night sessions
 * to count towards the previous day. This utility provides functions
 * to calculate the "logical day" based on a configurable reset hour.
 * 
 * Example: If dayResetHour is 4 (4:00 AM) and current time is 2:00 AM on Jan 2nd,
 * the logical day is still Jan 1st because the day hasn't "reset" yet.
 */

/**
 * Day reset hour options (0-6, representing 12 AM to 6 AM)
 */
export const DAY_RESET_OPTIONS = [
  { value: 0, label: '12:00 AM (Midnight)', shortLabel: '12 AM' },
  { value: 1, label: '1:00 AM', shortLabel: '1 AM' },
  { value: 2, label: '2:00 AM', shortLabel: '2 AM' },
  { value: 3, label: '3:00 AM', shortLabel: '3 AM' },
  { value: 4, label: '4:00 AM', shortLabel: '4 AM' },
  { value: 5, label: '5:00 AM', shortLabel: '5 AM' },
  { value: 6, label: '6:00 AM', shortLabel: '6 AM' },
] as const;

export type DayResetHour = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Get the start of the "logical day" based on the day reset hour.
 * 
 * @param dayResetHour - The hour at which the day resets (0-6)
 * @param date - The date/time to calculate from (defaults to now)
 * @returns Date object representing the start of the logical day
 * 
 * Example with dayResetHour = 4:
 * - If current time is 2:00 AM on Jan 2nd → returns 4:00 AM on Jan 1st
 * - If current time is 5:00 PM on Jan 2nd → returns 4:00 AM on Jan 2nd
 */
export function getDayStart(dayResetHour: DayResetHour = 0, date: Date = new Date()): Date {
  const result = new Date(date);
  
  // Set to the reset hour on the same day
  result.setHours(dayResetHour, 0, 0, 0);
  
  // If current time is before the reset hour, we're still in "yesterday"
  if (date.getHours() < dayResetHour) {
    result.setDate(result.getDate() - 1);
  }
  
  return result;
}

/**
 * Get the end of the "logical day" based on the day reset hour.
 * This is essentially the reset hour of the next day minus 1 millisecond.
 * 
 * @param dayResetHour - The hour at which the day resets (0-6)
 * @param date - The date/time to calculate from (defaults to now)
 * @returns Date object representing the end of the logical day
 */
export function getDayEnd(dayResetHour: DayResetHour = 0, date: Date = new Date()): Date {
  const dayStart = getDayStart(dayResetHour, date);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  dayEnd.setMilliseconds(-1);
  return dayEnd;
}

/**
 * Get the "logical date" string for a given timestamp.
 * Sessions that occur before the reset hour will be attributed to the previous day.
 * 
 * @param dayResetHour - The hour at which the day resets (0-6)
 * @param date - The date/time to get the logical date for
 * @returns The logical date in ISO format (YYYY-MM-DD)
 */
export function getLogicalDateString(dayResetHour: DayResetHour = 0, date: Date = new Date()): string {
  const dayStart = getDayStart(dayResetHour, date);
  return dayStart.toISOString().split('T')[0];
}

/**
 * Get a formatted date label for display, accounting for day boundaries.
 * 
 * @param dayResetHour - The hour at which the day resets (0-6)
 * @param date - The date/time to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string for the logical day
 */
export function getLogicalDateLabel(
  dayResetHour: DayResetHour = 0,
  date: Date = new Date(),
  options?: Intl.DateTimeFormatOptions
): string {
  const dayStart = getDayStart(dayResetHour, date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
  };
  return dayStart.toLocaleDateString(undefined, options || defaultOptions);
}

/**
 * Check if a given date falls within "today" based on the day reset hour.
 * 
 * @param dayResetHour - The hour at which the day resets (0-6)
 * @param date - The date to check
 * @returns True if the date is within today's logical boundaries
 */
export function isLogicalToday(dayResetHour: DayResetHour = 0, date: Date): boolean {
  const now = new Date();
  const todayStart = getDayStart(dayResetHour, now);
  const todayEnd = getDayEnd(dayResetHour, now);
  
  return date >= todayStart && date <= todayEnd;
}

/**
 * Group sessions by their logical day.
 * 
 * @param sessions - Array of sessions with endTime property
 * @param dayResetHour - The hour at which the day resets (0-6)
 * @returns Object with date strings as keys and arrays of sessions as values
 */
export function groupSessionsByDay<T extends { endTime: string }>(
  sessions: T[],
  dayResetHour: DayResetHour = 0
): Record<string, T[]> {
  return sessions.reduce((acc, session) => {
    const sessionDate = new Date(session.endTime);
    const logicalDate = getLogicalDateLabel(dayResetHour, sessionDate);
    
    if (!acc[logicalDate]) {
      acc[logicalDate] = [];
    }
    acc[logicalDate].push(session);
    
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate total duration for sessions that fall within "today".
 * 
 * @param sessions - Array of sessions with endTime and duration properties
 * @param dayResetHour - The hour at which the day resets (0-6)
 * @returns Total duration in seconds for today's sessions
 */
export function getTodaysDuration<T extends { endTime: string; duration: number }>(
  sessions: T[],
  dayResetHour: DayResetHour = 0
): number {
  return sessions
    .filter(session => isLogicalToday(dayResetHour, new Date(session.endTime)))
    .reduce((total, session) => total + (session.duration || 0), 0);
}

/**
 * Get the reset hour label for display.
 * 
 * @param dayResetHour - The hour value (0-6)
 * @returns Human-readable label like "4:00 AM"
 */
export function getResetHourLabel(dayResetHour: DayResetHour): string {
  const option = DAY_RESET_OPTIONS.find(opt => opt.value === dayResetHour);
  return option?.label || '12:00 AM (Midnight)';
}

/**
 * Get a short label for the reset hour.
 * 
 * @param dayResetHour - The hour value (0-6)
 * @returns Short label like "4 AM"
 */
export function getResetHourShortLabel(dayResetHour: DayResetHour): string {
  const option = DAY_RESET_OPTIONS.find(opt => opt.value === dayResetHour);
  return option?.shortLabel || '12 AM';
}
