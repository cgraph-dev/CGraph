/**
 * React hook for tracking device window dimensions, scale, and font scale with real-time updates.
 * @module hooks/useWindowSize
 */
import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface WindowSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
 * Hook that returns the current window dimensions.
 *
 * Automatically updates when the window size changes (orientation, etc.)
 *
 * @returns current window dimensions
 *
 * @example
 * const { width, height } = useWindowSize();
 * const isLandscape = width > height;
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return { width, height, scale, fontScale };
  });

  useEffect(() => {
    const handleChange = ({ window }: { window: ScaledSize }) => {
      setWindowSize({
        width: window.width,
        height: window.height,
        scale: window.scale,
        fontScale: window.fontScale,
      });
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return windowSize;
}

/**
 * Hook that returns screen dimensions (including status bar, etc.)
 */
export function useScreenSize(): WindowSize {
  const [screenSize, setScreenSize] = useState<WindowSize>(() => {
    const { width, height, scale, fontScale } = Dimensions.get('screen');
    return { width, height, scale, fontScale };
  });

  useEffect(() => {
    const handleChange = ({ screen }: { screen: ScaledSize }) => {
      setScreenSize({
        width: screen.width,
        height: screen.height,
        scale: screen.scale,
        fontScale: screen.fontScale,
      });
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return screenSize;
}

/**
 * Hook that returns whether the device is in landscape orientation.
 */
export function useIsLandscape(): boolean {
  const { width, height } = useWindowSize();
  return width > height;
}

/**
 * Hook that returns whether the device is a tablet based on screen size.
 * Uses a threshold of 768px width as the tablet breakpoint.
 */
export function useIsTablet(): boolean {
  const { width } = useWindowSize();
  return width >= 768;
}

export default useWindowSize;
