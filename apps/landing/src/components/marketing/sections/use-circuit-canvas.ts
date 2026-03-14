/**
 * useCircuitCanvas — Clean constellation network overlay
 *
 * Renders a subtle, premium-feeling network of nodes and connections
 * inspired by Linear/Vercel landing pages. No visual clutter — just
 * smooth lines, gentle glows, and flowing data particles.
 *
 * @since v2.4.0
 */

import { useEffect, useRef, type RefObject } from 'react';

// ── Brand colors as RGB tuples ──
const COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [16, 185, 129], // emerald
  [6, 182, 212], // cyan
  [139, 92, 246], // purple
];

// ── Tuning constants ──
const NODE_COUNT = 28;
const CONNECTION_DIST = 180;
const MOUSE_DIST = 220;
const PARTICLE_COUNT = 8;
const SPEED_CAP = 0.4;
const DAMPING = 0.998;

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

interface CanvasState {
  nodes: Node[];
  particles: FlowParticle[];
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
 * Hook that drives a clean constellation network canvas animation.
 */
export function useCircuitCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  mousePosRef: RefObject<{ x: number; y: number }>,
  prefersReduced: boolean | null,
  isVisibleRef?: RefObject<boolean>
): void {
  const stateRef = useRef<CanvasState>({
    nodes: [],
    particles: [],
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

    const isMobile = window.innerWidth < 768;
    const nodeCount = isMobile ? Math.floor(NODE_COUNT * 0.5) : NODE_COUNT;
    const particleCount = isMobile ? Math.floor(PARTICLE_COUNT * 0.5) : PARTICLE_COUNT;

    const initNodes = (): void => {
      state.nodes = Array.from(
        { length: nodeCount },
        (): Node => ({
          x: Math.random() * state.w,
          y: Math.random() * state.h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.5 + Math.random() * 1.5,
          color: pickColor(),
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.01 + Math.random() * 0.02,
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
          speed: 0.002 + Math.random() * 0.004,
          color: pickColor(),
        })
      );
    };

    const resize = (): void => {
      const dpr = isMobile
        ? Math.min(window.devicePixelRatio || 1, 1.5)
        : Math.min(window.devicePixelRatio || 1, 2);
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
    let frameSkip = 0;
    const loop = (): void => {
      state.frame = requestAnimationFrame(loop);

      // Skip rendering when hero is off-screen
      if (isVisibleRef && !isVisibleRef.current) return;

      // Throttle to ~30fps on mobile
      if (isMobile) {
        frameSkip++;
        if (frameSkip % 2 !== 0) return;
      }

      state.tick++;
      const { w, h, nodes, particles } = state;
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
        if (n.x < -20) n.x = w + 20;
        else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        else if (n.y > h + 20) n.y = -20;

        // Gentle mouse repulsion (desktop)
        if (!isMobile) {
          const dmx = n.x - mx;
          const dmy = n.y - my;
          const dMouse = Math.sqrt(dmx * dmx + dmy * dmy);
          if (dMouse < 120 && dMouse > 1) {
            const force = ((120 - dMouse) / 120) * 0.04;
            n.vx += (dmx / dMouse) * force;
            n.vy += (dmy / dMouse) * force;
          }
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

      // ── Node-to-node connections (smooth solid lines) ──
      ctx.lineCap = 'round';
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
            const alpha = (1 - d / CONNECTION_DIST) ** 2 * 0.25;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${a.color[0]},${a.color[1]},${a.color[2]},${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // ── Mouse connections (gradient lines, desktop only) ──
      if (!isMobile) {
        for (const n of nodes) {
          const dx = n.x - mx;
          const dy = n.y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_DIST) {
            const alpha = (1 - d / MOUSE_DIST) ** 2 * 0.4;
            const grad = ctx.createLinearGradient(mx, my, n.x, n.y);
            grad.addColorStop(0, `rgba(16,185,129,${alpha * 0.6})`);
            grad.addColorStop(1, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},${alpha})`);
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1;
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
          const src = nodes[p.from];
          if (src) {
            let best = Math.floor(Math.random() * nodeCount);
            let bestDist = Infinity;
            for (let tries = 0; tries < 5; tries++) {
              const cand = Math.floor(Math.random() * nodeCount);
              if (cand === p.from) continue;
              const cn = nodes[cand];
              if (cn) {
                const dx = src.x - cn.x;
                const dy = src.y - cn.y;
                const dd = dx * dx + dy * dy;
                if (dd < bestDist && dd < CONNECTION_DIST * CONNECTION_DIST * 4) {
                  bestDist = dd;
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

        // Soft glow
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.08})`;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.8})`;
        ctx.fill();

        // White center
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
        ctx.fill();
      }

      // ── Nodes with soft glow ──
      for (const n of nodes) {
        const pulse = 0.5 + Math.sin(n.phase) * 0.5;
        const [cr, cg, cb] = n.color;

        // Outer glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 6 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.03 + pulse * 0.04})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + pulse * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.5 + pulse * 0.4})`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.15 + pulse * 0.2})`;
        ctx.fill();
      }

      // ── Mouse hub — single subtle ring (desktop only) ──
      if (!isMobile) {
        const hubPulse = 0.5 + Math.sin(state.tick * 0.04) * 0.5;

        // Expanding ring
        const ringR = 8 + hubPulse * 25;
        ctx.beginPath();
        ctx.arc(mx, my, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16,185,129,${(1 - hubPulse) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(mx, my, 3 + hubPulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${0.06 + hubPulse * 0.06})`;
        ctx.fill();
      }
    };

    state.frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.frame);
      window.removeEventListener('resize', resize);
      state.initialized = false;
    };
  }, [canvasRef, mousePosRef, prefersReduced, isVisibleRef]);
}
