/**
 * InteractiveDemo - Live Feature Demonstration Component
 *
 * An interactive showcase that lets visitors experience CGraph features
 * without signing up. Demonstrates real-time messaging, customization,
 * and gamification in a contained sandbox.
 *
 * Features:
 * - Live chat simulation with typing indicators
 * - Avatar customization preview
 * - XP/Level progress animation
 * - Achievement unlock simulation
 * - Responsive glassmorphism design
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number }[];
}

interface DemoTab {
  id: string;
  label: string;
  icon: string;
}

const DEMO_TABS: DemoTab[] = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'customize', label: 'Customize', icon: '✨' },
  { id: 'gamify', label: 'Gamification', icon: '🎮' },
];

const DEMO_MESSAGES: Array<{
  author: string;
  avatar: string;
  content: string;
  reactions?: { emoji: string; count: number }[];
}> = [
  {
    author: 'Alex',
    avatar: '🦊',
    content: 'Hey everyone! Just hit level 50! 🎉',
    reactions: [
      { emoji: '🔥', count: 12 },
      { emoji: '👏', count: 8 },
    ],
  },
  {
    author: 'Jordan',
    avatar: '🐺',
    content: 'Congrats! That new avatar border looks amazing',
    reactions: [{ emoji: '💜', count: 5 }],
  },
  {
    author: 'Sam',
    avatar: '🦁',
    content: "The E2E encryption here is chef's kiss 👨‍🍳",
    reactions: [{ emoji: '🔒', count: 15 }],
  },
];

const AVATAR_BORDERS = [
  { id: 'none', name: 'None', style: 'none' },
  { id: 'gold', name: 'Gold', style: 'linear-gradient(135deg, #ffd700, #ff8c00)' },
  { id: 'emerald', name: 'Emerald', style: 'linear-gradient(135deg, #10b981, #059669)' },
  { id: 'purple', name: 'Royal', style: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  {
    id: 'rainbow',
    name: 'Rainbow',
    style: 'linear-gradient(135deg, #ff0080, #7928ca, #0070f3, #00dfd8)',
  },
];

const ACHIEVEMENTS = [
  { id: 'first-message', name: 'First Steps', icon: '🌟', desc: 'Send your first message' },
  { id: 'social', name: 'Social Butterfly', icon: '🦋', desc: 'Make 10 friends' },
  { id: 'streaker', name: 'Dedicated', icon: '🔥', desc: '7-day login streak' },
  { id: 'legend', name: 'Legend', icon: '👑', desc: 'Reach level 100' },
];

// =============================================================================
// CHAT DEMO
// =============================================================================

const ChatDemo = memo(function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Simulate incoming messages
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

    // Add messages with delays
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

// =============================================================================
// CUSTOMIZE DEMO
// =============================================================================

const CustomizeDemo = memo(function CustomizeDemo() {
  const [selectedBorder, setSelectedBorder] = useState('emerald');
  const [username, setUsername] = useState('YourName');

  const currentBorder = AVATAR_BORDERS.find((b) => b.id === selectedBorder);

  return (
    <div className="demo-customize">
      {/* Preview */}
      <div className="demo-customize__preview">
        <motion.div
          className="demo-avatar-preview"
          style={{
            background: currentBorder?.style !== 'none' ? currentBorder?.style : 'transparent',
            padding: currentBorder?.style !== 'none' ? 4 : 0,
          }}
          layout
        >
          <div className="demo-avatar-preview__inner">
            <span>😎</span>
          </div>
        </motion.div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="demo-customize__name"
          maxLength={20}
        />
        <span className="demo-customize__title">✨ Early Adopter</span>
      </div>

      {/* Border selector */}
      <div className="demo-customize__options">
        <span className="demo-customize__label">Avatar Border</span>
        <div className="demo-customize__borders">
          {AVATAR_BORDERS.map((border) => (
            <motion.button
              key={border.id}
              type="button"
              className={`demo-border-option ${selectedBorder === border.id ? 'active' : ''}`}
              style={{
                background: border.style !== 'none' ? border.style : 'rgba(255,255,255,0.1)',
              }}
              onClick={() => setSelectedBorder(border.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {selectedBorder === border.id && <span>✓</span>}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// GAMIFICATION DEMO
// =============================================================================

const GamificationDemo = memo(function GamificationDemo() {
  const [xp, setXp] = useState(2450);
  const [level, setLevel] = useState(24);
  const [unlockedAchievement, setUnlockedAchievement] = useState<string | null>(null);

  const xpToNextLevel = 3000;
  const progress = (xp / xpToNextLevel) * 100;

  const earnXp = useCallback(() => {
    const earned = Math.floor(Math.random() * 200) + 50;
    setXp((prev) => {
      const newXp = prev + earned;
      if (newXp >= xpToNextLevel) {
        setLevel((l) => l + 1);
        return newXp - xpToNextLevel;
      }
      return newXp;
    });

    // Random achievement unlock
    if (Math.random() > 0.7 && !unlockedAchievement) {
      const randomAchievement = ACHIEVEMENTS[Math.floor(Math.random() * ACHIEVEMENTS.length)];
      if (randomAchievement) {
        setUnlockedAchievement(randomAchievement.id);
        setTimeout(() => setUnlockedAchievement(null), 3000);
      }
    }
  }, [unlockedAchievement]);

  return (
    <div className="demo-gamification">
      {/* Level display */}
      <div className="demo-level">
        <motion.div
          className="demo-level__badge"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3 }}
          key={level}
        >
          <span className="demo-level__number">{level}</span>
        </motion.div>
        <div className="demo-level__info">
          <span className="demo-level__label">Level {level}</span>
          <div className="demo-xp-bar">
            <motion.div
              className="demo-xp-bar__fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="demo-xp-text">
            {xp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* Action button */}
      <motion.button
        type="button"
        className="demo-earn-xp"
        onClick={earnXp}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>⚡</span> Earn XP
      </motion.button>

      {/* Achievements */}
      <div className="demo-achievements">
        <span className="demo-achievements__label">Recent Achievements</span>
        <div className="demo-achievements__grid">
          {ACHIEVEMENTS.slice(0, 4).map((achievement) => (
            <motion.div
              key={achievement.id}
              className={`demo-achievement ${unlockedAchievement === achievement.id ? 'unlocking' : ''}`}
              animate={
                unlockedAchievement === achievement.id
                  ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                  : {}
              }
            >
              <span className="demo-achievement__icon">{achievement.icon}</span>
              <span className="demo-achievement__name">{achievement.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievement unlock notification */}
      <AnimatePresence>
        {unlockedAchievement && (
          <motion.div
            className="demo-unlock-notification"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>🎉 Achievement Unlocked!</span>
            <span>{ACHIEVEMENTS.find((a) => a.id === unlockedAchievement)?.name}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface InteractiveDemoProps {
  className?: string;
}

export const InteractiveDemo = memo(function InteractiveDemo({
  className = '',
}: InteractiveDemoProps) {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className={`interactive-demo ${className}`}>
      {/* Header with tabs */}
      <div className="interactive-demo__header">
        <div className="interactive-demo__tabs">
          {DEMO_TABS.map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              className={`interactive-demo__tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="interactive-demo__content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="interactive-demo__panel"
          >
            {activeTab === 'chat' && <ChatDemo />}
            {activeTab === 'customize' && <CustomizeDemo />}
            {activeTab === 'gamify' && <GamificationDemo />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="interactive-demo__footer">
        <span>🔒 End-to-end encrypted • Try it yourself!</span>
      </div>
    </div>
  );
});

export default InteractiveDemo;
