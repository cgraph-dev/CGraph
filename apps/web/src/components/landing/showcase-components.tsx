/**
 * Showcase Components for Landing Page
 *
 * Premium 3D cards, scroll-driven animations, and interactive showcases
 * that will impress any developer or designer.
 */

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView, AnimatePresence } from 'framer-motion';

// =============================================================================
// FLOATING 3D CARD STACK
// =============================================================================

interface Card3DProps {
  children: React.ReactNode;
  index: number;
  total: number;
  isActive: boolean;
  onClick: () => void;
}

function Card3D({ children, index, total, isActive, onClick }: Card3DProps) {
  const offset = index - Math.floor(total / 2);
  const rotateY = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const scale = useMotionValue(1);

  const springConfig = { stiffness: 300, damping: 30 };
  const rotateYSpring = useSpring(rotateY, springConfig);
  const rotateXSpring = useSpring(rotateX, springConfig);
  const scaleSpring = useSpring(scale, springConfig);

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
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
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

interface CardStackProps {
  cards: React.ReactNode[];
  className?: string;
}

export function CardStack({ cards, className = '' }: CardStackProps) {
  const [activeIndex, setActiveIndex] = useState(Math.floor(cards.length / 2));

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ perspective: 1200 }}>
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

// =============================================================================
// FLOATING FEATURE CARDS
// =============================================================================

interface FloatingCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  floatRange?: number;
  rotateRange?: number;
}

export function FloatingCard({
  children,
  delay = 0,
  className = '',
  floatRange = 20,
  rotateRange = 5,
}: FloatingCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, rotateX: 0, rotateY: 0 }}
      animate={{
        y: [0, -floatRange, 0],
        rotateX: [-rotateRange, rotateRange, -rotateRange],
        rotateY: [-rotateRange, rotateRange, -rotateRange],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// SCROLL-DRIVEN TIMELINE
// =============================================================================

interface TimelineItemProps {
  title: string;
  description: string;
  icon: string;
  index: number;
}

function TimelineItem({ title, description, icon, index }: TimelineItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className="relative flex gap-8"
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* Timeline line */}
      <div className="relative flex flex-col items-center">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl ring-2 ring-emerald-500"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
        >
          {icon}
        </motion.div>
        <motion.div
          className="mt-4 h-24 w-0.5 bg-gradient-to-b from-emerald-500 to-transparent"
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ originY: 0 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 pb-12">
        <motion.h3
          className="mb-2 text-xl font-bold text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {title}
        </motion.h3>
        <motion.p
          className="text-gray-400"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
}

interface ScrollTimelineProps {
  items: Array<{ title: string; description: string; icon: string }>;
  className?: string;
}

export function ScrollTimeline({ items, className = '' }: ScrollTimelineProps) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <TimelineItem key={index} {...item} index={index} />
      ))}
    </div>
  );
}

// =============================================================================
// HORIZONTAL SCROLL SHOWCASE
// =============================================================================

interface HorizontalScrollProps {
  children: React.ReactNode[];
  className?: string;
}

export function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', `-${(children.length - 1) * 100}%`]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height: `${children.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div className="flex" style={{ x }}>
          {children.map((child, index) => (
            <div key={index} className="flex h-screen w-screen flex-shrink-0 items-center justify-center px-8">
              {child}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// SCROLL PROGRESS INDICATOR
// =============================================================================

interface ScrollProgressProps {
  className?: string;
  color?: string;
}

export function ScrollProgress({ className = '', color = '#10b981' }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className={`fixed left-0 right-0 top-0 z-50 h-1 origin-left ${className}`}
      style={{ scaleX, backgroundColor: color }}
    />
  );
}

// =============================================================================
// REVEAL ON SCROLL CONTAINER
// =============================================================================

interface RevealContainerProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}

export function RevealContainer({
  children,
  className = '',
  direction = 'up',
  delay = 0,
}: RevealContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const directions = {
    up: { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={directions[direction]}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// SCROLL-TRIGGERED COUNTER
// =============================================================================

interface ScrollCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function ScrollCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
}: ScrollCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

// =============================================================================
// PARALLAX IMAGE
// =============================================================================

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
}

export function ParallaxImage({ src, alt, className = '', speed = 0.5 }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img src={src} alt={alt} className="h-full w-full object-cover" style={{ y }} />
    </div>
  );
}

// =============================================================================
// SPLIT TEXT ANIMATION
// =============================================================================

interface SplitTextProps {
  children: string;
  className?: string;
  type?: 'words' | 'chars';
  stagger?: number;
}

export function SplitText({ children, className = '', type = 'chars', stagger = 0.03 }: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const items = type === 'words' ? children.split(' ') : children.split('');

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {items.map((item, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{
            duration: 0.5,
            delay: index * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {item}
          {type === 'words' && index < items.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}

// =============================================================================
// MAGNETIC GRID
// =============================================================================

interface MagneticGridProps {
  children: React.ReactNode[];
  columns?: number;
  className?: string;
}

export function MagneticGrid({ children, columns = 3, className = '' }: MagneticGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`grid gap-6 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      onMouseMove={handleMouseMove}
    >
      {children.map((child, index) => (
        <MagneticGridItem key={index} mousePos={mousePos} containerRef={containerRef}>
          {child}
        </MagneticGridItem>
      ))}
    </div>
  );
}

interface MagneticGridItemProps {
  children: React.ReactNode;
  mousePos: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function MagneticGridItem({ children, mousePos }: MagneticGridItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const parentRect = itemRef.current.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const centerX = rect.left - parentRect.left + rect.width / 2;
    const centerY = rect.top - parentRect.top + rect.height / 2;

    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 200) {
      const force = (200 - dist) / 200;
      x.set(dx * force * 0.1);
      y.set(dy * force * 0.1);
    } else {
      x.set(0);
      y.set(0);
    }
  }, [mousePos, x, y]);

  return (
    <motion.div ref={itemRef} style={{ x: springX, y: springY }}>
      {children}
    </motion.div>
  );
}

// =============================================================================
// PERSPECTIVE TILT CONTAINER
// =============================================================================

interface PerspectiveTiltProps {
  children: React.ReactNode;
  className?: string;
  perspective?: number;
  maxTilt?: number;
}

export function PerspectiveTilt({
  children,
  className = '',
  perspective = 1000,
  maxTilt = 15,
}: PerspectiveTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 30 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * maxTilt);
    rotateY.set(x * maxTilt);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{
        perspective,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// ANIMATED TABS
// =============================================================================

interface AnimatedTabsProps {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  className?: string;
}

export function AnimatedTabs({ tabs, className = '' }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  return (
    <div className={className}>
      {/* Tab buttons */}
      <div className="relative mb-8 flex gap-2 rounded-lg bg-gray-800/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute inset-0 rounded-md bg-emerald-500/20"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// FEATURE BENTO GRID
// =============================================================================

interface BentoItem {
  title: string;
  description: string;
  icon: string;
  color: string;
  span?: 'normal' | 'wide' | 'tall';
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

export function BentoGrid({ items, className = '' }: BentoGridProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          className={`group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/50 ${
            item.span === 'wide' ? 'md:col-span-2' : item.span === 'tall' ? 'md:row-span-2' : ''
          }`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at center, ${item.color}20, transparent 70%)`,
            }}
          />

          <motion.span
            className="mb-4 block text-4xl"
            whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {item.icon}
          </motion.span>

          <h3 className="relative z-10 mb-2 text-lg font-semibold text-white">{item.title}</h3>
          <p className="relative z-10 text-sm text-gray-400">{item.description}</p>

          {/* Animated border on hover */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-500 to-cyan-500"
            whileHover={{ width: '100%' }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// =============================================================================
// TESTIMONIAL CAROUSEL
// =============================================================================

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

export function TestimonialCarousel({
  testimonials,
  className = '',
  autoPlay = true,
  interval = 5000,
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
