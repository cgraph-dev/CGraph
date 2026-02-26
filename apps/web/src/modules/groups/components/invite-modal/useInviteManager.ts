/**
 * Hook for invite management operations.
 * @module
 */
import { useState, useCallback, useEffect } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';

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

/**
 * unknown for the groups module.
 */
/**
 * Hook for managing invite manager.
 *
 * @param groupId - The group id.
 */
export function useInviteManager(groupId?: string) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiration, setExpiration] = useState<number | null>(24 * 60 * 60);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);

  // Fetch existing invites
  useEffect(() => {
    if (!groupId) return;
    api.get(`/api/v1/groups/${groupId}/invites`)
      .then((res) => {
        const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setInvites(data.map((inv: Record<string, any>) => ({
          id: inv.id,
          code: inv.code,
          url: inv.url || `${window.location.origin}/invite/${inv.code}`,
          maxUses: inv.max_uses ?? null,
          uses: inv.uses ?? 0,
          expiresAt: inv.expires_at ?? null,
          createdBy: {
            id: inv.created_by?.id ?? inv.creator?.id ?? '',
            username: inv.created_by?.username ?? inv.creator?.username ?? 'unknown',
          },
          createdAt: inv.created_at ?? inv.inserted_at ?? new Date().toISOString(),
        })));
      })
      .catch(() => {});
  }, [groupId]);

  const handleGenerateInvite = useCallback(async () => {
    if (!groupId) return;
    setIsGenerating(true);
    try {
      const res = await api.post(`/api/v1/groups/${groupId}/invites`, {
        max_uses: maxUses,
        expires_in: expiration,
      });
      const inv = res.data?.data || res.data;
      const inviteCode = inv.code;
      const inviteUrl = inv.url || `${window.location.origin}/invite/${inviteCode}`;

      const newInvite: Invite = {
        id: inv.id || Date.now().toString(),
        code: inviteCode,
        url: inviteUrl,
        maxUses,
        uses: 0,
        expiresAt: expiration ? new Date(Date.now() + expiration * 1000).toISOString() : null,
        createdBy: { id: 'me', username: 'You' },
        createdAt: new Date().toISOString(),
      };

      setInvites([newInvite, ...invites]);
      setInviteLink(inviteUrl);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to generate invite:', error);
      HapticFeedback.error();
    } finally {
      setIsGenerating(false);
    }
  }, [groupId, expiration, maxUses, invites]);

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
      if (groupId) {
        api.delete(`/api/v1/groups/${groupId}/invites/${inviteId}`).catch(() => {});
      }
    },
    [invites, groupId]
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
