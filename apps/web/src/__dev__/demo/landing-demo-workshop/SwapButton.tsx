/**
 * SwapButton Component
 * Button with text-swap animation on hover
 */

import { Link } from 'react-router-dom';
import type { SwapButtonProps } from './types';

export function SwapButton({ primary = false, mainText, altText, href }: SwapButtonProps) {
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

  return <button className={className}>{content}</button>;
}
