/**
 * ElectricBorder — Canvas-based electric arc border animation
 *
 * Adapted from ReactBits (MIT). Draws procedurally-generated electric
 * arcs around the container using octaved noise displacement.
 *
 * @module components/effects/ElectricBorder
 */

import { useEffect, useRef, useCallback, type ReactNode, type CSSProperties } from 'react';
import './ElectricBorder.css';

interface ElectricBorderProps {
  children: ReactNode;
  /** Arc color — defaults to CGraph emerald */
  color?: string;
  /** Animation speed multiplier */
  speed?: number;
  /** Chaos / displacement amount (0–1) */
  chaos?: number;
  /** Border radius in px */
  borderRadius?: number;
  className?: string;
  style?: CSSProperties;
}

export default function ElectricBorder({
  children,
  color = '#10b981',
  speed = 1,
  chaos = 0.12,
  borderRadius = 16,
  className,
  style,
}: ElectricBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);

  // Simple noise functions
  const random = useCallback((x: number) => (Math.sin(x * 12.9898) * 43758.5453) % 1, []);

  const noise2D = useCallback(
    (x: number, y: number) => {
      const i = Math.floor(x);
      const j = Math.floor(y);
      const fx = x - i;
      const fy = y - j;
      const a = random(i + j * 57);
      const b = random(i + 1 + j * 57);
      const c = random(i + (j + 1) * 57);
      const d = random(i + 1 + (j + 1) * 57);
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    },
    [random]
  );

  const octavedNoise = useCallback(
    (
      x: number,
      octaves: number,
      lacunarity: number,
      gain: number,
      amp: number,
      freq: number,
      t: number,
      seed: number,
      flat: number
    ) => {
      let y = 0;
      let a = amp;
      let f = freq;
      for (let i = 0; i < octaves; i++) {
        const oa = i === 0 ? a * flat : a;
        y += oa * noise2D(f * x + seed * 100, t * f * 0.3);
        f *= lacunarity;
        a *= gain;
      }
      return y;
    },
    [noise2D]
  );

  const getCornerPt = useCallback(
    (cx: number, cy: number, r: number, start: number, arc: number, p: number) => ({
      x: cx + r * Math.cos(start + p * arc),
      y: cy + r * Math.sin(start + p * arc),
    }),
    []
  );

  const getRRPoint = useCallback(
    (t: number, l: number, top: number, w: number, h: number, r: number) => {
      const sw = w - 2 * r;
      const sh = h - 2 * r;
      const ca = (Math.PI * r) / 2;
      const total = 2 * sw + 2 * sh + 4 * ca;
      const d = t * total;
      let acc = 0;

      if (d <= acc + sw) return { x: l + r + ((d - acc) / sw) * sw, y: top };
      acc += sw;
      if (d <= acc + ca)
        return getCornerPt(l + w - r, top + r, r, -Math.PI / 2, Math.PI / 2, (d - acc) / ca);
      acc += ca;
      if (d <= acc + sh) return { x: l + w, y: top + r + ((d - acc) / sh) * sh };
      acc += sh;
      if (d <= acc + ca)
        return getCornerPt(l + w - r, top + h - r, r, 0, Math.PI / 2, (d - acc) / ca);
      acc += ca;
      if (d <= acc + sw) return { x: l + w - r - ((d - acc) / sw) * sw, y: top + h };
      acc += sw;
      if (d <= acc + ca)
        return getCornerPt(l + r, top + h - r, r, Math.PI / 2, Math.PI / 2, (d - acc) / ca);
      acc += ca;
      if (d <= acc + sh) return { x: l, y: top + h - r - ((d - acc) / sh) * sh };
      acc += sh;
      return getCornerPt(l + r, top + r, r, Math.PI, Math.PI / 2, (d - acc) / ca);
    },
    [getCornerPt]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = {
      octaves: 10,
      lac: 1.6,
      gain: 0.7,
      amp: chaos,
      freq: 10,
      flat: 0,
      disp: 60,
      off: 60,
    };

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width + cfg.off * 2;
      const h = rect.height + cfg.off * 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      return { width: w, height: h };
    };

    let { width, height } = updateSize();

    const draw = (now: number) => {
      if (!canvas || !ctx) return;
      const dt = (now - lastFrameRef.current) / 1000;
      timeRef.current += dt * speed;
      lastFrameRef.current = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const bw = width - 2 * cfg.off;
      const bh = height - 2 * cfg.off;
      const mr = Math.min(bw, bh) / 2;
      const r = Math.min(borderRadius, mr);
      const perim = 2 * (bw + bh) + 2 * Math.PI * r;
      const samples = Math.floor(perim / 2);

      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const prog = i / samples;
        const pt = getRRPoint(prog, cfg.off, cfg.off, bw, bh, r);
        const xn = octavedNoise(
          prog * 8,
          cfg.octaves,
          cfg.lac,
          cfg.gain,
          cfg.amp,
          cfg.freq,
          timeRef.current,
          0,
          cfg.flat
        );
        const yn = octavedNoise(
          prog * 8,
          cfg.octaves,
          cfg.lac,
          cfg.gain,
          cfg.amp,
          cfg.freq,
          timeRef.current,
          1,
          cfg.flat
        );
        const dx = pt.x + xn * cfg.disp;
        const dy = pt.y + yn * cfg.disp;
        i === 0 ? ctx.moveTo(dx, dy) : ctx.lineTo(dx, dy);
      }
      ctx.closePath();
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
      const s = updateSize();
      width = s.width;
      height = s.height;
    });
    ro.observe(container);
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      ro.disconnect();
    };
  }, [color, speed, chaos, borderRadius, octavedNoise, getRRPoint]);

  const vars = {
    '--electric-border-color': color,
    borderRadius,
    ...style,
  } as CSSProperties;

  return (
    <div ref={containerRef} className={`electric-border ${className ?? ''}`} style={vars}>
      <div className="eb-canvas-container">
        <canvas ref={canvasRef} className="eb-canvas" />
      </div>
      <div className="eb-layers">
        <div className="eb-glow-1" />
        <div className="eb-glow-2" />
        <div className="eb-background-glow" />
      </div>
      <div className="eb-content">{children}</div>
    </div>
  );
}
