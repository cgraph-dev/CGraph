/**
 * ParticleField - Renders animated particles and overlay effects for the profile card
 */

import { motion } from 'motion/react';
import type { ProfileThemeConfig } from '@/data/profileThemes';
import type { ParticleData, ParticleStyle } from './types';

interface ParticleFieldProps {
  show: boolean;
  particleData: ParticleData[];
  particleStyle: ParticleStyle;
  activeProfileTheme: ProfileThemeConfig | null;
  speedMultiplier: number;
}

/**
 * unknown for the settings module.
 */
/**
 * Particle Field component.
 */
export function ParticleField({
  show,
  particleData,
  particleStyle,
  activeProfileTheme,
  speedMultiplier,
}: ParticleFieldProps) {
  return (
    <>
      {/* Particles */}
      {show && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particleData.map((p) => (
            <motion.div
              key={p.id}
              className={`absolute ${particleStyle.shape === 'square' ? 'rounded-sm' : 'rounded-full'}`}
              style={{
                background: particleStyle.color,
                width: `${p.width}px`,
                height: `${p.height}px`,
                left: `${p.left}%`,
                top: `${p.top}%`,
                boxShadow: `0 0 ${p.boxShadow}px ${particleStyle.color}`,
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
              }}
              animate={
                activeProfileTheme?.particleType === 'fire'
                  ? {
                      y: [0, -60],
                      x: [0, (p.id % 2 === 0 ? 1 : -1) * 10],
                      opacity: [0.8, 0],
                      scale: [1, 0.3],
                    }
                  : activeProfileTheme?.particleType === 'snow'
                    ? {
                        y: [0, 80],
                        x: [0, (p.id % 2 === 0 ? 1 : -1) * 15],
                        opacity: [0.8, 0.4, 0.8],
                      }
                    : activeProfileTheme?.particleType === 'rain'
                      ? { y: [0, 100], opacity: [0.6, 0.2] }
                      : { y: [0, -40, 0], opacity: [0.3, 0.9, 0.3], scale: [0.5, 1.2, 0.5] }
              }
              transition={{
                duration: p.duration * speedMultiplier,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Overlay effect for special themes */}
      {activeProfileTheme?.overlayType && activeProfileTheme.overlayType !== 'none' && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              activeProfileTheme.overlayType === 'scanlines'
                ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
                : activeProfileTheme.overlayType === 'noise'
                  ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E\")"
                  : activeProfileTheme.overlayType === 'grid'
                    ? 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 11px), repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 11px)'
                    : activeProfileTheme.overlayType === 'holographic'
                      ? 'linear-gradient(45deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1), rgba(255,255,0,0.1))'
                      : 'none',
            opacity: 0.5,
          }}
        />
      )}
    </>
  );
}
