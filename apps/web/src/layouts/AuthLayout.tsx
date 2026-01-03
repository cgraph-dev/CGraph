import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MatrixAuthBackground, MatrixLogo } from '@/lib/animations/matrix';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-black">
      {/* Matrix Background Effect - position:fixed, renders at z-index 1 */}
      <MatrixAuthBackground 
        theme="matrix-green"
        opacity={0.95}
        zIndex={1}
      />
      
      {/* Dark overlay with subtle green gradient for content readability */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-dark-950/50 to-matrix-dim/30 z-[2]" />
      
      {/* Left side - Branding with matrix-themed styling */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700/70 via-primary-800/80 to-matrix-800/90 backdrop-blur-sm p-12 flex-col justify-between relative z-10">
        {/* Animated grid overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" 
               style={{
                 backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
                 backgroundSize: '50px 50px',
                 animation: 'float 20s ease-in-out infinite'
               }} 
          />
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center 
                          transition-all duration-300 group-hover:bg-white/20 group-hover:shadow-glow-md">
              <svg
                className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            {/* Matrix-style animated logo text */}
            <MatrixLogo 
              text="CGraph" 
              className="text-2xl font-bold text-white"
              glowColor="#10b981"
              animationDuration={2000}
              loopDelay={8000}
            />
          </Link>
        </div>

        <div className="space-y-6 relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight matrix-glow">
            Connect, Share, and Build Community
          </h1>
          <p className="text-lg text-white/80">
            The all-in-one platform for messaging, group discussions, and community forums.
            Built for the next generation of online communication.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10
                          transition-all duration-300 hover:bg-white/15 hover:border-primary-400/30 hover:shadow-glow-sm">
              <div className="text-2xl font-bold text-white">E2E</div>
              <div className="text-sm text-white/70">Encrypted</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10
                          transition-all duration-300 hover:bg-white/15 hover:border-primary-400/30 hover:shadow-glow-sm">
              <div className="text-2xl font-bold text-white">Real-time</div>
              <div className="text-sm text-white/70">Messaging</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/10
                          transition-all duration-300 hover:bg-white/15 hover:border-primary-400/30 hover:shadow-glow-sm">
              <div className="text-2xl font-bold text-white">Web3</div>
              <div className="text-sm text-white/70">Ready</div>
            </div>
          </div>
        </div>

        <div className="text-white/60 text-sm relative z-10">
          © 2024 CGraph. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form with matrix-themed card */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md matrix-card backdrop-blur-md rounded-2xl p-8 shadow-2xl 
                      transition-all duration-500 animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  );
}
