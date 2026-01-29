/**
 * Legal/Company Page Layout
 *
 * Professional layout for legal and company pages with:
 * - Sticky navigation with glassmorphism
 * - Consistent typography and spacing
 * - Table of contents for long documents
 * - Responsive design
 */

import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoIcon } from '../../components/Logo';

interface LegalLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  tableOfContents?: { id: string; title: string }[];
}

export function LegalLayout({
  children,
  title,
  subtitle,
  lastUpdated,
  tableOfContents,
}: LegalLayoutProps) {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Update active section based on scroll position
      if (tableOfContents) {
        for (const item of [...tableOfContents].reverse()) {
          const element = document.getElementById(item.id);
          if (element && element.getBoundingClientRect().top <= 100) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tableOfContents]);

  const navLinks = [
    { to: '/about', label: 'About' },
    { to: '/careers', label: 'Careers' },
    { to: '/contact', label: 'Contact' },
    { to: '/press', label: 'Press' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="group flex items-center gap-3">
              <LogoIcon size={32} showGlow animated color="gradient" />
              <span className="text-xl font-bold tracking-tight text-white">CGraph</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm transition-colors ${
                    location.pathname === link.to
                      ? 'text-emerald-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-cyan-400"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex gap-12">
          {/* Table of Contents - Desktop Sidebar */}
          {tableOfContents && tableOfContents.length > 0 && (
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <div className="sticky top-24">
                <h4 className="mb-4 text-sm font-semibold text-white">On this page</h4>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm transition-colors ${
                        activeSection === item.id
                          ? 'text-emerald-400'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Content */}
          <main className="min-w-0 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <header className="mb-12">
                <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">{title}</h1>
                {subtitle && <p className="max-w-2xl text-xl text-gray-400">{subtitle}</p>}
                {lastUpdated && (
                  <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Last updated: {lastUpdated}</span>
                  </div>
                )}
              </header>

              {/* Article Content */}
              <article className="legal-content">{children}</article>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050508]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h5 className="mb-4 text-sm font-semibold text-white">Product</h5>
              <div className="space-y-3">
                <Link to="/#features" className="block text-sm text-gray-500 hover:text-gray-300">
                  Features
                </Link>
                <Link to="/#security" className="block text-sm text-gray-500 hover:text-gray-300">
                  Security
                </Link>
                <Link to="/#pricing" className="block text-sm text-gray-500 hover:text-gray-300">
                  Pricing
                </Link>
                <Link to="/login" className="block text-sm text-gray-500 hover:text-gray-300">
                  Download
                </Link>
              </div>
            </div>
            <div>
              <h5 className="mb-4 text-sm font-semibold text-white">Company</h5>
              <div className="space-y-3">
                <Link to="/about" className="block text-sm text-gray-500 hover:text-gray-300">
                  About
                </Link>
                <Link to="/careers" className="block text-sm text-gray-500 hover:text-gray-300">
                  Careers
                </Link>
                <Link to="/contact" className="block text-sm text-gray-500 hover:text-gray-300">
                  Contact
                </Link>
                <Link to="/press" className="block text-sm text-gray-500 hover:text-gray-300">
                  Press
                </Link>
              </div>
            </div>
            <div>
              <h5 className="mb-4 text-sm font-semibold text-white">Resources</h5>
              <div className="space-y-3">
                <a
                  href="https://docs.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-500 hover:text-gray-300"
                >
                  Documentation
                </a>
                <a
                  href="https://docs.cgraph.org/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-500 hover:text-gray-300"
                >
                  API Reference
                </a>
                <a
                  href="https://status.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-500 hover:text-gray-300"
                >
                  Status
                </a>
                <a
                  href="https://blog.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-500 hover:text-gray-300"
                >
                  Blog
                </a>
              </div>
            </div>
            <div>
              <h5 className="mb-4 text-sm font-semibold text-white">Legal</h5>
              <div className="space-y-3">
                <Link to="/privacy" className="block text-sm text-gray-500 hover:text-gray-300">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="block text-sm text-gray-500 hover:text-gray-300">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="block text-sm text-gray-500 hover:text-gray-300">
                  Cookie Policy
                </Link>
                <Link to="/gdpr" className="block text-sm text-gray-500 hover:text-gray-300">
                  GDPR
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <div className="flex items-center gap-3">
              <LogoIcon size={24} color="white" />
              <span className="text-sm text-gray-500">© 2026 CGraph. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/cgraph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 transition-colors hover:text-white"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/cgraph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 transition-colors hover:text-white"
                aria-label="GitHub"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/cgraph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 transition-colors hover:text-white"
                aria-label="Discord"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
