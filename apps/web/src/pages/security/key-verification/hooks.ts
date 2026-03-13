/**
 * E2EE key verification hooks.
 * @module
 */
import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { asString } from '@/lib/api-utils';

function formatSafetyNumber(n: string): string {
  return n.match(/.{1,5}/g)?.join(' ') || n;
}

/**
 * unknown for the security module.
 */
/**
 * Hook for managing key verification.
 */
export function useKeyVerification() {
  const { userId } = useParams<{ userId: string }>();
  const username = useParams<{ username?: string }>().username || 'User';
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['key-verification', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      const res = await api.get(`/api/v1/e2ee/safety-number/${userId}`);
      const d = res.data?.data ?? res.data;

      let isVerified = false;
      try {
        const vr = await api.get(`/api/v1/e2ee/keys/${userId}/verification-status`);
        isVerified = vr.data?.data?.verified || false;
      } catch {
        // endpoint may not exist
      }

      return {
        safetyNumber: asString(d.safety_number),
        isVerified,
      };
    },
    enabled: !!userId,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/v1/e2ee/keys/${userId}/verify`);
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ['key-verification', userId],
        (old: { safetyNumber: string; isVerified: boolean } | undefined) =>
          old ? { ...old, isVerified: true } : old
      );
    },
  });

  const formatted = useMemo(
    () => (data?.safetyNumber ? formatSafetyNumber(data.safetyNumber) : ''),
    [data?.safetyNumber]
  );

  const qrData = useMemo(
    () =>
      data?.safetyNumber
        ? JSON.stringify({
            version: 1,
            type: 'cgraph-verify',
            userId,
            safetyNumber: data.safetyNumber,
            timestamp: Date.now(),
          })
        : '',
    [data?.safetyNumber, userId]
  );

  const copy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const shareNumber = useCallback(async () => {
    if (!formatted) return;
    const text = `CGraph Safety Number with ${username}:\n\n${formatted}\n\nCompare this number in the CGraph app to verify end-to-end encryption.`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await copy(text, 'share');
    }
  }, [formatted, username, copy]);

  return {
    userId: userId || '',
    username,
    safetyNumber: data?.safetyNumber || null,
    isVerified: data?.isVerified || false,
    formattedNumber: formatted,
    qrData,
    isLoading,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    error: error as Error | null, // safe downcast – structural boundary
    isVerifying: verifyMutation.isPending,
    showQR,
    setShowQR,
    copiedField,
    markVerified: () => verifyMutation.mutate(),
    copyNumber: () => data?.safetyNumber && copy(data.safetyNumber, 'number'),
    shareNumber,
    refetch,
  };
}
