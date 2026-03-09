/**
 * Sidebar Component - Responsive navigation sidebar with badges
 * @module layouts/app-layout
 */
import { NavLink, type Location } from 'react-router-dom';
import {
  type MotionValue,
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import { LogoIcon } from '@/components/logo/logo-icon';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { getAvatarBorderId } from '@/lib/utils';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ArrowRightOnRectangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { PresenceStatusSelector } from '@/shared/components/presence-status-selector';
import type { User } from '@/modules/auth/store';
import type { NavItem } from './constants';
import { loop, springs } from '@/lib/animation-presets';
// TODO(phase-26): Rewire — FeatureGateKey deleted from shared-types
type FeatureGateKey = string;
import { useState, useCallback, useRef } from 'react';

/**
 * Lock badge overlay for level-gated nav items.
 * Shows a small lock icon with tooltip when the feature is locked.
 */
function NavItemGateBadge({ feature: _feature }: { feature: FeatureGateKey }) {
  // TODO(phase-26): Rewire — gamification stores deleted
  const { unlocked, requiredLevel } = { unlocked: true, requiredLevel: 0 };

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

/**
 * Magnetic nav item — uses spring physics to create a dock-like
 * scale effect based on proximity to mouse cursor along the Y axis.
 */
function MagneticNavItem({
  item,
  isActive,
  isHovered,
  mouseY,
  totalUnread,
  unreadCount,
  onHover,
  onLeave,
}: {
  item: NavItem;
  isActive: boolean;
  isHovered: boolean;
  mouseY: MotionValue<number>;
  totalUnread: number;
  unreadCount: number;
  onHover: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = isActive ? item.activeIcon : item.icon;

  // Distance-based scale (dock magnification effect)
  const distance = useTransform(mouseY, (val: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 150;
    return val - (rect.top + rect.height / 2);
  });
  const scaleRaw = useTransform(distance, [-100, 0, 100], [1, 1.18, 1]);
  const scale = useSpring(scaleRaw, { stiffness: 300, damping: 22, mass: 0.5 });

  return (
    <div ref={ref} onMouseEnter={onHover} onMouseLeave={onLeave}>
      <NavLink
        to={item.path}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => HapticFeedback.light()}
        className="relative block"
      >
        <motion.div
          className="relative flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ scale }}
          whileTap={{ scale: 0.88 }}
          transition={springs.snappy}
        >
          {/* Active background — clean morphing pill */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-bg"
              className="absolute inset-0 rounded-xl"
              initial={false}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 28,
                mass: 0.7,
              }}
              style={{
                background:
                  'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.10) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            />
          )}

          {/* Hover background (inactive items) */}
          {!isActive && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              initial={false}
              animate={{
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                background:
                  'radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, transparent 70%)',
              }}
            />
          )}

          {/* Icon with color transition */}
          <motion.div
            className="relative z-10"
            animate={
              isActive
                ? { y: 0, filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.35))' }
                : { y: 0, filter: 'drop-shadow(0 0 0px rgba(139,92,246,0))' }
            }
            transition={{ duration: 0.3, ease: 'easeOut' }}
            initial={false}
          >
            <Icon
              className={`h-[22px] w-[22px] transition-colors duration-200 ${
                isActive ? 'text-white' : isHovered ? 'text-gray-300' : 'text-gray-500'
              }`}
            />
          </motion.div>

          {/* Tooltip with arrow */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -6, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, scale: 0.9 }}
                transition={{ duration: 0.15, ease: [0.2, 0.9, 0.3, 1] }}
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2"
              >
                <div className="relative whitespace-nowrap rounded-lg border border-white/[0.08] bg-[rgba(15,18,25,0.95)] px-2.5 py-1.5 text-xs font-medium text-gray-200 shadow-xl shadow-black/30 backdrop-blur-xl">
                  {item.label}
                  {/* Arrow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(15,18,25,0.95)]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message badge */}
          <AnimatePresence>
            {item.path === '/messages' && totalUnread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)' }}
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Social badge */}
          <AnimatePresence>
            {item.path === '/social' && unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Level gate lock */}
          {'featureGate' in item && item.featureGate && (
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- safe: guarded by `in` check
            <NavItemGateBadge feature={item.featureGate as FeatureGateKey} />
          )}
        </motion.div>
      </NavLink>
    </div>
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
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mouseY.set(e.clientY);
    },
    [mouseY]
  );

  return (
    <aside
      className="group/sidebar relative z-10 flex w-[72px] flex-col items-center overflow-visible border-r border-white/[0.04] bg-[rgba(8,10,16,0.95)] py-4 backdrop-blur-2xl backdrop-saturate-[1.8]"
      role="navigation"
      aria-label="Main navigation"
      onMouseMove={handleMouseMove}
    >
      {/* Animated right edge — thin luminous line */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-px"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.25) 30%, rgba(59,130,246,0.3) 50%, rgba(16,185,129,0.25) 70%, transparent 100%)',
          backgroundSize: '100% 200%',
          animation: 'sidebar-border-flow 6s linear infinite',
        }}
      />

      {/* Inner soft light for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-white/[0.01]" />

      {/* Subtle noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
        }}
      />

      {/* ── User Avatar (top) ── */}
      <div className="relative z-10 mb-2" role="group" aria-label="User profile">
        <NavLink to="/customize">
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.88 }}
            transition={springs.snappy}
            className="relative"
          >
            <div
              className="h-11 w-11 cursor-pointer overflow-hidden rounded-xl p-[1.5px]"
              role="img"
              aria-label={`Your profile picture: ${user?.displayName || user?.username || 'User'}`}
              style={{
                background:
                  'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(59,130,246,0.5), rgba(16,185,129,0.5))',
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
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[rgba(10,12,18,0.92)] text-base font-semibold text-gray-200">
                  {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Breathing ring */}
            <motion.div
              className="pointer-events-none absolute -inset-0.5 rounded-xl"
              animate={{
                boxShadow: ['0 0 0 0 rgba(139, 92, 246, 0.3)', '0 0 0 5px rgba(139, 92, 246, 0)'],
              }}
              transition={loop({ duration: 3, ease: 'easeOut' })}
            />
          </motion.div>
        </NavLink>

        {/* Presence Status Selector */}
        <div className="mt-1.5">
          <PresenceStatusSelector compact />
        </div>
      </div>

      {/* Divider */}
      <div className="mb-2 h-px w-8 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ── Navigation ── */}
      <nav className="relative z-10 flex flex-1 flex-col items-center gap-1" aria-label="Primary">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <MagneticNavItem
              key={item.path}
              item={item}
              isActive={isActive}
              isHovered={hoveredNav === item.path}
              mouseY={mouseY}
              totalUnread={totalUnread}
              unreadCount={unreadCount}
              onHover={() => setHoveredNav(item.path)}
              onLeave={() => setHoveredNav(null)}
            />
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mb-2 mt-auto h-px w-8 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ── Bottom: Logout + Logo ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-2"
        role="group"
        aria-label="Bottom actions"
      >
        {/* Logout */}
        <motion.button
          onClick={() => {
            HapticFeedback.medium();
            handleLogout();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={springs.snappy}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors duration-200 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          title="Logout"
          aria-label="Logout from your account"
        >
          <motion.div
            className="absolute inset-0 rounded-xl bg-red-500/0 transition-colors duration-200 group-hover:bg-red-500/[0.08]"
            initial={false}
          />
          <ArrowRightOnRectangleIcon className="relative z-10 h-5 w-5" aria-hidden="true" />
        </motion.button>

        {/* Logo */}
        <a
          href="https://www.cgraph.org"
          title="CGraph"
          className="block opacity-40 transition-opacity duration-300 hover:opacity-70"
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={springs.snappy}
            role="img"
            aria-label="CGraph logo"
          >
            <LogoIcon size={44} />
          </motion.div>
        </a>
      </div>
    </aside>
  );
}
