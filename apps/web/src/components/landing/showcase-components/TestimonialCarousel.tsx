/**
 * TestimonialCarousel Component
 * Auto-playing testimonial carousel with navigation
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_INTERVAL } from './constants';
import type { TestimonialCarouselProps } from './types';

export function TestimonialCarousel({
  testimonials,
  className = '',
  autoPlay = true,
  interval = DEFAULT_INTERVAL,
}: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, testimonials.length]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <blockquote className="mb-6 text-2xl font-light italic text-gray-300">
            "{testimonials[current]?.quote}"
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            {testimonials[current]?.avatar && (
              <img
                src={testimonials[current]?.avatar}
                alt={testimonials[current]?.author}
                className="h-12 w-12 rounded-full"
              />
            )}
            <div className="text-left">
              <div className="font-semibold text-white">{testimonials[current]?.author}</div>
              <div className="text-sm text-gray-500">{testimonials[current]?.role}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="mt-8 flex justify-center gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index === current ? 'w-6 bg-emerald-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
}
