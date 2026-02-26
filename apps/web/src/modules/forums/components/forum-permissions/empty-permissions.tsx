/**
 * Empty state displayed when no permission overwrites are configured.
 *
 * @module modules/forums/components/forum-permissions
 */

import { UserGroupIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

/**
 * unknown for the forums module.
 */
/**
 * Empty Permissions — fallback UI for empty data states.
 * @returns The rendered JSX element.
 */
export function EmptyPermissions(): React.ReactElement {
  return (
    <GlassCard variant="default" className="p-8 text-center">
      <UserGroupIcon className="mx-auto mb-2 h-8 w-8 text-gray-500" />
      <p className="text-sm text-gray-400">No permission overwrites configured</p>
      <p className="mt-1 text-xs text-gray-500">
        All groups inherit default permissions from the parent
      </p>
    </GlassCard>
  );
}
