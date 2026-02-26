/**
 * Tri-state permission toggle (Inherit / Allow / Deny).
 *
 * @module modules/forums/components/forum-permissions
 */

import {
  CheckIcon,
  MinusIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import type { PermValue } from './types';

interface PermToggleProps {
  value: PermValue;
  onClick: () => void;
}

const TOGGLE_CONFIG = {
  inherit: {
    icon: MinusIcon,
    bg: 'bg-dark-600',
    text: 'text-gray-400',
  },
  allow: {
    icon: CheckIcon,
    bg: 'bg-green-500/20',
    text: 'text-green-400',
  },
  deny: {
    icon: NoSymbolIcon,
    bg: 'bg-red-500/20',
    text: 'text-red-400',
  },
} as const;

/**
 * unknown for the forums module.
 */
/**
 * Perm Toggle component.
 * @returns The rendered JSX element.
 */
export function PermToggle({ value, onClick }: PermToggleProps): React.ReactElement {
  const config = TOGGLE_CONFIG[value];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${config.bg} ${config.text} hover:opacity-80`}
      title={value.charAt(0).toUpperCase() + value.slice(1)}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
