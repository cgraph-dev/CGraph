import '@testing-library/jest-dom';

// Polyfill window.matchMedia for jsdom (used by GlobalBackground and other components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill window.scrollTo for jsdom (used by MarketingLayout)
window.scrollTo = (() => {}) as typeof window.scrollTo;

// Polyfill HTMLCanvasElement.getContext for jsdom (used by GraphNetwork)
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext;
