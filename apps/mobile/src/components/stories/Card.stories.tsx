/**
 * Card Component Stories for React Native/Expo
 *
 * Showcases the Card component with various content layouts.
 *
 * @since v0.7.31
 */
import React from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import Card from '../Card';

/**
 * Wrapper providing layout for stories
 */
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ gap: 16 }}>{children}</View>
);

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  decorators: [
    (Story) => (
      <ThemeWrapper>
        <Story />
      </ThemeWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

/**
 * Default card
 */
export const Default: Story = {
  args: {
    children: (
      <Text style={{ fontSize: 16, color: '#333' }}>This is a simple card with some content.</Text>
    ),
  },
};

/**
 * Card with header and body
 */
export const WithHeaderAndBody: Story = {
  render: () => (
    <ThemeWrapper>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
          Card Title
        </Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          This is the card body with some descriptive text that explains the content.
        </Text>
      </Card>
    </ThemeWrapper>
  ),
};

/**
 * Elevated card
 */
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: <Text style={{ fontSize: 16, color: '#333' }}>Elevated card with shadow.</Text>,
  },
};

/**
 * Outlined card
 */
export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: <Text style={{ fontSize: 16, color: '#333' }}>Outlined card with border.</Text>,
  },
};
