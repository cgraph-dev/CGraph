/**
 * Avatar Component Stories for React Native/Expo
 *
 * Showcases the Avatar component with all sizes and states.
 *
 * @since v0.7.31
 */
import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import Avatar from '../Avatar';

/**
 * Wrapper providing layout for stories
 */
function ThemeWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
    {children}
  </View>
);
}

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  decorators: [
    (Story) => (
      <ThemeWrapper>
        <Story />
      </ThemeWrapper>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    status: {
      control: 'select',
      options: ['online', 'idle', 'dnd', 'offline', 'invisible'],
    },
    showStatus: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

/**
 * Avatar with initials (no image)
 */
export const WithInitials: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
};

/**
 * Avatar with image
 */
export const WithImage: Story = {
  args: {
    source: 'https://i.pravatar.cc/150?img=3',
    name: 'Jane Smith',
    size: 'md',
  },
};

/**
 * Avatar with online status
 */
export const OnlineStatus: Story = {
  args: {
    name: 'Active User',
    status: 'online',
    showStatus: true,
    size: 'lg',
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <ThemeWrapper>
      <Avatar name="XS" size="xs" />
      <Avatar name="SM" size="sm" />
      <Avatar name="MD" size="md" />
      <Avatar name="LG" size="lg" />
      <Avatar name="XL" size="xl" />
    </ThemeWrapper>
  ),
};

/**
 * All status indicators
 */
export const AllStatuses: Story = {
  render: () => (
    <ThemeWrapper>
      <Avatar name="Online" status="online" showStatus size="lg" />
      <Avatar name="Idle" status="idle" showStatus size="lg" />
      <Avatar name="DND" status="dnd" showStatus size="lg" />
      <Avatar name="Offline" status="offline" showStatus size="lg" />
    </ThemeWrapper>
  ),
};

/**
 * Fallback when no name provided
 */
export const Fallback: Story = {
  args: {
    size: 'md',
  },
};

/**
 * Custom size (number)
 */
export const CustomSize: Story = {
  args: {
    name: 'Custom',
    size: 100,
  },
};
