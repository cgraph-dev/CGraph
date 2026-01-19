import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AvatarBorderRenderer } from '@/components/avatar/AvatarBorderRenderer';
import { AnimatedBadgeWithTooltip } from '@/components/badges/AnimatedBadge';
import { TitleBadge } from '@/components/gamification/TitleBadge';
import {
  useActiveProfileTheme,
  useProfileCardConfig,
  type ProfileTheme,
  type ProfileCardConfig,
  type ProfileHoverEffect,
} from '@/stores/profileThemeStore';
import type { Achievement } from '@/stores/gamificationStore';

/**
 * ProfileCard Component
 *
 * Renders user profile cards with:
 * - 7 different layout styles
 * - Customizable hover effects
 * - Animated badges and titles
 * - Theme-aware styling
 */

// ==================== TYPE DEFINITIONS ====================

export interface ProfileCardUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  // Gamification
  level: number;
  xp: number;
  xpToNextLevel: number;
  karma: number;
  streak: number;
  // Title/Badge
  equippedTitle?: {
    id: string;
    name: string;
    rarity: string;
    animation: { type: string; speed: number; intensity: number };
    color: string;
  };
  equippedBadges?: Achievement[];
  // Stats
  messageCount?: number;
  postCount?: number;
  friendCount?: number;
  forumCount?: number;
  // Social
  mutualFriends?: { id: string; username: string; avatarUrl: string }[];
  forumsInCommon?: { id: string; name: string }[];
  recentActivity?: { type: string; description: string; timestamp: string }[];
  socialLinks?: { platform: string; url: string }[];
  // Status
  isOnline: boolean;
  lastSeen?: string;
}

export interface ProfileCardProps {
  user: ProfileCardUser;
  theme?: ProfileTheme;
  cardConfig?: ProfileCardConfig;
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

// ==================== SIZE CONFIGURATIONS ====================

const SIZE_CONFIG = {
  sm: {
    avatar: 48,
    padding: 'p-3',
    titleSize: 'text-sm',
    textSize: 'text-xs',
  },
  md: {
    avatar: 64,
    padding: 'p-4',
    titleSize: 'text-base',
    textSize: 'text-sm',
  },
  lg: {
    avatar: 96,
    padding: 'p-6',
    titleSize: 'text-lg',
    textSize: 'text-base',
  },
};

// ==================== HOVER EFFECT VARIANTS ====================

const getHoverVariants = (effect: ProfileHoverEffect) => {
  switch (effect) {
    case 'scale':
      return {
        initial: { scale: 1 },
        hover: { scale: 1.02 },
        tap: { scale: 0.98 },
      };
    case 'tilt':
      return {
        initial: { rotateX: 0, rotateY: 0 },
        hover: { rotateX: 5, rotateY: 5 },
        tap: { scale: 0.98 },
      };
    case 'glow':
      return {
        initial: { boxShadow: '0 0 0 rgba(0,0,0,0)' },
        hover: { boxShadow: '0 0 30px var(--glow-color, rgba(34, 197, 94, 0.5))' },
        tap: { scale: 0.98 },
      };
    case 'border-animate':
      return {
        initial: { borderColor: 'transparent' },
        hover: { borderColor: 'var(--accent-color)' },
        tap: { scale: 0.98 },
      };
    default:
      return {
        initial: { scale: 1 },
        hover: { scale: 1 },
        tap: { scale: 1 },
      };
  }
};

// ==================== MAIN COMPONENT ====================

export const ProfileCard = memo(function ProfileCard({
  user,
  theme: propTheme,
  cardConfig: propConfig,
  className,
  onClick,
  size = 'md',
  interactive = true,
}: ProfileCardProps) {
  const storeTheme = useActiveProfileTheme();
  const storeConfig = useProfileCardConfig();

  const theme = propTheme ?? storeTheme;
  const config = propConfig ?? storeConfig;
  const sizeConfig = SIZE_CONFIG[size];

  const cardStyle = useMemo((): React.CSSProperties => {
    if (!theme) return {};

    const { colors, glassmorphism, borderRadius } = theme;
    const radiusMap = { none: '0', sm: '0.5rem', md: '0.75rem', lg: '1rem', full: '1.5rem' };

    return {
      '--glow-color': colors.accent,
      '--accent-color': colors.accent,
      backgroundColor: glassmorphism ? `${colors.surface}dd` : colors.surface,
      backdropFilter: glassmorphism ? 'blur(12px)' : 'none',
      border: `1px solid ${colors.accent}22`,
      borderRadius: radiusMap[borderRadius],
      color: colors.text,
      fontFamily: theme.fontFamily,
    } as React.CSSProperties;
  }, [theme]);

  const hoverVariants = theme ? getHoverVariants(theme.hoverEffect) : undefined;

  if (!config) {
    return null;
  }

  return (
    <motion.div
      className={cn('relative cursor-pointer overflow-hidden', sizeConfig.padding, className)}
      style={cardStyle}
      variants={hoverVariants}
      initial="initial"
      whileHover={interactive ? 'hover' : undefined}
      whileTap={interactive ? 'tap' : undefined}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Layout-specific content */}
      {config.layout === 'minimal' && (
        <MinimalLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'compact' && (
        <CompactLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'detailed' && (
        <DetailedLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'gaming' && (
        <GamingLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'social' && (
        <SocialLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'creator' && (
        <CreatorLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'custom' && (
        <DetailedLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}

      {/* Online status indicator */}
      {user.isOnline && (
        <div
          className="absolute right-2 top-2 h-3 w-3 rounded-full bg-green-500"
          style={{ boxShadow: '0 0 8px #22c55e' }}
        />
      )}
    </motion.div>
  );
});

// ==================== LAYOUT COMPONENTS ====================

interface LayoutProps {
  user: ProfileCardUser;
  config: ProfileCardConfig;
  sizeConfig: typeof SIZE_CONFIG.md;
  theme: ProfileTheme | null;
}

const MinimalLayout = memo(function MinimalLayout({
  user,
  config,
  sizeConfig,
  theme: _theme,
}: LayoutProps) {
  return (
    <div className="flex items-center gap-3">
      <AvatarBorderRenderer
        src={user.avatarUrl}
        alt={user.displayName}
        size={sizeConfig.avatar}
        interactive={false}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('truncate font-semibold', sizeConfig.titleSize)}>
            {user.displayName}
          </span>
        </div>
        {config.showTitle && user.equippedTitle && (
          <TitleBadge title={user.equippedTitle.id} size="sm" animated />
        )}
      </div>
    </div>
  );
});

const CompactLayout = memo(function CompactLayout({
  user,
  config,
  sizeConfig,
  theme,
}: LayoutProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <AvatarBorderRenderer
          src={user.avatarUrl}
          alt={user.displayName}
          size={sizeConfig.avatar}
          interactive={false}
        />
        {config.showLevel && (
          <div
            className="absolute -bottom-1 -right-1 rounded px-1.5 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: theme?.colors.accent || '#22c55e',
              color: '#000',
            }}
          >
            {user.level}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('truncate font-semibold', sizeConfig.titleSize)}>
            {user.displayName}
          </span>
        </div>
        {config.showTitle && user.equippedTitle && (
          <TitleBadge title={user.equippedTitle.id} size="sm" animated />
        )}
        {config.showBadges && user.equippedBadges && user.equippedBadges.length > 0 && (
          <div className="mt-1 flex gap-1">
            {user.equippedBadges.slice(0, config.maxBadges).map((badge) => (
              <AnimatedBadgeWithTooltip
                key={badge.id}
                achievement={badge}
                size="sm"
                showProgress={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const DetailedLayout = memo(function DetailedLayout({
  user,
  config,
  sizeConfig,
  theme,
}: LayoutProps) {
  const xpPercentage = (user.xp / user.xpToNextLevel) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <AvatarBorderRenderer
          src={user.avatarUrl}
          alt={user.displayName}
          size={sizeConfig.avatar}
          interactive={false}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('font-bold', sizeConfig.titleSize)}>{user.displayName}</span>
            <span className="text-sm opacity-60">@{user.username}</span>
          </div>
          {config.showTitle && user.equippedTitle && (
            <TitleBadge title={user.equippedTitle.id} size="sm" animated />
          )}
          {config.showBio && user.bio && (
            <p className={cn('mt-2 line-clamp-2 opacity-80', sizeConfig.textSize)}>{user.bio}</p>
          )}
        </div>
      </div>

      {/* Level & XP */}
      {(config.showLevel || config.showXp) && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Level {user.level}</span>
            <span>
              {user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()} XP
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: theme?.colors.accent + '33' || '#22c55e33' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: theme?.colors.accent || '#22c55e' }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      {config.showStats && (
        <div className="grid grid-cols-4 gap-2 text-center">
          {config.showKarma && (
            <StatItem label="Karma" value={user.karma} color={theme?.colors.accent} />
          )}
          {config.showStreak && (
            <StatItem label="Streak" value={user.streak} suffix="🔥" color={theme?.colors.accent} />
          )}
          <StatItem label="Posts" value={user.postCount || 0} color={theme?.colors.accent} />
          <StatItem label="Friends" value={user.friendCount || 0} color={theme?.colors.accent} />
        </div>
      )}

      {/* Badges */}
      {config.showBadges && user.equippedBadges && user.equippedBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {user.equippedBadges.slice(0, config.maxBadges).map((badge) => (
            <AnimatedBadgeWithTooltip
              key={badge.id}
              achievement={badge}
              size="md"
              showProgress={false}
            />
          ))}
        </div>
      )}

      {/* Social Links */}
      {config.showSocialLinks && user.socialLinks && user.socialLinks.length > 0 && (
        <div className="flex gap-2">
          {user.socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm opacity-60 transition-opacity hover:opacity-100"
            >
              {link.platform}
            </a>
          ))}
        </div>
      )}
    </div>
  );
});

const GamingLayout = memo(function GamingLayout({ user, config, sizeConfig, theme }: LayoutProps) {
  const xpPercentage = (user.xp / user.xpToNextLevel) * 100;

  return (
    <div className="space-y-3">
      {/* Avatar with level badge */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <AvatarBorderRenderer
            src={user.avatarUrl}
            alt={user.displayName}
            size={sizeConfig.avatar + 16}
            interactive={false}
          />
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-sm font-bold"
            style={{
              background: `linear-gradient(135deg, ${theme?.colors.primary || '#22c55e'}, ${theme?.colors.accent || '#4ade80'})`,
              boxShadow: `0 0 12px ${theme?.colors.accent || '#22c55e'}`,
            }}
          >
            LVL {user.level}
          </div>
        </div>
        <div className="flex-1">
          <div className={cn('font-bold', sizeConfig.titleSize)}>{user.displayName}</div>
          {config.showTitle && user.equippedTitle && (
            <TitleBadge title={user.equippedTitle.id} size="sm" animated />
          )}
        </div>
      </div>

      {/* XP Bar */}
      <div
        className="relative h-4 overflow-hidden rounded-full"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{
            background: `linear-gradient(90deg, ${theme?.colors.primary || '#22c55e'}, ${theme?.colors.accent || '#4ade80'})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${xpPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()}
        </div>
      </div>

      {/* Stats */}
      {config.showStats && (
        <div className="grid grid-cols-3 gap-2">
          <div
            className="rounded p-2 text-center"
            style={{ backgroundColor: theme?.colors.surface + '80' }}
          >
            <div className="text-lg font-bold" style={{ color: theme?.colors.accent }}>
              {user.karma}
            </div>
            <div className="text-xs opacity-60">KARMA</div>
          </div>
          <div
            className="rounded p-2 text-center"
            style={{ backgroundColor: theme?.colors.surface + '80' }}
          >
            <div className="text-lg font-bold" style={{ color: theme?.colors.accent }}>
              {user.streak}🔥
            </div>
            <div className="text-xs opacity-60">STREAK</div>
          </div>
          <div
            className="rounded p-2 text-center"
            style={{ backgroundColor: theme?.colors.surface + '80' }}
          >
            <div className="text-lg font-bold" style={{ color: theme?.colors.accent }}>
              {user.postCount || 0}
            </div>
            <div className="text-xs opacity-60">POSTS</div>
          </div>
        </div>
      )}

      {/* Achievements */}
      {config.showAchievements && user.equippedBadges && user.equippedBadges.length > 0 && (
        <div className="flex justify-center gap-2">
          {user.equippedBadges.slice(0, 5).map((badge) => (
            <AnimatedBadgeWithTooltip
              key={badge.id}
              achievement={badge}
              size="md"
              showProgress={false}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const SocialLayout = memo(function SocialLayout({ user, config, sizeConfig, theme }: LayoutProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AvatarBorderRenderer
          src={user.avatarUrl}
          alt={user.displayName}
          size={sizeConfig.avatar}
          interactive={false}
        />
        <div className="flex-1">
          <div className={cn('font-semibold', sizeConfig.titleSize)}>{user.displayName}</div>
          {config.showTitle && user.equippedTitle && (
            <TitleBadge title={user.equippedTitle.id} size="sm" animated />
          )}
        </div>
      </div>

      {/* Bio */}
      {config.showBio && user.bio && (
        <p className={cn('opacity-80', sizeConfig.textSize)}>{user.bio}</p>
      )}

      {/* Mutual Friends */}
      {config.showMutualFriends && user.mutualFriends && user.mutualFriends.length > 0 && (
        <div>
          <div className="mb-1 text-xs opacity-60">{user.mutualFriends.length} mutual friends</div>
          <div className="flex -space-x-2">
            {user.mutualFriends.slice(0, 5).map((friend) => (
              <img
                key={friend.id}
                src={friend.avatarUrl}
                alt={friend.username}
                className="h-6 w-6 rounded-full border-2"
                style={{ borderColor: theme?.colors.surface }}
              />
            ))}
            {user.mutualFriends.length > 5 && (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                style={{ backgroundColor: theme?.colors.accent, color: '#000' }}
              >
                +{user.mutualFriends.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forums in Common */}
      {config.showForumsInCommon && user.forumsInCommon && user.forumsInCommon.length > 0 && (
        <div>
          <div className="mb-1 text-xs opacity-60">
            {user.forumsInCommon.length} forums in common
          </div>
          <div className="flex flex-wrap gap-1">
            {user.forumsInCommon.slice(0, 3).map((forum) => (
              <span
                key={forum.id}
                className="rounded px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: theme?.colors.accent + '22',
                  color: theme?.colors.accent,
                }}
              >
                {forum.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {config.showRecentActivity && user.recentActivity && user.recentActivity.length > 0 && (
        <div className="text-xs opacity-60">Last active: {user.recentActivity[0]?.description}</div>
      )}
    </div>
  );
});

const CreatorLayout = memo(function CreatorLayout({
  user,
  config,
  sizeConfig,
  theme,
}: LayoutProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <AvatarBorderRenderer
          src={user.avatarUrl}
          alt={user.displayName}
          size={sizeConfig.avatar + 24}
          interactive={false}
          className="mx-auto"
        />
        <div className={cn('mt-2 font-bold', sizeConfig.titleSize)}>{user.displayName}</div>
        {config.showTitle && user.equippedTitle && (
          <div className="flex justify-center">
            <TitleBadge title={user.equippedTitle.id} size="md" animated />
          </div>
        )}
      </div>

      {/* Bio */}
      {config.showBio && user.bio && (
        <p className={cn('text-center opacity-80', sizeConfig.textSize)}>{user.bio}</p>
      )}

      {/* Creator Stats */}
      {config.showStats && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold" style={{ color: theme?.colors.accent }}>
              {user.postCount?.toLocaleString() || 0}
            </div>
            <div className="text-xs opacity-60">Posts</div>
          </div>
          <div>
            <div className="text-xl font-bold" style={{ color: theme?.colors.accent }}>
              {user.karma.toLocaleString()}
            </div>
            <div className="text-xs opacity-60">Karma</div>
          </div>
          <div>
            <div className="text-xl font-bold" style={{ color: theme?.colors.accent }}>
              {user.friendCount?.toLocaleString() || 0}
            </div>
            <div className="text-xs opacity-60">Followers</div>
          </div>
        </div>
      )}

      {/* Badges */}
      {config.showBadges && user.equippedBadges && user.equippedBadges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {user.equippedBadges.slice(0, config.maxBadges).map((badge) => (
            <AnimatedBadgeWithTooltip
              key={badge.id}
              achievement={badge}
              size="md"
              showProgress={false}
            />
          ))}
        </div>
      )}

      {/* Social Links */}
      {config.showSocialLinks && user.socialLinks && user.socialLinks.length > 0 && (
        <div className="flex justify-center gap-3">
          {user.socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-2 transition-colors"
              style={{
                backgroundColor: theme?.colors.accent + '22',
                color: theme?.colors.accent,
              }}
            >
              {link.platform}
            </a>
          ))}
        </div>
      )}
    </div>
  );
});

// ==================== HELPER COMPONENTS ====================

interface StatItemProps {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
}

const StatItem = memo(function StatItem({ label, value, suffix = '', color }: StatItemProps) {
  return (
    <div className="rounded p-2" style={{ backgroundColor: color + '11' }}>
      <div className="font-bold" style={{ color }}>
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
});

export default ProfileCard;
