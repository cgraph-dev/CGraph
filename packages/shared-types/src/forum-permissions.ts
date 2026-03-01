// =============================================================================
// Forum Permissions Types
//
// Shared types for board permissions, forum permissions, and permission templates.
// Maps to backend: BoardPermission (285L), ForumPermission (303L),
// PermissionTemplate (241L), PermissionsController (470L).
// =============================================================================

/**
 * Permission level tri-state: inherit from parent, explicitly allow, or deny.
 */
export type PermissionLevel = 'inherit' | 'allow' | 'deny';

/**
 * Board-level permission overrides for a specific group.
 * 15 fields matching backend BoardPermission schema.
 */
export interface BoardPermission {
  id: string;
  board_id: string;
  group_id: string;
  group_name: string;
  group_color: string | null;
  // General
  can_view: PermissionLevel;
  can_view_threads: PermissionLevel;
  // Posting
  can_create_threads: PermissionLevel;
  can_reply: PermissionLevel;
  can_edit_own_posts: PermissionLevel;
  can_delete_own_posts: PermissionLevel;
  can_upload_attachments: PermissionLevel;
  can_create_polls: PermissionLevel;
  can_vote_polls: PermissionLevel;
  // Moderation
  can_moderate: PermissionLevel;
  can_edit_posts: PermissionLevel;
  can_delete_posts: PermissionLevel;
  can_move_threads: PermissionLevel;
  can_lock_threads: PermissionLevel;
  can_pin_threads: PermissionLevel;
  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Forum-level permission set for a group.
 */
export interface ForumPermission {
  id: string;
  forum_id: string;
  group_id: string;
  group_name: string;
  group_color: string | null;
  can_view: PermissionLevel;
  can_view_boards: PermissionLevel;
  can_create_threads: PermissionLevel;
  can_reply: PermissionLevel;
  can_manage_boards: PermissionLevel;
  can_manage_groups: PermissionLevel;
  can_manage_settings: PermissionLevel;
  can_moderate: PermissionLevel;
  can_manage_permissions: PermissionLevel;
  created_at: string;
  updated_at: string;
}

/**
 * Permission template with presets for quick application to boards.
 */
export interface PermissionTemplate {
  id: string;
  forum_id: string | null;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: Record<string, PermissionLevel>;
  created_at: string;
  updated_at: string;
}

/**
 * Effective permission after inheritance resolution.
 */
export interface EffectivePermission {
  permission: string;
  level: PermissionLevel;
  source: 'board' | 'forum' | 'group' | 'default';
  inherited_from?: string;
}
