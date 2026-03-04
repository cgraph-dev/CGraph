/**
 * ReportModal component for ForumPost.
 * Modal for reporting posts with reason selection.
 * @module pages/forums/forum-post/report-modal
 */

import { REPORT_REASONS } from './constants';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  onSubmit: () => Promise<void>;
  isReporting: boolean;
}

/**
 * unknown for the forums module.
 */
/**
 * Report Modal dialog component.
 */
export function ReportModal({
  isOpen,
  onClose,
  reportReason,
  setReportReason,
  onSubmit,
  isReporting,
}: ReportModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setReportReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg border border-white/[0.08] bg-white/[0.04] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Report Post</h3>
        <p className="mb-4 text-sm text-gray-400">
          Please select a reason for reporting this post. Our moderation team will review your
          report.
        </p>

        <select
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
        >
          {REPORT_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!reportReason || isReporting}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-600/50"
          >
            {isReporting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
