/**
 * StatusBadge Component Stories for React Native/Expo
 *
 * Showcases status indicators and badges.
 *
 * @since v0.7.31
 */
import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import StatusBadge from '../StatusBadge';

/**
 * Wrapper providing layout for stories
 */
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>{children}</View>
);

const meta: Meta<typeof StatusBadge> = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  decorators: [
    (Story) => (
      <ThemeWrapper>
        <Story />
      </ThemeWrapper>
    ),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'idle', 'dnd', 'offline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

/**
 * Online status
 */
export const Online: Story = {
  args: {
    status: 'online',
  },
};

/**
 * Idle status
 */
export const Idle: Story = {
  args: {
    status: 'idle',
  },
};

/**
 * Do Not Disturb
 */
export const DoNotDisturb: Story = {
  args: {
    status: 'dnd',
  },
};

/**
 * Offline status
 */
export const Offline: Story = {
  args: {
    status: 'offline',
  },
};

/**
 * All statuses comparison
 */
export const AllStatuses: Story = {
  render: () => (
    <ThemeWrapper>
      <StatusBadge status="online" />
      <StatusBadge status="idle" />
      <StatusBadge status="dnd" />
      <StatusBadge status="offline" />
    </ThemeWrapper>
  ),
};
