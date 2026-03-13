/**
 * App Layout constants - Navigation items and route config
 * @module layouts/app-layout
 */
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  NewspaperIcon,
  PaintBrushIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UsersIcon as UsersIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  PaintBrushIcon as PaintBrushIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  CircleStackIcon as CircleStackIconSolid,
} from '@heroicons/react/24/solid';
type FeatureGateKey = string;

export const navItems = [
  {
    path: '/messages',
    label: 'Messages',
    icon: ChatBubbleLeftRightIcon,
    activeIcon: ChatBubbleLeftRightIconSolid,
  },
  {
    path: '/social',
    label: 'Social',
    icon: UsersIcon,
    activeIcon: UsersIconSolid,
  },
  {
    path: '/forums',
    label: 'Forums',
    icon: NewspaperIcon,
    activeIcon: NewspaperIconSolid,
  },
  {
    path: '/nodes',
    label: 'Nodes',
    icon: CircleStackIcon,
    activeIcon: CircleStackIconSolid,
  },
  {
    path: '/customize',
    label: 'Customize',
    icon: PaintBrushIcon,
    activeIcon: PaintBrushIconSolid,
    featureGate: 'cosmetics' satisfies FeatureGateKey,
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: UserCircleIcon,
    activeIcon: UserCircleIconSolid,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    activeIcon: Cog6ToothIconSolid,
  },
];

export type NavItem = (typeof navItems)[number];
