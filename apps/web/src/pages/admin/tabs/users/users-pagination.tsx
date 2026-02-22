interface UsersPaginationProps {
  page: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function UsersPagination({ page, perPage, totalCount, onPageChange }: UsersPaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of {totalCount}{' '}
        users
      </p>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-50 dark:bg-gray-700"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page * perPage >= totalCount}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-50 dark:bg-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
