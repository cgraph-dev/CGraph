/**
 * MemberTableSkeleton component - loading state for member table
 */

export function MemberTableSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={i} className="border-border border-b">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
              <div className="space-y-2">
                <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              </div>
            </div>
          </td>
          <td className="hidden px-4 py-3 sm:table-cell">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          </td>
          <td className="hidden px-4 py-3 md:table-cell">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className="bg-muted mx-auto h-4 w-12 animate-pulse rounded" />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className="bg-muted mx-auto h-4 w-12 animate-pulse rounded" />
          </td>
          <td className="hidden px-4 py-3 xl:table-cell">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}
