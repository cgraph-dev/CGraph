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
    <div className="min-h-screen bg-black relative" style={{ backgroundColor: '#000' }}>
      {/* Simple canvas test */}
      <div className="absolute top-4 left-4 z-50 bg-black p-4 rounded">
        <h2 className="text-white mb-2">Simple Canvas Test:</h2>
        <canvas ref={canvasRef} className="border border-white" />
      </div>
      
      {/* Matrix toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={() => setShowMatrix(!showMatrix)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {showMatrix ? 'Hide' : 'Show'} Matrix
        </button>
      </div>
      
      {/* Direct Matrix component test */}
      {showMatrix && (
        <MatrixBackground
          theme="matrix-green"
          opacity={1}
          zIndex={1}
          fullscreen
          debug
        />
      )}
      
      {/* Content overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="bg-black/50 p-8 rounded-lg border border-green-500">
          <h1 className="text-4xl font-bold text-green-400">Matrix Test</h1>
          <p className="text-green-300 mt-4">If you see green falling characters behind this, the Matrix animation works!</p>
          <p className="text-white mt-2">Check browser console (F12) for debug logs</p>
        </div>
      </div>
    </div>
  );
}
