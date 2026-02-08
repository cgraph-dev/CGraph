import React, { useEffect, useState } from 'react';
import { createLogger } from '@/lib/logger';
import { useAnnouncementStore, type Announcement } from '@/modules/forums/store';
import { AnnouncementItem } from '@/modules/forums/components/AnnouncementItem';

const logger = createLogger('AnnouncementBanner');

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

export default AnnouncementBanner;
