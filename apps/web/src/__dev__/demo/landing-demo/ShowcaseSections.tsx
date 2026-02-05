/**
 * Showcase Sections Component
 *
 * Lazy-loaded Customization and Forum showcase sections
 */

import { lazy, Suspense } from 'react';

// Lazy load showcase components
const CustomizationDemo = lazy(() =>
  import('@/components/landing/CustomizationDemo').then((m) => ({ default: m.CustomizationDemo }))
);

const ForumShowcase = lazy(() =>
  import('@/components/landing/ForumShowcase').then((m) => ({ default: m.ForumShowcase }))
);

function ShowcaseLoading({ text }: { text: string }) {
  return (
    <div className="showcase-loading">
      <div className="showcase-loading__spinner" />
      <span>{text}</span>
    </div>
  );
}

export function CustomizationShowcase() {
  return (
    <section className="showcase-section zoom-section">
      <Suspense fallback={<ShowcaseLoading text="Loading Customization Preview..." />}>
        <CustomizationDemo />
      </Suspense>
    </section>
  );
}

export function ForumShowcaseSection() {
  return (
    <section className="showcase-section showcase-section--alt zoom-section">
      <Suspense fallback={<ShowcaseLoading text="Loading Forum Preview..." />}>
        <ForumShowcase />
      </Suspense>
    </section>
  );
}
