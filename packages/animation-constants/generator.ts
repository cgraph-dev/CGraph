import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  BORDER_REGISTRY,
  BORDER_THEME_PALETTES,
} from '../../packages/animation-constants/src/borders';

// Base64 Image Cache to avoid redundant read/sharp operations
const imageCache: Record<string, string> = {};

// Lottie helper functions
function hexToLottieColor(hexStr: string): [number, number, number, number] {
  hexStr = hexStr.replace('#', '');
  return [
    parseInt(hexStr.substring(0, 2), 16) / 255.0,
    parseInt(hexStr.substring(2, 4), 16) / 255.0,
    parseInt(hexStr.substring(4, 6), 16) / 255.0,
    1,
  ];
}

function createTransform(x: number, y: number, rStart = 0, rEnd = 0, duration = 360, scale = 100) {
  const ks: any = {
    o: { a: 0, k: 100 },
    p: { a: 0, k: [x, y] },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [scale, scale] },
  };
  
  if (rStart !== rEnd) {
    ks.r = {
      a: 1,
      k: [
        { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [rStart] },
        { t: duration, s: [rEnd] },
      ],
    };
  } else {
    ks.r = { a: 0, k: rStart };
  }
  return ks;
}

function createEllipse(w: number, h: number, p = [0, 0]) {
  return {
    ty: 'el',
    d: 1,
    p: { a: 0, k: p },
    s: { a: 0, k: [w, h] },
  };
}

function createRect(w: number, h: number, p = [0, 0], r = 0) {
  return {
    ty: 'rc',
    d: 1,
    p: { a: 0, k: p },
    s: { a: 0, k: [w, h] },
    r: { a: 0, k: r }, // border radius
  };
}

function createPolygon(radius: number, points: number, p = [0, 0]) {
    return {
        ty: "sr",
        sy: 2, // polygon
        pt: { a: 0, k: points },
        p: { a: 0, k: p },
        or: { a: 0, k: radius }, // outer radius
    };
}

function createStroke(colorHex: string, width: number, opacity = 100, dashes?: number[], cap = 2) {
  const stroke: any = {
    ty: 'st',
    c: { a: 0, k: hexToLottieColor(colorHex) },
    o: { a: 0, k: opacity },
    w: { a: 0, k: width },
    lc: cap, // 1 = butt, 2 = round
    lj: cap,
    ml: 4,
  };
  
  if (dashes && dashes.length > 0) {
    stroke.d = [{ n: 'd', v: { a: 0, k: dashes[0] } }];
    if (dashes.length > 1) {
      stroke.d.push({ n: 'g', v: { a: 0, k: dashes[1] } });
    }
  }
  return stroke;
}

function createPulseTransform(x: number, y: number, duration: number, scaleMin: number, scaleMax: number) {
  return {
      o: {
          a: 1,
          k: [
              { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] },
              { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: duration / 2, s: [70] },
              { t: duration, s: [0] }
          ]
      },
      p: { a: 0, k: [x, y] },
      a: { a: 0, k: [0, 0] },
      s: {
          a: 1,
          k: [
              { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [scaleMin, scaleMin] },
              { t: duration, s: [scaleMax, scaleMax] }
          ]
      },
      r: { a: 0, k: 0 }
  };
}

function createGlowShapes(radius: number, colorHex: string, intensity = 1.0) {
  const shapes: any[] = [];
  const layers = 6; // MORE LAYERS FOR SMOOTHER GLOW
  for (let i = 0; i < layers; i++) {
    const width = 4 + i * 5;
    const opacity = Math.round((25 * intensity) / (i + 1));
    shapes.push(createEllipse(radius * 2, radius * 2));
    shapes.push(createStroke(colorHex, width, opacity));
  }
  shapes.push({ ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } });
  return shapes;
}

function createRingLayer(radius: number, color: string, width: number, rotation = [0, 0], dashes?: number[], duration = 360, extraParams: any = {}) {
  const shapes = [
    createEllipse(radius * 2, radius * 2), 
    createStroke(color, width, 100, dashes, 2),
    { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
  ];
  return {
    ty: 4,
    nm: 'Ring',
    sr: 1,
    st: 0,
    ip: 0,
    op: duration,
    ks: createTransform(60, 60, rotation[0], rotation[1], duration),
    shapes: [{ ty: 'gr', it: shapes }],
    ...extraParams
  };
}

function createTrimRingLayer(radius: number, color: string, width: number, trimStart: number, trimEnd: number, rotation = [0, 0], duration = 360, extraParams: any = {}) {
  const shapes = [
    createEllipse(radius * 2, radius * 2), 
    createStroke(color, width, 100, undefined, 2),
    { ty: 'tm', m: 1, s: { a: 0, k: trimStart }, e: { a: 0, k: trimEnd }, o: { a: 0, k: 0 } },
    { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
  ];
  return {
    ty: 4,
    nm: 'Trim Ring',
    sr: 1,
    st: 0,
    ip: 0,
    op: duration,
    ks: createTransform(60, 60, rotation[0], rotation[1], duration),
    shapes: [{ ty: 'gr', it: shapes }],
    ...extraParams
  };
}

function createParticleLayer(radius: number, color: string, count: number, particleType: string, rotation = [0, 0], duration = 360, shapeSize = 6) {
  const shapes: any[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    
    let baseShape;
    if (particleType === 'diamond') {
        const dShape = createRect(shapeSize, shapeSize, [px, py], 1);
        shapes.push({
            ty: 'gr',
            it: [
                dShape,
                { ty: 'fl', c: { a: 0, k: hexToLottieColor(color) }, o: { a: 0, k: 100 } },
                { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 45 }, o: { a: 0, k: 100 } } // Rotate 45deg for diamond
            ]
        });
    } else if (particleType === 'spark') {
        baseShape = createPolygon(shapeSize, 4, [px, py]); // 4-point star/spark
        // Polystars have a different structure, need to tweak 'sy: 1' for star
        baseShape = { ...baseShape, sy: 1, ir: { a: 0, k: shapeSize * 0.3 } }; 
        shapes.push({
            ty: 'gr',
            it: [
                baseShape,
                { ty: 'fl', c: { a: 0, k: hexToLottieColor(color) }, o: { a: 0, k: 100 } },
                { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
            ]
        });
    } else {
        // orb
        baseShape = createEllipse(shapeSize, shapeSize, [px, py]);
        shapes.push({
            ty: 'gr',
            it: [
                baseShape,
                { ty: 'fl', c: { a: 0, k: hexToLottieColor(color) }, o: { a: 0, k: 100 } },
                { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
            ]
        });
    }
  }

  return {
    ty: 4,
    nm: 'Particles',
    sr: 1,
    st: 0,
    ip: 0,
    op: duration,
    ks: createTransform(60, 60, rotation[0], rotation[1], duration),
    shapes: shapes,
  };
}

async function generateLottie(border: any) {
  const duration = 360; // 6 seconds at 60fps
  const layers: any[] = [];
  
  const palette = BORDER_THEME_PALETTES[border.theme as keyof typeof BORDER_THEME_PALETTES] || ['#ffffff'];
  const primary = palette[0];
  const secondary = palette.length > 1 ? palette[1] : primary;
  const accent = palette.length > 2 ? palette[2] : secondary;
  
  const isCW = border.rotationDirection === 'cw';
  const fast = 360 * 2;
  const rotFast = isCW ? [0, fast] : [fast, 0];
  const rotSlow = isCW ? [0, 180] : [180, 0];
  const rotRevFast = isCW ? [fast, 0] : [0, fast];
  const rotRevSlow = isCW ? [180, 0] : [0, 180];
  const rotUltra = isCW ? [0, 360 * 4] : [360 * 4, 0];
  
  // Base background shadow/glow for all to give depth
  layers.push({
    ty: 4, nm: 'Base Shadow', sr: 1, st: 0, ip: 0, op: duration,
    ks: createTransform(60, 60), shapes: [{ ty: 'gr', it: [createEllipse(96, 96), createStroke('#000000', 8, 30), { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }]
  });

  const R = border.rarity;
  
  if (R === 'free') {
    layers.push(createTrimRingLayer(48, secondary, 6, 0, 50, rotSlow, duration, { o: 50 }));
    layers.push(createRingLayer(46, primary, 4, [0, 0]));
  } else if (R === 'common') {
    layers.push(createTrimRingLayer(50, accent, 2, 0, 30, rotFast, duration));
    layers.push(createTrimRingLayer(48, secondary, 4, 50, 100, rotRevSlow, duration, { o: 50 }));
    layers.push(createRingLayer(46, primary, 4, [0, 0]));
  } else if (R === 'rare') {
    layers.push(createTrimRingLayer(52, accent, 2, 0, 15, rotUltra, duration));
    layers.push(createTrimRingLayer(52, secondary, 2, 50, 65, rotUltra, duration));
    layers.push(createTrimRingLayer(48, secondary, 4, 0, 75, rotRevSlow, duration, { o: 50 }));
    layers.push(createRingLayer(46, primary, 4, rotSlow, undefined, duration));
  } else if (R === 'epic') {
    // Pulsing aura background
    layers.push({
      ty: 4, nm: 'Pulse', sr: 1, st: 0, ip: 0, op: duration,
      ks: createPulseTransform(60, 60, duration / 2, 90, 120),
      shapes: [{ ty: 'gr', it: [createEllipse(96, 96), createStroke(primary, 6, 100), { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }]
    });
    layers.push(createTrimRingLayer(54, accent, 2, 0, 20, rotUltra, duration));
    layers.push(createRingLayer(46, primary, 5, rotFast, undefined, duration));
    layers.push(createRingLayer(42, secondary, 3, rotRevFast, [15, 10], duration));
    layers.push(createRingLayer(50, accent, 2, rotFast, [5, 5], duration));
  } else if (R === 'legendary') {
    // 2 Pulses
    layers.push({
      ty: 4, nm: 'Pulse 1', sr: 1, st: 0, ip: 0, op: duration,
      ks: createPulseTransform(60, 60, duration / 2, 95, 125),
      shapes: [{ ty: 'gr', it: [createEllipse(96, 96), createStroke(primary, 8, 100), { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }]
    });
    // Glow
    layers.push({
      ty: 4, nm: 'Glow', sr: 1, st: 0, ip: 0, op: duration,
      ks: createTransform(60, 60), shapes: [{ ty: 'gr', it: createGlowShapes(46, primary, 2.5) }]
    });
    layers.push(createTrimRingLayer(56, accent, 4, 0, 25, rotUltra, duration));
    layers.push(createTrimRingLayer(56, secondary, 4, 50, 75, rotUltra, duration));
    layers.push(createRingLayer(48, secondary, 2, rotRevFast, [30, 20], duration));
    layers.push(createRingLayer(44, primary, 5, rotFast, undefined, duration));
    if (border.particleShape !== 'none') {
      layers.push(createParticleLayer(60, accent, 10, border.particleShape, rotFast, duration, 5));
    }
  } else if (R === 'mythic') {
    // 3 Pulses
    layers.push({
      ty: 4, nm: 'Pulse 1', sr: 1, st: 0, ip: 0, op: duration,
      ks: createPulseTransform(60, 60, duration / 2, 90, 130),
      shapes: [{ ty: 'gr', it: [createEllipse(96, 96), createStroke(accent, 10, 100), { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }]
    });
    layers.push({
      ty: 4, nm: 'Pulse 2', sr: 1, st: 0, ip: duration / 4, op: duration + (duration / 4),
      ks: createPulseTransform(60, 60, duration / 2, 95, 120),
      shapes: [{ ty: 'gr', it: [createEllipse(96, 96), createStroke(secondary, 4, 100), { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }]
    });
    // Intense Glow
    layers.push({
      ty: 4, nm: 'Glow', sr: 1, st: 0, ip: 0, op: duration,
      ks: createTransform(60, 60), shapes: [{ ty: 'gr', it: createGlowShapes(48, primary, 3.5) }]
    });
    
    layers.push(createTrimRingLayer(60, primary, 6, 0, 15, rotUltra, duration));
    layers.push(createTrimRingLayer(60, accent, 6, 33, 48, rotUltra, duration));
    layers.push(createTrimRingLayer(60, secondary, 6, 66, 81, rotUltra, duration));
    
    layers.push(createRingLayer(46, primary, 5, rotFast, undefined, duration));
    layers.push(createRingLayer(52, secondary, 4, rotRevFast, [15, 25], duration));
    layers.push(createRingLayer(42, accent, 2, rotFast, [5, 10], duration));
    layers.push(createRingLayer(48, '#ffffff', 2, rotRevFast, [2, 12], duration, { bm: 1 }));
    
    if (border.particleShape !== 'none') {
      layers.push(createParticleLayer(62, accent, 14, border.particleShape, rotFast, duration, 7));
      layers.push(createParticleLayer(40, secondary, 8, border.particleShape, rotRevFast, duration, 5));
    }
  }

  // --- V3: IMAGE ASSET INJECTION ---
  let assets: any[] = [];
  
  // Decide which base image to use based on theme
  let baseImagePath = '';
  const theme = border.theme.toLowerCase();
  
  if (theme === 'cyberpunk' || theme === 'synthwave') baseImagePath = 'base_cyberpunk_1773496559422.png';
  else if (theme === 'elemental_fire') baseImagePath = 'base_fire_1773496716398.png';
  else if (theme === 'anime') baseImagePath = 'base_anime_1773497291504.png';
  else baseImagePath = 'base_fantasy_1773496695738.png'; // Fallback for Gothic/Kawaii/Cosmic/Water/Earth/8bit

  const fullImagePath = `/home/looter-admin/.gemini/antigravity/brain/4737a837-30f9-4945-b24c-fe9e082fcd10/${baseImagePath}`;
  
  // Create a unique cache key for this tinted image
  const cacheKey = `${baseImagePath}_${primary}`;

  let b64 = imageCache[cacheKey];
  if (!b64 && fs.existsSync(fullImagePath)) {
    // Read the image and optionally tint it using sharp (if we had time, for now we just resize/compress to keep JSON size reasonable)
    const imageBuffer = await sharp(fullImagePath)
        .resize(256, 256, { fit: 'inside' })
        .png({ quality: 80 })
        .toBuffer();
    
    b64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    imageCache[cacheKey] = b64;
  }
  
  if (b64) {
    assets.push({
      id: 'image_0',
      w: 256,
      h: 256,
      u: '',
      p: b64,
      e: 1 // Embedded
    });
    
    // Add the image layer AT THE BOTTOM (index 0 basically, rendered first)
    // but ABOVE the base shadow
    layers.splice(1, 0, {
      ty: 2, // 2 = Image layer
      nm: 'AI Base Highlight',
      refId: 'image_0',
      sr: 1,
      st: 0,
      ip: 0,
      op: duration,
      bm: 1, // 1 = ADD/SCREEN blend mode (removes black background)
      masksProperties: [{
        inv: false,
        mode: 'a',
        pt: {
          a: 0,
          k: {
            i: [[-55.23, 0], [0, -55.23], [55.23, 0], [0, 55.23]],
            o: [[55.23, 0], [0, 55.23], [-55.23, 0], [0, -55.23]],
            v: [[128, 28], [228, 128], [128, 228], [28, 128]],
            c: true
          }
        },
        o: { a: 0, k: 100 },
        x: { a: 0, k: 30 }, // Feather mask to blend edges perfectly
        nm: 'Mask'
      }],
      ks: {
        ...createPulseTransform(60, 60, duration, 60, 65),
        a: { a: 0, k: [128, 128] } // Center the 256x256 image anchor instead of top-left [0,0]
      } // Scale pulse
    });
  }

  const lottieData = {
    v: '5.5.2',
    fr: 60,
    ip: 0,
    op: duration,
    w: 120,
    h: 120,
    nm: border.name,
    assets: assets,
    layers: layers,
  };

  const outDir = path.join(__dirname, '../../apps/web/public/lottie/borders');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, border.lottieFile), JSON.stringify(lottieData, null, 2));
  console.log(`Generated ${border.lottieFile} (${border.name})`);
}

// Generate all borders (skip the 2 special real ones we just mapped)
const bordersToGenerate = BORDER_REGISTRY.filter(b => !b.id.startsWith('border_special_'));
console.log(`Generating ${bordersToGenerate.length} borders...`);

async function run() {
    for (const border of bordersToGenerate) {
      await generateLottie(border);
    }
}

run().catch(console.error);
