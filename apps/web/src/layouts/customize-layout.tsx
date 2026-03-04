/**
 * Layout component for customization pages.
 * @module layouts/customize-layout
 */
import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';

/**
 * CustomizeLayout Component
 *
 * Three-panel layout for the customization hub:
 * - Left sidebar: Category navigation
 * - Center: Customization controls
 * - Right: Live preview panel
 */

/**
 * Customize Layout — page layout wrapper.
 */
export default function CustomizeLayout() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full overflow-hidden bg-[rgb(18,20,28)]/[0.95] backdrop-blur-[8px]"
    >
      {/* Main content area - child routes will render here */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </motion.div>
  );
}
