/**
 * useNavScroll Hook
 * Navigation visibility and scroll state management
 */

import { useState, useEffect } from 'react';

interface NavScrollState {
  navHidden: boolean;
  navScrolled: boolean;
}

export function useNavScroll(): NavScrollState {
  const [navHidden, setNavHidden] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    let lastScroll = 0;

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setNavHidden(currentScroll > lastScroll && currentScroll > 100);
      setNavScrolled(currentScroll > 50);
      lastScroll = currentScroll;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { navHidden, navScrolled };
}
