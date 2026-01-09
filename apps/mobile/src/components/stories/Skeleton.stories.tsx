/**
 * Skeleton Component Stories for React Native/Expo
 * 
 * Showcases skeleton loading placeholders.
 * 
 * @since v0.7.31
 */
import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import Skeleton from '../Skeleton';
import { ThemeProvider } from '../../contexts/ThemeContext';

/**
 * Wrapper to provide theme context
 */
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <View style={{ gap: 16 }}>
      {children}
    </View>
  </ThemeProvider>
);

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  decorators: [
    (Story) => (
      <ThemeWrapper>
        <Story />
      </ThemeWrapper>
    ),
  ],
  argTypes: {
    width: {
      control: 'number',
    },
    height: {
      control: 'number',
    },
    borderRadius: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/**
 * Default skeleton line
 */
export const Default: Story = {
  args: {
    width: 200,
    height: 20,
  },
};

/**
 * Circle skeleton (avatar placeholder)
 */
export const Circle: Story = {
  args: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
};

/**
 * Card skeleton
 */
export const Card: Story = {
  args: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
};

/**
 * Text block skeleton
 */
export const TextBlock: Story = {
  render: () => (
    <ThemeWrapper>
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
      <Skeleton width="60%" height={16} />
    </ThemeWrapper>
  ),
};

/**
 * User card skeleton
 */
export const UserCardSkeleton: Story = {
  render: () => (
    <ThemeWrapper>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
    </ThemeWrapper>
  ),
};

/**
 * Message list skeleton
 */
export const MessageListSkeleton: Story = {
  render: () => (
    <ThemeWrapper>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="30%" height={14} />
            <Skeleton width="80%" height={16} />
            <Skeleton width="50%" height={16} />
          </View>
        </View>
      ))}
    </ThemeWrapper>
  ),
};
