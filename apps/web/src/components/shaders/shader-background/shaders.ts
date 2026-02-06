/**
 * GLSL shader source strings
 */

// Vertex Shader (shared)
export const vertexShader = `
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment Shader - Fluid Animation
export const fluidFragmentShader = `
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
export const particleFragmentShader = `
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
export const waveFragmentShader = `
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
