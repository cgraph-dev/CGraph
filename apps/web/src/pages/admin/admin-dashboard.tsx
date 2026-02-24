/** AdminDashboard — main admin dashboard page with metrics, tabs, and system controls. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  ShieldExclamationIcon,
  CogIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Admin types
import type { TabId } from '@/types/admin.types';

// Extracted tab components
import { OverviewTab, UsersTab, ReportsTab, AuditTab, SettingsTab } from './tabs';

// ============================================================================
// Main Admin Dashboard Component
// ============================================================================

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const queryClient = useQueryClient();

  const tabs: { id: TabId; name: string; icon: typeof ChartBarIcon }[] = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'reports', name: 'Reports', icon: ShieldExclamationIcon },
    { id: 'audit', name: 'Audit Log', icon: ClockIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <ShieldExclamationIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">CGraph Administration</p>
              </div>
            </div>

            <button
              onClick={() => queryClient.invalidateQueries()}
              className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center space-x-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" />}
          {activeTab === 'users' && <UsersTab key="users" />}
          {activeTab === 'reports' && <ReportsTab key="reports" />}
          {activeTab === 'audit' && <AuditTab key="audit" />}
          {activeTab === 'settings' && <SettingsTab key="settings" />}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
