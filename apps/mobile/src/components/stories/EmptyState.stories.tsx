/**
 * EmptyState Component Stories for React Native/Expo
 *
 * Showcases empty state messaging with icons and actions.
 *
 * @since v0.7.31
 */
import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import EmptyState from '../EmptyState';

/**
 * Wrapper providing layout for stories
 */
function ThemeWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
  <View style={{ minHeight: 300, justifyContent: 'center' }}>{children}</View>
);
}

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  decorators: [
    (Story) => (
      <ThemeWrapper>
        <Story />
      </ThemeWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * Default empty state
 */
export const Default: Story = {
  args: {
    title: 'No messages yet',
    description: 'Start a conversation to see messages here.',
  },
};

/**
 * With icon
 */
export const WithIcon: Story = {
  args: {
    icon: 'chatbubbles-outline',
    title: 'No conversations',
    description: 'Your conversations will appear here once you start chatting.',
  },
};

/**
 * With action button
 */
export const WithAction: Story = {
  args: {
    icon: 'people-outline',
    title: 'No friends yet',
    description: 'Add friends to start messaging.',
    actionText: 'Add Friends',
    onAction: () => console.warn('Add friends pressed'),
  },
};

/**
 * Search no results
 */
export const SearchNoResults: Story = {
  args: {
    icon: 'search',
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
};

/**
 * Error state
 */
export const ErrorState: Story = {
  args: {
    icon: 'alert-circle-outline',
    title: 'Something went wrong',
    description: "We couldn't load the content. Please try again.",
    actionText: 'Retry',
    onAction: () => console.warn('Retry pressed'),
  },
};
