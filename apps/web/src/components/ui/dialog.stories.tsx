/**
 * Storybook stories for the Dialog UI component.
 * @module components/ui/dialog.stories
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';

function DefaultDialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>
              This is a description of the dialog content. It provides context for the user about
              what action they are about to take.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-300">Additional dialog body content goes here.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DestructiveDialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Item
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the item and all associated
              data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormDialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Create New
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Community</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-white"
                placeholder="Enter community name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
              <textarea
                className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-white"
                rows={3}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Dialog Component Stories
 *
 * The Dialog component provides a modal overlay for content that requires
 * user attention or interaction, such as confirmations and forms.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A modal dialog component with backdrop blur, escape-to-close, and composable header/content/footer sections.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls whether the dialog is open',
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default dialog with title, description, and action buttons.
 */
export const Default: Story = {
  render: () => <DefaultDialogExample />,
};

/**
 * Confirmation dialog for destructive actions.
 */
export const DestructiveConfirmation: Story = {
  render: () => <DestructiveDialogExample />,
};

/**
 * Dialog with form content for user input.
 */
export const WithFormContent: Story = {
  render: () => <FormDialogExample />,
};
