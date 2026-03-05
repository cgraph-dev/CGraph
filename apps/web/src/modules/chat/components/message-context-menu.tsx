/**
 * MessageContextMenu — right-click menu for chat messages using Radix ContextMenu.
 * @module chat/components/message-context-menu
 */
import { type ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui';

interface MessageContextMenuProps {
  children: ReactNode;
  isOwnMessage?: boolean;
  isPinned?: boolean;
  canPin?: boolean;
  onReply?: () => void;
  onCreateThread?: () => void;
  onMarkUnread?: () => void;
  onCopyText?: () => void;
  onCopyLink?: () => void;
  onPin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

/**
 * MessageContextMenu — wraps a message with a right-click context menu.
 */
export function MessageContextMenu({
  children,
  isOwnMessage = false,
  isPinned = false,
  canPin = false,
  onReply,
  onCreateThread,
  onMarkUnread,
  onCopyText,
  onCopyLink,
  onPin,
  onEdit,
  onDelete,
  onReport,
}: MessageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {/* ── Actions ─────────────────────────────── */}
        <ContextMenuItem onSelect={onReply} shortcut="R">
          Reply
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCreateThread}>
          Create Thread
        </ContextMenuItem>
        <ContextMenuItem onSelect={onMarkUnread}>
          Mark Unread
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* ── Clipboard ──────────────────────────── */}
        <ContextMenuItem onSelect={onCopyText} shortcut="⌘C">
          Copy Text
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCopyLink}>
          Copy Message Link
        </ContextMenuItem>

        {/* ── Moderation ─────────────────────────── */}
        {canPin && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={onPin}>
              {isPinned ? 'Unpin Message' : 'Pin Message'}
            </ContextMenuItem>
          </>
        )}

        {isOwnMessage && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={onEdit} shortcut="E">
              Edit Message
            </ContextMenuItem>
            <ContextMenuItem onSelect={onDelete} destructive shortcut="Del">
              Delete Message
            </ContextMenuItem>
          </>
        )}

        {!isOwnMessage && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={onReport} destructive>
              Report Message
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default MessageContextMenu;
