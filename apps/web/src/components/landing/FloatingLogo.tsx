/**
 * FloatingLogo - 3D WebGL Floating Logo Component
 *
 * A stunning 3D logo that floats and responds to mouse movement.
 * Uses pure WebGL for maximum performance (no Three.js dependency).
 *
 * Features:
 * - 3D rotation following mouse position
 * - Smooth floating animation
 * - Glow/bloom effect
 * - Gradient coloring
 * - Performance-optimized rendering
 */

import { useRef, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';

interface FloatingLogoProps {
  /** Size of the logo canvas */
  size?: number;
  /** Primary color */
  primaryColor?: string;
  /** Secondary color for gradient */
  secondaryColor?: string;
  /** Glow color */
  glowColor?: string;
  /** Mouse follow intensity (0-1) */
  mouseIntensity?: number;
  /** Float animation amplitude */
  floatAmplitude?: number;
  /** Additional CSS classes */
  className?: string;
}

// Vertex shader for 3D logo
const vertexShaderSource = `
  attribute vec4 a_position;
  attribute vec3 a_normal;
  
  uniform mat4 u_modelViewMatrix;
  uniform mat4 u_projectionMatrix;
  uniform mat3 u_normalMatrix;
  
  varying vec3 v_normal;
  varying vec3 v_position;
  
  void main() {
    v_normal = u_normalMatrix * a_normal;
    v_position = (u_modelViewMatrix * a_position).xyz;
    gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
  }
`;

// Fragment shader with gradient and glow
const fragmentShaderSource = `
  precision mediump float;
  
  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform vec3 u_glowColor;
  uniform vec3 u_lightDirection;
  uniform float u_time;
  
  varying vec3 v_normal;
  varying vec3 v_position;
  
  void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightDirection);
    
    // Diffuse lighting
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Specular highlight
    vec3 viewDir = normalize(-v_position);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    
    // Gradient based on position
    float gradient = (v_position.y + 1.0) * 0.5;
    vec3 baseColor = mix(u_primaryColor, u_secondaryColor, gradient);
    
    // Fresnel glow effect
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    vec3 glowEffect = u_glowColor * fresnel * (0.5 + 0.5 * sin(u_time * 2.0));
    
    // Combine lighting
    vec3 ambient = baseColor * 0.3;
    vec3 diffuse = baseColor * diff * 0.7;
    vec3 specular = vec3(1.0) * spec * 0.5;
    
    vec3 finalColor = ambient + diffuse + specular + glowEffect;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Create shader program
function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
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
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

// Generate CGraph "C" logo geometry (simplified 3D shape)
function generateLogoGeometry(): {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
} {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Create a stylized "C" shape using a torus segment
  const segments = 32;
  const rings = 16;
  const radius = 0.8;
  const tubeRadius = 0.25;
  const startAngle = Math.PI * 0.3;
  const endAngle = Math.PI * 1.7;

  for (let ring = 0; ring <= rings; ring++) {
    const theta = startAngle + ((endAngle - startAngle) * ring) / rings;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let seg = 0; seg <= segments; seg++) {
      const phi = (seg / segments) * Math.PI * 2;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      // Position
      const x = (radius + tubeRadius * cosPhi) * cosTheta;
      const y = tubeRadius * sinPhi;
      const z = (radius + tubeRadius * cosPhi) * sinTheta;

      positions.push(x, y, z);

      // Normal
      const nx = cosPhi * cosTheta;
      const ny = sinPhi;
      const nz = cosPhi * sinTheta;

      normals.push(nx, ny, nz);
    }
  }

  // Generate indices
  for (let ring = 0; ring < rings; ring++) {
    for (let seg = 0; seg < segments; seg++) {
      const current = ring * (segments + 1) + seg;
      const next = current + segments + 1;

      indices.push(current, next, current + 1);
      indices.push(current + 1, next, next + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

// Matrix utilities
function perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1.0 / Math.tan(fov / 2);
  const rangeInv = 1 / (near - far);

  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (near + far) * rangeInv,
    -1,
    0,
    0,
    near * far * rangeInv * 2,
    0,
  ]);
}

function multiply(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i * 4 + j] =
        (a[i * 4] as number) * (b[j] as number) +
        (a[i * 4 + 1] as number) * (b[4 + j] as number) +
        (a[i * 4 + 2] as number) * (b[8 + j] as number) +
        (a[i * 4 + 3] as number) * (b[12 + j] as number);
    }
  }
  return result;
}

function rotateX(angle: number): Float32Array {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function rotateY(angle: number): Float32Array {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

function translate(x: number, y: number, z: number): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

function getNormalMatrix(modelView: Float32Array): Float32Array {
  // Extract 3x3 and compute inverse transpose (simplified for rotation-only)
  return new Float32Array([
    modelView[0] as number,
    modelView[1] as number,
    modelView[2] as number,
    modelView[4] as number,
    modelView[5] as number,
    modelView[6] as number,
    modelView[8] as number,
    modelView[9] as number,
    modelView[10] as number,
  ]);
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result && result[1] && result[2] && result[3]) {
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  }
  return [0.5, 0.5, 0.5];
}

export const FloatingLogo = memo(function FloatingLogo({
  size = 300,
  primaryColor = '#10b981',
  secondaryColor = '#8b5cf6',
  glowColor = '#06b6d4',
  mouseIntensity = 0.3,
  floatAmplitude = 10,
  className = '',
}: FloatingLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      mouseRef.current = {
        x: ((e.clientX - centerX) / (rect.width / 2)) * mouseIntensity,
        y: ((e.clientY - centerY) / (rect.height / 2)) * mouseIntensity,
      };

      targetRotationRef.current = {
        x: -mouseRef.current.y * Math.PI * 0.25,
        y: mouseRef.current.x * Math.PI * 0.25,
      };
    },
    [mouseIntensity]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('FloatingLogo: Canvas ref not available');
      return;
    }

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.warn('FloatingLogo: WebGL not supported, showing fallback');
      // Show fallback
      const fallback = canvas.parentElement?.querySelector(
        '.floating-logo__fallback'
      ) as HTMLElement;
      if (fallback) fallback.style.opacity = '1';
      return;
    }

    console.log('FloatingLogo: WebGL context created successfully');

    // Create shaders and program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    gl.useProgram(program);

    // Get attribute and uniform locations
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const normalLoc = gl.getAttribLocation(program, 'a_normal');
    const modelViewLoc = gl.getUniformLocation(program, 'u_modelViewMatrix');
    const projectionLoc = gl.getUniformLocation(program, 'u_projectionMatrix');
    const normalMatrixLoc = gl.getUniformLocation(program, 'u_normalMatrix');
    const primaryColorLoc = gl.getUniformLocation(program, 'u_primaryColor');
    const secondaryColorLoc = gl.getUniformLocation(program, 'u_secondaryColor');
    const glowColorLoc = gl.getUniformLocation(program, 'u_glowColor');
    const lightDirLoc = gl.getUniformLocation(program, 'u_lightDirection');
    const timeLoc = gl.getUniformLocation(program, 'u_time');

    // Generate logo geometry
    const { positions, normals, indices } = generateLogoGeometry();

    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Set up attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.enableVertexAttribArray(normalLoc);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Set uniforms
    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);
    const glowRgb = hexToRgb(glowColor);

    gl.uniform3fv(primaryColorLoc, primaryRgb);
    gl.uniform3fv(secondaryColorLoc, secondaryRgb);
    gl.uniform3fv(glowColorLoc, glowRgb);
    gl.uniform3fv(lightDirLoc, [0.5, 0.7, 1.0]);

    // Set up projection
    const projectionMatrix = perspective(Math.PI / 4, 1, 0.1, 100);
    gl.uniformMatrix4fv(projectionLoc, false, projectionMatrix);

    // Enable depth testing and blending
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Animation loop
    const render = () => {
      const time = (Date.now() - startTimeRef.current) / 1000;

      // Smooth rotation interpolation
      currentRotationRef.current.x +=
        (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y +=
        (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;

      // Clear
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Compute model-view matrix
      const floatY = Math.sin(time * 1.5) * (floatAmplitude / size);
      const baseRotation = time * 0.3;

      let modelView = translate(0, floatY, -3);
      modelView = multiply(modelView, rotateY(baseRotation + currentRotationRef.current.y));
      modelView = multiply(modelView, rotateX(currentRotationRef.current.x));

      gl.uniformMatrix4fv(modelViewLoc, false, modelView);
      gl.uniformMatrix3fv(normalMatrixLoc, false, getNormalMatrix(modelView));
      gl.uniform1f(timeLoc, time);

      // Draw
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      rafIdRef.current = requestAnimationFrame(render);
    };

    render();

    // Mouse listener
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(normalBuffer);
      gl.deleteBuffer(indexBuffer);
    };
  }, [primaryColor, secondaryColor, glowColor, floatAmplitude, size, handleMouseMove]);

  return (
    <motion.div
      className={`floating-logo ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      style={{
        width: size,
        height: size,
        position: 'relative',
        pointerEvents: 'auto',
      }}
    >
      {/* Glow backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background: `radial-gradient(circle, ${glowColor}40 0%, ${primaryColor}20 50%, transparent 70%)`,
          filter: 'blur(30px)',
          animation: 'floating-logo-glow 3s ease-in-out infinite',
        }}
      />

      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* CSS fallback logo if WebGL fails */}
      <div
        className="floating-logo__fallback"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.5,
          fontWeight: 700,
          fontFamily: 'Orbitron, sans-serif',
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        C
      </div>
    </motion.div>
  );
});

export default FloatingLogo;
