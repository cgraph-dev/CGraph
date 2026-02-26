/**
 * Section for adding a new group permission overwrite.
 *
 * @module modules/forums/components/forum-permissions
 */

import { PlusIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { GroupOption, PermissionOverwrite } from './types';

interface AddGroupSectionProps {
  showAdd: boolean;
  selectedGroupId: string;
  groups: GroupOption[];
  overwrites: PermissionOverwrite[];
  onToggleAdd: (show: boolean) => void;
  onSelectGroup: (id: string) => void;
  onAdd: () => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Add Group Section section component.
 */
export function AddGroupSection({
  showAdd,
  selectedGroupId,
  groups,
  overwrites,
  onToggleAdd,
  onSelectGroup,
  onAdd,
}: AddGroupSectionProps): React.ReactElement {
  return (
    <GlassCard variant="default" className="p-4">
      {showAdd ? (
        <div className="flex items-center gap-2">
          <select
            value={selectedGroupId}
            onChange={(e) => onSelectGroup(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-dark-700 px-3 py-2 text-sm text-white"
          >
            <option value="">Select group…</option>
            {groups
              .filter((g) => !overwrites.some((ow) => ow.group_id === g.id))
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
          </select>
          <button
            onClick={onAdd}
            disabled={!selectedGroupId}
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-500 disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => onToggleAdd(false)}
            className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => onToggleAdd(true)}
          className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <PlusIcon className="h-4 w-4" />
          Add group overwrite
        </button>
      )}
    </GlassCard>
  );
}
