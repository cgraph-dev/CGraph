/**
 * Storybook stories for the Select UI component.
 * @module components/ui/select.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import Select from './select';
import { useState } from 'react';

/**
 * Select Component Stories
 *
 * Custom dropdown select with search, icons, and descriptions.
 * Supports keyboard navigation and click-outside to close.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Custom select component with search capability, icons, option descriptions, and full keyboard support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    searchable: {
      control: 'boolean',
      description: 'Enable search filtering',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the select',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder when no value selected',
    },
    label: {
      control: 'text',
      description: 'Label above the select',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
];

const countryOptions = [
  { value: 'us', label: 'United States', icon: <span>🇺🇸</span> },
  { value: 'uk', label: 'United Kingdom', icon: <span>🇬🇧</span> },
  { value: 'ca', label: 'Canada', icon: <span>🇨🇦</span> },
  { value: 'au', label: 'Australia', icon: <span>🇦🇺</span> },
  { value: 'de', label: 'Germany', icon: <span>🇩🇪</span> },
  { value: 'fr', label: 'France', icon: <span>🇫🇷</span> },
  { value: 'jp', label: 'Japan', icon: <span>🇯🇵</span> },
];

const roleOptions = [
  { value: 'admin', label: 'Administrator', description: 'Full access to all settings' },
  { value: 'moderator', label: 'Moderator', description: 'Can manage users and content' },
  { value: 'member', label: 'Member', description: 'Standard access' },
  { value: 'guest', label: 'Guest', description: 'Limited read-only access' },
];

/**
 * Default select
 */
export const Default: Story = {
  args: {
    options: basicOptions,
    value: '',
    onChange: () => {},
    placeholder: 'Select an option...',
  },
};

/**
 * With label
 */
export const WithLabel: Story = {
  args: {
    options: basicOptions,
    value: '',
    onChange: () => {},
    label: 'Choose Option',
    placeholder: 'Select an option...',
  },
};

/**
 * With selected value
 */
export const WithValue: Story = {
  args: {
    options: basicOptions,
    value: 'option2',
    onChange: () => {},
    label: 'Selected',
  },
};

/**
 * With icons
 */
export const WithIcons: Story = {
  args: {
    options: countryOptions,
    value: '',
    onChange: () => {},
    label: 'Country',
    placeholder: 'Select country...',
  },
};

/**
 * Searchable
 */
export const Searchable: Story = {
  args: {
    options: countryOptions,
    value: '',
    onChange: () => {},
    label: 'Country',
    placeholder: 'Search countries...',
    searchable: true,
  },
};

/**
 * With error
 */
export const WithError: Story = {
  args: {
    options: basicOptions,
    value: '',
    onChange: () => {},
    label: 'Required Field',
    placeholder: 'Select an option...',
    error: 'This field is required',
  },
};

/**
 * Disabled
 */
export const Disabled: Story = {
  args: {
    options: basicOptions,
    value: 'option1',
    onChange: () => {},
    label: 'Disabled Select',
    disabled: true,
  },
};

/**
 * With descriptions
 */
export const WithDescriptions: Story = {
  args: {
    options: roleOptions,
    value: '',
    onChange: () => {},
    label: 'User Role',
    placeholder: 'Select role...',
  },
};

/**
 * Interactive example
 */
export const Interactive: Story = {
  args: {
    options: countryOptions,
    value: '',
    onChange: () => {},
  },
  render: function InteractiveSelect() {
    const [value, setValue] = useState('');

    return (
      <Select
        options={countryOptions}
        value={value}
        onChange={setValue}
        label="Select Country"
        placeholder="Choose your country..."
        searchable
      />
    );
  },
};

/**
 * Form example
 */
export const FormExample: Story = {
  args: {
    options: basicOptions,
    value: '',
    onChange: () => {},
  },
  render: function FormSelect() {
    const [country, setCountry] = useState('');
    const [role, setRole] = useState('');

    return (
      <div className="space-y-4">
        <Select
          options={countryOptions}
          value={country}
          onChange={setCountry}
          label="Country"
          placeholder="Select country..."
          searchable
        />
        <Select
          options={roleOptions}
          value={role}
          onChange={setRole}
          label="Role"
          placeholder="Select role..."
        />
      </div>
    );
  },
};
