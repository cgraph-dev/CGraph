/**
 * WebGL Shader Background
 *
 * High-performance animated background using custom WebGL shaders.
 * Features fluid animations, noise patterns, and reactive effects.
 *
 * @version 1.0.0
 * @since v0.7.33
 */

import { useRef, useEffect, useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface ShaderBackgroundProps {
  variant?: 'fluid' | 'particles' | 'waves' | 'neural' | 'matrix';
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  intensity?: number;
  interactive?: boolean;
  className?: string;
}

// =============================================================================
// SHADER PROGRAMS
// =============================================================================

// Vertex Shader (shared)
const vertexShader = `
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment Shader - Fluid Animation
const fluidFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float time;
  uniform vec2 resolution;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform vec2 mouse;
  uniform float intensity;

  // Noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 6; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    // Create flowing effect
    float t = time * 0.3;
    vec2 q = vec2(fbm(p + t * 0.1), fbm(p + vec2(1.0)));
    vec2 r = vec2(fbm(p + 4.0 * q + t * 0.2), fbm(p + 4.0 * q + vec2(1.7, 9.2)));
    float f = fbm(p + 2.0 * r);

    // Mouse interaction
    vec2 mouseInfluence = (mouse - uv) * intensity;
    f += length(mouseInfluence) * 0.5;

    // Color mixing
    vec3 color = mix(color1, color2, f);
    color = mix(color, color3, r.x);

    // Add glow
    color += vec3(0.1) * smoothstep(0.4, 0.8, f);

    gl_FragColor = vec4(color, 0.8);
  }
`;

// Fragment Shader - Particle Field
const particleFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float time;
  uniform vec2 resolution;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float intensity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;
    vec3 col = vec3(0.0);

    for(float i = 0.0; i < 50.0; i++) {
      vec2 particlePos = vec2(
        hash(vec2(i, 0.0)),
        hash(vec2(i, 1.0))
      );

      particlePos.y = fract(particlePos.y - time * 0.1 * (0.5 + hash(vec2(i, 2.0))));

      float dist = distance(uv, particlePos);
      float size = 0.002 * (1.0 + intensity);
      float glow = size / dist;

      vec3 particleColor = mix(color1, color2, hash(vec2(i, 3.0)));
      col += particleColor * glow;
    }

    gl_FragColor = vec4(col, 0.6);
  }
`;

// Fragment Shader - Wave Pattern
const waveFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float time;
  uniform vec2 resolution;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform float speed;

  void main() {
    vec2 uv = vUv;
    float t = time * speed;

    // Create wave patterns
    float wave1 = sin(uv.x * 10.0 + t) * 0.5 + 0.5;
    float wave2 = sin(uv.y * 8.0 - t * 1.3) * 0.5 + 0.5;
    float wave3 = sin((uv.x + uv.y) * 6.0 + t * 0.8) * 0.5 + 0.5;

    float combined = wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.3;

    vec3 color = mix(color1, color2, combined);
    color = mix(color, color3, wave3);

    gl_FragColor = vec4(color, 0.7);
  }
`;

// =============================================================================
// SHADER VARIANTS MAP
// =============================================================================

const shaderVariants = {
  fluid: fluidFragmentShader,
  particles: particleFragmentShader,
  waves: waveFragmentShader,
  neural: fluidFragmentShader, // Can use same with different colors
  matrix: particleFragmentShader,
};

// =============================================================================
// COMPONENT
// =============================================================================

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  // Parse colors to RGB
  const parseColor = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1] ?? '0', 16) / 255,
          parseInt(result[2] ?? '0', 16) / 255,
          parseInt(result[3] ?? '0', 16) / 255,
        ]
      : [0, 0, 0];
  };

  const colors = useMemo(
    () => ({
      color1: parseColor(color1),
      color2: parseColor(color2),
      color3: parseColor(color3),
    }),
    [color1, color2, color3]
  );

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
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
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
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
      console.error('Program link error:', gl.getProgramInfoLog(program));
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
        cancelAnimationFrame(animationFrameRef.current);
      }
      gl.deleteProgram(program);
    };
  }, [variant]);

  // Handle resize
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
  }, []);

  // Handle mouse movement
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
  }, [interactive]);

  // Render loop
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const render = () => {
      const time = (Date.now() - startTimeRef.current) / 1000 * speed;

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
      if (resolutionLocation)
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
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
  }, [colors, speed, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-20 ${className}`}
      style={{ opacity: 0.4 }}
    />
  );
}

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

export function MatrixShaderBackground({ className }: { className?: string }) {
  return (
    <ShaderBackground
      variant="particles"
      color1="#00ff41"
      color2="#003b00"
      speed={0.5}
      intensity={1.2}
      className={className}
    />
  );
}

export function CyberShaderBackground({ className }: { className?: string }) {
  return (
    <ShaderBackground
      variant="fluid"
      color1="#00d4ff"
      color2="#001a33"
      color3="#00ffff"
      speed={0.8}
      interactive
      className={className}
    />
  );
}

export function NeuralShaderBackground({ className }: { className?: string }) {
  return (
    <ShaderBackground
      variant="neural"
      color1="#8b5cf6"
      color2="#2d1b4e"
      color3="#e9d5ff"
      speed={0.6}
      intensity={0.8}
      className={className}
    />
  );
}
