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
