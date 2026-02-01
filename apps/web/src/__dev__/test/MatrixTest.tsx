/**
 * Matrix Animation Test Page
 * Temporary test page to verify Matrix animation works
 */

import { useRef, useEffect, useState } from 'react';
import { MatrixBackground } from '@/lib/animations/matrix';

export default function MatrixTest() {
  const [showMatrix, setShowMatrix] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple canvas test
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 200;

    // Draw test pattern
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 300, 200);
    ctx.fillStyle = '#00ff00';
    ctx.font = '20px monospace';
    ctx.fillText('Canvas Works!', 50, 100);
  }, []);

  return (
    <div className="relative min-h-screen bg-black" style={{ backgroundColor: '#000' }}>
      {/* Simple canvas test */}
      <div className="absolute left-4 top-4 z-50 rounded bg-black p-4">
        <h2 className="mb-2 text-white">Simple Canvas Test:</h2>
        <canvas ref={canvasRef} className="border border-white" />
      </div>

      {/* Matrix toggle */}
      <div className="absolute right-4 top-4 z-50">
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          className="rounded bg-green-600 px-4 py-2 text-white"
        >
          {showMatrix ? 'Hide' : 'Show'} Matrix
        </button>
      </div>

      {/* Direct Matrix component test */}
      {showMatrix && (
        <MatrixBackground theme="matrix-green" opacity={1} zIndex={1} fullscreen debug />
      )}

      {/* Content overlay */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-green-500 bg-black/50 p-8">
          <h1 className="text-4xl font-bold text-green-400">Matrix Test</h1>
          <p className="mt-4 text-green-300">
            If you see green falling characters behind this, the Matrix animation works!
          </p>
          <p className="mt-2 text-white">Check browser console (F12) for debug logs</p>
        </div>
      </div>
    </div>
  );
}
