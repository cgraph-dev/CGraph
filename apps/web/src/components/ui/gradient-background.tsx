/**
 * GradientBackground — ambient glow orbs behind app content.
 * @module components/ui/gradient-background
 */
import { memo } from 'react';

interface GradientBackgroundProps {
  variant?: 'auth' | 'app' | 'minimal';
}

export const GradientBackground = memo(function GradientBackground({
  variant = 'app',
}: GradientBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base space gradient */}
      <div className="absolute inset-0 bg-[#0d1117]" />

      {/* Purple glow — top left */}
      <div
        className="absolute rounded-full opacity-20 blur-[120px]"
        style={{
          width: '600px',
          height: '600px',
          top: '-200px',
          left: '-100px',
          background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
        }}
      />

      {/* Cyan glow — bottom right */}
      <div
        className="absolute rounded-full opacity-15 blur-[120px]"
        style={{
          width: '500px',
          height: '500px',
          bottom: '-150px',
          right: '-50px',
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
        }}
      />

      {/* Teal glow — center (only on auth/full variants) */}
      {variant !== 'minimal' && (
        <div
          className="absolute rounded-full opacity-10 blur-[180px]"
          style={{
            width: '400px',
            height: '400px',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
});
GradientBackground.displayName = 'GradientBackground';
