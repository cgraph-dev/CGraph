/**
 * Navigation Component
 * Main navigation bar with scroll effects
 */

import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/logo';
import { SwapButton } from './SwapButton';

interface NavigationProps {
  navHidden: boolean;
  navScrolled: boolean;
}

export function Navigation({ navHidden, navScrolled }: NavigationProps) {
  return (
    <nav className={`gl-nav ${navHidden ? 'hidden' : ''} ${navScrolled ? 'scrolled' : ''}`}>
      <Link to="/demo/landing" className="gl-nav__logo">
        <LogoIcon size={32} showGlow animated color="gradient" />
        <span className="gl-nav__logo-text">CGraph</span>
      </Link>

      <div className="gl-nav__links">
        <a href="#features" className="gl-nav__link">
          Features
        </a>
        <a href="#security" className="gl-nav__link">
          Security
        </a>
        <a href="#pricing" className="gl-nav__link">
          Pricing
        </a>
      </div>

      <SwapButton mainText="Get Started" altText="Let's Go" href="/register" />
    </nav>
  );
}
