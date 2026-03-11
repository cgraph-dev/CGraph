/**
 * Admin Dashboard Component
 * Main admin interface with tabbed navigation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AdminTab } from './types';
import { NAV_ITEMS } from './constants';
import {
  DashboardOverview,
  EventsManagement,
  UsersManagement,
  AnalyticsDashboard,
  SystemSettings,
} from './panels';

// ==================== NAV ITEM COMPONENT ====================

function NavItemButton({
  item,
  isActive,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
        isActive
          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="text-xl">{item.icon}</span>
      <span className="font-medium">{item.label}</span>
      {isActive && (
        <motion.div
          layoutId="admin-nav-indicator"
          className="absolute left-0 h-full w-1 rounded-r-full bg-gradient-to-b from-purple-500 to-pink-500"
        />
      )}
    </button>
  );
}

// ==================== MAIN COMPONENT ====================

/**
 * unknown for the admin module.
 */
/**
 * Admin Dashboard administration component.
 */
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'events':
        return <EventsManagement />;
      case 'users':
        return <UsersManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Sidebar */}
      <div className="relative w-64 flex-shrink-0 border-r border-white/10 p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <span className="text-lg font-bold">C</span>
          </div>
          <span className="text-xl font-bold">Admin</span>
        </div>

        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <NavItemButton
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400">Logged in as</p>
            <p className="font-medium">Admin User</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
      </div>
    </div>
  );
}

export default AdminDashboard;
