/**
 * EmojiTextRenderer — replaces emoji characters in text with animated Lottie emojis.
 *
 * Splits text by emoji codepoints present in the animated catalog,
 * rendering AnimatedEmoji components inline with the surrounding text.
 *
 * @module lib/lottie/emoji-text-renderer
 */

import { useMemo } from 'react';
import { AnimatedEmoji } from './animated-emoji';
import { ANIMATED_EMOJI_CATALOG } from './animated-emoji-catalog';

// Build a Set of all animated emoji characters for quick lookup
let _emojiSet: Set<string> | null = null;
function getEmojiSet(): Set<string> {
  if (!_emojiSet) {
    _emojiSet = new Set(ANIMATED_EMOJI_CATALOG.map((e) => e.e));
  }
  return _emojiSet;
}

// Build a regex that matches any animated emoji character.
// Uses alternation of escaped emoji strings, sorted longest-first for greedy match.
let _emojiRegex: RegExp | null = null;
function getEmojiRegex(): RegExp {
  if (!_emojiRegex) {
    const emojis = ANIMATED_EMOJI_CATALOG.map((e) => e.e)
      .sort((a, b) => b.length - a.length) // longest first for correct matching
      .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    _emojiRegex = new RegExp(`(${emojis.join('|')})`, 'g');
  }
  return _emojiRegex;
}

export interface EmojiTextRendererProps {
  /** Text content that may contain emoji characters. */
  text: string;
  /** Size of animated emojis in px. @default 20 */
  emojiSize?: number;
  /** Replay interval for animated emojis in ms. 0 = hover-only. @default 4000 */
  replayInterval?: number;
}

/**
 * Renders text with animated Lottie emojis replacing static emoji characters.
 * Non-emoji text is rendered as plain text spans.
 */
export function EmojiTextRenderer({
  text,
  emojiSize = 20,
  replayInterval = 4000,
}: EmojiTextRendererProps) {
  const parts = useMemo(() => {
    if (!text) return [];
    const emojiSet = getEmojiSet();

    // Fast path: no animated emojis in text
    let hasAnimated = false;
    for (const ch of text) {
      if (emojiSet.has(ch)) {
        hasAnimated = true;
        break;
      }
    }
    // Also check multi-codepoint sequences
    if (!hasAnimated) {
      const regex = getEmojiRegex();
      regex.lastIndex = 0;
      hasAnimated = regex.test(text);
      regex.lastIndex = 0;
    }
    if (!hasAnimated) return [{ type: 'text' as const, value: text }];

    const regex = getEmojiRegex();
    regex.lastIndex = 0;
    const result: Array<{ type: 'text' | 'emoji'; value: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      result.push({ type: 'emoji', value: match[0] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return result;
  }, [text]);

  if (parts.length === 0) return null;
  if (parts.length === 1 && parts[0]?.type === 'text') return <>{parts[0]?.value}</>;

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'emoji' ? (
          <AnimatedEmoji
            key={`${i}-${part.value}`}
            emoji={part.value}
            size={emojiSize}
            playOnHover={false}
            replayInterval={replayInterval}
            className="inline-block align-text-bottom"
          />
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </>
  );
}
