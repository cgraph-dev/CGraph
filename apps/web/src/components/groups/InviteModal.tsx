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
  InfinityIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore } from '@/stores/groupStore';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

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

export function InviteModal({ groupId, groupName, onClose }: InviteModalProps) {
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
      // TODO: Call API to create invite
      const mockCode = Math.random().toString(36).substring(2, 10);
      const mockUrl = `https://cgraph.app/invite/${mockCode}`;
      
      const newInvite: Invite = {
        id: Date.now().toString(),
        code: mockCode,
        url: mockUrl,
        maxUses,
        uses: 0,
        expiresAt: expiration
          ? new Date(Date.now() + expiration * 1000).toISOString()
          : null,
        createdBy: { id: 'me', username: 'You' },
        createdAt: new Date().toISOString(),
      };

      setInvites([newInvite, ...invites]);
      setInviteLink(mockUrl);
      HapticFeedback.success();
    } catch (error) {
      console.error('Failed to generate invite:', error);
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
      console.error('Failed to copy:', error);
    }
  }, []);

  const handleDeleteInvite = useCallback((inviteId: string) => {
    setInvites(invites.filter((i) => i.id !== inviteId));
    HapticFeedback.warning();
    // TODO: Call API to delete invite
  }, [invites]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="p-0 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <LinkIcon className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invite People</h2>
                <p className="text-sm text-gray-400">to {groupName}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {[
                { id: 'create', label: 'Create Invite' },
                { id: 'manage', label: 'Manage Invites' },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as 'create' | 'manage')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                  <div className="space-y-4 mb-6">
                    {/* Expiration */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <ClockIcon className="h-4 w-4" />
                        Expire after
                      </label>
                      <select
                        value={expiration ?? ''}
                        onChange={(e) => setExpiration(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:border-primary-500 focus:outline-none"
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
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <UserGroupIcon className="h-4 w-4" />
                        Max number of uses
                      </label>
                      <select
                        value={maxUses ?? ''}
                        onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:border-primary-500 focus:outline-none"
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
                    className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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
                            className="flex-1 px-4 py-3 rounded-xl bg-dark-800 border border-gray-700 text-white text-sm"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopyLink(inviteLink)}
                            className="p-3 rounded-xl bg-primary-600 text-white"
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
                    <div className="text-center py-8">
                      <LinkIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No active invites</p>
                    </div>
                  ) : (
                    invites.map((invite) => (
                      <motion.div
                        key={invite.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-xl bg-dark-800 border border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="text-primary-400 font-mono">
                                {invite.code}
                              </code>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleCopyLink(invite.url)}
                                className="p-1 rounded hover:bg-dark-700"
                              >
                                <ClipboardDocumentIcon className="h-4 w-4 text-gray-400" />
                              </motion.button>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
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

                            <p className="text-xs text-gray-500 mt-1">
                              Created by {invite.createdBy.username}
                            </p>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
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
          <div className="p-4 border-t border-gray-700/50">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors"
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
