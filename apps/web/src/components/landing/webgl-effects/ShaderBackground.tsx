/**
 * ShaderBackground Component
 * WebGL shader-based animated backgrounds
 */

import { useRef, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { SHADER_PROGRAMS } from './shaders';
import { parseColor } from './utils';
import { DEFAULT_COLORS, SHADER_DEFAULT_SPEED, SHADER_DEFAULT_INTENSITY } from './constants';
import type { ShaderBackgroundProps } from './types';

const logger = createLogger('webgl-effects');

export function ShaderBackground({
  className = '',
  preset = 'plasma',
  colors = DEFAULT_COLORS,
  speed = SHADER_DEFAULT_SPEED,
  intensity = SHADER_DEFAULT_INTENSITY,
}: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    if (!gl) {
      logger.warn('WebGL not supported, falling back to CSS gradient');
      return;
    }

    // Parse colors to RGB
    const color1 = parseColor(colors[0] ?? '#10b981');
    const color2 = parseColor(colors[1] ?? '#06b6d4');
    const color3 = parseColor(colors[2] ?? '#8b5cf6');

    const shaderSrc = SHADER_PROGRAMS[preset] || SHADER_PROGRAMS.plasma;
    if (!shaderSrc) return;

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    gl.shaderSource(vertexShader, shaderSrc.vertex);
    gl.shaderSource(fragmentShader, shaderSrc.fragment);
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Create fullscreen quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const color1Location = gl.getUniformLocation(program, 'color1');
    const color2Location = gl.getUniformLocation(program, 'color2');
    const color3Location = gl.getUniformLocation(program, 'color3');
    const intensityLocation = gl.getUniformLocation(program, 'intensity');

    // Set static uniforms
    gl.uniform3f(color1Location, color1[0] ?? 0, color1[1] ?? 0, color1[2] ?? 0);
    gl.uniform3f(color2Location, color2[0] ?? 0, color2[1] ?? 0, color2[2] ?? 0);
    gl.uniform3f(color3Location, color3[0] ?? 0, color3[1] ?? 0, color3[2] ?? 0);
    gl.uniform1f(intensityLocation, intensity);

    // Resize handler with debouncing
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    };

    const debouncedResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 100);
    };

    resize();
    window.addEventListener('resize', debouncedResize);

    // Animation loop
    const render = () => {
      const elapsed = ((Date.now() - startTimeRef.current) / 1000) * speed;
      gl.uniform1f(timeLocation, elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [preset, colors, speed, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
