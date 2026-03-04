/**
 * FeaturesSection — Liquid Glass feature cards grid.
 *
 * Replaces emoji icons with Lucide SVGs. 3-column staggered grid
 * with glass-surface cards and pastel iridescent icon backgrounds.
 */
import { motion } from 'framer-motion';
import {
  Shield,
  MessageSquare,
  Wallet,
  Crown,
  FileArchive,
  Phone,
  DollarSign,
  Star,
  Clock,
  Bot,
  Smartphone,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn, springPreset, staggerContainer, staggerItem } from './shared';
import { features } from '@/data/landing-data';

/* ── Map feature titles → Lucide icons + glow colors ─────────────────────── */
const iconMap: Record<string, { Icon: LucideIcon; glow: string }> = {
  'End-to-End Encrypted': { Icon: Shield, glow: 'from-glow-blue/30 to-glow-purple/30' },
  'Real-Time Forums': { Icon: MessageSquare, glow: 'from-glow-purple/30 to-glow-pink/30' },
  'Web3 / Wallet Login': { Icon: Wallet, glow: 'from-glow-green/30 to-glow-blue/30' },
  'Gamified Communities': { Icon: Crown, glow: 'from-glow-pink/30 to-glow-purple/30' },
  'Encrypted File Sharing': { Icon: FileArchive, glow: 'from-glow-blue/30 to-glow-green/30' },
  'Voice & Video Calls': { Icon: Phone, glow: 'from-glow-purple/30 to-glow-blue/30' },
  'Creator Monetization': { Icon: DollarSign, glow: 'from-glow-green/30 to-glow-blue/30' },
  'Premium Subscriptions': { Icon: Star, glow: 'from-glow-pink/30 to-glow-purple/30' },
  'Scheduled Messages & Rich Media': { Icon: Clock, glow: 'from-glow-blue/30 to-glow-pink/30' },
  'AI-Powered Moderation': { Icon: Bot, glow: 'from-glow-purple/30 to-glow-green/30' },
  'Mobile-First': { Icon: Smartphone, glow: 'from-glow-pink/30 to-glow-blue/30' },
  'Real-Time Search': { Icon: Search, glow: 'from-glow-green/30 to-glow-purple/30' },
};

/* ── Single feature card ─────────────────────────────────────────────────── */
function FeatureCard({ title, description }: { title: string; description: string }) {
  const mapping = iconMap[title] ?? { Icon: Shield, glow: 'from-glow-blue/30 to-glow-purple/30' };
  const { Icon, glow } = mapping;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={springPreset}
      className={cn(
        'group relative flex flex-col gap-4 rounded-3xl p-6',
        'glass-surface shadow-glass hover:shadow-glass-lg',
        'transition-shadow'
      )}
    >
      {/* Icon with glow background */}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl',
          'bg-gradient-to-br',
          glow
        )}
      >
        <Icon className="h-6 w-6 text-slate-700" strokeWidth={1.8} />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </motion.div>
  );
}

/* ── Features section ────────────────────────────────────────────────────── */
export function FeaturesSection() {
  return (
    <section id="features" className="relative px-6 py-24 lg:px-12">
      {/* Section header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={springPreset}
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-glow-purple"
        >
          Features
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...springPreset, delay: 0.05 }}
          className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          Everything you need, nothing you don't
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...springPreset, delay: 0.1 }}
          className="mt-4 text-lg text-slate-500"
        >
          Privacy, community, and performance — built from the ground up.
        </motion.p>
      </div>

      {/* Feature grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((f) => (
          <FeatureCard key={f.title} title={f.title} description={f.description} />
        ))}
      </motion.div>
    </section>
  );
}
