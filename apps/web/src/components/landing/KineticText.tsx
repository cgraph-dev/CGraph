/**
 * KineticText Component - Animated typography with word-by-word reveal
 *
 * Features:
 * - Word-by-word staggered reveal animation
 * - Character-level animations for extra impact
 * - Gradient animated text support
 * - Respects reduced motion preferences
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type KineticTextAnimation = 'words' | 'characters' | 'lines' | 'gradient';
type KineticTextAs = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';

interface KineticTextProps {
  /** Text content to animate */
  text: string;
  /** Animation style */
  animation?: KineticTextAnimation;
  /** HTML element to render as */
  as?: KineticTextAs;
  /** Stagger delay between elements (seconds) */
  stagger?: number;
  /** Initial delay before animation starts (seconds) */
  delay?: number;
  /** Enable gradient text effect */
  gradient?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const wordVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    rotateX: -90,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
  },
};

const characterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

const lineVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -50,
    skewX: -5,
  },
  visible: {
    opacity: 1,
    x: 0,
    skewX: 0,
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const AnimatedWord = memo(function AnimatedWord({
  word,
  index,
  stagger,
  delay,
}: {
  word: string;
  index: number;
  stagger: number;
  delay: number;
}) {
  return (
    <motion.span
      className="mr-[0.25em] inline-block"
      variants={wordVariants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: delay + index * stagger,
        type: 'spring',
        stiffness: 100,
        damping: 10,
      }}
    >
      {word}
    </motion.span>
  );
});

const AnimatedCharacter = memo(function AnimatedCharacter({
  char,
  index,
  stagger,
  delay,
}: {
  char: string;
  index: number;
  stagger: number;
  delay: number;
}) {
  // Preserve spaces
  if (char === ' ') {
    return <span className="inline-block w-[0.25em]" />;
  }

  return (
    <motion.span
      className="inline-block"
      variants={characterVariants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: delay + index * stagger,
        type: 'spring',
        stiffness: 150,
        damping: 12,
      }}
    >
      {char}
    </motion.span>
  );
});

const AnimatedLine = memo(function AnimatedLine({
  line,
  index,
  stagger,
  delay,
}: {
  line: string;
  index: number;
  stagger: number;
  delay: number;
}) {
  return (
    <motion.span
      className="block"
      variants={lineVariants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: delay + index * stagger,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {line}
    </motion.span>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const KineticText = memo(function KineticText({
  text,
  animation = 'words',
  as: Component = 'h1',
  stagger = 0.1,
  delay = 0,
  gradient = false,
  className,
}: KineticTextProps) {
  const prefersReducedMotion = useReducedMotion();

  // Split text based on animation type
  const elements = useMemo(() => {
    switch (animation) {
      case 'words':
        return text.split(' ');
      case 'characters':
        return text.split('');
      case 'lines':
        return text.split('\n');
      default:
        return [text];
    }
  }, [text, animation]);

  // Static rendering for reduced motion
  if (prefersReducedMotion) {
    return (
      <Component className={cn(gradient && 'gradient-text-animated', className)}>{text}</Component>
    );
  }

  // Gradient animation doesn't split text
  if (animation === 'gradient') {
    return <Component className={cn('gradient-text-animated', className)}>{text}</Component>;
  }

  // Render based on animation type
  const renderContent = () => {
    switch (animation) {
      case 'words':
        return elements.map((word, i) => (
          <AnimatedWord
            key={`${word}-${i}`}
            word={word}
            index={i}
            stagger={stagger}
            delay={delay}
          />
        ));

      case 'characters':
        return elements.map((char, i) => (
          <AnimatedCharacter
            key={`${char}-${i}`}
            char={char}
            index={i}
            stagger={stagger * 0.5}
            delay={delay}
          />
        ));

      case 'lines':
        return elements.map((line, i) => (
          <AnimatedLine
            key={`${line}-${i}`}
            line={line}
            index={i}
            stagger={stagger * 2}
            delay={delay}
          />
        ));

      default:
        return text;
    }
  };

  return (
    <Component className={cn('perspective-1000', gradient && 'gradient-text-animated', className)}>
      {renderContent()}
    </Component>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { KineticTextProps, KineticTextAnimation, KineticTextAs };
