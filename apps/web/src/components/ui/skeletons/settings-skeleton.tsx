/**
 * SettingsSkeleton
 *
 * Loading placeholder for settings pages.
 * Sidebar navigation + content area with form fields.
 *
 * @module components/ui/skeletons/SettingsSkeleton
 */

interface SettingsSkeletonProps {
  className?: string;
}

function SettingsNavSkeleton() {
  return (
    <div className="w-48 space-y-1 border-r border-dark-600 py-4 pr-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-dark-700" style={{ width: '80%' }} />
      ))}
    </div>
  );
}

function SettingsContentSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="h-6 w-40 animate-pulse rounded bg-dark-700" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3.5 w-24 animate-pulse rounded bg-dark-700" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-dark-700" />
        </div>
      ))}
      <div className="h-10 w-28 animate-pulse rounded-lg bg-dark-700" />
    </div>
  );
}

/**
 * Skeleton for settings pages with sidebar + content layout.
 */
export function SettingsSkeleton({ className = '' }: SettingsSkeletonProps) {
  return (
    <div className={`flex ${className}`}>
      <SettingsNavSkeleton />
      <SettingsContentSkeleton />
    </div>
  );
}

export default SettingsSkeleton;
