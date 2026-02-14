import { motion } from 'framer-motion';
import { features } from '../../../data/landing-data';
import { SectionHeader } from '../ui/SectionHeader';
import { FeatureCard } from '../ui/FeatureCard';

// Stagger variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export const Features = () => {
  return (
    <section id="features" className="features zoom-section">
      <SectionHeader
        badge="Powerful Features"
        badgeVariant="orange"
        title="Everything You"
        titleAccent="Need"
        titleAccentClass="title-fx--fire"
        description="Build, customize, and grow your community with our comprehensive feature set."
      />

      <motion.div
        className="features__grid"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={staggerItem}>
            <FeatureCard {...feature} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
