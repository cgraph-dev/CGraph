/**
 * QuestObjectiveItem Component - Individual quest objective progress row
 * @module modules/gamification/components/quest-panel
 */
import { motion } from 'framer-motion';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import type { QuestObjective } from '@/stores/gamificationStore';

interface QuestObjectiveItemProps {
  objective: QuestObjective;
  index: number;
}

export function QuestObjectiveItem({ objective, index }: QuestObjectiveItemProps) {
  // Progress calculated for potential future use (e.g., progress bar on objective)
  const _progress = Math.min((objective.currentValue / objective.targetValue) * 100, 100);
  void _progress; // Prevent unused variable warning

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3 rounded-lg bg-dark-800/50 p-2"
    >
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          objective.completed ? 'bg-green-500' : 'bg-dark-600'
        }`}
      >
        {objective.completed ? (
          <CheckCircleSolidIcon className="h-4 w-4 text-white" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-gray-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${objective.completed ? 'text-gray-400 line-through' : 'text-gray-300'}`}
        >
          {objective.description}
        </p>
      </div>
      <span className="text-xs text-gray-500">
        {objective.currentValue}/{objective.targetValue}
      </span>
    </motion.div>
  );
}
