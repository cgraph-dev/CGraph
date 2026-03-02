/**
 * Storybook stories for the Tabs component.
 * @module components/ui/tabs.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <p className="text-sm text-gray-300">General settings content</p>
      </TabsContent>
      <TabsContent value="privacy">
        <p className="text-sm text-gray-300">Privacy settings content</p>
      </TabsContent>
      <TabsContent value="notifications">
        <p className="text-sm text-gray-300">Notification preferences</p>
      </TabsContent>
    </Tabs>
  ),
};

export const TwoTabs: Story = {
  render: () => (
    <Tabs defaultValue="posts" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="replies">Replies</TabsTrigger>
      </TabsList>
      <TabsContent value="posts">
        <p className="text-sm text-gray-300">User posts appear here</p>
      </TabsContent>
      <TabsContent value="replies">
        <p className="text-sm text-gray-300">User replies appear here</p>
      </TabsContent>
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="channels">Channels</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-gray-300">Group overview dashboard</p>
      </TabsContent>
    </Tabs>
  ),
};
