/**
 * AvatarPreviewCard component
 * @module modules/settings/components/avatar-settings
 */

import { SparklesIcon } from '@heroicons/react/24/outline';
import { AnimatedAvatar, GlassCard } from '@/shared/components/ui';

interface AvatarPreviewCardProps {
  avatarUrl?: string | null;
  displayName?: string;
}

export function AvatarPreviewCard({ avatarUrl, displayName }: AvatarPreviewCardProps) {
  return (
    <GlassCard className="p-8" variant="frosted">
      <div className="flex flex-col items-center gap-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <SparklesIcon className="h-5 w-5 text-primary-400" />
          Live Preview
        </h3>
        <AnimatedAvatar
          src={avatarUrl}
          alt={displayName || 'User'}
          size="xl"
          showStatus
          statusType="online"
        />
        <p className="text-sm text-gray-400">Your avatar with current settings</p>
      </div>
    </GlassCard>
  );
}
