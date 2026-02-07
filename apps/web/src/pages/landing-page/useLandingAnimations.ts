/**
 * Landing Page GSAP Animations
 *
 * Orchestrates all GSAP scroll-triggered and hero entrance animations
 * for the landing page. This hook manages:
 * - Hero element stagger entrance
 * - Section zoom/parallax effects via ScrollTrigger
 * - Feature card reveal animations
 * - Scroll indicator tracking
 * - ResizeObserver for lazy-loaded content
 *
 * @module pages/landing-page/useLandingAnimations
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { debounce } from '../landing';
import type { LandingRefs } from './types';

gsap.registerPlugin(ScrollTrigger);

/**
 * Drives all GSAP-based animations on the landing page.
 *
 * @param refs - Collection of element refs used by the animations
 */
export function useLandingAnimations(refs: LandingRefs) {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    let gsapContextRef: gsap.Context | null = null;
    let heroTl: gsap.core.Timeline | null = null;

    // Hero entrance animations - run immediately
    gsap.set('.hero__eyebrow', { y: 60, opacity: 0, scale: 0.98 });
    gsap.set('.hero__title', { y: 40, opacity: 0 });
    gsap.set('.hero__subtitle', { y: 22, opacity: 0, skewY: 5 });
    gsap.set('.hero__buttons', { y: 18, opacity: 0, scale: 0 });

    heroTl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power2.out' } });
    heroTl
      .to('.hero__eyebrow', { y: 0, opacity: 1, scale: 1, duration: 0.65 })
      .to('.hero__title', { y: 0, opacity: 1, duration: 0.6 }, '>-0.3')
      .to('.hero__subtitle', { y: 0, opacity: 1, skewY: 0, duration: 0.55 }, '>-0.25')
      .to(
        '.hero__buttons',
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' },
        '>-0.13'
      );

    // Mark site as ready for CSS transitions
    document.documentElement.classList.add('site-ready');

    // Defer scroll-triggered animations slightly to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Section zoom effect - unified smooth parallax-style scaling
        const sections = document.querySelectorAll('.zoom-section');

        // Set initial states for all sections
        sections.forEach((section, index) => {
          if (index === 0) {
            gsap.set(section, { scale: 1, opacity: 1, transformOrigin: 'center center' });
          } else {
            gsap.set(section, { scale: 0.75, opacity: 0.2, transformOrigin: 'center center' });
          }
        });

        // Create unified zoom animation for each section
        sections.forEach((section) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 100%',
              end: 'top -50%',
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          });

          // Phase 1: Scale up (0–33%)
          tl.fromTo(
            section,
            { scale: 0.75, opacity: 0.2, transformOrigin: 'center center' },
            { scale: 1, opacity: 1, duration: 0.33, ease: 'sine.out' }
          );

          // Phase 2: Hold at full scale (33–66%)
          tl.to(section, { scale: 1, opacity: 1, duration: 0.34, ease: 'none' });

          // Phase 3: Scale down (66–100%)
          tl.to(section, {
            scale: 0.75,
            opacity: 0.2,
            duration: 0.33,
            ease: 'sine.in',
          });
        });

        // Refresh ScrollTrigger after setup
        ScrollTrigger.refresh();

        // Feature cards scroll animation
        gsap.from('.tilt-card', {
          scrollTrigger: {
            trigger: refs.featuresRef.current,
            start: 'top 80%',
          },
          y: 60,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });

        // About section scroll animation
        gsap.from('.about__content > *', {
          scrollTrigger: {
            trigger: refs.aboutRef.current,
            start: 'top 70%',
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });

        // CTA section scroll animation
        gsap.from('.cta__content > *', {
          scrollTrigger: {
            trigger: refs.ctaRef.current,
            start: 'top 80%',
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
        });

        // Scroll indicator animations
        if (refs.scrollIndicatorRef.current) {
          const scrollDot = refs.scrollIndicatorRef.current.querySelector('.hero__scroll-dot');
          const scrollArrows = refs.scrollIndicatorRef.current.querySelectorAll(
            '.hero__scroll-arrows span'
          );

          if (scrollDot) {
            gsap.to(scrollDot, {
              scrollTrigger: {
                trigger: refs.heroRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
              },
              y: 20,
              opacity: 0.2,
              ease: 'none',
            });
          }

          scrollArrows.forEach((arrow, index) => {
            gsap.to(arrow, {
              scrollTrigger: {
                trigger: refs.heroRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
              },
              y: 8 + index * 4,
              opacity: 0,
              ease: 'none',
            });
          });

          gsap.to(refs.scrollIndicatorRef.current, {
            scrollTrigger: {
              trigger: refs.heroRef.current,
              start: 'top top',
              end: '30% top',
              scrub: 0.3,
            },
            opacity: 0,
            y: 20,
            ease: 'none',
          });
        }
      });

      gsapContextRef = ctx;

      // ResizeObserver to refresh ScrollTrigger when lazy content loads
      const resizeObserver = new ResizeObserver(
        debounce(() => {
          ScrollTrigger.refresh();
        }, 200)
      );

      const mainContainer = document.querySelector('.demo-landing');
      if (mainContainer) {
        resizeObserver.observe(mainContainer);
      }

      resizeObserverRef.current = resizeObserver;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      heroTl?.kill();
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (gsapContextRef) {
        gsapContextRef.revert();
        gsapContextRef = null;
      }
    };
  }, [refs]);
}
