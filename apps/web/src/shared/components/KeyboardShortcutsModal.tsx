/**
 * KeyboardShortcutsModal - Shows available keyboard shortcuts
 * Triggered by ? or Ctrl+/
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { entranceVariants, springs } from '@/lib/animation-presets/presets';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open Quick Switcher' },
      { keys: ['Alt', '↑'], description: 'Previous conversation' },
      { keys: ['Alt', '↓'], description: 'Next conversation' },
      { keys: ['Ctrl', 'Shift', 'A'], description: 'Toggle sidebar' },
      { keys: ['Escape'], description: 'Close modal / Go back' },
    ],
  },
  {
    title: 'Messaging',
    shortcuts: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line' },
      { keys: ['Ctrl', 'Enter'], description: 'Send message (alt)' },
      { keys: ['↑'], description: 'Edit last message' },
      { keys: ['Ctrl', 'Shift', 'E'], description: 'Open emoji picker' },
    ],
  },
  {
    title: 'Calls & Media',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'M'], description: 'Toggle mute' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Toggle deafen' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Toggle video' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Share screen' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show this help' },
      { keys: ['Ctrl', '/'], description: 'Show this help (alt)' },
      { keys: ['Ctrl', ','], description: 'Open settings' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'New conversation' },
    ],
  },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-xs font-medium text-white/80 shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ? key (not in input/textarea)
      if (
        e.key === '?' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsOpen((o) => !o);
        return;
      }
      // Ctrl+/ or Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((o) => !o);
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            variants={entranceVariants.fadeUp}
            initial="initial"
            animate="animate"
            exit="initial"
            transition={springs.gentle}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-dark-800 p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Categories grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {SHORTCUT_CATEGORIES.map((category) => (
                <div key={category.title}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-400">
                    {category.title}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.description}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
                      >
                        <span className="text-sm text-white/70">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-xs text-white/30">+</span>}
                              <KeyBadge>{key}</KeyBadge>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-white/30">
              Press <KeyBadge>?</KeyBadge> or <KeyBadge>Ctrl</KeyBadge>
              <span className="mx-0.5 text-white/30">+</span>
              <KeyBadge>/</KeyBadge> to toggle this modal
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
