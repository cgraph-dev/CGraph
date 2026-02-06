/**
 * Shader Background Module
 *
 * High-performance WebGL animated backgrounds using custom GLSL shaders.
 * Supports fluid, particle, wave, neural, and matrix visual effects
 * with interactive mouse tracking.
 *
 * @module components/shaders/shader-background
 * @since v0.7.33
 */

// Main component
export { default } from './ShaderBackground';

// Preset variants
export { MatrixShaderBackground, CyberShaderBackground, NeuralShaderBackground } from './variants';

// Hooks
export { useWebGLRefs, parseColor } from './hooks';
export type { WebGLRefs } from './hooks';

// Types
export type { ShaderBackgroundProps, ShaderVariant } from './types';

// Constants
export { shaderVariants } from './constants';

// Shaders
export {
  vertexShader,
  fluidFragmentShader,
  particleFragmentShader,
  waveFragmentShader,
} from './shaders';
