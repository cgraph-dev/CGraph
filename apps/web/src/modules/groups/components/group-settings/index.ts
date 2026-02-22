/**
 * GroupSettings module exports
 * @module modules/groups/components/group-settings
 */

export { GroupSettings, default } from './group-settings';

// Components
export { SettingsSidebar } from './settings-sidebar';
export { OverviewTab } from './overview-tab';
export { MembersTab } from './members-tab';
export { InvitesTab } from './invites-tab';
export { ChannelsTab } from './channels-tab';
export { EmojiTab } from './emoji-tab';
export { NotificationsTab } from './notifications-tab';
export { AuditLogTab } from './audit-log-tab';
export { DangerTab } from './danger-tab';
export { ConfirmModal } from './confirm-modal';
export { SaveBar } from './save-bar';

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
