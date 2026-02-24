/**
 * ObjectiveItem component
 * Displays a single quest objective with progress bar.
 * @module quests-page/ObjectiveItem
 */

import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { QuestObjective } from '@/modules/gamification/store';
import { tweens } from '@/lib/animation-presets';

interface ObjectiveItemProps {
  objective: QuestObjective;
}

export default function ObjectiveItem({ objective }: ObjectiveItemProps) {
  const progress = Math.min((objective.currentValue / objective.targetValue) * 100, 100);

  return (
    <div className="relative">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {objective.completed ? (
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-gray-600" />
          )}
          <span
            className={`text-sm ${objective.completed ? 'text-gray-400 line-through' : 'text-gray-300'}`}
          >
            {objective.description}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {objective.currentValue} / {objective.targetValue}
        </span>
      </div>
      <div className="ml-6 h-1 overflow-hidden rounded-full bg-dark-700">
        <motion.div
          className={`h-full ${objective.completed ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-purple-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={tweens.smooth}
        />
      </div>
    </div>
  );
}
