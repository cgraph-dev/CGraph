import { useState, useCallback } from 'react';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('InviteModal');

export interface Invite {
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

export const EXPIRATION_OPTIONS = [
  { value: null, label: 'Never' },
  { value: 30 * 60, label: '30 minutes' },
  { value: 60 * 60, label: '1 hour' },
  { value: 6 * 60 * 60, label: '6 hours' },
  { value: 12 * 60 * 60, label: '12 hours' },
  { value: 24 * 60 * 60, label: '1 day' },
  { value: 7 * 24 * 60 * 60, label: '7 days' },
];

export const MAX_USES_OPTIONS = [
  { value: null, label: 'No limit' },
  { value: 1, label: '1 use' },
  { value: 5, label: '5 uses' },
  { value: 10, label: '10 uses' },
  { value: 25, label: '25 uses' },
  { value: 50, label: '50 uses' },
  { value: 100, label: '100 uses' },
];

const MOCK_INVITES: Invite[] = [
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
];

export function useInviteManager() {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiration, setExpiration] = useState<number | null>(24 * 60 * 60);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [invites, setInvites] = useState<Invite[]>(MOCK_INVITES);

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

  return {
    activeTab,
    setActiveTab,
    inviteLink,
    copied,
    isGenerating,
    expiration,
    setExpiration,
    maxUses,
    setMaxUses,
    invites,
    handleGenerateInvite,
    handleCopyLink,
    handleDeleteInvite,
    formatExpiration,
  };
}
