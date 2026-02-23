/**
 * Storybook stories for the Tooltip UI component.
 * @module components/ui/tooltip.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import Tooltip from './tooltip';
import { Button } from './button';

/**
 * Tooltip Component Stories
 *
 * The Tooltip component displays contextual information on hover, using
 * a portal for correct rendering above all other content.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A hover tooltip component that renders via portal. Supports top, bottom, left, and right positioning with configurable show delay.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Text content displayed inside the tooltip',
    },
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Position of the tooltip relative to its trigger',
      table: {
        defaultValue: { summary: 'top' },
      },
    },
    delay: {
      control: 'number',
      description: 'Delay in milliseconds before the tooltip appears',
      table: {
        defaultValue: { summary: '300' },
      },
    },
  },
  args: {
    content: 'Tooltip text',
    position: 'top',
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default tooltip shown on hover above the trigger.
 */
export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    position: 'top',
    children: <Button variant="outline">Hover me</Button>,
  },
};

/**
 * All four tooltip positions demonstrated.
 */
export const AllPositions: Story = {
  render: () => (
    <div className="flex items-center gap-8 p-16">
      <Tooltip content="Top tooltip" position="top">
        <Button variant="outline" size="sm">
          Top
        </Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <Button variant="outline" size="sm">
          Bottom
        </Button>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <Button variant="outline" size="sm">
          Left
        </Button>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <Button variant="outline" size="sm">
          Right
        </Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip with no delay for immediate display.
 */
export const NoDelay: Story = {
  args: {
    content: 'Instant tooltip',
    delay: 0,
    children: <Button variant="ghost">Hover (no delay)</Button>,
  },
};

/**
 * Tooltip wrapping non-button content.
 */
export const OnTextContent: Story = {
  render: () => (
    <p className="text-gray-300">
      Hover over the{' '}
      <Tooltip content="This term has extra context" position="top">
        <span className="cursor-help text-primary-400 underline decoration-dotted">
          highlighted word
        </span>
      </Tooltip>{' '}
      to see the tooltip.
    </p>
  ),
};
