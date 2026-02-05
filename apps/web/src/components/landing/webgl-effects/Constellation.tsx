/**
 * Constellation Component
 * Interactive constellation network animation
 */

import { useRef, useEffect } from 'react';
import {
  DEFAULT_EMERALD,
  CONSTELLATION_DEFAULT_NODE_COUNT,
  CONSTELLATION_DEFAULT_MAX_CONNECTIONS,
  CONSTELLATION_CONNECTION_DISTANCE,
  CONSTELLATION_ATTRACTION_DISTANCE,
} from './constants';
import type { ConstellationProps, ConstellationNode } from './types';

export function Constellation({
  nodeCount = CONSTELLATION_DEFAULT_NODE_COUNT,
  color = DEFAULT_EMERALD,
  maxConnections = CONSTELLATION_DEFAULT_MAX_CONNECTIONS,
  className = '',
  interactive = true,
}: ConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    // Initialize nodes
    const nodes: ConstellationNode[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      connections: [],
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener('resize', resize);
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Build connections
    nodes.forEach((node, i) => {
      const distances = nodes
        .map((other, j) => ({
          index: j,
          dist: Math.hypot(node.x - other.x, node.y - other.y),
        }))
        .filter((d) => d.index !== i)
        .sort((a, b) => a.dist - b.dist);

      node.connections = distances.slice(0, maxConnections).map((d) => d.index);
    });

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Wrap around
        if (node.x < 0) node.x = canvas.width;
        if (node.x > canvas.width) node.x = 0;
        if (node.y < 0) node.y = canvas.height;
        if (node.y > canvas.height) node.y = 0;

        // Mouse attraction
        if (interactive) {
          const dx = mouseRef.current.x - node.x;
          const dy = mouseRef.current.y - node.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONSTELLATION_ATTRACTION_DISTANCE) {
            node.vx += dx * 0.0001;
            node.vy += dy * 0.0001;
          }
        }

        // Damping
        node.vx *= 0.99;
        node.vy *= 0.99;
      });

      // Draw connections
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 0.5;
      nodes.forEach((node) => {
        node.connections.forEach((j) => {
          const other = nodes[j];
          if (!other) return;
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist < CONSTELLATION_CONNECTION_DISTANCE) {
            ctx.globalAlpha = 1 - dist / CONSTELLATION_CONNECTION_DISTANCE;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = color + '40';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationId);
    };
  }, [nodeCount, color, maxConnections, interactive]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}
