/**
 * ChatIdentityCard — lightweight avatar wrapper that adds cosmetic border framing.
 *
 * Used inline within message-group to display a user's equipped border
 * around their chat avatar. If no border is equipped, renders the avatar as-is.
 *
 * @module modules/chat/components/chat-identity-card
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useChatIdentity } from '../hooks/useChatIdentity';
import { Avatar } from '@/components/ui';

// ── Types ──────────────────────────────────────────────────────────────

interface ChatIdentityCardProps {
  userId: string;
  avatarUrl?: string | null;
  avatarName: string;
  avatarSize?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────

/**
 * Renders a chat avatar wrapped with the user's equipped cosmetic border.
 * Falls back to a plain avatar if no border is equipped.
 */
export function ChatIdentityCard({
  userId,
  avatarUrl,
  avatarName,
  avatarSize = 'lg',
  children,
}: ChatIdentityCardProps) {
  const { border } = useChatIdentity(userId);

  if (!border) {
    return (
      <>
        <Avatar src={avatarUrl} name={avatarName} size={avatarSize} status="online" />
        {children}
      </>
    );
  }

  return (
    <>
      <div
        className={cn('rounded-full p-[2px]')}
        style={{
          border: `2px ${border.border_style} ${border.primaryColor}`,
        }}
      >
        <Avatar src={avatarUrl} name={avatarName} size={avatarSize} status="online" />
      </div>
      {children}
    </>
  );
}

export default ChatIdentityCard;
