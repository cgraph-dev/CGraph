/**
 * Storybook stories for the Popover component.
 * @module components/ui/popover.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>
        <button className="rounded bg-dark-700 px-4 py-2 text-white">Open Popover</button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="p-3">
          <p className="text-sm font-medium text-white">Popover Content</p>
          <p className="mt-1 text-xs text-gray-400">Additional information goes here.</p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>
        <button className="rounded bg-primary-600 px-4 py-2 text-white">Edit Name</button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-3 p-3">
          <label className="block text-xs text-gray-400">Display Name</label>
          <input
            type="text"
            defaultValue="John Doe"
            className="w-full rounded border border-dark-600 bg-dark-800 px-3 py-1.5 text-sm text-white"
          />
          <button className="w-full rounded bg-primary-600 px-3 py-1.5 text-sm text-white">
            Save
          </button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const InfoPopover: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>
        <button className="text-gray-400 hover:text-white">ℹ️</button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="max-w-xs p-3">
          <p className="text-xs text-gray-300">
            This feature is available to Premium members. Upgrade to unlock advanced customization
            options.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
