/**
 * AuthorForumFilter – author text input & forum select with subforum toggle
 * @module modules/search/components/advanced-search
 */
import { UserIcon, FolderIcon } from '@heroicons/react/24/outline';
import {
  INPUT_CLS,
  SELECT_CLS,
  CHECKBOX_CLS,
  LABEL_CLS,
} from '@/modules/search/components/advanced-search/constants';
import type {
  AdvancedSearchFilters,
  Forum,
  FilterUpdateFn,
} from '@/modules/search/components/advanced-search/types';

interface AuthorForumFilterProps {
  filters: AdvancedSearchFilters;
  updateFilter: FilterUpdateFn;
  forums: Forum[];
}

export function AuthorForumFilter({ filters, updateFilter, forums }: AuthorForumFilterProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Author filter */}
      <div>
        <label className={LABEL_CLS}>
          <UserIcon className="mr-2 inline h-4 w-4" />
          Author
        </label>
        <input
          type="text"
          value={filters.author}
          onChange={(e) => updateFilter('author', e.target.value)}
          placeholder="Username..."
          className={INPUT_CLS}
        />
      </div>

      {/* Forum filter */}
      <div>
        <label className={LABEL_CLS}>
          <FolderIcon className="mr-2 inline h-4 w-4" />
          Forum
        </label>
        <select
          value={filters.forumId || ''}
          onChange={(e) => updateFilter('forumId', e.target.value || null)}
          className={SELECT_CLS}
        >
          <option value="">All Forums</option>
          {forums.map((forum) => (
            <option key={forum.id} value={forum.id}>
              {forum.name}
            </option>
          ))}
        </select>
        {filters.forumId && (
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={filters.includeSubforums}
              onChange={(e) => updateFilter('includeSubforums', e.target.checked)}
              className={CHECKBOX_CLS}
            />
            Include subforums
          </label>
        )}
      </div>
    </div>
  );
}
