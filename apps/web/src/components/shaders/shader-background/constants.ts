/**
 * Shader variant configuration map
 */

import { fluidFragmentShader, particleFragmentShader, waveFragmentShader } from './shaders';
import type { ShaderVariant } from './types';

export const shaderVariants: Record<ShaderVariant, string> = {
  fluid: fluidFragmentShader,
  particles: particleFragmentShader,
  waves: waveFragmentShader,
  neural: fluidFragmentShader, // Can use same with different colors
  matrix: particleFragmentShader,
};
