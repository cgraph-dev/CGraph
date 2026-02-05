/**
 * useAboutGlow Hook
 * Cursor-following glow effect for about section
 */

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';

export function useAboutGlow(
  visualRef: RefObject<HTMLDivElement | null>,
  glowRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const visual = visualRef.current;
    const glow = glowRef.current;
    if (!visual || !glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = visual.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Offset from center
      gsap.to(glow, {
        x: x - centerX,
        y: y - centerY,
        opacity: 0.8,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(glow, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    visual.addEventListener('mousemove', handleMouseMove);
    visual.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      visual.removeEventListener('mousemove', handleMouseMove);
      visual.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [visualRef, glowRef]);
}
