/**
 * ShaderBackground types
 */

export type ShaderVariant = 'fluid' | 'particles' | 'waves' | 'neural' | 'matrix';

export interface ShaderBackgroundProps {
  variant?: ShaderVariant;
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  intensity?: number;
  interactive?: boolean;
  className?: string;
}
