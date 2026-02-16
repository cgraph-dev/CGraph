import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from '../customization-demo/CustomizationDemo/AnimatedAvatar';
import { AnimatedBorder } from '../customization-demo/effects';
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
          className={`demo-profile-popup__title demo-message__title-badge--id-${profile.titleId}`}
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
          <span className="demo-profile-popup__stat-value">✕ {profile.streak}</span>
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

function AnimatedReaction({ type, count }: { type: 'approved' | 'disapproved'; count: number }) {
  const isDisapproved = type === 'disapproved';
  const [displayCount, setDisplayCount] = useState(count);
  const [tickBurstKey, setTickBurstKey] = useState(0);
  const prevCountRef = useRef(count);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    if (count !== prev) {
      setDisplayCount(count);
      setTickBurstKey((k) => k + 1);
    }
  }, [count]);

  return (
    <motion.span
      className={`demo-reaction demo-reaction--${type}`}
      initial={{ opacity: 0, scale: 0.94, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className={`demo-reaction__icon demo-reaction__icon--${type}`}
        aria-label={type === 'approved' ? 'Approved' : 'Disapproved'}
      >
        {type === 'approved' ? '✓' : '✕'}
      </span>
      <motion.span
        key={displayCount}
        className="demo-reaction__count"
        initial={{ scale: 1.08, opacity: 0.78, y: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {displayCount}
      </motion.span>

      {tickBurstKey > 0 && (
        <motion.span
          key={tickBurstKey}
          className={`demo-reaction__increment demo-reaction__increment--${type}`}
          initial={{ opacity: 0, y: 2, scale: 0.88 }}
          animate={{
            opacity: [0, 0.72, 0],
            y: isDisapproved ? [0, 6, 10] : [0, -6, -10],
            scale: [0.88, 1.01, 0.98],
          }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1], times: [0, 0.35, 1] }}
        >
          {isDisapproved ? '-1' : '+1'}
        </motion.span>
      )}
    </motion.span>
  );
}

/** Game-style tutorial overlay: animated cursor demonstrates swipe up (✓) then swipe down (✕) */
function ClickTutorial({ phase }: { phase: string }) {
  const showApprove = phase === 'approve-badge';
  const showDisapprove = phase === 'disapprove-badge';
  const isGrabbing = phase === 'grab' || phase === 'grab2';
  const isSwiping = phase === 'swipe-up' || phase === 'swipe-down';
  const showCursor = isGrabbing || isSwiping;
  const swipeDir = phase === 'swipe-up' ? -14 : phase === 'swipe-down' ? 14 : 0;

  // New: Determine if it's an "up" or "down" movement
  const isUp = phase === 'grab' || phase === 'swipe-up' || phase === 'approve-badge';
  const isDown = phase === 'grab2' || phase === 'swipe-down' || phase === 'disapprove-badge';

  return (
    <div className="demo-input-tutorial">
      {/* Dynamic Arrow: ↑ during up phases, ↓ during down phases */}
      <AnimatePresence mode="wait">
        {(showCursor || showApprove || showDisapprove) && (
          <motion.span
            key={isUp ? 'up' : 'down'}
            className="demo-input-tutorial__arrow-up"
            initial={{ opacity: 0, y: isUp ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isUp ? 4 : -4 }}
            transition={{ duration: 0.2 }}
          >
            {isUp ? '↑' : '↓'}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Idle hint text */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.span
            className="demo-input-tutorial__hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            Swipe ↑ or ↓ to react
          </motion.span>
        )}
      </AnimatePresence>

      {/* Cursor */}
      <AnimatePresence>
        {showCursor && (
          <motion.span
            className="demo-input-tutorial__cursor"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, y: isSwiping ? swipeDir : 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: isSwiping ? 0.3 : 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Finger / touch circle */}
              <circle
                cx="12"
                cy="12"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                opacity="0.6"
              />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.8" />

              {/* Conditional Arrows in SVG */}
              {isUp && (
                <>
                  <path d="M12 4L9 7h6L12 4z" fill="currentColor" opacity="0.9" />
                  <line
                    x1="12"
                    y1="7"
                    x2="12"
                    y2="8.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </>
              )}
              {isDown && (
                <>
                  <path d="M12 20l3-3H9l3 3z" fill="currentColor" opacity="0.9" />
                  <line
                    x1="12"
                    y1="17"
                    x2="12"
                    y2="15.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Approve badge */}
      <AnimatePresence>
        {showApprove && (
          <motion.div
            className="demo-input-tutorial__badge demo-input-tutorial__badge--approve"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span className="demo-input-tutorial__badge-icon">✓</span>
            <span className="demo-input-tutorial__badge-label">Swipe ↑ to approve</span>
            <span className="demo-input-tutorial__badge-xp">+10 XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disapprove badge */}
      <AnimatePresence>
        {showDisapprove && (
          <motion.div
            className="demo-input-tutorial__badge demo-input-tutorial__badge--disapprove"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span className="demo-input-tutorial__badge-icon demo-input-tutorial__badge-icon--red">
              ✕
            </span>
            <span className="demo-input-tutorial__badge-label">Swipe ↓ to disapprove</span>
            <span className="demo-input-tutorial__badge-xp demo-input-tutorial__badge-xp--red">
              −5 XP
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Twinkling shooting star for galaxy-themed bubbles */
function GalaxyParticles() {
  const stars = useRef(
    Array.from({ length: 4 }, (_, i) => ({
      id: i,
      top: 15 + Math.random() * 60,
      delay: i * 1.5 + Math.random(),
      duration: 1.2 + Math.random() * 0.8,
    }))
  ).current;

  return (
    <div className="demo-bubble-particles">
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="demo-shooting-star"
          style={{ top: `${s.top}%` }}
          animate={{
            x: ['-10%', '110%'],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 3 + Math.random() * 3,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.1, 0.8, 1],
          }}
        />
      ))}
    </div>
  );
}

export const ChatDemo = memo(function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // Tutorial phase cycle — runs until user focuses input
  type TutorialPhase =
    | 'idle'
    | 'grab'
    | 'swipe-up'
    | 'approve-burst'
    | 'approve-badge'
    | 'pause'
    | 'grab2'
    | 'swipe-down'
    | 'disapprove-burst'
    | 'disapprove-badge';
  const [tutorialPhase, setTutorialPhase] = useState<TutorialPhase>('idle');
  const tutorialTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (inputFocused) return; // stop when user focuses
    let mounted = true;
    const clearAll = () => {
      tutorialTimersRef.current.forEach(clearTimeout);
      tutorialTimersRef.current = [];
    };
    const schedule = (fn: () => void, ms: number) => {
      tutorialTimersRef.current.push(setTimeout(() => mounted && fn(), ms));
    };
    const run = () => {
      clearAll();
      setTutorialPhase('idle');
      schedule(() => setTutorialPhase('grab'), 400);
      schedule(() => setTutorialPhase('swipe-up'), 700);
      schedule(() => setTutorialPhase('approve-burst'), 1000);
      schedule(() => setTutorialPhase('approve-badge'), 1300);
      schedule(() => setTutorialPhase('grab2'), 3200);
      schedule(() => setTutorialPhase('swipe-down'), 3500);
      schedule(() => setTutorialPhase('disapprove-burst'), 3800);
      schedule(() => setTutorialPhase('disapprove-badge'), 4100);
      schedule(run, 6500);
    };
    run();
    return () => {
      mounted = false;
      clearAll();
    };
  }, [inputFocused]);
  const reactionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const userReactionsRef = useRef<Record<string, 'approved' | 'disapproved'>>({});
  const swipeStartRef = useRef<{ msgId: string; y: number } | null>(null);
  const SWIPE_THRESHOLD = 40;

  const applyReaction = (msgId: string, targetType: 'approved' | 'disapproved') => {
    const currentReaction = userReactionsRef.current[msgId];

    if (currentReaction === targetType) {
      delete userReactionsRef.current[msgId];
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          const reactions = (m.reactions ?? [])
            .map((r) => (r.type === targetType ? { ...r, count: Math.max(0, r.count - 1) } : r))
            .filter((r) => r.count > 0);
          return { ...m, reactions, reactionsVisible: reactions.length > 0 };
        })
      );
      return;
    }

    userReactionsRef.current[msgId] = targetType;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        let reactions = m.reactions ? [...m.reactions] : [];
        if (currentReaction) {
          reactions = reactions
            .map((r) =>
              r.type === currentReaction ? { ...r, count: Math.max(0, r.count - 1) } : r
            )
            .filter((r) => r.count > 0);
        }
        const idx = reactions.findIndex((r) => r.type === targetType);
        if (idx >= 0 && reactions[idx]) {
          reactions[idx] = { type: reactions[idx].type, count: reactions[idx].count + 1 };
        } else {
          reactions.push({ type: targetType, count: 1 });
        }
        return { ...m, reactions, reactionsVisible: true };
      })
    );
  };

  const handlePointerDown = (msgId: string, e: React.PointerEvent) => {
    const msg = messages.find((m) => m.id === msgId);
    if (msg?.author === 'You') return; // can't react to own messages
    swipeStartRef.current = { msgId, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!swipeStartRef.current) return;
    const { msgId, y: startY } = swipeStartRef.current;
    swipeStartRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const deltaY = startY - e.clientY;
    if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;
    if (deltaY > 0) applyReaction(msgId, 'approved');
    else applyReaction(msgId, 'disapproved');
  };

  const handlePointerCancel = () => {
    swipeStartRef.current = null;
  };

  useEffect(() => {
    let messageIndex = 0;
    const addMessage = () => {
      const msg = DEMO_MESSAGES[messageIndex];
      if (messageIndex < DEMO_MESSAGES.length && msg) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const profile = DEMO_USER_PROFILES[msg.author];
          const id = `msg-${Date.now()}`;
          setMessages((prev) => [
            ...prev,
            {
              id,
              author: msg.author,
              avatar: msg.avatar,
              content: msg.content,
              timestamp: new Date(),
              reactions: msg.reactions,
              reactionsVisible: false,
              profile,
              showTutorial: msg.showTutorial,
            },
          ]);
          if (msg.reactions?.length) {
            const revealTimer = setTimeout(() => {
              setMessages((prev) =>
                prev.map((entry) =>
                  entry.id === id ? { ...entry, reactionsVisible: true } : entry
                )
              );
            }, 900);
            reactionTimersRef.current.push(revealTimer);
          }
          messageIndex++;
        }, 1500);
      }
    };

    const timers = [
      setTimeout(addMessage, 1000),
      setTimeout(addMessage, 4000),
      setTimeout(addMessage, 7000),
    ];

    return () => {
      timers.forEach(clearTimeout);
      reactionTimersRef.current.forEach(clearTimeout);
      reactionTimersRef.current = [];
    };
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
    <div className="mx-auto max-w-2xl">
      <AnimatedBorder>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="demo-chat__messages scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 mb-4 h-[400px] overflow-y-auto pr-2">
            <AnimatePresence>
              {messages.map((msg) => {
                const isSelf = msg.author === 'You';
                const hasBubbleAnim =
                  msg.profile?.borderType === 'electric' || msg.profile?.borderType === 'legendary';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`demo-message ${isSelf ? 'demo-message--self' : ''}${msg.profile?.borderType === 'electric' ? 'demo-message--bubble-electric' : ''}${msg.profile?.borderType === 'legendary' ? 'demo-message--bubble-legendary' : ''}`}
                    onPointerDown={(e) => handlePointerDown(msg.id, e)}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    style={{
                      cursor: 'grab',
                      ...(msg.profile && !hasBubbleAnim
                        ? {
                            background: msg.profile.bubbleAccent,
                            border: `1px solid ${msg.profile.bubbleBorder}`,
                            boxShadow: `0 0 15px ${msg.profile.bubbleBorder}`,
                          }
                        : {}),
                    }}
                  >
                    {msg.profile?.borderType === 'electric' && <GalaxyParticles />}
                    {!isSelf && (
                      <HoverableAvatar
                        author={msg.author}
                        avatar={msg.avatar}
                        profile={msg.profile}
                      />
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
                            className={`demo-message__title-badge demo-message__title-badge--id-${msg.profile.titleId}`}
                          >
                            {msg.profile.title}
                          </span>
                        )}
                        {msg.profile?.badges.slice(0, 2).map((b) => (
                          <span
                            key={b.label}
                            className="demo-message__inline-badge"
                            title={b.label}
                          >
                            {b.icon}
                          </span>
                        ))}
                      </div>
                      <p className="demo-message__text">{msg.content}</p>

                      <AnimatePresence>
                        {msg.reactions && msg.reactionsVisible && (
                          <motion.div
                            className="demo-message__reactions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                          >
                            {msg.reactions.map((r, i) => (
                              <AnimatedReaction
                                key={`${msg.id}-${r.type}-${i}`}
                                type={r.type}
                                count={r.count}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
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

          {(() => {
            const isGreen =
              tutorialPhase === 'grab' ||
              tutorialPhase === 'swipe-up' ||
              tutorialPhase === 'approve-burst' ||
              tutorialPhase === 'approve-badge';
            const isRed =
              tutorialPhase === 'grab2' ||
              tutorialPhase === 'swipe-down' ||
              tutorialPhase === 'disapprove-burst' ||
              tutorialPhase === 'disapprove-badge';
            const borderColor = inputFocused
              ? 'rgba(16, 185, 129, 0.5)'
              : isGreen
                ? 'rgba(16, 185, 129, 0.4)'
                : isRed
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(255, 255, 255, 0.1)';
            const bgColor = inputFocused
              ? 'rgba(255, 255, 255, 0.1)'
              : isGreen
                ? 'rgba(16, 185, 129, 0.06)'
                : isRed
                  ? 'rgba(239, 68, 68, 0.06)'
                  : 'rgba(255, 255, 255, 0.03)';
            const shadowColor =
              isGreen && !inputFocused
                ? '0 0 12px rgba(16, 185, 129, 0.15)'
                : isRed && !inputFocused
                  ? '0 0 12px rgba(239, 68, 68, 0.15)'
                  : 'none';

            return (
              <motion.div
                className="demo-chat__input-box"
                animate={{ borderColor, backgroundColor: bgColor, boxShadow: shadowColor }}
                transition={{ duration: 0.3 }}
              >
                {!inputFocused ? (
                  <ClickTutorial phase={tutorialPhase} />
                ) : (
                  <input
                    type="text"
                    className="demo-chat__input-field"
                    placeholder="Try sending a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    onBlur={() => {
                      if (!inputValue.trim()) setInputFocused(false);
                    }}
                    autoFocus
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!inputFocused) {
                      setInputFocused(true);
                      return;
                    }
                    handleSend();
                  }}
                  className="demo-chat__send-btn"
                >
                  Send
                </button>
              </motion.div>
            );
          })()}
        </div>
      </AnimatedBorder>
    </div>
  );
});
