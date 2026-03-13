/**
 * MentionAutocomplete Component
 *
 * Detects @ character in a text input and shows a floating dropdown
 * with user suggestions for @mention insertion.
 *
 * Features:
 * - Debounced search (300ms) after @ character
 * - Floating dropdown with avatar + username + display name
 * - Keyboard navigation (up/down/enter/escape)
 * - Insert @username on select
 *
 * @module modules/forums/components/mention-autocomplete
 */

import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/shared/hooks';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MentionAutocomplete');

// ── Types ──────────────────────────────────────────────────────────────

interface MentionUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface MentionAutocompleteProps {
  /** Called when user selects a mention */
  onMention: (username: string) => void;
  /** Ref to the text input/textarea being monitored */
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  /** Optional: custom fetch function for user search */
  onSearch?: (query: string) => Promise<MentionUser[]>;
  className?: string;
}

// ── Mock search (replaced by real API in integration) ──────────────────

async function defaultSearch(query: string): Promise<MentionUser[]> {
  void query;
  // Placeholder — real integration will call the backend API
  return [];
}

// ── Component ──────────────────────────────────────────────────────────

/** Mention Autocomplete component. */
export default function MentionAutocomplete({
  onMention,
  inputRef,
  onSearch = defaultSearch,
  className,
}: MentionAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Search users when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setUsers([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    onSearch(debouncedQuery)
      .then((results) => {
        if (!cancelled) {
          setUsers(results);
          setSelectedIndex(0);
        }
      })
      .catch((err) => {
        logger.error('Mention search failed:', err);
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, onSearch]);

  // Detect @ in input
  const handleInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const { value } = el;
    const cursorPos = el.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursorPos);

    // Find the last @ that isn't preceded by a word character
    const match = textBefore.match(/(?:^|[^@\w])@(\w*)$/);

    if (match) {
      const mentionQuery = match[1] ?? '';
      setQuery(mentionQuery);
      setIsOpen(true);

      // Position dropdown near cursor
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    } else {
      setIsOpen(false);
      setQuery('');
    }
  }, [inputRef]);

  // Attach input listener
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.addEventListener('input', handleInput);
    el.addEventListener('click', handleInput);

    return () => {
      el.removeEventListener('input', handleInput);
      el.removeEventListener('click', handleInput);
    };
  }, [inputRef, handleInput]);

  // Insert mention into input
  const insertMention = useCallback(
    (username: string) => {
      const el = inputRef.current;
      if (!el) return;

      const { value } = el;
      const cursorPos = el.selectionStart ?? value.length;
      const textBefore = value.slice(0, cursorPos);

      // Replace @query with @username
      const newTextBefore = textBefore.replace(/(?:^|(?<=\s|^))@\w*$/, `@${username} `);
      const textAfter = value.slice(cursorPos);
      const newValue = newTextBefore + textAfter;

      // Update input value
      const nativeInputValueSetter =
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set ??
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

      nativeInputValueSetter?.call(el, newValue);
      el.dispatchEvent(new Event('input', { bubbles: true }));

      // Move cursor
      const newCursorPos = newTextBefore.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
      el.focus();

      onMention(username);
      setIsOpen(false);
      setQuery('');
    },
    [inputRef, onMention]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, users.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (users[selectedIndex]) {
            insertMention(users[selectedIndex].username);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, users, selectedIndex, insertMention]);

  return (
    <AnimatePresence>
      {isOpen && (users.length > 0 || isLoading) && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className={cn(
            'fixed z-[100] w-72 rounded-lg border border-white/[0.08] bg-gray-900 shadow-2xl',
            className
          )}
          style={{ top: position.top, left: position.left }}
        >
          {isLoading && users.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-primary-500" />
              Searching…
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {users.map((user, index) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => insertMention(user.username)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-primary-600/20 text-white'
                        : 'text-gray-300 hover:bg-white/[0.06]'
                    )}
                  >
                    <img
                      src={user.avatarUrl ?? '/default-avatar.png'}
                      alt={user.username}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">@{user.username}</div>
                      {user.displayName && user.displayName !== user.username && (
                        <div className="truncate text-xs text-gray-500">{user.displayName}</div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
