/**
 * useWorkshopAnimations Hook
 * GSAP scroll-triggered animations for workshop landing page
 */

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';

interface AnimationRefs {
  featuresRef: RefObject<HTMLDivElement | null>;
  statsRef: RefObject<HTMLDivElement | null>;
  aboutRef: RefObject<HTMLDivElement | null>;
  ctaRef: RefObject<HTMLDivElement | null>;
}

export function useWorkshopAnimations(preloading: boolean, refs: AnimationRefs) {
  const { featuresRef, statsRef, aboutRef, ctaRef } = refs;

  useEffect(() => {
    if (preloading) return;

    const ctx = gsap.context(() => {
      // Feature cards scroll animation
      gsap.from('.tilt-card', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // Stats scroll animation
      gsap.from('.stats__item', {
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // About section scroll animation
      gsap.from('.about__content > *', {
        scrollTrigger: {
          trigger: aboutRef.current,
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
          trigger: ctaRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, [preloading, featuresRef, statsRef, aboutRef, ctaRef]);
}
