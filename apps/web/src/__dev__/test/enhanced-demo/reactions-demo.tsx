/**
 * Reactions Demo Section
 */

import { useState } from 'react';
import { GlassCard } from '@/shared/components/ui';
import {
  AnimatedReactionBubble,
  ReactionPicker,
} from '@/modules/chat/components/animated-reaction-bubble';

export function ReactionsDemo() {
  const [reactions, setReactions] = useState([
    { emoji: '👍', count: 12, hasReacted: false },
    { emoji: '❤️', count: 8, hasReacted: true },
    { emoji: '😂', count: 5, hasReacted: false },
    { emoji: '🔥', count: 3, hasReacted: false },
  ]);
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        return prev.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.hasReacted ? r.count - 1 : r.count + 1, hasReacted: !r.hasReacted }
            : r
        );
      }
      return [...prev, { emoji, count: 1, hasReacted: true }];
    });
    setShowPicker(false);
  };

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Reaction System</h2>
      <p className="mb-4 text-gray-400">
        Animated reactions with spring physics and particle effects
      </p>

      <GlassCard variant="frosted" className="mx-auto max-w-lg p-6">
        <div className="mb-4 rounded-2xl bg-gray-700 p-4">
          <p className="text-white">This message has reactions! Click to toggle them.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reactions.map((reaction) => (
            <AnimatedReactionBubble
              key={reaction.emoji}
              reaction={reaction}
              isOwnMessage={false}
              onPress={() => handleReact(reaction.emoji)}
            />
          ))}

          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-gray-300 transition-colors hover:bg-gray-500 hover:text-white"
          >
            +
          </button>
        </div>

        {showPicker && (
          <div className="mt-4">
            <ReactionPicker onSelect={handleReact} onClose={() => setShowPicker(false)} />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
