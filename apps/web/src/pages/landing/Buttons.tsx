/**
 * Landing Page Button Components
 *
 * Animated buttons for the landing page.
 *
 * @module pages/LandingPage/Buttons
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';

// =============================================================================
// SIGN IN BUTTON
// =============================================================================

/**
 * Animated Sign In Button with glowing border and icon animation
 */
export const SignInButton = memo(function SignInButton() {
  return (
    <Link to="/login" className="btn-signin group">
      <span className="btn-signin__glow" />
      <span className="btn-signin__border" />
      <span className="btn-signin__content">
        <svg
          className="btn-signin__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        <span className="btn-signin__text">Sign In</span>
        <span className="btn-signin__text-hover">Welcome</span>
      </span>
    </Link>
  );
});

// =============================================================================
// SWAP BUTTON
// =============================================================================

interface SwapButtonProps {
  primary?: boolean;
  mainText: string;
  altText: string;
  href?: string;
}

/**
 * Button with text swap animation on hover
 */
export const SwapButton = memo(function SwapButton({
  primary = false,
  mainText,
  altText,
  href,
}: SwapButtonProps) {
  const className = `btn-swap ${primary ? 'btn-swap--primary' : ''}`;

  const content = (
    <>
      <span className="btn-swap__main">{mainText}</span>
      <span className="btn-swap__alt">{altText}</span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {content}
    </button>
  );
});
