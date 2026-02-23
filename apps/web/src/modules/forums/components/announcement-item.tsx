/**
 * Individual announcement item component.
 * @module
 */
import DOMPurify from 'dompurify';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { Announcement } from '@/modules/forums/store';
import {
  getAnnouncementStyle,
  getStyleClasses,
  getStyleIcon,
} from '@/modules/forums/components/announcementBannerStyles';

export interface AnnouncementItemProps {
  announcement: Announcement;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss?: () => void;
  collapsible: boolean;
}

/** Escape raw text so it can be safely rendered as HTML. */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function AnnouncementItem({
  announcement,
  isExpanded,
  onToggle,
  onDismiss,
  collapsible,
}: AnnouncementItemProps) {
  const style = getAnnouncementStyle(announcement);
  const styleClasses = getStyleClasses(style);
  const { icon: Icon, color: iconColor } = getStyleIcon(style);

  const isLongContent = announcement.content.length > 200;
  const shouldShowToggle = collapsible && isLongContent;

  return (
    <div className={`rounded-lg border ${styleClasses.container}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 ${styleClasses.header}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
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
