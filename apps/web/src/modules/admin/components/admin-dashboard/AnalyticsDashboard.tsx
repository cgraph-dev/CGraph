/**
 * Analytics Dashboard Panel
 * View metrics, charts, and key performance indicators
 */

import { motion } from 'framer-motion';

import { ChartPlaceholder, MetricCard } from './shared-components';

export function AnalyticsDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Analytics Dashboard</h1>

      <div className="mb-8 flex gap-4">
        <button className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white">Today</button>
        <button className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400">7 Days</button>
        <button className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400">30 Days</button>
        <button className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400">90 Days</button>
        <button className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400">Custom</button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartPlaceholder title="User Activity" />
        <ChartPlaceholder title="Revenue Trend" />
        <ChartPlaceholder title="Event Participation" />
        <ChartPlaceholder title="Marketplace Volume" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-bold">Key Metrics</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="DAU" value="12,847" change="+5.2%" />
          <MetricCard label="MAU" value="89,234" change="+12.1%" />
          <MetricCard label="Avg Session" value="24m" change="+3.5%" />
          <MetricCard label="Retention" value="68%" change="+1.8%" />
        </div>
      </div>
    </motion.div>
  );
}
