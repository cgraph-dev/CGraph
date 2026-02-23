/**
 * Storybook stories for the Card UI component.
 * @module components/ui/card.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './card';
import { Button } from './button';

/**
 * Card Component Stories
 *
 * The Card component is a versatile container used for grouping related
 * content with consistent styling across the CGraph application.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A reusable card container with default, interactive, and elevated variants, customizable padding, and optional entrance animation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'interactive', 'elevated'],
      description: 'Visual style variant of the card',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding of the card',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    animate: {
      control: 'boolean',
      description: 'Enables fade-in-up entrance animation',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default card with basic content.
 */
export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="mb-2 font-semibold text-white">Card Title</h3>
        <p className="text-sm text-gray-300">This is a basic card with default styling.</p>
      </div>
    ),
  },
};

/**
 * All card variants displayed side by side.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Card variant="default">
        <CardTitle>Default Card</CardTitle>
        <CardDescription>Standard card with border</CardDescription>
      </Card>
      <Card variant="interactive">
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover to see the interactive effect</CardDescription>
      </Card>
      <Card variant="elevated">
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>Card with prominent shadow</CardDescription>
      </Card>
    </div>
  ),
};

/**
 * Card with all composable sub-components.
 */
export const FullComposition: Story = {
  render: () => (
    <div className="w-80">
      <Card>
        <CardHeader>
          <CardTitle>Community Stats</CardTitle>
          <CardDescription>Overview of your community activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Members</span>
              <span className="font-medium text-white">1,234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Posts</span>
              <span className="font-medium text-white">567</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Today</span>
              <span className="font-medium text-white">89</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm">
            View Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

/**
 * Padding size comparison.
 */
export const PaddingSizes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Card padding="none">
        <div className="p-2 text-sm text-gray-300">padding=none (manual)</div>
      </Card>
      <Card padding="sm">
        <span className="text-sm text-gray-300">padding=sm</span>
      </Card>
      <Card padding="md">
        <span className="text-sm text-gray-300">padding=md (default)</span>
      </Card>
      <Card padding="lg">
        <span className="text-sm text-gray-300">padding=lg</span>
      </Card>
    </div>
  ),
};
