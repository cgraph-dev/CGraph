/**
 * Secret Chat Store — Type Definitions
 *
 * All interfaces and types used across the secret chat module.
 * Includes session, theme, ghost mode, and timer types.
 *
 * @module modules/secret-chat/store/types
 */

// ── Secret Theme Types ─────────────────────────────────────────────────

/** Identifiers for the 12 built-in secret chat themes */
export type SecretThemeId =
  | 'void'
  | 'redacted'
  | 'midnight'
  | 'signal'
  | 'ghost'
  | 'cipher'
  | 'onyx'
  | 'eclipse'
  | 'static'
  | 'shadow'
  | 'obsidian'
  | 'abyss';

/** Metadata for a secret chat theme */
export interface SecretTheme {
  /** Unique theme identifier */
  readonly id: SecretThemeId;
  /** Human-readable display name */
  readonly name: string;
  /** Short description of the theme aesthetic */
  readonly description: string;
  /** CSS class to apply to the secret chat container */
  readonly className: string;
  /** Preview color swatch for the theme picker */
  readonly previewColor: string;
}

// ── Ghost Mode Types ───────────────────────────────────────────────────

/** Ghost mode state — controls read-receipt and typing-indicator hiding */
export interface GhostModeState {
  /** Whether ghost mode is currently active */
  readonly isActive: boolean;
  /** Timestamp when ghost mode was activated (ISO 8601) */
  readonly activatedAt: string | null;
  /** Whether the API call to toggle ghost is in progress */
  readonly isToggling: boolean;
}

// ── Session Types ──────────────────────────────────────────────────────

/** Secret chat session representing an active E2E encrypted conversation */
export interface SecretChatSession {
  /** Unique session identifier (UUID) */
  readonly id: string;
  /** Conversation ID this secret session wraps */
  readonly conversationId: string;
  /** Remote participant's user ID */
  readonly participantId: string;
  /** Ephemeral alias for the current user in this session */
  readonly alias: string;
  /** Deterministic avatar seed derived from conversation ID */
  readonly avatarSeed: string;
  /** Selected secret theme */
  readonly themeId: SecretThemeId;
  /** Session expiry timestamp (ISO 8601) */
  readonly expiresAt: string;
  /** Whether the session has been initialized with key exchange */
  readonly isInitialized: boolean;
  /** Timestamp of session creation (ISO 8601) */
  readonly createdAt: string;
}

// ── Store State Types ──────────────────────────────────────────────────

/** Actions available on the secret chat store */
export interface SecretChatActions {
  /** Set the current active session */
  setSession: (session: SecretChatSession | null) => void;
  /** Update the selected theme */
  setTheme: (themeId: SecretThemeId) => void;
  /** Toggle ghost mode on/off */
  toggleGhostMode: () => void;
  /** Set ghost mode toggling state */
  setGhostToggling: (isToggling: boolean) => void;
  /** Set ghost mode active state */
  setGhostActive: (isActive: boolean) => void;
  /** Set the session timer expiry */
  setExpiresAt: (expiresAt: string) => void;
  /** Set the user alias for secret chat */
  setAlias: (alias: string) => void;
  /** Trigger panic wipe — destroys all session data */
  panicWipe: () => void;
  /** Reset the store to initial state */
  reset: () => void;
}

/** Complete secret chat store state */
export interface SecretChatState extends SecretChatActions {
  /** Current active secret chat session */
  session: SecretChatSession | null;
  /** Ghost mode state */
  ghostMode: GhostModeState;
  /** Currently selected secret theme ID */
  selectedThemeId: SecretThemeId;
  /** Whether panic wipe is in progress */
  isPanicWiping: boolean;
}
