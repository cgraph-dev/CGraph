/**
 * Forum Header Component
 *
 * Forum header with banner and key information
 */

import { useState } from 'react';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { VoteButtons } from './vote-buttons';
import { ForumStats } from './forum-stats';
import { ForumActions } from './forum-actions';
import { ForumIcon } from './forum-icon';
import { ForumHeaderCompact } from './forum-header-compact';
import { ForumHeaderHero } from './forum-header-hero';
import { copyCurrentUrl } from './utils';
import type { ForumHeaderProps } from './types';

/**
 * unknown for the forums module.
 */
/**
 * Forum Header component.
 */
export function ForumHeader({
  forum,
  onVote,
  onSubscribe,
  onJoin,
  onLeave,
  onShare,
  onSettings,
  onEditBanner,
  onEditIcon,
  onCreatePost,
  isSubscribed = false,
  isMember = false,
  canManage = false,
  variant = 'default',
  className = '',
}: ForumHeaderProps) {
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (!onVote || isVoting) return;
    setIsVoting(true);
    HapticFeedback.medium();
    try {
      const newValue = forum.userVote === value ? null : value;
      await onVote(newValue);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSubscribe = async () => {
    if (!onSubscribe || isSubscribing) return;
    setIsSubscribing(true);
    HapticFeedback.success();
    try {
      await onSubscribe();
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleJoin = async () => {
    if (isJoining) return;
    setIsJoining(true);
    HapticFeedback.success();
    try {
      if (isMember && onLeave) {
        await onLeave();
      } else if (onJoin) {
        await onJoin();
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyLink = () => {
    copyCurrentUrl();
    HapticFeedback.success();
    onShare?.();
    setShowMoreMenu(false);
  };

  const handleSettingsClick = () => {
    onSettings?.();
    setShowMoreMenu(false);
  };

  const actionsProps = {
    primaryColor,
    isMember,
    isSubscribed,
    canManage,
    isJoining,
    isSubscribing,
    showMoreMenu,
    onCreatePost,
    onJoin: handleJoin,
    onSubscribe: handleSubscribe,
    onSettings: handleSettingsClick,
    onCopyLink: handleCopyLink,
    onToggleMenu: () => setShowMoreMenu(!showMoreMenu),
  };

  const voteProps = {
    userVote: forum.userVote,
    score: forum.score,
    onVote: handleVote,
    isVoting,
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <ForumHeaderCompact
        forum={forum}
        primaryColor={primaryColor}
        isMember={isMember}
        isJoining={isJoining}
        onJoin={handleJoin}
        className={className}
      />
    );
  }

  // Hero variant
  if (variant === 'hero') {
    return (
      <ForumHeaderHero
        forum={forum}
        primaryColor={primaryColor}
        canManage={canManage}
        onEditBanner={onEditBanner}
        onEditIcon={onEditIcon}
        onVote={onVote ? handleVote : undefined}
        voteProps={onVote ? voteProps : undefined}
        actionsProps={actionsProps}
        className={className}
      />
    );
  }

  // Default variant
  return (
    <GlassCard variant="frosted" className={`overflow-hidden ${className}`}>
      {/* Banner */}
      {forum.bannerUrl && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={forum.bannerUrl}
            alt={`${forum.name} banner`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent" />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Vote Buttons */}
          {onVote && <VoteButtons {...voteProps} />}

          {/* Forum Icon */}
          <ForumIcon iconUrl={forum.iconUrl} name={forum.name} primaryColor={primaryColor} />

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h1 className="mb-1 text-2xl font-bold">{forum.name}</h1>
            {forum.description && (
              <p className="mb-3 line-clamp-2 text-sm text-gray-400">{forum.description}</p>
            )}
            <ForumStats memberCount={forum.memberCount} featured={forum.featured} />
          </div>

          {/* Actions */}
          <ForumActions {...actionsProps} />
        </div>
      </div>
    </GlassCard>
  );
}

export default ForumHeader;
