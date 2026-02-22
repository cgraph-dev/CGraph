/**
 * Messages Demo Section
 */

import { useState } from 'react';
import { GlassCard } from '@/shared/components/ui';
import { AnimatedMessageWrapper } from '@/modules/chat/components/animated-message-wrapper';

export function MessagesDemo() {
  const [messages] = useState([
    { id: '1', text: 'Hey! Check out these new animations 🚀', isOwn: false },
    { id: '2', text: 'Wow, these look amazing! The spring physics feel so smooth', isOwn: true },
    { id: '3', text: 'Try swiping on a message to reply!', isOwn: false },
    { id: '4', text: 'And long press for more options 👀', isOwn: true },
  ]);

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Animated Messages</h2>
      <p className="mb-4 text-gray-400">
        Messages with spring physics, swipe gestures, and particle effects
      </p>

      <GlassCard variant="frosted" className="mx-auto max-w-lg">
        <div className="space-y-3 p-4">
          {messages.map((msg, index) => (
            <AnimatedMessageWrapper
              key={msg.id}
              isOwnMessage={msg.isOwn}
              index={index}
              isNew={index >= 2}
              messageId={msg.id}
              onSwipeReply={() => console.log('Reply to:', msg.id)}
              onLongPress={() => console.log('Long press:', msg.id)}
              enableGestures
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  msg.isOwn ? 'ml-auto bg-primary-600 text-white' : 'bg-gray-700 text-white'
                }`}
              >
                {msg.text}
              </div>
            </AnimatedMessageWrapper>
          ))}
        </div>
      </GlassCard>

      <p className="text-center text-sm text-gray-500">
        💡 Drag left/right to swipe • Long press for context menu
      </p>
    </div>
  );
}
