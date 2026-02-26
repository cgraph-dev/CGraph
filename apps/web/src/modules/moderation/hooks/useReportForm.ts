/**
 * useReportForm Hook
 *
 * Encapsulates state and logic for the report dialog form,
 * including category selection, description, step navigation,
 * and submission via react-query mutation.
 *
 * @module modules/moderation/hooks/useReportForm
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Constants ────────────────────────────────────────────────

export const REPORT_CATEGORIES = [
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Bullying, intimidation, or targeted abuse',
  },
  {
    value: 'hate_speech',
    label: 'Hate Speech',
    description: 'Discrimination based on protected characteristics',
  },
  {
    value: 'violence_threat',
    label: 'Violence or Threats',
    description: 'Threats of violence or harm',
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Unwanted promotional content or repetitive messages',
  },
  { value: 'scam', label: 'Scam or Fraud', description: 'Deceptive content or financial fraud' },
  { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  {
    value: 'nsfw_unlabeled',
    label: 'Adult Content',
    description: 'NSFW content not properly labeled',
  },
  {
    value: 'doxxing',
    label: 'Doxxing',
    description: 'Sharing private information without consent',
  },
  { value: 'self_harm', label: 'Self-Harm', description: 'Content promoting self-harm or suicide' },
  {
    value: 'copyright',
    label: 'Copyright Violation',
    description: 'Unauthorized use of copyrighted material',
  },
  { value: 'other', label: 'Other', description: 'Violation not listed above' },
] as const;

// ── Types ────────────────────────────────────────────────────

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]['value'];
export type ReportStep = 'category' | 'details' | 'success';
export type TargetType = 'user' | 'message' | 'group' | 'forum' | 'post' | 'comment';

export interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: TargetType;
  targetId: string;
  targetName?: string;
}

interface ReportPayload {
  report: {
    target_type: TargetType;
    target_id: string;
    category: ReportCategory;
    description?: string;
  };
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * unknown for the moderation module.
 */
/**
 * Hook for managing report form.
 *
 * @param targetType - The target type.
 * @param targetId - The target id.
 * @param onClose - The on close.
 */
export function useReportForm(targetType: TargetType, targetId: string, onClose: () => void) {
  const [step, setStep] = useState<ReportStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: async (payload: ReportPayload) => {
      const response = await api.post('/v1/reports', payload);
      return response.data;
    },
    onSuccess: () => {
      setStep('success');
    },
  });

  const handleSubmit = () => {
    if (!selectedCategory) return;

    reportMutation.mutate({
      report: {
        target_type: targetType,
        target_id: targetId,
        category: selectedCategory,
        description: description.trim() || undefined,
      },
    });
  };

  const handleClose = () => {
    setStep('category');
    setSelectedCategory(null);
    setDescription('');
    reportMutation.reset();
    onClose();
  };

  return {
    step,
    setStep,
    selectedCategory,
    setSelectedCategory,
    description,
    setDescription,
    reportMutation,
    handleSubmit,
    handleClose,
  };
}
