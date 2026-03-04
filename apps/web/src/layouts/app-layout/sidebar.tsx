/**
 * Sidebar Component - Responsive navigation sidebar with badges
 * @module layouts/app-layout
 */
import { durations, LAYOUT_IDS } from '@cgraph/animation-constants';
import { NavLink, type Location } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedLogo from '@/components/navigation/animated-logo';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getAvatarBorderId } from '@/lib/utils';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ArrowRightOnRectangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { PresenceStatusSelector } from '@/shared/components/presence-status-selector';
import type { User } from '@/modules/auth/store';
import type { NavItem } from './constants';
import { tweens, loop, springs, staggerConfigs } from '@/lib/animation-presets';
import { useLevelGate } from '@/modules/gamification/hooks/useLevelGate';
import type { FeatureGateKey } from '@cgraph/shared-types';
import { useMotionSafe } from '@/hooks/useMotionSafe';

/**
 * Lock badge overlay for level-gated nav items.
 * Shows a small lock icon with tooltip when the feature is locked.
 */
function NavItemGateBadge({ feature }: { feature: FeatureGateKey }) {
  const { unlocked, requiredLevel } = useLevelGate(feature);

  if (unlocked) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -right-1 -top-1 z-30 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg"
      title={`Unlock at Level ${requiredLevel}`}
      style={{
        boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
      }}
    >
      <LockClosedIcon className="h-2.5 w-2.5 text-white" />
    </motion.div>
  );
}

interface SidebarProps {
  user: User | null;
  location: Location;
  handleLogout: () => void;
  totalUnread: number;
  unreadCount: number;
  navItems: NavItem[];
}

/**
 * Sidebar component.
 */
export default function Sidebar({
  user,
  location,
  handleLogout,
  totalUnread,
  unreadCount,
  navItems,
}: SidebarProps) {
  const { shouldAnimate } = useMotionSafe();

  return (
    <aside
      className="relative z-10 flex w-20 flex-col items-center overflow-hidden border-r border-white/[0.06] bg-[rgba(13,17,23,0.85)] py-4 backdrop-blur-xl backdrop-saturate-[1.6]"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Subtle glass edge highlight */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-px"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(147,197,253,0.3) 25%, rgba(196,181,253,0.3) 50%, rgba(134,239,172,0.3) 75%, transparent 100%)',
          backgroundSize: '100% 200%',
          animation: 'sidebar-border-flow 4s linear infinite',
        }}
      />

      {/* Ambient glow effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgb(var(--lg-glow-blue))]/5 via-transparent to-[rgb(var(--lg-glow-purple))]/5" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: durations.epic.ms / 1000 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Logo - Links back to landing page */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...springs.bouncy, delay: 0.1 }}
      >
        <a href="https://www.cgraph.org" title="Back to Home">
          <motion.div
            whileHover={{
              scale: 1.1,
              rotate: 5,
              filter:
                'drop-shadow(0 0 12px rgba(139,92,246,0.7)) drop-shadow(0 0 24px rgba(6,182,212,0.3))',
            }}
            whileTap={{ scale: 0.95 }}
            transition={springs.snappy}
            role="img"
            aria-label="CGraph logo - Click to go home"
          >
            <AnimatedLogo size="sm" />
          </motion.div>
        </a>
      </motion.div>

      {/* Navigation */}
      <nav className="relative z-10 flex flex-1 flex-col items-center gap-2" aria-label="Primary">
        {navItems.map((item, index) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                ...springs.bouncy,
                delay: 0.1 + index * staggerConfigs.grid.staggerChildren,
              }}
            >
              <NavLink
                to={item.path}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => HapticFeedback.light()}
                title={item.label}
                className="relative block"
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  transition={springs.snappy}
                  className="relative"
                >
                  {isActive ? (
                    <GlassCard
                      variant="neon"
                      glow
                      glowColor="rgba(16, 185, 129, 0.6)"
                      className="flex h-12 w-12 items-center justify-center rounded-xl p-0"
                    >
                      <div className="relative z-10">
                        <Icon
                          className="h-6 w-6 text-white drop-shadow-lg"
                          style={{
                            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))',
                          }}
                        />
                      </div>
                    </GlassCard>
                  ) : (
                    <div className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-gray-400 transition-all duration-200 hover:text-white">
                      {/* Hover glow effect */}
                      <motion.div
                        className="absolute inset-0 rounded-xl border border-white/[0.04] bg-white/[0.06] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        initial={false}
                      />
                      <Icon className="relative z-10 h-6 w-6 transition-transform group-hover:scale-110" />
                    </div>
                  )}

                  {/* Badge for messages */}
                  <AnimatePresence>
                    {item.path === '/messages' && totalUnread > 0 && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        className="absolute -right-1 -top-1 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600 px-1 text-xs font-bold text-white shadow-lg"
                        style={{
                          boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
                        }}
                      >
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Badge for social (notifications) */}
                  <AnimatePresence>
                    {item.path === '/social' && unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        className="absolute -right-1 -top-1 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600 px-1 text-xs font-bold text-white shadow-lg"
                        style={{
                          boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator line */}
                  {isActive && (
                    <motion.div
                      className="absolute -left-3 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-500"
                      layoutId={LAYOUT_IDS.sidebarActiveIndicator}
                      initial={false}
                      transition={shouldAnimate ? springs.bouncy : { duration: 0 }}
                      style={{
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
                      }}
                    />
                  )}

                  {/* Level gate lock badge */}
                  {'featureGate' in item && item.featureGate && (
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- safe: guarded by `in` check
                    <NavItemGateBadge feature={item.featureGate as FeatureGateKey} />
                  )}
                </motion.div>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* User Avatar & Logout */}
      <div className="relative z-10 mt-auto space-y-2" role="group" aria-label="User actions">
        {/* Logout Button */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={springs.snappy}
        >
          <button
            onClick={() => {
              HapticFeedback.medium();
              handleLogout();
            }}
            className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-gray-400 transition-all hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-dark-800"
            title="Logout"
            aria-label="Logout from your account"
          >
            {/* Hover glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-600/20 via-pink-600/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              initial={false}
            />
            <ArrowRightOnRectangleIcon
              className="relative z-10 h-6 w-6 transition-all group-hover:scale-110"
              aria-hidden="true"
              style={{
                filter: 'drop-shadow(0 0 0 transparent)',
                transition: 'filter 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'drop-shadow(0 0 0 transparent)';
              }}
            />
          </button>
        </motion.div>

        {/* User Avatar */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={springs.snappy}
          className="relative"
        >
          <div
            className="h-12 w-12 cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 p-0.5"
            role="img"
            aria-label={`Your profile picture: ${user?.displayName || user?.username || 'User'}`}
          >
            {user?.avatarUrl ? (
              <ThemedAvatar
                src={user.avatarUrl}
                alt={user.displayName || user.username || 'User avatar'}
                size="medium"
                className="h-full w-full rounded-lg"
                avatarBorderId={getAvatarBorderId(user)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-purple-700 text-lg font-bold">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Pulsing glow around avatar */}
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary-500/40"
            animate={{
              boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.6)', '0 0 0 8px rgba(16, 185, 129, 0)'],
            }}
            transition={loop(tweens.ambientSlow)}
          />
        </motion.div>

        {/* Presence Status Selector */}
        <PresenceStatusSelector compact />
      </div>
    </aside>
  );
}
