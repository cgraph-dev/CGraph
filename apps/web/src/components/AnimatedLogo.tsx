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

export default function AnimatedLogo({
  size = 'md',
  showText = false,
  variant = 'default'
}: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const dimensions = sizeMap[size];

  // Particle system for logo
  const particles = Array.from({ length: 12 }, (_, i) => i);

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
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            width: dimensions.container,
            height: dimensions.container,
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4), transparent 70%)',
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
        {variant !== 'default' && particles.map((i) => {
          const angle = (i / particles.length) * 2 * Math.PI;
          const radius = dimensions.container * 0.7;

          return (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary-400"
              style={{
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: Math.cos(angle + (variant === 'loading' ? 0 : 0)) * radius - 3,
                y: Math.sin(angle + (variant === 'loading' ? 0 : 0)) * radius - 3,
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

        {/* Rotating border rings */}
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
          <div className="absolute inset-0 rounded-2xl border-2 border-primary-500/20" />
          <div
            className="absolute w-3 h-3 rounded-full bg-primary-500"
            style={{ top: -6, left: '50%', marginLeft: -6 }}
          />
          <div
            className="absolute w-2 h-2 rounded-full bg-purple-500"
            style={{ bottom: -4, right: '20%', marginRight: -4 }}
          />
        </motion.div>

        {/* Counter-rotating ring */}
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
          <div className="absolute inset-2 rounded-xl border border-purple-500/20" />
          <div
            className="absolute w-2 h-2 rounded-full bg-cyan-500"
            style={{ top: 10, right: 10 }}
          />
        </motion.div>

        {/* Main logo container */}
        <motion.div
          className="relative rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 flex items-center justify-center overflow-hidden"
          style={{
            width: dimensions.container,
            height: dimensions.container,
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.5)',
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {/* Inner animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-transparent to-purple-500/30"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Mesh grid effect */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
            animate={{
              backgroundPosition: ['0px 0px', '20px 20px'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Letter C with 3D effect */}
          <motion.div
            className="relative z-10 font-bold text-white"
            style={{ fontSize: dimensions.logo }}
            animate={{
              textShadow: isHovered
                ? [
                    '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(16,185,129,0.6)',
                    '0 0 30px rgba(255,255,255,1), 0 0 60px rgba(16,185,129,0.8)',
                    '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(16,185,129,0.6)',
                  ]
                : '0 4px 8px rgba(0,0,0,0.3)',
            }}
            transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
          >
            C
          </motion.div>

          {/* Scanning line effect */}
          {variant === 'loading' && (
            <motion.div
              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"
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

          {/* Corner accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br" />
        </motion.div>

        {/* Pulse effect for loading */}
        {variant === 'loading' && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-primary-400"
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
            className={`font-bold bg-gradient-to-r from-primary-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent ${dimensions.text}`}
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
              className="text-gray-400 text-sm text-center mt-2"
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
      {/* Background particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary-400"
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
      ))}

      {/* Logo */}
      <AnimatedLogo size="xl" showText variant="splash" />

      {/* Progress bar */}
      <motion.div
        className="mt-12 w-64 h-1 bg-dark-700 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 via-cyan-500 to-purple-500 rounded-full"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Loading text */}
      <motion.p
        className="mt-4 text-gray-400 text-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Initializing secure connection...
      </motion.p>
    </div>
  );
}
