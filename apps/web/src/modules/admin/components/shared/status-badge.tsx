import clsx from 'clsx';

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    banned: 'bg-red-100 text-red-700',
    deleted: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={clsx(
        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        colors[status] || colors.active
      )}
    >
      {status}
    </span>
  );
}
