import React, { useRef, useEffect } from 'react';

export interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

/**
 * FeatureCard - Core UI Primitive
 *
 * Interactive card with 3D tilt physics for feature showcases.
 * Includes animated border, glass background, spotlight glare, and accent line.
 *
 * Based on the original TiltCard from LandingPage.tsx, extracted as a reusable primitive.
 */
export const FeatureCard = React.memo(function FeatureCard({
  icon,
  title,
  description,
  className = '',
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let rect: DOMRect | null = null;
    let raf = 0;
    let hover = false;
    let tx = 0.5,
      ty = 0.5,
      targetX = 0.5,
      targetY = 0.5;
    const max = 12;
    const scaleHover = 0.985;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

    const measure = () => {
      rect = card.getBoundingClientRect();
    };

    const tick = () => {
      raf = 0;
      tx = lerp(tx, targetX, 0.18);
      ty = lerp(ty, targetY, 0.18);

      const ry = clamp((tx - 0.5) * (max * 2), -max, max);
      const rx = clamp(-(ty - 0.5) * (max * 2), -max, max);

      card.style.setProperty('--ry', ry + 'deg');
      card.style.setProperty('--rx', rx + 'deg');
      card.style.setProperty('--s', hover ? String(scaleHover) : '1');
      card.style.setProperty('--mouse-x', clamp(tx * 100, 2, 98) + '%');
      card.style.setProperty('--mouse-y', clamp(ty * 100, 2, 98) + '%');

      const settling = Math.abs(targetX - tx) > 1e-3 || Math.abs(targetY - ty) > 1e-3 || hover;
      if (settling) raf = requestAnimationFrame(tick);
    };

    const handleMouseEnter = () => {
      measure();
      hover = true;
      card.classList.add('is-tilting');
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!hover || !rect) return;
      const rawX = (e.clientX - rect.left) / rect.width;
      const rawY = (e.clientY - rect.top) / rect.height;
      targetX = clamp(rawX, 0, 1);
      targetY = clamp(rawY, 0, 1);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const handleMouseLeave = () => {
      hover = false;
      targetX = 0.5;
      targetY = 0.5;
      card.classList.remove('is-tilting');
      if (!raf) raf = requestAnimationFrame(tick);
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove, { passive: true });
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={cardRef} className={`tilt-card ${className}`}>
      <div className="tilt-card__animated-border" />
      <div className="tilt-card__bg" />
      <div className="tilt-card__glare" />
      <div className="tilt-card__content">
        <span className="tilt-card__icon">{icon}</span>
        <h3 className="tilt-card__title font-robert">{title}</h3>
        <p className="tilt-card__desc font-space">{description}</p>
      </div>
      <div className="tilt-card__accent" />
    </div>
  );
});
