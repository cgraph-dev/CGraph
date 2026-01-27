import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  className?: string;
}

// Comprehensive emoji collection organized by category
const EMOJI_CATEGORIES = {
  'Frequently Used': ['😊', '❤️', '😂', '👍', '🎉', '🔥', '✨', '💯', '🙏', '👀'],
  'Smileys & People': [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '🙃',
    '😉',
    '😊',
    '😇',
    '🥰',
    '😍',
    '🤩',
    '😘',
    '😗',
    '😚',
    '😙',
    '🥲',
    '😋',
    '😛',
    '😜',
    '🤪',
    '😝',
    '🤑',
    '🤗',
    '🤭',
    '🤫',
    '🤔',
    '🤐',
    '🤨',
    '😐',
    '😑',
    '😶',
    '😏',
    '😒',
    '🙄',
    '😬',
    '🤥',
    '😌',
    '😔',
    '😪',
    '🤤',
    '😴',
    '😷',
    '🤒',
    '🤕',
    '🤢',
    '🤮',
    '🤧',
    '🥵',
    '🥶',
    '😵',
    '🤯',
    '🤠',
    '🥳',
    '😎',
    '🤓',
  ],
  Gestures: [
    '👋',
    '🤚',
    '🖐',
    '✋',
    '🖖',
    '👌',
    '🤌',
    '🤏',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '👍',
    '👎',
    '✊',
    '👊',
    '🤛',
    '🤜',
    '👏',
    '🙌',
    '👐',
    '🤲',
    '🤝',
    '🙏',
    '✍️',
    '💪',
    '🦵',
    '🦶',
    '👂',
    '🦻',
    '👃',
    '🧠',
    '👀',
  ],
  'Hearts & Love': [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❤️‍🔥',
    '❤️‍🩹',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
  ],
  'Animals & Nature': [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🦆',
    '🦅',
    '🦉',
    '🦇',
    '🐺',
    '🐗',
    '🐴',
    '🦄',
    '🐝',
    '🪱',
    '🐛',
    '🦋',
    '🐌',
    '🐞',
    '🐜',
    '🦟',
    '🦗',
    '🕷️',
    '🦂',
    '🐢',
    '🐍',
    '🌸',
    '💐',
    '🌹',
    '🥀',
    '🌺',
    '🌻',
    '🌼',
    '🌷',
    '🌱',
    '🌲',
    '🌳',
    '🌴',
    '🌵',
    '🌾',
    '🌿',
    '☘️',
    '🍀',
    '🍁',
    '🍂',
    '🍃',
  ],
  'Food & Drink': [
    '🍇',
    '🍈',
    '🍉',
    '🍊',
    '🍋',
    '🍌',
    '🍍',
    '🥭',
    '🍎',
    '🍏',
    '🍐',
    '🍑',
    '🍒',
    '🍓',
    '🫐',
    '🥝',
    '🍅',
    '🫒',
    '🥥',
    '🥑',
    '🍆',
    '🥔',
    '🥕',
    '🌽',
    '🌶️',
    '🫑',
    '🥒',
    '🥬',
    '🥦',
    '🧄',
    '🍕',
    '🍔',
    '🍟',
    '🌭',
    '🍿',
    '🧈',
    '🧀',
    '🥚',
    '🍳',
    '🧇',
    '☕',
    '🍵',
    '🧃',
    '🥤',
    '🧋',
    '🍶',
    '🍺',
    '🍻',
    '🥂',
    '🍷',
  ],
  Activities: [
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🪃',
    '🥅',
    '⛳',
    '🪁',
    '🎯',
    '🎮',
    '🕹️',
    '🎰',
    '🎲',
    '🧩',
    '🎭',
    '🎨',
    '🧵',
    '🪡',
    '🎸',
    '🎹',
    '🎺',
    '🎷',
    '🪗',
    '🥁',
    '🎤',
    '🎧',
    '🎬',
    '🎪',
  ],
  'Travel & Places': [
    '🚗',
    '🚕',
    '🚙',
    '🚌',
    '🚎',
    '🏎️',
    '🚓',
    '🚑',
    '🚒',
    '🚐',
    '🛻',
    '🚚',
    '🚛',
    '🚜',
    '🦯',
    '🦽',
    '🦼',
    '🛴',
    '🚲',
    '🛵',
    '✈️',
    '🛫',
    '🛬',
    '🪂',
    '💺',
    '🚁',
    '🚟',
    '🚠',
    '🚡',
    '🛰️',
    '🏠',
    '🏡',
    '🏢',
    '🏣',
    '🏤',
    '🏥',
    '🏦',
    '🏨',
    '🏩',
    '🏪',
    '⛪',
    '🕌',
    '🛕',
    '🕍',
    '⛩️',
    '🗿',
    '🗽',
    '⛲',
    '⛺',
    '🏕️',
  ],
  Objects: [
    '📱',
    '💻',
    '⌨️',
    '🖥️',
    '🖨️',
    '🖱️',
    '🖲️',
    '🕹️',
    '📷',
    '📹',
    '📺',
    '📻',
    '🎙️',
    '🎚️',
    '🎛️',
    '🧭',
    '⏱️',
    '⏰',
    '⏲️',
    '⌛',
    '💡',
    '🔦',
    '🕯️',
    '🪔',
    '🧯',
    '🛢️',
    '💸',
    '💵',
    '💴',
    '💶',
    '📧',
    '📨',
    '📩',
    '📤',
    '📥',
    '📦',
    '📫',
    '📪',
    '📬',
    '📭',
    '🎁',
    '🎀',
    '🎊',
    '🎉',
    '🎈',
    '🏆',
    '🥇',
    '🥈',
    '🥉',
    '⭐',
  ],
  Symbols: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '✅',
    '❌',
    '⭕',
    '✔️',
    '❗',
    '❓',
    '⚠️',
    '🚫',
    '💯',
    '🔥',
    '✨',
    '💫',
    '⚡',
    '💥',
    '💢',
    '💬',
    '💭',
    '🗯️',
    '💤',
    '💌',
    '🔔',
    '🔕',
    '🎵',
    '🎶',
    '➕',
    '➖',
    '✖️',
    '➗',
    '♾️',
    '🔰',
  ],
  Flags: [
    '🏁',
    '🚩',
    '🎌',
    '🏴',
    '🏳️',
    '🇦🇨',
    '🇦🇩',
    '🇦🇪',
    '🇦🇫',
    '🇦🇬',
    '🇺🇸',
    '🇬🇧',
    '🇨🇦',
    '🇦🇺',
    '🇩🇪',
    '🇫🇷',
    '🇪🇸',
    '🇮🇹',
    '🇯🇵',
    '🇨🇳',
  ],
};

/**
 * EmojiPicker Component
 *
 * A comprehensive emoji picker for message input with search and categories.
 *
 * Features:
 * - Categorized emoji selection
 * - Search functionality
 * - Frequently used tracking
 * - Smooth animations
 * - Glassmorphism design
 */
export function EmojiPicker({ isOpen, onClose, onSelect, className = '' }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] =
    useState<keyof typeof EMOJI_CATEGORIES>('Frequently Used');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentEmojis');
    if (stored) {
      setRecentEmojis(JSON.parse(stored));
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen, onClose]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    HapticFeedback.light();

    // Update recent emojis
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 30);
    setRecentEmojis(updated);
    localStorage.setItem('recentEmojis', JSON.stringify(updated));

    // Update frequently used category
    EMOJI_CATEGORIES['Frequently Used'] = updated.slice(0, 10);

    onClose();
  };

  // Filter emojis based on search
  const filteredEmojis = searchQuery.trim()
    ? Object.values(EMOJI_CATEGORIES)
        .flat()
        .filter((emoji) => emoji.includes(searchQuery.trim()))
    : EMOJI_CATEGORIES[activeCategory];

  const categories = Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={pickerRef}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`absolute z-50 ${className}`}
        >
          <GlassCard className="w-80 p-0">
            {/* Header with Search */}
            <div className="border-b border-white/10 p-3">
              <div className="flex items-center gap-2 rounded-lg bg-dark-800/50 px-3 py-2">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emojis..."
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
              <div className="scrollbar-thin scrollbar-thumb-gray-700 flex gap-1 overflow-x-auto border-b border-white/10 p-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      HapticFeedback.light();
                    }}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      activeCategory === category
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {/* Emoji Grid */}
            <div className="scrollbar-thin scrollbar-thumb-gray-700 grid max-h-64 grid-cols-8 gap-1 overflow-y-auto p-2">
              {filteredEmojis.map((emoji, index) => (
                <motion.button
                  key={`${emoji}-${index}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-all hover:bg-primary-500/20"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>

            {searchQuery && filteredEmojis.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">No emojis found</div>
            )}
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
