/**
 * Navigation — Floating liquid glass pill navigation bar.
 *
 * Stays fixed at top with backdrop blur, glass-surface styling,
 * and smooth scroll links. Responsive with mobile hamburger menu.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { cn, springPreset, springSnap } from './shared';
import { WEB_APP_URL } from '@/constants';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Social Proof', href: '#social-proof' },
] as const;

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springPreset}
      className={cn('fixed inset-x-0 top-0 z-50 flex items-center justify-center px-4 py-3')}
    >
      <nav
        className={cn(
          'flex w-full max-w-5xl items-center justify-between rounded-2xl px-5 py-2.5',
          'transition-all duration-300',
          scrolled ? 'glass-elevated shadow-glass-lg' : 'bg-transparent'
        )}
      >
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-glow-blue via-glow-purple to-glow-pink">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <span className="text-lg font-bold text-slate-900">CGraph</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/60 hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`${WEB_APP_URL}/login`}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Log in
          </a>
          <motion.a
            href={`${WEB_APP_URL}/register`}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={springSnap}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold',
              'bg-gradient-to-r from-glow-blue via-glow-purple to-glow-pink text-white shadow-glass',
              'transition-shadow hover:shadow-glass-lg'
            )}
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100/60 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springSnap}
            className="glass-elevated absolute inset-x-4 top-full mt-2 flex flex-col gap-1 rounded-2xl p-4 shadow-glass-lg md:hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100/60 hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
            <hr className="my-1 border-slate-200/60" />
            <a
              href={`${WEB_APP_URL}/login`}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600"
            >
              Log in
            </a>
            <a
              href={`${WEB_APP_URL}/register`}
              className={cn(
                'mt-1 block rounded-xl py-2.5 text-center text-sm font-semibold',
                'bg-gradient-to-r from-glow-blue via-glow-purple to-glow-pink text-white shadow-glass'
              )}
            >
              Get Started Free
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
