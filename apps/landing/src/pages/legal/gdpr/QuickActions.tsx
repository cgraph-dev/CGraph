/**
 * GDPR Quick Actions
 *
 * Three action cards for common GDPR self-service operations:
 * Download Data, Export Data, and Delete Account.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="marketing-grid marketing-grid--3"
      style={{ marginBottom: '3rem' }}
    >
      <div
        className="marketing-card text-center"
        style={{
          borderColor: 'rgba(16, 185, 129, 0.3)',
          background: 'rgba(16, 185, 129, 0.1)',
        }}
      >
        <span className="marketing-card__icon">📥</span>
        <h3 className="marketing-card__title">Download Data</h3>
        <p className="marketing-card__desc">Settings → Privacy → Download</p>
      </div>
      <div
        className="marketing-card text-center"
        style={{
          borderColor: 'rgba(139, 92, 246, 0.3)',
          background: 'rgba(139, 92, 246, 0.1)',
        }}
      >
        <span className="marketing-card__icon">📤</span>
        <h3 className="marketing-card__title">Export Data</h3>
        <p className="marketing-card__desc">Settings → Privacy → Export</p>
      </div>
      <div
        className="marketing-card text-center"
        style={{
          borderColor: 'rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.1)',
        }}
      >
        <span className="marketing-card__icon">🗑️</span>
        <h3 className="marketing-card__title">Delete Account</h3>
        <p className="marketing-card__desc">Settings → Account → Delete</p>
      </div>
    </motion.div>
  );
}
