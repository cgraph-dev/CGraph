/**
 * Quest Tracker component
 * @module modules/gamification/components/events/event-banner/quest-tracker
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuestTrackerProps } from './types';

export function QuestTracker({ quests, onClaimReward }: QuestTrackerProps) {
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'event'>('all');

  const filteredQuests = quests.filter((q) => filter === 'all' || q.type === filter);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">📋 Quests</h3>
          <div className="flex gap-1 rounded-lg bg-black/30 p-1">
            {(['all', 'daily', 'weekly', 'event'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quest List */}
      <div className="divide-y divide-white/5">
        <AnimatePresence mode="popLayout">
          {filteredQuests.map((quest) => (
            <motion.div
              key={quest.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-4 ${quest.completed ? 'bg-green-500/5' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Status */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    quest.completed ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'
                  }`}
                >
                  {quest.completed ? '✓' : `${Math.floor((quest.progress / quest.target) * 100)}%`}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="font-medium text-white">{quest.title}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        quest.type === 'daily'
                          ? 'bg-blue-500/20 text-blue-400'
                          : quest.type === 'weekly'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-pink-500/20 text-pink-400'
                      }`}
                    >
                      {quest.type}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-500">{quest.description}</p>

                  {/* Progress Bar */}
                  {!quest.completed && (
                    <div className="relative h-2 overflow-hidden rounded-full bg-black/30">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(quest.progress / quest.target) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {quest.progress}/{quest.target}
                  </p>
                </div>

                {/* Reward */}
                <div className="text-center">
                  <span className="text-2xl">{quest.reward.icon}</span>
                  <p className="text-xs text-gray-400">+{quest.reward.amount}</p>

                  {quest.completed && !quest.claimed && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onClaimReward?.(quest.id)}
                      className="mt-2 rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white"
                    >
                      Claim
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredQuests.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No quests available</p>
          </div>
        )}
      </div>
    </div>
  );
}
