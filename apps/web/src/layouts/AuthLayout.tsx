import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MatrixAuthBackground } from '@/lib/animations/matrix';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-dark-950">
      {/* Matrix Background Effect - renders behind everything */}
      <MatrixAuthBackground 
        theme="matrix-green"
        opacity={0.6}
      />
      
      {/* Dark overlay for content readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900/70 via-dark-900/80 to-dark-950/90 z-[1]" />
      
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600/80 to-primary-800/80 backdrop-blur-sm p-12 flex-col justify-between relative z-10">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
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
            <span className="text-2xl font-bold text-white">CGraph</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Connect, Share, and Build Community
          </h1>
          <p className="text-lg text-white/80">
            The all-in-one platform for messaging, group discussions, and community forums.
            Built for the next generation of online communication.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">E2E</div>
              <div className="text-sm text-white/70">Encrypted</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">Real-time</div>
              <div className="text-sm text-white/70">Messaging</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">Web3</div>
              <div className="text-sm text-white/70">Ready</div>
            </div>
          </div>
        </div>

        <div className="text-white/60 text-sm">
          © 2024 CGraph. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md bg-dark-900/80 backdrop-blur-md rounded-2xl p-8 border border-dark-700/50 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
