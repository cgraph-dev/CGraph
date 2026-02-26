/**
 * UploadProgressRing — animated SVG circular progress indicator
 * for file uploads, with completion bounce.
 *
 * @module components/ui
 */

import { motion } from 'framer-motion';
import { tweens, springs } from '@/lib/animation-presets';

export interface UploadProgressRingProps {
  /** Upload progress 0–100 */
  progress: number;
  /** Ring size in px (default 48) */
  size?: number;
  /** Stroke width (default 3) */
  strokeWidth?: number;
  /** Whether upload is complete */
  complete?: boolean;
  /** Optional cancel callback (shows X button inside ring) */
  onCancel?: () => void;
  /** Content rendered inside the ring (e.g. file icon) */
  children?: React.ReactNode;
}

/**
 * unknown for the ui module.
 */
/**
 * Upload Progress Ring component.
 */
export function UploadProgressRing({
  progress,
  size = 48,
  strokeWidth = 3,
  complete = false,
  onCancel,
  children,
}: UploadProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 100) / 100);

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={complete ? { scale: [1, 1.15, 1] } : undefined}
      transition={complete ? springs.bouncy : undefined}
    >
      {/* Background track */}
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-dark-600/40"
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={complete ? '#10b981' : '#6366f1'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={tweens.standard}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
      </svg>

      {/* Center content */}
      <div className="relative z-10 flex items-center justify-center">
        {complete ? (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springs.bouncy}
            className="h-4 w-4 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : onCancel ? (
          <button
            onClick={onCancel}
            className="flex items-center justify-center text-gray-400 hover:text-white"
            aria-label="Cancel upload"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          children ?? (
            <span className="text-[10px] font-semibold text-gray-300">
              {Math.round(progress)}%
            </span>
          )
        )}
      </div>
    </motion.div>
  );
}

export default UploadProgressRing;
