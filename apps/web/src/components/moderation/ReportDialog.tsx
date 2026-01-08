/**
 * Report Dialog Component
 * 
 * Modal dialog for reporting content/users that violates community guidelines.
 * Supports reporting messages, users, posts, and comments.
 * 
 * @example
 * ```tsx
 * <ReportDialog
 *   isOpen={showReport}
 *   onClose={() => setShowReport(false)}
 *   targetType="message"
 *   targetId={message.id}
 * />
 * ```
 */

import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, FlagIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Report categories with descriptions
const REPORT_CATEGORIES = [
  { value: 'harassment', label: 'Harassment', description: 'Bullying, intimidation, or targeted abuse' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Discrimination based on protected characteristics' },
  { value: 'violence_threat', label: 'Violence or Threats', description: 'Threats of violence or harm' },
  { value: 'spam', label: 'Spam', description: 'Unwanted promotional content or repetitive messages' },
  { value: 'scam', label: 'Scam or Fraud', description: 'Deceptive content or financial fraud' },
  { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { value: 'nsfw_unlabeled', label: 'Adult Content', description: 'NSFW content not properly labeled' },
  { value: 'doxxing', label: 'Doxxing', description: 'Sharing private information without consent' },
  { value: 'self_harm', label: 'Self-Harm', description: 'Content promoting self-harm or suicide' },
  { value: 'copyright', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
  { value: 'other', label: 'Other', description: 'Violation not listed above' },
] as const;

type ReportCategory = typeof REPORT_CATEGORIES[number]['value'];
type TargetType = 'user' | 'message' | 'group' | 'forum' | 'post' | 'comment';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: TargetType;
  targetId: string;
  targetName?: string;  // Optional display name of what's being reported
}

interface ReportPayload {
  report: {
    target_type: TargetType;
    target_id: string;
    category: ReportCategory;
    description?: string;
  };
}

export function ReportDialog({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportDialogProps) {
  const [step, setStep] = useState<'category' | 'details' | 'success'>('category');
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

  if (!isOpen) return null;

  const targetLabel = targetName || `this ${targetType}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <FlagIcon className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Report Content</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'category' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You're reporting {targetLabel}. Select the reason that best describes the issue.
              </p>

              <div className="space-y-2">
                {REPORT_CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className={`
                      block p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedCategory === category.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={selectedCategory === category.value}
                        onChange={() => setSelectedCategory(category.value)}
                        className="mt-1 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {category.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {category.description}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Provide additional details to help our moderation team review this report.
                  Do not include personal information about yourself.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {REPORT_CATEGORIES.find(c => c.value === selectedCategory)?.label}
                </div>
              </div>

              <div>
                <label 
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Additional Details (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened..."
                  maxLength={2000}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-red-500 focus:border-transparent
                           placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
                <div className="text-xs text-gray-500 text-right mt-1">
                  {description.length}/2000
                </div>
              </div>

              {reportMutation.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {(reportMutation.error as any)?.response?.data?.error || 'Failed to submit report. Please try again.'}
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Report Submitted
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Thank you for helping keep CGraph safe. Our moderation team will review this report.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3">
          {step === 'category' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('details')}
                disabled={!selectedCategory}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                         disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Continue
              </button>
            </>
          )}

          {step === 'details' && (
            <>
              <button
                onClick={() => setStep('category')}
                disabled={reportMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={reportMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                         disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors
                         flex items-center gap-2"
              >
                {reportMutation.isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 
                       rounded-lg transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportDialog;
