/**
 * Hero Component
 *
 * Professional hero section following modern SaaS patterns (Linear, Vercel, Notion).
 * Features:
 * - Animated gradient mesh background with floating glow orbs
 * - Subtle dot grid overlay
 * - Staggered Framer Motion entrance animations
 * - Product preview mockup
 * - prefers-reduced-motion respected
 *
 * @since v2.2.0
 */

import { memo, useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import './hero.css';

const WEB_APP_URL = 'https://web.cgraph.org';

// Trust badges shown below the CTA
const trustBadges = [
  { icon: '🔐', label: 'E2E Encrypted' },
  { icon: '⚡', label: 'Sub-200ms Delivery' },
  { icon: '🌐', label: 'Open Platform' },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

// Cycling subtitles — showcases different product features
const subtitles = [
  'End-to-end encrypted messaging with Signal-level security.',
  'Real-time community forums with gamification & XP.',
  'Voice & video calls powered by WebRTC — sub-200ms.',
  'Custom themes, achievements, and subscription tiers.',
  'Web3-ready authentication with wallet connect.',
] as const;

const Hero = memo(function Hero(): React.JSX.Element {
  const prefersReduced = useReducedMotion();
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // Scroll-linked parallax — bg drifts slower, content fades out
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

  // Cycle subtitles every 4s
  useEffect(() => {
    if (prefersReduced) return;
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [prefersReduced]);

  return (
    <section ref={heroRef} className="hero-pro" aria-label="CGraph — Beyond Messaging">
      {/* Background layers — parallax drift on scroll */}
      <motion.div
        className="hero-pro__bg"
        aria-hidden="true"
        style={prefersReduced ? undefined : { y: bgY }}
      >
        {/* Base gradient */}
        <div className="hero-pro__gradient-base" />

        {/* Animated gradient mesh */}
        <div className="hero-pro__mesh" />

        {/* Floating glow orbs */}
        <div className="hero-pro__orb hero-pro__orb--emerald" />
        <div className="hero-pro__orb hero-pro__orb--purple" />
        <div className="hero-pro__orb hero-pro__orb--cyan" />

        {/* Floating particles */}
        <div className="hero-pro__particles" />

        {/* Subtle scan lines */}
        <div className="hero-pro__scanlines" />

        {/* Dot grid */}
        <div className="hero-pro__grid" />

        {/* Noise texture overlay */}
        <div className="hero-pro__noise" />

        {/* Bottom fade */}
        <div className="hero-pro__fade" />
      </motion.div>

      {/* Content — fades out on scroll */}
      <motion.div
        className="hero-pro__content"
        variants={prefersReduced ? undefined : containerVariants}
        initial={prefersReduced ? 'visible' : 'hidden'}
        animate="visible"
        style={prefersReduced ? undefined : { opacity: contentOpacity, y: contentY }}
      >
        {/* Title */}
        <motion.h1 variants={itemVariants} className="hero-pro__title">
          <span className="hero-pro__title-line">Communication</span>
          <span className="hero-pro__title-accent">Reimagined</span>
        </motion.h1>

        {/* Cycling Subtitle */}
        <motion.div variants={itemVariants} className="hero-pro__subtitle-wrap">
          <AnimatePresence mode="wait">
            <motion.p
              key={subtitleIndex}
              className="hero-pro__subtitle"
              initial={prefersReduced ? {} : { opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.5 }}
            >
              {subtitles[subtitleIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="hero-pro__actions">
          <a href={`${WEB_APP_URL}/register`} className="hero-pro__btn hero-pro__btn--primary">
            Get Started Free
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
          <a href="#features" className="hero-pro__btn hero-pro__btn--secondary">
            Explore Features
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div variants={itemVariants} className="hero-pro__trust">
          {trustBadges.map((badge, i) => (
            <motion.div
              key={badge.label}
              className="hero-pro__badge"
              initial={prefersReduced ? {} : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1.2 + i * 0.15,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              whileHover={{ scale: 1.1, y: -2 }}
            >
              <span aria-hidden="true">{badge.icon}</span>
              <span>{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="hero-pro__scroll" aria-hidden="true">
        <span className="hero-pro__scroll-text">Scroll</span>
        <div className="hero-pro__scroll-line">
          <span className="hero-pro__scroll-dot" />
        </div>
      </div>
    </section>
  );
});

export default Hero;
