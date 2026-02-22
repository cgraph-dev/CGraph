/**
 * CustomStatusModal - Set/edit custom status with emoji and text
 * @module modules/social/components
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, FaceSmileIcon, ClockIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { entranceVariants } from '@/lib/animation-presets/presets';
import { api } from '@/lib/api';

const PRESENCE_MODES = [
  { id: 'online', label: 'Online', color: 'bg-green-500', description: 'Visible to everyone' },
  { id: 'away', label: 'Away', color: 'bg-yellow-500', description: 'Show as idle' },
  { id: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500', description: 'Suppress notifications' },
  { id: 'invisible', label: 'Invisible', color: 'bg-gray-500', description: 'Appear offline to others' },
] as const;

interface CustomStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus?: string;
  currentEmoji?: string;
  onStatusUpdated?: (status: string, emoji: string) => void;
}

const STATUS_PRESETS = [
  { emoji: '🟢', text: 'Available' },
  { emoji: '🔴', text: 'Busy' },
  { emoji: '🌙', text: 'Away' },
  { emoji: '🎮', text: 'Gaming' },
  { emoji: '💻', text: 'Working' },
  { emoji: '📚', text: 'Studying' },
  { emoji: '🎵', text: 'Listening to music' },
  { emoji: '😴', text: 'Sleeping' },
];

const QUICK_EMOJIS = [
  '😊', '😎', '🤔', '😢', '🎉', '🔥', '💪', '🎮',
  '💻', '📚', '🎵', '☕', '🌙', '✨', '💜', '🚀',
];

const EXPIRY_OPTIONS = [
  { label: "Don't clear", value: '' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '4 hours', value: '4h' },
  { label: 'Today', value: 'today' },
];

export function CustomStatusModal({
  isOpen,
  onClose,
  currentStatus = '',
  currentEmoji = '',
  onStatusUpdated,
}: CustomStatusModalProps) {
  const [statusText, setStatusText] = useState(currentStatus);
  const [emoji, setEmoji] = useState(currentEmoji || '😊');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expiresIn, setExpiresIn] = useState('');
  const [saving, setSaving] = useState(false);
  const [presenceMode, setPresenceMode] = useState<string>('online');

  useEffect(() => {
    if (isOpen) {
      setStatusText(currentStatus);
      setEmoji(currentEmoji || '😊');
    }
  }, [isOpen, currentStatus, currentEmoji]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const customStatus = emoji ? `${emoji} ${statusText}` : statusText;
      // Update custom status text
      await api.put('/api/v1/me', {
        custom_status: customStatus,
        status_message: statusText,
      });
      // Update presence mode (online/away/dnd/invisible)
      if (presenceMode !== 'online') {
        await api.put('/api/v1/presence/status', { status: presenceMode });
      }
      onStatusUpdated?.(statusText, emoji);
      onClose();
    } catch {
      // toast error handled by api interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await api.put('/api/v1/me', {
        custom_status: null,
        status_message: null,
      });
      onStatusUpdated?.('', '');
      onClose();
    } catch {
      // handled by api interceptor
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = (preset: { emoji: string; text: string }) => {
    setEmoji(preset.emoji);
    setStatusText(preset.text);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          {...entranceVariants.fadeUp}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <GlassCard className="p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Set Custom Status</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-dark-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Presence Mode Selector */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase text-gray-500">Presence</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESENCE_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPresenceMode(mode.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                      presenceMode === mode.id
                        ? 'bg-dark-700 ring-1 ring-primary-500/40 text-white'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-gray-300'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${mode.color}`} />
                    <div className="text-left">
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-[10px] text-gray-500">{mode.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Input */}
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-dark-800 p-3 ring-1 ring-gray-700 focus-within:ring-primary-500">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-700 text-xl transition-colors hover:bg-dark-600"
              >
                {emoji || <FaceSmileIcon className="h-5 w-5 text-gray-400" />}
              </button>
              <input
                type="text"
                placeholder="What's happening?"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                maxLength={128}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                autoFocus
              />
            </div>

            {/* Quick Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 rounded-lg bg-dark-800 p-3">
                    {QUICK_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          setEmoji(e);
                          setShowEmojiPicker(false);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-dark-600 ${
                          emoji === e ? 'bg-primary-600/20 ring-1 ring-primary-500' : ''
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Presets */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase text-gray-500">Quick Presets</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_PRESETS.map((preset) => (
                  <button
                    key={preset.text}
                    onClick={() => handlePreset(preset)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      statusText === preset.text && emoji === preset.emoji
                        ? 'bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/30'
                        : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-gray-500">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>Clear after</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiresIn(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      expiresIn === opt.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClear}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
              >
                Clear Status
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
