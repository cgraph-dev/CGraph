/**
 * Layout component for social pages.
 * @module layouts/social-layout
 */
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"
    >
      {/* Main content area - child routes will render here */}
      <div className="flex flex-1 overflow-hidden">
        <Outlet />
      </div>
    </motion.div>
  );
}
