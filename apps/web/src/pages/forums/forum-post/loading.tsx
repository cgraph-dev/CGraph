/**
 * Loading skeleton for ForumPost
 */

import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface PostSkeletonProps {
  forumSlug?: string;
}

/**
 * unknown for the forums module.
 */
/**
 * Post Skeleton — loading placeholder.
 */
export function PostSkeleton({ forumSlug: _forumSlug }: PostSkeletonProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-dark-900 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Skeleton back button */}
        <div className="mb-4 h-10 w-48 animate-pulse rounded bg-dark-800" />

        {/* Skeleton post card */}
        <div className="animate-pulse rounded-lg border border-dark-700 bg-dark-800 p-6">
          <div className="flex gap-4">
            {/* Vote sidebar skeleton */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 rounded bg-dark-700" />
              <div className="h-5 w-10 rounded bg-dark-700" />
              <div className="h-6 w-6 rounded bg-dark-700" />
            </div>

            {/* Content skeleton */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-dark-700" />
                <div className="h-4 w-32 rounded bg-dark-700" />
                <div className="h-4 w-24 rounded bg-dark-700" />
              </div>
              <div className="h-8 w-3/4 rounded bg-dark-700" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-dark-700" />
                <div className="h-4 w-full rounded bg-dark-700" />
                <div className="h-4 w-2/3 rounded bg-dark-700" />
              </div>
              <div className="flex gap-4 pt-4">
                <div className="h-8 w-28 rounded bg-dark-700" />
                <div className="h-8 w-20 rounded bg-dark-700" />
                <div className="h-8 w-16 rounded bg-dark-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BackButtonProps {
  forumSlug: string;
}

/**
 * unknown for the forums module.
 */
/**
 * Back Button component.
 */
export function BackButton({ forumSlug }: BackButtonProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-dark-700 bg-dark-800 px-4 py-3">
      <Link
        to={`/forums/${forumSlug}`}
        className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span>Back to c/{forumSlug}</span>
      </Link>
    </div>
  );
}
