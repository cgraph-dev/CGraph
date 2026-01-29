import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  PhotoIcon,
  BeakerIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// Reserved for future use
const _reservedIcons = { CheckCircleIcon };
void _reservedIcons;
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/authStore';
import { useCustomizationStore } from '@/stores/customizationStore';
import { useCustomizationStoreV2, type EffectPreset } from '@/stores/customizationStoreV2';
import { usePrefersReducedMotion } from '@/hooks';
import toast from 'react-hot-toast';

// Mapping from V1 particle IDs to V2 EffectPreset
const PARTICLE_ID_TO_V2_EFFECT: Record<string, EffectPreset> = {
  'particle-none': 'minimal',
  'particle-snow': 'glassmorphism',
  'particle-confetti': 'neon',
  'particle-stars': 'aurora',
  'particle-bubbles': 'glassmorphism',
  'particle-aurora': 'aurora',
  'particle-neon': 'neon',
  'particle-matrix': 'cyberpunk',
  'particle-cyber': 'cyberpunk',
  'particle-hologram': 'holographic',
  'particle-fire': 'neon',
  'particle-storm': 'aurora',
};

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
    unlockRequirement: "Valentine's Event",
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
    preview:
      'radial-gradient(at 0% 0%, #667eea 0%, transparent 50%), radial-gradient(at 100% 100%, #764ba2 0%, transparent 50%)',
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

// ==================== PARTICLE PREVIEW COMPONENT ====================
// Optimized component that only animates particles when shouldAnimate is true
// This prevents 100+ concurrent animations that cause performance issues

interface ParticlePreviewProps {
  type: string;
  shouldAnimate: boolean;
}

// Type definitions for particle data variants
interface BaseParticle {
  id: number;
  delay: number;
  duration: number;
}

interface SnowParticle extends BaseParticle {
  startX: number;
  endX: number;
}

interface StarsParticle extends BaseParticle {
  top: number;
  left: number;
}

interface BubblesParticle extends BaseParticle {
  size: number;
  left: number;
}

interface SparklesParticle extends BaseParticle {
  top: number;
  left: number;
  fontSize: number;
}

interface ConfettiParticle extends BaseParticle {
  left: number;
  color: string;
}

interface FirefliesParticle extends BaseParticle {
  top: number;
  left: number;
}

const ParticlePreview = memo(function ParticlePreview({
  type,
  shouldAnimate,
}: ParticlePreviewProps) {
  // Memoize particle positions to prevent recalculation on re-render
  const snowData = useMemo(
    (): SnowParticle[] =>
      type === 'snow'
        ? Array.from({ length: 8 }, (_, i) => ({
            id: i,
            startX: Math.random() * 100,
            endX: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
          }))
        : [],
    [type]
  );

  const starsData = useMemo(
    (): StarsParticle[] =>
      type === 'stars'
        ? Array.from({ length: 12 }, (_, i) => ({
            id: i,
            top: Math.random() * 100,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 2 + Math.random(),
          }))
        : [],
    [type]
  );

  const bubblesData = useMemo(
    (): BubblesParticle[] =>
      type === 'bubbles'
        ? Array.from({ length: 6 }, (_, i) => ({
            id: i,
            size: 20 + Math.random() * 20,
            left: Math.random() * 80,
            delay: Math.random() * 3,
            duration: 4 + Math.random() * 2,
          }))
        : [],
    [type]
  );

  const sparklesData = useMemo(
    (): SparklesParticle[] =>
      type === 'sparkles'
        ? Array.from({ length: 10 }, (_, i) => ({
            id: i,
            top: Math.random() * 100,
            left: Math.random() * 100,
            fontSize: 8 + Math.random() * 8,
            delay: Math.random() * 2,
            duration: 1 + Math.random(),
          }))
        : [],
    [type]
  );

  const confettiData = useMemo((): ConfettiParticle[] => {
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899'] as const;
    return type === 'confetti'
      ? Array.from({ length: 10 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          color: colors[i % colors.length]!,
          delay: Math.random() * 2,
          duration: 2 + Math.random() * 2,
        }))
      : [];
  }, [type]);

  const firefliesData = useMemo(
    (): FirefliesParticle[] =>
      type === 'fireflies'
        ? Array.from({ length: 8 }, (_, i) => ({
            id: i,
            top: Math.random() * 100,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
          }))
        : [],
    [type]
  );

  // GPU layer promotion styles for better performance
  const gpuStyles = {
    willChange: shouldAnimate ? 'transform, opacity' : 'auto',
    transform: 'translateZ(0)',
  } as const;

  if (type === 'none') {
    return (
      <div className="flex h-full items-center justify-center text-xs text-white/40">
        No particles
      </div>
    );
  }

  if (type === 'snow') {
    return (
      <>
        {snowData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{ ...gpuStyles, left: `${p.startX}%` }}
            animate={
              shouldAnimate
                ? {
                    y: ['-10%', '110%'],
                    x: [`${p.startX}%`, `${p.endX}%`],
                    opacity: [0.3, 0.7, 0.3],
                  }
                : { y: '50%', opacity: 0.5 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  if (type === 'stars') {
    return (
      <>
        {starsData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{ ...gpuStyles, top: `${p.top}%`, left: `${p.left}%` }}
            animate={
              shouldAnimate
                ? { opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }
                : { opacity: 0.5, scale: 1 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  if (type === 'bubbles') {
    return (
      <>
        {bubblesData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full border-2 border-white/30"
            style={{
              ...gpuStyles,
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
            }}
            animate={shouldAnimate ? { y: ['110%', '-10%'] } : { y: '50%' }}
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  if (type === 'sparkles') {
    return (
      <>
        {sparklesData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute text-yellow-300"
            style={{
              ...gpuStyles,
              top: `${p.top}%`,
              left: `${p.left}%`,
              fontSize: p.fontSize,
            }}
            animate={
              shouldAnimate
                ? { opacity: [0, 1, 0], scale: [0, 1.5, 0], rotate: [0, 180] }
                : { opacity: 0.5, scale: 1, rotate: 0 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          >
            ✨
          </motion.div>
        ))}
      </>
    );
  }

  if (type === 'confetti') {
    return (
      <>
        {confettiData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-2 w-2 rounded-sm"
            style={{
              ...gpuStyles,
              left: `${p.left}%`,
              backgroundColor: p.color,
            }}
            animate={
              shouldAnimate
                ? {
                    y: ['-10%', '110%'],
                    rotate: [0, 360],
                    opacity: [1, 0.5],
                  }
                : { y: '50%', rotate: 0, opacity: 0.5 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  if (type === 'fireflies') {
    return (
      <>
        {firefliesData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-2 w-2 rounded-full bg-yellow-400"
            style={{
              ...gpuStyles,
              top: `${p.top}%`,
              left: `${p.left}%`,
              boxShadow: shouldAnimate ? '0 0 8px #facc15, 0 0 16px #facc15' : 'none',
            }}
            animate={
              shouldAnimate
                ? {
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                    x: [0, 10, -10, 0],
                    y: [0, -10, 5, 0],
                  }
                : { opacity: 0.5, scale: 1 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  // Default fallback for other particle types - show a static preview
  return (
    <div className="flex h-full items-center justify-center">
      <SparklesIcon className="h-8 w-8 text-white/30" />
    </div>
  );
});

// ==================== MAIN COMPONENT ====================

export default function EffectsCustomization() {
  const { user } = useAuthStore();
  const {
    particleEffect,
    backgroundEffect,
    animationSpeed,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    updateEffects,
  } = useCustomizationStore();

  // V2 store for live preview sync
  const { setEffect, updateSettings, setAnimationSpeed } = useCustomizationStoreV2();

  const [activeCategory, setActiveCategory] = useState<EffectCategory>('particles');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingLockedItem, setPreviewingLockedItem] = useState<string | null>(null);

  // Sync particle effect to V2 store for live preview
  const syncParticleToV2 = useCallback(
    (particleId: string) => {
      const v2Effect = PARTICLE_ID_TO_V2_EFFECT[particleId] || 'minimal';
      setEffect(v2Effect);
      // Use updateSettings instead of toggle to prevent infinite loop
      updateSettings({ particlesEnabled: particleId !== 'particle-none' });
    },
    [setEffect, updateSettings]
  );

  // Sync background effect to V2 store for live preview
  const syncBackgroundToV2 = useCallback(
    (bgId: string) => {
      // Background effects map to animated background - use updateSettings instead of toggle
      const isAnimated = BACKGROUND_EFFECTS.find((bg) => bg.id === bgId)?.animated || false;
      updateSettings({ animatedBackground: isAnimated });
    },
    [updateSettings]
  );

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Sync current selection to V2 store on mount
  useEffect(() => {
    if (particleEffect) {
      const v2Effect = PARTICLE_ID_TO_V2_EFFECT[particleEffect] || 'minimal';
      setEffect(v2Effect);
    }
  }, [particleEffect, setEffect]);

  // Handle preview for locked items
  const handlePreviewItem = (
    category: 'particle' | 'background' | 'animation',
    id: string,
    isUnlocked: boolean
  ) => {
    if (category === 'particle') {
      updateEffects('particleEffect', id);
      syncParticleToV2(id);
      if (!isUnlocked) {
        setPreviewingLockedItem(id);
      } else {
        setPreviewingLockedItem(null);
      }
    } else if (category === 'background') {
      updateEffects('backgroundEffect', id);
      syncBackgroundToV2(id);
      if (!isUnlocked) {
        setPreviewingLockedItem(id);
      } else {
        setPreviewingLockedItem(null);
      }
    } else {
      // For animations, extract the speed value from the animation set
      const animation = ANIMATION_SETS.find((a) => a.id === id);
      const speedValue = animation?.speed || 'normal';
      updateEffects('animationSpeed', speedValue);
      // Also update V2 store directly for immediate preview
      setAnimationSpeed(speedValue as 'slow' | 'normal' | 'fast');
      if (!isUnlocked) {
        setPreviewingLockedItem(id);
      } else {
        setPreviewingLockedItem(null);
      }
    }
  };

  const handleSaveEffectsSettings = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Block save if previewing a locked item
    if (previewingLockedItem) {
      toast.error('Please purchase premium to save this effect, or select an unlocked item.');
      return;
    }

    try {
      await saveCustomizations(user.id);
      toast.success('Effects settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save effects settings');
    }
  };

  const categories = [
    {
      id: 'particles' as EffectCategory,
      label: 'Particle Effects',
      icon: SparklesIcon,
      count: PARTICLE_EFFECTS.length,
    },
    {
      id: 'backgrounds' as EffectCategory,
      label: 'Background Effects',
      icon: PhotoIcon,
      count: BACKGROUND_EFFECTS.length,
    },
    {
      id: 'animations' as EffectCategory,
      label: 'UI Animations',
      icon: BeakerIcon,
      count: ANIMATION_SETS.length,
    },
  ];

  // Filter items by search
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase();
    if (activeCategory === 'particles') {
      return PARTICLE_EFFECTS.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    } else if (activeCategory === 'backgrounds') {
      return BACKGROUND_EFFECTS.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    } else {
      return ANIMATION_SETS.filter(
        (item) =>
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
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
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
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeCategory}...`}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
              selectedParticle={particleEffect ?? 'particle-none'}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('particle', id, isUnlocked)}
            />
          )}

          {activeCategory === 'backgrounds' && (
            <BackgroundEffectsSection
              backgrounds={filteredItems as BackgroundEffect[]}
              selectedBackground={backgroundEffect ?? 'bg-none'}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('background', id, isUnlocked)}
            />
          )}

          {activeCategory === 'animations' && (
            <AnimationSetsSection
              animations={filteredItems as AnimationSet[]}
              selectedAnimation={animationSpeed}
              previewingLockedItem={previewingLockedItem}
              onSelect={(id, isUnlocked) => handlePreviewItem('animation', id, isUnlocked)}
            />
          )}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-white/60">
              No effects found matching your search.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={handleSaveEffectsSettings}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:from-primary-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Effects Settings'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

// ==================== SECTION COMPONENTS ====================

interface ParticleEffectsSectionProps {
  particles: ParticleEffect[];
  selectedParticle: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

function ParticleEffectsSection({
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
                {/* Animated particle simulation - conditionally animated */}
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

interface BackgroundEffectsSectionProps {
  backgrounds: BackgroundEffect[];
  selectedBackground: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

function BackgroundEffectsSection({
  backgrounds,
  selectedBackground,
  previewingLockedItem,
  onSelect,
}: BackgroundEffectsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {backgrounds.map((bg, index) => {
        const isPreviewing = previewingLockedItem === bg.id;
        return (
          <motion.div
            key={bg.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
          >
            <GlassCard
              variant={
                selectedBackground === bg.id || isPreviewing
                  ? 'neon'
                  : bg.unlocked
                    ? 'crystal'
                    : 'frosted'
              }
              glow={selectedBackground === bg.id || isPreviewing}
              glowColor={
                isPreviewing
                  ? 'rgba(234, 179, 8, 0.4)'
                  : selectedBackground === bg.id
                    ? 'rgba(139, 92, 246, 0.3)'
                    : undefined
              }
              className={`relative cursor-pointer p-4 transition-all hover:scale-[1.02] ${
                isPreviewing ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => onSelect(bg.id, bg.unlocked)}
            >
              {/* Background Preview */}
              <motion.div
                className="relative mb-3 h-40 overflow-hidden rounded-lg"
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
                  <div className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                    Animated
                  </div>
                )}
              </motion.div>

              {/* Background Name */}
              <h4 className="mb-1 text-sm font-semibold text-white">{bg.name}</h4>

              {/* Description */}
              <p className="mb-2 text-xs text-white/60">{bg.description}</p>

              {/* Performance */}
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-white/60">Performance:</span>
                <span
                  className={`font-medium ${bg.performance === 'light' ? 'text-green-400' : bg.performance === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}
                >
                  {bg.performance.toUpperCase()}
                </span>
              </div>

              {/* Status */}
              {bg.unlocked ? (
                selectedBackground === bg.id ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2">
                    <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Active</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(bg.id, bg.unlocked);
                    }}
                    className="w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    Apply
                  </button>
                )
              ) : isPreviewing ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-3 py-2">
                  <EyeIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Previewing</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-1">
                    <LockClosedIcon className="h-4 w-4 text-white/40" />
                    <span className="text-xs text-white/60">Click to Preview</span>
                  </div>
                  <p className="mt-1 text-center text-xs text-white/40">{bg.unlockRequirement}</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}

interface AnimationSetsSectionProps {
  animations: AnimationSet[];
  selectedAnimation: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

function AnimationSetsSection({
  animations,
  selectedAnimation,
  previewingLockedItem,
  onSelect,
}: AnimationSetsSectionProps) {
  return (
    <div className="space-y-3">
      {animations.map((anim, index) => {
        const isPreviewing = previewingLockedItem === anim.id;
        return (
          <motion.div
            key={anim.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <GlassCard
              variant={
                selectedAnimation === anim.speed || isPreviewing
                  ? 'neon'
                  : anim.unlocked
                    ? 'crystal'
                    : 'frosted'
              }
              glow={selectedAnimation === anim.speed || isPreviewing}
              glowColor={
                isPreviewing
                  ? 'rgba(234, 179, 8, 0.4)'
                  : selectedAnimation === anim.speed
                    ? 'rgba(139, 92, 246, 0.3)'
                    : undefined
              }
              className={`relative cursor-pointer p-4 transition-all hover:scale-[1.01] ${
                isPreviewing ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => onSelect(anim.id, anim.unlocked)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="mb-1 text-base font-bold text-white">{anim.name}</h4>
                  <p className="mb-2 text-sm text-white/60">{anim.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-white/60">
                      Speed: <span className="font-medium text-primary-400">{anim.speed}</span>
                    </span>
                    <span className="text-white/60">
                      Easing: <span className="font-medium text-primary-400">{anim.easing}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Animation Preview */}
                  <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-lg bg-dark-800">
                    <motion.div
                      className="h-8 w-8 rounded-lg bg-primary-600"
                      animate={{ x: [-20, 20, -20] }}
                      transition={{
                        duration:
                          anim.speed === 'instant'
                            ? 0
                            : anim.speed === 'fast'
                              ? 0.3
                              : anim.speed === 'normal'
                                ? 0.5
                                : anim.speed === 'smooth'
                                  ? 0.7
                                  : 1,
                        ease: anim.easing as import('framer-motion').Easing,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                    />
                  </div>

                  {/* Status Button */}
                  {anim.unlocked ? (
                    selectedAnimation === anim.speed ? (
                      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2">
                        <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Active</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(anim.id, anim.unlocked);
                        }}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                      >
                        Apply
                      </button>
                    )
                  ) : isPreviewing ? (
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-4 py-2">
                      <EyeIcon className="h-5 w-5 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">Previewing</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                      <LockClosedIcon className="h-5 w-5 text-white/40" />
                      <span className="text-sm text-white/60">Click to Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}
