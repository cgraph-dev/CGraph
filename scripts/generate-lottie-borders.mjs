#!/usr/bin/env node
/**
 * Generate all 42 Lottie JSON border files programmatically.
 *
 * Each border gets proper theme colors, animation complexity matching
 * its rarity tier, and correct sizing (200x200 canvas).
 *
 * Rarity animation tiers:
 *   FREE:      Static ring (single frame)
 *   COMMON:    Subtle opacity pulse
 *   RARE:      Slow rotation
 *   EPIC:      Rotation + shimmer sweep
 *   LEGENDARY: Rotation + glow pulse + orbiting particles
 *   MYTHIC:    Full rotation + particles + pulsing rings
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Theme palettes ─────────────────────────────────────────────────────
const PALETTES = {
  '8BIT':            ['#00ff41', '#ff00ff', '#00ffff', '#ffff00'],
  JAPANESE:          ['#e8105f', '#c0392b', '#1a1a2e', '#f0a500'],
  ANIME:             ['#ff6b9d', '#c44dff', '#44d4ff', '#fffb87'],
  CYBERPUNK:         ['#00f5ff', '#ff0055', '#7b2fff', '#1a0a2e'],
  GOTHIC:            ['#6b21a8', '#1e1e2e', '#dc143c', '#c0c0c0'],
  KAWAII:            ['#ffb3d9', '#b3ecff', '#ffe4b5', '#c8f7c5'],
  ELEMENTAL_FIRE:    ['#ff4500', '#ff8c00', '#ffd700'],
  ELEMENTAL_WATER:   ['#006994', '#00bfff', '#7fffd4'],
  ELEMENTAL_EARTH:   ['#3d2b1f', '#8b4513', '#228b22'],
  ELEMENTAL_AIR:     ['#e0f7ff', '#b0e0e6', '#ffffff'],
  COSMIC:            ['#0d0d2b', '#4b0082', '#7b2fff', '#c0f0ff', '#ffffff'],
};

// ── Border registry (matches borders.ts) ───────────────────────────────
const BORDERS = [
  // FREE (4)
  { id: 'border_8bit_free_01',             rarity: 'FREE',      theme: '8BIT',            dir: 'cw',  particles: 'none',    file: '8bit_free_01.json' },
  { id: 'border_kawaii_free_01',           rarity: 'FREE',      theme: 'KAWAII',           dir: 'ccw', particles: 'none',    file: 'kawaii_free_01.json' },
  { id: 'border_elemental_water_free_01', rarity: 'FREE',      theme: 'ELEMENTAL_WATER',  dir: 'cw',  particles: 'none',    file: 'elemental_water_free_01.json' },
  { id: 'border_gothic_free_01',          rarity: 'FREE',      theme: 'GOTHIC',           dir: 'ccw', particles: 'none',    file: 'gothic_free_01.json' },
  // COMMON (8)
  { id: 'border_anime_common_01',              rarity: 'COMMON', theme: 'ANIME',            dir: 'cw',  particles: 'none', file: 'anime_common_01.json' },
  { id: 'border_cyberpunk_common_01',           rarity: 'COMMON', theme: 'CYBERPUNK',        dir: 'ccw', particles: 'none', file: 'cyberpunk_common_01.json' },
  { id: 'border_japanese_common_01',            rarity: 'COMMON', theme: 'JAPANESE',         dir: 'cw',  particles: 'none', file: 'japanese_common_01.json' },
  { id: 'border_elemental_fire_common_01',      rarity: 'COMMON', theme: 'ELEMENTAL_FIRE',   dir: 'ccw', particles: 'none', file: 'elemental_fire_common_01.json' },
  { id: 'border_elemental_earth_common_01',     rarity: 'COMMON', theme: 'ELEMENTAL_EARTH',  dir: 'cw',  particles: 'none', file: 'elemental_earth_common_01.json' },
  { id: 'border_elemental_air_common_01',       rarity: 'COMMON', theme: 'ELEMENTAL_AIR',    dir: 'ccw', particles: 'none', file: 'elemental_air_common_01.json' },
  { id: 'border_cosmic_common_01',              rarity: 'COMMON', theme: 'COSMIC',           dir: 'cw',  particles: 'none', file: 'cosmic_common_01.json' },
  { id: 'border_gothic_common_01',              rarity: 'COMMON', theme: 'GOTHIC',           dir: 'ccw', particles: 'none', file: 'gothic_common_01.json' },
  // RARE (10)
  { id: 'border_8bit_rare_01',                  rarity: 'RARE', theme: '8BIT',              dir: 'cw',  particles: 'none', file: '8bit_rare_01.json' },
  { id: 'border_anime_rare_01',                 rarity: 'RARE', theme: 'ANIME',             dir: 'ccw', particles: 'none', file: 'anime_rare_01.json' },
  { id: 'border_cyberpunk_rare_01',             rarity: 'RARE', theme: 'CYBERPUNK',         dir: 'cw',  particles: 'none', file: 'cyberpunk_rare_01.json' },
  { id: 'border_japanese_rare_01',              rarity: 'RARE', theme: 'JAPANESE',          dir: 'ccw', particles: 'none', file: 'japanese_rare_01.json' },
  { id: 'border_gothic_rare_01',                rarity: 'RARE', theme: 'GOTHIC',            dir: 'cw',  particles: 'none', file: 'gothic_rare_01.json' },
  { id: 'border_kawaii_rare_01',                rarity: 'RARE', theme: 'KAWAII',             dir: 'ccw', particles: 'none', file: 'kawaii_rare_01.json' },
  { id: 'border_elemental_fire_rare_01',        rarity: 'RARE', theme: 'ELEMENTAL_FIRE',    dir: 'cw',  particles: 'none', file: 'elemental_fire_rare_01.json' },
  { id: 'border_elemental_water_rare_01',       rarity: 'RARE', theme: 'ELEMENTAL_WATER',   dir: 'ccw', particles: 'none', file: 'elemental_water_rare_01.json' },
  { id: 'border_elemental_earth_rare_01',       rarity: 'RARE', theme: 'ELEMENTAL_EARTH',   dir: 'cw',  particles: 'none', file: 'elemental_earth_rare_01.json' },
  { id: 'border_cosmic_rare_01',                rarity: 'RARE', theme: 'COSMIC',            dir: 'ccw', particles: 'none', file: 'cosmic_rare_01.json' },
  // EPIC (8)
  { id: 'border_8bit_epic_01',                  rarity: 'EPIC', theme: '8BIT',              dir: 'cw',  particles: 'none',    file: '8bit_epic_01.json' },
  { id: 'border_anime_epic_01',                 rarity: 'EPIC', theme: 'ANIME',             dir: 'ccw', particles: 'none',    file: 'anime_epic_01.json' },
  { id: 'border_cyberpunk_epic_01',             rarity: 'EPIC', theme: 'CYBERPUNK',         dir: 'cw',  particles: 'none',    file: 'cyberpunk_epic_01.json' },
  { id: 'border_japanese_epic_01',              rarity: 'EPIC', theme: 'JAPANESE',          dir: 'ccw', particles: 'none',    file: 'japanese_epic_01.json' },
  { id: 'border_kawaii_epic_01',                rarity: 'EPIC', theme: 'KAWAII',             dir: 'cw',  particles: 'none',    file: 'kawaii_epic_01.json' },
  { id: 'border_elemental_fire_epic_01',        rarity: 'EPIC', theme: 'ELEMENTAL_FIRE',    dir: 'ccw', particles: 'none',    file: 'elemental_fire_epic_01.json' },
  { id: 'border_elemental_air_epic_01',         rarity: 'EPIC', theme: 'ELEMENTAL_AIR',     dir: 'cw',  particles: 'none',    file: 'elemental_air_epic_01.json' },
  { id: 'border_cosmic_epic_01',                rarity: 'EPIC', theme: 'COSMIC',            dir: 'ccw', particles: 'none',    file: 'cosmic_epic_01.json' },
  // LEGENDARY (8)
  { id: 'border_8bit_legendary_01',             rarity: 'LEGENDARY', theme: '8BIT',            dir: 'cw',  particles: 'orb',     file: '8bit_legendary_01.json' },
  { id: 'border_anime_legendary_01',            rarity: 'LEGENDARY', theme: 'ANIME',           dir: 'ccw', particles: 'spark',   file: 'anime_legendary_01.json' },
  { id: 'border_cyberpunk_legendary_01',        rarity: 'LEGENDARY', theme: 'CYBERPUNK',       dir: 'cw',  particles: 'diamond', file: 'cyberpunk_legendary_01.json' },
  { id: 'border_japanese_legendary_01',         rarity: 'LEGENDARY', theme: 'JAPANESE',        dir: 'ccw', particles: 'orb',     file: 'japanese_legendary_01.json' },
  { id: 'border_gothic_legendary_01',           rarity: 'LEGENDARY', theme: 'GOTHIC',          dir: 'cw',  particles: 'spark',   file: 'gothic_legendary_01.json' },
  { id: 'border_elemental_water_legendary_01',  rarity: 'LEGENDARY', theme: 'ELEMENTAL_WATER', dir: 'ccw', particles: 'orb',     file: 'elemental_water_legendary_01.json' },
  { id: 'border_elemental_earth_legendary_01',  rarity: 'LEGENDARY', theme: 'ELEMENTAL_EARTH', dir: 'cw',  particles: 'diamond', file: 'elemental_earth_legendary_01.json' },
  { id: 'border_cosmic_legendary_01',           rarity: 'LEGENDARY', theme: 'COSMIC',          dir: 'ccw', particles: 'spark',   file: 'cosmic_legendary_01.json' },
  // MYTHIC (4)
  { id: 'border_cyberpunk_mythic_01',           rarity: 'MYTHIC', theme: 'CYBERPUNK',         dir: 'cw',  particles: 'spark',   file: 'cyberpunk_mythic_01.json' },
  { id: 'border_cosmic_mythic_01',              rarity: 'MYTHIC', theme: 'COSMIC',            dir: 'ccw', particles: 'diamond', file: 'cosmic_mythic_01.json' },
  { id: 'border_elemental_fire_mythic_01',      rarity: 'MYTHIC', theme: 'ELEMENTAL_FIRE',    dir: 'cw',  particles: 'spark',   file: 'elemental_fire_mythic_01.json' },
  { id: 'border_anime_mythic_01',               rarity: 'MYTHIC', theme: 'ANIME',             dir: 'ccw', particles: 'diamond', file: 'anime_mythic_01.json' },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function hexToRgb01(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
    1,
  ];
}

function desaturate(hex, amount = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const nr = Math.min(1, r + (gray - r) * amount + 0.15);
  const ng = Math.min(1, g + (gray - g) * amount + 0.15);
  const nb = Math.min(1, b + (gray - b) * amount + 0.15);
  return [nr, ng, nb, 1];
}

/** Eased rotation keyframes over `frames` length */
function rotationKeyframes(frames, dir = 'cw') {
  const startDeg = 0;
  const endDeg = dir === 'cw' ? 360 : -360;
  return [
    { i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] }, t: 0, s: [startDeg] },
    { t: frames - 1, s: [endDeg] },
  ];
}

/** Breathing opacity keyframes */
function breatheOpacity(frames, min = 60, max = 100) {
  const mid = Math.round(frames / 2);
  return [
    { i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] }, t: 0, s: [max] },
    { i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] }, t: mid, s: [min] },
    { t: frames - 1, s: [max] },
  ];
}

/** Scale pulse keyframes */
function scalePulse(frames, min = 95, max = 105) {
  const mid = Math.round(frames / 2);
  return [
    { i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] }, t: 0, s: [max, max] },
    { i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] }, t: mid, s: [min, min] },
    { t: frames - 1, s: [max, max] },
  ];
}

// ── Shape builders ──────────────────────────────────────────────────────

function ringShape(size, strokeWidth, color, dashGap = null) {
  const shapes = [
    { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [size, size] } },
    {
      ty: 'st',
      c: { a: 0, k: color },
      o: { a: 0, k: 100 },
      w: { a: 0, k: strokeWidth },
      lc: 2, lj: 2,
      ...(dashGap ? { d: [{ n: 'd', nm: 'dash', v: { a: 0, k: dashGap[0] } }, { n: 'g', nm: 'gap', v: { a: 0, k: dashGap[1] } }] } : {}),
    },
    { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
  ];
  return shapes;
}

function gradientRingShape(size, strokeWidth, colors) {
  const c1 = hexToRgb01(colors[0]);
  const c2 = hexToRgb01(colors[1] || colors[0]);
  // Use a stroke with trim path for gradient-like effect
  return [
    { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [size, size] } },
    {
      ty: 'gs',
      s: { a: 0, k: [-size/2, 0] },
      e: { a: 0, k: [size/2, 0] },
      t: 1, // linear
      g: { p: 2, k: { a: 0, k: [0, c1[0], c1[1], c1[2], 1, c2[0], c2[1], c2[2]] } },
      o: { a: 0, k: 100 },
      w: { a: 0, k: strokeWidth },
      lc: 2, lj: 2,
    },
    { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
  ];
}

/** Create an orbiting particle (small ellipse at angle offset) */
function particleLayer(index, total, size, color, frames, dir, particleSize = 6) {
  const angle = (360 / total) * index;
  const radius = size / 2 + 4;
  // Orbit by rotating the entire layer
  const startAngle = angle;
  const endAngle = dir === 'cw' ? angle + 360 : angle - 360;

  return {
    ddd: 0, ind: 100 + index, ty: 4,
    nm: `Particle_${index}`,
    sr: 1,
    ks: {
      o: { a: 1, k: breatheOpacity(frames, 40, 100) },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes: [
      {
        ty: 'el',
        p: { a: 0, k: [0, -radius] },
        s: { a: 0, k: [particleSize, particleSize] },
      },
      {
        ty: 'fl',
        c: { a: 0, k: color },
        o: { a: 1, k: breatheOpacity(frames, 30, 90) },
        r: 1,
      },
      {
        ty: 'tr',
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 1, k: [
          { i: { x: [0.33], y: [1] }, o: { x: [0.67], y: [0] }, t: 0, s: [startAngle] },
          { t: frames - 1, s: [endAngle] },
        ]},
        o: { a: 0, k: 100 },
      },
    ],
    ip: 0, op: frames, st: 0, bm: 0,
  };
}

// ── Lottie generators per rarity ────────────────────────────────────────

function generateFree(border, palette) {
  const c = hexToRgb01(palette[0]);
  const frames = 60;
  return {
    v: '5.9.0', fr: 60, ip: 0, op: frames, w: 200, h: 200,
    nm: border.id, ddd: 0, assets: [],
    layers: [{
      ddd: 0, ind: 1, ty: 4, nm: 'Ring', sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: ringShape(170, 6, c),
      ip: 0, op: frames, st: 0, bm: 0,
    }],
  };
}

function generateCommon(border, palette) {
  const c1 = hexToRgb01(palette[0]);
  const c2 = palette[1] ? hexToRgb01(palette[1]) : c1;
  const frames = 90;
  return {
    v: '5.9.0', fr: 60, ip: 0, op: frames, w: 200, h: 200,
    nm: border.id, ddd: 0, assets: [],
    layers: [
      // Outer ring with opacity pulse
      {
        ddd: 0, ind: 1, ty: 4, nm: 'OuterRing', sr: 1,
        ks: {
          o: { a: 1, k: breatheOpacity(frames, 70, 100) },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: ringShape(170, 6, c1),
        ip: 0, op: frames, st: 0, bm: 0,
      },
      // Inner subtle ring
      {
        ddd: 0, ind: 2, ty: 4, nm: 'InnerGlow', sr: 1,
        ks: {
          o: { a: 1, k: breatheOpacity(frames, 20, 50) },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: scalePulse(frames, 97, 103) },
        },
        ao: 0,
        shapes: ringShape(178, 3, c2),
        ip: 0, op: frames, st: 0, bm: 0,
      },
    ],
  };
}

function generateRare(border, palette) {
  const c = hexToRgb01(palette[0]);
  const glow = desaturate(palette[0]);
  const frames = 180; // 3s loop
  return {
    v: '5.9.0', fr: 60, ip: 0, op: frames, w: 200, h: 200,
    nm: border.id, ddd: 0, assets: [],
    layers: [
      // Main rotating ring
      {
        ddd: 0, ind: 1, ty: 4, nm: 'RotatingRing', sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 1, k: rotationKeyframes(frames, border.dir) },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: ringShape(168, 6, c, [20, 10]),
        ip: 0, op: frames, st: 0, bm: 0,
      },
      // Glow ring
      {
        ddd: 0, ind: 2, ty: 4, nm: 'GlowRing', sr: 1,
        ks: {
          o: { a: 1, k: breatheOpacity(frames, 15, 40) },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: ringShape(180, 10, glow),
        ip: 0, op: frames, st: 0, bm: 0,
      },
    ],
  };
}

function generateEpic(border, palette) {
  const c1 = hexToRgb01(palette[0]);
  const c2 = palette[1] ? hexToRgb01(palette[1]) : c1;
  const glow = desaturate(palette[0]);
  const frames = 240; // 4s loop
  const shimmerDir = border.dir === 'cw' ? 'ccw' : 'cw';

  return {
    v: '5.9.0', fr: 60, ip: 0, op: frames, w: 200, h: 200,
    nm: border.id, ddd: 0, assets: [],
    layers: [
      // Main rotating ring
      {
        ddd: 0, ind: 1, ty: 4, nm: 'MainRing', sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 1, k: rotationKeyframes(frames, border.dir) },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: ringShape(166, 7, c1, [25, 8]),
        ip: 0, op: frames, st: 0, bm: 0,
      },
      // Counter-rotating shimmer ring
      {
        ddd: 0, ind: 2, ty: 4, nm: 'ShimmerRing', sr: 1,
        ks: {
          o: { a: 1, k: breatheOpacity(frames, 30, 70) },
          r: { a: 1, k: rotationKeyframes(frames, shimmerDir) },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: scalePulse(frames, 98, 104) },
        },
        ao: 0,
        shapes: ringShape(176, 4, c2, [40, 20]),
        ip: 0, op: frames, st: 0, bm: 0,
      },
      // Glow ring
      {
        ddd: 0, ind: 3, ty: 4, nm: 'GlowRing', sr: 1,
        ks: {
          o: { a: 1, k: breatheOpacity(frames, 10, 35) },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: scalePulse(frames, 96, 106) },
        },
        ao: 0,
        shapes: ringShape(184, 12, glow),
        ip: 0, op: frames, st: 0, bm: 0,
      },
    ],
  };
}

function generateLegendary(border, palette) {
  const c1 = hexToRgb01(palette[0]);
  const c2 = palette[1] ? hexToRgb01(palette[1]) : c1;
  const c3 = palette[2] ? hexToRgb01(palette[2]) : c2;
  const glow = desaturate(palette[0]);
  const frames = 300; // 5s loop
  const particleCount = 8;
  const particleColor = palette[1] ? hexToRgb01(palette[1]) : c1;

  const layers = [
    // Main rotating ring
    {
      ddd: 0, ind: 1, ty: 4, nm: 'MainRing', sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: rotationKeyframes(frames, border.dir) },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: ringShape(164, 7, c1, [18, 6]),
      ip: 0, op: frames, st: 0, bm: 0,
    },
    // Second ring (slower counter-rotation)
    {
      ddd: 0, ind: 2, ty: 4, nm: 'SecondRing', sr: 1,
      ks: {
        o: { a: 1, k: breatheOpacity(frames, 40, 80) },
        r: { a: 1, k: rotationKeyframes(frames * 2, border.dir === 'cw' ? 'ccw' : 'cw') },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: ringShape(176, 4, c2, [30, 15]),
      ip: 0, op: frames, st: 0, bm: 0,
    },
    // Glow pulse ring
    {
      ddd: 0, ind: 3, ty: 4, nm: 'GlowPulse', sr: 1,
      ks: {
        o: { a: 1, k: breatheOpacity(frames, 8, 30) },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: scalePulse(frames, 95, 110) },
      },
      ao: 0,
      shapes: ringShape(188, 16, glow),
      ip: 0, op: frames, st: 0, bm: 0,
    },
  ];

  // Add orbiting particles
  for (let i = 0; i < particleCount; i++) {
    layers.push(particleLayer(i, particleCount, 168, particleColor, frames, border.dir, 7));
  }

  return {
    v: '5.9.0', fr: 60, ip: 0, op: frames, w: 200, h: 200,
    nm: border.id, ddd: 0, assets: [],
    layers,
  };
}

function generateMythic(border, palette) {
  const c1 = hexToRgb01(palette[0]);
  const c2 = palette[1] ? hexToRgb01(palette[1]) : c1;
  const c3 = palette[2] ? hexToRgb01(palette[2]) : c2;
  const glow = desaturate(palette[0]);
  const frames = 360; // 6s loop
  const particleCount = 16;
  const particleColor = palette[1] ? hexToRgb01(palette[1]) : c1;
  const particleColor2 = palette[2] ? hexToRgb01(palette[2]) : c2;
  const oppDir = border.dir === 'cw' ? 'ccw' : 'cw';

  const layers = [
    // Main rotating ring
    {
      ddd: 0, ind: 1, ty: 4, nm: 'MainRing', sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: rotationKeyframes(frames, border.dir) },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: ringShape(162, 8, c1, [15, 5]),
      ip: 0, op: frames, st: 0, bm: 0,
    },
    // Counter-rotating ring
    {
      ddd: 0, ind: 2, ty: 4, nm: 'CounterRing', sr: 1,
      ks: {
        o: { a: 1, k: breatheOpacity(frames, 50, 90) },
        r: { a: 1, k: rotationKeyframes(Math.round(frames * 0.7), oppDir) },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: ringShape(174, 4, c2, [12, 8]),
      ip: 0, op: frames, st: 0, bm: 0,
    },
    // Third ring (accent)
    {
      ddd: 0, ind: 3, ty: 4, nm: 'AccentRing', sr: 1,
      ks: {
        o: { a: 1, k: breatheOpacity(frames, 30, 60) },
        r: { a: 1, k: rotationKeyframes(Math.round(frames * 1.5), border.dir) },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: scalePulse(frames, 97, 105) },
      },
      ao: 0,
      shapes: ringShape(182, 3, c3, [35, 20]),
      ip: 0, op: frames, st: 0, bm: 0,
    },
    // Large glow pulse
    {
      ddd: 0, ind: 4, ty: 4, nm: 'GlowBloom', sr: 1,
      ks: {
        o: { a: 1, k: breatheOpacity(frames, 5, 25) },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: scalePulse(frames, 92, 115) },
      },
      ao: 0,
      shapes: ringShape(192, 20, glow),
      ip: 0, op: frames, st: 0, bm: 0,
    },
  ];

  // Add orbiting particles (two rings: inner and outer)
  for (let i = 0; i < particleCount; i++) {
    const isOuter = i >= particleCount / 2;
    const color = isOuter ? particleColor2 : particleColor;
    const size = isOuter ? 5 : 8;
    layers.push(particleLayer(
      i, isOuter ? particleCount / 2 : particleCount / 2,
      isOuter ? 180 : 166, color, frames,
      isOuter ? oppDir : border.dir, size,
    ));
  }

  return {
    v: '5.9.0', fr: 60, ip: 0, op: frames, w: 200, h: 200,
    nm: border.id, ddd: 0, assets: [],
    layers,
  };
}

// ── Main ────────────────────────────────────────────────────────────────

const generators = {
  FREE: generateFree,
  COMMON: generateCommon,
  RARE: generateRare,
  EPIC: generateEpic,
  LEGENDARY: generateLegendary,
  MYTHIC: generateMythic,
};

const BASE_DIR = join(import.meta.dirname, '..');
const WEB_PUBLIC   = join(BASE_DIR, 'apps/web/public/lottie/borders');
const WEB_ASSETS   = join(BASE_DIR, 'apps/web/src/assets/lottie/borders');
const MOBILE_ASSETS = join(BASE_DIR, 'apps/mobile/src/assets/lottie/borders');

for (const dir of [WEB_PUBLIC, WEB_ASSETS, MOBILE_ASSETS]) {
  mkdirSync(dir, { recursive: true });
}

let count = 0;
for (const border of BORDERS) {
  const palette = PALETTES[border.theme];
  if (!palette) {
    console.error(`No palette for theme: ${border.theme}`);
    continue;
  }

  const generator = generators[border.rarity];
  const lottie = generator(border, palette);
  const json = JSON.stringify(lottie);

  // Write to all 3 locations
  writeFileSync(join(WEB_PUBLIC, border.file), json);
  writeFileSync(join(WEB_ASSETS, border.file), json);
  writeFileSync(join(MOBILE_ASSETS, border.file), json);

  count++;
  const sizeKB = (json.length / 1024).toFixed(1);
  console.log(`✓ ${border.file} (${border.rarity} / ${border.theme}) — ${sizeKB} KB`);
}

console.log(`\n✅ Generated ${count} Lottie border files`);
