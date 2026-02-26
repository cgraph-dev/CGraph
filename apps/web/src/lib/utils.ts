/**
 * General utility functions including class merging and date formatting.
 * @module lib/utils
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow as fnsFormatDistanceToNow } from 'date-fns';

/**
 * Utility function to merge Tailwind CSS classes
 * This is required by most 21st.dev / Magic UI / shadcn components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse a date value and return a Date object or null
 */
export function safeParseDate(value: unknown): Date | null {
  if (!value) return null;

  try {
    // type assertion: value is unknown, narrow to Date constructor-compatible types
     
    const date = new Date(value as string | number | Date);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Safely format distance to now, with fallback for invalid dates
 */
export function formatTimeAgo(
  value: unknown,
  options?: { addSuffix?: boolean; fallback?: string }
): string {
  const { addSuffix = true, fallback = 'Just now' } = options || {};
  const date = safeParseDate(value);

  if (!date) return fallback;

  try {
    return fnsFormatDistanceToNow(date, { addSuffix });
  } catch {
    return fallback;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Safely extract avatar border ID from an object that may have
 * either camelCase (avatarBorderId) or snake_case (avatar_border_id) property.
 * Handles API response inconsistencies without requiring 'as any' casts.
 */
export function getAvatarBorderId(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
   
  const record = obj as Record<string, unknown>; // safe downcast – runtime verified
  const borderId = record.avatarBorderId ?? record.avatar_border_id;
  return typeof borderId === 'string' ? borderId : null;
}
