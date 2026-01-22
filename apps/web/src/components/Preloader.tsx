/**
 * Shared Preloader Component
 *
 * Complex animated preloader used as Suspense fallback across all pages.
 * Features terrain effect, star field, energy particles, animated logo, and progress bar.
 *
 * @since v0.9.5
 */

import { useRef, useEffect } from 'react';
import './preloader.css';

interface PreloaderProps {
  /** Optional callback when loading completes */
  onComplete?: () => void;
  /** Whether to loop indefinitely (for Suspense fallback) */
  loop?: boolean;
}

export function Preloader({ onComplete, loop = true }: PreloaderProps) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  // Mouse tracking for interactive glow effect
  useEffect(() => {
    const glow = cursorGlowRef.current;
    const pre = preloaderRef.current;
    if (!glow || !pre) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = pre.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.transform = `translate(${x - 150}px, ${y - 150}px)`;
    };

    const handleMouseEnter = () => {
      glow.style.opacity = '1';
      glow.style.scale = '1';
    };

    const handleMouseLeave = () => {
      glow.style.opacity = '0';
      glow.style.scale = '0.5';
    };

    pre.addEventListener('mousemove', handleMouseMove);
    pre.addEventListener('mouseenter', handleMouseEnter);
    pre.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      pre.removeEventListener('mousemove', handleMouseMove);
      pre.removeEventListener('mouseenter', handleMouseEnter);
      pre.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Progress animation
  useEffect(() => {
    const elFill = fillRef.current;
    const elPercent = percentRef.current;
    const elStatus = statusRef.current;

    if (!elFill || !elPercent || !elStatus) return;

    let animationFrame: number;
    let currentProgress = 0;
    let targetProgress = loop ? 85 : 100;
    let done = false;

    const animate = () => {
      if (done) return;

      // Ease towards target
      currentProgress += (targetProgress - currentProgress) * 0.02;
      const pct = Math.min(Math.floor(currentProgress), 100);

      elPercent.textContent = pct + '%';
      elFill.style.width = pct + '%';

      if (currentProgress >= 84 && loop && !done) {
        // Reset for loop
        setTimeout(() => {
          currentProgress = 0;
          targetProgress = 85;
        }, 500);
      }

      if (currentProgress >= 99 && !loop) {
        done = true;
        elStatus.textContent = 'READY';
        elStatus.classList.add('is-ready');

        if (onComplete) {
          setTimeout(onComplete, 300);
        }
        return;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    // Lock scroll during preloader
    document.documentElement.style.overflow = 'hidden';

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.documentElement.style.overflow = '';
    };
  }, [loop, onComplete]);

  return (
    <div ref={preloaderRef} className="preloader" aria-hidden="true">
      {/* 3D Terrain Background */}
      <div className="preloader__terrain">
        <div className="preloader__terrain-grid" />
        <div className="preloader__terrain-fog" />
      </div>

      {/* Animated grid background */}
      <div className="preloader__grid" />

      {/* Star field particles */}
      <div className="preloader__stars">
        {[...Array(50)].map((_, i) => (
          <span
            key={i}
            className="preloader__star"
            style={
              {
                '--x': `${Math.random() * 100}%`,
                '--y': `${Math.random() * 100}%`,
                '--delay': `${Math.random() * 3}s`,
                '--duration': `${2 + Math.random() * 3}s`,
                '--size': `${1 + Math.random() * 3}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Floating energy particles */}
      <div className="preloader__energy-field">
        {[...Array(30)].map((_, i) => (
          <span
            key={i}
            className="preloader__energy"
            style={
              {
                '--i': i,
                '--x': `${Math.random() * 100}%`,
                '--speed': `${4 + Math.random() * 6}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Interactive cursor glow */}
      <div ref={cursorGlowRef} className="preloader__cursor-glow" />

      {/* Floating orbs */}
      <div className="preloader__orbs">
        <div className="preloader__orb preloader__orb--1" />
        <div className="preloader__orb preloader__orb--2" />
        <div className="preloader__orb preloader__orb--3" />
        <div className="preloader__orb preloader__orb--4" />
        <div className="preloader__orb preloader__orb--5" />
      </div>

      {/* Scanline effect */}
      <div className="preloader__scanline" />

      {/* Corner accents */}
      <div className="preloader__corner preloader__corner--tl" />
      <div className="preloader__corner preloader__corner--tr" />
      <div className="preloader__corner preloader__corner--bl" />
      <div className="preloader__corner preloader__corner--br" />

      {/* Main content */}
      <div className="preloader__inner">
        <div ref={brandRef} className="preloader__brand-container">
          <div className="preloader__brand-glow" />
          <h3 className="preloader__brand">
            {'CGRAPH'.split('').map((letter, i) => (
              <span
                key={i}
                className="preloader__letter"
                data-letter={letter}
                style={{ '--letter-index': i } as React.CSSProperties}
              >
                {letter}
                <span className="preloader__letter-glitch" data-letter={letter} />
              </span>
            ))}
          </h3>
          <div className="preloader__brand-particles">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="preloader__particle"
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
        <div className="preloader__bar-wrapper">
          <div className="preloader__bar">
            <span ref={fillRef} className="preloader__fill" />
          </div>
        </div>
        <div className="preloader__meta">
          <span ref={percentRef} className="preloader__percent">
            0%
          </span>
          <span className="preloader__dot">•</span>
          <span ref={statusRef} className="preloader__status" data-text="LOADING">
            LOADING
          </span>
        </div>
      </div>

      {/* Version tag */}
      <div className="preloader__version">v2.0.0</div>
    </div>
  );
}

export default Preloader;
