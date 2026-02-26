/**
 * @heroicons/react/20/solid — lightweight mock for vitest.
 *
 * Currently unused in the codebase but aliased to prevent potential
 * compilation hangs. Minimal placeholder.
 *
 * @since v0.9.54
 */
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const icon = (name: string) => {
  const Icon = (props: IconProps) =>
    React.createElement('svg', { 'data-testid': `icon-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

// placeholder — add icons here as needed
export const PlaceholderIcon = icon('PlaceholderIcon');
