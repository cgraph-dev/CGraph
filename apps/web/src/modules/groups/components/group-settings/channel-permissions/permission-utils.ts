/**
 * Permission bitmask utility functions
 *
 * @module modules/groups/components/group-settings/channel-permissions
 */

import type { PermState } from './types';

export function getPermState(allow: number, deny: number, bit: number): PermState {
  if (allow & bit) return 'allow';
  if (deny & bit) return 'deny';
  return 'inherit';
}

export function cyclePermState(current: PermState): PermState {
  if (current === 'inherit') return 'allow';
  if (current === 'allow') return 'deny';
  return 'inherit';
}

export function applyPermChange(
  allow: number,
  deny: number,
  bit: number,
  newState: PermState
): { allow: number; deny: number } {
  // Clear the bit from both
  let newAllow = allow & ~bit;
  let newDeny = deny & ~bit;
  if (newState === 'allow') newAllow |= bit;
  if (newState === 'deny') newDeny |= bit;
  return { allow: newAllow, deny: newDeny };
}
