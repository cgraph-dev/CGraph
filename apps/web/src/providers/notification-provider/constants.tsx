/**
 * Constants for NotificationProvider
 * @module providers/notification-provider
 */

import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

export const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  success: React.createElement(CheckCircleIcon, { className: 'h-6 w-6 text-green-400' }),
  error: React.createElement(XCircleIcon, { className: 'h-6 w-6 text-red-400' }),
  warning: React.createElement(ExclamationTriangleIcon, { className: 'h-6 w-6 text-yellow-400' }),
  info: React.createElement(InformationCircleIcon, { className: 'h-6 w-6 text-blue-400' }),
};

export const NOTIFICATION_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', glow: 'rgba(34, 197, 94, 0.3)' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'rgba(239, 68, 68, 0.3)' },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'rgba(234, 179, 8, 0.3)',
  },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'rgba(59, 130, 246, 0.3)' },
};

export const DEFAULT_NOTIFICATION_COLOR = {
  bg: 'bg-gray-500/10',
  border: 'border-gray-500/30',
  glow: 'rgba(107, 114, 128, 0.3)',
};

export const DEFAULT_DURATION = 5000;
export const DEFAULT_MAX_NOTIFICATIONS = 5;
