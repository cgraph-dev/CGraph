/**
 * Security Section
 *
 * Showcases CGraph's privacy-first approach with E2E encryption,
 * secure protocols, and security feature highlights.
 *
 * @since Phase 4 - Landing Page Enhancement
 */

import { motion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';

interface SecurityFeature {
  icon: string;
  title: string;
  desc: string;
}

const securityFeatures: SecurityFeature[] = [
  {
    icon: '🔒',
    title: 'End-to-End Encrypted',
    desc: 'AES-256-GCM. Your device encrypts, their device decrypts.',
  },
  {
    icon: '🛡️',
    title: 'Triple Ratchet',
    desc: 'Post-quantum protocol based on Signal Rev 4',
  },
  {
    icon: '🔐',
    title: 'Zero Access',
    desc: "We store ciphertext. We can't read it.",
  },
  {
    icon: '🔑',
    title: 'Post-Quantum Ready',
    desc: 'ML-KEM-768 hybrid key exchange',
  },
];

interface AnimatedSecurityIconProps {
  feature: SecurityFeature;
  index: number;
}

function AnimatedSecurityIcon({ feature, index }: AnimatedSecurityIconProps) {
  return (
    <motion.div
      className="about__icon-card"
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.1 * index,
      }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <div className="about__icon-emoji">{feature.icon}</div>
      <h3 className="about__icon-title">{feature.title}</h3>
      <p className="about__icon-desc">{feature.desc}</p>
    </motion.div>
  );
}

export function Security() {
  return (
    <section id="security" className="about about--centered zoom-section">
      <div className="about__container about__container--centered">
        {/* Header */}
        <motion.div
          className="about__content about__content--centered"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <SectionHeader
            badge="Privacy-First"
            badgeVariant="purple"
            title="Your Privacy Is Our"
            titleAccent="Priority"
            titleAccentClass="title-fx--air"
            description="Messages are encrypted on your device with AES-256-GCM before they leave. Key exchange uses PQXDH + Triple Ratchet — a post-quantum hybrid based on Signal Protocol Revision 4. The server only ever sees ciphertext."
          />
        </motion.div>

        {/* Security features grid */}
        <motion.div
          className="about__visual about__visual--centered"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <div className="about__orb" />
          <div className="about__icon-grid">
            {securityFeatures.map((feature, i) => (
              <AnimatedSecurityIcon key={i} feature={feature} index={i} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
