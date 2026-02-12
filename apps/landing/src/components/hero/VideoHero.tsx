/**
 * VideoHero Component
 *
 * Professional hero section with cinematic video background.
 * Follows Discord/Google landing page patterns:
 * - Video background with dark overlay for text contrast
 * - Staggered text entrance animations (Framer Motion)
 * - Mobile-first responsive design
 * - Poster image fallback for mobile (saves bandwidth)
 * - prefers-reduced-motion respected
 *
 * Video spec: dark abstract circuit/mesh animation with emerald/cyan accents,
 * 10-15s loop, <3MB .webm + .mp4 fallback. Place in public/videos/.
 *
 * @since v2.1.0
 */

import { useRef, useEffect, useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './video-hero.css';

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
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

const VideoHero = memo(function VideoHero(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const prefersReduced = useReducedMotion();

  // Only autoplay video on desktop
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (videoRef.current && isDesktop && !prefersReduced) {
      videoRef.current.play().catch(() => {
        // Video autoplay blocked — poster image shows instead
      });
    }
  }, [prefersReduced]);

  return (
    <section className="video-hero" aria-label="CGraph — Beyond Messaging">
      {/* Video Background */}
      <div className="video-hero__bg" aria-hidden="true">
        {/* Fallback animated gradient (shows before/instead of video) */}
        <div className="video-hero__gradient" />

        {/* Video element — only loads on desktop */}
        <video
          ref={videoRef}
          className={`video-hero__video ${videoLoaded ? 'video-hero__video--loaded' : ''}`}
          muted
          loop
          playsInline
          preload="none"
          poster="/videos/hero-poster.webp"
          onCanPlayThrough={() => setVideoLoaded(true)}
        >
          <source src="/videos/hero-bg.webm" type="video/webm" />
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for text contrast */}
        <div className="video-hero__overlay" />

        {/* Grid texture */}
        <div className="video-hero__grid" />

        {/* Bottom fade to merge with next section */}
        <div className="video-hero__fade" />
      </div>

      {/* Content */}
      <motion.div
        className="video-hero__content"
        variants={prefersReduced ? undefined : containerVariants}
        initial={prefersReduced ? 'visible' : 'hidden'}
        animate="visible"
      >
        {/* Eyebrow badge */}
        <motion.div variants={itemVariants} className="video-hero__eyebrow-wrap">
          <motion.span
            className="video-hero__eyebrow"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              type: 'spring' as const,
              stiffness: 200,
              damping: 15,
            }}
          >
            <motion.span
              className="video-hero__eyebrow-dot"
              aria-hidden="true"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            Secure messaging for communities
          </motion.span>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={itemVariants} className="video-hero__title">
          <span className="video-hero__title-line">Communication</span>
          <span className="video-hero__title-accent">Reimagined</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants} className="video-hero__subtitle">
          End-to-end encrypted messaging, community forums, and real-time collaboration — all in one
          platform built for privacy.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="video-hero__actions">
          <a href={`${WEB_APP_URL}/register`} className="video-hero__btn video-hero__btn--primary">
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
          <a href="#features" className="video-hero__btn video-hero__btn--secondary">
            Explore Features
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div variants={itemVariants} className="video-hero__trust">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="video-hero__badge">
              <span aria-hidden="true">{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator — desktop only */}
      <div className="video-hero__scroll" aria-hidden="true">
        <span className="video-hero__scroll-text">Scroll</span>
        <div className="video-hero__scroll-line">
          <span className="video-hero__scroll-dot" />
        </div>
      </div>
    </section>
  );
});

export default VideoHero;
