/**
 * SubscriptionItem
 *
 * Renders a single subscription row with notification mode controls and delete.
 *
 * @module modules/forums/components/subscription-manager/SubscriptionItem
 */

import React from 'react';
import {
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui';
import { MessageSquare, Layout, Folder, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Subscription, SubscriptionType, NotificationMode } from './types';

function getTypeIcon(type: SubscriptionType) {
  switch (type) {
    case 'forum':
      return <Layout className="h-4 w-4" />;
    case 'board':
      return <Folder className="h-4 w-4" />;
    case 'thread':
      return <MessageSquare className="h-4 w-4" />;
  }
}

function getTypeLabel(type: SubscriptionType): string {
  switch (type) {
    case 'forum':
      return 'Forum';
    case 'board':
      return 'Board';
    case 'thread':
      return 'Thread';
  }
}

interface SubscriptionItemProps {
  subscription: Subscription;
  onUpdate: (id: string, updates: Partial<Subscription>) => void;
  onDelete: (id: string) => void;
}

export function SubscriptionItem({
  subscription,
  onUpdate,
  onDelete,
}: SubscriptionItemProps): React.ReactElement {
  return (
    <div className="bg-card hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-colors">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="bg-primary/10 flex-shrink-0 rounded-md p-2">
          {getTypeIcon(subscription.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{subscription.targetName}</p>
            {subscription.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {subscription.unreadCount}
              </Badge>
            )}
          </div>
          {subscription.targetPath && (
            <p className="text-muted-foreground truncate text-xs">{subscription.targetPath}</p>
          )}
          <p className="text-muted-foreground text-xs">
            {getTypeLabel(subscription.type)} • Subscribed{' '}
            {formatDistanceToNow(new Date(subscription.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={subscription.notificationMode}
          onValueChange={(value: string) =>
            onUpdate(subscription.id, { notificationMode: value as NotificationMode }) // safe downcast – select event value
          }
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instant">Instant</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="none">Muted</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(subscription.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
