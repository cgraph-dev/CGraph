import React from 'react';
import { Button } from '@/shared/components/ui';
import { Loader2, History } from 'lucide-react';
import type { UsernameHistory as UsernameHistoryItem } from '@/modules/settings/hooks/useUsernameChange';

interface UsernameHistoryProps {
  showHistory: boolean;
  onToggle: () => void;
  history: UsernameHistoryItem[];
  loading: boolean;
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function UsernameHistorySection({
  showHistory,
  onToggle,
  history,
  loading,
}: UsernameHistoryProps): React.ReactElement {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="text-muted-foreground w-full justify-start"
      >
        <History className="mr-2 h-4 w-4" />
        {showHistory ? 'Hide' : 'Show'} username history
      </Button>

      {showHistory && (
        <div className="max-h-40 overflow-y-auto rounded-md border p-3">
          {loading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground py-2 text-center text-sm">
              No username changes recorded
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-muted-foreground">{item.oldUsername}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{item.newUsername}</span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(item.changedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};

export default UsernameHistorySection;
