/**
 * Storybook stories for the ProgressBar feedback component.
 * @module components/feedback/progress-bar.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import ProgressBar from './progress-bar';

/**
 * ProgressBar Component Stories
 *
 * The ProgressBar component visually represents task completion or
 * loading state with configurable colors, sizes, and labels.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A progress bar component with multiple color schemes, sizes, optional labels, and an animated pulse mode.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'Current progress value',
    },
    max: {
      control: 'number',
      description: 'Maximum progress value',
      table: {
        defaultValue: { summary: '100' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Height of the progress bar',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger'],
      description: 'Color of the filled portion',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    showLabel: {
      control: 'boolean',
      description: 'Shows the percentage label',
    },
    label: {
      control: 'text',
      description: 'Custom label text displayed above the bar',
    },
    animated: {
      control: 'boolean',
      description: 'Enables pulse animation on the filled portion',
    },
  },
  args: {
    value: 60,
    max: 100,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default progress bar at 60%.
 */
export const Default: Story = {
  args: {
    value: 60,
    color: 'primary',
  },
};

/**
 * All color variants at the same progress value.
 */
export const ColorVariants: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <ProgressBar value={65} color="primary" label="Primary" showLabel />
      <ProgressBar value={65} color="success" label="Success" showLabel />
      <ProgressBar value={65} color="warning" label="Warning" showLabel />
      <ProgressBar value={65} color="danger" label="Danger" showLabel />
    </div>
  ),
};

/**
 * Size comparison of the progress bar heights.
 */
export const Sizes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <ProgressBar value={50} size="sm" label="Small" showLabel />
      <ProgressBar value={50} size="md" label="Medium" showLabel />
      <ProgressBar value={50} size="lg" label="Large" showLabel />
    </div>
  ),
};

/**
 * Progress bar with label and percentage display.
 */
export const WithLabel: Story = {
  args: {
    value: 42,
    label: 'Upload Progress',
    showLabel: true,
    color: 'success',
  },
};

/**
 * Animated progress bar with pulse effect.
 */
export const Animated: Story = {
  args: {
    value: 75,
    animated: true,
    color: 'primary',
    label: 'Processing…',
    showLabel: true,
  },
};
