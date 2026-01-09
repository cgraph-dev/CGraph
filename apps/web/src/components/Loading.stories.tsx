import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner, LoadingScreen, LoadingOverlay, SkeletonText, SkeletonAvatar, SkeletonMessage } from './Loading';

/**
 * Loading Component Stories
 * 
 * Various loading indicators and states for async operations,
 * page transitions, and skeleton loading patterns.
 * 
 * @since v0.7.30
 */
const meta: Meta<typeof LoadingSpinner> = {
  title: 'Components/Loading',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Reusable loading components including spinners, skeletons, and overlays.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default spinner
 */
export const Spinner: Story = {
  args: {
    size: 'md',
    color: 'primary',
  },
};

/**
 * All spinner sizes
 */
export const SpinnerSizes: Story = {
  args: {
    size: 'md',
  },
  render: () => (
    <div className="flex items-center gap-6">
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="md" />
      <LoadingSpinner size="lg" />
    </div>
  ),
};

/**
 * Spinner colors
 */
export const SpinnerColors: Story = {
  args: {
    size: 'md',
  },
  render: () => (
    <div className="flex items-center gap-6 p-4 bg-dark-800 rounded-lg">
      <LoadingSpinner color="primary" />
      <LoadingSpinner color="white" />
      <LoadingSpinner color="gray" />
    </div>
  ),
};

/**
 * Skeleton text loader
 */
export const Skeleton: Story = {
  args: {
    size: 'md',
  },
  render: () => (
    <div className="w-80 space-y-4 p-4 bg-dark-800 rounded-lg">
      <SkeletonAvatar />
      <SkeletonText lines={3} />
    </div>
  ),
};

/**
 * Message skeleton
 */
export const MessageSkeleton: Story = {
  args: {
    size: 'md',
  },
  render: () => (
    <div className="w-96 bg-dark-900 rounded-lg">
      <SkeletonMessage />
      <SkeletonMessage />
      <SkeletonMessage />
    </div>
  ),
};

/**
 * Loading overlay
 */
export const Overlay: Story = {
  args: {
    size: 'md',
  },
  render: () => (
    <div className="relative w-80 h-60 bg-dark-800 rounded-lg">
      <div className="p-4 space-y-4">
        <div className="h-4 bg-dark-700 rounded w-3/4" />
        <div className="h-4 bg-dark-700 rounded w-1/2" />
        <div className="h-4 bg-dark-700 rounded w-2/3" />
      </div>
      <LoadingOverlay message="Saving changes..." />
    </div>
  ),
};

/**
 * Full screen loading (scaled down)
 */
export const FullScreen: Story = {
  args: {
    size: 'md',
  },
  render: () => (
    <div className="w-96 h-64 rounded-lg overflow-hidden border border-dark-600">
      <LoadingScreen message="Loading application..." />
    </div>
  ),
};

/**
 * Button with loading state
 */
export const ButtonLoading: Story = {
  args: {
    size: 'md',
  },
  render: () => (
    <div className="flex gap-4">
      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 opacity-75 cursor-wait">
        <LoadingSpinner size="sm" color="white" />
        <span>Saving...</span>
      </button>
      <button className="px-4 py-2 bg-dark-700 text-white rounded-lg flex items-center gap-2 opacity-75 cursor-wait">
        <LoadingSpinner size="sm" color="gray" />
        <span>Loading...</span>
      </button>
    </div>
  ),
};
