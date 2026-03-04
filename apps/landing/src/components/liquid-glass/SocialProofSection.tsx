/**
 * SocialProofSection — Liquid Glass social proof with testimonials + stats.
 *
 * Top row: key metrics in glass cards. Bottom: testimonial quotes in glass cards.
 */
import { motion } from 'framer-motion';
import { Users, MessageCircle, Shield, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn, springPreset, staggerContainer, staggerItem } from './shared';

/* ── Stats data ──────────────────────────────────────────────────────────── */
interface Stat {
  Icon: LucideIcon;
  value: string;
  label: string;
  glow: string;
}

const stats: Stat[] = [
  {
    Icon: Users,
    value: '10K+',
    label: 'Active Users',
    glow: 'from-glow-blue/30 to-glow-purple/30',
  },
  {
    Icon: MessageCircle,
    value: '2M+',
    label: 'Messages Sent',
    glow: 'from-glow-purple/30 to-glow-pink/30',
  },
  {
    Icon: Shield,
    value: '100%',
    label: 'E2E Encrypted',
    glow: 'from-glow-green/30 to-glow-blue/30',
  },
  { Icon: Globe, value: '50+', label: 'Countries', glow: 'from-glow-pink/30 to-glow-purple/30' },
];

/* ── Testimonial data ────────────────────────────────────────────────────── */
interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "CGraph is the only platform where our community feels truly safe. The encryption isn't an afterthought — it's the foundation.",
    name: 'Sarah Chen',
    role: 'Community Manager',
    avatar: 'SC',
  },
  {
    quote:
      'We moved from Discord to CGraph and never looked back. Forums + chat + gamification in one place is a game changer.',
    name: 'Marcus Rivera',
    role: 'Creator & Streamer',
    avatar: 'MR',
  },
  {
    quote:
      'The fact that messages arrive in under 200ms while being post-quantum encrypted is genuinely impressive engineering.',
    name: 'Alex Ngyuen',
    role: 'Security Researcher',
    avatar: 'AN',
  },
];

/* ── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ stat }: { stat: Stat }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -3, scale: 1.03 }}
      transition={springPreset}
      className="glass-surface flex flex-col items-center gap-3 rounded-3xl p-6 text-center shadow-glass transition-shadow hover:shadow-glass-lg"
    >
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br',
          stat.glow
        )}
      >
        <stat.Icon className="h-6 w-6 text-slate-700" strokeWidth={1.8} />
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
      <p className="text-sm text-slate-500">{stat.label}</p>
    </motion.div>
  );
}

/* ── Testimonial card ────────────────────────────────────────────────────── */
function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -3 }}
      transition={springPreset}
      className="glass-surface flex flex-col gap-4 rounded-3xl p-6 shadow-glass transition-shadow hover:shadow-glass-lg"
    >
      <p className="flex-1 text-sm italic leading-relaxed text-slate-600">"{t.quote}"</p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-glow-purple/40 to-glow-pink/40 text-xs font-bold text-slate-700">
          {t.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{t.name}</p>
          <p className="text-xs text-slate-400">{t.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Social proof section ────────────────────────────────────────────────── */
export function SocialProofSection() {
  return (
    <section id="social-proof" className="relative px-6 py-24 lg:px-12">
      {/* Header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={springPreset}
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-glow-purple"
        >
          Social Proof
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...springPreset, delay: 0.05 }}
          className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          Loved by communities worldwide
        </motion.h2>
      </div>

      {/* Stats row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="mx-auto mb-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4"
      >
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </motion.div>

      {/* Testimonials */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3"
      >
        {testimonials.map((t) => (
          <TestimonialCard key={t.name} t={t} />
        ))}
      </motion.div>
    </section>
  );
}
