/**
 * Landing Page Visual Effects
 *
 * Reusable visual effects components for stunning landing pages.
 * Compatible with reactbits.dev and 21st.dev patterns.
 */

import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// =============================================================================
// PARTICLE SYSTEM
// =============================================================================

interface ParticleConfig {
  count?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  connectDistance?: number;
  showConnections?: boolean;
  mouseAttraction?: boolean;
}

export function ParticleNetwork({
  count = 80,
  color = '#10b981',
  minSize = 1,
  maxSize = 3,
  speed = 0.5,
  connectDistance = 150,
  showConnections = true,
  mouseAttraction = true,
}: ParticleConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener('resize', resize);
    if (mouseAttraction) {
      window.addEventListener('mousemove', handleMouse);
    }

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: Math.random() * (maxSize - minSize) + minSize,
      opacity: Math.random() * 0.5 + 0.5,
    }));

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, i) => {
        // Mouse attraction
        if (mouseAttraction) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            p.vx += dx * 0.00003;
            p.vy += dy * 0.00003;
          }
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = p.opacity * 0.3;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();

        // Draw connections
        if (showConnections) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const p2 = particlesRef.current[j];
            if (!p2) continue;
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectDistance) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = color;
              ctx.globalAlpha = 0.1 * (1 - distance / connectDistance);
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (mouseAttraction) {
        window.removeEventListener('mousemove', handleMouse);
      }
      cancelAnimationFrame(animationId);
    };
  }, [count, color, minSize, maxSize, speed, connectDistance, showConnections, mouseAttraction]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />;
}

// =============================================================================
// GRADIENT ORB BACKGROUNDS
// =============================================================================

interface GradientOrbProps {
  color: string;
  size?: number;
  blur?: number;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  animate?: boolean;
  animationDuration?: number;
}

export function GradientOrb({
  color,
  size = 500,
  blur = 80,
  position = { top: '20%', left: '20%' },
  animate = true,
  animationDuration = 20,
}: GradientOrbProps) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        ...position,
      }}
      animate={
        animate
          ? {
              x: [0, 50, -30, 0],
              y: [0, -40, 30, 0],
              scale: [1, 1.1, 0.95, 1],
            }
          : {}
      }
      transition={{
        duration: animationDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function GradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <GradientOrb color="rgba(16, 185, 129, 0.15)" size={600} position={{ top: '10%', left: '20%' }} />
      <GradientOrb
        color="rgba(6, 182, 212, 0.12)"
        size={500}
        position={{ top: '40%', right: '15%' }}
        animationDuration={18}
      />
      <GradientOrb
        color="rgba(139, 92, 246, 0.1)"
        size={400}
        position={{ bottom: '20%', left: '10%' }}
        animationDuration={22}
      />
    </div>
  );
}

// =============================================================================
// GRID BACKGROUNDS
// =============================================================================

interface GridBackgroundProps {
  color?: string;
  size?: number;
  opacity?: number;
  fade?: boolean;
}

export function GridBackground({
  color = 'rgba(16, 185, 129, 0.05)',
  size = 60,
  opacity = 0.2,
  fade = true,
}: GridBackgroundProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(to right, ${color} 1px, transparent 1px),
          linear-gradient(to bottom, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
        maskImage: fade
          ? 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
          : undefined,
        WebkitMaskImage: fade
          ? 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
          : undefined,
      }}
    />
  );
}

export function DotBackground({
  color = 'rgba(16, 185, 129, 0.3)',
  size = 40,
  dotSize = 1,
  opacity = 0.5,
}: GridBackgroundProps & { dotSize?: number }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity,
        backgroundImage: `radial-gradient(circle, ${color} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

// =============================================================================
// SCANLINE OVERLAY
// =============================================================================

interface ScanlineProps {
  opacity?: number;
  speed?: number;
  color?: string;
}

export function Scanlines({ opacity = 0.03, speed = 6, color = '#10b981' }: ScanlineProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Static scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, ${opacity}) 2px,
            rgba(0, 0, 0, ${opacity}) 4px
          )`,
        }}
      />
      {/* Moving scanline */}
      <motion.div
        className="absolute inset-x-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, transparent, ${color}30, transparent)`,
        }}
        animate={{ y: ['0vh', '100vh'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// =============================================================================
// GLOW TEXT
// =============================================================================

interface GlowTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
}

export function GlowText({
  children,
  className = '',
  colors = ['#10b981', '#06b6d4', '#8b5cf6'],
}: GlowTextProps) {
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;

  return (
    <span className={`relative ${className}`}>
      <span
        className="absolute inset-0 bg-clip-text text-transparent opacity-50 blur-xl"
        style={{ backgroundImage: gradient }}
      >
        {children}
      </span>
      <span className="relative bg-clip-text text-transparent" style={{ backgroundImage: gradient }}>
        {children}
      </span>
    </span>
  );
}

// =============================================================================
// ANIMATED BORDER
// =============================================================================

interface AnimatedBorderProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  borderRadius?: string;
  glowOnHover?: boolean;
}

export function AnimatedBorder({
  children,
  className = '',
  colors = ['#10b981', '#06b6d4', '#8b5cf6'],
  borderRadius = '1rem',
  glowOnHover = true,
}: AnimatedBorderProps) {
  const gradient = `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`;

  return (
    <div className={`group relative ${className}`}>
      {/* Glow effect on hover */}
      {glowOnHover && (
        <div
          className="absolute -inset-[1px] opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100"
          style={{
            borderRadius,
            background: gradient,
          }}
        />
      )}
      {/* Animated border */}
      <div
        className="absolute -inset-[1px] opacity-30"
        style={{
          borderRadius,
          background: gradient,
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 3s ease infinite',
        }}
      />
      {/* Content container */}
      <div
        className="relative bg-gray-900/90 backdrop-blur-xl"
        style={{ borderRadius }}
      >
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// 3D TILT CARD
// =============================================================================

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  glare?: boolean;
}

export function TiltCard({
  children,
  className = '',
  maxTilt = 15,
  perspective = 1000,
  glare = true,
}: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 300,
    damping: 30,
  });

  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const normalX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(normalX);
    y.set(normalY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        perspective,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}

        {/* Glare effect */}
        {glare && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-inherit"
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              borderRadius: 'inherit',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// MAGNETIC BUTTON
// =============================================================================

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function Magnetic({ children, className = '', strength = 30 }: MagneticProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / (rect.width / strength));
    y.set((e.clientY - centerY) / (rect.height / strength));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// SPOTLIGHT EFFECT
// =============================================================================

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
  size?: number;
  color?: string;
}

export function Spotlight({
  children,
  className = '',
  size = 400,
  color = 'rgba(16, 185, 129, 0.15)',
}: SpotlightProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Spotlight gradient */}
      <motion.div
        className="pointer-events-none absolute"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          left: mousePos.x - size / 2,
          top: mousePos.y - size / 2,
        }}
        animate={{ opacity: isHovering ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </div>
  );
}

// =============================================================================
// TYPING TEXT
// =============================================================================

interface TypingTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
}

export function TypingText({
  text,
  className = '',
  speed = 50,
  delay = 0,
  cursor = true,
}: TypingTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [_isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let charIndex = 0;

    const startTyping = () => {
      const interval = setInterval(() => {
        if (charIndex <= text.length) {
          setDisplayText(text.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, speed);

      return interval;
    };

    timeout = setTimeout(() => {
      const interval = startTyping();
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <motion.span
          className="inline-block w-[2px] bg-current"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// =============================================================================
// COUNTER ANIMATION
// =============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 2,
  className = '',
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
