/**
 * ParticleVisualizer Component
 *
 * Renders particle-based audio visualization using canvas.
 */

import { useRef, useEffect } from 'react';
import { THEMES } from './themes';
import type { VisualizerProps, Particle } from './types';

/**
 * Create a new particle
 */
function createParticle(x: number, y: number, energy: number): Particle {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * energy * 2,
    vy: (Math.random() - 0.5) * energy * 2,
    life: 1,
    size: 2 + energy * 3,
  };
}

/**
 * unknown for the chat module.
 */
/**
 * Particle Visualizer component.
 */
export function ParticleVisualizer({ analyser, theme, width, height }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Generate particles based on frequency data
      const avg = dataArray.reduce((a, b) => a + b) / bufferLength;
      if (avg > 50 && Math.random() > 0.7) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particlesRef.current.push(createParticle(x, y, avg / 255));
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;

        if (particle.life <= 0) return false;

        ctx.fillStyle = `rgba(${parseInt(THEMES[theme].primary.slice(1, 3), 16)}, ${parseInt(
          THEMES[theme].primary.slice(3, 5),
          16
        )}, ${parseInt(THEMES[theme].primary.slice(5, 7), 16)}, ${particle.life})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = THEMES[theme].glow;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, theme, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />;
}
