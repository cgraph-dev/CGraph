import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Admin Dashboard for Gamification System
 * 
 * Comprehensive admin interface with:
 * - Event management (create, edit, lifecycle control)
 * - Marketplace moderation (flagged listings, disputes)
 * - Analytics dashboard
 * - User management
 * - System settings
 * 
 * Design principles:
 * - Role-based access control visibility
 * - Real-time updates via WebSocket
 * - Keyboard shortcuts for power users
 * - Responsive mobile-first design
 * - Dark mode optimized
 */

// ==================== TYPES ====================

type AdminTab = 'dashboard' | 'events' | 'marketplace' | 'users' | 'analytics' | 'settings';

interface AdminStats {
  activeUsers: number;
  activeEvents: number;
  pendingModeration: number;
  revenue24h: number;
  transactionsToday: number;
  disputeRate: number;
}

interface ModerationItem {
  id: string;
  type: 'listing' | 'transaction' | 'report';
  status: 'pending' | 'reviewed' | 'escalated';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  summary: string;
}

// ==================== MAIN COMPONENT ====================

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1': setActiveTab('dashboard'); break;
          case '2': setActiveTab('events'); break;
          case '3': setActiveTab('marketplace'); break;
          case '4': setActiveTab('users'); break;
          case '5': setActiveTab('analytics'); break;
          case 'b': setSidebarCollapsed(prev => !prev); e.preventDefault(); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="bg-gray-900 border-r border-white/10 flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <motion.div
            animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
            className="flex items-center gap-3"
          >
            <span className="text-2xl">⚙️</span>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg">Admin Panel</span>
            )}
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard', shortcut: '⌘1' },
            { id: 'events', icon: '🎉', label: 'Events', shortcut: '⌘2' },
            { id: 'marketplace', icon: '🏪', label: 'Marketplace', shortcut: '⌘3' },
            { id: 'users', icon: '👥', label: 'Users', shortcut: '⌘4' },
            { id: 'analytics', icon: '📈', label: 'Analytics', shortcut: '⌘5' },
            { id: 'settings', icon: '⚙️', label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-xs text-gray-600">{item.shortcut}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-4 border-t border-white/10 text-gray-500 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? '→' : '← Collapse'}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <DashboardOverview key="dashboard" />}
          {activeTab === 'events' && <EventsManagement key="events" />}
          {activeTab === 'marketplace' && <MarketplaceModeration key="marketplace" />}
          {activeTab === 'users' && <UsersManagement key="users" />}
          {activeTab === 'analytics' && <AnalyticsDashboard key="analytics" />}
          {activeTab === 'settings' && <SystemSettings key="settings" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ==================== DASHBOARD OVERVIEW ====================

function DashboardOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);

  useEffect(() => {
    // Fetch dashboard stats
    setStats({
      activeUsers: 12847,
      activeEvents: 3,
      pendingModeration: 47,
      revenue24h: 284750,
      transactionsToday: 1893,
      disputeRate: 0.8,
    });

    // Fetch moderation queue
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
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Active Users"
          value={stats?.activeUsers.toLocaleString() || '—'}
          icon="👥"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Active Events"
          value={stats?.activeEvents || '—'}
          icon="🎉"
        />
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

      {/* Quick Actions & Moderation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionButton icon="🎉" label="Create Event" />
            <QuickActionButton icon="📢" label="Send Announcement" />
            <QuickActionButton icon="🎁" label="Grant Rewards" />
            <QuickActionButton icon="📊" label="Export Report" />
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Moderation Queue</h2>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
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

// ==================== STAT CARD ====================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning' | 'success' | 'error';
}

function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'border-white/10',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={`p-6 bg-white/5 rounded-xl border ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            }`}
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

// ==================== QUICK ACTION BUTTON ====================

function QuickActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 p-4 bg-black/30 rounded-xl hover:bg-white/10 transition-colors">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-400">{label}</span>
    </button>
  );
}

// ==================== MODERATION QUEUE ITEM ====================

function ModerationQueueItem({ item }: { item: ModerationItem }) {
  const riskColors = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-black/20 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
      <span className={`px-2 py-1 rounded text-xs font-medium ${riskColors[item.riskLevel]}`}>
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

// ==================== EVENTS MANAGEMENT ====================

interface EventData {
  id: number;
  name: string;
  status: 'active' | 'scheduled' | 'draft' | 'ended';
  participants: number;
}

const PLACEHOLDER_EVENTS: EventData[] = [
  { id: 1, name: 'Winter Wonderland 2026', status: 'active', participants: 4521 },
  { id: 2, name: "Valentine's Day Special", status: 'scheduled', participants: 0 },
  { id: 3, name: 'Anniversary Celebration', status: 'draft', participants: 0 },
];

function EventsManagement() {
  const [events, setEvents] = useState<EventData[]>(PLACEHOLDER_EVENTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Filter events based on active filter
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') return events;
    return events.filter((e) => e.status === activeFilter.toLowerCase());
  }, [events, activeFilter]);

  // Add new event handler (for future implementation)
  const handleAddEvent = useCallback((newEvent: Omit<EventData, 'id'>) => {
    const id = Math.max(0, ...events.map((e) => e.id)) + 1;
    setEvents((prev) => [...prev, { ...newEvent, id }]);
    setShowCreateModal(false);
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          + Create Event
        </button>
      </div>

      {/* Event Filters */}
      <div className="flex gap-4 mb-6">
        {['All', 'Active', 'Scheduled', 'Draft', 'Ended'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeFilter === filter
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No events found for this filter
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl">
                🎉
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{event.name}</h3>
                <p className="text-sm text-gray-500">
                  {event.participants.toLocaleString()} participants
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : event.status === 'scheduled'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {event.status}
              </span>
              <button className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
                Manage
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleAddEvent}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== CREATE EVENT MODAL ====================

interface CreateEventModalProps {
  onClose: () => void;
  onSubmit: (event: Omit<EventData, 'id'>) => void;
}

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Create New Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="Enter event name..."
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventData['status'])}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
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
              className="flex-1 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Event
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ==================== MARKETPLACE MODERATION ====================

function MarketplaceModeration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="text-3xl font-bold mb-8">Marketplace Moderation</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {[
          { id: 'flagged', label: 'Flagged Listings', count: 23 },
          { id: 'disputes', label: 'Disputes', count: 5 },
          { id: 'reports', label: 'User Reports', count: 12 },
          { id: 'banned', label: 'Banned Items', count: 8 },
        ].map((tab) => (
          <button
            key={tab.id}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            {tab.label}
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Moderation Queue */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold">Flagged Listings</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
              Bulk Approve
            </button>
            <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
              Bulk Reject
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
              <input type="checkbox" className="w-5 h-5 rounded bg-black/50" />
              <div className="w-12 h-12 bg-black/30 rounded-lg flex items-center justify-center">
                🎨
              </div>
              <div className="flex-1">
                <p className="font-medium">Suspicious Listing #{i}</p>
                <p className="text-sm text-gray-500">
                  Listed by @user{i} • {Math.floor(Math.random() * 10000)} coins
                </p>
              </div>
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                High Risk
              </span>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                  Approve
                </button>
                <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
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

function UsersManagement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="text-3xl font-bold mb-8">Users Management</h1>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search users by name, email, or ID..."
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500"
        />
        <button className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
          <option>All Users</option>
          <option>Premium</option>
          <option>Banned</option>
          <option>Flagged</option>
        </select>
        <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
          <option>Sort by: Recent</option>
          <option>Sort by: XP</option>
          <option>Sort by: Spending</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
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
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
                    <div>
                      <p className="font-medium">User Name {i}</p>
                      <p className="text-xs text-gray-500">@username{i}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                    Level {Math.floor(Math.random() * 50) + 1}
                  </span>
                </td>
                <td className="p-4 text-yellow-400">
                  {Math.floor(Math.random() * 100000).toLocaleString()} 🪙
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    Active
                  </span>
                </td>
                <td className="p-4">
                  <button className="px-3 py-1 bg-white/10 rounded text-sm hover:bg-white/20">
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

function AnalyticsDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Date Range */}
      <div className="flex gap-4 mb-8">
        <button className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm">Today</button>
        <button className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm">7 Days</button>
        <button className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm">30 Days</button>
        <button className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm">90 Days</button>
        <button className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm">Custom</button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartPlaceholder title="User Activity" />
        <ChartPlaceholder title="Revenue Trend" />
        <ChartPlaceholder title="Event Participation" />
        <ChartPlaceholder title="Marketplace Volume" />
      </div>

      {/* Metrics Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="DAU" value="12,847" change="+5.2%" />
          <MetricCard label="MAU" value="89,234" change="+12.1%" />
          <MetricCard label="Avg Session" value="24m" change="+3.5%" />
          <MetricCard label="Retention" value="68%" change="+1.8%" />
        </div>
      </div>
    </motion.div>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      <h3 className="font-bold mb-4">{title}</h3>
      <div className="h-48 flex items-center justify-center text-gray-600">
        📊 Chart visualization would render here
      </div>
    </div>
  );
}

function MetricCard({ label, value, change }: { label: string; value: string; change: string }) {
  const isPositive = change.startsWith('+');
  return (
    <div className="text-center p-4 bg-black/20 rounded-xl">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{change}</p>
    </div>
  );
}

// ==================== SYSTEM SETTINGS ====================

function SystemSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="text-3xl font-bold mb-8">System Settings</h1>

      <div className="max-w-2xl space-y-8">
        {/* Gamification Settings */}
        <SettingsSection title="🎮 Gamification">
          <SettingRow
            label="XP Rate Multiplier"
            description="Global multiplier for all XP gains"
            value={<input type="number" defaultValue="1.0" step="0.1" className="w-24 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-right" />}
          />
          <SettingRow
            label="Daily Quest Reset Time"
            description="UTC time for daily quest reset"
            value={<input type="time" defaultValue="00:00" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg" />}
          />
          <SettingRow
            label="Enable Prestige System"
            description="Allow users to prestige at max level"
            value={<ToggleSwitch defaultChecked />}
          />
        </SettingsSection>

        {/* Marketplace Settings */}
        <SettingsSection title="🏪 Marketplace">
          <SettingRow
            label="Transaction Fee"
            description="Percentage fee on all sales"
            value={<input type="number" defaultValue="5" className="w-24 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-right" />}
          />
          <SettingRow
            label="Listing Duration (days)"
            description="How long listings remain active"
            value={<input type="number" defaultValue="30" className="w-24 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-right" />}
          />
          <SettingRow
            label="Enable Trading"
            description="Allow direct item trades between users"
            value={<ToggleSwitch defaultChecked />}
          />
        </SettingsSection>

        {/* Moderation Settings */}
        <SettingsSection title="🛡️ Moderation">
          <SettingRow
            label="Auto-flag High Risk"
            description="Automatically flag high-risk listings"
            value={<ToggleSwitch defaultChecked />}
          />
          <SettingRow
            label="Risk Score Threshold"
            description="Minimum score to trigger auto-flag"
            value={<input type="number" defaultValue="75" className="w-24 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-right" />}
          />
        </SettingsSection>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
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

function ToggleSwitch({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-purple-500' : 'bg-white/20'
      }`}
    >
      <motion.div
        className="w-5 h-5 bg-white rounded-full"
        animate={{ x: checked ? 26 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default AdminDashboard;
