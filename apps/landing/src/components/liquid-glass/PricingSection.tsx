/**
 * PricingSection — Liquid Glass pricing cards.
 *
 * Three-tier layout with monthly/annual toggle, glass-surface cards,
 * and a purple "Upgrade plan" CTA button on the highlighted Premium tier.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { cn, springPreset, springSnap, staggerContainer, staggerItem } from './shared';
import { pricingTiers } from '@/data/pricing-data';

/* ── Billing toggle ──────────────────────────────────────────────────────── */
function BillingToggle({ annual, onChange }: { annual: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className={cn('text-sm font-medium', !annual ? 'text-slate-800' : 'text-slate-400')}>
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={annual}
        onClick={() => onChange(!annual)}
        className={cn(
          'relative h-7 w-12 rounded-full transition-colors',
          annual ? 'bg-glow-purple' : 'bg-slate-200'
        )}
      >
        <motion.span
          layout
          transition={springSnap}
          className={cn(
            'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-glass',
            annual && 'translate-x-5'
          )}
        />
      </button>
      <span className={cn('text-sm font-medium', annual ? 'text-slate-800' : 'text-slate-400')}>
        Annual{' '}
        <span className="ml-1 rounded-full bg-glow-green/20 px-2 py-0.5 text-xs font-semibold text-green-700">
          Save 17%
        </span>
      </span>
    </div>
  );
}

/* ── Single pricing card ─────────────────────────────────────────────────── */
function PricingCard({ tier, annual }: { tier: (typeof pricingTiers)[number]; annual: boolean }) {
  const isHighlighted = tier.highlighted;
  const price = annual ? tier.annualPrice : tier.price;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={springPreset}
      className={cn(
        'relative flex flex-col rounded-3xl p-8',
        isHighlighted
          ? 'glass-elevated shadow-glass-xl ring-2 ring-glow-purple/40'
          : 'glass-surface shadow-glass hover:shadow-glass-lg',
        'transition-shadow'
      )}
    >
      {/* Popular badge */}
      {isHighlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-semibold',
              'bg-gradient-to-r from-glow-purple to-glow-pink text-white shadow-glass'
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            Most Popular
          </span>
        </div>
      )}

      {/* Tier name */}
      <p className="text-sm font-semibold uppercase tracking-wider text-glow-purple">{tier.name}</p>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${tier.name}-${annual}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springSnap}
            className="text-5xl font-extrabold tracking-tight text-slate-900"
          >
            ${price === 0 ? '0' : price.toFixed(2)}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-slate-400">/ mo</span>
      </div>

      <p className="mt-2 text-sm text-slate-500">{tier.description}</p>

      {/* Feature list */}
      <ul className="mt-8 flex flex-1 flex-col gap-3">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-glow-green" strokeWidth={2.5} />
            {feat}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <motion.a
        href={tier.ctaLink}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        transition={springPreset}
        className={cn(
          'mt-8 block w-full rounded-2xl py-3.5 text-center text-sm font-semibold',
          isHighlighted
            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-glass-lg hover:shadow-glass-xl'
            : 'glass-surface text-slate-700 shadow-glass hover:shadow-glass-lg',
          'transition-shadow'
        )}
      >
        {isHighlighted ? 'Upgrade plan' : tier.cta}
      </motion.a>
    </motion.div>
  );
}

/* ── Pricing section ─────────────────────────────────────────────────────── */
export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative px-6 py-24 lg:px-12">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={springPreset}
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-glow-purple"
        >
          Pricing
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...springPreset, delay: 0.05 }}
          className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          Simple, transparent pricing
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...springPreset, delay: 0.1 }}
          className="mt-4 text-lg text-slate-500"
        >
          Start free. Upgrade when you're ready.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...springPreset, delay: 0.15 }}
          className="mt-8"
        >
          <BillingToggle annual={annual} onChange={setAnnual} />
        </motion.div>
      </div>

      {/* Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3"
      >
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} annual={annual} />
        ))}
      </motion.div>
    </section>
  );
}
