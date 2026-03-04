/**
 * Storybook stories for the Switch navigation component.
 * @module components/navigation/switch.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import Switch from './switch';
import { useState } from 'react';

/**
 * Switch Component Stories
 *
 * Toggle switch component for boolean settings with label
 * and description support. Fully accessible with keyboard navigation.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible toggle switch component with size variants, labels, and descriptions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the switch',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    checked: {
      control: 'boolean',
      description: 'Whether the switch is on',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the switch',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    description: {
      control: 'text',
      description: 'Description text below label',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default switch (off)
 */
export const Default: Story = {
  args: {
    checked: false,
    onChange: () => {},
  },
};

/**
 * Checked state
 */
export const Checked: Story = {
  args: {
    checked: true,
    onChange: () => {},
  },
};

/**
 * With label
 */
export const WithLabel: Story = {
  args: {
    checked: true,
    onChange: () => {},
    label: 'Enable notifications',
  },
};

/**
 * With label and description
 */
export const WithDescription: Story = {
  args: {
    checked: true,
    onChange: () => {},
    label: 'Email notifications',
    description: 'Receive email updates about your account activity',
  },
};

/**
 * Disabled states
 */
export const Disabled: Story = {
  args: {
    checked: false,
    onChange: () => {},
    disabled: true,
  },
  render: () => (
    <div className="space-y-4">
      <Switch checked={false} onChange={() => {}} disabled label="Disabled (off)" />
      <Switch checked={true} onChange={() => {}} disabled label="Disabled (on)" />
    </div>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  args: {
    checked: true,
    onChange: () => {},
  },
  render: () => (
    <div className="space-y-4">
      <Switch size="sm" checked={true} onChange={() => {}} label="Small" />
      <Switch size="md" checked={true} onChange={() => {}} label="Medium" />
      <Switch size="lg" checked={true} onChange={() => {}} label="Large" />
    </div>
  ),
};

/**
 * Interactive example
 */
export const Interactive: Story = {
  args: {
    checked: false,
    onChange: () => {},
  },
  render: function InteractiveSwitch() {
    const [checked, setChecked] = useState(false);

    return (
      <Switch
        checked={checked}
        onChange={setChecked}
        label="Click to toggle"
        description={checked ? 'Switch is ON' : 'Switch is OFF'}
      />
    );
  },
};

/**
 * Settings panel example
 */
export const SettingsPanel: Story = {
  args: {
    checked: false,
    onChange: () => {},
  },
  render: function SettingsPanelComponent() {
    const [settings, setSettings] = useState({
      notifications: true,
      darkMode: true,
      sounds: false,
      autoSave: true,
    });

    const toggleSetting = (key: keyof typeof settings) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div className="w-80 space-y-4 rounded-lg bg-white/[0.04] p-4">
        <h3 className="mb-4 font-medium text-white">Settings</h3>
        <Switch
          checked={settings.notifications}
          onChange={() => toggleSetting('notifications')}
          label="Push Notifications"
          description="Receive notifications for new messages"
        />
        <Switch
          checked={settings.darkMode}
          onChange={() => toggleSetting('darkMode')}
          label="Dark Mode"
          description="Use dark theme throughout the app"
        />
        <Switch
          checked={settings.sounds}
          onChange={() => toggleSetting('sounds')}
          label="Sound Effects"
          description="Play sounds for notifications"
        />
        <Switch
          checked={settings.autoSave}
          onChange={() => toggleSetting('autoSave')}
          label="Auto-save Drafts"
          description="Automatically save message drafts"
        />
      </div>
    );
  },
};
