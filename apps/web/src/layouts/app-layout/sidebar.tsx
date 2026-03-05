/**
 * Sidebar Component - Responsive navigation sidebar with badges
 * @module layouts/app-layout
 */
import { NavLink, type Location } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogoIcon } from '@/components/logo/logo-icon';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getAvatarBorderId } from '@/lib/utils';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ArrowRightOnRectangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { PresenceStatusSelector } from '@/shared/components/presence-status-selector';
import type { User } from '@/modules/auth/store';
import type { NavItem } from './constants';
import { loop, springs } from '@/lib/animation-presets';
import { useLevelGate } from '@/modules/gamification/hooks/useLevelGate';
import type { FeatureGateKey } from '@cgraph/shared-types';
import { useState } from 'react';

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
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  return (
    <aside
      className="relative z-10 flex w-[72px] flex-col items-center overflow-hidden border-r border-white/[0.06] bg-[rgba(10,14,20,0.92)] py-4 backdrop-blur-2xl backdrop-saturate-[1.8]"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Glass edge highlight */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-px"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(147,197,253,0.35) 20%, rgba(139,92,246,0.4) 50%, rgba(16,185,129,0.35) 80%, transparent 100%)',
          backgroundSize: '100% 200%',
          animation: 'sidebar-border-flow 4s linear infinite',
        }}
      />

      {/* Inner edge shadow for depth */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-white/[0.02] to-transparent" />

      {/* Ambient glow effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgb(var(--lg-glow-blue))]/8 via-transparent to-[rgb(var(--lg-glow-purple))]/6" />

      {/* Subtle noise texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")' }} />

      {/* ── User Avatar (top) ── */}
      <div className="relative z-10 mb-1" role="group" aria-label="User profile">
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={springs.snappy}
          className="relative"
        >
          <div
            className="h-11 w-11 cursor-pointer overflow-hidden rounded-xl p-[2px]"
            role="img"
            aria-label={`Your profile picture: ${user?.displayName || user?.username || 'User'}`}
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.7), rgba(139,92,246,0.7))',
            }}
          >
            {user?.avatarUrl ? (
              <ThemedAvatar
                src={user.avatarUrl}
                alt={user.displayName || user.username || 'User avatar'}
                size="medium"
                className="h-full w-full rounded-[10px]"
                avatarBorderId={getAvatarBorderId(user)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[rgba(13,17,23,0.9)] text-base font-semibold text-gray-200">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Online ring pulse */}
          <motion.div
            className="pointer-events-none absolute -inset-0.5 rounded-xl"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(16, 185, 129, 0.4)',
                '0 0 0 6px rgba(16, 185, 129, 0)',
              ],
            }}
            transition={loop({ duration: 2.5, ease: 'easeOut' })}
          />
        </motion.div>

        {/* Presence Status Selector */}
        <div className="mt-1.5">
          <PresenceStatusSelector compact />
        </div>
      </div>

      {/* Section divider */}
      <div className="mb-3 h-px w-10 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Navigation ── */}
      <nav className="relative z-10 flex flex-1 flex-col items-center gap-1.5" aria-label="Primary">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = isActive ? item.activeIcon : item.icon;
          const isHovered = hoveredNav === item.path;

          return (
            <div
              key={item.path}
              onMouseEnter={() => setHoveredNav(item.path)}
              onMouseLeave={() => setHoveredNav(null)}
            >
              <NavLink
                to={item.path}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => HapticFeedback.light()}
                className="relative block"
              >
                <motion.div
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl"
                  whileTap={{ scale: 0.88 }}
                  animate={isActive
                    ? { scale: 1 }
                    : { scale: 1 }
                  }
                  transition={springs.snappy}
                >
                  {/* Active background — clean rounded rect, no glow */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 rounded-xl bg-white/[0.1] ring-1 ring-white/[0.12]"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                  )}

                  {/* Hover background (inactive items only) */}
                  {!isActive && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        initial={false}
                        animate={{
                          opacity: isHovered ? 1 : 0,
                          background: isHovered
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(139,92,246,0.04) 100%)'
                            : 'linear-gradient(135deg, transparent 0%, transparent 100%)',
                        }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-xl border"
                        initial={false}
                        animate={{
                          borderColor: isHovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0)',
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </>
                  )}

                  {/* Icon */}
                  <motion.div
                    className="relative z-10"
                    animate={isActive
                      ? { scale: 1, y: 0 }
                      : { scale: 1, y: 0 }
                    }
                    initial={false}
                  >
                    <Icon
                      className={`h-[22px] w-[22px] transition-colors duration-200 ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-500 group-hover:text-gray-200'
                      }`}
                      style={isActive ? {} : undefined}
                    />
                  </motion.div>

                  {/* Tooltip label */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, x: -4, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -4, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2"
                      >
                        <div className="whitespace-nowrap rounded-lg border border-white/10 bg-[rgba(20,24,33,0.95)] px-2.5 py-1 text-xs font-medium text-gray-300 shadow-xl backdrop-blur-sm">
                          {item.label}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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

                  {/* Level gate lock badge */}
                  {'featureGate' in item && item.featureGate && (
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- safe: guarded by `in` check
                    <NavItemGateBadge feature={item.featureGate as FeatureGateKey} />
                  )}
                </motion.div>
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Section divider */}
      <div className="mb-3 mt-auto h-px w-10 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Logout + Logo (bottom) ── */}
      <div className="relative z-10 space-y-3" role="group" aria-label="Bottom actions">
        {/* Logout Button */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={springs.snappy}
        >
          <button
            onClick={() => {
              HapticFeedback.medium();
              handleLogout();
            }}
            className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-gray-500 transition-colors duration-200 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-dark-800"
            title="Logout"
            aria-label="Logout from your account"
          >
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-600/10 via-pink-600/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              initial={false}
            />
            <motion.div
              className="absolute inset-0 rounded-xl border border-red-500/0 transition-colors duration-300 group-hover:border-red-500/15"
              initial={false}
            />
            <ArrowRightOnRectangleIcon
              className="relative z-10 h-5 w-5 transition-all duration-200 group-hover:scale-110"
              aria-hidden="true"
            />
          </button>
        </motion.div>

        {/* Logo */}
        <a href="https://www.cgraph.org" title="Back to Home" className="block">
          <motion.div
            whileHover={{
              scale: 1.1,
              filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.5)) drop-shadow(0 0 24px rgba(139,92,246,0.3))',
            }}
            whileTap={{ scale: 0.92 }}
            transition={springs.snappy}
            role="img"
            aria-label="CGraph logo - Click to go home"
            className="relative"
          >
            {/* Ambient glow ring behind logo */}
            <motion.div
              className="absolute -inset-2 rounded-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)',
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={loop({ duration: 3, ease: 'easeInOut' })}
            />
            <LogoIcon size={40} />
          </motion.div>
        </a>
      </div>
    </aside>
  );
}
