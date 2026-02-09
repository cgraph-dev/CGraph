/**
 * GroupSettings type definitions
 * @module modules/groups/components/group-settings
 */

import type { Group } from '@/modules/groups/store';

export interface GroupSettingsProps {
  groupId: string;
  onClose?: () => void;
}

export interface OverviewFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

export interface OverviewTabProps {
  group: Group;
  formData: OverviewFormData;
  onChange: (data: OverviewFormData) => void;
}

export interface MembersTabProps {
  groupId: string;
}

export interface InvitesTabProps {
  groupId: string;
  groupName: string;
}

export interface ChannelsTabProps {
  groupId: string;
}

export interface DangerTabProps {
  isOwner: boolean;
  onLeave: () => void;
  onDelete: () => void;
}

export interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export interface SettingsTab {
  id: TabId;
  label: string;
  icon: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & { title?: string; titleId?: string }
  >;
}

export interface AuditLogTabProps {
  groupId: string;
}

export type TabId =
  | 'overview'
  | 'roles'
  | 'members'
  | 'invites'
  | 'channels'
  | 'notifications'
  | 'audit-log'
  | 'danger';
