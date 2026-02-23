/**
 * Premium hero-style banner component.
 * @module
 */
import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components';
import { ANIMATED_FEATURES } from './constants';
import type { BannerVariantProps } from './types';

type HeroBannerProps = Pick<
  BannerVariantProps,
  | 'title'
  | 'description'
  | 'ctaText'
  | 'dismissible'
  | 'showPrice'
  | 'price'
  | 'originalPrice'
  | 'className'
  | 'activeFeatureIndex'
  | 'onUpgrade'
  | 'onDismiss'
>;

export function HeroBanner({
  title,
  description,
  ctaText,
  dismissible,
  showPrice,
  price,
  originalPrice,
  className,
  activeFeatureIndex,
  onUpgrade,
  onDismiss,
}: HeroBannerProps): React.ReactElement {
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-2xl ${className}`}
  >
    {/* Animated background */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
      <motion.div
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
        className="absolute inset-0 opacity-50"
        style={{
          background:
            'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>

    {/* Floating particles */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
          }}
          className="absolute h-2 w-2 rounded-full bg-white/30"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: -10,
          }}
        />
      ))}
    </div>

    {dismissible && (
      <button
        onClick={onDismiss}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 hover:bg-white/20"
      >
        <XMarkIcon className="h-5 w-5 text-white" />
      </button>
    )}

    <div className="relative p-8 text-center md:p-12">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="mb-6 inline-flex rounded-2xl bg-white/20 p-4"
      >
        <SparklesIcon className="h-10 w-10 text-white" />
      </motion.div>

      <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">{title}</h2>
      <p className="mx-auto mb-6 max-w-xl text-lg text-white/80">{description}</p>

      {/* Features carousel */}
      <div className="mb-8 flex flex-wrap justify-center gap-4">
        {ANIMATED_FEATURES.map((feature, index) => (
          <motion.div
            key={index}
            animate={{
              scale: activeFeatureIndex === index ? 1.1 : 1,
              opacity: activeFeatureIndex === index ? 1 : 0.6,
            }}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white"
          >
            {feature.icon}
            <span className="text-sm font-medium">{feature.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Pricing */}
      {showPrice && (
        <div className="mb-6">
          <div className="flex items-baseline justify-center gap-2">
            {originalPrice && (
              <span className="text-2xl text-white/50 line-through">${originalPrice}</span>
            )}
            <span className="text-5xl font-bold text-white">${price}</span>
            <span className="text-xl text-white/80">/month</span>
          </div>
          {originalPrice && (
            <p className="mt-2 text-sm text-green-300">
              Save ${(originalPrice - price).toFixed(2)} per month!
            </p>
          )}
        </div>
      )}

      <Button
        onClick={onUpgrade}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow-xl hover:bg-white/90"
      >
        <StarIcon className="h-6 w-6" />
        {ctaText}
      </Button>

      <p className="mt-4 text-sm text-white/60">Cancel anytime. No questions asked.</p>
    </div>
  </motion.div>
);
}
