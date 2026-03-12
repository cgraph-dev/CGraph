/**
 * FileUnlockModal
 *
 * Confirmation dialog shown before purchasing a paid file.
 * Displays file info, price, current balance, and warnings.
 *
 * @module modules/paid-dm/components/file-unlock-modal
 */

import { useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

interface FileInfo {
  fileName: string;
  fileType: string;
  price: number;
}

interface FileUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileInfo;
  userBalance: number;
  onConfirm: () => void;
}

// ── Component ──────────────────────────────────────────────────────────

export function FileUnlockModal({
  isOpen,
  onClose,
  file,
  userBalance,
  onConfirm,
}: FileUnlockModalProps) {
  const insufficientBalance = userBalance < file.price;

  const handleConfirm = useCallback(() => {
    if (!insufficientBalance) onConfirm();
  }, [insufficientBalance, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Unlock File</h2>

        {/* File info */}
        <div className="mb-4 space-y-2 rounded-lg bg-muted p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">File</span>
            <span className="truncate pl-4 font-medium">{file.fileName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="capitalize">{file.fileType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold text-primary">{file.price} Nodes</span>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-4 flex justify-between text-sm">
          <span className="text-muted-foreground">Your Balance</span>
          <span className="font-medium">{userBalance} Nodes</span>
        </div>

        {/* Insufficient balance warning */}
        {insufficientBalance && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Insufficient balance. You need {file.price - userBalance} more Nodes.
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={insufficientBalance}
            onClick={handleConfirm}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Confirm Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
