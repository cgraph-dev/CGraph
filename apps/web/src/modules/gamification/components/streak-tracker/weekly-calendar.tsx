/**
 * Weekly Calendar Component
 *
 * Displays the weekly streak progress
 */

import { motion } from 'motion/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { WeeklyCalendarProps } from './types';

function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * unknown for the gamification module.
 */
/**
 * Weekly Calendar component.
 */
export function WeeklyCalendar({ weeklyProgress, todayClaimed }: WeeklyCalendarProps) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      {weeklyProgress.map((day, index) => {
        const isToday = new Date(day.date).toDateString() === new Date().toDateString();
        return (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center"
          >
            <span className="mb-1 text-xs text-gray-400">{getDayName(day.date)}</span>
            <motion.div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                day.completed
                  ? 'bg-gradient-to-br from-orange-500 to-red-500'
                  : isToday && !todayClaimed
                    ? 'bg-white/[0.08] ring-2 ring-orange-500 ring-offset-2 ring-offset-[rgb(30,32,40)]'
                    : 'bg-white/[0.06]'
              }`}
              whileHover={day.completed || isToday ? { scale: 1.1 } : {}}
            >
              {day.completed ? (
                <CheckCircleIcon className="h-5 w-5 text-white" />
              ) : (
                <span className="text-sm text-gray-500">{new Date(day.date).getDate()}</span>
              )}
            </motion.div>
            {day.reward && day.completed && (
              <span className="mt-1 text-xs text-amber-400">+{day.reward.xp}</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
