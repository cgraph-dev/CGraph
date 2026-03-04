/**
 * E2EE verification page component.
 * @module
 */
import { motion } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Share2,
  Info,
  Loader2,
  AlertTriangle,
  RefreshCcw,
  Lock,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { useE2EEVerification } from './hooks';
import { containerVariants, itemVariants } from './animations';

function SafetyNumberGrid({ rows }: { rows: string[][] }) {
  return (
    <div className="space-y-2 rounded-xl bg-dark-900/60 p-5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-3">
          {row.map((block, bi) => (
            <div
              key={bi}
              className="flex min-w-[70px] items-center justify-center rounded-lg bg-emerald-500/10 px-3 py-2"
            >
              <span className="font-mono text-base font-semibold tracking-widest text-emerald-400">
                {block}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function QRCodePlaceholder() {
  const gridSize = 8;
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const isCorner =
        (x < 2 && y < 2) || (x >= gridSize - 2 && y < 2) || (x < 2 && y >= gridSize - 2);
      const isMiddle = !isCorner && (x + y * gridSize) % 3 !== 0;
      if (isCorner || isMiddle) cells.push({ x, y });
    }
  }
  const cellPx = 20;
  const size = gridSize * cellPx;

  return (
    <div className="flex flex-col items-center rounded-xl bg-dark-900/40 p-6">
      <div className="relative rounded-lg bg-dark-800" style={{ width: size, height: size }}>
        {cells.map(({ x, y }) => (
          <div
            key={`${x}-${y}`}
            className="absolute rounded-sm bg-white"
            style={{
              left: x * cellPx,
              top: y * cellPx,
              width: cellPx - 2,
              height: cellPx - 2,
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs italic text-white/30">
        In production this would be a scannable QR code
      </p>
    </div>
  );
}

/**
 * E2 E E Verification Page — route-level page component.
 */
export default function E2EEVerificationPage() {
  const {
    safetyData,
    safetyNumberBlocks,
    isLoading,
    error,
    isVerifying,
    copiedField,
    toggleVerify,
    copyNumber,
    handleShare,
    formatDate,
    refetch,
  } = useE2EEVerification();

  if (isLoading) {
    return (
      <PageContainer title="Verify Security" subtitle="End-to-end encryption" maxWidth="lg">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="mt-3 text-sm text-white/40">Loading safety number…</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !safetyData) {
    return (
      <PageContainer title="Verify Security" subtitle="End-to-end encryption" maxWidth="lg">
        <div className="flex flex-col items-center justify-center py-24">
          <AlertTriangle className="h-12 w-12 text-red-400" />
          <p className="mt-3 text-base font-medium text-red-300">
            {error?.message || 'Unable to load'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/20 px-5 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Verify Security"
      subtitle="End-to-end encryption"
      maxWidth="lg"
      actions={
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      }
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* User card */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-4 rounded-xl bg-dark-800/50 p-5"
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              safetyData.isVerified ? 'bg-emerald-500/20' : 'bg-indigo-500/20'
            }`}
          >
            <Lock
              className={`h-7 w-7 ${safetyData.isVerified ? 'text-emerald-400' : 'text-indigo-400'}`}
            />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-white">User {safetyData.userId.slice(0, 8)}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {safetyData.isVerified ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Verified</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Not Verified</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Safety Number */}
        <motion.div variants={itemVariants}>
          <h2 className="mb-2 text-base font-semibold text-white">Safety Number</h2>
          <p className="mb-4 text-sm leading-relaxed text-white/40">
            Compare these numbers with the other user to verify the security of your end-to-end
            encrypted conversation. If they match, your messages are secure.
          </p>
          <SafetyNumberGrid rows={safetyNumberBlocks} />
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={copyNumber}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                copiedField === 'number'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-dark-700 text-white/60 hover:text-white'
              }`}
            >
              {copiedField === 'number' ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full bg-dark-700 px-5 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </motion.div>

        {/* QR Code */}
        <motion.div variants={itemVariants}>
          <h2 className="mb-2 text-base font-semibold text-white">QR Code</h2>
          <p className="mb-4 text-sm text-white/40">
            Scan this QR code with the other user's device to quickly verify keys match.
          </p>
          <QRCodePlaceholder />
        </motion.div>

        {/* Verify button */}
        <motion.div variants={itemVariants}>
          <button
            type="button"
            onClick={toggleVerify}
            disabled={isVerifying}
            className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-base font-semibold text-white transition-colors disabled:opacity-60 ${
              safetyData.isVerified
                ? 'bg-indigo-600 hover:bg-indigo-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isVerifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            {safetyData.isVerified ? 'Mark as Unverified' : 'Mark as Verified'}
          </button>
        </motion.div>

        {/* How to verify */}
        <motion.div variants={itemVariants} className="flex gap-3 rounded-xl bg-indigo-500/10 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
          <div>
            <p className="text-sm font-semibold text-white">How to verify</p>
            <ol className="mt-2 space-y-1 text-xs leading-relaxed text-white/40">
              <li>1. Meet the user in person or call them</li>
              <li>2. Compare the safety numbers shown on both screens</li>
              <li>3. If they match, tap "Mark as Verified"</li>
            </ol>
          </div>
        </motion.div>

        {/* Last updated */}
        <motion.p variants={itemVariants} className="text-center text-xs text-white/25">
          Key generated: {formatDate(safetyData.lastUpdated)}
        </motion.p>
      </motion.div>
    </PageContainer>
  );
}
