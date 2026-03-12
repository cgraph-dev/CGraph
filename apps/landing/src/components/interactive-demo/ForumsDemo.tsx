import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FORUM_THREADS = [
  {
    id: 'welcome',
    title: 'Welcome to the CGraph Community!',
    author: 'Alex',
    avatar: '🌐',
    board: 'Announcements',
    boardColor: '#3b82f6',
    votes: 847,
    replies: 142,
    timeAgo: '2h ago',
    pinned: true,
  },
  {
    id: 'e2ee-guide',
    title: 'How post-quantum encryption protects your messages',
    author: 'Sam',
    avatar: '🔐',
    board: 'Security',
    boardColor: '#10b981',
    votes: 523,
    replies: 67,
    timeAgo: '4h ago',
    pinned: false,
  },
  {
    id: 'cosmetics',
    title: 'Show off your rarest cosmetics! 💎',
    author: 'Jordan',
    avatar: '✨',
    board: 'General',
    boardColor: '#8b5cf6',
    votes: 312,
    replies: 89,
    timeAgo: '6h ago',
    pinned: false,
  },
  {
    id: 'feature-req',
    title: 'Feature request: custom forum themes',
    author: 'CryptoFan',
    avatar: '💡',
    board: 'Feedback',
    boardColor: '#f59e0b',
    votes: 198,
    replies: 34,
    timeAgo: '12h ago',
    pinned: false,
  },
  {
    id: 'secret-chat',
    title: 'Secret Chat disappearing messages are amazing',
    author: 'PrivacyFirst',
    avatar: '👻',
    board: 'General',
    boardColor: '#8b5cf6',
    votes: 156,
    replies: 21,
    timeAgo: '1d ago',
    pinned: false,
  },
];

const BOARDS = [
  { name: 'All', color: '#6b7280' },
  { name: 'Announcements', color: '#3b82f6' },
  { name: 'General', color: '#8b5cf6' },
  { name: 'Security', color: '#10b981' },
  { name: 'Feedback', color: '#f59e0b' },
];

export const ForumsDemo = memo(function ForumsDemo() {
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(FORUM_THREADS.map((t) => [t.id, t.votes]))
  );
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});
  const [activeBoard, setActiveBoard] = useState('All');

  function handleVote(threadId: string, direction: 'up' | 'down'): void {
    const current = userVotes[threadId] ?? null;
    if (current === direction) {
      setUserVotes((prev) => ({ ...prev, [threadId]: null }));
      setVotes((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] ?? 0) + (direction === 'up' ? -1 : 1),
      }));
      return;
    }
    const delta = direction === 'up' ? 1 : -1;
    const undo = current === 'up' ? -1 : current === 'down' ? 1 : 0;
    setUserVotes((prev) => ({ ...prev, [threadId]: direction }));
    setVotes((prev) => ({ ...prev, [threadId]: (prev[threadId] ?? 0) + delta + undo }));
  }

  const filteredThreads =
    activeBoard === 'All' ? FORUM_THREADS : FORUM_THREADS.filter((t) => t.board === activeBoard);

  return (
    <div className="demo-forums">
      {/* Board filter */}
      <div className="demo-forums__boards">
        {BOARDS.map((board) => (
          <button
            key={board.name}
            type="button"
            className={`demo-forums__board-tag ${activeBoard === board.name ? 'demo-forums__board-tag--active' : ''}`}
            style={
              activeBoard === board.name
                ? { borderColor: board.color, color: board.color }
                : undefined
            }
            onClick={() => setActiveBoard(board.name)}
          >
            {board.name}
          </button>
        ))}
      </div>

      {/* Thread list */}
      <div className="demo-forums__threads">
        <AnimatePresence mode="popLayout">
          {filteredThreads.map((thread) => (
            <motion.div
              key={thread.id}
              className="demo-forums__thread"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              layout
            >
              {/* Vote column */}
              <div className="demo-forums__vote-col">
                <button
                  type="button"
                  className={`demo-forums__vote-btn ${userVotes[thread.id] === 'up' ? 'demo-forums__vote-btn--active-up' : ''}`}
                  onClick={() => handleVote(thread.id, 'up')}
                  aria-label="Upvote"
                >
                  ▲
                </button>
                <motion.span
                  className="demo-forums__vote-count"
                  key={votes[thread.id]}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.2 }}
                >
                  {votes[thread.id]}
                </motion.span>
                <button
                  type="button"
                  className={`demo-forums__vote-btn ${userVotes[thread.id] === 'down' ? 'demo-forums__vote-btn--active-down' : ''}`}
                  onClick={() => handleVote(thread.id, 'down')}
                  aria-label="Downvote"
                >
                  ▼
                </button>
              </div>

              {/* Content */}
              <div className="demo-forums__thread-content">
                <div className="demo-forums__thread-header">
                  {thread.pinned && <span className="demo-forums__pin">📌</span>}
                  <span
                    className="demo-forums__board-badge"
                    style={{ color: thread.boardColor, borderColor: `${thread.boardColor}40` }}
                  >
                    {thread.board}
                  </span>
                </div>
                <span className="demo-forums__thread-title">{thread.title}</span>
                <div className="demo-forums__thread-meta">
                  <span>
                    {thread.avatar} {thread.author}
                  </span>
                  <span>💬 {thread.replies}</span>
                  <span>{thread.timeAgo}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="demo-forums__footer">
        <span>📊 Cursor-based pagination • Karma system • Board hierarchy</span>
      </div>
    </div>
  );
});
