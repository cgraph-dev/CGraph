/**
 * WebGL-Powered Visual Effects
 *
 * High-performance canvas-based effects using WebGL shaders.
 * These create stunning visual effects that will impress any developer.
 */

import { useRef, useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('webgl-effects');

// =============================================================================
// SHADER BACKGROUND
// =============================================================================

interface ShaderBackgroundProps {
  className?: string;
  preset?: 'plasma' | 'warp' | 'flow' | 'nebula' | 'electric';
  colors?: string[];
  speed?: number;
  intensity?: number;
}

export function ShaderBackground({
  className = '',
  preset = 'plasma',
  colors = ['#10b981', '#06b6d4', '#8b5cf6'],
  speed = 1,
  intensity = 1,
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
    const parseColor = (hex: string): [number, number, number] => {
      const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (!match) return [0.06, 0.73, 0.51]; // Default emerald
      return [
        parseInt(match[1]!, 16) / 255,
        parseInt(match[2]!, 16) / 255,
        parseInt(match[3]!, 16) / 255,
      ];
    };

    const color1 = parseColor(colors[0] ?? '#10b981');
    const color2 = parseColor(colors[1] ?? '#06b6d4');
    const color3 = parseColor(colors[2] ?? '#8b5cf6');

    // Shader programs based on preset
    const shaderPrograms: Record<string, { vertex: string; fragment: string }> = {
      plasma: {
        vertex: `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `,
        fragment: `
          precision mediump float;
          uniform float time;
          uniform vec2 resolution;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          uniform float intensity;

          void main() {
            vec2 uv = gl_FragCoord.xy / resolution;
            float t = time * 0.5;

            float v1 = sin(uv.x * 10.0 + t);
            float v2 = sin(10.0 * (uv.x * sin(t / 2.0) + uv.y * cos(t / 3.0)) + t);
            float v3 = sin(sqrt(100.0 * ((uv.x - 0.5) * (uv.x - 0.5) + (uv.y - 0.5) * (uv.y - 0.5)) + 1.0) + t);

            float v = v1 + v2 + v3;

            vec3 col = mix(color1, color2, sin(v) * 0.5 + 0.5);
            col = mix(col, color3, sin(v + 2.0) * 0.5 + 0.5);

            gl_FragColor = vec4(col * intensity * 0.15, 1.0);
          }
        `,
      },
      warp: {
        vertex: `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `,
        fragment: `
          precision mediump float;
          uniform float time;
          uniform vec2 resolution;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float intensity;

          void main() {
            vec2 uv = (gl_FragCoord.xy - resolution * 0.5) / min(resolution.x, resolution.y);
            float t = time * 0.3;

            float angle = atan(uv.y, uv.x);
            float dist = length(uv);

            float wave = sin(dist * 20.0 - t * 3.0 + angle * 5.0) * 0.5 + 0.5;
            float spiral = sin(angle * 10.0 + dist * 30.0 - t * 2.0) * 0.5 + 0.5;

            vec3 col = mix(color1, color2, wave * spiral);
            float alpha = smoothstep(1.0, 0.3, dist) * intensity * 0.2;

            gl_FragColor = vec4(col * alpha, 1.0);
          }
        `,
      },
      flow: {
        vertex: `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `,
        fragment: `
          precision mediump float;
          uniform float time;
          uniform vec2 resolution;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          uniform float intensity;

          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            vec2 uv = gl_FragCoord.xy / resolution;
            float t = time * 0.2;

            float n1 = noise(uv * 5.0 + t);
            float n2 = noise(uv * 10.0 - t * 0.5);
            float n3 = noise(uv * 15.0 + vec2(t * 0.3, -t * 0.2));

            float flow = sin(uv.x * 3.0 + n1 * 2.0 + t) * cos(uv.y * 3.0 + n2 * 2.0 - t);

            vec3 col = color1 * flow;
            col += color2 * (1.0 - flow) * n3;
            col += color3 * noise(uv + t * 0.1) * 0.3;

            gl_FragColor = vec4(col * intensity * 0.15, 1.0);
          }
        `,
      },
      nebula: {
        vertex: `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `,
        fragment: `
          precision mediump float;
          uniform float time;
          uniform vec2 resolution;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          uniform float intensity;

          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise(p);
              p *= 2.0;
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 uv = gl_FragCoord.xy / resolution;
            float t = time * 0.1;

            float n = fbm(uv * 3.0 + t);
            float n2 = fbm(uv * 5.0 - t * 0.5);

            vec3 col = mix(color1, color2, n);
            col = mix(col, color3, n2 * 0.5);

            float stars = step(0.98, noise(uv * 100.0 + floor(t)));
            col += vec3(stars) * 0.5;

            gl_FragColor = vec4(col * intensity * 0.2, 1.0);
          }
        `,
      },
      electric: {
        vertex: `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `,
        fragment: `
          precision mediump float;
          uniform float time;
          uniform vec2 resolution;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float intensity;

          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            vec2 uv = gl_FragCoord.xy / resolution;
            float t = time;

            float bolt = 0.0;
            for (float i = 0.0; i < 5.0; i++) {
              vec2 p = uv;
              p.x += sin(p.y * 20.0 + t * (i + 1.0)) * 0.1 * noise(vec2(t * i));
              float d = abs(p.x - 0.5 - sin(t + i) * 0.3);
              bolt += 0.01 / (d + 0.01);
            }

            vec3 col = mix(color1, color2, bolt * 0.1);
            col *= bolt * intensity * 0.05;

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      },
    };

    const shaderSrc = shaderPrograms[preset] || shaderPrograms.plasma;
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

    // Resize handler with debouncing to prevent layout thrashing
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

// =============================================================================
// METABALL CANVAS
// =============================================================================

interface MetaballsProps {
  count?: number;
  colors?: string[];
  className?: string;
  speed?: number;
}

export function Metaballs({
  count = 6,
  colors = ['#10b981', '#06b6d4', '#8b5cf6'],
  className = '',
  speed = 1,
}: MetaballsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    // Initialize balls
    const balls = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2 * speed,
      vy: (Math.random() - 0.5) * 2 * speed,
      radius: Math.random() * 100 + 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Resize handler with debouncing
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const debouncedResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 100);
    };

    resize();
    window.addEventListener('resize', debouncedResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw balls
      balls.forEach((ball) => {
        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off edges
        if (ball.x < 0 || ball.x > canvas.width) ball.vx *= -1;
        if (ball.y < 0 || ball.y > canvas.height) ball.vy *= -1;

        // Draw metaball
        const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
        gradient.addColorStop(0, ball.color + '80');
        gradient.addColorStop(0.5, ball.color + '40');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationId);
    };
  }, [count, colors, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ filter: 'blur(40px)' }}
    />
  );
}

// =============================================================================
// GEOMETRIC PATTERNS
// =============================================================================

interface GeometricPatternProps {
  pattern?: 'hexagons' | 'triangles' | 'squares' | 'circles';
  color?: string;
  size?: number;
  className?: string;
  animated?: boolean;
}

export function GeometricPattern({
  pattern = 'hexagons',
  color = '#10b981',
  size = 60,
  className = '',
  animated = true,
}: GeometricPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const drawHexagon = (x: number, y: number, r: number, offset: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + offset;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const drawTriangle = (x: number, y: number, r: number, offset: number) => {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = ((Math.PI * 2) / 3) * i + offset - Math.PI / 2;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 1;

      const offset = animated ? time * 0.001 : 0;

      if (pattern === 'hexagons') {
        const h = size * Math.sqrt(3);
        for (let row = -1; row < canvas.height / h + 1; row++) {
          for (let col = -1; col < canvas.width / (size * 1.5) + 1; col++) {
            const x = col * size * 1.5;
            const y = row * h + (col % 2) * (h / 2);
            drawHexagon(x, y, size, offset);
          }
        }
      } else if (pattern === 'triangles') {
        const h = (size * Math.sqrt(3)) / 2;
        for (let row = 0; row < canvas.height / h + 1; row++) {
          for (let col = 0; col < canvas.width / size + 1; col++) {
            const x = col * size + (row % 2) * (size / 2);
            const y = row * h;
            drawTriangle(x, y, size / 2, (row + col) % 2 ? Math.PI : 0 + offset);
          }
        }
      } else if (pattern === 'squares') {
        for (let row = 0; row < canvas.height / size + 1; row++) {
          for (let col = 0; col < canvas.width / size + 1; col++) {
            const x = col * size;
            const y = row * size;
            ctx.strokeRect(x, y, size, size);
          }
        }
      } else if (pattern === 'circles') {
        for (let row = 0; row < canvas.height / size + 1; row++) {
          for (let col = 0; col < canvas.width / size + 1; col++) {
            const x = col * size + size / 2;
            const y = row * size + size / 2;
            const pulseRadius = (size / 2) * (1 + Math.sin(time * 0.002 + row + col) * 0.1);
            ctx.beginPath();
            ctx.arc(x, y, animated ? pulseRadius : size / 2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      time++;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [pattern, color, size, animated]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}

// =============================================================================
// CONSTELLATION NETWORK
// =============================================================================

interface ConstellationProps {
  nodeCount?: number;
  color?: string;
  maxConnections?: number;
  className?: string;
  interactive?: boolean;
}

export function Constellation({
  nodeCount = 50,
  color = '#10b981',
  maxConnections = 3,
  className = '',
  interactive = true,
}: ConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    // Initialize nodes
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      connections: [] as number[],
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener('resize', resize);
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Build connections
    nodes.forEach((node, i) => {
      const distances = nodes
        .map((other, j) => ({
          index: j,
          dist: Math.hypot(node.x - other.x, node.y - other.y),
        }))
        .filter((d) => d.index !== i)
        .sort((a, b) => a.dist - b.dist);

      node.connections = distances.slice(0, maxConnections).map((d) => d.index);
    });

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Wrap around
        if (node.x < 0) node.x = canvas.width;
        if (node.x > canvas.width) node.x = 0;
        if (node.y < 0) node.y = canvas.height;
        if (node.y > canvas.height) node.y = 0;

        // Mouse attraction
        if (interactive) {
          const dx = mouseRef.current.x - node.x;
          const dy = mouseRef.current.y - node.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 200) {
            node.vx += dx * 0.0001;
            node.vy += dy * 0.0001;
          }
        }

        // Damping
        node.vx *= 0.99;
        node.vy *= 0.99;
      });

      // Draw connections
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 0.5;
      nodes.forEach((node) => {
        node.connections.forEach((j) => {
          const other = nodes[j];
          if (!other) return;
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist < 200) {
            ctx.globalAlpha = 1 - dist / 200;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = color + '40';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationId);
    };
  }, [nodeCount, color, maxConnections, interactive]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}

// =============================================================================
// VORTEX ANIMATION
// =============================================================================

interface VortexProps {
  color?: string;
  particleCount?: number;
  className?: string;
  speed?: number;
}

export function Vortex({
  color = '#10b981',
  particleCount = 200,
  className = '',
  speed = 1,
}: VortexProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Initialize particles
    const particles = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.min(canvas.width, canvas.height) * 0.4;
      return {
        angle,
        distance,
        speed: (Math.random() * 0.02 + 0.01) * speed,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.5,
      };
    });

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.angle += particle.speed;
        particle.distance -= 0.1 * speed;

        if (particle.distance < 10) {
          particle.distance = Math.min(canvas.width, canvas.height) * 0.4;
        }

        const x = centerX + Math.cos(particle.angle) * particle.distance;
        const y = centerY + Math.sin(particle.angle) * particle.distance;

        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle =
          color +
          Math.floor(particle.opacity * 255)
            .toString(16)
            .padStart(2, '0');
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color, particleCount, speed]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}

// =============================================================================
// WAVE MESH
// =============================================================================

interface WaveMeshProps {
  color?: string;
  rows?: number;
  cols?: number;
  className?: string;
  amplitude?: number;
  speed?: number;
}

export function WaveMesh({
  color = '#10b981',
  rows = 20,
  cols = 30,
  className = '',
  amplitude = 30,
  speed = 1,
}: WaveMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 1;

      // Draw horizontal lines
      for (let row = 0; row <= rows; row++) {
        ctx.beginPath();
        for (let col = 0; col <= cols; col++) {
          const x = col * cellWidth;
          const wave = Math.sin(col * 0.3 + time * 0.02 * speed) * amplitude;
          const y = row * cellHeight + wave;

          if (col === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw vertical lines
      for (let col = 0; col <= cols; col++) {
        ctx.beginPath();
        for (let row = 0; row <= rows; row++) {
          const wave = Math.sin(col * 0.3 + time * 0.02 * speed) * amplitude;
          const x = col * cellWidth;
          const y = row * cellHeight + wave;

          if (row === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      time++;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color, rows, cols, amplitude, speed]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}

// =============================================================================
// DNA HELIX
// =============================================================================

interface DNAHelixProps {
  color1?: string;
  color2?: string;
  className?: string;
  speed?: number;
}

export function DNAHelix({
  color1 = '#10b981',
  color2 = '#8b5cf6',
  className = '',
  speed = 1,
}: DNAHelixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const amplitude = canvas.width * 0.15;
      const nodeCount = 30;
      const spacing = canvas.height / nodeCount;

      for (let i = 0; i < nodeCount; i++) {
        const y = i * spacing;
        const phase = i * 0.2 + time * 0.02 * speed;

        // First strand
        const x1 = centerX + Math.sin(phase) * amplitude;
        const z1 = Math.cos(phase);

        // Second strand (opposite phase)
        const x2 = centerX + Math.sin(phase + Math.PI) * amplitude;
        const z2 = Math.cos(phase + Math.PI);

        // Draw connecting line
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.abs(z1) * 0.1})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();

        // Draw nodes
        const size1 = 4 + z1 * 3;
        const size2 = 4 + z2 * 3;

        ctx.fillStyle = color1;
        ctx.globalAlpha = 0.5 + z1 * 0.5;
        ctx.beginPath();
        ctx.arc(x1, y, Math.max(size1, 1), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color2;
        ctx.globalAlpha = 0.5 + z2 * 0.5;
        ctx.beginPath();
        ctx.arc(x2, y, Math.max(size2, 1), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      time++;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color1, color2, speed]);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} />;
}
