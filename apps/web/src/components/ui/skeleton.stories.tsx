/**
 * Storybook stories for the Skeleton loading placeholder component.
 * @module components/ui/skeleton.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import Skeleton, { PostCardSkeleton } from './skeleton';

/**
 * Skeleton Component Stories
 *
 * The Skeleton component provides loading placeholder elements with a
 * shimmer animation to improve perceived performance during data fetching.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A loading placeholder component with shimmer animation. Supports text, circular, and rectangular variants with configurable dimensions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
      description: 'Shape variant of the skeleton',
      table: {
        defaultValue: { summary: 'rectangular' },
      },
    },
    width: {
      control: 'text',
      description: 'Width of the skeleton element',
    },
    height: {
      control: 'text',
      description: 'Height of the skeleton element',
    },
    lines: {
      control: 'number',
      description: 'Number of text lines (only for text variant)',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default rectangular skeleton.
 */
export const Default: Story = {
  args: {
    width: 200,
    height: 40,
    variant: 'rectangular',
  },
};

/**
 * All skeleton variants shown together.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex w-72 flex-col items-start gap-6">
      <div>
        <p className="mb-2 text-xs text-gray-400">Rectangular</p>
        <Skeleton variant="rectangular" width={200} height={40} />
      </div>
      <div>
        <p className="mb-2 text-xs text-gray-400">Circular</p>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div className="w-full">
        <p className="mb-2 text-xs text-gray-400">Text (single line)</p>
        <Skeleton variant="text" />
      </div>
      <div className="w-full">
        <p className="mb-2 text-xs text-gray-400">Text (multiple lines)</p>
        <Skeleton variant="text" lines={4} />
      </div>
    </div>
  ),
};

/**
 * Skeleton used to compose a user profile placeholder.
 */
export const ProfilePlaceholder: Story = {
  render: () => (
    <div className="flex w-64 items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" />
        <div className="mt-1">
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  ),
};

/**
 * Pre-built PostCardSkeleton component.
 */
export const PostCard: Story = {
  render: () => (
    <div className="w-96">
      <PostCardSkeleton />
    </div>
  ),
};
