/**
 * Auth Page Visual Effects
 *
 * Cyberpunk-inspired effects for auth pages with performance optimizations.
 * Respects reduced motion preferences and uses GPU acceleration.
 */

import { memo, useRef, useEffect, useState, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// =============================================================================
// CYBER GRID - GPU-accelerated canvas grid
// =============================================================================

interface CyberGridProps {
  color?: string;
  lineWidth?: number;
  cellSize?: number;
  pulseSpeed?: number;
}

export const CyberGrid = memo(function CyberGrid({
  color = '#8b5cf6',
  lineWidth = 0.5,
  cellSize = 40,
  pulseSpeed = 3000,
}: CyberGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const pulse = Math.sin((elapsed / pulseSpeed) * Math.PI * 2) * 0.3 + 0.7;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 0.15 * pulse;

      // Draw vertical lines
      for (let x = 0; x <= window.innerWidth; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, window.innerHeight);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y <= window.innerHeight; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(window.innerWidth, y);
        ctx.stroke();
      }

      // Draw glowing nodes at intersections (sparse)
      ctx.globalAlpha = 0.4 * pulse;
      for (let x = cellSize; x < window.innerWidth; x += cellSize * 3) {
        for (let y = cellSize; y < window.innerHeight; y += cellSize * 3) {
          const nodePulse = Math.sin((elapsed / 1500 + x + y) * 0.01) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 2 * nodePulse + 1, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [color, lineWidth, cellSize, pulseSpeed]);

  if (prefersReducedMotion()) {
    return (
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(${color}20 1px, transparent 1px),
                           linear-gradient(90deg, ${color}20 1px, transparent 1px)`,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ willChange: 'transform' }}
    />
  );
});

// =============================================================================
// MORPHING BLOB - Animated SVG blob
// =============================================================================

interface MorphingBlobProps {
  color?: string;
  size?: number;
  className?: string;
}

export const MorphingBlob = memo(function MorphingBlob({
  color = '#8b5cf6',
  size = 400,
  className = '',
}: MorphingBlobProps) {
  const paths = [
    'M44.5,-76.3C57.6,-69.3,68.1,-56.4,75.8,-42.1C83.5,-27.8,88.4,-12,86.6,2.8C84.8,17.6,76.4,31.3,66.3,43.2C56.2,55.1,44.5,65.1,31.2,72.1C17.9,79.1,3,83,-13.1,84.1C-29.2,85.2,-46.5,83.4,-59.8,74.9C-73.1,66.3,-82.4,51,-86.1,34.6C-89.8,18.3,-87.9,0.8,-83.1,-14.9C-78.3,-30.6,-70.6,-44.4,-59.6,-52.8C-48.6,-61.2,-34.3,-64.2,-21.2,-66.8C-8.1,-69.4,3.8,-71.7,17.1,-73.5C30.4,-75.3,45.1,-76.7,44.5,-76.3Z',
    'M45.3,-77.9C58.5,-70.3,68.8,-57.3,76.2,-43.1C83.6,-28.9,88,-13.4,87.2,1.4C86.5,16.2,80.4,30.4,71.9,42.8C63.4,55.2,52.4,65.8,39.6,73.1C26.8,80.4,12.1,84.3,-2.4,84.9C-16.9,85.5,-31.2,82.8,-44.1,76C-57,69.2,-68.5,58.3,-75.7,45.1C-82.9,31.9,-85.8,16.5,-85.3,1.3C-84.8,-13.9,-80.9,-28.9,-73.4,-42.1C-65.9,-55.3,-54.8,-66.7,-41.6,-74.2C-28.4,-81.7,-13.2,-85.3,1.8,-87.6C16.8,-89.9,33.5,-90.9,45.3,-77.9Z',
    'M42.7,-74.5C55.1,-67.8,64.8,-55.8,72.1,-42.5C79.4,-29.2,84.3,-14.6,84.6,0.2C84.9,15,80.6,30.1,73.1,43.3C65.6,56.5,54.9,67.9,42,75.1C29.1,82.3,14,85.4,-0.8,86.8C-15.6,88.2,-30.2,87.9,-43.5,82.1C-56.8,76.3,-68.8,65,-77.1,51.5C-85.4,38,-90,22.3,-89.8,6.8C-89.6,-8.7,-84.6,-23.8,-76.5,-37.1C-68.4,-50.4,-57.2,-61.9,-44.1,-68.3C-31,-74.7,-16.1,-76,-0.3,-75.5C15.5,-75,30.3,-72.6,42.7,-74.5Z',
  ];

  if (prefersReducedMotion()) {
    return (
      <svg
        className={`absolute ${className}`}
        width={size}
        height={size}
        viewBox="-100 -100 200 200"
        style={{ filter: `drop-shadow(0 0 40px ${color}40)` }}
      >
        <path d={paths[0]} fill={`${color}15`} />
      </svg>
    );
  }

  return (
    <motion.svg
      className={`absolute ${className}`}
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      style={{ filter: `drop-shadow(0 0 40px ${color}40)` }}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <motion.path
        fill={`${color}15`}
        animate={{
          d: paths,
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.svg>
  );
});

// =============================================================================
// FLOATING SECURITY ICONS
// =============================================================================

interface FloatingIconsProps {
  color?: string;
}

export const FloatingIcons = memo(function FloatingIcons({
  color = '#8b5cf6',
}: FloatingIconsProps) {
  const icons = [
    // Shield
    <path key="shield" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    // Lock
    <path
      key="lock"
      d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7-3V5a3 3 0 0 1 6 0v3"
    />,
    // Key
    <path
      key="key"
      d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
    />,
    // Fingerprint
    <path
      key="fingerprint"
      d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4M12 2v10M2 12h10m0 0a5 5 0 0 0 5-5"
    />,
  ];

  if (prefersReducedMotion()) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {icons.map((icon, i) => (
        <motion.svg
          key={i}
          className="absolute"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            left: `${15 + i * 20}%`,
            top: `${20 + (i % 3) * 25}%`,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        >
          {icon}
        </motion.svg>
      ))}
    </div>
  );
});

// =============================================================================
// CURSOR GLOW - Mouse-following light effect
// =============================================================================

interface CursorGlowProps {
  color?: string;
  size?: number;
}

export const CursorGlow = memo(function CursorGlow({
  color = '#8b5cf6',
  size = 300,
}: CursorGlowProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const handleMouse = (e: MouseEvent) => {
      x.set(e.clientX - size / 2);
      y.set(e.clientY - size / 2);
    };

    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [x, y, size]);

  if (prefersReducedMotion()) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-0"
      style={{
        x: springX,
        y: springY,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: 'blur(40px)',
      }}
    />
  );
});

// =============================================================================
// TILT CARD - 3D hover effect for cards
// =============================================================================

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export const TiltCard = memo(function TiltCard({
  children,
  className = '',
  maxTilt = 10,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion() || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={className}
      style={{
        rotateX: prefersReducedMotion() ? 0 : rotateX,
        rotateY: prefersReducedMotion() ? 0 : rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: prefersReducedMotion() ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
});

// =============================================================================
// TEXT SCRAMBLE - Cyberpunk text reveal effect
// =============================================================================

interface TextScrambleProps {
  text: string;
  className?: string;
  scrambleSpeed?: number;
  delay?: number;
}

export const TextScramble = memo(function TextScramble({
  text,
  className = '',
  scrambleSpeed = 50,
  delay = 0,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState('');
  const chars = '!<>-_\\/[]{}—=+*^?#________';

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    let interval: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((char, index) => {
              if (index < iteration) return char;
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, scrambleSpeed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, scrambleSpeed, delay]);

  return <span className={className}>{displayText}</span>;
});

// =============================================================================
// SCAN LINES - CRT monitor effect
// =============================================================================

interface ScanLinesProps {
  opacity?: number;
}

export const ScanLines = memo(function ScanLines({ opacity = 0.03 }: ScanLinesProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, ${opacity}),
          rgba(0, 0, 0, ${opacity}) 1px,
          transparent 1px,
          transparent 2px
        )`,
      }}
    />
  );
});

// =============================================================================
// GLITCH TEXT - Glitching text effect
// =============================================================================

interface GlitchTextProps {
  text: string;
  className?: string;
}

export const GlitchText = memo(function GlitchText({ text, className = '' }: GlitchTextProps) {
  if (prefersReducedMotion()) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <motion.span
        className="absolute inset-0 text-cyan-400 opacity-80"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
        animate={{
          x: [-2, 2, -2],
          opacity: [0.8, 0.5, 0.8],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-red-400 opacity-80"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
        animate={{
          x: [2, -2, 2],
          opacity: [0.8, 0.5, 0.8],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatDelay: 3,
          delay: 0.05,
        }}
      >
        {text}
      </motion.span>
    </span>
  );
});

// =============================================================================
// PARTICLE FIELD - Modern particle network effect
// =============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface ParticleFieldProps {
  particleCount?: number;
  colors?: string[];
  connectionDistance?: number;
  speed?: number;
}

export const ParticleField = memo(function ParticleField({
  particleCount = 80,
  colors = ['#8b5cf6', '#a78bfa', '#10b981', '#34d399'],
  connectionDistance = 150,
  speed = 0.5,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Initialize particles
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)] as string,
          alpha: Math.random() * 0.5 + 0.3,
        });
      }
    };

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update and draw particles
      for (const particle of particles) {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;

        // Keep in bounds
        particle.x = Math.max(0, Math.min(width, particle.x));
        particle.y = Math.max(0, Math.min(height, particle.y));

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw connections
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        const pI = particles[i];
        if (!pI) continue;

        for (let j = i + 1; j < particles.length; j++) {
          const pJ = particles[j];
          if (!pJ) continue;

          const dx = pI.x - pJ.x;
          const dy = pI.y - pJ.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(pI.x, pI.y);
            ctx.lineTo(pJ.x, pJ.y);

            // Create gradient for connection line
            const gradient = ctx.createLinearGradient(pI.x, pI.y, pJ.x, pJ.y);
            gradient.addColorStop(0, pI.color);
            gradient.addColorStop(1, pJ.color);

            ctx.strokeStyle = gradient;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Connect to mouse if close
        const mdx = pI.x - mouse.x;
        const mdy = pI.y - mouse.y;
        const mouseDistance = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mouseDistance < connectionDistance * 1.5) {
          const opacity = (1 - mouseDistance / (connectionDistance * 1.5)) * 0.3;
          ctx.beginPath();
          ctx.moveTo(pI.x, pI.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = pI.color;
          ctx.globalAlpha = opacity;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount, colors, connectionDistance, speed]);

  if (prefersReducedMotion()) {
    return (
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 20% 30%, ${colors[0]}15 0%, transparent 50%),
                       radial-gradient(circle at 80% 70%, ${colors[2]}15 0%, transparent 50%),
                       radial-gradient(circle at 50% 50%, ${colors[1]}10 0%, transparent 60%)`,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ willChange: 'transform' }}
    />
  );
});

// =============================================================================
// AURORA GLOW - Animated gradient background
// =============================================================================

interface AuroraGlowProps {
  colors?: string[];
  speed?: number;
}

export const AuroraGlow = memo(function AuroraGlow({
  colors = ['#8b5cf6', '#7c3aed', '#10b981', '#059669'],
  speed = 8,
}: AuroraGlowProps) {
  if (prefersReducedMotion()) {
    return (
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(135deg, ${colors[0]}20 0%, ${colors[2]}20 50%, ${colors[1]}20 100%)`,
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -inset-[100%]"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, ${colors[0]}25 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, ${colors[2]}20 0%, transparent 50%),
            radial-gradient(ellipse 70% 60% at 50% 30%, ${colors[1]}15 0%, transparent 50%),
            radial-gradient(ellipse 50% 70% at 70% 80%, ${colors[3]}20 0%, transparent 50%)
          `,
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: speed * 10, repeat: Infinity, ease: 'linear' },
          scale: { duration: speed, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
    </div>
  );
});
