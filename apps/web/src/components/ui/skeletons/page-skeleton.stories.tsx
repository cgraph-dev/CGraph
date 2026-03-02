/**
 * Storybook stories for page-level skeleton components.
 * @module components/ui/skeletons/page-skeleton.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ChannelListSkeleton } from './channel-list-skeleton';
import { ConversationSkeleton } from './conversation-skeleton';
import { ForumSkeleton } from './forum-skeleton';
import { SettingsSkeleton } from './settings-skeleton';

/** Wrapper that displays skeletons at a fixed viewport size */
function SkeletonShowcase({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[500px] w-[700px] overflow-hidden rounded-lg border border-dark-700 bg-dark-900 p-4">
      {children}
    </div>
  );
}

const meta: Meta = {
  title: 'Feedback/PageSkeleton',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const ChannelList: Story = {
  render: () => (
    <SkeletonShowcase>
      <ChannelListSkeleton />
    </SkeletonShowcase>
  ),
};

export const Conversation: Story = {
  render: () => (
    <SkeletonShowcase>
      <ConversationSkeleton />
    </SkeletonShowcase>
  ),
};

export const Forum: Story = {
  render: () => (
    <SkeletonShowcase>
      <ForumSkeleton />
    </SkeletonShowcase>
  ),
};

export const Settings: Story = {
  render: () => (
    <SkeletonShowcase>
      <SettingsSkeleton />
    </SkeletonShowcase>
  ),
};
