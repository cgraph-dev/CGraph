/**
 * AdminSkeleton
 *
 * Loading placeholder for the admin dashboard.
 * Stats row + table/chart placeholders.
 *
 * @module components/ui/skeletons/AdminSkeleton
 */

interface AdminSkeletonProps {
  className?: string;
}

function StatCardSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border border-dark-600 p-4">
      <div className="h-3 w-20 animate-pulse rounded bg-dark-700" />
      <div className="h-8 w-16 animate-pulse rounded bg-dark-700" />
      <div className="h-3 w-24 animate-pulse rounded bg-dark-700" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-dark-600 px-4 py-3">
      <div className="h-4 w-8 animate-pulse rounded bg-dark-700" />
      <div className="h-4 w-32 animate-pulse rounded bg-dark-700" />
      <div className="h-4 w-24 animate-pulse rounded bg-dark-700" />
      <div className="h-4 w-20 animate-pulse rounded bg-dark-700" />
      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-dark-700" />
    </div>
  );
}

/**
 * Skeleton for the admin dashboard.
 */
export function AdminSkeleton({ className = '' }: AdminSkeletonProps) {
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Page title */}
      <div className="h-7 w-40 animate-pulse rounded bg-dark-700" />

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="h-64 w-full animate-pulse rounded-lg bg-dark-700" />

      {/* Table */}
      <div className="rounded-lg border border-dark-600">
        <div className="flex items-center gap-4 border-b border-dark-600 px-4 py-3">
          <div className="h-4 w-8 animate-pulse rounded bg-dark-600" />
          <div className="h-4 w-24 animate-pulse rounded bg-dark-600" />
          <div className="h-4 w-20 animate-pulse rounded bg-dark-600" />
          <div className="h-4 w-16 animate-pulse rounded bg-dark-600" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-dark-600" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default AdminSkeleton;
