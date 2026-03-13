/**
 * Tip button — small inline button that opens the tip modal.
 */
import { useState } from 'react';
import { TipModal } from './tip-modal';

interface TipButtonProps {
  recipientId: string;
  recipientName: string;
  className?: string;
}

/** Description. */
/** Tip Button component. */
export function TipButton({ recipientId, recipientName, className }: TipButtonProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowTip(true)}
        className={
          className ??
          'rounded-md px-2 py-1 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/10 hover:text-purple-300'
        }
        title={`Tip @${recipientName}`}
      >
        {'\u2115'} Tip
      </button>

      <TipModal
        recipientId={recipientId}
        recipientName={recipientName}
        isOpen={showTip}
        onClose={() => setShowTip(false)}
      />
    </>
  );
}
