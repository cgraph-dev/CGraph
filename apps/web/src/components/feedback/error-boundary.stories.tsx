/**
 * Storybook stories for the ErrorBoundary / ErrorFallback component.
 * @module components/feedback/error-boundary.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ErrorFallback } from '@/shared/components/error-fallback';

const meta: Meta<typeof ErrorFallback> = {
  title: 'Feedback/ErrorBoundary',
  component: ErrorFallback,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    error: new Error('Failed to load conversation data'),
    resetErrorBoundary: () => alert('Retry clicked'),
  },
};

export const NetworkError: Story = {
  args: {
    error: new Error('Network request failed: unable to reach server'),
    resetErrorBoundary: () => alert('Retry clicked'),
    componentName: 'ConversationView',
  },
};

export const UnknownError: Story = {
  args: {
    error: new Error(''),
    resetErrorBoundary: () => alert('Retry clicked'),
  },
};

export const LongErrorMessage: Story = {
  args: {
    error: new Error(
      'TypeError: Cannot read properties of undefined (reading "map") — this error occurred while rendering the message list in the conversation view component.'
    ),
    resetErrorBoundary: () => alert('Retry clicked'),
    componentName: 'MessageList',
  },
};
