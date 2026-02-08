import {
  MegaphoneIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { Announcement } from '@/modules/forums/store';

export type AnnouncementStyle = 'info' | 'warning' | 'success' | 'error' | 'default';

export interface AnnouncementStyleClasses {
  container: string;
  header: string;
  title: string;
  content: string;
  readMore: string;
}

const STYLE_CLASS_MAP: Record<AnnouncementStyle, AnnouncementStyleClasses> = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    header: 'text-blue-800 dark:text-blue-200',
    title: 'text-blue-900 dark:text-blue-100',
    content: 'text-blue-700 dark:text-blue-300',
    readMore: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    header: 'text-yellow-800 dark:text-yellow-200',
    title: 'text-yellow-900 dark:text-yellow-100',
    content: 'text-yellow-700 dark:text-yellow-300',
    readMore: 'text-yellow-600 dark:text-yellow-400',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    header: 'text-green-800 dark:text-green-200',
    title: 'text-green-900 dark:text-green-100',
    content: 'text-green-700 dark:text-green-300',
    readMore: 'text-green-600 dark:text-green-400',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    header: 'text-red-800 dark:text-red-200',
    title: 'text-red-900 dark:text-red-100',
    content: 'text-red-700 dark:text-red-300',
    readMore: 'text-red-600 dark:text-red-400',
  },
  default: {
    container: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    header: 'text-gray-800 dark:text-gray-200',
    title: 'text-gray-900 dark:text-gray-100',
    content: 'text-gray-700 dark:text-gray-300',
    readMore: 'text-gray-600 dark:text-gray-400',
  },
};

const STYLE_ICON_MAP: Record<AnnouncementStyle, { icon: typeof MegaphoneIcon; color: string }> = {
  info: { icon: InformationCircleIcon, color: 'text-blue-500' },
  warning: { icon: ExclamationTriangleIcon, color: 'text-yellow-500' },
  success: { icon: CheckCircleIcon, color: 'text-green-500' },
  error: { icon: ExclamationTriangleIcon, color: 'text-red-500' },
  default: { icon: MegaphoneIcon, color: 'text-gray-500' },
};

/** Determine visual style from announcement properties. */
export function getAnnouncementStyle(announcement: Announcement): AnnouncementStyle {
  if (announcement.backgroundColor) {
    if (announcement.backgroundColor.includes('red')) return 'error';
    if (
      announcement.backgroundColor.includes('yellow') ||
      announcement.backgroundColor.includes('orange')
    )
      return 'warning';
    if (announcement.backgroundColor.includes('green')) return 'success';
    if (announcement.backgroundColor.includes('blue')) return 'info';
  }

  const titleLower = announcement.title.toLowerCase();
  if (titleLower.includes('warning') || titleLower.includes('important')) return 'warning';
  if (titleLower.includes('error') || titleLower.includes('critical')) return 'error';
  if (titleLower.includes('success') || titleLower.includes('complete')) return 'success';

  return 'default';
}

/** Get Tailwind classes for the given style variant. */
export function getStyleClasses(style: AnnouncementStyle): AnnouncementStyleClasses {
  return STYLE_CLASS_MAP[style];
}

/** Get the icon component and color for the given style variant. */
export function getStyleIcon(style: AnnouncementStyle) {
  return STYLE_ICON_MAP[style];
}
