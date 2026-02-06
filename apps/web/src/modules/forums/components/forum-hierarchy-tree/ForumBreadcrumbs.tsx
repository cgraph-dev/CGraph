/**
 * Forum Breadcrumbs component
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { ForumBreadcrumbsProps } from './types';
import { useForumBreadcrumbs } from './useForumBreadcrumbs';

export const ForumBreadcrumbs = memo(function ForumBreadcrumbs({
  forumId,
  includeCurrent = true,
  className = '',
}: ForumBreadcrumbsProps) {
  const { breadcrumbs, loading } = useForumBreadcrumbs(forumId);

  if (loading || breadcrumbs.length === 0) {
    return null;
  }

  const displayCrumbs = includeCurrent ? breadcrumbs : breadcrumbs.slice(0, -1);

  if (displayCrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
      <Link
        to="/forums"
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Forums
      </Link>

      {displayCrumbs.map((crumb, idx) => (
        <span key={crumb.id} className="flex items-center">
          <ChevronRightIcon className="mx-2 h-4 w-4 text-gray-400" />
          {idx === displayCrumbs.length - 1 && includeCurrent ? (
            <span className="font-medium text-gray-900 dark:text-white">{crumb.name}</span>
          ) : (
            <Link
              to={`/forums/${crumb.slug}`}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {crumb.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
});
