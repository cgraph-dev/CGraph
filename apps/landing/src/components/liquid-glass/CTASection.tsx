/**
 * CTASection — Final call-to-action before footer.
 *
 * Glass card with gradient glow, headline, and dual CTAs.
 */
import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';
import { cn, springPreset, springGentle } from './shared';
import { WEB_APP_URL } from '@/constants';

export function CTASection() {
  return (
    <section className="relative px-6 py-24 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={springGentle}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] p-12 sm:p-16"
      >
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-glow-blue/10 via-glow-purple/10 to-glow-pink/10"
        />
        <div aria-hidden className="glass-surface pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-glow-purple/30 to-glow-pink/30">
            <Shield className="h-7 w-7 text-slate-700" strokeWidth={1.8} />
          </div>

          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ready for truly private communication?
          </h2>

          <p className="max-w-lg text-lg text-slate-500">
            Join thousands who chose CGraph for post-quantum encrypted messaging, forums, and
            communities.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <motion.a
              href={`${WEB_APP_URL}/register`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={springPreset}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold',
                'bg-gradient-to-r from-glow-blue via-glow-purple to-glow-pink text-white shadow-glass-lg',
                'transition-shadow hover:shadow-glass-xl'
              )}
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </motion.a>

            <motion.a
              href="#pricing"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={springPreset}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold',
                'glass-surface text-slate-700 shadow-glass',
                'transition-shadow hover:shadow-glass-lg'
              )}
            >
              View Plans
            </motion.a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
