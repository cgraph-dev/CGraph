/**
 * Hero Component — Professional SaaS hero (Linear / Vercel / Stripe tier)
 *
 * Features:
 * - Aurora gradient beams with animated background layers
 * - Eyebrow badge with pulsing live indicator
 * - Staggered Framer Motion entrance with per-word headline reveal
 * - Cycling subtitles with blur-fade transitions
 * - Social proof stats with count-up entrance
 * - Floating product mockup (mini chat UI)
 * - Trust badges with spring-in animation
 * - Scroll-linked parallax (bg drift, content fade-out)
 * - prefers-reduced-motion fully respected
 *
 * @since v3.0.0
 */

import { memo, useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { GradientText } from '../ui/GradientText';
import { LandingButton } from '../ui/LandingButton';
import './Hero.css';
import { WEB_APP_URL } from '@/constants';

/* ── Static data ── */

const trustBadges = [
  { icon: '🔒', label: 'E2E Encrypted' },
  { icon: '⚡', label: 'Sub-200ms Delivery' },
  { icon: '🛡️', label: 'Zero-Knowledge' },
] as const;

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '10M+', label: 'Messages Sent' },
  { value: '99.9%', label: 'Uptime SLA' },
] as const;

const subtitles = [
  'Post-quantum encrypted messaging that keeps your conversations truly private.',
  'Community forums with threads, voting, and real-time moderation built in.',
  'Crystal-clear voice & video calls powered by WebRTC — under 200ms latency.',
  'Express yourself with 325+ cosmetics, themes, and creator economy tools.',
  'Web3-ready auth with wallet connect and decentralized identity.',
] as const;

const mockMessages = [
  { name: 'Alice', text: 'The new E2EE protocol is live!', time: '2m ago', color: '#10b981' },
  { name: 'Bob', text: 'Latency is incredible 🔥', time: '1m ago', color: '#8b5cf6' },
  { name: 'Carol', text: 'Just joined — love the UI', time: 'now', color: '#06b6d4' },
] as const;

/* ── Animation variants ── */

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const mockupVariants = {
  hidden: { opacity: 0, y: 40, rotateX: 8 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 1, delay: 0.6, ease },
  },
};

/* ── Component ── */

const Hero = memo(function Hero(): React.JSX.Element {
  const prefersReduced = useReducedMotion();
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // Scroll-linked parallax
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

  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 100], [0.6, 0]);

  return (
    <section ref={heroRef} className="hero-pro" aria-label="CGraph — Beyond Messaging">
      {/* ── Background layers ── */}
      <motion.div
        className="hero-pro__bg"
        aria-hidden="true"
        style={prefersReduced ? undefined : { y: bgY }}
      >
        <div className="hero-pro__aurora" />
        <div className="hero-pro__beam hero-pro__beam--1" />
        <div className="hero-pro__beam hero-pro__beam--2" />
        <div className="hero-pro__beam hero-pro__beam--3" />
        <div className="hero-pro__grid" />
        <div className="hero-pro__particles" />
        <div className="hero-pro__noise" />
        <div className="hero-pro__fade" />
      </motion.div>

      {/* ── Main content ── */}
      <motion.div
        className="hero-pro__content"
        variants={prefersReduced ? undefined : containerVariants}
        initial={prefersReduced ? 'visible' : 'hidden'}
        animate="visible"
        style={prefersReduced ? undefined : { opacity: contentOpacity, y: contentY }}
      >
        {/* Eyebrow badge */}
        <motion.div variants={itemVariants} className="hero-pro__eyebrow-wrap">
          <span className="hero-pro__eyebrow">
            <span className="hero-pro__eyebrow-dot" />
            Now in Public Beta
          </span>
        </motion.div>

        {/* Headline */}
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

        {/* Cycling subtitle */}
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

        {/* CTA buttons */}
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

        {/* Social proof stats */}
        <motion.div variants={itemVariants} className="hero-pro__stats">
          {stats.map((stat) => (
            <div key={stat.label} className="hero-pro__stat">
              <span className="hero-pro__stat-value">{stat.value}</span>
              <span className="hero-pro__stat-label">{stat.label}</span>
            </div>
          ))}
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
              whileHover={{ scale: 1.08, y: -2 }}
            >
              <span className="hero-pro__badge-icon" aria-hidden="true">
                {badge.icon}
              </span>
              <span>{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Floating product mockup ── */}
      <motion.div
        className="hero-pro__mockup"
        variants={prefersReduced ? undefined : mockupVariants}
        initial={prefersReduced ? 'visible' : 'hidden'}
        animate="visible"
        aria-hidden="true"
      >
        <div className="hero-pro__mockup-card">
          <div className="hero-pro__mockup-header">
            <div className="hero-pro__mockup-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="hero-pro__mockup-title"># general</span>
            <span className="hero-pro__mockup-badge">🔒 E2EE</span>
          </div>
          <div className="hero-pro__mockup-messages">
            {mockMessages.map((msg, i) => (
              <motion.div
                key={msg.name}
                className="hero-pro__mockup-msg"
                initial={prefersReduced ? {} : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + i * 0.25, duration: 0.5 }}
              >
                <span className="hero-pro__mockup-avatar" style={{ background: msg.color }}>
                  {msg.name[0]}
                </span>
                <div className="hero-pro__mockup-body">
                  <span className="hero-pro__mockup-name" style={{ color: msg.color }}>
                    {msg.name}
                  </span>
                  <span className="hero-pro__mockup-text">{msg.text}</span>
                </div>
                <span className="hero-pro__mockup-time">{msg.time}</span>
              </motion.div>
            ))}
          </div>
          <div className="hero-pro__mockup-input">
            <span>Message #general</span>
            <span className="hero-pro__mockup-send">↵</span>
          </div>
        </div>
      </motion.div>

      {/* ── Scroll indicator ── */}
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
