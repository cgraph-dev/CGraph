import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ClockIcon,
  TrashIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('InviteModal');

// Reserved for future use
void useGroupStore;

/**
 * InviteModal Component
 *
 * Generate and manage group invite links.
 * Features:
 * - Create invites with expiration
 * - Set max uses
 * - Copy link to clipboard
 * - View active invites
 * - QR code generation
 * - Invite analytics
 */

interface InviteModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

interface Invite {
  id: string;
  code: string;
  url: string;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdBy: {
    id: string;
    username: string;
  };
  createdAt: string;
}

const EXPIRATION_OPTIONS = [
  { value: null, label: 'Never' },
  { value: 30 * 60, label: '30 minutes' },
  { value: 60 * 60, label: '1 hour' },
  { value: 6 * 60 * 60, label: '6 hours' },
  { value: 12 * 60 * 60, label: '12 hours' },
  { value: 24 * 60 * 60, label: '1 day' },
  { value: 7 * 24 * 60 * 60, label: '7 days' },
];

const MAX_USES_OPTIONS = [
  { value: null, label: 'No limit' },
  { value: 1, label: '1 use' },
  { value: 5, label: '5 uses' },
  { value: 10, label: '10 uses' },
  { value: 25, label: '25 uses' },
  { value: 50, label: '50 uses' },
  { value: 100, label: '100 uses' },
];

export function InviteModal({ groupId: _groupId, groupName, onClose }: InviteModalProps) {
  void _groupId; // Reserved for future API integration
  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiration, setExpiration] = useState<number | null>(24 * 60 * 60);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [invites, setInvites] = useState<Invite[]>([
    // Mock data
    {
      id: '1',
      code: 'abc123',
      url: 'https://cgraph.app/invite/abc123',
      maxUses: null,
      uses: 12,
      expiresAt: null,
      createdBy: { id: '1', username: 'admin' },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const handleGenerateInvite = useCallback(async () => {
    setIsGenerating(true);
    try {
      // @todo(api) Call invite creation endpoint
      const mockCode = Math.random().toString(36).substring(2, 10);
      const mockUrl = `https://cgraph.app/invite/${mockCode}`;

      const newInvite: Invite = {
        id: Date.now().toString(),
        code: mockCode,
        url: mockUrl,
        maxUses,
        uses: 0,
        expiresAt: expiration ? new Date(Date.now() + expiration * 1000).toISOString() : null,
        createdBy: { id: 'me', username: 'You' },
        createdAt: new Date().toISOString(),
      };

      setInvites([newInvite, ...invites]);
      setInviteLink(mockUrl);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to generate invite:', error);
      HapticFeedback.error();
    } finally {
      setIsGenerating(false);
    }
  }, [expiration, maxUses, invites]);

  const handleCopyLink = useCallback(async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      HapticFeedback.success();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
    }
  }, []);

  const handleDeleteInvite = useCallback(
    (inviteId: string) => {
      setInvites(invites.filter((i) => i.id !== inviteId));
      HapticFeedback.warning();
      // @todo(api) Call invite deletion endpoint
    },
    [invites]
  );

  const formatExpiration = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never expires';
    const date = new Date(expiresAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return 'Expired';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours`;
    return `${Math.floor(diff / 86400000)} days`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="overflow-hidden p-0">
          {/* Header */}
          <div className="border-b border-gray-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: colors.primary + '20' }}>
                <LinkIcon className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invite People</h2>
                <p className="text-sm text-gray-400">to {groupName}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-2">
              {[
                { id: 'create', label: 'Create Invite' },
                { id: 'manage', label: 'Manage Invites' },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as 'create' | 'manage')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'create' ? (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Settings */}
                  <div className="mb-6 space-y-4">
                    {/* Expiration */}
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <ClockIcon className="h-4 w-4" />
                        Expire after
                      </label>
                      <select
                        value={expiration ?? ''}
                        onChange={(e) =>
                          setExpiration(e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
                      >
                        {EXPIRATION_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.value ?? ''}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Max Uses */}
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <UserGroupIcon className="h-4 w-4" />
                        Max number of uses
                      </label>
                      <select
                        value={maxUses ?? ''}
                        onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
                      >
                        {MAX_USES_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.value ?? ''}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateInvite}
                    disabled={isGenerating}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {isGenerating ? 'Generating...' : 'Generate New Link'}
                  </motion.button>

                  {/* Generated Link */}
                  <AnimatePresence>
                    {inviteLink && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mt-4"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={inviteLink}
                            readOnly
                            className="flex-1 rounded-xl border border-gray-700 bg-dark-800 px-4 py-3 text-sm text-white"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopyLink(inviteLink)}
                            className="rounded-xl bg-primary-600 p-3 text-white"
                          >
                            {copied ? (
                              <CheckIcon className="h-5 w-5" />
                            ) : (
                              <ClipboardDocumentIcon className="h-5 w-5" />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="manage"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {invites.length === 0 ? (
                    <div className="py-8 text-center">
                      <LinkIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                      <p className="text-gray-400">No active invites</p>
                    </div>
                  ) : (
                    invites.map((invite) => (
                      <motion.div
                        key={invite.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-gray-700 bg-dark-800 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-primary-400">{invite.code}</code>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleCopyLink(invite.url)}
                                className="rounded p-1 hover:bg-dark-700"
                              >
                                <ClipboardDocumentIcon className="h-4 w-4 text-gray-400" />
                              </motion.button>
                            </div>

                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <UserGroupIcon className="h-3 w-3" />
                                {invite.uses}
                                {invite.maxUses ? ` / ${invite.maxUses}` : ''} uses
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                {formatExpiration(invite.expiresAt)}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              Created by {invite.createdBy.username}
                            </p>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700/50 p-4">
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-dark-700 py-2 text-gray-300 transition-colors hover:bg-dark-600"
            >
              Close
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export default InviteModal;
