import React from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Label,
  Separator,
} from '@/shared/components/ui';

type SubscriptionType = 'forum' | 'board' | 'thread';
type NotificationMode = 'instant' | 'daily' | 'weekly' | 'none';

interface SubscriptionButtonProps {
  type: SubscriptionType;
  targetId: string;
  isSubscribed: boolean;
  subscriptionId?: string;
  notificationMode?: NotificationMode;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  onSubscribe: (settings: SubscriptionSettings) => Promise<void>;
  onUnsubscribe: () => Promise<void>;
  onUpdateSettings: (settings: Partial<SubscriptionSettings>) => Promise<void>;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

interface SubscriptionSettings {
  notificationMode: NotificationMode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  includeReplies: boolean;
}

export const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({
  type,
  isSubscribed,
  notificationMode = 'instant',
  emailEnabled = true,
  pushEnabled = true,
  onSubscribe,
  onUnsubscribe,
  onUpdateSettings,
  className,
  variant = 'outline',
  size = 'default',
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<SubscriptionSettings>({
    notificationMode,
    emailNotifications: emailEnabled,
    pushNotifications: pushEnabled,
    includeReplies: true,
  });

  const getLabel = () => {
    switch (type) {
      case 'forum':
        return isSubscribed ? 'Watching Forum' : 'Watch Forum';
      case 'board':
        return isSubscribed ? 'Watching Board' : 'Watch Board';
      case 'thread':
        return isSubscribed ? 'Watching' : 'Watch Thread';
    }
  };

  const getModeDescription = (mode: NotificationMode) => {
    switch (mode) {
      case 'instant':
        return 'Get notified immediately';
      case 'daily':
        return 'Daily digest email';
      case 'weekly':
        return 'Weekly digest email';
      case 'none':
        return 'No notifications';
    }
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await onUnsubscribe();
      } else {
        await onSubscribe(settings);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = async (newSettings: Partial<SubscriptionSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (isSubscribed) {
      await onUpdateSettings(newSettings);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handleToggle}
        disabled={isLoading}
        className={isSubscribed ? 'bg-primary/10' : ''}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="text-primary mr-2 h-4 w-4" />
        ) : (
          <BellOff className="mr-2 h-4 w-4" />
        )}
        {getLabel()}
      </Button>

      {isSubscribed && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="sr-only">Subscription settings</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Notification Settings</h4>
                <p className="text-muted-foreground text-xs">Customize how you receive updates</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label htmlFor="notification-mode" className="text-sm">
                    Notification Frequency
                  </Label>
                  <Select
                    value={settings.notificationMode}
                    onValueChange={(value) =>
                      handleSettingsChange({ notificationMode: value as NotificationMode })
                    }
                  >
                    <SelectTrigger id="notification-mode" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {getModeDescription(settings.notificationMode)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="text-sm">
                    Email Notifications
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingsChange({ emailNotifications: checked })
                    }
                    disabled={settings.notificationMode === 'none'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications" className="text-sm">
                    Push Notifications
                  </Label>
                  <Switch
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingsChange({ pushNotifications: checked })
                    }
                    disabled={settings.notificationMode === 'none'}
                  />
                </div>

                {type === 'thread' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="include-replies" className="text-sm">
                        Include Replies
                      </Label>
                      <p className="text-muted-foreground text-xs">Get notified for all replies</p>
                    </div>
                    <Switch
                      id="include-replies"
                      checked={settings.includeReplies}
                      onCheckedChange={(checked) =>
                        handleSettingsChange({ includeReplies: checked })
                      }
                      disabled={settings.notificationMode === 'none'}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  handleToggle();
                  setIsOpen(false);
                }}
              >
                <BellOff className="mr-2 h-4 w-4" />
                Unsubscribe
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default SubscriptionButton;
