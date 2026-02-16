import React from 'react';
import { NeuralBackground } from '../effects/NeuralBackground';

/**
 * GlobalBackground
 *
 * The single source of truth for the landing page background.
 * Implements the "Auth Page" style:
 * - Deep cosmic dark base (#030712)
 * - Constructive/connected graph network (constellations)
 * - Strong vignette for focus
 * - Emerald & Purple gradient accents
 */
export const GlobalBackground: React.FC = () => {
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  const nodeCount = prefersReducedMotion ? 48 : isMobile ? 64 : 90;
  const connectionDistance = isMobile ? 140 : 160;
  const nodeSize = isMobile ? 1.3 : 1.5;
  const animationSpeed = prefersReducedMotion ? 0.35 : isMobile ? 0.48 : 0.6;
  const mouseRepulsionStrength = isMobile ? 0.55 : 0.8;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden bg-[#030712]">
      {/* 1. Base Gradient - Deep Nebula */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(circle at 15% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* 2. Neural Network - The "Constellations" */}
      <div className="absolute inset-0 opacity-60 mix-blend-screen">
        <NeuralBackground
          options={{
            nodeColor: '#10b981', // Fallback
            nodeColors: ['#10b981', '#06b6d4', '#8b5cf6'], // Emerald, Cyan, Purple
            connectionColorStart: '#10b981', // Emerald start
            connectionColorEnd: '#8b5cf6', // Purple end
            nodeCount, // Responsive density
            connectionDistance, // Responsive reach
            nodeSize, // Responsive node size
            mouseRepulsionStrength, // Interactive feel
            animationSpeed, // Slow drift
          }}
        />
      </div>

      {/* 3. Vignette - Focus Center */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(3, 7, 18, 0.8) 100%)',
        }}
      />

      {/* 4. Scanlines - Tech feel (Optional/Subtle) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 2px, 3px 100%',
        }}
      />
    </div>
  );
};
