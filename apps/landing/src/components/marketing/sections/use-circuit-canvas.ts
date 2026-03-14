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
const NODE_COUNT = 40;
const CONNECTION_DIST = 150;
const MOUSE_DIST = 200;
const PARTICLE_COUNT = 10;
const NODE_REPULSION_RADIUS = 140;
const SPEED_CAP = 0.8;
const DAMPING = 0.996;
const PULSE_RING_INTERVAL = 120; // frames between random pulse emissions
const MAX_PULSE_RINGS = 3;
const LIGHTNING_INTERVAL = 180; // frames between electricity arcs
const MAX_LIGHTNINGS = 2;
const HEX_COUNT = 4; // floating hexagons

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

interface LightningArc {
  points: { x: number; y: number }[];
  color: readonly [number, number, number];
  life: number;
  maxLife: number;
  width: number;
}

interface FloatingHex {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: readonly [number, number, number];
  phase: number;
}

interface CanvasState {
  nodes: Node[];
  particles: FlowParticle[];
  pulses: PulseRing[];
  lightnings: LightningArc[];
  hexagons: FloatingHex[];
  frame: number;
  tick: number;
  w: number;
  h: number;
  initialized: boolean;
}

function pickColor(): readonly [number, number, number] {
  return COLORS[Math.floor(Math.random() * COLORS.length)]!;
}

/** Generate jagged lightning points between two positions */
function generateLightningPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const jitter = len * 0.15; // jag amplitude
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const nx = -dy / len; // normal vector
    const ny = dx / len;
    const offset = (Math.random() - 0.5) * 2 * jitter;
    points.push({
      x: x1 + dx * t + nx * offset,
      y: y1 + dy * t + ny * offset,
    });
  }
  points.push({ x: x2, y: y2 });
  return points;
}

/** Draw a hexagon at (cx, cy) with given size and rotation */
function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = rotation + (Math.PI / 3) * i;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
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
    lightnings: [],
    hexagons: [],
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

    const hexCount = isMobile ? Math.floor(HEX_COUNT * 0.4) : HEX_COUNT;
    const initHexagons = (): void => {
      state.hexagons = Array.from(
        { length: hexCount },
        (): FloatingHex => ({
          x: Math.random() * state.w,
          y: Math.random() * state.h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: 15 + Math.random() * 35,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.008,
          color: pickColor(),
          phase: Math.random() * Math.PI * 2,
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
        initHexagons();
        state.initialized = true;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // ── Animation loop ──
    const loop = (): void => {
      state.tick++;
      const { w, h, nodes, particles, pulses, lightnings, hexagons } = state;
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
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.1})`;
        ctx.fill();

        // Trail (small circle behind)
        const trailT = Math.max(0, p.t - 0.06);
        const tx = from.x + (to.x - from.x) * trailT;
        const ty = from.y + (to.y - from.y) * trailT;
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.4})`;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.95})`;
        ctx.fill();

        // White-hot center
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
        ctx.fill();
      }

      // ── Nodes with pulsing glow ──
      for (const n of nodes) {
        const pulse = 0.5 + Math.sin(n.phase) * 0.5;
        const [cr, cg, cb] = n.color;

        // Outer glow ring
        const gr = n.r + 8 + pulse * 8;
        ctx.beginPath();
        ctx.arc(n.x, n.y, gr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.02 + pulse * 0.05})`;
        ctx.fill();

        // Mid glow
        const mr = n.r + 3 + pulse * 3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, mr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.06 + pulse * 0.06})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + pulse * 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.6 + pulse * 0.4})`;
        ctx.fill();

        // Hot center
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.15 + pulse * 0.2})`;
        ctx.fill();
      }

      // ── Mouse hub — central pulse ring (like logo's CentralHub) ──
      if (!isMobile) {
        const hubPulse = 0.5 + Math.sin(state.tick * 0.04) * 0.5;
        const hubPulse2 = 0.5 + Math.sin(state.tick * 0.06 + 1) * 0.5;

        // Outer expanding ring
        const ringR = 10 + hubPulse * 30;
        ctx.beginPath();
        ctx.arc(mx, my, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16,185,129,${(1 - hubPulse) * 0.25})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Secondary ring offset
        const ringR2 = 6 + ((hubPulse + 0.5) % 1) * 24;
        ctx.beginPath();
        ctx.arc(mx, my, ringR2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139,92,246,${(1 - ((hubPulse + 0.5) % 1)) * 0.18})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Third ring — cyan
        const ringR3 = 4 + hubPulse2 * 18;
        ctx.beginPath();
        ctx.arc(mx, my, ringR3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6,182,212,${(1 - hubPulse2) * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Rotating hex ring around mouse
        drawHexagon(ctx, mx, my, 16 + hubPulse * 8, state.tick * 0.015);
        ctx.strokeStyle = `rgba(16,185,129,${0.06 + hubPulse * 0.08})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Core glow — brighter
        const coreR = 6 + hubPulse * 4;
        ctx.beginPath();
        ctx.arc(mx, my, coreR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${0.08 + hubPulse * 0.08})`;
        ctx.fill();

        // White-hot center
        ctx.beginPath();
        ctx.arc(mx, my, 3 + hubPulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.05 + hubPulse * 0.07})`;
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

      // ── Lightning arcs between nearby nodes ──
      if (
        state.tick % LIGHTNING_INTERVAL === 0 &&
        lightnings.length < MAX_LIGHTNINGS &&
        nodes.length > 1
      ) {
        const srcIdx = Math.floor(Math.random() * nodes.length);
        const src = nodes[srcIdx]!;
        // Find a nearby target
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let j = 0; j < nodes.length; j++) {
          if (j === srcIdx) continue;
          const tgt = nodes[j]!;
          const dx = src.x - tgt.x;
          const dy = src.y - tgt.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST * 1.8 && d < bestDist) {
            bestDist = d;
            bestIdx = j;
          }
        }
        if (bestIdx >= 0) {
          const tgt = nodes[bestIdx]!;
          lightnings.push({
            points: generateLightningPath(
              src.x,
              src.y,
              tgt.x,
              tgt.y,
              6 + Math.floor(Math.random() * 5)
            ),
            color: pickColor(),
            life: 0,
            maxLife: 12 + Math.floor(Math.random() * 10),
            width: 1 + Math.random() * 1.5,
          });
        }
      }

      for (let i = lightnings.length - 1; i >= 0; i--) {
        const arc = lightnings[i]!;
        arc.life++;
        if (arc.life >= arc.maxLife) {
          lightnings.splice(i, 1);
          continue;
        }
        const progress = arc.life / arc.maxLife;
        const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        const [cr, cg, cb] = arc.color;

        // Outer glow
        ctx.save();
        ctx.lineWidth = arc.width + 4;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.08})`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let p = 0; p < arc.points.length; p++) {
          const pt = arc.points[p]!;
          if (p === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Bright core
        ctx.lineWidth = arc.width;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.7})`;
        ctx.beginPath();
        for (let p = 0; p < arc.points.length; p++) {
          const pt = arc.points[p]!;
          if (p === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Inner white-hot core
        ctx.lineWidth = Math.max(0.5, arc.width * 0.3);
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
        ctx.beginPath();
        for (let p = 0; p < arc.points.length; p++) {
          const pt = arc.points[p]!;
          if (p === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // ── Floating hexagons ──
      for (const hex of hexagons) {
        hex.x += hex.vx;
        hex.y += hex.vy;
        hex.rotation += hex.rotSpeed;
        hex.phase += 0.02;

        // Wrap edges
        if (hex.x < -hex.size * 2) hex.x = w + hex.size * 2;
        else if (hex.x > w + hex.size * 2) hex.x = -hex.size * 2;
        if (hex.y < -hex.size * 2) hex.y = h + hex.size * 2;
        else if (hex.y > h + hex.size * 2) hex.y = -hex.size * 2;

        const pulse = 0.3 + Math.sin(hex.phase) * 0.2;
        const [cr, cg, cb] = hex.color;

        // Glow fill
        drawHexagon(ctx, hex.x, hex.y, hex.size, hex.rotation);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${pulse * 0.03})`;
        ctx.fill();

        // Wireframe stroke
        drawHexagon(ctx, hex.x, hex.y, hex.size, hex.rotation);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${pulse * 0.15})`;
        ctx.lineWidth = 0.8;
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
