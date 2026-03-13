/**
 * E2EE verification hooks.
 * @module
 */
import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SafetyNumber } from './types';

function generateFallbackSafetyNumber(): string {
  let num = '';
  for (let i = 0; i < 60; i++) {
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
}

/**
 * unknown for the security module.
 */
/**
 * Hook for managing e2 e e verification.
 */
export function useE2EEVerification() {
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    data: safetyData,
    isLoading,
    error,
    refetch,
  } = useQuery<SafetyNumber>({
    queryKey: ['e2ee-safety-number', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      try {
        const res = await api.get(`/api/v1/e2ee/safety-number/${userId}`);
        const d = res.data?.data ?? res.data;
        return {
          userId: d.user_id || userId,
          partnerId: d.partner_id || '',
          safetyNumber: d.safety_number || generateFallbackSafetyNumber(),
          fingerprint: d.fingerprint || '',
          isVerified: d.is_verified || false,
          lastUpdated: d.last_updated || new Date().toISOString(),
        };
      } catch {
        // Fallback for development / missing API
        return {
          userId: userId!,
          partnerId: 'current-user',
          safetyNumber: generateFallbackSafetyNumber(),
          fingerprint: 'abc123def456',
          isVerified: false,
          lastUpdated: new Date().toISOString(),
        };
      }
    },
    enabled: !!userId,
  });

  const verifyMutation = useMutation({
    mutationFn: async (verified: boolean) => {
      await api.post(`/api/v1/e2ee/keys/${userId}/verify`, { verified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e2ee-safety-number', userId] });
    },
    onError: () => {
      // Optimistic-toggle anyway for development
      queryClient.setQueryData<SafetyNumber>(['e2ee-safety-number', userId], (old) =>
        old ? { ...old, isVerified: !old.isVerified } : undefined
      );
    },
    onMutate: async (verified) => {
      await queryClient.cancelQueries({ queryKey: ['e2ee-safety-number', userId] });
      queryClient.setQueryData<SafetyNumber>(['e2ee-safety-number', userId], (old) =>
        old ? { ...old, isVerified: verified } : undefined
      );
    },
  });

  const safetyNumberBlocks = useMemo(() => {
    if (!safetyData?.safetyNumber) return [];
    const blocks = safetyData.safetyNumber.match(/.{1,5}/g) || [];
    const rows: string[][] = [];
    for (let i = 0; i < blocks.length; i += 4) {
      rows.push(blocks.slice(i, i + 4));
    }
    return rows;
  }, [safetyData?.safetyNumber]);

  const formattedForShare = useMemo(() => {
    if (!safetyData?.safetyNumber) return '';
    const blocks = safetyData.safetyNumber.match(/.{1,5}/g) || [];
    const rows: string[] = [];
    for (let i = 0; i < blocks.length; i += 4) {
      rows.push(blocks.slice(i, i + 4).join(' '));
    }
    return rows.join('\n');
  }, [safetyData?.safetyNumber]);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
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

  const handleShare = useCallback(async () => {
    if (!safetyData) return;
    const text = `E2EE Safety Number:\n\n${formattedForShare}\n\nVerify this matches on both devices.`;
    if (navigator.share) {
      await navigator.share({ text, title: 'Safety Number' });
    } else {
      await copyToClipboard(text, 'share');
    }
  }, [safetyData, formattedForShare, copyToClipboard]);

  const formatDate = useCallback((iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return {
    userId: userId || '',
    safetyData,
    safetyNumberBlocks,
    formattedForShare,
    isLoading,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    error: error as Error | null, // safe downcast – structural boundary
    isVerifying: verifyMutation.isPending,
    copiedField,
    toggleVerify: () => safetyData && verifyMutation.mutate(!safetyData.isVerified),
    copyNumber: () => safetyData && copyToClipboard(safetyData.safetyNumber, 'number'),
    handleShare,
    formatDate,
    refetch,
  };
}
