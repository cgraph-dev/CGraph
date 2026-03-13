/**
 * Input Component Stories for React Native/Expo
 *
 * Showcases the Input component with all states and configurations.
 *
 * @since v0.7.31
 */
import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import Input from '../input';

/**
 * Wrapper providing layout for stories
 */
function ThemeWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return <View style={{ gap: 16 }}>{children}</View>;
}

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  decorators: [
    (Story) => (
      <ThemeWrapper>
        <Story />
      </ThemeWrapper>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
    error: {
      control: 'text',
    },
    helperText: {
      control: 'text',
    },
    secureTextEntry: {
      control: 'boolean',
    },
    editable: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

/**
 * Default input with label
 */
export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
  },
};

/**
 * Input with helper text
 */
export const WithHelperText: Story = {
  args: {
    label: 'Username',
    placeholder: 'Choose a username',
    helperText: 'Must be 3-20 characters',
  },
};

/**
 * Input with error state
 */
export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    error: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

/**
 * Password input with secure text
 */
export const Password: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    secureTextEntry: true,
    rightIcon: 'eye-off-outline',
  },
};

/**
 * Input with left icon
 */
export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    leftIcon: 'search',
  },
};

/**
 * Input with right icon
 */
export const WithRightIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    rightIcon: 'mail-outline',
  },
};

/**
 * Disabled input
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    editable: false,
    defaultValue: 'Read only value',
  },
};

/**
 * Multiline input (textarea)
 */
export const Multiline: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself...',
    multiline: true,
    numberOfLines: 4,
  },
};

/**
 * All input states
 */
export const AllStates: Story = {
  render: () => (
    <ThemeWrapper>
      <Input label="Normal" placeholder="Normal input" />
      <Input label="With Value" defaultValue="Some value" />
      <Input label="With Error" error="This field is required" />
      <Input label="Disabled" editable={false} defaultValue="Disabled" />
      <Input label="With Icon" leftIcon="person-outline" placeholder="Username" />
    </ThemeWrapper>
  ),
};
