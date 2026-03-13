/**
 * AnimatedComponents - Re-export barrel file
 *
 * Components are split into separate files for maintainability.
 * This file preserves the original public API.
 */

export { ENTERING_PRESETS, EXITING_PRESETS, LAYOUT_PRESETS } from './animation-presets';
export { AnimatedView } from './animated-view';
export type { AnimatedViewProps } from './animated-view';
export { AnimatedText } from './animated-text';
export type { AnimatedTextProps } from './animated-text';
export { AnimatedButton } from './animated-button';
export type { AnimatedButtonProps } from './animated-button';
export {
  AnimatedList,
  AnimatedImage,
  AnimatedCounter,
  AnimatedProgress,
} from './animated-data-components';
export type {
  AnimatedListProps,
  AnimatedImageProps,
  AnimatedCounterProps,
  AnimatedProgressProps,
} from './animated-data-components';

import { AnimatedView } from './animated-view';
import { AnimatedText } from './animated-text';
import { AnimatedButton } from './animated-button';
import {
  AnimatedList,
  AnimatedImage,
  AnimatedCounter,
  AnimatedProgress,
} from './animated-data-components';
import { ENTERING_PRESETS, EXITING_PRESETS, LAYOUT_PRESETS } from './animation-presets';

const AnimatedComponents = {
  AnimatedView,
  AnimatedText,
  AnimatedButton,
  AnimatedList,
  AnimatedImage,
  AnimatedCounter,
  AnimatedProgress,
  ENTERING_PRESETS,
  EXITING_PRESETS,
  LAYOUT_PRESETS,
};

export default AnimatedComponents;
