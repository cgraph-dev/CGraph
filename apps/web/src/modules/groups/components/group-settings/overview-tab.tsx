/**
 * OverviewTab component
 * @module modules/groups/components/group-settings
 */

import { motion } from 'motion/react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { OverviewTabProps } from './types';

/**
 * unknown for the groups module.
 */
/**
 * Overview Tab component.
 */
export function OverviewTab({ group, formData, onChange }: OverviewTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Overview</h2>
        <p className="text-gray-400">Configure your group's basic settings</p>
      </div>

      {/* Banner & Icon */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 font-semibold text-white">Group Appearance</h3>

        {/* Banner */}
        <div className="relative mb-4 h-32 overflow-hidden rounded-xl bg-dark-700">
          {group.bannerUrl ? (
            <img src={group.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PhotoIcon className="h-12 w-12 text-gray-600" />
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute bottom-2 right-2 flex items-center gap-2 rounded-lg bg-dark-900/80 px-3 py-1.5 text-sm text-white"
          >
            <PhotoIcon className="h-4 w-4" />
            Change Banner
          </motion.button>
        </div>

        {/* Icon */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-dark-700">
            {group.iconUrl ? (
              <img src={group.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-2xl font-bold text-white">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-primary-600/20 px-4 py-2 text-sm font-medium text-primary-400"
            >
              Upload Icon
            </motion.button>
            <p className="mt-1 text-xs text-gray-500">Recommended: 512x512</p>
          </div>
        </div>
      </GlassCard>

      {/* Basic Info */}
      <GlassCard variant="frosted" className="space-y-4 p-6">
        <h3 className="font-semibold text-white">Basic Information</h3>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Group Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-dark-800 p-4">
          <div>
            <span className="font-medium text-white">Public Group</span>
            <p className="text-xs text-gray-400">Anyone can discover and join</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange({ ...formData, isPublic: !formData.isPublic })}
            className={`h-6 w-12 rounded-full transition-colors ${
              formData.isPublic ? 'bg-primary-600' : 'bg-dark-600'
            }`}
          >
            <motion.div
              animate={{ x: formData.isPublic ? 24 : 0 }}
              className="h-6 w-6 rounded-full bg-white shadow-lg"
            />
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
