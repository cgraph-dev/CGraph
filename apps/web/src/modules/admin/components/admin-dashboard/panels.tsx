/**
 * Admin Dashboard Panels
 * Extracted from AdminDashboard.tsx
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AdminStats, ModerationItem, EventData, CreateEventModalProps } from './types';
import { RISK_COLORS, STATUS_COLORS, EVENT_FILTERS, PLACEHOLDER_EVENTS } from './constants';

// ==================== SHARED COMPONENTS ====================

function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning' | 'success' | 'error';
}) {
  const variantStyles = {
    default: 'border-white/10',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={`rounded-xl border bg-white/5 p-6 ${variantStyles[variant]}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}
          >
            {trend.isPositive ? '▲' : '▼'} {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

function QuickActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 rounded-xl bg-black/30 p-4 transition-colors hover:bg-white/10">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-400">{label}</span>
    </button>
  );
}

function ModerationQueueItem({ item }: { item: ModerationItem }) {
  return (
    <div className="flex cursor-pointer items-center gap-4 rounded-lg bg-black/20 p-3 transition-colors hover:bg-white/5">
      <span className={`rounded px-2 py-1 text-xs font-medium ${RISK_COLORS[item.riskLevel]}`}>
        {item.riskLevel.toUpperCase()}
      </span>
      <div className="flex-1">
        <p className="text-sm text-white">{item.summary}</p>
        <p className="text-xs text-gray-500">
          {item.type} • {item.createdAt.toLocaleTimeString()}
        </p>
      </div>
      <span className="text-gray-500">→</span>
    </div>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 font-bold">{title}</h3>
      <div className="flex h-48 items-center justify-center text-gray-600">
        📊 Chart visualization would render here
      </div>
    </div>
  );
}

function MetricCard({ label, value, change }: { label: string; value: string; change: string }) {
  const isPositive = change.startsWith('+');
  return (
    <div className="rounded-xl bg-black/20 p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{change}</p>
    </div>
  );
}

function ToggleSwitch({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`h-6 w-12 rounded-full transition-colors ${checked ? 'bg-purple-500' : 'bg-white/20'}`}
    >
      <motion.div
        className="h-5 w-5 rounded-full bg-white"
        animate={{ x: checked ? 26 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="border-b border-white/10 p-4">
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {value}
    </div>
  );
}

// ==================== DASHBOARD OVERVIEW ====================

export function DashboardOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);

  useEffect(() => {
    setStats({
      activeUsers: 12847,
      activeEvents: 3,
      pendingModeration: 47,
      revenue24h: 284750,
      transactionsToday: 1893,
      disputeRate: 0.8,
    });

    setModerationQueue([
      {
        id: '1',
        type: 'listing',
        status: 'pending',
        riskLevel: 'high',
        createdAt: new Date(),
        summary: 'Suspicious pricing on rare item',
      },
      {
        id: '2',
        type: 'transaction',
        status: 'escalated',
        riskLevel: 'critical',
        createdAt: new Date(),
        summary: 'Potential fraud detection',
      },
    ]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Dashboard Overview</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Users"
          value={stats?.activeUsers.toLocaleString() || '—'}
          icon="👥"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard title="Active Events" value={stats?.activeEvents || '—'} icon="🎉" />
        <StatCard
          title="Pending Moderation"
          value={stats?.pendingModeration || '—'}
          icon="⚠️"
          variant="warning"
        />
        <StatCard
          title="24h Revenue"
          value={`${stats?.revenue24h?.toLocaleString() || '—'} 🪙`}
          icon="💰"
          trend={{ value: 8.3, isPositive: true }}
        />
        <StatCard
          title="Transactions Today"
          value={stats?.transactionsToday?.toLocaleString() || '—'}
          icon="📦"
        />
        <StatCard
          title="Dispute Rate"
          value={`${stats?.disputeRate || '—'}%`}
          icon="⚖️"
          trend={{ value: 0.2, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionButton icon="🎉" label="Create Event" />
            <QuickActionButton icon="📢" label="Send Announcement" />
            <QuickActionButton icon="🎁" label="Grant Rewards" />
            <QuickActionButton icon="📊" label="Export Report" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Moderation Queue</h2>
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-400">
              {moderationQueue.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {moderationQueue.map((item) => (
              <ModerationQueueItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== EVENTS MANAGEMENT ====================

function CreateEventModal({ onClose, onSubmit }: CreateEventModalProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<EventData['status']>('draft');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), status, participants: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-bold">Create New Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-400">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 focus:border-purple-500 focus:outline-none"
              placeholder="Enter event name..."
              autoFocus
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventData['status'])}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-white/5 px-4 py-2 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 font-medium transition-opacity hover:opacity-90"
            >
              Create Event
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function EventsManagement() {
  const [events, setEvents] = useState<EventData[]>(PLACEHOLDER_EVENTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') return events;
    return events.filter((e) => e.status === activeFilter.toLowerCase());
  }, [events, activeFilter]);

  const handleAddEvent = useCallback(
    (newEvent: Omit<EventData, 'id'>) => {
      const id = Math.max(0, ...events.map((e) => e.id)) + 1;
      setEvents((prev) => [...prev, { ...newEvent, id }]);
      setShowCreateModal(false);
    },
    [events]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          + Create Event
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        {EVENT_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              activeFilter === filter ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr className="text-left text-sm text-gray-500">
              <th className="p-4">Event Name</th>
              <th className="p-4">Status</th>
              <th className="p-4">Participants</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredEvents.map((event) => (
              <tr key={event.id} className="hover:bg-white/5">
                <td className="p-4 font-medium">{event.name}</td>
                <td className="p-4">
                  <span className={`rounded px-2 py-1 text-xs ${STATUS_COLORS[event.status]}`}>
                    {event.status}
                  </span>
                </td>
                <td className="p-4 text-gray-400">{event.participants.toLocaleString()}</td>
                <td className="p-4">
                  <button className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateEventModal onClose={() => setShowCreateModal(false)} onSubmit={handleAddEvent} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== MARKETPLACE MODERATION ====================

export function MarketplaceModeration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Marketplace Moderation</h1>

      <div className="mb-6 flex gap-4">
        {[
          { id: 'flagged', label: 'Flagged Listings', count: 23 },
          { id: 'disputes', label: 'Disputes', count: 5 },
          { id: 'reports', label: 'User Reports', count: 12 },
          { id: 'banned', label: 'Banned Items', count: 8 },
        ].map((tab) => (
          <button
            key={tab.id}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            {tab.label}
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="font-bold">Flagged Listings</h2>
          <div className="flex gap-2">
            <button className="rounded-lg bg-green-500/20 px-3 py-1 text-sm text-green-400">
              Bulk Approve
            </button>
            <button className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400">
              Bulk Reject
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 transition-colors hover:bg-white/5">
              <input type="checkbox" className="h-5 w-5 rounded bg-black/50" />
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/30">
                🎨
              </div>
              <div className="flex-1">
                <p className="font-medium">Suspicious Listing #{i}</p>
                <p className="text-sm text-gray-500">
                  Listed by @user{i} • {Math.floor(Math.random() * 10000)} coins
                </p>
              </div>
              <span className="rounded bg-orange-500/20 px-2 py-1 text-xs text-orange-400">
                High Risk
              </span>
              <div className="flex gap-2">
                <button className="rounded-lg bg-green-500/20 px-3 py-1 text-sm text-green-400">
                  Approve
                </button>
                <button className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ==================== USERS MANAGEMENT ====================

export function UsersManagement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Users Management</h1>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search users by name, email, or ID..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500"
        />
        <button className="rounded-lg bg-white/10 px-6 py-3 transition-colors hover:bg-white/20">
          Search
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <select className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white">
          <option>All Users</option>
          <option>Premium</option>
          <option>Banned</option>
          <option>Flagged</option>
        </select>
        <select className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white">
          <option>Sort by: Recent</option>
          <option>Sort by: XP</option>
          <option>Sort by: Spending</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr className="text-left text-sm text-gray-500">
              <th className="p-4">User</th>
              <th className="p-4">Level</th>
              <th className="p-4">Balance</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div>
                      <p className="font-medium">User Name {i}</p>
                      <p className="text-xs text-gray-500">@username{i}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="rounded bg-purple-500/20 px-2 py-1 text-sm text-purple-400">
                    Level {Math.floor(Math.random() * 50) + 1}
                  </span>
                </td>
                <td className="p-4 text-yellow-400">
                  {Math.floor(Math.random() * 100000).toLocaleString()} 🪙
                </td>
                <td className="p-4">
                  <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400">
                    Active
                  </span>
                </td>
                <td className="p-4">
                  <button className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ==================== ANALYTICS DASHBOARD ====================

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

// ==================== SYSTEM SETTINGS ====================

export function SystemSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">System Settings</h1>

      <div className="max-w-2xl space-y-8">
        <SettingsSection title="🎮 Gamification">
          <SettingRow
            label="XP Rate Multiplier"
            description="Global multiplier for all XP gains"
            value={
              <input
                type="number"
                defaultValue="1.0"
                step="0.1"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
          <SettingRow
            label="Daily Quest Reset Time"
            description="UTC time for daily quest reset"
            value={
              <input
                type="time"
                defaultValue="00:00"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              />
            }
          />
          <SettingRow
            label="Enable Prestige System"
            description="Allow users to prestige at max level"
            value={<ToggleSwitch defaultChecked />}
          />
        </SettingsSection>

        <SettingsSection title="🏪 Marketplace">
          <SettingRow
            label="Transaction Fee"
            description="Percentage fee on all sales"
            value={
              <input
                type="number"
                defaultValue="5"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
          <SettingRow
            label="Listing Duration (days)"
            description="How long listings remain active"
            value={
              <input
                type="number"
                defaultValue="30"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
          <SettingRow
            label="Enable Trading"
            description="Allow direct item trades between users"
            value={<ToggleSwitch defaultChecked />}
          />
        </SettingsSection>

        <SettingsSection title="🛡️ Moderation">
          <SettingRow
            label="Auto-flag High Risk"
            description="Automatically flag high-risk listings"
            value={<ToggleSwitch defaultChecked />}
          />
          <SettingRow
            label="Risk Score Threshold"
            description="Minimum score to trigger auto-flag"
            value={
              <input
                type="number"
                defaultValue="75"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
        </SettingsSection>

        <div className="flex justify-end pt-6">
          <button className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 font-medium transition-opacity hover:opacity-90">
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
}
