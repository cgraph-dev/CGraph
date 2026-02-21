/**
 * Switch Component Stories for React Native/Expo
 *
 * Showcases the Switch toggle component.
 *
 * @since v0.7.31
 */
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import Switch from '../Switch';

/**
 * Wrapper providing layout for stories
 */
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ gap: 16 }}>{children}</View>
);

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  decorators: [
    (Story) => (
      <ThemeWrapper>
        <Story />
      </ThemeWrapper>
    ),
  ],
  argTypes: {
    value: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/**
 * Default switch (off)
 */
export const Off: Story = {
  args: {
    value: false,
  },
};

/**
 * Switch on
 */
export const On: Story = {
  args: {
    value: true,
  },
};

/**
 * Disabled switch
 */
export const Disabled: Story = {
  args: {
    value: false,
    disabled: true,
  },
};

/**
 * Disabled switch (on)
 */
export const DisabledOn: Story = {
  args: {
    value: true,
    disabled: true,
  },
};

/**
 * Interactive switch with label
 */
const InteractiveSwitch = () => {
  const [enabled, setEnabled] = useState(false);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Switch value={enabled} onValueChange={setEnabled} />
      <Text style={{ fontSize: 16, color: '#333' }}>{enabled ? 'Enabled' : 'Disabled'}</Text>
    </View>
  );
};

export const Interactive: Story = {
  render: () => (
    <ThemeWrapper>
      <InteractiveSwitch />
    </ThemeWrapper>
  ),
};
