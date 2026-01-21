/**
 * Advanced Landing Page Effects
 *
 * Extraordinary visual effects that will amaze the best UI developers.
 * Includes: shader-like effects, 3D parallax, morphing animations,
 * cursor trails, text scramble, WebGL backgrounds, and more.
 */

import { useRef, useEffect, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useVelocity,
  useAnimationFrame,
  Variants,
} from 'framer-motion';

// =============================================================================
// NOISE & SHADER-LIKE EFFECTS
// =============================================================================

interface NoiseOverlayProps {
  opacity?: number;
  speed?: number;
  grain?: 'fine' | 'medium' | 'coarse';
}

export function NoiseOverlay({ opacity = 0.05, speed = 0.3, grain = 'medium' }: NoiseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grainSize = grain === 'fine' ? 1 : grain === 'medium' ? 2 : 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    // Frame counter reserved for future animation timing
    const _frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4 * grainSize) {
        const value = Math.random() * 255;
        for (let j = 0; j < grainSize; j++) {
          const idx = i + j * 4;
          if (idx < data.length) {
            data[idx] = value;
            data[idx + 1] = value;
            data[idx + 2] = value;
            data[idx + 3] = 255;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      frame++;
      animationId = requestAnimationFrame(generateNoise);
    };

    const interval = setInterval(
      () => {
        generateNoise();
      },
      1000 / (speed * 30)
    );

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      clearInterval(interval);
    };
  }, [speed, grainSize]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{ opacity }}
    />
  );
}

// =============================================================================
// CHROMATIC ABERRATION TEXT
// =============================================================================

interface ChromaticTextProps {
  children: string;
  className?: string;
  intensity?: number;
  animated?: boolean;
}

export function ChromaticText({
  children,
  className = '',
  intensity = 2,
  animated = true,
}: ChromaticTextProps) {
  const [offset, setOffset] = useState({ x: intensity, y: intensity / 2 });

  useEffect(() => {
    if (!animated) return;

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      setOffset({
        x: Math.sin(time) * intensity,
        y: (Math.cos(time * 0.7) * intensity) / 2,
      });
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [animated, intensity]);

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Red channel */}
      <span
        className="absolute inset-0 text-red-500 opacity-70 mix-blend-screen"
        style={{ transform: `translate(${-offset.x}px, ${-offset.y}px)` }}
      >
        {children}
      </span>
      {/* Blue channel */}
      <span
        className="absolute inset-0 text-blue-500 opacity-70 mix-blend-screen"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {children}
      </span>
      {/* Green channel (main) */}
      <span className="relative text-green-300 mix-blend-screen">{children}</span>
    </span>
  );
}

// =============================================================================
// DISTORTION WAVE EFFECT
// =============================================================================

interface DistortionWaveProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  speed?: number;
}

export function DistortionWave({
  children,
  className = '',
  intensity = 5,
  speed = 2,
}: DistortionWaveProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  useEffect(() => {
    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.02 * speed;
      const skewX = Math.sin(time) * intensity * 0.5;
      const skewY = Math.cos(time * 1.3) * intensity * 0.3;
      const scaleX = 1 + Math.sin(time * 0.7) * 0.02;
      const scaleY = 1 + Math.cos(time * 0.5) * 0.02;

      setTransform(`skew(${skewX}deg, ${skewY}deg) scale(${scaleX}, ${scaleY})`);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [intensity, speed]);

  return (
    <div ref={ref} className={className} style={{ transform }}>
      {children}
    </div>
  );
}

// =============================================================================
// 3D PARALLAX SCENE
// =============================================================================

interface ParallaxLayerProps {
  children: React.ReactNode;
  depth: number; // 0 = background, 1 = foreground
  className?: string;
}

export function ParallaxLayer({ children, depth, className = '' }: ParallaxLayerProps) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, depth * -500]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1 + depth * 0.2]);

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{ y, scale, zIndex: Math.floor(depth * 10) }}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxSceneProps {
  children: React.ReactNode;
  className?: string;
  mouseTracking?: boolean;
  intensity?: number;
}

export function ParallaxScene({
  children,
  className = '',
  mouseTracking = true,
  intensity = 20,
}: ParallaxSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !mouseTracking) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// FLOATING 3D ELEMENTS
// =============================================================================

interface Float3DProps {
  children: React.ReactNode;
  className?: string;
  range?: number;
  speed?: number;
  rotate?: boolean;
  delay?: number;
}

export function Float3D({
  children,
  className = '',
  range = 20,
  speed = 3,
  rotate = true,
  delay = 0,
}: Float3DProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
      animate={{
        y: [0, -range, 0],
        rotateX: rotate ? [0, 10, 0] : 0,
        rotateY: rotate ? [0, 15, 0] : 0,
        rotateZ: rotate ? [0, 5, 0] : 0,
      }}
      transition={{
        duration: speed,
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
// MORPHING SVG BLOB
// =============================================================================

interface MorphingBlobProps {
  color?: string;
  size?: number;
  className?: string;
  speed?: number;
}

export function MorphingBlob({
  color = '#10b981',
  size = 400,
  className = '',
  speed = 8,
}: MorphingBlobProps) {
  const paths = [
    'M440,320c0,110.5-89.5,200-200,200s-200-89.5-200-200s89.5-200,200-200S440,209.5,440,320z',
    'M415.7,293.4c20.3,98.6-42.4,188.6-140.1,201.5c-97.6,12.9-175.3-56.4-195.7-155c-20.3-98.6,42.4-188.6,140.1-201.5C317.6,125.5,395.3,194.8,415.7,293.4z',
    'M378.2,379.2c-40.7,76.8-143.3,105.8-229.1,64.7c-85.8-41.1-114.8-143.4-64.7-229.1c50.1-85.8,152.7-105.8,229.1-64.7C399.3,191.2,428.3,293.5,378.2,379.2z',
    'M421.4,336.9c-10.4,104.8-104.4,181.1-209.9,170.5c-105.5-10.6-181.4-103.9-170.9-208.7c10.4-104.8,104.4-181.1,209.9-170.5C355.9,138.8,431.8,232.1,421.4,336.9z',
  ];

  return (
    <motion.svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 480 480"
      style={{ filter: `drop-shadow(0 0 30px ${color}50)` }}
    >
      <motion.path
        fill={color}
        initial={{ d: paths[0] }}
        animate={{ d: paths }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.svg>
  );
}

// =============================================================================
// LIQUID GRADIENT
// =============================================================================

interface LiquidGradientProps {
  colors?: string[];
  className?: string;
  speed?: number;
}

export function LiquidGradient({
  colors = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899'],
  className = '',
  speed = 15,
}: LiquidGradientProps) {
  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{
        background: `linear-gradient(-45deg, ${colors.join(', ')})`,
        backgroundSize: '400% 400%',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// =============================================================================
// CURSOR TRAIL
// =============================================================================

interface CursorTrailProps {
  color?: string;
  size?: number;
  trailLength?: number;
  fadeSpeed?: number;
}

export function CursorTrail({
  color = '#10b981',
  size = 20,
  trailLength = 20,
  fadeSpeed = 0.9,
}: CursorTrailProps) {
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPoint = { x: e.clientX, y: e.clientY, id: idRef.current++ };
      setTrail((prev) => [...prev.slice(-trailLength + 1), newPoint]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trailLength]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {trail.map((point, index) => {
        const opacity = (index / trail.length) * fadeSpeed;
        const scale = (index / trail.length) * 0.8 + 0.2;

        return (
          <motion.div
            key={point.id}
            className="absolute rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity, scale }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              left: point.x - size / 2,
              top: point.y - size / 2,
              width: size,
              height: size,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// MAGNETIC CURSOR
// =============================================================================

interface MagneticCursorProps {
  children: React.ReactNode;
  className?: string;
}

export function MagneticCursor({ children, className = '' }: MagneticCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 300 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Custom cursor */}
      <motion.div
        className="pointer-events-none fixed z-50 mix-blend-difference"
        style={{
          left: cursorX,
          top: cursorY,
          x: '-50%',
          y: '-50%',
        }}
      >
        <motion.div
          className="rounded-full bg-white"
          animate={{
            width: isHovering ? 60 : 20,
            height: isHovering ? 60 : 20,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        />
      </motion.div>

      {/* Content wrapper */}
      <div
        ref={cursorRef}
        className={className}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {children}
      </div>
    </>
  );
}

// =============================================================================
// TEXT SCRAMBLE
// =============================================================================

interface TextScrambleProps {
  text: string;
  className?: string;
  speed?: number;
  trigger?: boolean;
  scrambleChars?: string;
}

export function TextScramble({
  text,
  className = '',
  speed = 50,
  trigger = true,
  scrambleChars = '!<>-_\\/[]{}—=+*^?#________',
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    if (!trigger || isScrambling) return;

    setIsScrambling(true);
    let iteration = 0;
    const maxIterations = text.length * 3;

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((_char, index) => {
            if (index < iteration / 3) {
              return text[index];
            }
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          })
          .join('')
      );

      iteration++;

      if (iteration > maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [trigger, text, speed, scrambleChars, isScrambling]);

  return <span className={className}>{displayText}</span>;
}

// =============================================================================
// GLITCH TEXT
// =============================================================================

interface GlitchTextProps {
  children: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlitchText({ children, className = '', intensity = 'medium' }: GlitchTextProps) {
  const [glitchStyle, setGlitchStyle] = useState({});

  useEffect(() => {
    const glitchIntensity = intensity === 'low' ? 2000 : intensity === 'medium' ? 1000 : 500;

    const glitchInterval = setInterval(() => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) {
        setGlitchStyle({
          textShadow: `
            ${Math.random() * 10 - 5}px 0 #ff0000,
            ${Math.random() * -10 + 5}px 0 #00ffff
          `,
          transform: `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`,
        });

        setTimeout(() => setGlitchStyle({}), 50);
      }
    }, glitchIntensity);

    return () => clearInterval(glitchInterval);
  }, [intensity]);

  return (
    <span className={`relative inline-block ${className}`} style={glitchStyle}>
      {/* Glitch layers */}
      <span className="absolute inset-0" aria-hidden style={{ clipPath: 'inset(10% 0 60% 0)' }}>
        {children}
      </span>
      <span className="absolute inset-0" aria-hidden style={{ clipPath: 'inset(60% 0 10% 0)' }}>
        {children}
      </span>
      <span>{children}</span>
    </span>
  );
}

// =============================================================================
// REVEAL TEXT ON SCROLL
// =============================================================================

interface RevealTextProps {
  children: string;
  className?: string;
  delay?: number;
}

export function RevealText({ children, className = '' }: RevealTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const words = children.split(' ');

  return (
    <span ref={containerRef} className={`inline ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;

        return (
          <Word key={i} range={[start, end]} progress={scrollYProgress}>
            {word}
          </Word>
        );
      })}
    </span>
  );
}

interface WordProps {
  children: string;
  range: [number, number];
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}

function Word({ children, range, progress }: WordProps) {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [20, 0]);

  return (
    <motion.span className="relative mr-2 inline-block" style={{ opacity, y }}>
      {children}
    </motion.span>
  );
}

// =============================================================================
// AURORA BACKGROUND
// =============================================================================

interface AuroraBackgroundProps {
  colors?: string[];
  className?: string;
  speed?: number;
}

export function AuroraBackground({
  colors = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899'],
  className = '',
  speed = 20,
}: AuroraBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {colors.map((color, index) => (
        <motion.div
          key={index}
          className="absolute h-[200%] w-[200%]"
          style={{
            background: `radial-gradient(ellipse at center, ${color}40, transparent 50%)`,
            left: `${(index % 2) * 50 - 50}%`,
            top: `${Math.floor(index / 2) * 50 - 50}%`,
          }}
          animate={{
            x: [0, 100, 0, -100, 0],
            y: [0, -50, 100, -50, 0],
            scale: [1, 1.2, 1, 0.8, 1],
          }}
          transition={{
            duration: speed + index * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 2,
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// SPOTLIGHT REVEAL
// =============================================================================

interface SpotlightRevealProps {
  children: React.ReactNode;
  className?: string;
  spotlightSize?: number;
}

export function SpotlightReveal({
  children,
  className = '',
  spotlightSize = 300,
}: SpotlightRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

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
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Hidden content */}
      <div className="relative z-10 opacity-30">{children}</div>

      {/* Revealed content */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: `radial-gradient(circle ${spotlightSize}px at ${mousePos.x}px ${mousePos.y}px, transparent, black)`,
          maskImage: `radial-gradient(circle ${spotlightSize}px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(circle ${spotlightSize}px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
        }}
        animate={{ opacity: isHovering ? 1 : 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// VELOCITY TEXT
// =============================================================================

interface VelocityTextProps {
  children: string;
  className?: string;
  baseVelocity?: number;
}

export function VelocityText({ children, className = '', baseVelocity = 100 }: VelocityTextProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  const x = useTransform(baseX, (v) => `${v}%`);

  const directionFactor = useRef<number>(1);

  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);

    if (baseX.get() < -100) {
      baseX.set(0);
    } else if (baseX.get() > 0) {
      baseX.set(-100);
    }
  });

  return (
    <div className={`flex overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div className="flex gap-4" style={{ x }}>
        {[...Array(4)].map((_, i) => (
          <span key={i} className="flex-shrink-0">
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// =============================================================================
// HOLOGRAPHIC CARD
// =============================================================================

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HolographicCard({ children, className = '' }: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setRotateX((y - 0.5) * -30);
    setRotateY((x - 0.5) * 30);
    setGlarePos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Rainbow holographic effect */}
      <div
        className="rounded-inherit pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `
            linear-gradient(
              ${glarePos.x * 3.6}deg,
              rgba(255, 0, 0, 0.3),
              rgba(255, 154, 0, 0.3),
              rgba(208, 222, 33, 0.3),
              rgba(79, 220, 74, 0.3),
              rgba(63, 218, 216, 0.3),
              rgba(47, 201, 226, 0.3),
              rgba(28, 127, 238, 0.3),
              rgba(95, 21, 242, 0.3),
              rgba(186, 12, 248, 0.3),
              rgba(251, 7, 217, 0.3),
              rgba(255, 0, 0, 0.3)
            )
          `,
          mixBlendMode: 'overlay',
          borderRadius: 'inherit',
        }}
      />

      {/* Glare effect */}
      <div
        className="rounded-inherit pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          borderRadius: 'inherit',
        }}
      />

      {children}
    </motion.div>
  );
}

// =============================================================================
// STAGGERED GRID
// =============================================================================

interface StaggeredGridProps {
  children: React.ReactNode[];
  className?: string;
  columns?: number;
  staggerDelay?: number;
}

export function StaggeredGrid({
  children,
  className = '',
  columns = 3,
  staggerDelay = 0.1,
}: StaggeredGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      className={`grid gap-6 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// =============================================================================
// INFINITE SCROLL MARQUEE
// =============================================================================

interface InfiniteMarqueeProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
}

export function InfiniteMarquee({
  children,
  speed = 30,
  direction = 'left',
  pauseOnHover = true,
  className = '',
}: InfiniteMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      className={`relative flex overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="flex min-w-full shrink-0 items-center gap-4"
        animate={{
          x: direction === 'left' ? [0, '-100%'] : ['-100%', 0],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        style={{
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {children}
        {children}
      </motion.div>
      <motion.div
        className="flex min-w-full shrink-0 items-center gap-4"
        animate={{
          x: direction === 'left' ? [0, '-100%'] : ['-100%', 0],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        style={{
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
