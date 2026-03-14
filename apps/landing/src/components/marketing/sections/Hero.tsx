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

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, useReducedMotion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { GradientText } from '../ui/GradientText';
import { LandingButton } from '../ui/LandingButton';
import { useCircuitCanvas } from './use-circuit-canvas';
import './Hero.css';
import { WEB_APP_URL } from '@/constants';

// Trust badges shown below the CTA
const trustBadges = [
  { label: 'E2E Encrypted' },
  { label: 'Sub-200ms Delivery' },
  { label: 'Zero-Knowledge' },
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
  'End-to-end encrypted messaging with post-quantum security.',
  'Real-time community forums with threads, voting, and moderation.',
  'Voice & video calls powered by WebRTC — sub-200ms.',
  '325 cosmetics, creator economy, and self-expression tools.',
  'Web3-ready authentication with wallet connect.',
] as const;

const Hero = memo(function Hero(): React.JSX.Element {
  const prefersReduced = useReducedMotion();
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const isVisibleRef = useRef(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  // Interactive mouse tracking for parallax background layers (skipped on touch)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (prefersReduced || isTouchDevice) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
      setMousePos(pos);
      mousePosRef.current = pos;
    },
    [prefersReduced, isTouchDevice]
  );

  // Scroll-linked parallax — bg drifts slower, content fades out
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Circuit network canvas animation (logo-style effects)
  useCircuitCanvas(canvasRef, mousePosRef, prefersReduced, isVisibleRef);

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

  // Pause video + canvas when hero is off-screen (IntersectionObserver)
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        isVisibleRef.current = visible;
        const video = videoRef.current;
        if (!video || prefersReduced) return;
        if (visible && !document.hidden) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [prefersReduced]);

  // Pause video when tab hidden or reduced motion preferred
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReduced) {
      video.pause();
      return;
    }
    const onVisibility = (): void => {
      if (document.hidden || !isVisibleRef.current) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [prefersReduced]);

  // Cycle subtitles every 4s
  useEffect(() => {
    if (prefersReduced) return;
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [prefersReduced]);

  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 100], [0.6, 0]);

  return (
    <section
      ref={heroRef}
      className="hero-pro"
      aria-label="CGraph — Beyond Messaging"
      onMouseMove={handleMouseMove}
    >
      {/* Background layers — AI-generated + interactive parallax */}
      <motion.div
        className="hero-pro__bg"
        aria-hidden="true"
        style={prefersReduced ? undefined : { y: bgY }}
      >
        {/* Video background — looping ambient footage */}
        <video
          ref={videoRef}
          className="hero-pro__video-bg"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/videos/hero-poster.webp"
          aria-hidden="true"
        >
          <source src="/videos/hero-bg.webm" type="video/webm" />
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Mouse-following radial glow */}
        <div
          className="hero-pro__cursor-glow"
          style={
            prefersReduced
              ? { display: 'none' }
              : {
                  background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(16, 185, 129, 0.12), rgba(139, 92, 246, 0.06) 40%, transparent 70%)`,
                }
          }
        />

        {/* Interactive circuit network canvas (logo-style) */}
        <canvas ref={canvasRef} className="hero-pro__circuit-canvas" aria-hidden="true" />

        {/* Bottom fade for smooth transition */}
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
          <GradientText
            variant="emerald-purple"
            animated
            as="span"
            className="hero-pro__title-accent"
          >
            Reimagined
          </GradientText>
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
          <LandingButton
            variant="primary"
            href={`${WEB_APP_URL}/register`}
            icon={
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
            }
          >
            Get Started Free
          </LandingButton>
          <LandingButton variant="secondary" href="#features">
            Explore Features
          </LandingButton>
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
              <span>{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      {/* Scroll indicator */}
      <motion.div
        className="hero-pro__scroll"
        aria-hidden="true"
        style={{ opacity: scrollOpacity }}
      >
        <div className="hero-pro__scroll-mouse">
          <div className="hero-pro__scroll-wheel" />
        </div>
        <div className="hero-pro__scroll-arrows">
          <span />
          <span />
          <span />
        </div>
        <span className="hero-pro__scroll-text">Scroll to explore</span>
      </motion.div>
    </section>
  );
});

export default Hero;
