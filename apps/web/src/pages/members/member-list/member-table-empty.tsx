/**
 * MemberTableEmpty component - empty state for member table
 */

import { UserIcon } from '@heroicons/react/24/outline';

/**
 * unknown for the members module.
 */
/**
 * Member Table Empty component.
 */
export function MemberTableEmpty() {
  return (
    <tr>
      <td colSpan={6} className="text-muted-foreground px-4 py-12 text-center">
        <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p className="text-lg font-medium">No members found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </td>
    </tr>
  );
}
