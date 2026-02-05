/**
 * GlitchText Component
 * Glitch text effect with configurable intensity
 */

import { useState, useEffect } from 'react';
import { GLITCH_INTENSITY_MAP } from './constants';
import type { GlitchTextProps } from './types';

export function GlitchText({ children, className = '', intensity = 'medium' }: GlitchTextProps) {
  const [glitchStyle, setGlitchStyle] = useState({});

  useEffect(() => {
    const glitchIntensity = GLITCH_INTENSITY_MAP[intensity];

    const glitchInterval = setInterval(() => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) {
        setGlitchStyle({
          textShadow: `
            ${Math.random() * 10 - 5}px 0 #ff0000,
            ${Math.random() * -10 + 5}px 0 #00ffff
          `,
          transform: `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`,
        });

        setTimeout(() => setGlitchStyle({}), 50);
      }
    }, glitchIntensity);

    return () => clearInterval(glitchInterval);
  }, [intensity]);

  return (
    <span className={`relative inline-block ${className}`} style={glitchStyle}>
      {/* Glitch layers */}
      <span className="absolute inset-0" aria-hidden style={{ clipPath: 'inset(10% 0 60% 0)' }}>
        {children}
      </span>
      <span className="absolute inset-0" aria-hidden style={{ clipPath: 'inset(60% 0 10% 0)' }}>
        {children}
      </span>
      <span>{children}</span>
    </span>
  );
}
