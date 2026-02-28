/**
 * SafetyNumberDialog Component
 *
 * Modal dialog displaying the safety number for verifying end-to-end encryption
 * with a contact. Shows a 60-digit safety number in Signal's 4×3 grid format
 * plus a QR code for cross-device verification.
 *
 * @module modules/chat/components/safety-number-dialog
 */

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SafetyNumberDialogProps {
  recipientId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VerificationState {
  safetyNumber: string | null;
  isVerified: boolean;
  loading: boolean;
  verifying: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a 60-digit safety number into 12 groups of 5 digits.
 * Returns an array of 12 groups for grid layout.
 */
function splitSafetyNumber(number: string): string[] {
  return number.match(/.{1,5}/g) ?? [];
}

/**
 * Generate QR code payload encoding the safety number.
 */
function buildQRPayload(userId: string, safetyNumber: string): string {
  return JSON.stringify({
    version: 1,
    type: 'cgraph-verify',
    userId,
    safetyNumber,
    timestamp: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Safety number verification dialog for web.
 */
export function SafetyNumberDialog({
  recipientId,
  recipientName,
  isOpen,
  onClose,
}: SafetyNumberDialogProps) {
  const [state, setState] = useState<VerificationState>({
    safetyNumber: null,
    isVerified: false,
    loading: true,
    verifying: false,
    error: null,
  });

  // Fetch safety number when dialog opens
  const fetchSafetyNumber = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));

      const response = await api.get(`/api/v1/e2ee/safety-number/${recipientId}`);
      const safetyNumber: string = response.data.data?.safety_number ?? response.data.safety_number;

      // Check if already verified
      let isVerified = false;
      try {
        const verifyRes = await api.get(`/api/v1/e2ee/keys/${recipientId}/verification-status`);
        isVerified = verifyRes.data.data?.verified ?? false;
      } catch {
        // Endpoint may not exist yet — treat as unverified
      }

      setState({ safetyNumber, isVerified, loading: false, verifying: false, error: null });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load safety number';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [recipientId]);

  useEffect(() => {
    if (isOpen) {
      fetchSafetyNumber();
    }
  }, [isOpen, fetchSafetyNumber]);

  // Mark key as verified
  const handleMarkVerified = async () => {
    try {
      setState((s) => ({ ...s, verifying: true, error: null }));
      await api.post(`/api/v1/e2ee/keys/${recipientId}/verify`);
      setState((s) => ({ ...s, isVerified: true, verifying: false }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to mark as verified';
      setState((s) => ({ ...s, verifying: false, error: message }));
    }
  };

  const groups = state.safetyNumber ? splitSafetyNumber(state.safetyNumber) : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheckIcon
              className={`h-6 w-6 ${state.isVerified ? 'text-green-400' : 'text-primary-400'}`}
            />
            Verify Security with {recipientName}
          </DialogTitle>
          <DialogDescription>
            Compare the safety number below with your contact&apos;s screen to verify
            end-to-end encryption.
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {state.loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
          </div>
        )}

        {/* Error state */}
        {!state.loading && state.error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <ExclamationTriangleIcon className="h-10 w-10 text-yellow-400" />
            <p className="text-sm text-textMuted">{state.error}</p>
            <button
              onClick={fetchSafetyNumber}
              className="rounded-lg bg-surfaceHover px-4 py-2 text-sm font-medium text-textPrimary hover:bg-surfaceHover/80"
            >
              Retry
            </button>
          </div>
        )}

        {/* Safety number content */}
        {!state.loading && !state.error && state.safetyNumber && (
          <div className="space-y-5">
            {/* Verified badge */}
            {state.isVerified && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium text-green-400">Identity Verified</span>
              </div>
            )}

            {/* 4×3 grid of 5-digit groups */}
            <div className="rounded-lg border border-surfaceBorder bg-surface/50 p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-textMuted">Safety Number</p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-center font-mono text-base tracking-widest text-textPrimary">
                {groups.map((group, i) => (
                  <span key={i} className="select-all">
                    {group}
                  </span>
                ))}
              </div>
            </div>

            {/* QR code */}
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg border border-surfaceBorder bg-white p-3">
                <QRCodeSVG
                  value={buildQRPayload(recipientId, state.safetyNumber)}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
              <p className="max-w-xs text-center text-xs text-textMuted">
                Ask your contact to scan this code, or compare the numbers above
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {!state.loading && !state.error && (
          <DialogFooter>
            <button
              onClick={onClose}
              className="rounded-lg border border-surfaceBorder px-4 py-2 text-sm font-medium text-textPrimary hover:bg-surfaceHover"
            >
              Close
            </button>
            {!state.isVerified && (
              <button
                onClick={handleMarkVerified}
                disabled={state.verifying}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
              >
                {state.verifying ? 'Verifying…' : 'Mark as Verified'}
              </button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SafetyNumberDialog;
