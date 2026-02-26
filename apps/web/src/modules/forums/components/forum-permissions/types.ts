/**
 * Shared types and permission definitions for the Forum Permissions Panel.
 *
 * @module modules/forums/components/forum-permissions
 */

/* ============================================================
 * Types
 * ============================================================ */

export type PermValue = 'inherit' | 'allow' | 'deny';
export type PermTarget = 'forum' | 'board';

export interface PermissionDef {
  readonly key: string;
  readonly label: string;
  readonly category: string;
}

export interface PermissionOverwrite {
  id?: string;
  group_id: string;
  group_name: string;
  applies_to: string;
  permissions: Record<string, PermValue>;
}

export interface GroupOption {
  id: string;
  name: string;
}

export interface ForumPermissionsPanelProps {
  targetType: PermTarget;
  targetId: string;
  targetName: string;
  forumId?: string; // needed for board perms (parent forum)
  onClose?: () => void;
}

/* ============================================================
 * Permission definitions
 * ============================================================ */

export const FORUM_PERMISSIONS: readonly PermissionDef[] = [
  { key: 'can_view', label: 'View Forum', category: 'General' },
  { key: 'can_view_boards', label: 'View Boards', category: 'General' },
  { key: 'can_create_threads', label: 'Create Threads', category: 'Posting' },
  { key: 'can_reply', label: 'Reply to Threads', category: 'Posting' },
  { key: 'can_manage_boards', label: 'Manage Boards', category: 'Admin' },
  { key: 'can_manage_groups', label: 'Manage Groups', category: 'Admin' },
  { key: 'can_manage_settings', label: 'Manage Settings', category: 'Admin' },
];

export const BOARD_PERMISSIONS: readonly PermissionDef[] = [
  { key: 'can_view', label: 'View Board', category: 'General' },
  { key: 'can_view_threads', label: 'View Threads', category: 'General' },
  { key: 'can_create_threads', label: 'Create Threads', category: 'Posting' },
  { key: 'can_reply', label: 'Reply', category: 'Posting' },
  { key: 'can_edit_own_posts', label: 'Edit Own Posts', category: 'Posting' },
  { key: 'can_delete_own_posts', label: 'Delete Own Posts', category: 'Posting' },
  { key: 'can_upload_attachments', label: 'Upload Attachments', category: 'Posting' },
  { key: 'can_create_polls', label: 'Create Polls', category: 'Posting' },
  { key: 'can_vote_polls', label: 'Vote in Polls', category: 'Posting' },
  { key: 'can_moderate', label: 'Moderate', category: 'Moderation' },
  { key: 'can_edit_posts', label: 'Edit Any Post', category: 'Moderation' },
  { key: 'can_delete_posts', label: 'Delete Any Post', category: 'Moderation' },
  { key: 'can_move_threads', label: 'Move Threads', category: 'Moderation' },
  { key: 'can_lock_threads', label: 'Lock Threads', category: 'Moderation' },
  { key: 'can_pin_threads', label: 'Pin Threads', category: 'Moderation' },
];

/* ============================================================
 * Helpers
 * ============================================================ */

/**
 * unknown for the forums module.
 */
/**
 * extract Permissions for the forums module.
 *
 * @param raw - The raw.
 * @param unknown - The unknown.
 * @param permDefs - The perm defs.
 * @returns The resolved value.
 */
export function extractPermissions(
  raw: Record<string, unknown>,
  permDefs: readonly PermissionDef[],
): Record<string, PermValue> {
  const result: Record<string, PermValue> = {};
  for (const p of permDefs) {
    const val = raw[p.key];
    if (val === 'allow' || val === 'deny') {
      result[p.key] = val;
    } else {
      result[p.key] = 'inherit';
    }
  }
  return result;
}
