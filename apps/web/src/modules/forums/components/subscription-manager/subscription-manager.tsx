/**
 * Forum subscription management component.
 * @module
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useSubscriptions } from './useSubscriptions';
import { SubscriptionItem } from './subscription-item';
import type { SubscriptionType, NotificationMode, SubscriptionManagerProps } from './types';

/**
 * unknown for the forums module.
 */
/**
 * Subscription Manager component.
 * @returns The rendered JSX element.
 */
export function SubscriptionManager({ className }: SubscriptionManagerProps): React.ReactElement {
  const {
    subscriptions,
    isLoading,
    bulkUpdating: _bulkUpdating,
    counts,
    totalUnread,
    updateSubscription,
    deleteSubscription,
    bulkUpdateMode,
  } = useSubscriptions();

  const [activeTab, setActiveTab] = useState<'all' | SubscriptionType>('all');

  const filteredSubscriptions =
    activeTab === 'all' ? subscriptions : subscriptions.filter((sub) => sub.type === activeTab);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Subscriptions
              {totalUnread > 0 && <Badge variant="destructive">{totalUnread} unread</Badge>}
            </CardTitle>
            <CardDescription>Manage your forum, board, and thread subscriptions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(value: string) => bulkUpdateMode(value as NotificationMode)}> // safe downcast – select event value
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Bulk update..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Set all Instant</SelectItem>
                <SelectItem value="daily">Set all Daily</SelectItem>
                <SelectItem value="weekly">Set all Weekly</SelectItem>
                <SelectItem value="none">Mute all</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="forum" className="flex-1">
                Forums ({counts.forum})
              </TabsTrigger>
              <TabsTrigger value="board" className="flex-1">
                Boards ({counts.board})
              </TabsTrigger>
              <TabsTrigger value="thread" className="flex-1">
                Threads ({counts.thread})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredSubscriptions.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <BellOff className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No subscriptions yet</p>
                  <p className="text-sm">
                    Subscribe to forums, boards, or threads to get notified of new activity
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSubscriptions.map((subscription) => (
                    <SubscriptionItem
                      key={subscription.id}
                      subscription={subscription}
                      onUpdate={updateSubscription}
                      onDelete={deleteSubscription}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;
