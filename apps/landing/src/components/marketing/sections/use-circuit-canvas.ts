/**
 * useCircuitCanvas — Interactive circuit network canvas
 *
 * Renders a full-viewport canvas with animated nodes, connections,
 * data-flow particles, and mouse-reactive effects inspired by the
 * CGraph animated circuit board logo (see animated-logo/).
 *
 * Effects:
 * - 55 drifting circuit nodes in brand colors (emerald/cyan/purple)
 * - Dashed connections between nearby nodes with electricity flow
 * - Mouse-following hub with expanding pulse ring (like logo central hub)
 * - 12 data-flow particles traveling between nodes (like logo particles)
 * - Random pulse waves emitting from nodes
 * - Mouse proximity connections with gradient lines
 * - Node repulsion from cursor
 *
 * Performance: uses requestAnimationFrame + canvas (no DOM overhead),
 * DPR-aware, reduces node count on mobile, skips for reduced-motion.
 *
 * @since v2.3.0
 */

import { useEffect, useRef, type RefObject } from 'react';

// ── Brand colors as RGB tuples ──
const COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [16, 185, 129], // emerald
  [6, 182, 212], // cyan
  [139, 92, 246], // purple
];

// ── Tuning constants ──
const NODE_COUNT = 55;
const CONNECTION_DIST = 160;
const MOUSE_DIST = 220;
const PARTICLE_COUNT = 12;
const NODE_REPULSION_RADIUS = 150;
const SPEED_CAP = 1.2;
const DAMPING = 0.995;
const PULSE_RING_INTERVAL = 100; // frames between random pulse emissions
const MAX_PULSE_RINGS = 4;

// ── Types ──
interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: readonly [number, number, number];
  phase: number;
  phaseSpeed: number;
}

interface FlowParticle {
  from: number;
  to: number;
  t: number;
  speed: number;
  color: readonly [number, number, number];
}

interface PulseRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  color: readonly [number, number, number];
}

interface CanvasState {
  nodes: Node[];
  particles: FlowParticle[];
  pulses: PulseRing[];
  frame: number;
  tick: number;
  w: number;
  h: number;
  initialized: boolean;
}

function pickColor(): readonly [number, number, number] {
  return COLORS[Math.floor(Math.random() * COLORS.length)]!;
}

/**
 * Hook that drives an interactive circuit-network canvas animation.
 *
 * @param canvasRef  - Ref to the `<canvas>` element
 * @param mousePosRef - Ref to normalized mouse coords {x: 0-1, y: 0-1}
 * @param prefersReduced - Whether the user prefers reduced motion
 */
export function useCircuitCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  mousePosRef: RefObject<{ x: number; y: number }>,
  prefersReduced: boolean | null
): void {
  const stateRef = useRef<CanvasState>({
    nodes: [],
    particles: [],
    pulses: [],
    frame: 0,
    tick: 0,
    w: 0,
    h: 0,
    initialized: false,
  });

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const state = stateRef.current;

    // ── Helpers ──
    const isMobile = window.innerWidth < 768;
    const nodeCount = isMobile ? Math.floor(NODE_COUNT * 0.5) : NODE_COUNT;
    const particleCount = isMobile ? Math.floor(PARTICLE_COUNT * 0.5) : PARTICLE_COUNT;

    const initNodes = (): void => {
      state.nodes = Array.from(
        { length: nodeCount },
        (): Node => ({
          x: Math.random() * state.w,
          y: Math.random() * state.h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: 1.5 + Math.random() * 2,
          color: pickColor(),
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.015 + Math.random() * 0.025,
        })
      );
    };

    const initParticles = (): void => {
      state.particles = Array.from(
        { length: particleCount },
        (): FlowParticle => ({
          from: Math.floor(Math.random() * nodeCount),
          to: Math.floor(Math.random() * nodeCount),
          t: Math.random(),
          speed: 0.003 + Math.random() * 0.006,
          color: pickColor(),
        })
      );
    };

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
      state.w = rect.width;
      state.h = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!state.initialized) {
        initNodes();
        initParticles();
        state.initialized = true;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // ── Animation loop ──
    const loop = (): void => {
      state.tick++;
      const { w, h, nodes, particles, pulses } = state;
      const mouse = mousePosRef.current;
      const mx = mouse.x * w;
      const my = mouse.y * h;

      ctx.clearRect(0, 0, w, h);

      // ── Update nodes ──
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.phase += n.phaseSpeed;

        // Wrap around edges
        if (n.x < -30) n.x = w + 30;
        else if (n.x > w + 30) n.x = -30;
        if (n.y < -30) n.y = h + 30;
        else if (n.y > h + 30) n.y = -30;

        // Mouse repulsion
        const dmx = n.x - mx;
        const dmy = n.y - my;
        const dMouse = Math.sqrt(dmx * dmx + dmy * dmy);
        if (dMouse < NODE_REPULSION_RADIUS && dMouse > 1) {
          const force = ((NODE_REPULSION_RADIUS - dMouse) / NODE_REPULSION_RADIUS) * 0.08;
          n.vx += (dmx / dMouse) * force;
          n.vy += (dmy / dMouse) * force;
        }

        // Speed cap + damping
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > SPEED_CAP) {
          n.vx = (n.vx / speed) * SPEED_CAP;
          n.vy = (n.vy / speed) * SPEED_CAP;
        }
        n.vx *= DAMPING;
        n.vy *= DAMPING;
      }

      // ── Node-to-node connections (dashed — electricity flow) ──
      const dashOffset = state.tick * 0.8;
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.lineDashOffset = -dashOffset;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const threshold2 = CONNECTION_DIST * CONNECTION_DIST;
          if (d2 < threshold2) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / CONNECTION_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${a.color[0]},${a.color[1]},${a.color[2]},${alpha})`;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // ── Mouse connections (brighter, gradient, solid) ──
      if (!isMobile) {
        for (const n of nodes) {
          const dx = n.x - mx;
          const dy = n.y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_DIST) {
            const alpha = (1 - d / MOUSE_DIST) ** 1.5 * 0.35;
            const grad = ctx.createLinearGradient(mx, my, n.x, n.y);
            grad.addColorStop(0, `rgba(16,185,129,${alpha * 0.8})`);
            grad.addColorStop(1, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${alpha})`);
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // ── Data flow particles ──
      for (const p of particles) {
        p.t += p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.from = p.to;
          // Pick a nearby node to travel to next
          const src = nodes[p.from];
          if (src) {
            let best = Math.floor(Math.random() * nodeCount);
            let bestDist = Infinity;
            for (let tries = 0; tries < 6; tries++) {
              const cand = Math.floor(Math.random() * nodeCount);
              if (cand === p.from) continue;
              const cn = nodes[cand];
              if (cn) {
                const dx = src.x - cn.x;
                const dy = src.y - cn.y;
                const d = dx * dx + dy * dy;
                if (d < bestDist && d < CONNECTION_DIST * CONNECTION_DIST * 4) {
                  bestDist = d;
                  best = cand;
                }
              }
            }
            p.to = best;
          }
        }

        const from = nodes[p.from];
        const to = nodes[p.to];
        if (!from || !to) continue;

        const px = from.x + (to.x - from.x) * p.t;
        const py = from.y + (to.y - from.y) * p.t;
        const alpha = Math.sin(p.t * Math.PI);
        const [cr, cg, cb] = p.color;

        // Glow halo
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.08})`;
        ctx.fill();

        // Trail (small circle behind)
        const trailT = Math.max(0, p.t - 0.06);
        const tx = from.x + (to.x - from.x) * trailT;
        const ty = from.y + (to.y - from.y) * trailT;
        ctx.beginPath();
        ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.3})`;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.9})`;
        ctx.fill();
      }

      // ── Nodes with pulsing glow ──
      for (const n of nodes) {
        const pulse = 0.5 + Math.sin(n.phase) * 0.5;
        const [cr, cg, cb] = n.color;

        // Glow ring
        const gr = n.r + 5 + pulse * 5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, gr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.02 + pulse * 0.04})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + pulse * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.5 + pulse * 0.4})`;
        ctx.fill();
      }

      // ── Mouse hub — central pulse ring (like logo's CentralHub) ──
      if (!isMobile) {
        const hubPulse = 0.5 + Math.sin(state.tick * 0.04) * 0.5;

        // Expanding pulse ring
        const ringR = 8 + hubPulse * 22;
        ctx.beginPath();
        ctx.arc(mx, my, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16,185,129,${(1 - hubPulse) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Secondary ring offset
        const ringR2 = 5 + ((hubPulse + 0.5) % 1) * 18;
        ctx.beginPath();
        ctx.arc(mx, my, ringR2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139,92,246,${(1 - ((hubPulse + 0.5) % 1)) * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core glow
        ctx.beginPath();
        ctx.arc(mx, my, 5 + hubPulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${0.06 + hubPulse * 0.06})`;
        ctx.fill();
      }

      // ── Random pulse waves from nodes ──
      if (state.tick % PULSE_RING_INTERVAL === 0 && pulses.length < MAX_PULSE_RINGS) {
        const srcNode = nodes[Math.floor(Math.random() * nodes.length)];
        if (srcNode) {
          pulses.push({
            x: srcNode.x,
            y: srcNode.y,
            r: 0,
            maxR: 100 + Math.random() * 100,
            color: srcNode.color,
          });
        }
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const ring = pulses[i]!;
        ring.r += 1.5;
        if (ring.r >= ring.maxR) {
          pulses.splice(i, 1);
          continue;
        }
        const alpha = (1 - ring.r / ring.maxR) * 0.18;
        const [cr, cg, cb] = ring.color;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      state.frame = requestAnimationFrame(loop);
    };

    state.frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.frame);
      window.removeEventListener('resize', resize);
      state.initialized = false;
    };
  }, [canvasRef, mousePosRef, prefersReduced]);
}
