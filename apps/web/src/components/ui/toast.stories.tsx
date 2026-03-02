/**
 * Storybook stories for the Toast notification component.
 * @module components/ui/toast.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ToastContainer, toast } from './toast';

const meta: Meta<typeof ToastContainer> = {
  title: 'UI/Toast',
  component: ToastContainer,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative min-h-[300px] bg-dark-900 p-8">
        <Story />
        <ToastContainer />
      </div>
    ),
  ],
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => (
    <button
      className="rounded bg-green-600 px-4 py-2 text-white"
      onClick={() => toast.success('Success', 'Your changes have been saved.')}
    >
      Show Success Toast
    </button>
  ),
};

export const Error: Story = {
  render: () => (
    <button
      className="rounded bg-red-600 px-4 py-2 text-white"
      onClick={() => toast.error('Error', 'Failed to send message. Please try again.')}
    >
      Show Error Toast
    </button>
  ),
};

export const Warning: Story = {
  render: () => (
    <button
      className="rounded bg-amber-600 px-4 py-2 text-white"
      onClick={() => toast.warning('Warning', 'Your session expires in 5 minutes.')}
    >
      Show Warning Toast
    </button>
  ),
};

export const Info: Story = {
  render: () => (
    <button
      className="rounded bg-blue-600 px-4 py-2 text-white"
      onClick={() => toast.info('Info', 'A new version is available.')}
    >
      Show Info Toast
    </button>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <button
        className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
        onClick={() => toast.success('Saved', 'Settings updated.')}
      >
        Success
      </button>
      <button
        className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
        onClick={() => toast.error('Error', 'Connection failed.')}
      >
        Error
      </button>
      <button
        className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white"
        onClick={() => toast.warning('Warning', 'Low storage.')}
      >
        Warning
      </button>
      <button
        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
        onClick={() => toast.info('Tip', 'Press Ctrl+K for quick search.')}
      >
        Info
      </button>
    </div>
  ),
};
