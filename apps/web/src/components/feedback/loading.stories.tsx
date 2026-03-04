/**
 * Storybook stories for loading feedback components.
 * @module components/feedback/loading.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import { LoadingOverlay, SkeletonText, SkeletonAvatar, SkeletonMessage } from './loading';
import { LoadingSpinner } from './loading-spinner';

/**
 * Loading Component Stories
 *
 * Various loading indicators and states for async operations,
 * page transitions, and skeleton loading patterns.
 *
 * For full-page loading, use the LoadingSpinner component.
 *
 * @since v0.9.5
 */
const meta: Meta<typeof LoadingOverlay> = {
  title: 'Components/Loading',
  component: LoadingOverlay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Reusable loading components including skeletons, overlays, and the full-page LoadingSpinner.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Loading overlay for async operations
 */
export const Overlay: Story = {
  render: () => (
    <div className="relative h-60 w-80 rounded-lg bg-white/[0.04]">
      <div className="space-y-4 p-4">
        <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
        <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
        <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
      </div>
      <LoadingOverlay message="Saving changes..." />
    </div>
  ),
};

/**
 * Skeleton text loader
 */
export const Skeleton: Story = {
  render: () => (
    <div className="w-80 space-y-4 rounded-lg bg-white/[0.04] p-4">
      <SkeletonAvatar />
      <SkeletonText lines={3} />
    </div>
  ),
};

/**
 * Message skeleton for conversation lists
 */
export const MessageSkeleton: Story = {
  render: () => (
    <div className="w-96 rounded-lg bg-[rgb(30,32,40)]">
      <SkeletonMessage />
      <SkeletonMessage />
      <SkeletonMessage />
    </div>
  ),
};

/**
 * Full-page LoadingSpinner (scaled down)
 *
 * This is the main loading component for page transitions.
 * Features a simple spinning animation with brand colors.
 */
export const FullPageSpinner: Story = {
  render: () => (
    <div className="relative h-[500px] w-[800px] overflow-hidden rounded-lg border border-white/[0.08]">
      <LoadingSpinner />
    </div>
  ),
};
