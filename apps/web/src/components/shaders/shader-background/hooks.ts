/**
 * WebGL hooks for ShaderBackground
 */

import { useRef, useEffect, useMemo } from 'react';
import { createLogger } from '@/lib/logger';
import { vertexShader } from './shaders';
import { shaderVariants } from './constants';
import type { ShaderVariant } from './types';

const logger = createLogger('ShaderBackground');

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * unknown for the shaders module.
 */
/**
 * Parses color.
 *
 * @param hex - The hex.
 * @returns The processed result.
 */
export function parseColor(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1] ?? '0', 16) / 255,
        parseInt(result[2] ?? '0', 16) / 255,
        parseInt(result[3] ?? '0', 16) / 255,
      ]
    : [0, 0, 0];
}

// =============================================================================
// HOOKS
// =============================================================================

export interface WebGLRefs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  glRef: React.RefObject<WebGLRenderingContext | null>;
  programRef: React.RefObject<WebGLProgram | null>;
  animationFrameRef: React.RefObject<number | undefined>;
  startTimeRef: React.RefObject<number>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
}

/**
 * unknown for the shaders module.
 */
/**
 * Hook for managing web g l refs.
 * @returns The result.
 */
export function useWebGLRefs(): WebGLRefs {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  return { canvasRef, glRef, programRef, animationFrameRef, startTimeRef, mouseRef };
}

/**
 * unknown for the shaders module.
 */
/**
 * Hook for managing parsed colors.
 *
 * @param color1 - The color1.
 * @param color2 - The color2.
 * @param color3 - The color3.
 */
export function useParsedColors(color1: string, color2: string, color3: string) {
  return useMemo(
    () => ({
      color1: parseColor(color1),
      color2: parseColor(color2),
      color3: parseColor(color3),
    }),
    [color1, color2, color3]
  );
}

/**
 * unknown for the shaders module.
 */
/**
 * Hook for managing web g l init.
 *
 * @param refs - The refs.
 * @param variant - The variant.
 */
export function useWebGLInit(refs: WebGLRefs, variant: ShaderVariant) {
  const { canvasRef, glRef, programRef, animationFrameRef } = refs;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      logger.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // Create shader program
    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        logger.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vertexShader);
    const fragShader = createShader(gl.FRAGMENT_SHADER, shaderVariants[variant]);

    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      logger.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Create quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (animationFrameRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        cancelAnimationFrame(animationFrameRef.current);
      }
      gl.deleteProgram(program);
    };
  }, [variant, canvasRef, glRef, programRef, animationFrameRef]);
}

/**
 * unknown for the shaders module.
 */
/**
 * Hook for managing canvas resize.
 *
 * @param refs - The refs.
 */
export function useCanvasResize(refs: WebGLRefs) {
  const { canvasRef, glRef } = refs;

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const gl = glRef.current;
      if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef, glRef]);
}

/**
 * unknown for the shaders module.
 */
/**
 * Hook for managing mouse tracking.
 *
 * @param refs - The refs.
 * @param interactive - The interactive.
 */
export function useMouseTracking(refs: WebGLRefs, interactive: boolean) {
  const { mouseRef } = refs;

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive, mouseRef]);
}

/**
 * unknown for the shaders module.
 */
/**
 * Hook for managing render loop.
 *
 * @param refs - The refs.
 * @param colors - The colors.
 * @param number - The number.
 * @param number - The number.
 * @param number - The number.
 * @param number - The number.
 * @param number - The number.
 * @param number - The number.
 * @param speed - The speed.
 * @param intensity - The intensity.
 */
export function useRenderLoop(
  refs: WebGLRefs,
  colors: {
    color1: [number, number, number];
    color2: [number, number, number];
    color3: [number, number, number];
  },
  speed: number,
  intensity: number
) {
  const { glRef, programRef, animationFrameRef, startTimeRef, mouseRef } = refs;

  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const render = () => {
      const time = ((Date.now() - startTimeRef.current) / 1000) * speed;

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Set uniforms
      const timeLocation = gl.getUniformLocation(program, 'time');
      const resolutionLocation = gl.getUniformLocation(program, 'resolution');
      const color1Location = gl.getUniformLocation(program, 'color1');
      const color2Location = gl.getUniformLocation(program, 'color2');
      const color3Location = gl.getUniformLocation(program, 'color3');
      const speedLocation = gl.getUniformLocation(program, 'speed');
      const intensityLocation = gl.getUniformLocation(program, 'intensity');
      const mouseLocation = gl.getUniformLocation(program, 'mouse');

      if (timeLocation) gl.uniform1f(timeLocation, time);
      if (resolutionLocation) gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
      if (color1Location) gl.uniform3fv(color1Location, colors.color1);
      if (color2Location) gl.uniform3fv(color2Location, colors.color2);
      if (color3Location) gl.uniform3fv(color3Location, colors.color3);
      if (speedLocation) gl.uniform1f(speedLocation, speed);
      if (intensityLocation) gl.uniform1f(intensityLocation, intensity);
      if (mouseLocation) gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [colors, speed, intensity, glRef, programRef, animationFrameRef, startTimeRef, mouseRef]);
}
