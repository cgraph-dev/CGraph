/**
 * MemberTableHeader component - sortable table headers
 */

import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { SortField, SortOrder } from './types';

interface MemberTableHeaderProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function SortIcon({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}) {
  if (sortField !== field) return null;
  return sortOrder === 'asc' ? (
    <ChevronUpIcon className="ml-1 inline h-4 w-4" />
  ) : (
    <ChevronDownIcon className="ml-1 inline h-4 w-4" />
  );
}

/**
 * unknown for the members module.
 */
/**
 * Member Table Header component.
 */
export function MemberTableHeader({ sortField, sortOrder, onSort }: MemberTableHeaderProps) {
  return (
    <thead>
      <tr className="bg-muted/50 border-border border-b">
        <th className="px-4 py-3 text-left font-medium text-foreground">
          <button
            onClick={() => onSort('username')}
            className="flex items-center transition-colors hover:text-primary"
          >
            Member
            <SortIcon field="username" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
        <th className="hidden px-4 py-3 text-left font-medium text-foreground sm:table-cell">
          Group
        </th>
        <th className="hidden px-4 py-3 text-left font-medium text-foreground md:table-cell">
          <button
            onClick={() => onSort('joined_at')}
            className="flex items-center transition-colors hover:text-primary"
          >
            Joined
            <SortIcon field="joined_at" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
        <th className="hidden px-4 py-3 text-center font-medium text-foreground lg:table-cell">
          <button
            onClick={() => onSort('post_count')}
            className="flex items-center justify-center transition-colors hover:text-primary"
          >
            Posts
            <SortIcon field="post_count" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
        <th className="hidden px-4 py-3 text-center font-medium text-foreground lg:table-cell">
          <button
            onClick={() => onSort('reputation')}
            className="flex items-center justify-center transition-colors hover:text-primary"
          >
            Rep
            <SortIcon field="reputation" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
        <th className="hidden px-4 py-3 text-left font-medium text-foreground xl:table-cell">
          <button
            onClick={() => onSort('last_active')}
            className="flex items-center transition-colors hover:text-primary"
          >
            Last Active
            <SortIcon field="last_active" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
      </tr>
    </thead>
  );
}
