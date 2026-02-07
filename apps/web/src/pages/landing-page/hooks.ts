/**
 * Landing Page Scroll Hooks
 *
 * Custom hooks for scroll-related behaviors on the landing page
 * including nav visibility, scroll indicators, and cursor-follow glow effects.
 *
 * @module pages/landing-page/hooks
 */

import { useState, useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { throttle } from '../landing';

/**
 * Manages nav bar visibility based on scroll direction and position.
 *
 * - Hides the nav when scrolling down past 100px
 * - Shows a scrolled background when past 50px
 *
 * @returns `{ navHidden, navScrolled }` reactive nav state
 */
export function useLandingScroll() {
  const [navHidden, setNavHidden] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    let lastScroll = 0;

    const handleScroll = throttle(() => {
      const currentScroll = window.scrollY;
      setNavHidden(currentScroll > lastScroll && currentScroll > 100);
      setNavScrolled(currentScroll > 50);
      lastScroll = currentScroll;
    }, 16); // ~60fps

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { navHidden, navScrolled };
}

/**
 * Cursor-following glow effect for the about/security section.
 *
 * Tracks mouse movement over the visual container and animates
 * a glow element to follow the cursor, fading out on mouse leave.
 *
 * @param visualRef - Reference to the container element
 * @param glowRef - Reference to the glow element
 */
export function useAboutGlow(
  visualRef: RefObject<HTMLDivElement | null>,
  glowRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const visual = visualRef.current;
    const glow = glowRef.current;
    if (!visual || !glow) return;

    const handleMouseMove = throttle((e: MouseEvent) => {
      const rect = visual.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      gsap.to(glow, {
        x: x - centerX,
        y: y - centerY,
        opacity: 0.8,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }, 16);

    const handleMouseLeave = () => {
      gsap.to(glow, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    visual.addEventListener('mousemove', handleMouseMove, { passive: true });
    visual.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      visual.removeEventListener('mousemove', handleMouseMove);
      visual.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [visualRef, glowRef]);
}
