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

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

const Hero = memo(function Hero(): React.JSX.Element {
  const prefersReduced = useReducedMotion();

  return (
    <section className="hero-pro" aria-label="CGraph — Beyond Messaging">
      {/* Background layers */}
      <div className="hero-pro__bg" aria-hidden="true">
        {/* Base gradient */}
        <div className="hero-pro__gradient-base" />

        {/* Animated gradient mesh */}
        <div className="hero-pro__mesh" />

        {/* Floating glow orbs */}
        <div className="hero-pro__orb hero-pro__orb--emerald" />
        <div className="hero-pro__orb hero-pro__orb--purple" />
        <div className="hero-pro__orb hero-pro__orb--cyan" />

        {/* Dot grid */}
        <div className="hero-pro__grid" />

        {/* Noise texture overlay */}
        <div className="hero-pro__noise" />

        {/* Bottom fade */}
        <div className="hero-pro__fade" />
      </div>

      {/* Content */}
      <motion.div
        className="hero-pro__content"
        variants={prefersReduced ? undefined : containerVariants}
        initial={prefersReduced ? 'visible' : 'hidden'}
        animate="visible"
      >
        {/* Eyebrow badge */}
        <motion.div variants={itemVariants} className="hero-pro__eyebrow-wrap">
          <motion.span
            className="hero-pro__eyebrow"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: 'spring' as const,
              stiffness: 200,
              damping: 15,
              delay: 0.3,
            }}
          >
            <motion.span
              className="hero-pro__eyebrow-dot"
              aria-hidden="true"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            Secure messaging for communities
          </motion.span>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={itemVariants} className="hero-pro__title">
          <span className="hero-pro__title-line">Communication</span>
          <span className="hero-pro__title-accent">Reimagined</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants} className="hero-pro__subtitle">
          End-to-end encrypted messaging, community forums, and real-time collaboration — all in one
          platform built for privacy.
        </motion.p>

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
          {trustBadges.map((badge) => (
            <div key={badge.label} className="hero-pro__badge">
              <span aria-hidden="true">{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Product Preview */}
        <motion.div
          className="hero-pro__preview"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.9,
            delay: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <div className="hero-pro__preview-glow" />
          <div className="hero-pro__preview-window">
            {/* Window chrome */}
            <div className="hero-pro__preview-chrome">
              <div className="hero-pro__preview-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="hero-pro__preview-url">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                web.cgraph.org
              </div>
            </div>
            {/* App mockup content */}
            <div className="hero-pro__preview-body">
              {/* Sidebar */}
              <div className="hero-pro__mock-sidebar">
                <div className="hero-pro__mock-logo" />
                <div className="hero-pro__mock-channels">
                  <div className="hero-pro__mock-channel hero-pro__mock-channel--active" />
                  <div className="hero-pro__mock-channel" />
                  <div className="hero-pro__mock-channel" />
                  <div className="hero-pro__mock-channel" />
                  <div className="hero-pro__mock-channel" />
                </div>
              </div>
              {/* Chat area */}
              <div className="hero-pro__mock-chat">
                <div className="hero-pro__mock-header" />
                <div className="hero-pro__mock-messages">
                  <div className="hero-pro__mock-msg hero-pro__mock-msg--left">
                    <div className="hero-pro__mock-avatar" />
                    <div className="hero-pro__mock-bubble">
                      <div className="hero-pro__mock-text hero-pro__mock-text--short" />
                      <div className="hero-pro__mock-text hero-pro__mock-text--long" />
                    </div>
                  </div>
                  <div className="hero-pro__mock-msg hero-pro__mock-msg--right">
                    <div className="hero-pro__mock-bubble hero-pro__mock-bubble--self">
                      <div className="hero-pro__mock-text hero-pro__mock-text--med" />
                    </div>
                  </div>
                  <div className="hero-pro__mock-msg hero-pro__mock-msg--left">
                    <div className="hero-pro__mock-avatar" />
                    <div className="hero-pro__mock-bubble">
                      <div className="hero-pro__mock-text hero-pro__mock-text--med" />
                      <div className="hero-pro__mock-text hero-pro__mock-text--short" />
                    </div>
                  </div>
                  <div className="hero-pro__mock-msg hero-pro__mock-msg--right">
                    <div className="hero-pro__mock-bubble hero-pro__mock-bubble--self">
                      <div className="hero-pro__mock-text hero-pro__mock-text--long" />
                    </div>
                  </div>
                </div>
                <div className="hero-pro__mock-input">
                  <div className="hero-pro__mock-input-bar" />
                </div>
              </div>
            </div>
          </div>
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
