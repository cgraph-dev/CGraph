/**
 * Report Dialog Component
 *
 * Modal dialog for reporting content/users that violates community guidelines.
 * Supports reporting messages, users, posts, and comments.
 */

import {
  XMarkIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  useReportForm,
  REPORT_CATEGORIES,
  type ReportDialogProps,
} from '@/modules/moderation/hooks/useReportForm';

/**
 * unknown for the moderation module.
 */
/**
 * Report Dialog dialog component.
 */
export function ReportDialog({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportDialogProps) {
  const {
    step,
    setStep,
    selectedCategory,
    setSelectedCategory,
    description,
    setDescription,
    reportMutation,
    handleSubmit,
    handleClose,
  } = useReportForm(targetType, targetId, onClose);

  if (!isOpen) return null;

  const targetLabel = targetName || `this ${targetType}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <FlagIcon className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Report Content</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close report dialog"
            className="rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'category' && (
            <CategoryStep
              targetLabel={targetLabel}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          )}

          {step === 'details' && (
            <DetailsStep
              selectedCategory={selectedCategory}
              description={description}
              onDescriptionChange={setDescription}
              error={reportMutation.error}
            />
          )}

          {step === 'success' && <SuccessStep />}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-4 dark:border-gray-700">
          {step === 'category' && (
            <>
              <button
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('details')}
                disabled={!selectedCategory}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={reportMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reportMutation.isPending ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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
              className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

import type { ReportCategory } from '@/modules/moderation/hooks/useReportForm';

function CategoryStep({
  targetLabel,
  selectedCategory,
  onSelect,
}: {
  targetLabel: string;
  selectedCategory: ReportCategory | null;
  onSelect: (value: ReportCategory) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        You're reporting {targetLabel}. Select the reason that best describes the issue.
      </p>
      <div className="space-y-2">
        {REPORT_CATEGORIES.map((category) => (
          <label
            key={category.value}
            className={`block cursor-pointer rounded-lg border p-3 transition-colors ${
              selectedCategory === category.value
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            } `}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="category"
                value={category.value}
                checked={selectedCategory === category.value}
                onChange={() => onSelect(category.value)}
                className="mt-1 text-red-600 focus:ring-red-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{category.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {category.description}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function DetailsStep({
  selectedCategory,
  description,
  onDescriptionChange,
  error,
}: {
  selectedCategory: ReportCategory | null;
  description: string;
  onDescriptionChange: (value: string) => void;
  error: Error | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Provide additional details to help our moderation team review this report. Do not include
          personal information about yourself.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {REPORT_CATEGORIES.find((c) => c.value === selectedCategory)?.label}
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Additional Details (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe what happened..."
          maxLength={2000}
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
        />
        <div className="mt-1 text-right text-xs text-gray-500">{description.length}/2000</div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error instanceof Error ? error.message : 'Failed to submit report. Please try again.'}
        </div>
      )}
    </div>
  );
}

function SuccessStep() {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Report Submitted
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Thank you for helping keep CGraph safe. Our moderation team will review this report.
      </p>
    </div>
  );
}

export default ReportDialog;
