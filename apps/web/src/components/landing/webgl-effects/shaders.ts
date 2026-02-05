/**
 * WebGL Effects - Shader Programs
 * GLSL shader source code for WebGL effects
 */

import type { ShaderProgram, ShaderPreset } from './types';

// Common vertex shader
const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Plasma effect fragment shader
const PLASMA_FRAGMENT = `
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
`;

// Warp effect fragment shader
const WARP_FRAGMENT = `
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
`;

// Flow effect fragment shader
const FLOW_FRAGMENT = `
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
`;

// Nebula effect fragment shader
const NEBULA_FRAGMENT = `
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
`;

// Electric effect fragment shader
const ELECTRIC_FRAGMENT = `
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
`;

// Shader program map
export const SHADER_PROGRAMS: Record<ShaderPreset, ShaderProgram> = {
  plasma: { vertex: VERTEX_SHADER, fragment: PLASMA_FRAGMENT },
  warp: { vertex: VERTEX_SHADER, fragment: WARP_FRAGMENT },
  flow: { vertex: VERTEX_SHADER, fragment: FLOW_FRAGMENT },
  nebula: { vertex: VERTEX_SHADER, fragment: NEBULA_FRAGMENT },
  electric: { vertex: VERTEX_SHADER, fragment: ELECTRIC_FRAGMENT },
};
