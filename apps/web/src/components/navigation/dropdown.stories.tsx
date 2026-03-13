/**
 * Storybook stories for the Dropdown component.
 * @module components/navigation/dropdown.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import Dropdown, { DropdownItem, DropdownDivider } from './dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Navigation/Dropdown',
  component: Dropdown,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Alignment of the dropdown menu',
    },
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dropdown
      trigger={<button className="rounded bg-white/[0.06] px-4 py-2 text-white">Menu</button>}
    >
      <DropdownItem onClick={() => {}}>Profile</DropdownItem>
      <DropdownItem onClick={() => {}}>Settings</DropdownItem>
      <DropdownDivider />
      <DropdownItem onClick={() => {}} danger>
        Sign Out
      </DropdownItem>
    </Dropdown>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Dropdown
      trigger={<button className="rounded bg-white/[0.06] px-4 py-2 text-white">Actions</button>}
    >
      <DropdownItem onClick={() => {}} icon={<span>📝</span>}>
        Edit
      </DropdownItem>
      <DropdownItem onClick={() => {}} icon={<span>📋</span>}>
        Copy
      </DropdownItem>
      <DropdownItem onClick={() => {}} icon={<span>📌</span>}>
        Pin
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem onClick={() => {}} icon={<span>🗑️</span>} danger>
        Delete
      </DropdownItem>
    </Dropdown>
  ),
};

export const RightAligned: Story = {
  render: () => (
    <div className="flex justify-end" style={{ width: 400 }}>
      <Dropdown
        align="right"
        trigger={<button className="rounded bg-white/[0.06] px-4 py-2 text-white">Right</button>}
      >
        <DropdownItem onClick={() => {}}>Option A</DropdownItem>
        <DropdownItem onClick={() => {}}>Option B</DropdownItem>
      </Dropdown>
    </div>
  ),
};

export const WithDisabledItems: Story = {
  render: () => (
    <Dropdown
      trigger={<button className="rounded bg-white/[0.06] px-4 py-2 text-white">Menu</button>}
    >
      <DropdownItem onClick={() => {}}>Active Item</DropdownItem>
      <DropdownItem onClick={() => {}} disabled>
        Disabled Item
      </DropdownItem>
      <DropdownItem onClick={() => {}}>Another Active</DropdownItem>
    </Dropdown>
  ),
};
