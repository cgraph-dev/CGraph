/**
 * CTA Section
 *
 * Final call-to-action section encouraging users to create an account.
 * Features emerald-purple gradient buttons and minimalist design.
 *
 * @since Phase 4 - Landing Page Enhancement
 */

import { motion, Variants } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { LandingButton } from '../ui/LandingButton';

const WEB_APP_URL = 'https://web.cgraph.org';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

interface CTAProps {
  prefersReduced?: boolean;
}

export function CTA({ prefersReduced = false }: CTAProps) {
  return (
    <section className="cta zoom-section">
      <motion.div
        className="cta__content"
        variants={prefersReduced ? undefined : staggerContainer}
        initial={prefersReduced ? undefined : 'hidden'}
        whileInView={prefersReduced ? undefined : 'visible'}
        viewport={{ once: true, margin: '-60px' }}
      >
        <motion.div variants={staggerItem}>
          <SectionHeader
            badge="Ready to Start?"
            badgeVariant="emerald"
            title="Build Your"
            titleAccent="Community"
            titleAccentClass="title-fx--air"
            description="Create forums, customize your space, and connect with like-minded people."
          />
        </motion.div>

        <motion.div variants={staggerItem} className="cta__buttons">
          <LandingButton variant="primary" href={`${WEB_APP_URL}/register`}>
            Create Account
          </LandingButton>
          <LandingButton
            variant="secondary"
            href={`${WEB_APP_URL}/login`}
            className="font-pixelify"
          >
            Sign In
          </LandingButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
