import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'loading' | 'splash';
}

const sizeMap = {
  sm: { container: 40, text: 'text-xl', logo: 24 },
  md: { container: 64, text: 'text-3xl', logo: 40 },
  lg: { container: 80, text: 'text-4xl', logo: 56 },
  xl: { container: 128, text: 'text-6xl', logo: 88 },
};

// Professional CG Monogram Logo SVG Component
function GeometricLogo({ size, isAnimated = false }: { size: number; isAnimated?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="overflow-visible">
      <defs>
        {/* Primary gradient - Purple to Indigo */}
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        {/* Secondary gradient - Emerald */}
        <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        {/* Background gradient */}
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        {/* Metallic accent */}
        <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.5" />
        </linearGradient>
        {/* Glow filter - Purple */}
        <filter id="glowPurple" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feFlood floodColor="#a855f7" floodOpacity="0.6" result="glowColor" />
          <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
          <feMerge>
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Glow filter - Emerald */}
        <filter id="glowEmerald" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feFlood floodColor="#10b981" floodOpacity="0.5" result="glowColor" />
          <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
          <feMerge>
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Inner shadow for depth */}
        <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="black" floodOpacity="0.3" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
        {/* Clip path for hexagon */}
        <clipPath id="hexClip">
          <polygon points="50,3 93,25 93,75 50,97 7,75 7,25" />
        </clipPath>
      </defs>

      {/* Outer hexagon border with gradient */}
      <motion.polygon
        points="50,3 93,25 93,75 50,97 7,75 7,25"
        fill="none"
        stroke="url(#primaryGradient)"
        strokeWidth="2"
        strokeLinejoin="round"
        animate={isAnimated ? { strokeOpacity: [0.6, 1, 0.6] } : { strokeOpacity: 0.8 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inner hexagon background */}
      <polygon
        points="50,8 88,28 88,72 50,92 12,72 12,28"
        fill="url(#bgGradient)"
        filter="url(#innerShadow)"
      />

      {/* Subtle grid pattern for tech feel */}
      <g opacity="0.1" stroke="#a855f7" strokeWidth="0.3">
        <line x1="50" y1="8" x2="50" y2="92" />
        <line x1="12" y1="50" x2="88" y2="50" />
        <line x1="31" y1="18" x2="69" y2="82" />
        <line x1="69" y1="18" x2="31" y2="82" />
      </g>

      {/* Decorative corner accents */}
      <motion.g
        animate={isAnimated ? { opacity: [0.4, 0.8, 0.4] } : { opacity: 0.6 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="50" cy="8" r="2" fill="url(#secondaryGradient)" />
        <circle cx="88" cy="28" r="1.5" fill="url(#primaryGradient)" />
        <circle cx="88" cy="72" r="1.5" fill="url(#primaryGradient)" />
        <circle cx="50" cy="92" r="2" fill="url(#secondaryGradient)" />
        <circle cx="12" cy="72" r="1.5" fill="url(#primaryGradient)" />
        <circle cx="12" cy="28" r="1.5" fill="url(#primaryGradient)" />
      </motion.g>

      {/* CG Monogram - Main letterforms */}
      <motion.g
        filter="url(#glowPurple)"
        animate={isAnimated ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50px 50px' }}
      >
        {/* C letter - left side */}
        <motion.path
          d="M 28 35 
             C 28 28, 35 22, 45 22
             L 45 22
             C 42 22, 32 26, 32 35
             L 32 65
             C 32 74, 42 78, 45 78
             L 45 78
             C 35 78, 28 72, 28 65
             Z"
          fill="url(#primaryGradient)"
          animate={isAnimated ? { fillOpacity: [0.9, 1, 0.9] } : { fillOpacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* C curve - top arm */}
        <motion.path
          d="M 45 22 L 55 22 L 55 28 L 45 28 C 38 28, 34 32, 34 35 L 34 36 L 28 36 L 28 35 C 28 28, 35 22, 45 22 Z"
          fill="url(#primaryGradient)"
        />
        {/* C curve - bottom arm */}
        <motion.path
          d="M 45 78 L 55 78 L 55 72 L 45 72 C 38 72, 34 68, 34 65 L 34 64 L 28 64 L 28 65 C 28 72, 35 78, 45 78 Z"
          fill="url(#primaryGradient)"
        />
      </motion.g>

      {/* G letter - right side, integrated with shared stroke */}
      <motion.g
        filter="url(#glowEmerald)"
        animate={isAnimated ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        style={{ transformOrigin: '50px 50px' }}
      >
        {/* G main body */}
        <motion.path
          d="M 55 22 
             C 65 22, 72 28, 72 35
             L 72 65
             C 72 72, 65 78, 55 78
             L 50 78
             L 50 72
             L 55 72
             C 62 72, 66 68, 66 65
             L 66 35
             C 66 32, 62 28, 55 28
             L 50 28
             L 50 22
             Z"
          fill="url(#secondaryGradient)"
          animate={isAnimated ? { fillOpacity: [0.9, 1, 0.9] } : { fillOpacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        {/* G crossbar */}
        <motion.rect
          x="55"
          y="47"
          width="17"
          height="6"
          rx="1"
          fill="url(#secondaryGradient)"
          animate={isAnimated ? { width: [17, 19, 17] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* G vertical bar from crossbar */}
        <rect x="66" y="47" width="6" height="18" rx="1" fill="url(#secondaryGradient)" />
      </motion.g>

      {/* Shared connection element - graph node connecting C and G */}
      <motion.g
        animate={isAnimated ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.8 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Central connecting node */}
        <circle cx="50" cy="50" r="4" fill="url(#metallicGradient)" />
        <circle cx="50" cy="50" r="2" fill="url(#primaryGradient)" />

        {/* Connecting lines to represent graph edges */}
        <line
          x1="50"
          y1="50"
          x2="35"
          y2="35"
          stroke="url(#primaryGradient)"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="50"
          x2="65"
          y2="35"
          stroke="url(#secondaryGradient)"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="50"
          x2="35"
          y2="65"
          stroke="url(#primaryGradient)"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="50"
          x2="65"
          y2="65"
          stroke="url(#secondaryGradient)"
          strokeWidth="1"
          opacity="0.5"
        />
      </motion.g>

      {/* Orbital ring for tech aesthetic */}
      <motion.ellipse
        cx="50"
        cy="50"
        rx="40"
        ry="12"
        fill="none"
        stroke="url(#primaryGradient)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
        opacity="0.3"
        animate={isAnimated ? { rotate: 360 } : {}}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50px 50px' }}
      />

      {/* Small orbiting particle */}
      {isAnimated && (
        <motion.circle
          cx="90"
          cy="50"
          r="2"
          fill="url(#secondaryGradient)"
          animate={{
            rotate: 360,
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '50px 50px' }}
        />
      )}
    </svg>
  );
}

export default function AnimatedLogo({
  size = 'md',
  showText = false,
  variant = 'default',
}: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const dimensions = sizeMap[size];

  // Particle system for logo
  const particles = Array.from({ length: 12 }, (_, i) => i);
  const isAnimated = variant === 'loading' || variant === 'splash' || isHovered;

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
      >
        {/* Outer glow ring - purple/emerald gradient */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: dimensions.container,
            height: dimensions.container,
            background:
              'radial-gradient(circle, rgba(168, 85, 247, 0.4), rgba(16, 185, 129, 0.25), transparent 70%)',
            filter: 'blur(20px)',
          }}
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
            opacity: isHovered ? [0.5, 0.8, 0.5] : 0.3,
          }}
          transition={{
            duration: 2,
            repeat: variant === 'loading' ? Infinity : 0,
            ease: 'easeInOut',
          }}
        />

        {/* Orbiting particles */}
        {variant !== 'default' &&
          particles.map((i) => {
            const angle = (i / particles.length) * 2 * Math.PI;
            const radius = dimensions.container * 0.7;
            const isPurple = i % 2 === 0;

            return (
              <motion.div
                key={i}
                className={`absolute h-1.5 w-1.5 rounded-full ${isPurple ? 'bg-purple-400' : 'bg-emerald-400'}`}
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: Math.cos(angle) * radius - 3,
                  y: Math.sin(angle) * radius - 3,
                  opacity: [0.2, 1, 0.2],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            );
          })}

        {/* Rotating border rings - purple */}
        <motion.div
          className="absolute inset-0"
          style={{
            width: dimensions.container,
            height: dimensions.container,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
          <div
            className="absolute h-3 w-3 rounded-full bg-purple-500"
            style={{ top: -6, left: '50%', marginLeft: -6 }}
          />
          <div
            className="absolute h-2 w-2 rounded-full bg-emerald-500"
            style={{ bottom: -4, right: '20%', marginRight: -4 }}
          />
        </motion.div>

        {/* Counter-rotating ring - emerald */}
        <motion.div
          className="absolute inset-0"
          style={{
            width: dimensions.container,
            height: dimensions.container,
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="absolute inset-2 rounded-full border border-emerald-500/20" />
          <div
            className="absolute h-2 w-2 rounded-full bg-indigo-500"
            style={{ top: 10, right: 10 }}
          />
        </motion.div>

        {/* Main logo container */}
        <motion.div
          className="relative flex items-center justify-center overflow-visible rounded-full"
          style={{
            width: dimensions.container,
            height: dimensions.container,
            boxShadow: '0 20px 60px rgba(168, 85, 247, 0.3), 0 10px 30px rgba(16, 185, 129, 0.2)',
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {/* Geometric Logo SVG */}
          <GeometricLogo size={dimensions.container} isAnimated={isAnimated} />

          {/* Scanning line effect */}
          {variant === 'loading' && (
            <motion.div
              className="absolute inset-x-0 h-1 rounded-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
              animate={{
                top: ['-10%', '110%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>

        {/* Pulse effect for loading */}
        {variant === 'loading' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-purple-400"
            style={{
              width: dimensions.container,
              height: dimensions.container,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </motion.div>

      {/* Animated text */}
      {showText && (
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.h1
            className={`bg-gradient-to-r from-purple-400 via-white to-emerald-400 bg-clip-text font-bold text-transparent ${dimensions.text}`}
            style={{
              backgroundSize: '200% auto',
            }}
            animate={{
              backgroundPosition: ['0% center', '200% center', '0% center'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            CGraph
          </motion.h1>

          {variant === 'loading' && (
            <motion.p
              className="mt-2 text-center text-sm text-gray-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading...
            </motion.p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Splash screen variant
export function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background particles */}
      {Array.from({ length: 30 }).map((_, i) => {
        const isPurple = i % 2 === 0;
        return (
          <motion.div
            key={i}
            className={`absolute h-1 w-1 rounded-full ${isPurple ? 'bg-purple-400' : 'bg-emerald-400'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        );
      })}

      {/* Logo */}
      <AnimatedLogo size="xl" showText variant="splash" />

      {/* Progress bar */}
      <motion.div
        className="mt-12 h-1 w-64 overflow-hidden rounded-full bg-slate-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Loading text */}
      <motion.p
        className="mt-4 text-sm text-gray-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Initializing secure connection...
      </motion.p>
    </div>
  );
}
