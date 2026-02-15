import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

/**
 * Avatar Component Stories
 *
 * The Avatar component displays user profile images with status indicators
 * and fallback support when images are unavailable.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Avatar component with online status indicator, size variants, and automatic fallback generation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the avatar',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    status: {
      control: 'select',
      options: [undefined, 'online', 'offline', 'away', 'busy'],
      description: 'Online status indicator',
    },
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text (also used for fallback initials)',
    },
    fallback: {
      control: 'text',
      description: 'Custom fallback text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default avatar with image
 */
export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    alt: 'John Doe',
  },
};

/**
 * Avatar without image (shows initials)
 */
export const WithInitials: Story = {
  args: {
    alt: 'Jane Smith',
  },
};

/**
 * Online status
 */
export const Online: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    alt: 'Sarah Johnson',
    status: 'online',
  },
};

/**
 * Offline status
 */
export const Offline: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    alt: 'Mike Wilson',
    status: 'offline',
  },
};

/**
 * Away status
 */
export const Away: Story = {
  args: {
    alt: 'Alex Turner',
    status: 'away',
  },
};

/**
 * Busy status
 */
export const Busy: Story = {
  args: {
    alt: 'Emma Davis',
    status: 'busy',
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  args: {
    alt: 'Size Demo',
  },
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="xs" alt="Extra Small" />
      <Avatar size="sm" alt="Small Size" />
      <Avatar size="md" alt="Medium Size" />
      <Avatar size="lg" alt="Large Size" />
      <Avatar size="xl" alt="Extra Large" />
    </div>
  ),
};

/**
 * All statuses comparison
 */
export const AllStatuses: Story = {
  args: {
    alt: 'Status Demo',
  },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar alt="Online User" status="online" />
      <Avatar alt="Offline User" status="offline" />
      <Avatar alt="Away User" status="away" />
      <Avatar alt="Busy User" status="busy" />
    </div>
  ),
};

/**
 * User list example
 */
export const UserList: Story = {
  args: {
    alt: 'User List Demo',
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
          alt="John Doe"
          status="online"
        />
        <div>
          <div className="font-medium text-white">John Doe</div>
          <div className="text-sm text-gray-400">Online</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar alt="Jane Smith" status="away" />
        <div>
          <div className="font-medium text-white">Jane Smith</div>
          <div className="text-sm text-gray-400">Away</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar alt="Bob Wilson" status="busy" />
        <div>
          <div className="font-medium text-white">Bob Wilson</div>
          <div className="text-sm text-gray-400">In a meeting</div>
        </div>
      </div>
    </div>
  ),
};
