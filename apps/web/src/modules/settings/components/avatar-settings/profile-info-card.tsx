/**
 * ProfileInfoCard component
 * @module modules/settings/components/avatar-settings
 */

import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  GlobeAltIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import VisibilityBadge from '@/modules/settings/components/visibility-badge';
import type { AvatarSettingsFormData } from './types';
import { MAX_BIO_LENGTH, MAX_LOCATION_LENGTH, MAX_OCCUPATION_LENGTH } from './constants';

interface ProfileInfoCardProps {
  formData: AvatarSettingsFormData;
  onChange: (data: AvatarSettingsFormData) => void;
  onSave: () => void;
}

export function ProfileInfoCard({ formData, onChange, onSave }: ProfileInfoCardProps) {
  return (
    <GlassCard className="p-6" variant="holographic" glow>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Profile Information</h3>
        </div>
        <VisibilityBadge visible="others" />
      </div>

      <div className="space-y-4">
        {/* Bio */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => onChange({ ...formData, bio: e.target.value })}
            placeholder="Tell others about yourself..."
            maxLength={MAX_BIO_LENGTH}
            rows={4}
            className="w-full resize-none rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.bio.length}/{MAX_BIO_LENGTH} characters
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
            <MapPinIcon className="h-4 w-4" />
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => onChange({ ...formData, location: e.target.value })}
            placeholder="City, Country"
            maxLength={MAX_LOCATION_LENGTH}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Website */}
        <div>
          <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
            <GlobeAltIcon className="h-4 w-4" />
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => onChange({ ...formData, website: e.target.value })}
            placeholder="https://yourwebsite.com"
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Occupation */}
        <div>
          <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
            <BriefcaseIcon className="h-4 w-4" />
            Occupation
          </label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => onChange({ ...formData, occupation: e.target.value })}
            placeholder="Your profession or role"
            maxLength={MAX_OCCUPATION_LENGTH}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Save Profile Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onSave();
            HapticFeedback.success();
          }}
          className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-primary-800"
        >
          Save Profile Information
        </motion.button>
      </div>
    </GlassCard>
  );
}
