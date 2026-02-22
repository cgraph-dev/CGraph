/**
 * Pagination component - page navigation controls
 */

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="border-border flex items-center justify-between border-t px-4 py-3">
      <div className="text-muted-foreground text-sm">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="border-border hover:bg-muted rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
}
