/**
 * Particle effects section for effects customization
 * @module pages/customize/effects-customization
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { usePrefersReducedMotion } from '@/hooks';
import type { ParticleEffect } from './types';
import { ParticlePreview } from './particle-preview';

// =============================================================================
// PARTICLE EFFECTS SECTION
// =============================================================================

interface ParticleEffectsSectionProps {
  particles: ParticleEffect[];
  selectedParticle: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

export function ParticleEffectsSection({
  particles,
  selectedParticle,
  previewingLockedItem,
  onSelect,
}: ParticleEffectsSectionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Track which card is being hovered for performance - only animate hovered card
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'light':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'heavy':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {particles.map((particle, index) => {
        const isPreviewing = previewingLockedItem === particle.id;
        const isHovered = hoveredCard === particle.id;
        // Only animate particles if card is hovered and user doesn't prefer reduced motion
        const shouldAnimate = isHovered && !prefersReducedMotion;

        return (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onMouseEnter={() => setHoveredCard(particle.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <GlassCard
              variant={
                selectedParticle === particle.id || isPreviewing
                  ? 'neon'
                  : particle.unlocked
                    ? 'crystal'
                    : 'frosted'
              }
              glow={selectedParticle === particle.id || isPreviewing}
              glowColor={
                isPreviewing
                  ? 'rgba(234, 179, 8, 0.4)'
                  : selectedParticle === particle.id
                    ? 'rgba(139, 92, 246, 0.3)'
                    : undefined
              }
              hover3D={false}
              className={`relative cursor-pointer p-4 transition-all hover:scale-[1.02] ${
                isPreviewing ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => onSelect(particle.id, particle.unlocked)}
            >
              {/* Particle Preview - OPTIMIZED: only animate when hovered */}
              <div className="relative mb-3 h-32 overflow-hidden rounded-lg bg-gradient-to-br from-dark-700 to-dark-800">
                <ParticlePreview type={particle.type} shouldAnimate={shouldAnimate} />
              </div>

              {/* Premium Badge */}
              {particle.isPremium && (
                <div className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                  PRO
                </div>
              )}

              {/* Particle Name */}
              <h4 className="mb-1 text-sm font-semibold text-white">{particle.name}</h4>

              {/* Description */}
              <p className="mb-2 text-xs text-white/60">{particle.description}</p>

              {/* Performance Indicator */}
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-white/60">Performance:</span>
                <span className={`font-medium ${getPerformanceColor(particle.performance)}`}>
                  {particle.performance.toUpperCase()}
                </span>
              </div>

              {/* Status */}
              {particle.unlocked ? (
                selectedParticle === particle.id ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-1.5">
                    <CheckCircleIconSolid className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-medium text-green-400">Active</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(particle.id, particle.unlocked);
                    }}
                    className="w-full rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    Apply
                  </button>
                )
              ) : isPreviewing ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-3 py-1.5">
                  <EyeIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">Previewing</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                  <div className="flex items-center gap-1">
                    <LockClosedIcon className="h-4 w-4 text-white/40" />
                    <span className="text-xs text-white/60">Click to Preview</span>
                  </div>
                  <p className="mt-1 text-center text-xs text-white/40">
                    {particle.unlockRequirement}
                  </p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}
