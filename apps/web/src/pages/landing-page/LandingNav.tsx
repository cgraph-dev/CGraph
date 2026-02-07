/**
 * Landing Page Navigation
 *
 * Top navigation bar with smooth-scroll anchor links,
 * scroll-based hide/show behavior, and sign-in button.
 *
 * @module pages/landing-page/LandingNav
 */

import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/logo';
import { SignInButton } from '../landing';
import type { LandingNavProps } from './types';

/** Smooth-scroll to a section by DOM id */
function scrollToSection(e: React.MouseEvent, id: string) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
}

/**
 * Landing page top navigation bar.
 *
 * Features:
 * - Auto-hide on scroll down, reappear on scroll up
 * - Frosted-glass background when scrolled
 * - Smooth-scroll anchor links to page sections
 */
export function LandingNav({ navHidden, navScrolled }: LandingNavProps) {
  return (
    <nav className={`gl-nav ${navHidden ? 'hidden' : ''} ${navScrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="gl-nav__logo">
        <LogoIcon size={32} showGlow animated color="gradient" />
        <span className="gl-nav__logo-text">CGraph</span>
      </Link>

      <div className="gl-nav__links">
        <a
          href="#features"
          className="gl-nav__link"
          onClick={(e) => scrollToSection(e, 'features')}
        >
          Features
        </a>
        <a
          href="#security"
          className="gl-nav__link"
          onClick={(e) => scrollToSection(e, 'security')}
        >
          Security
        </a>
        <a href="#pricing" className="gl-nav__link" onClick={(e) => scrollToSection(e, 'pricing')}>
          Pricing
        </a>
      </div>

      <SignInButton />
    </nav>
  );
}
