/**
 * Specialized ShaderBackground preset variants
 */

import ShaderBackground from './ShaderBackground';

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
