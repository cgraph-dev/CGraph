/** ParticleField — canvas-based animated particle field with connection lines. */
import { memo, useRef, useEffect } from 'react';
import {
  prefersReducedMotion,
  DEFAULT_PARTICLE_COUNT,
  DEFAULT_EFFECT_COLORS,
  DEFAULT_CONNECTION_DISTANCE,
  DEFAULT_PARTICLE_SPEED,
} from './constants';
import type { ParticleFieldProps, Particle } from './types';

/**
 * ParticleField Component
 *
 * Interactive particle network with mouse-reactive connections
 */
export const ParticleField = memo(function ParticleField({
  particleCount = DEFAULT_PARTICLE_COUNT,
  colors = DEFAULT_EFFECT_COLORS,
  connectionDistance = DEFAULT_CONNECTION_DISTANCE,
  speed = DEFAULT_PARTICLE_SPEED,
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

export default ParticleField;
