import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  NewspaperIcon,
  PaintBrushIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UsersIcon as UsersIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  PaintBrushIcon as PaintBrushIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

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
    path: '/customize',
    label: 'Customize',
    icon: PaintBrushIcon,
    activeIcon: PaintBrushIconSolid,
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
