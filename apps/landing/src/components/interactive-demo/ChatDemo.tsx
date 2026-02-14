import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from '../customization-demo/CustomizationDemo/AnimatedAvatar';
import type { Message, DemoUserProfile } from './types';
import { DEMO_MESSAGES, DEMO_USER_PROFILES } from './constants';

/** Mini profile popup — appears on avatar/name hover, matching web app MiniProfileCard */
function DemoProfilePopup({
  profile,
  author,
  avatar,
}: {
  profile: DemoUserProfile;
  author: string;
  avatar: string;
}) {
  const xpPercent = Math.round((profile.xp / profile.maxXp) * 100);

  return (
    <motion.div
      className="demo-profile-popup"
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Banner */}
      <div className="demo-profile-popup__banner" style={{ background: profile.borderStyle }} />

      {/* Avatar with border */}
      <div className="demo-profile-popup__avatar-wrap">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 flex scale-75 transform items-center justify-center">
            <AnimatedAvatar
              borderType={profile.borderType}
              borderColor={profile.borderColor || 'emerald'}
              speedMultiplier={1}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="demo-profile-popup__avatar-inner">{avatar}</div>
          </div>
        </div>
        <span className="demo-profile-popup__online" />
      </div>

      {/* Info */}
      <div className="demo-profile-popup__info">
        <span className="demo-profile-popup__name" style={{ color: profile.nameColor }}>
          {author}
        </span>
        <span
          className={`demo-profile-popup__title ${profile.titleAnimation ? `demo-message__title-badge--${profile.titleAnimation}` : ''}`}
          style={{ backgroundImage: profile.titleColor }}
        >
          {profile.title}
        </span>
      </div>

      {/* Level + XP */}
      <div className="demo-profile-popup__level-row">
        <span className="demo-profile-popup__level">Level {profile.level}</span>
        <span className="demo-profile-popup__xp-text">
          {profile.xp.toLocaleString()} / {profile.maxXp.toLocaleString()} XP
        </span>
      </div>
      <div className="demo-profile-popup__xp-bar">
        <motion.div
          className="demo-profile-popup__xp-fill"
          initial={{ width: 0 }}
          animate={{ width: `${xpPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          style={{ backgroundImage: profile.borderStyle }}
        />
      </div>

      {/* Stats */}
      <div className="demo-profile-popup__stats">
        <div className="demo-profile-popup__stat">
          <span className="demo-profile-popup__stat-value">{profile.karma.toLocaleString()}</span>
          <span className="demo-profile-popup__stat-label">Karma</span>
        </div>
        <div className="demo-profile-popup__stat">
          <span className="demo-profile-popup__stat-value">🔥 {profile.streak}</span>
          <span className="demo-profile-popup__stat-label">Streak</span>
        </div>
      </div>

      {/* Badges */}
      <div className="demo-profile-popup__badges">
        {profile.badges.map((b) => (
          <span key={b.label} className="demo-profile-popup__badge">
            {b.icon} {b.label}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="demo-profile-popup__actions">
        <button type="button" className="demo-profile-popup__btn demo-profile-popup__btn--primary">
          Message
        </button>
        <button
          type="button"
          className="demo-profile-popup__btn demo-profile-popup__btn--secondary"
        >
          View Profile
        </button>
      </div>
    </motion.div>
  );
}

/** Avatar with hover-triggered profile card */
function HoverableAvatar({
  author,
  avatar,
  profile,
}: {
  author: string;
  avatar: string;
  profile?: DemoUserProfile;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!profile) return;
    hoverTimeout.current = setTimeout(() => setShowPopup(true), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setShowPopup(false);
  };

  return (
    <div
      ref={wrapRef}
      className="demo-message__avatar-wrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {profile ? (
        <div className="relative flex h-[48px] w-[48px] items-center justify-center">
          <div className="absolute inset-0 flex scale-75 transform items-center justify-center">
            <AnimatedAvatar
              borderType={profile.borderType}
              borderColor={profile.borderColor || 'emerald'}
              speedMultiplier={1}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="demo-message__avatar-inner scale-90 transform">{avatar}</div>
          </div>
        </div>
      ) : (
        <div className="demo-message__avatar">{avatar}</div>
      )}

      <AnimatePresence>
        {showPopup && profile && (
          <DemoProfilePopup profile={profile} author={author} avatar={avatar} />
        )}
      </AnimatePresence>
    </div>
  );
}

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
          const profile = DEMO_USER_PROFILES[msg.author];
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              author: msg.author,
              avatar: msg.avatar,
              content: msg.content,
              timestamp: new Date(),
              reactions: msg.reactions,
              profile,
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
          {messages.map((msg) => {
            const isSelf = msg.author === 'You';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`demo-message ${isSelf ? 'demo-message--self' : ''}`}
                style={
                  msg.profile
                    ? {
                        background: msg.profile.bubbleAccent,
                        border: `1px solid ${msg.profile.bubbleBorder}`,
                        boxShadow: `0 0 15px ${msg.profile.bubbleBorder}`,
                      }
                    : undefined
                }
              >
                {!isSelf && (
                  <HoverableAvatar author={msg.author} avatar={msg.avatar} profile={msg.profile} />
                )}
                <div className="demo-message__content">
                  <div className="demo-message__header">
                    <span
                      className="demo-message__author"
                      style={
                        isSelf
                          ? { color: 'rgba(255,255,255,0.85)' }
                          : msg.profile
                            ? { color: msg.profile.nameColor }
                            : undefined
                      }
                    >
                      {msg.author}
                    </span>
                    {msg.profile && (
                      <span
                        className={`demo-message__title-badge ${msg.profile.titleAnimation ? `demo-message__title-badge--${msg.profile.titleAnimation}` : ''}`}
                        style={{ backgroundImage: msg.profile.titleColor }}
                      >
                        {msg.profile.title}
                      </span>
                    )}
                    {msg.profile?.badges.slice(0, 2).map((b) => (
                      <span key={b.label} className="demo-message__inline-badge" title={b.label}>
                        {b.icon}
                      </span>
                    ))}
                  </div>
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
                {isSelf && (
                  <div className="demo-message__avatar demo-message__avatar--self">😎</div>
                )}
              </motion.div>
            );
          })}
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
