import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  PhotoIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';

/**
 * EffectsCustomization Component
 *
 * Comprehensive visual effects customization with 3 sections:
 * 1. Particle Effects - 12+ particle systems (snow, confetti, stars, etc.)
 * 2. Background Effects - 10+ animated backgrounds (gradients, waves, matrix)
 * 3. UI Animations - 8+ interface animation sets (smooth, bouncy, instant)
 *
 * Features:
 * - Live preview of particle systems
 * - Interactive background demos
 * - Animation speed controls
 * - Lock system for premium effects
 * - Performance impact indicators
 */

// ==================== TYPE DEFINITIONS ====================

type EffectCategory = 'particles' | 'backgrounds' | 'animations';

interface ParticleEffect {
  id: string;
  name: string;
  description: string;
  type: string;
  density: 'low' | 'medium' | 'high';
  performance: 'light' | 'medium' | 'heavy';
  unlocked: boolean;
  unlockRequirement?: string;
  isPremium?: boolean;
}

interface BackgroundEffect {
  id: string;
  name: string;
  description: string;
  preview: string;
  animated: boolean;
  performance: 'light' | 'medium' | 'heavy';
  unlocked: boolean;
  unlockRequirement?: string;
}

interface AnimationSet {
  id: string;
  name: string;
  description: string;
  speed: 'instant' | 'fast' | 'normal' | 'smooth' | 'slow';
  easing: string;
  unlocked: boolean;
  unlockRequirement?: string;
}

// ==================== MOCK DATA ====================

const PARTICLE_EFFECTS: ParticleEffect[] = [
  {
    id: 'particle-none',
    name: 'None',
    description: 'No particle effects',
    type: 'none',
    density: 'low',
    performance: 'light',
    unlocked: true,
  },
  {
    id: 'particle-snow',
    name: 'Falling Snow',
    description: 'Gentle snowflakes falling',
    type: 'snow',
    density: 'medium',
    performance: 'light',
    unlocked: true,
  },
  {
    id: 'particle-confetti',
    name: 'Confetti',
    description: 'Celebratory confetti burst',
    type: 'confetti',
    density: 'high',
    performance: 'medium',
    unlocked: true,
  },
  {
    id: 'particle-stars',
    name: 'Twinkling Stars',
    description: 'Starfield background',
    type: 'stars',
    density: 'medium',
    performance: 'light',
    unlocked: true,
  },
  {
    id: 'particle-fireflies',
    name: 'Fireflies',
    description: 'Glowing fireflies floating',
    type: 'fireflies',
    density: 'low',
    performance: 'medium',
    unlocked: false,
    unlockRequirement: 'Reach Level 10',
  },
  {
    id: 'particle-bubbles',
    name: 'Rising Bubbles',
    description: 'Bubbles floating upward',
    type: 'bubbles',
    density: 'medium',
    performance: 'light',
    unlocked: true,
  },
  {
    id: 'particle-sakura',
    name: 'Cherry Blossoms',
    description: 'Sakura petals falling',
    type: 'sakura',
    density: 'medium',
    performance: 'medium',
    unlocked: false,
    unlockRequirement: 'Complete Spring Event',
  },
  {
    id: 'particle-matrix',
    name: 'Matrix Rain',
    description: 'Digital matrix code rain',
    type: 'matrix',
    density: 'high',
    performance: 'heavy',
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
    isPremium: true,
  },
  {
    id: 'particle-sparkles',
    name: 'Magic Sparkles',
    description: 'Magical sparkle effects',
    type: 'sparkles',
    density: 'medium',
    performance: 'medium',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
    isPremium: true,
  },
  {
    id: 'particle-flames',
    name: 'Rising Flames',
    description: 'Fire particles rising',
    type: 'flames',
    density: 'high',
    performance: 'heavy',
    unlocked: false,
    unlockRequirement: 'Win 50 PvP Matches',
  },
  {
    id: 'particle-leaves',
    name: 'Autumn Leaves',
    description: 'Falling autumn leaves',
    type: 'leaves',
    density: 'medium',
    performance: 'light',
    unlocked: false,
    unlockRequirement: 'Complete Fall Event',
  },
  {
    id: 'particle-hearts',
    name: 'Floating Hearts',
    description: 'Love-themed hearts',
    type: 'hearts',
    density: 'low',
    performance: 'light',
    unlocked: false,
    unlockRequirement: 'Valentine\'s Event',
  },
];

const BACKGROUND_EFFECTS: BackgroundEffect[] = [
  {
    id: 'bg-solid',
    name: 'Solid Dark',
    description: 'Simple solid background',
    preview: '#0F0F11',
    animated: false,
    performance: 'light',
    unlocked: true,
  },
  {
    id: 'bg-gradient',
    name: 'Static Gradient',
    description: 'Smooth color gradient',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    animated: false,
    performance: 'light',
    unlocked: true,
  },
  {
    id: 'bg-animated-gradient',
    name: 'Animated Gradient',
    description: 'Flowing color gradients',
    preview: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
    animated: true,
    performance: 'medium',
    unlocked: true,
  },
  {
    id: 'bg-waves',
    name: 'Wave Motion',
    description: 'Undulating wave patterns',
    preview: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    animated: true,
    performance: 'medium',
    unlocked: false,
    unlockRequirement: 'Reach Level 15',
  },
  {
    id: 'bg-particles',
    name: 'Particle Web',
    description: 'Connected particle network',
    preview: 'radial-gradient(circle, #1e1e2e 0%, #0f0f11 100%)',
    animated: true,
    performance: 'heavy',
    unlocked: false,
    unlockRequirement: 'Reach Level 20',
  },
  {
    id: 'bg-aurora',
    name: 'Aurora Borealis',
    description: 'Northern lights effect',
    preview: 'linear-gradient(135deg, #00c6ff, #0072ff, #9333ea)',
    animated: true,
    performance: 'heavy',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
  },
  {
    id: 'bg-nebula',
    name: 'Space Nebula',
    description: 'Cosmic nebula clouds',
    preview: 'radial-gradient(circle, #8b5cf6, #6366f1, #1e1b4b)',
    animated: true,
    performance: 'heavy',
    unlocked: false,
    unlockRequirement: 'Reach Level 30',
  },
  {
    id: 'bg-mesh',
    name: 'Mesh Gradient',
    description: 'Modern mesh pattern',
    preview: 'radial-gradient(at 0% 0%, #667eea 0%, transparent 50%), radial-gradient(at 100% 100%, #764ba2 0%, transparent 50%)',
    animated: false,
    performance: 'light',
    unlocked: true,
  },
  {
    id: 'bg-grid',
    name: 'Cyber Grid',
    description: 'Animated grid lines',
    preview: '#0a0a0f',
    animated: true,
    performance: 'medium',
    unlocked: false,
    unlockRequirement: 'Complete Cyber Event',
  },
  {
    id: 'bg-holographic',
    name: 'Holographic',
    description: 'Iridescent hologram',
    preview: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb, #4facfe)',
    animated: true,
    performance: 'heavy',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
  },
];

const ANIMATION_SETS: AnimationSet[] = [
  {
    id: 'anim-instant',
    name: 'Instant',
    description: 'No animations, instant transitions',
    speed: 'instant',
    easing: 'linear',
    unlocked: true,
  },
  {
    id: 'anim-fast',
    name: 'Fast & Snappy',
    description: 'Quick 150ms animations',
    speed: 'fast',
    easing: 'ease-out',
    unlocked: true,
  },
  {
    id: 'anim-normal',
    name: 'Normal',
    description: 'Balanced 250ms animations',
    speed: 'normal',
    easing: 'ease-in-out',
    unlocked: true,
  },
  {
    id: 'anim-smooth',
    name: 'Smooth',
    description: 'Polished 350ms animations',
    speed: 'smooth',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    unlocked: true,
  },
  {
    id: 'anim-bouncy',
    name: 'Bouncy',
    description: 'Spring physics with bounce',
    speed: 'normal',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    unlocked: false,
    unlockRequirement: 'Reach Level 10',
  },
  {
    id: 'anim-elastic',
    name: 'Elastic',
    description: 'Elastic overshoot effect',
    speed: 'smooth',
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    unlocked: false,
    unlockRequirement: 'Reach Level 15',
  },
  {
    id: 'anim-cinematic',
    name: 'Cinematic',
    description: 'Slow dramatic 500ms',
    speed: 'slow',
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
  },
  {
    id: 'anim-gaming',
    name: 'Gaming',
    description: 'Ultra-fast 100ms for gaming',
    speed: 'fast',
    easing: 'linear',
    unlocked: false,
    unlockRequirement: 'Win 100 PvP Matches',
  },
];

// ==================== MAIN COMPONENT ====================

export default function EffectsCustomization() {
  const [activeCategory, setActiveCategory] = useState<EffectCategory>('particles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticle, setSelectedParticle] = useState<string>('particle-none');
  const [selectedBackground, setSelectedBackground] = useState<string>('bg-solid');
  const [selectedAnimation, setSelectedAnimation] = useState<string>('anim-normal');

  const categories = [
    { id: 'particles' as EffectCategory, label: 'Particle Effects', icon: SparklesIcon, count: PARTICLE_EFFECTS.length },
    { id: 'backgrounds' as EffectCategory, label: 'Background Effects', icon: PhotoIcon, count: BACKGROUND_EFFECTS.length },
    { id: 'animations' as EffectCategory, label: 'UI Animations', icon: BeakerIcon, count: ANIMATION_SETS.length },
  ];

  // Filter items by search
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase();
    if (activeCategory === 'particles') {
      return PARTICLE_EFFECTS.filter((item) =>
        item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    } else if (activeCategory === 'backgrounds') {
      return BACKGROUND_EFFECTS.filter((item) =>
        item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    } else {
      return ANIMATION_SETS.filter((item) =>
        item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {category.label}
              <span className="text-xs opacity-60">({category.count})</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeCategory}...`}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeCategory === 'particles' && (
            <ParticleEffectsSection
              particles={filteredItems as ParticleEffect[]}
              selectedParticle={selectedParticle}
              onSelect={setSelectedParticle}
            />
          )}

          {activeCategory === 'backgrounds' && (
            <BackgroundEffectsSection
              backgrounds={filteredItems as BackgroundEffect[]}
              selectedBackground={selectedBackground}
              onSelect={setSelectedBackground}
            />
          )}

          {activeCategory === 'animations' && (
            <AnimationSetsSection
              animations={filteredItems as AnimationSet[]}
              selectedAnimation={selectedAnimation}
              onSelect={setSelectedAnimation}
            />
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-white/60">
              No effects found matching your search.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg shadow-primary-500/25">
          Save Effects Settings
        </button>
      </div>
    </div>
  );
}

// ==================== SECTION COMPONENTS ====================

interface ParticleEffectsSectionProps {
  particles: ParticleEffect[];
  selectedParticle: string;
  onSelect: (id: string) => void;
}

function ParticleEffectsSection({ particles, selectedParticle, onSelect }: ParticleEffectsSectionProps) {
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
      {particles.map((particle, index) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant={particle.unlocked ? (selectedParticle === particle.id ? 'neon' : 'crystal') : 'frost'}
            glow={selectedParticle === particle.id}
            glowColor={selectedParticle === particle.id ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative p-4 transition-all ${
              particle.unlocked ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => particle.unlocked && onSelect(particle.id)}
          >
            {/* Particle Preview */}
            <div className="h-32 rounded-lg bg-gradient-to-br from-dark-700 to-dark-800 mb-3 relative overflow-hidden">
              {/* Animated particle simulation */}
              {particle.type === 'snow' && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      animate={{
                        y: ['-10%', '110%'],
                        x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                        opacity: [0.3, 0.7, 0.3],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </>
              )}
              {particle.type === 'stars' && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{
                        top: Math.random() * 100 + '%',
                        left: Math.random() * 100 + '%',
                      }}
                      animate={{
                        opacity: [0.2, 1, 0.2],
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </>
              )}
              {particle.type === 'bubbles' && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border-2 border-white/30"
                      style={{
                        width: 20 + Math.random() * 20,
                        height: 20 + Math.random() * 20,
                        left: Math.random() * 80 + '%',
                      }}
                      animate={{
                        y: ['110%', '-10%'],
                      }}
                      transition={{
                        duration: 4 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                      }}
                    />
                  ))}
                </>
              )}
              {particle.type === 'sparkles' && (
                <>
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-yellow-300"
                      style={{
                        top: Math.random() * 100 + '%',
                        left: Math.random() * 100 + '%',
                        fontSize: 8 + Math.random() * 8,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        rotate: [0, 180],
                      }}
                      transition={{
                        duration: 1 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    >
                      ✨
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Premium Badge */}
            {particle.isPremium && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-xs font-bold text-white">
                PRO
              </div>
            )}

            {/* Particle Name */}
            <h4 className="text-sm font-semibold text-white mb-1">{particle.name}</h4>

            {/* Description */}
            <p className="text-xs text-white/60 mb-2">{particle.description}</p>

            {/* Performance Indicator */}
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-white/60">Performance:</span>
              <span className={`font-medium ${getPerformanceColor(particle.performance)}`}>
                {particle.performance.toUpperCase()}
              </span>
            </div>

            {/* Status */}
            {particle.unlocked ? (
              selectedParticle === particle.id ? (
                <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
                  <CheckCircleIconSolid className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Active</span>
                </div>
              ) : (
                <button className="w-full px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium transition-colors">
                  Apply
                </button>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                <LockClosedIcon className="h-8 w-8 text-white/40 mb-2" />
                <p className="text-xs text-white/60 text-center px-2">{particle.unlockRequirement}</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

interface BackgroundEffectsSectionProps {
  backgrounds: BackgroundEffect[];
  selectedBackground: string;
  onSelect: (id: string) => void;
}

function BackgroundEffectsSection({ backgrounds, selectedBackground, onSelect }: BackgroundEffectsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {backgrounds.map((bg, index) => (
        <motion.div
          key={bg.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.04 }}
        >
          <GlassCard
            variant={bg.unlocked ? (selectedBackground === bg.id ? 'neon' : 'crystal') : 'frost'}
            glow={selectedBackground === bg.id}
            glowColor={selectedBackground === bg.id ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative p-4 transition-all ${
              bg.unlocked ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => bg.unlocked && onSelect(bg.id)}
          >
            {/* Background Preview */}
            <motion.div
              className="h-40 rounded-lg mb-3 relative overflow-hidden"
              style={{ background: bg.preview }}
              animate={
                bg.animated
                  ? {
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }
                  : {}
              }
              transition={bg.animated ? { duration: 10, repeat: Infinity } : {}}
            >
              {bg.animated && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-xs text-white">
                  Animated
                </div>
              )}
            </motion.div>

            {/* Background Name */}
            <h4 className="text-sm font-semibold text-white mb-1">{bg.name}</h4>

            {/* Description */}
            <p className="text-xs text-white/60 mb-2">{bg.description}</p>

            {/* Performance */}
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-white/60">Performance:</span>
              <span className={`font-medium ${bg.performance === 'light' ? 'text-green-400' : bg.performance === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                {bg.performance.toUpperCase()}
              </span>
            </div>

            {/* Status */}
            {bg.unlocked ? (
              selectedBackground === bg.id ? (
                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                  <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Active</span>
                </div>
              ) : (
                <button className="w-full px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors">
                  Apply
                </button>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                <LockClosedIcon className="h-8 w-8 text-white/40 mb-2" />
                <p className="text-xs text-white/60 text-center px-2">{bg.unlockRequirement}</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

interface AnimationSetsSectionProps {
  animations: AnimationSet[];
  selectedAnimation: string;
  onSelect: (id: string) => void;
}

function AnimationSetsSection({ animations, selectedAnimation, onSelect }: AnimationSetsSectionProps) {
  return (
    <div className="space-y-3">
      {animations.map((anim, index) => (
        <motion.div
          key={anim.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant={anim.unlocked ? (selectedAnimation === anim.id ? 'neon' : 'crystal') : 'frost'}
            glow={selectedAnimation === anim.id}
            glowColor={selectedAnimation === anim.id ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative p-4 transition-all ${
              anim.unlocked ? 'cursor-pointer hover:scale-[1.01]' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => anim.unlocked && onSelect(anim.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-base font-bold text-white mb-1">{anim.name}</h4>
                <p className="text-sm text-white/60 mb-2">{anim.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-white/60">
                    Speed: <span className="text-primary-400 font-medium">{anim.speed}</span>
                  </span>
                  <span className="text-white/60">
                    Easing: <span className="text-primary-400 font-medium">{anim.easing}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Animation Preview */}
                <div className="w-32 h-16 bg-dark-800 rounded-lg flex items-center justify-center overflow-hidden">
                  <motion.div
                    className="w-8 h-8 rounded-lg bg-primary-600"
                    animate={{ x: [-20, 20, -20] }}
                    transition={{
                      duration: anim.speed === 'instant' ? 0 : anim.speed === 'fast' ? 0.3 : anim.speed === 'normal' ? 0.5 : anim.speed === 'smooth' ? 0.7 : 1,
                      ease: anim.easing,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  />
                </div>

                {/* Status Button */}
                {anim.unlocked ? (
                  selectedAnimation === anim.id ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                      <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Active</span>
                    </div>
                  ) : (
                    <button className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors">
                      Apply
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                    <LockClosedIcon className="h-5 w-5 text-white/40" />
                    <span className="text-sm text-white/60">{anim.unlockRequirement}</span>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
