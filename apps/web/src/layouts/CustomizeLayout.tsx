import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * CustomizeLayout Component
 *
 * Three-panel layout for the customization hub:
 * - Left sidebar: Category navigation
 * - Center: Customization controls
 * - Right: Live preview panel
 */

export default function CustomizeLayout() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"
    >
      {/* Main content area - child routes will render here */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </motion.div>
  );
}
