import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AnnouncementBanner');
import {
  MegaphoneIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAnnouncementStore, type Announcement } from '@/modules/forums/store';

/**
 * AnnouncementBanner Component
 *
 * MyBB-style announcement banner that displays at the top of forums.
 * Features:
 * - Global and forum-specific announcements
 * - Collapsible content
 * - Dismissible with localStorage persistence
 * - Multiple style variants (info, warning, success, etc.)
 */

type AnnouncementStyle = 'info' | 'warning' | 'success' | 'error' | 'default';

interface AnnouncementBannerProps {
  forumId?: string; // If provided, show forum-specific announcements
  showGlobal?: boolean;
  maxVisible?: number;
  collapsible?: boolean;
  dismissible?: boolean;
  className?: string;
}

export function AnnouncementBanner({
  forumId,
  showGlobal = true,
  maxVisible = 3,
  collapsible = true,
  dismissible = true,
  className = '',
}: AnnouncementBannerProps) {
  const {
    globalAnnouncements,
    forumAnnouncements,
    fetchGlobalAnnouncements,
    fetchForumAnnouncements,
    markAsRead,
  } = useAnnouncementStore();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissedAnnouncements');
    if (stored) {
      try {
        setDismissedIds(new Set(JSON.parse(stored)));
      } catch (e) {
        logger.error('Failed to parse dismissed announcements:', e);
      }
    }
  }, []);

  // Fetch announcements
  useEffect(() => {
    async function loadAnnouncements() {
      setIsLoading(true);
      try {
        const promises: Promise<void>[] = [];
        if (showGlobal) {
          promises.push(fetchGlobalAnnouncements());
        }
        if (forumId) {
          promises.push(fetchForumAnnouncements(forumId));
        }
        await Promise.all(promises);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnnouncements();
  }, [showGlobal, forumId, fetchGlobalAnnouncements, fetchForumAnnouncements]);

  // Combine and filter announcements
  const announcements = React.useMemo(() => {
    let all: Announcement[] = [];

    if (showGlobal) {
      all = [...globalAnnouncements];
    }

    if (forumId) {
      const forumSpecific = forumAnnouncements.get(forumId) || [];
      all = [...all, ...forumSpecific];
    }

    // Filter out dismissed
    return all.filter((a) => !dismissedIds.has(a.id)).slice(0, maxVisible);
  }, [globalAnnouncements, forumAnnouncements, forumId, showGlobal, dismissedIds, maxVisible]);

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify([...newDismissed]));
    markAsRead(id);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  if (isLoading || announcements.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {announcements.map((announcement) => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          isExpanded={expandedIds.has(announcement.id)}
          onToggle={() => toggleExpanded(announcement.id)}
          onDismiss={dismissible ? () => handleDismiss(announcement.id) : undefined}
          collapsible={collapsible}
        />
      ))}
    </div>
  );
}

// Individual Announcement Item
interface AnnouncementItemProps {
  announcement: Announcement;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss?: () => void;
  collapsible: boolean;
}

function AnnouncementItem({
  announcement,
  isExpanded,
  onToggle,
  onDismiss,
  collapsible,
}: AnnouncementItemProps) {
  // Determine style based on announcement properties
  const style = getAnnouncementStyle(announcement);
  const styleClasses = getStyleClasses(style);

  const isLongContent = announcement.content.length > 200;
  const shouldShowToggle = collapsible && isLongContent;

  return (
    <div className={`rounded-lg border ${styleClasses.container}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 ${styleClasses.header}`}>
        <StyleIcon style={style} />
        <h4 className={`flex-1 font-semibold ${styleClasses.title}`}>{announcement.title}</h4>
        <div className="flex items-center gap-2">
          {shouldShowToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="rounded p-1 transition-colors hover:bg-black/10"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded p-1 transition-colors hover:bg-black/10"
              title="Dismiss"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={`px-4 pb-3 ${styleClasses.content} ${
          shouldShowToggle && !isExpanded ? 'relative max-h-20 overflow-hidden' : ''
        }`}
      >
        {/* Render content - could use BBCode renderer here */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: announcement.allowHtml
              ? DOMPurify.sanitize(announcement.content, { USE_PROFILES: { html: true } })
              : escapeHtml(announcement.content).replace(/\n/g, '<br/>'),
          }}
        />

        {/* Fade overlay for collapsed long content */}
        {shouldShowToggle && !isExpanded && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-gray-800" />
        )}
      </div>

      {/* Read more button for collapsed content */}
      {shouldShowToggle && !isExpanded && (
        <button
          type="button"
          onClick={onToggle}
          className={`w-full py-2 text-sm font-medium transition-colors hover:bg-black/5 ${styleClasses.readMore}`}
        >
          Read more
        </button>
      )}
    </div>
  );
}

// Helper: Determine style from announcement
function getAnnouncementStyle(announcement: Announcement): AnnouncementStyle {
  if (announcement.backgroundColor) {
    // Try to infer from custom color
    if (announcement.backgroundColor.includes('red')) return 'error';
    if (
      announcement.backgroundColor.includes('yellow') ||
      announcement.backgroundColor.includes('orange')
    )
      return 'warning';
    if (announcement.backgroundColor.includes('green')) return 'success';
    if (announcement.backgroundColor.includes('blue')) return 'info';
  }

  // Check title for keywords
  const titleLower = announcement.title.toLowerCase();
  if (titleLower.includes('warning') || titleLower.includes('important')) return 'warning';
  if (titleLower.includes('error') || titleLower.includes('critical')) return 'error';
  if (titleLower.includes('success') || titleLower.includes('complete')) return 'success';

  return 'default';
}

// Helper: Get Tailwind classes for style
function getStyleClasses(style: AnnouncementStyle) {
  switch (style) {
    case 'info':
      return {
        container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        header: 'text-blue-800 dark:text-blue-200',
        title: 'text-blue-900 dark:text-blue-100',
        content: 'text-blue-700 dark:text-blue-300',
        readMore: 'text-blue-600 dark:text-blue-400',
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        header: 'text-yellow-800 dark:text-yellow-200',
        title: 'text-yellow-900 dark:text-yellow-100',
        content: 'text-yellow-700 dark:text-yellow-300',
        readMore: 'text-yellow-600 dark:text-yellow-400',
      };
    case 'success':
      return {
        container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        header: 'text-green-800 dark:text-green-200',
        title: 'text-green-900 dark:text-green-100',
        content: 'text-green-700 dark:text-green-300',
        readMore: 'text-green-600 dark:text-green-400',
      };
    case 'error':
      return {
        container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        header: 'text-red-800 dark:text-red-200',
        title: 'text-red-900 dark:text-red-100',
        content: 'text-red-700 dark:text-red-300',
        readMore: 'text-red-600 dark:text-red-400',
      };
    default:
      return {
        container: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        header: 'text-gray-800 dark:text-gray-200',
        title: 'text-gray-900 dark:text-gray-100',
        content: 'text-gray-700 dark:text-gray-300',
        readMore: 'text-gray-600 dark:text-gray-400',
      };
  }
}

// Helper: Get icon for style
function StyleIcon({ style }: { style: AnnouncementStyle }) {
  switch (style) {
    case 'info':
      return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    case 'warning':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    case 'success':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'error':
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    default:
      return <MegaphoneIcon className="h-5 w-5 text-gray-500" />;
  }
}

// Helper: Escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default AnnouncementBanner;
