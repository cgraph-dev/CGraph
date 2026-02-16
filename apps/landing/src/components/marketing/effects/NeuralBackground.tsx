import React, { useEffect, useRef } from 'react';
import { GraphNetwork, GraphNetworkOptions } from './GraphNetwork';

export interface NeuralBackgroundProps {
  className?: string;
  options?: GraphNetworkOptions & { nodeColors?: string[] };
}

/**
 * NeuralBackground - React Wrapper for GraphNetwork
 *
 * Renders a canvas-based neural network animation as a background.
 * Automatically handles cleanup and responsive sizing.
 */
export const NeuralBackground = React.memo(function NeuralBackground({
  className = '',
  options,
}: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const networkRef = useRef<GraphNetwork | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create network
    networkRef.current = new GraphNetwork(canvas, {
      nodeCount: 100,
      connectionDistance: 180,
      mouseRepulsionRadius: 200,
      mouseRepulsionStrength: 0.6,
      nodeColor: '#10b981',
      connectionColorStart: '#10b981',
      connectionColorEnd: '#8b5cf6',
      nodeSize: 2.5,
      animationSpeed: 1,
      ...options,
    });

    return () => {
      networkRef.current?.destroy();
    };
  }, [options]);

  return (
    <canvas
      ref={canvasRef}
      className={`neural-background ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
      }}
    />
  );
});
