/**
 * Animation utilities and CSS keyframes for CGraph
 * Provides smooth, performant animations across the app
 */

// Timing functions
export const easings = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeInOut: 'cubic-bezier(0.87, 0, 0.13, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Duration presets
export const durations = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

// Animation class generators
export const fadeIn = (duration = durations.normal) => ({
  animation: `fadeIn ${duration}ms ${easings.easeOut} forwards`,
});

export const slideUp = (duration = durations.normal) => ({
  animation: `slideUp ${duration}ms ${easings.easeOut} forwards`,
});

export const slideDown = (duration = durations.normal) => ({
  animation: `slideDown ${duration}ms ${easings.easeOut} forwards`,
});

export const scaleIn = (duration = durations.normal) => ({
  animation: `scaleIn ${duration}ms ${easings.spring} forwards`,
});

export const shimmer = () => ({
  animation: 'shimmer 2s infinite linear',
  backgroundSize: '200% 100%',
});

// Stagger delay calculator for list animations
export const staggerDelay = (index: number, baseDelay = 50) => ({
  animationDelay: `${index * baseDelay}ms`,
});

// CSS keyframes to inject (add to global styles)
export const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(10px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  @keyframes slideDown {
    from { 
      opacity: 0; 
      transform: translateY(-10px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  @keyframes slideInRight {
    from { 
      opacity: 0; 
      transform: translateX(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
  
  @keyframes slideInLeft {
    from { 
      opacity: 0; 
      transform: translateX(-20px); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0; 
      transform: scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: scale(1); 
    }
  }
  
  @keyframes scaleOut {
    from { 
      opacity: 1; 
      transform: scale(1); 
    }
    to { 
      opacity: 0; 
      transform: scale(0.95); 
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px var(--glow-color, rgba(99, 102, 241, 0.5)); }
    50% { box-shadow: 0 0 20px var(--glow-color, rgba(99, 102, 241, 0.8)); }
  }
`;

// Tailwind-compatible animation classes
export const animationClasses = {
  fadeIn: 'animate-[fadeIn_200ms_ease-out_forwards]',
  fadeOut: 'animate-[fadeOut_150ms_ease-in_forwards]',
  slideUp: 'animate-[slideUp_200ms_ease-out_forwards]',
  slideDown: 'animate-[slideDown_200ms_ease-out_forwards]',
  slideInRight: 'animate-[slideInRight_200ms_ease-out_forwards]',
  slideInLeft: 'animate-[slideInLeft_200ms_ease-out_forwards]',
  scaleIn: 'animate-[scaleIn_200ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
} as const;

// Transition presets for interactive elements
export const transitions = {
  default: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-150 ease-out',
  slow: 'transition-all duration-300 ease-out',
  colors: 'transition-colors duration-200 ease-out',
  transform: 'transition-transform duration-200 ease-out',
  opacity: 'transition-opacity duration-200 ease-out',
} as const;

// Hover effect classes
export const hoverEffects = {
  lift: 'hover:-translate-y-0.5 hover:shadow-lg',
  scale: 'hover:scale-[1.02] active:scale-[0.98]',
  glow: 'hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]',
  brighten: 'hover:brightness-110',
} as const;
