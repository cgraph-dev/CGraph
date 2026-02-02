import React, { useState, useEffect, useRef } from 'react';
import { createLogger } from '@/lib/logger';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
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

const logger = createLogger('SubscriptionManager');
import { Bell, BellOff, MessageSquare, Layout, Folder, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type NotificationMode = 'instant' | 'daily' | 'weekly' | 'none';
type SubscriptionType = 'forum' | 'board' | 'thread';

interface Subscription {
  id: string;
  type: SubscriptionType;
  targetId: string;
  targetName: string;
  targetPath?: string;
  notificationMode: NotificationMode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  unreadCount: number;
  createdAt: Date;
}

interface SubscriptionManagerProps {
  className?: string;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ className }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | SubscriptionType>('all');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // AbortController ref for cleanup on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController for this effect
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchSubscriptions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/forum/subscriptions', { signal });
        const data = await response.json();
        // Only update state if not aborted
        if (!signal.aborted) {
          setSubscriptions(data.subscriptions || []);
        }
      } catch (error) {
        // Ignore abort errors, log others
        if (error instanceof Error && error.name !== 'AbortError') {
          logger.error('Failed to fetch subscriptions:', error);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchSubscriptions();

    // Cleanup: abort any in-flight requests on unmount
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    try {
      await fetch(`/api/forum/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)));
    } catch (error) {
      logger.error('Failed to update subscription:', error);
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      await fetch(`/api/forum/subscriptions/${id}`, {
        method: 'DELETE',
      });
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (error) {
      logger.error('Failed to delete subscription:', error);
    }
  };

  const bulkUpdateMode = async (mode: NotificationMode) => {
    setBulkUpdating(true);
    try {
      await fetch('/api/forum/subscriptions/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationMode: mode }),
      });
      setSubscriptions((prev) => prev.map((sub) => ({ ...sub, notificationMode: mode })));
    } catch (error) {
      logger.error('Failed to bulk update:', error);
    } finally {
      setBulkUpdating(false);
    }
  };

  const getTypeIcon = (type: SubscriptionType) => {
    switch (type) {
      case 'forum':
        return <Layout className="h-4 w-4" />;
      case 'board':
        return <Folder className="h-4 w-4" />;
      case 'thread':
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SubscriptionType) => {
    switch (type) {
      case 'forum':
        return 'Forum';
      case 'board':
        return 'Board';
      case 'thread':
        return 'Thread';
    }
  };

  // Helper function for mode labels (used in UI)
  const _getModeLabel = (mode: NotificationMode) => {
    switch (mode) {
      case 'instant':
        return 'Instant';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'none':
        return 'Muted';
    }
  };
  // Keep for potential future use
  void _getModeLabel;

  const filteredSubscriptions =
    activeTab === 'all' ? subscriptions : subscriptions.filter((sub) => sub.type === activeTab);

  const counts = {
    all: subscriptions.length,
    forum: subscriptions.filter((s) => s.type === 'forum').length,
    board: subscriptions.filter((s) => s.type === 'board').length,
    thread: subscriptions.filter((s) => s.type === 'thread').length,
  };

  const totalUnread = subscriptions.reduce((acc, sub) => acc + sub.unreadCount, 0);

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
            <Select
              onValueChange={(value) => bulkUpdateMode(value as NotificationMode)}
              disabled={bulkUpdating || subscriptions.length === 0}
            >
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
          <>
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
                      <div
                        key={subscription.id}
                        className="bg-card hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                      >
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
                              <p className="text-muted-foreground truncate text-xs">
                                {subscription.targetPath}
                              </p>
                            )}
                            <p className="text-muted-foreground text-xs">
                              {getTypeLabel(subscription.type)} • Subscribed{' '}
                              {formatDistanceToNow(new Date(subscription.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={subscription.notificationMode}
                            onValueChange={(value) =>
                              updateSubscription(subscription.id, {
                                notificationMode: value as NotificationMode,
                              })
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
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteSubscription(subscription.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;
