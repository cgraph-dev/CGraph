import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from './types';
import { DEMO_MESSAGES } from './constants';

export const ChatDemo = memo(function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let messageIndex = 0;
    const addMessage = () => {
      const msg = DEMO_MESSAGES[messageIndex];
      if (messageIndex < DEMO_MESSAGES.length && msg) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              author: msg.author,
              avatar: msg.avatar,
              content: msg.content,
              timestamp: new Date(),
              reactions: msg.reactions,
            },
          ]);
          messageIndex++;
        }, 1500);
      }
    };

    const timers = [
      setTimeout(addMessage, 1000),
      setTimeout(addMessage, 4000),
      setTimeout(addMessage, 7000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        author: 'You',
        avatar: '😎',
        content: inputValue,
        timestamp: new Date(),
      },
    ]);
    setInputValue('');
  };

  return (
    <div className="demo-chat">
      <div className="demo-chat__messages">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="demo-message"
            >
              <div className="demo-message__avatar">{msg.avatar}</div>
              <div className="demo-message__content">
                <span className="demo-message__author">{msg.author}</span>
                <p className="demo-message__text">{msg.content}</p>
                {msg.reactions && (
                  <div className="demo-message__reactions">
                    {msg.reactions.map((r, i) => (
                      <span key={i} className="demo-reaction">
                        {r.emoji} {r.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="demo-typing">
            <span className="demo-typing__dot" />
            <span className="demo-typing__dot" />
            <span className="demo-typing__dot" />
          </motion.div>
        )}
      </div>

      <div className="demo-chat__input">
        <input
          type="text"
          placeholder="Try sending a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button type="button" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
});
