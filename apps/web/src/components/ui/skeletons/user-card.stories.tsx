/**
 * Storybook stories for the UserCard skeleton and related components.
 * @module components/ui/skeletons/user-card.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import { UserCardSkeleton } from './user-card-skeleton';

const meta: Meta<typeof UserCardSkeleton> = {
  title: 'UI/UserCard',
  component: UserCardSkeleton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof UserCardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default user card in loading state */
export const Loading: Story = {
  render: () => (
    <div className="w-[300px]">
      <UserCardSkeleton />
    </div>
  ),
};

/** Mocked online user card */
export const Online: Story = {
  render: () => (
    <div className="w-[300px] rounded-lg border border-dark-700 bg-dark-800 p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary-600" />
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-800 bg-green-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Alice Johnson</p>
          <p className="text-xs text-gray-400">Online</p>
        </div>
      </div>
    </div>
  ),
};

/** Mocked offline user card */
export const Offline: Story = {
  render: () => (
    <div className="w-[300px] rounded-lg border border-dark-700 bg-dark-800 p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gray-600" />
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-800 bg-gray-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Bob Smith</p>
          <p className="text-xs text-gray-500">Last seen 2h ago</p>
        </div>
      </div>
    </div>
  ),
};

/** User card with custom status */
export const WithStatus: Story = {
  render: () => (
    <div className="w-[300px] rounded-lg border border-dark-700 bg-dark-800 p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-amber-600" />
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-dark-800 bg-amber-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Charlie Brown</p>
          <p className="text-xs text-amber-400">🎮 Playing games</p>
        </div>
      </div>
    </div>
  ),
};
