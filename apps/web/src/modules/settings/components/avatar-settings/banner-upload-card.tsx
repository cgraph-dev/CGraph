/**
 * BannerUploadCard component
 * @module modules/settings/components/avatar-settings
 */

import { motion } from 'motion/react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import VisibilityBadge from '@/modules/settings/components/visibility-badge';
import type { FileUploadState } from './types';

interface BannerUploadCardProps {
  upload: FileUploadState;
  currentBannerUrl?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Banner Upload Card display component.
 */
export function BannerUploadCard({
  upload,
  currentBannerUrl,
  onChange,
  onUpload,
  onCancel,
}: BannerUploadCardProps) {
  const displayUrl = upload.preview || currentBannerUrl;

  return (
    <GlassCard className="p-6" variant="crystal" glow>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhotoIcon className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Profile Banner</h3>
        </div>
        <VisibilityBadge visible="others" />
      </div>

      <div className="space-y-4">
        {displayUrl && (
          <div className="h-32 w-full overflow-hidden rounded-lg ring-2 ring-gray-700">
            <img src={displayUrl} alt="Banner preview" className="h-full w-full object-cover" />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Upload New Banner</label>
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="block w-full cursor-pointer text-sm text-gray-400 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
          />
          <p className="mt-1 text-xs text-gray-500">
            JPG or PNG. Recommended: 1500x500px. Max 5MB.
          </p>
        </div>

        {upload.file && (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUpload}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Upload Banner
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.10]"
            >
              Cancel
            </motion.button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
