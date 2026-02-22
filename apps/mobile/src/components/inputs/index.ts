/**
 * Input Components Library
 *
 * Advanced input components with animations and gestures.
 */

// Import for default export object
import { ColorPicker } from './color-picker';
import { Slider, RangeSlider, SliderGroup } from './slider-group';

// ============================================================================
// Color Picker
// ============================================================================

export { ColorPicker } from './color-picker';

export type { ColorPickerProps } from './color-picker';

// ============================================================================
// Slider Group
// ============================================================================

export { Slider, RangeSlider, SliderGroup } from './slider-group';

export type { SliderProps, RangeSliderProps, SliderGroupProps } from './slider-group';

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
