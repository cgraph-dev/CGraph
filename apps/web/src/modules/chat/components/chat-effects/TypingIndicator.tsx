/**
 * TypingIndicator - Animated typing indicators with multiple styles
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TypingIndicatorProps } from './types';
import { TYPING_SPEED_MAP, TYPING_SIZE_MAP } from './constants';

const DotIndicator = ({ duration, size }: { duration: number; size: number }) => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="rounded-full bg-current"
        style={{ width: size, height: size }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{
          duration,
          repeat: Infinity,
          delay: i * (duration / 3),
        }}
      />
    ))}
  </div>
);

const WaveIndicator = ({ duration, size }: { duration: number; size: number }) => (
  <div className="flex items-end gap-0.5">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="rounded-sm bg-current"
        style={{ width: size / 2, height: size }}
        animate={{ height: [size / 2, size, size / 2] }}
        transition={{
          duration,
          repeat: Infinity,
          delay: i * (duration / 5),
        }}
      />
    ))}
  </div>
);

const BounceIndicator = ({ duration, size }: { duration: number; size: number }) => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="rounded-full bg-current"
        style={{ width: size, height: size }}
        animate={{ y: [0, -size / 2, 0] }}
        transition={{
          duration,
          repeat: Infinity,
          delay: i * (duration / 3),
          type: 'spring',
          stiffness: 300,
        }}
      />
    ))}
  </div>
);

const PulseIndicator = ({ duration, size }: { duration: number; size: number }) => (
  <motion.div
    className="rounded-full bg-current"
    style={{ width: size * 2, height: size * 2 }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
    transition={{ duration, repeat: Infinity }}
  />
);

const TypingTextIndicator = ({ duration }: { duration: number }) => (
  <motion.span
    className="font-mono text-sm"
    animate={{ opacity: [0, 1] }}
    transition={{ duration: duration / 2, repeat: Infinity, repeatType: 'reverse' }}
  >
    typing...
  </motion.span>
);

const PencilIndicator = ({ duration, size }: { duration: number; size: number }) => (
  <motion.div
    className="flex items-center gap-1"
    animate={{ x: [0, 5, 0] }}
    transition={{ duration, repeat: Infinity }}
  >
    <span style={{ fontSize: size * 1.5 }}>✏️</span>
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full bg-current"
          style={{ width: size / 3, height: size / 3 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: duration / 2,
            repeat: Infinity,
            delay: i * (duration / 6),
          }}
        />
      ))}
    </div>
  </motion.div>
);

const SpeechBubbleIndicator = ({ duration, size }: { duration: number; size: number }) => (
  <motion.div
    className="bg-current/20 relative flex items-center justify-center rounded-full"
    style={{ width: size * 3, height: size * 2 }}
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration, repeat: Infinity }}
  >
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full bg-current"
          style={{ width: size / 2, height: size / 2 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: duration / 2,
            repeat: Infinity,
            delay: i * (duration / 6),
          }}
        />
      ))}
    </div>
  </motion.div>
);

const SpinnerIndicator = ({ duration, size }: { duration: number; size: number }) => (
  <motion.div
    className="rounded-full border-2 border-current border-t-transparent"
    style={{ width: size * 2, height: size * 2 }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: 'linear' }}
  />
);

export const TypingIndicator = memo(function TypingIndicator({
  style = 'dots',
  speed = 'normal',
  size = 'medium',
  color,
  className = '',
}: TypingIndicatorProps) {
  const duration = TYPING_SPEED_MAP[speed];
  const dotSize = TYPING_SIZE_MAP[size];

  const indicator = useMemo(() => {
    switch (style) {
      case 'dots':
        return <DotIndicator duration={duration} size={dotSize} />;
      case 'wave':
        return <WaveIndicator duration={duration} size={dotSize} />;
      case 'bounce':
        return <BounceIndicator duration={duration} size={dotSize} />;
      case 'pulse':
        return <PulseIndicator duration={duration} size={dotSize} />;
      case 'typing-text':
        return <TypingTextIndicator duration={duration} />;
      case 'pencil':
        return <PencilIndicator duration={duration} size={dotSize} />;
      case 'speech-bubble':
        return <SpeechBubbleIndicator duration={duration} size={dotSize} />;
      case 'spinner':
        return <SpinnerIndicator duration={duration} size={dotSize} />;
      default:
        return <DotIndicator duration={duration} size={dotSize} />;
    }
  }, [style, duration, dotSize]);

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ color: color ?? 'currentColor' }}
    >
      {indicator}
    </div>
  );
});
