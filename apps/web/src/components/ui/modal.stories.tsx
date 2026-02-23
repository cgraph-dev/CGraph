/**
 * Modal component Storybook stories.
 * @module
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './modal';
import { Button } from './button';
import { useState } from 'react';

/**
 * Modal Component Stories
 *
 * Accessible modal dialog with keyboard navigation, focus trapping,
 * and configurable overlay behavior.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible modal component with keyboard navigation, focus trapping, and customizable sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Size of the modal',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    isOpen: {
      control: 'boolean',
      description: 'Controls modal visibility',
    },
    title: {
      control: 'text',
      description: 'Modal header title',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show X button in header',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Close when clicking overlay',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Close on Escape key press',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default modal
 */
export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Modal Title',
    children: (
      <p className="text-gray-300">This is a modal dialog. You can put any content here.</p>
    ),
  },
};

/**
 * Small modal
 */
export const Small: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    size: 'sm',
    title: 'Quick Confirmation',
    children: <p className="text-gray-300">Are you sure you want to continue?</p>,
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </div>
    ),
  },
};

/**
 * Large modal
 */
export const Large: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    size: 'lg',
    title: 'User Settings',
    children: (
      <div className="space-y-4">
        <p className="text-gray-300">Configure your account settings below.</p>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Display Name</label>
          <input
            type="text"
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-white"
            placeholder="Enter your name"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-white"
            placeholder="you@example.com"
          />
        </div>
      </div>
    ),
  },
};

/**
 * Modal with footer
 */
export const WithFooter: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Save Changes',
    children: (
      <p className="text-gray-300">
        You have unsaved changes. Would you like to save them before leaving?
      </p>
    ),
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Discard</Button>
        <Button variant="outline">Save as Draft</Button>
        <Button variant="primary">Save & Publish</Button>
      </div>
    ),
  },
};

/**
 * Danger modal (delete confirmation)
 */
export const DangerConfirmation: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Delete Channel',
    children: (
      <div className="space-y-4">
        <p className="text-gray-300">
          Are you sure you want to delete <strong className="text-white">#general</strong>? This
          action cannot be undone.
        </p>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">
            All messages and files in this channel will be permanently deleted.
          </p>
        </div>
      </div>
    ),
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Delete Channel</Button>
      </div>
    ),
  },
};

/**
 * Full-width modal
 */
export const FullWidth: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    size: 'full',
    title: 'Image Gallery',
    children: (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex aspect-video items-center justify-center rounded-lg bg-dark-700 text-gray-500"
          >
            Image {i}
          </div>
        ))}
      </div>
    ),
  },
};

/**
 * Without close button
 */
export const NoCloseButton: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Important Notice',
    showCloseButton: false,
    closeOnOverlayClick: false,
    closeOnEscape: false,
    children: <p className="text-gray-300">Please read and accept the terms before continuing.</p>,
    footer: (
      <div className="flex justify-end">
        <Button variant="primary">I Accept</Button>
      </div>
    ),
  },
};

/**
 * Interactive example
 */
export const Interactive: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    title: 'Interactive Modal',
    children: <p>Content</p>,
  },
  render: function InteractiveModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Interactive Modal"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Save
              </Button>
            </div>
          }
        >
          <p className="text-gray-300">
            This is an interactive modal. Click the buttons or press Escape to close.
          </p>
        </Modal>
      </>
    );
  },
};
