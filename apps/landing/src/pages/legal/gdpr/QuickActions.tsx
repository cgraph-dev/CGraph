/**
 * GDPR Quick Actions
 *
 * Three action cards for common GDPR self-service operations:
 * Download Data, Export Data, and Delete Account.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { Download, Upload, Trash2 } from 'lucide-react';

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-12 grid gap-4 sm:grid-cols-3"
    >
      <div className="glass-surface rounded-2xl border border-emerald-200/50 bg-emerald-50 p-6 text-center shadow-glass">
        <span className="mb-3 inline-flex">
          <Download className="h-8 w-8 text-emerald-600" />
        </span>
        <h3 className="text-base font-semibold text-slate-900">Download Data</h3>
        <p className="mt-1 text-sm text-slate-500">Settings → Privacy → Download</p>
      </div>
      <div className="glass-surface rounded-2xl border border-violet-200/50 bg-violet-50 p-6 text-center shadow-glass">
        <span className="mb-3 inline-flex">
          <Upload className="h-8 w-8 text-violet-600" />
        </span>
        <h3 className="text-base font-semibold text-slate-900">Export Data</h3>
        <p className="mt-1 text-sm text-slate-500">Settings → Privacy → Export</p>
      </div>
      <div className="glass-surface rounded-2xl border border-red-200/50 bg-red-50 p-6 text-center shadow-glass">
        <span className="mb-3 inline-flex">
          <Trash2 className="h-8 w-8 text-red-500" />
        </span>
        <h3 className="text-base font-semibold text-slate-900">Delete Account</h3>
        <p className="mt-1 text-sm text-slate-500">Settings → Account → Delete</p>
      </div>
    </motion.div>
  );
}
