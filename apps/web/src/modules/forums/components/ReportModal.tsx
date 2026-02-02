/**
 * ReportModal Component
 * Modal for reporting posts, comments, or users with predefined reasons
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, FlagIcon } from '@heroicons/react/24/outline';
import { useForumStore, type Report } from '@/stores/forumStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { GlassCard } from '@/shared/components/ui';
import { toast } from '@/components/ui';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ReportModal');

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: Report['reportType'];
  itemId: string;
  itemTitle?: string; // Optional: for better UX
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or hate speech' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'copyright', label: 'Copyright violation' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'other', label: 'Other (specify below)' },
];

export default function ReportModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemTitle,
}: ReportModalProps) {
  const { reportItem } = useForumStore();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    if (selectedReason === 'other' && !details.trim()) {
      toast.error('Please provide details for "Other" reason');
      return;
    }

    setIsSubmitting(true);
    HapticFeedback.medium();

    try {
      await reportItem({
        reportType: itemType,
        itemId,
        reason: selectedReason,
        details: details.trim() || undefined,
      });

      toast.success('Report submitted successfully');
      HapticFeedback.success();
      handleClose();
    } catch (error) {
      logger.error('Failed to submit report:', error);
      toast.error('Failed to submit report');
      HapticFeedback.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md"
        >
          <GlassCard variant="frosted" className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/20 p-2">
                  <FlagIcon className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Report {itemType}</h2>
                  {itemTitle && (
                    <p className="max-w-xs truncate text-sm text-gray-400">{itemTitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 transition-colors hover:bg-dark-700"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Warning */}
            <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-400">
                ⚠️ False reports may result in action against your account. Please report only
                genuine violations.
              </p>
            </div>

            {/* Reason Selection */}
            <div className="mb-4">
              <label className="mb-3 block text-sm font-medium text-gray-300">
                What's the issue?
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => {
                      setSelectedReason(reason.value);
                      HapticFeedback.light();
                    }}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                      selectedReason === reason.value
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-dark-600 bg-dark-700/50 hover:border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          selectedReason === reason.value
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-500'
                        }`}
                      >
                        {selectedReason === reason.value && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-sm text-white">{reason.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Additional details {selectedReason === 'other' && '(required)'}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide more information to help moderators review this report..."
                rows={4}
                className="w-full resize-none rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                maxLength={1000}
              />
              <div className="mt-1 text-right text-xs text-gray-500">{details.length}/1000</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-lg bg-dark-700 px-4 py-3 font-medium text-white transition-colors hover:bg-dark-600"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                whileHover={{ scale: selectedReason ? 1.02 : 1 }}
                whileTap={{ scale: selectedReason ? 0.98 : 1 }}
                className={`flex-1 rounded-lg px-4 py-3 font-medium transition-all ${
                  selectedReason && !isSubmitting
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-500'
                    : 'cursor-not-allowed bg-dark-700 text-gray-500'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
