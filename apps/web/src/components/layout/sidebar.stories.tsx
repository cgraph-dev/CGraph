/**
 * Storybook stories for the Sidebar component.
 * @module components/layout/sidebar.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex h-[600px] bg-dark-900">
          <Story />
          <div className="flex-1 p-4 text-gray-400">Main content area</div>
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    showGroups: true,
    showQuickActions: true,
    showUserStatus: true,
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    showGroups: true,
    showQuickActions: false,
  },
};

export const Collapsed: Story = {
  args: {
    variant: 'default',
    defaultCollapsed: true,
    showGroups: true,
  },
};

export const Floating: Story = {
  args: {
    variant: 'floating',
    showGroups: true,
    showQuickActions: true,
  },
};

export const NoGroups: Story = {
  args: {
    variant: 'default',
    showGroups: false,
    showQuickActions: true,
  },
};
