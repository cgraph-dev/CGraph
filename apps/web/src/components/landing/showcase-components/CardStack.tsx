/**
 * CardStack Component
 * Floating 3D card stack with interactive selection
 */

import { useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { CARD_SPRING_CONFIG, CARD_TRANSITION_SPRING } from './constants';
import type { Card3DProps, CardStackProps } from './types';

function Card3D({ children, index, total, isActive, onClick }: Card3DProps) {
  const offset = index - Math.floor(total / 2);
  const rotateY = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const scale = useMotionValue(1);

  const rotateYSpring = useSpring(rotateY, CARD_SPRING_CONFIG);
  const rotateXSpring = useSpring(rotateX, CARD_SPRING_CONFIG);
  const scaleSpring = useSpring(scale, CARD_SPRING_CONFIG);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * 20);
    rotateX.set(-y * 20);
    scale.set(1.05);
  };

  const handleMouseLeave = () => {
    rotateY.set(0);
    rotateX.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        perspective: 1200,
        zIndex: isActive ? 100 : total - Math.abs(offset),
      }}
      initial={{ x: offset * 80, rotateY: offset * -15, scale: 1 - Math.abs(offset) * 0.1 }}
      animate={{
        x: isActive ? 0 : offset * 80,
        y: isActive ? -20 : Math.abs(offset) * 10,
        rotateY: isActive ? rotateYSpring.get() : offset * -15,
        rotateX: isActive ? rotateXSpring.get() : 0,
        scale: isActive ? scaleSpring.get() : 1 - Math.abs(offset) * 0.1,
        opacity: 1 - Math.abs(offset) * 0.2,
      }}
      transition={{ type: 'spring', ...CARD_TRANSITION_SPRING }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative"
        style={{
          transformStyle: 'preserve-3d',
          transform: isActive ? undefined : `translateZ(${-Math.abs(offset) * 50}px)`,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function CardStack({ cards, className = '' }: CardStackProps) {
  const [activeIndex, setActiveIndex] = useState(Math.floor(cards.length / 2));

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ perspective: 1200 }}
    >
      <div className="relative h-[400px] w-full" style={{ transformStyle: 'preserve-3d' }}>
        {cards.map((card, index) => (
          <Card3D
            key={index}
            index={index}
            total={cards.length}
            isActive={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          >
            {card}
          </Card3D>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="absolute -bottom-12 flex gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index === activeIndex ? 'w-6 bg-emerald-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
