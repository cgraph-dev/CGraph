import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState, EmptyMessages, EmptyConversations, EmptySearchResults, EmptyGroups, EmptyNotifications } from './EmptyState';

/**
 * EmptyState Component Stories
 * 
 * Empty state components for when there's no data to display.
 * Includes pre-configured variants for common scenarios.
 * 
 * @since v0.7.30
 */
const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Empty state component with icon, title, description, and optional action button.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title text',
    },
    description: {
      control: 'text',
      description: 'Description text below title',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96 bg-dark-800 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic empty state
 */
export const Default: Story = {
  args: {
    title: 'No items found',
    description: 'There are no items to display at this time.',
  },
};

/**
 * With icon
 */
export const WithIcon: Story = {
  args: {
    title: 'No data available',
    description: 'Start by adding some data to see it here.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
};

/**
 * With action button
 */
export const WithAction: Story = {
  args: {
    title: 'No projects yet',
    description: 'Create your first project to get started.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    action: {
      label: 'Create Project',
      onClick: () => console.log('Create clicked'),
    },
  },
};

/**
 * Empty messages
 */
export const Messages: Story = {
  args: {
    title: 'No messages',
  },
  render: () => <EmptyMessages onStartConversation={() => console.log('Start conversation')} />,
};

/**
 * Empty conversations
 */
export const Conversations: Story = {
  args: {
    title: 'No conversations',
  },
  render: () => <EmptyConversations onNewConversation={() => console.log('New conversation')} />,
};

/**
 * Empty search results
 */
export const SearchResults: Story = {
  args: {
    title: 'No results',
  },
  render: () => <EmptySearchResults query="example query" />,
};

/**
 * Empty groups
 */
export const Groups: Story = {
  args: {
    title: 'No groups',
  },
  render: () => <EmptyGroups onCreateGroup={() => console.log('Create group')} />,
};

/**
 * Empty notifications
 */
export const Notifications: Story = {
  args: {
    title: 'No notifications',
  },
  render: () => <EmptyNotifications />,
};

/**
 * Custom styled empty state
 */
export const CustomStyled: Story = {
  args: {
    title: 'All caught up!',
    description: 'You\'ve read all your notifications.',
    icon: (
      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    className: 'py-8',
  },
};

/**
 * Error state variant
 */
export const ErrorState: Story = {
  args: {
    title: 'Something went wrong',
    description: 'We couldn\'t load your data. Please try again.',
    icon: (
      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    action: {
      label: 'Retry',
      onClick: () => console.log('Retry clicked'),
    },
  },
};
