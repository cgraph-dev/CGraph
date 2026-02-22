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

export function MemberTableHeader({ sortField, sortOrder, onSort }: MemberTableHeaderProps) {
  return (
    <thead>
      <tr className="bg-muted/50 border-border border-b">
        <th className="text-foreground px-4 py-3 text-left font-medium">
          <button
            onClick={() => onSort('username')}
            className="hover:text-primary flex items-center transition-colors"
          >
            Member
            <SortIcon field="username" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
        <th className="text-foreground hidden px-4 py-3 text-left font-medium sm:table-cell">
          Group
        </th>
        <th className="text-foreground hidden px-4 py-3 text-left font-medium md:table-cell">
          <button
            onClick={() => onSort('joined_at')}
            className="hover:text-primary flex items-center transition-colors"
          >
            Joined
            <SortIcon field="joined_at" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
        <th className="text-foreground hidden px-4 py-3 text-center font-medium lg:table-cell">
          <button
            onClick={() => onSort('post_count')}
            className="hover:text-primary flex items-center justify-center transition-colors"
          >
            Posts
            <SortIcon field="post_count" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
        <th className="text-foreground hidden px-4 py-3 text-center font-medium lg:table-cell">
          <button
            onClick={() => onSort('reputation')}
            className="hover:text-primary flex items-center justify-center transition-colors"
          >
            Rep
            <SortIcon field="reputation" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
        <th className="text-foreground hidden px-4 py-3 text-left font-medium xl:table-cell">
          <button
            onClick={() => onSort('last_active')}
            className="hover:text-primary flex items-center transition-colors"
          >
            Last Active
            <SortIcon field="last_active" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </th>
      </tr>
    </thead>
  );
}
