/**
 * Input Components Library
 *
 * Advanced input components with animations and gestures.
 */

// ============================================================================
// Color Picker
// ============================================================================

export { ColorPicker } from './ColorPicker';

export type { ColorPickerProps } from './ColorPicker';

// ============================================================================
// Slider Group
// ============================================================================

export {
  Slider,
  RangeSlider,
  SliderGroup,
} from './SliderGroup';

export type {
  SliderProps,
  RangeSliderProps,
  SliderGroupProps,
} from './SliderGroup';

// ============================================================================
// Default Export
// ============================================================================

const InputComponents = {
  ColorPicker,
  Slider,
  RangeSlider,
  SliderGroup,
};

export default InputComponents;
