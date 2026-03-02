/**
 * Storybook stories for the ForumThreadCard component.
 * @module pages/forums/forum-thread-card.stories
 */
import type { Meta, StoryObj } from '@storybook/react';

/** Isolated forum thread card mock for Storybook */
function MockForumThreadCard({
  title = 'How to implement dark mode?',
  author = 'Alice',
  replies = 12,
  views = 234,
  isPinned = false,
  isLocked = false,
  tags = ['design', 'css'],
  lastActivity = '2h ago',
}: {
  title?: string;
  author?: string;
  replies?: number;
  views?: number;
  isPinned?: boolean;
  isLocked?: boolean;
  tags?: string[];
  lastActivity?: string;
}) {
  return (
    <div className="w-[500px] rounded-lg border border-dark-700 bg-dark-800 p-4 transition-colors hover:border-dark-600">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary-600 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Status badges */}
          <div className="flex items-center gap-2 mb-1">
            {isPinned && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                📌 Pinned
              </span>
            )}
            {isLocked && (
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                🔒 Locked
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-white truncate">{title}</h3>

          {/* Tags */}
          <div className="mt-1 flex gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded bg-dark-600 px-2 py-0.5 text-[10px] text-gray-400">
                {tag}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{author}</span>
            <span>·</span>
            <span>{replies} replies</span>
            <span>·</span>
            <span>{views} views</span>
            <span>·</span>
            <span>{lastActivity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof MockForumThreadCard> = {
  title: 'Forum/ThreadCard',
  component: MockForumThreadCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    isPinned: { control: 'boolean' },
    isLocked: { control: 'boolean' },
  },
} satisfies Meta<typeof MockForumThreadCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'How to implement dark mode in React?',
    author: 'Alice',
    replies: 12,
    views: 234,
  },
};

export const Pinned: Story = {
  args: {
    title: 'Welcome to the CGraph Community!',
    author: 'Admin',
    replies: 48,
    views: 1203,
    isPinned: true,
    tags: ['announcement'],
  },
};

export const Locked: Story = {
  args: {
    title: 'Resolved: Login issues on mobile',
    author: 'Support',
    replies: 5,
    views: 89,
    isLocked: true,
    tags: ['bug', 'resolved'],
  },
};

export const PinnedAndLocked: Story = {
  args: {
    title: 'Community Guidelines — Read Before Posting',
    author: 'Moderator',
    replies: 0,
    views: 5421,
    isPinned: true,
    isLocked: true,
    tags: ['rules'],
  },
};

export const HighActivity: Story = {
  args: {
    title: 'Feature request: Voice channels',
    author: 'Bob',
    replies: 142,
    views: 3891,
    tags: ['feature-request', 'voice'],
    lastActivity: '5m ago',
  },
};
