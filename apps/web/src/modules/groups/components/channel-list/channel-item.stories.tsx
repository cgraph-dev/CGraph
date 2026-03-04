/**
 * Storybook stories for the ChannelItem component.
 * @module modules/groups/components/channel-item.stories
 */
import type { Meta, StoryObj } from '@storybook/react';

/** Isolated channel item mock for Storybook */
function MockChannelItem({
  name = 'general',
  type = 'text',
  isActive = false,
  isMuted = false,
  unreadCount = 0,
}: {
  name?: string;
  type?: 'text' | 'voice' | 'announcement';
  isActive?: boolean;
  isMuted?: boolean;
  unreadCount?: number;
}) {
  const icons: Record<string, string> = { text: '#', voice: '🔊', announcement: '📢' };
  const bg = isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.08]';
  const textColor = isMuted ? 'text-gray-600' : unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400';

  return (
    <div className={`flex w-[240px] cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 ${bg}`}>
      <span className={`text-sm ${isMuted ? 'text-gray-600' : 'text-gray-400'}`}>
        {icons[type]}
      </span>
      <span className={`flex-1 truncate text-sm ${textColor}`}>{name}</span>
      {isMuted && <span className="text-[10px] text-gray-600">🔇</span>}
      {unreadCount > 0 && !isMuted && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}

const meta: Meta<typeof MockChannelItem> = {
  title: 'Groups/ChannelItem',
  component: MockChannelItem,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'voice', 'announcement'] },
    isActive: { control: 'boolean' },
    isMuted: { control: 'boolean' },
    unreadCount: { control: { type: 'number', min: 0, max: 200 } },
  },
} satisfies Meta<typeof MockChannelItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextChannel: Story = {
  args: { name: 'general', type: 'text' },
};

export const VoiceChannel: Story = {
  args: { name: 'lounge', type: 'voice' },
};

export const Active: Story = {
  args: { name: 'design', type: 'text', isActive: true },
};

export const Unread: Story = {
  args: { name: 'announcements', type: 'announcement', unreadCount: 3 },
};

export const ManyUnread: Story = {
  args: { name: 'off-topic', type: 'text', unreadCount: 142 },
};

export const Muted: Story = {
  args: { name: 'spam', type: 'text', isMuted: true },
};
