/**
 * LoadingSpinner Component Stories for React Native/Expo
 *
 * Showcases loading and spinner states.
 *
 * @since v0.7.31
 */
import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import LoadingSpinner from '../loading-spinner';

/**
 * Wrapper providing layout for stories
 */
function ThemeWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
  <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>{children}</View>
);
}

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
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
      options: ['small', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

/**
 * Default spinner (small)
 */
export const Default: Story = {
  args: {
    size: 'small',
  },
};

/**
 * Large spinner
 */
export const Large: Story = {
  args: {
    size: 'large',
  },
};

/**
 * With loading text
 */
export const WithText: Story = {
  args: {
    size: 'large',
    text: 'Loading...',
  },
};

/**
 * Full screen overlay
 */
export const FullScreen: Story = {
  args: {
    size: 'large',
    text: 'Please wait...',
    fullScreen: true,
  },
};

/**
 * Size comparison
 */
export const SizeComparison: Story = {
  render: () => (
    <ThemeWrapper>
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
        <LoadingSpinner size="small" />
        <LoadingSpinner size="large" />
      </View>
    </ThemeWrapper>
  ),
};
