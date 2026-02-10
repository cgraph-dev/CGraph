/**
 * GroupSettings constants
 * @module modules/groups/components/group-settings
 */

import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  UsersIcon,
  LinkIcon,
  HashtagIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import type { SettingsTab } from './types';

export const SETTINGS_TABS: SettingsTab[] = [
  { id: 'overview', label: 'Overview', icon: Cog6ToothIcon },
  { id: 'roles', label: 'Roles', icon: ShieldCheckIcon },
  { id: 'members', label: 'Members', icon: UsersIcon },
  { id: 'invites', label: 'Invites', icon: LinkIcon },
  { id: 'channels', label: 'Channels', icon: HashtagIcon },
  { id: 'emoji', label: 'Emoji', icon: FaceSmileIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'audit-log', label: 'Audit Log', icon: ClipboardDocumentListIcon },
  { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon },
];
