/**
 * Storybook stories for the Badge UI component.
 * @module components/ui/badge.stories
 */
import type { Meta, StoryObj } from '@storybook/react';
import Badge, {
  NewBadge,
  HotBadge,
  NsfwBadge,
  PinnedBadge,
  PrivateBadge,
  PublicBadge,
  OwnerBadge,
  ModeratorBadge,
  MemberBadge,
  CountBadge,
} from './badge';

/**
 * Badge Component Stories
 *
 * The Badge component is a small status indicator used for labels, tags,
 * status indicators, and counts throughout the CGraph application.
 *
 * @since v0.7.30
 */
const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A small status indicator component supporting multiple variants, sizes, optional dot indicators, and icons.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'primary',
        'success',
        'warning',
        'danger',
        'info',
        'destructive',
        'secondary',
        'outline',
      ],
      description: 'Visual style variant of the badge',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    dot: {
      control: 'boolean',
      description: 'Shows a colored dot indicator before the label',
    },
    children: {
      control: 'text',
      description: 'Badge content',
    },
  },
  args: {
    children: 'Badge',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default badge with no specific variant styling.
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default',
  },
};

/**
 * All badge variants displayed side by side.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

/**
 * Badge sizes comparison.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge variant="primary" size="sm">
        Small
      </Badge>
      <Badge variant="primary" size="md">
        Medium
      </Badge>
      <Badge variant="primary" size="lg">
        Large
      </Badge>
    </div>
  ),
};

/**
 * Badges with dot indicators for status display.
 */
export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="success" dot>
        Online
      </Badge>
      <Badge variant="warning" dot>
        Away
      </Badge>
      <Badge variant="danger" dot>
        Busy
      </Badge>
      <Badge variant="default" dot>
        Offline
      </Badge>
    </div>
  ),
};

/**
 * Pre-built badge variants for common use cases.
 */
export const PrebuiltBadges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <NewBadge />
      <HotBadge />
      <NsfwBadge />
      <PinnedBadge />
      <PrivateBadge />
      <PublicBadge />
      <OwnerBadge />
      <ModeratorBadge />
      <MemberBadge />
      <CountBadge count={42} />
      <CountBadge count={1500} />
    </div>
  ),
};
