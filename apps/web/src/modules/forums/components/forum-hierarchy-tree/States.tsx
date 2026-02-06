/**
 * Loading and Empty states
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className = '' }: LoadingStateProps) {
  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <span className="text-sm">Loading forums...</span>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  className?: string;
}

export function ErrorState({ error, className = '' }: ErrorStateProps) {
  return (
    <div className={`p-4 ${className}`}>
      <div className="text-sm text-red-500">{error}</div>
    </div>
  );
}

interface EmptyStateProps {
  className?: string;
}

export function EmptyState({ className = '' }: EmptyStateProps) {
  return (
    <div className={`p-4 ${className}`}>
      <div className="flex flex-col items-center text-center text-gray-500">
        <GlobeAltIcon className="mb-2 h-8 w-8 text-gray-300" />
        <span className="text-sm">No forums yet</span>
      </div>
    </div>
  );
}
