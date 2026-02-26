/**
 * WebGL Shader Background
 *
 * High-performance animated background using custom WebGL shaders.
 * Features fluid animations, noise patterns, and reactive effects.
 *
 * @version 1.0.0
 * @since v0.7.33
 */

import type { ShaderBackgroundProps } from './types';
import {
  useWebGLRefs,
  useParsedColors,
  useWebGLInit,
  useCanvasResize,
  useMouseTracking,
  useRenderLoop,
} from './hooks';

/**
 * Shader Background component.
 */
export default function ShaderBackground({
  variant = 'fluid',
  color1 = '#00ff41',
  color2 = '#003b00',
  color3 = '#39ff14',
  speed = 1.0,
  intensity = 1.0,
  interactive = true,
  className = '',
}: ShaderBackgroundProps) {
  const refs = useWebGLRefs();
  const colors = useParsedColors(color1, color2, color3);

  useWebGLInit(refs, variant);
  useCanvasResize(refs);
  useMouseTracking(refs, interactive);
  useRenderLoop(refs, colors, speed, intensity);

  return (
    <canvas
      ref={refs.canvasRef}
      className={`fixed inset-0 -z-20 ${className}`}
      style={{ opacity: 0.4 }}
    />
  );
}
