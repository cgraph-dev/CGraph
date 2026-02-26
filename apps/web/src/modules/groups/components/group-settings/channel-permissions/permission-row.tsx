/**
 * PermissionRow - A single permission toggle (Allow / Deny / Inherit)
 *
 * @module modules/groups/components/group-settings/channel-permissions
 */

import { CheckIcon, XCircleIcon, MinusIcon } from '@heroicons/react/24/outline';
import type { PermState } from './types';

interface PermissionRowProps {
  bit: number;
  label: string;
  description: string;
  state: PermState;
  onToggle: (bit: number) => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Permission Row component.
 */
export function PermissionRow({ bit, label, description, state, onToggle }: PermissionRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-dark-700/50">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onToggle(bit)}
        className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
          state === 'allow'
            ? 'bg-green-500/10 text-green-400'
            : state === 'deny'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-gray-700/50 text-gray-400'
        }`}
      >
        {state === 'allow' && <CheckIcon className="h-3.5 w-3.5" />}
        {state === 'deny' && <XCircleIcon className="h-3.5 w-3.5" />}
        {state === 'inherit' && <MinusIcon className="h-3.5 w-3.5" />}
        {state === 'inherit' ? 'Inherit' : state === 'allow' ? 'Allow' : 'Deny'}
      </button>
    </div>
  );
}
