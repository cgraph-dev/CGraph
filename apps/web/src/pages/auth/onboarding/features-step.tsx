/**
 * FeaturesStep component - feature highlights tour
 */

import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from './animations';
import { FEATURES } from './constants';

/**
 * unknown for the auth module.
 */
/**
 * Features Step component.
 */
export function FeaturesStep() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.p variants={itemVariants} className="mb-8 text-center text-foreground-secondary">
        Here&apos;s what you can do with CGraph:
      </motion.p>
      <div className="grid grid-cols-2 gap-4">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            custom={index}
            className="group rounded-xl border border-dark-600 bg-dark-800/30 p-4 transition-all duration-200 hover:border-primary-500/50 hover:bg-dark-800/50"
          >
            <span className="text-2xl">{feature.icon}</span>
            <h4 className="mt-2 font-medium text-foreground transition-colors group-hover:text-primary-400">
              {feature.title}
            </h4>
            <p className="mt-1 text-xs text-foreground-muted">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
