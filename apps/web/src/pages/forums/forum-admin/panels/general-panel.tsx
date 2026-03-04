/**
 * General Settings Panel
 *
 * Forum identity, privacy settings, and danger zone.
 *
 * @module pages/forums/ForumAdmin/panels/GeneralPanel
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import {
  TrashIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

interface GeneralPanelProps {
  name: string;
  description: string;
  isPublic: boolean;
  isNsfw: boolean;
  requireApproval: boolean;
  isOwner: boolean;
  forumName: string;
  showDeleteConfirm: boolean;
  deleteConfirmText: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPublicChange: (value: boolean) => void;
  onNsfwChange: (value: boolean) => void;
  onRequireApprovalChange: (value: boolean) => void;
  onShowDeleteConfirm: (show: boolean) => void;
  onDeleteConfirmTextChange: (value: string) => void;
  onDelete: () => void;
}

export const GeneralPanel = memo(function GeneralPanel({
  name,
  description,
  isPublic,
  isNsfw,
  requireApproval,
  isOwner,
  forumName,
  showDeleteConfirm,
  deleteConfirmText,
  onNameChange,
  onDescriptionChange,
  onPublicChange,
  onNsfwChange,
  onRequireApprovalChange,
  onShowDeleteConfirm,
  onDeleteConfirmTextChange,
  onDelete,
}: GeneralPanelProps) {
  return (
    <motion.div
      key="general"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">General Settings</h2>
        <p className="text-gray-400">Basic forum configuration and privacy settings.</p>
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Forum Identity</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Forum Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe your forum..."
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Privacy & Access</h3>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-4 rounded-lg bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.08]">
            <input
              type="radio"
              checked={isPublic}
              onChange={() => onPublicChange(true)}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-green-500" />
                <span className="font-medium text-white">Public</span>
              </div>
              <p className="mt-1 text-sm text-gray-400">Anyone can view and join</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-4 rounded-lg bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.08]">
            <input
              type="radio"
              checked={!isPublic}
              onChange={() => onPublicChange(false)}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-white">Private</span>
              </div>
              <p className="mt-1 text-sm text-gray-400">Only members can view content</p>
            </div>
          </label>
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isNsfw}
              onChange={(e) => onNsfwChange(e.target.checked)}
              className="h-5 w-5 rounded border-white/[0.08] bg-white/[0.06] text-primary-500"
            />
            <div>
              <span className="font-medium text-white">NSFW Content (18+)</span>
              <p className="text-sm text-gray-400">This forum contains adult content</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => onRequireApprovalChange(e.target.checked)}
              className="h-5 w-5 rounded border-white/[0.08] bg-white/[0.06] text-primary-500"
            />
            <div>
              <span className="font-medium text-white">Require Post Approval</span>
              <p className="text-sm text-gray-400">All posts must be approved by moderators</p>
            </div>
          </label>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      {isOwner && (
        <GlassCard className="border-red-500/30 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Danger Zone
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Delete Forum</h4>
              <p className="text-sm text-gray-400">Permanently delete this forum and all content</p>
            </div>
            <button
              onClick={() => onShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </div>

          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 rounded-lg bg-white/[0.04] p-4"
            >
              <p className="mb-3 text-sm text-gray-300">
                Type <span className="font-mono text-red-400">{forumName}</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => onDeleteConfirmTextChange(e.target.value)}
                className="mb-3 w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-white"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onShowDeleteConfirm(false);
                    onDeleteConfirmTextChange('');
                  }}
                  className="rounded-lg bg-white/[0.08] px-4 py-2 text-white hover:bg-white/[0.12]"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
                  disabled={deleteConfirmText !== forumName}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-600/50"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          )}
        </GlassCard>
      )}
    </motion.div>
  );
});
