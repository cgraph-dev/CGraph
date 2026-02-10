/**
 * GroupSettings module exports
 * @module modules/groups/components/group-settings
 */

export { GroupSettings, default } from './GroupSettings';

// Components
export { SettingsSidebar } from './SettingsSidebar';
export { OverviewTab } from './OverviewTab';
export { MembersTab } from './MembersTab';
export { InvitesTab } from './InvitesTab';
export { ChannelsTab } from './ChannelsTab';
export { EmojiTab } from './EmojiTab';
export { NotificationsTab } from './NotificationsTab';
export { AuditLogTab } from './AuditLogTab';
export { DangerTab } from './DangerTab';
export { ConfirmModal } from './ConfirmModal';
export { SaveBar } from './SaveBar';

// Hooks
export { useGroupSettings } from './useGroupSettings';

// Types
export type {
  GroupSettingsProps,
  OverviewFormData,
  OverviewTabProps,
  MembersTabProps,
  InvitesTabProps,
  ChannelsTabProps,
  DangerTabProps,
  AuditLogTabProps,
  ConfirmModalProps,
  SettingsTab,
  TabId,
} from './types';

// Constants
export { SETTINGS_TABS } from './constants';
