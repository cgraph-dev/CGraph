/**
 * AdminDashboard types
 * Extracted from AdminDashboard.tsx
 */

export type AdminTab = 'dashboard' | 'events' | 'marketplace' | 'users' | 'analytics' | 'settings';

export interface AdminStats {
  activeUsers: number;
  activeEvents: number;
  pendingModeration: number;
  revenue24h: number;
  transactionsToday: number;
  disputeRate: number;
}

export interface ModerationItem {
  id: string;
  type: 'listing' | 'transaction' | 'report';
  status: 'pending' | 'reviewed' | 'escalated';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  summary: string;
}

export interface EventData {
  id: number;
  name: string;
  status: 'active' | 'scheduled' | 'draft' | 'ended';
  participants: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export interface NavItem {
  id: AdminTab;
  icon: string;
  label: string;
  shortcut?: string;
}

export interface CreateEventModalProps {
  onClose: () => void;
  onSubmit: (event: Omit<EventData, 'id'>) => void;
}
