/**
 * Preloader Component
 * GAMELAND-style preloader with 3D terrain, particles, and loading animation
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type {
  PreloaderProps,
  StarCSSProperties,
  EnergyCSSProperties,
  ParticleCSSProperties,
  LetterCSSProperties,
} from './types';
import { STAR_COUNT, ENERGY_PARTICLE_COUNT, BRAND_PARTICLE_COUNT, ORB_COUNT } from './constants';

export function Preloader({ onComplete }: PreloaderProps) {
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

      gsap.to(glow, {
        x: x - 150,
        y: y - 150,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseEnter = () => {
      gsap.to(glow, { opacity: 1, scale: 1, duration: 0.3 });
    };

    const handleMouseLeave = () => {
      gsap.to(glow, { opacity: 0, scale: 0.5, duration: 0.3 });
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

  useEffect(() => {
    const pre = preloaderRef.current;
    const elFill = fillRef.current;
    const elPercent = percentRef.current;
    const elStatus = statusRef.current;

    if (!pre || !elFill || !elPercent || !elStatus) return;

    let viewProgress = 0;
    let done = false;

    // Prep hero elements for intro animation (hidden state)
    const prepHeroIntro = () => {
      gsap.set('.hero__eyebrow', {
        y: 60,
        opacity: 0,
        scale: 0.98,
        willChange: 'transform,opacity',
      });
      gsap.set('.hero__title', {
        y: 40,
        opacity: 0,
        willChange: 'transform,opacity',
      });
      gsap.set('.hero__subtitle', {
        y: 22,
        opacity: 0,
        skewY: 5,
        willChange: 'transform,opacity',
      });
      gsap.set('.hero__buttons', {
        y: 18,
        opacity: 0,
        scale: 0,
        willChange: 'transform,opacity',
      });
    };

    // Animate hero elements in after preloader closes
    const runHeroAnimations = () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.to('.hero__eyebrow', {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.65,
        onComplete: () => {
          gsap.set('.hero__eyebrow', { clearProps: 'transform,willChange' });
        },
      })
        .to(
          '.hero__title',
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            onComplete: () => {
              gsap.set('.hero__title', { clearProps: 'transform,willChange' });
            },
          },
          '>-0.3'
        )
        .to(
          '.hero__subtitle',
          {
            y: 0,
            opacity: 1,
            skewY: 0,
            duration: 0.55,
            onComplete: () => {
              gsap.set('.hero__subtitle', { clearProps: 'transform,willChange' });
            },
          },
          '>-0.25'
        )
        .to(
          '.hero__buttons',
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: 'back.out(1.7)',
            onComplete: () => {
              gsap.set('.hero__buttons', { clearProps: 'transform,willChange' });
            },
          },
          '>-0.13'
        );
    };

    // Simulate loading progress
    const simulateLoading = () => {
      const loadTl = gsap.timeline();

      // Animate brand letters on start
      const brandLetters = brandRef.current?.querySelectorAll('.preloader__letter');
      if (brandLetters) {
        gsap.set(brandLetters, {
          y: 80,
          opacity: 0,
          rotateX: -90,
          scale: 0.5,
        });

        loadTl.to(
          brandLetters,
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'back.out(1.7)',
          },
          0
        );

        // Add continuous floating animation after entrance
        loadTl.to(
          brandLetters,
          {
            y: -5,
            duration: 1.2,
            stagger: {
              each: 0.1,
              repeat: -1,
              yoyo: true,
            },
            ease: 'sine.inOut',
          },
          0.8
        );
      }

      // Slowly progress to ~85% over 1.5s
      loadTl.to(
        {},
        {
          duration: 1.5,
          onUpdate: function () {
            const progress = this.progress();
            viewProgress = progress * 0.85;
            const pct = Math.floor(viewProgress * 100);
            elPercent.textContent = pct + '%';
            elFill.style.width = pct + '%';
          },
        },
        0
      );

      // Then call closePreloader
      loadTl.call(closePreloader);
    };

    // Close preloader with GAMELAND-style eased completion
    const closePreloader = () => {
      if (done) return;
      done = true;

      // Change status to READY with animation class
      elStatus.textContent = 'READY';
      elStatus.classList.add('is-ready');

      // Ease progress to 100%
      gsap.to(
        {},
        {
          duration: 0.25,
          onUpdate: () => {
            viewProgress += (1 - viewProgress) * 0.3;
            const pct = viewProgress >= 0.99 ? 100 : Math.floor(viewProgress * 100);
            elPercent.textContent = pct + '%';
            elFill.style.width = pct + '%';
          },
          onComplete: () => {
            // Prep hero elements before fade
            prepHeroIntro();

            // Refresh ScrollTrigger if available
            if (ScrollTrigger) ScrollTrigger.refresh();

            // Fade out preloader
            gsap.to(pre, {
              opacity: 0,
              duration: 0.35,
              ease: 'power2.out',
              onComplete: () => {
                pre.classList.add('is-done');
                document.documentElement.classList.add('site-ready');
                document.documentElement.style.overflow = '';

                // Run hero entrance animations
                runHeroAnimations();

                // Refresh ScrollTrigger after animations
                if (ScrollTrigger) ScrollTrigger.refresh(true);

                // Notify parent
                onComplete();
              },
            });
          },
        }
      );
    };

    // Lock scroll during preloader
    document.documentElement.style.overflow = 'hidden';

    // Start loading simulation
    simulateLoading();

    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [onComplete]);

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
        {[...Array(STAR_COUNT)].map((_, i) => (
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
              } as StarCSSProperties
            }
          />
        ))}
      </div>

      {/* Floating energy particles */}
      <div className="preloader__energy-field">
        {[...Array(ENERGY_PARTICLE_COUNT)].map((_, i) => (
          <span
            key={i}
            className="preloader__energy"
            style={
              {
                '--i': i,
                '--x': `${Math.random() * 100}%`,
                '--speed': `${4 + Math.random() * 6}s`,
              } as EnergyCSSProperties
            }
          />
        ))}
      </div>

      {/* Interactive cursor glow */}
      <div ref={cursorGlowRef} className="preloader__cursor-glow" />

      {/* Floating orbs */}
      <div className="preloader__orbs">
        {[...Array(ORB_COUNT)].map((_, i) => (
          <div key={i} className={`preloader__orb preloader__orb--${i + 1}`} />
        ))}
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
                style={{ '--letter-index': i } as LetterCSSProperties}
              >
                {letter}
                <span className="preloader__letter-glitch" data-letter={letter} />
              </span>
            ))}
          </h3>
          <div className="preloader__brand-particles">
            {[...Array(BRAND_PARTICLE_COUNT)].map((_, i) => (
              <span
                key={i}
                className="preloader__particle"
                style={{ '--i': i } as ParticleCSSProperties}
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
          <span ref={statusRef} className="preloader__status" data-text="GENERATING NEW CONNECTION">
            GENERATING NEW CONNECTION
          </span>
        </div>
      </div>

      {/* Version tag */}
      <div className="preloader__version">v2.0.0</div>
    </div>
  );
}
