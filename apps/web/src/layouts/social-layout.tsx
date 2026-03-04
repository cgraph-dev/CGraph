/**
 * Layout component for social pages.
 * @module layouts/social-layout
 */
import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';

/**
 * SocialLayout Component
 *
 * Layout for the Social Hub page:
 * - Top: Global search bar
 * - Left sidebar: Tab navigation (friends, notifications, discover)
 * - Main: Content area for selected tab
 */

/**
 * Social Layout — page layout wrapper.
 */
export default function SocialLayout() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full flex-col overflow-hidden bg-[rgb(18,20,28)]/[0.95] backdrop-blur-[8px]"
    >
      {/* Main content area - child routes will render here */}
      <div className="flex flex-1 overflow-hidden">
        <Outlet />
      </div>
    </motion.div>
  );
}
