/**
 * E2EE key verification page component.
 * @module
 */
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Share2,
  QrCode,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { useKeyVerification } from './hooks';

export default function KeyVerificationPage() {
  const {
    username,
    formattedNumber,
    isVerified,
    isLoading,
    error,
    isVerifying,
    showQR,
    setShowQR,
    copiedField,
    markVerified,
    copyNumber,
    shareNumber,
    refetch,
  } = useKeyVerification();

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <PageContainer title="Verify Security" subtitle={`with ${username}`} maxWidth="md">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="mt-3 text-sm text-white/40">Loading security info…</p>
        </div>
      </PageContainer>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <PageContainer title="Verify Security" subtitle={`with ${username}`} maxWidth="md">
        <div className="flex flex-col items-center justify-center py-24">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
          <p className="mt-3 text-base font-medium text-white/70">Verification Unavailable</p>
          <p className="mt-1 text-sm text-white/40">{error.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-500/20 px-5 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-500/30"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Verify Security" subtitle={`with ${username}`} maxWidth="md">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header icon + verified badge */}
        <div className="flex flex-col items-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isVerified ? 'bg-emerald-500/20' : 'bg-indigo-500/20'
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            ) : (
              <Shield className="h-8 w-8 text-indigo-400" />
            )}
          </div>
          {isVerified && (
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-1.5">
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Verified</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="rounded-xl bg-dark-800/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white/80">How to verify:</h3>
          <div className="space-y-2">
            {[
              `Compare the safety number below with ${username}'s number`,
              'Do this in person, via video call, or another trusted channel',
              'If they match, tap "Mark as Verified"',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-white/50">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Number */}
        <div className="rounded-xl bg-dark-800/50 p-6 text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Safety Number
          </p>
          <p className="select-all font-mono text-lg font-semibold tracking-[0.2em] text-white/80">
            {formattedNumber}
          </p>
        </div>

        {/* QR Toggle */}
        <button
          type="button"
          onClick={() => setShowQR(!showQR)}
          className="mx-auto flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          {showQR ? <ChevronUp className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>

        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center rounded-xl bg-dark-800/50 p-6"
          >
            {/* Placeholder QR grid */}
            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-white">
              <QrCode className="h-24 w-24 text-gray-800" />
            </div>
            <p className="mt-3 text-xs text-white/30">Scan with CGraph app to verify instantly</p>
          </motion.div>
        )}

        {/* Action buttons row */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={copyNumber}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
              copiedField === 'number'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-dark-600 bg-dark-800/50 text-white/60 hover:text-white'
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
                Copy Number
              </>
            )}
          </button>
          <button
            type="button"
            onClick={shareNumber}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dark-600 bg-dark-800/50 py-3 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Verify button */}
        {!isVerified && (
          <button
            type="button"
            onClick={markVerified}
            disabled={isVerifying}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
          >
            {isVerifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
            Mark as Verified
          </button>
        )}

        {/* Warning */}
        <div className="flex gap-3 rounded-xl bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-300/70">
            If the numbers don't match, your messages may be intercepted. Do not verify until you've
            confirmed they match.
          </p>
        </div>
      </motion.div>
    </PageContainer>
  );
}
