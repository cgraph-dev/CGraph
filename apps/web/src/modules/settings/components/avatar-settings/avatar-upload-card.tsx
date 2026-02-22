/**
 * AvatarUploadCard component
 * @module modules/settings/components/avatar-settings
 */

import { motion } from 'framer-motion';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import VisibilityBadge from '@/modules/settings/components/visibility-badge';
import type { FileUploadState } from './types';

interface AvatarUploadCardProps {
  upload: FileUploadState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
}

export function AvatarUploadCard({ upload, onChange, onUpload, onCancel }: AvatarUploadCardProps) {
  return (
    <GlassCard className="p-6" variant="crystal" glow>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhotoIcon className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Avatar Image</h3>
        </div>
        <VisibilityBadge visible="others" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Upload New Avatar</label>
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="block w-full cursor-pointer text-sm text-gray-400 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-700"
          />
          <p className="mt-1 text-xs text-gray-500">JPG, PNG, or GIF. Max 2MB.</p>
        </div>

        {upload.preview && (
          <div className="flex items-center gap-4">
            <img
              src={upload.preview}
              alt="Avatar preview"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-primary-500"
            />
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onUpload}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                Upload
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-dark-600"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
