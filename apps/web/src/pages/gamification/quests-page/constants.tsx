/**
 * QuestsPage constants
 * @module quests-page/constants
 */

import {
  ClipboardDocumentListIcon,
  FireIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { QuestTab } from './types';

export const TABS: { id: QuestTab; name: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'active',
    name: 'Active',
    icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'daily',
    name: 'Daily',
    icon: <FireIcon className="h-4 w-4" />,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'weekly',
    name: 'Weekly',
    icon: <CalendarIcon className="h-4 w-4" />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'completed',
    name: 'Completed',
    icon: <CheckCircleIcon className="h-4 w-4" />,
    color: 'from-green-500 to-emerald-500',
  },
];
