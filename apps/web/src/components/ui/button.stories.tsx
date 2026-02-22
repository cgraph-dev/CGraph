import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './button';

/**
 * Button Component Stories
 *
 * The Button component is the primary interactive element used throughout
 * the CGraph application. It supports multiple variants, sizes, and states.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with multiple variants, sizes, loading states, and icon support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'],
      description: 'Visual style variant of the button',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes the button take full container width',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
  args: {
    onClick: fn(),
    children: 'Button',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary button - used for main actions
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Secondary button - used for alternative actions
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Outline button - subtle button with border
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * Ghost button - minimal button for less prominent actions
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Danger button - used for destructive actions
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

/**
 * Success button - used for positive confirmations
 */
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Confirm',
  },
};

/**
 * Small size button
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

/**
 * Large size button
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Processing...',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
};

/**
 * All sizes showcase
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * With left icon
 */
export const WithLeftIcon: Story = {
  args: {
    leftIcon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    children: 'Add Item',
  },
};

/**
 * With right icon
 */
export const WithRightIcon: Story = {
  args: {
    rightIcon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 5l7 7m0 0l-7 7m7-7H3"
        />
      </svg>
    ),
    children: 'Continue',
  },
};
