/**
 * Forum Emoji — shared type definitions.
 *
 * Covers custom emoji packs, individual emojis, post icons,
 * emoji categories, and pack import/export bundles.
 */

// ── Emoji Pack ─────────────────────────────────────────────────────

/** A collection of custom emojis grouped into a pack. */
export interface EmojiPack {
  id: string;
  forum_id: string;
  name: string;
  description?: string;
  version: string;
  /** Total number of emojis in this pack. */
  emoji_count: number;
  /** Whether this pack is active and usable. */
  active: boolean;
  /** Whether this pack is premium (requires subscription). */
  premium: boolean;
  /** Cover image for marketplace display. */
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

/** Payload for creating a new emoji pack. */
export interface CreateEmojiPackPayload {
  name: string;
  description?: string;
  version?: string;
  premium?: boolean;
}

// ── Custom Emoji ───────────────────────────────────────────────────

/** A single custom emoji within a pack. */
export interface CustomEmoji {
  id: string;
  pack_id: string;
  forum_id: string;
  /** Shortcode used to insert emoji in text (e.g., :wave:). */
  shortcode: string;
  /** Alternative shortcodes / aliases. */
  aliases: string[];
  /** URL to the emoji image. */
  image_url: string;
  /** Whether this emoji is animated (.gif or .apng). */
  animated: boolean;
  /** Category this emoji belongs to. */
  category_id?: string;
  /** Approval status for moderated forums. */
  status: 'pending' | 'approved' | 'rejected';
  /** Who uploaded this emoji. */
  uploaded_by?: string;
  created_at: string;
}

/** Payload for uploading a new custom emoji. */
export interface UploadEmojiPayload {
  pack_id: string;
  shortcode: string;
  aliases?: string[];
  category_id?: string;
  /** Base64-encoded image data or File reference. */
  image: string | File;
}

// ── Emoji Category ─────────────────────────────────────────────────

/** A category for organizing emojis within a forum. */
export interface EmojiCategory {
  id: string;
  forum_id: string;
  name: string;
  /** Display order. */
  position: number;
  /** Number of emojis in this category. */
  emoji_count: number;
}

// ── Post Icon ──────────────────────────────────────────────────────

/** An icon that can be attached to a thread (per-board). */
export interface PostIcon {
  id: string;
  board_id: string;
  name: string;
  /** Emoji character or custom emoji shortcode. */
  emoji: string;
  /** Badge color displayed alongside icon. */
  color: string;
  /** Display order in the icon selector. */
  position: number;
  /** Whether this is the board's default icon. */
  is_default: boolean;
}

// ── Emoji Pack Bundle (Import/Export) ──────────────────────────────

/** JSON bundle format for importing/exporting emoji packs. */
export interface EmojiPackBundle {
  /** Bundle format version. */
  format_version: '1.0';
  pack: {
    name: string;
    description?: string;
    version: string;
  };
  emojis: EmojiPackBundleEmoji[];
}

export interface EmojiPackBundleEmoji {
  shortcode: string;
  aliases: string[];
  /** URL to download the image, or base64 data URI. */
  image_url: string;
  animated: boolean;
  category?: string;
}

// ── Marketplace ────────────────────────────────────────────────────

/** A pack listing in the emoji marketplace. */
export interface EmojiPackListing {
  id: string;
  name: string;
  description: string;
  version: string;
  emoji_count: number;
  cover_image_url?: string;
  downloads: number;
  rating: number;
  premium: boolean;
  tags: string[];
}

// ── Favorites ──────────────────────────────────────────────────────

/** User's favorited emoji shortcodes. */
export interface EmojiFavorites {
  user_id: string;
  forum_id: string;
  shortcodes: string[];
}

/** Recently used emojis (stored client-side). */
export interface RecentEmojis {
  shortcodes: string[];
  max_items: number;
}
