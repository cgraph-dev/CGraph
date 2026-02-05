/**
 * useLandingAnimations Hook
 *
 * Manages all GSAP scroll-triggered animations for the landing demo.
 */

import { useEffect, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { throttle } from './utils';

gsap.registerPlugin(ScrollTrigger);

interface UseLandingAnimationsOptions {
  preloading: boolean;
  heroRef: RefObject<HTMLDivElement | null>;
  featuresRef: RefObject<HTMLDivElement | null>;
  aboutRef: RefObject<HTMLDivElement | null>;
  ctaRef: RefObject<HTMLDivElement | null>;
  aboutVisualRef: RefObject<HTMLDivElement | null>;
  aboutGlowRef: RefObject<HTMLDivElement | null>;
  scrollIndicatorRef: RefObject<HTMLDivElement | null>;
  setNavHidden: (hidden: boolean) => void;
  setNavScrolled: (scrolled: boolean) => void;
}

export function useLandingAnimations({
  preloading,
  heroRef,
  featuresRef,
  aboutRef,
  ctaRef,
  aboutVisualRef,
  aboutGlowRef,
  scrollIndicatorRef,
  setNavHidden,
  setNavScrolled,
}: UseLandingAnimationsOptions) {
  // Scroll handler for nav visibility - throttled for performance
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
  }, [setNavHidden, setNavScrolled]);

  // Cursor-following glow effect for about section - throttled for performance
  useEffect(() => {
    const visual = aboutVisualRef.current;
    const glow = aboutGlowRef.current;
    if (!visual || !glow) return;

    const handleMouseMove = throttle((e: MouseEvent) => {
      const rect = visual.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Offset from center (like original TiltCard3D)
      gsap.to(glow, {
        x: x - centerX,
        y: y - centerY,
        opacity: 0.8,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto', // Prevent animation queue buildup
      });
    }, 16); // ~60fps

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
  }, [aboutVisualRef, aboutGlowRef]);

  // GSAP animations after preload (non-hero elements - hero is animated by preloader)
  useEffect(() => {
    if (preloading) return;

    // Defer animations slightly to ensure DOM is ready and improve initial paint
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Section zoom effect - smooth parallax-style scaling
        const sections = document.querySelectorAll('.zoom-section');

        sections.forEach((section) => {
          // Scale down as section leaves the viewport (starts when section top hits 30% from top)
          gsap.to(section, {
            scrollTrigger: {
              trigger: section,
              start: 'top 30%',
              end: 'top -50%',
              scrub: 1,
              fastScrollEnd: true, // Performance: end early on fast scroll
            },
            scale: 0.25,
            opacity: 0.05,
            ease: 'none',
          });

          // Scale up as section enters viewport - reach full scale when section is centered
          gsap.fromTo(
            section,
            {
              scale: 0.25,
              opacity: 0.05,
            },
            {
              scrollTrigger: {
                trigger: section,
                start: 'top 100%',
                end: 'top 50%',
                scrub: 1,
                fastScrollEnd: true, // Performance: end early on fast scroll
              },
              scale: 1,
              opacity: 1,
              ease: 'none',
            }
          );
        });

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

        // Scroll indicator - follows user scroll
        if (scrollIndicatorRef.current) {
          const scrollDot = scrollIndicatorRef.current.querySelector('.hero__scroll-dot');
          const scrollArrows = scrollIndicatorRef.current.querySelectorAll(
            '.hero__scroll-arrows span'
          );

          // Animate the dot based on scroll progress
          if (scrollDot) {
            gsap.to(scrollDot, {
              scrollTrigger: {
                trigger: heroRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
              },
              y: 20,
              opacity: 0.2,
              ease: 'none',
            });
          }

          // Animate arrows cascading based on scroll
          scrollArrows.forEach((arrow, index) => {
            gsap.to(arrow, {
              scrollTrigger: {
                trigger: heroRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
              },
              y: 8 + index * 4,
              opacity: 0,
              ease: 'none',
            });
          });

          // Fade out entire scroll indicator as user scrolls
          gsap.to(scrollIndicatorRef.current, {
            scrollTrigger: {
              trigger: heroRef.current,
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

      return () => ctx.revert();
    }, 100); // Small delay to improve initial paint

    return () => {
      clearTimeout(timeoutId);
    };
  }, [preloading, heroRef, featuresRef, aboutRef, ctaRef, scrollIndicatorRef]);
}
