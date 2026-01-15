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

// Geometric CGraph Logo SVG Component
function GeometricLogo({ size, isAnimated = false }: { size: number; isAnimated?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="overflow-visible">
      <defs>
        {/* Cyan gradient */}
        <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#00B8D4" stopOpacity="1" />
        </linearGradient>
        {/* Magenta gradient */}
        <linearGradient id="magentaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF00FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#D500F9" stopOpacity="1" />
        </linearGradient>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background dark circle */}
      <circle cx="50" cy="50" r="45" fill="#0A1628" />

      {/* Outer geometric ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="url(#cyanGradient)"
        strokeWidth="1"
        strokeOpacity="0.3"
        animate={isAnimated ? { rotate: 360 } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '50%', originY: '50%' }}
      />

      {/* Inner diamond/geometric shape - main logo */}
      <motion.g
        filter="url(#glow)"
        animate={isAnimated ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '50%', originY: '50%' }}
      >
        {/* Top diamond - cyan */}
        <motion.polygon
          points="50,15 70,35 50,55 30,35"
          fill="url(#cyanGradient)"
          fillOpacity="0.9"
          animate={isAnimated ? { fillOpacity: [0.9, 1, 0.9] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Bottom diamond - magenta */}
        <motion.polygon
          points="50,45 70,65 50,85 30,65"
          fill="url(#magentaGradient)"
          fillOpacity="0.9"
          animate={isAnimated ? { fillOpacity: [0.9, 1, 0.9], delay: 0.5 } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        {/* Left accent triangle */}
        <polygon points="25,50 35,40 35,60" fill="#00E5FF" fillOpacity="0.6" />
        {/* Right accent triangle */}
        <polygon points="75,50 65,40 65,60" fill="#FF00FF" fillOpacity="0.6" />
      </motion.g>

      {/* Connecting lines for graph effect */}
      <motion.g
        stroke="white"
        strokeWidth="0.5"
        strokeOpacity="0.4"
        animate={isAnimated ? { strokeOpacity: [0.4, 0.7, 0.4] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1="50" y1="15" x2="70" y2="35" />
        <line x1="50" y1="15" x2="30" y2="35" />
        <line x1="50" y1="55" x2="50" y2="45" />
        <line x1="70" y1="65" x2="75" y2="50" />
        <line x1="30" y1="65" x2="25" y2="50" />
      </motion.g>

      {/* Node points for graph visualization */}
      <motion.g
        animate={isAnimated ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', staggerChildren: 0.1 }}
      >
        <circle cx="50" cy="15" r="3" fill="#00E5FF" />
        <circle cx="70" cy="35" r="2" fill="#00E5FF" />
        <circle cx="30" cy="35" r="2" fill="#00E5FF" />
        <circle cx="50" cy="85" r="3" fill="#FF00FF" />
        <circle cx="70" cy="65" r="2" fill="#FF00FF" />
        <circle cx="30" cy="65" r="2" fill="#FF00FF" />
      </motion.g>
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
        {/* Outer glow ring - cyan/magenta gradient */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: dimensions.container,
            height: dimensions.container,
            background:
              'radial-gradient(circle, rgba(0, 229, 255, 0.4), rgba(255, 0, 255, 0.2), transparent 70%)',
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
            const isCyan = i % 2 === 0;

            return (
              <motion.div
                key={i}
                className={`absolute h-1.5 w-1.5 rounded-full ${isCyan ? 'bg-cyan-400' : 'bg-fuchsia-400'}`}
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

        {/* Rotating border rings - cyan */}
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
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
          <div
            className="absolute h-3 w-3 rounded-full bg-cyan-500"
            style={{ top: -6, left: '50%', marginLeft: -6 }}
          />
          <div
            className="absolute h-2 w-2 rounded-full bg-fuchsia-500"
            style={{ bottom: -4, right: '20%', marginRight: -4 }}
          />
        </motion.div>

        {/* Counter-rotating ring - magenta */}
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
          <div className="absolute inset-2 rounded-full border border-fuchsia-500/20" />
          <div
            className="absolute h-2 w-2 rounded-full bg-cyan-500"
            style={{ top: 10, right: 10 }}
          />
        </motion.div>

        {/* Main logo container */}
        <motion.div
          className="relative flex items-center justify-center overflow-visible rounded-full"
          style={{
            width: dimensions.container,
            height: dimensions.container,
            boxShadow: '0 20px 60px rgba(0, 229, 255, 0.3), 0 10px 30px rgba(255, 0, 255, 0.2)',
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {/* Geometric Logo SVG */}
          <GeometricLogo size={dimensions.container} isAnimated={isAnimated} />

          {/* Scanning line effect */}
          {variant === 'loading' && (
            <motion.div
              className="absolute inset-x-0 h-1 rounded-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
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
            className="absolute inset-0 rounded-full border-2 border-cyan-400"
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
            className={`bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 bg-clip-text font-bold text-transparent ${dimensions.text}`}
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
        const isCyan = i % 2 === 0;
        return (
          <motion.div
            key={i}
            className={`absolute h-1 w-1 rounded-full ${isCyan ? 'bg-cyan-400' : 'bg-fuchsia-400'}`}
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
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-white to-fuchsia-500"
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
