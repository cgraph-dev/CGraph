/**
 * Storybook stories for the NotificationItem component.
 * @module pages/notifications/notification-item.stories
 */
import type { Meta, StoryObj } from '@storybook/react';

/** Isolated notification item mock for Storybook */
function MockNotificationItem({
  type = 'message',
  title = 'New message from Alice',
  description = 'Hey, are you free for a call?',
  time = '2m ago',
  isRead = false,
}: {
  type?: 'message' | 'mention' | 'reaction' | 'system';
  title?: string;
  description?: string;
  time?: string;
  isRead?: boolean;
}) {
  const icons: Record<string, string> = {
    message: '💬',
    mention: '@',
    reaction: '❤️',
    system: '🔔',
  };

  return (
    <div
      className={`flex w-[380px] cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${
        isRead ? 'hover:bg-dark-800' : 'bg-dark-800/50 hover:bg-dark-700'
      }`}
    >
      {/* Icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-600 text-sm">
        {icons[type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm ${isRead ? 'text-gray-400' : 'font-medium text-white'}`}>
            {title}
          </p>
          {!isRead && <div className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />}
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500">{description}</p>
        <p className="mt-1 text-[10px] text-gray-600">{time}</p>
      </div>
    </div>
  );
}

const meta: Meta<typeof MockNotificationItem> = {
  title: 'Notifications/NotificationItem',
  component: MockNotificationItem,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['message', 'mention', 'reaction', 'system'] },
    isRead: { control: 'boolean' },
  },
} satisfies Meta<typeof MockNotificationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Message: Story = {
  args: {
    type: 'message',
    title: 'New message from Alice',
    description: 'Hey, are you free for a call?',
    isRead: false,
  },
};

export const Mention: Story = {
  args: {
    type: 'mention',
    title: 'Bob mentioned you in #design',
    description: '@you check out this mockup',
    isRead: false,
  },
};

export const Reaction: Story = {
  args: {
    type: 'reaction',
    title: 'Charlie reacted ❤️ to your message',
    description: '"Great work on the PR!"',
    isRead: true,
  },
};

export const System: Story = {
  args: {
    type: 'system',
    title: 'Server maintenance scheduled',
    description: 'CGraph will be briefly unavailable on Saturday 3 AM UTC.',
    time: '1d ago',
    isRead: true,
  },
};

export const Unread: Story = {
  args: {
    type: 'message',
    title: 'Diana sent you a photo',
    description: 'screenshot.png',
    time: '5m ago',
    isRead: false,
  },
};
