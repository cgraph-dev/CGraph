import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook that tracks window dimensions.
 * 
 * Updates on window resize with optional debouncing.
 * 
 * @returns object with current width and height
 * 
 * @example
 * const { width, height } = useWindowSize();
 * const columns = width > 1024 ? 4 : width > 768 ? 3 : 2;
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number | null = null;

    const handleResize = () => {
      // Use requestAnimationFrame for performance
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });
    };

    window.addEventListener('resize', handleResize);

    // Set initial size
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return size;
}

/**
 * Hook that tracks if window has scrolled past a threshold.
 * 
 * @param threshold - scroll position in pixels to trigger
 * @returns boolean indicating if scrolled past threshold
 * 
 * @example
 * const isScrolled = useScrolled(100);
 * return <header className={isScrolled ? 'shadow-lg' : ''}>...</header>;
 */
export function useScrolled(threshold: number = 0): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}
