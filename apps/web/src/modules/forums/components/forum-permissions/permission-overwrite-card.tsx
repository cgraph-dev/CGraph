/**
 * Card displaying permission overwrites for a single group,
 * organized by permission category.
 *
 * @module modules/forums/components/forum-permissions
 */

import {
  XMarkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { PermissionDef, PermissionOverwrite } from './types';
import { PermToggle } from './perm-toggle';

interface PermissionOverwriteCardProps {
  overwrite: PermissionOverwrite;
  perms: readonly PermissionDef[];
  categories: string[];
  onDelete: (groupId: string) => void;
  onCyclePerm: (groupId: string, permKey: string) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Permission Overwrite Card display component.
 */
export function PermissionOverwriteCard({
  overwrite,
  perms,
  categories,
  onDelete,
  onCyclePerm,
}: PermissionOverwriteCardProps): React.ReactElement {
  return (
    <GlassCard variant="default" className="overflow-hidden">
      {/* Group header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-4 w-4 text-primary-400" />
          <span className="text-sm font-medium text-white">{overwrite.group_name}</span>
          <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-xs text-gray-400">
            {overwrite.applies_to}
          </span>
        </div>
        <button
          onClick={() => onDelete(overwrite.group_id)}
          className="rounded p-1 text-gray-500 hover:text-red-400"
          title="Remove overwrite"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Permissions by category */}
      <div className="divide-y divide-white/5">
        {categories.map((cat) => (
          <div key={cat} className="px-4 py-3">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              {cat}
            </h4>
            <div className="space-y-1">
              {perms
                .filter((p) => p.category === cat)
                .map((p) => {
                  const val = overwrite.permissions[p.key] ?? 'inherit';
                  return (
                    <div
                      key={p.key}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
                    >
                      <span className="text-sm text-gray-300">{p.label}</span>
                      <PermToggle
                        value={val}
                        onClick={() => onCyclePerm(overwrite.group_id, p.key)}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
