/**
 * ShowcaseSections Component
 * Forum and Customization showcase sections with lazy loading
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

export function ForumShowcaseSection() {
  return (
    <section className="showcase-section">
      <div className="showcase-section__header">
        <p className="features__eyebrow font-robert">Community Forums</p>
        <h2 className="features__title font-zentry">Drag & Drop Forums</h2>
        <p className="showcase-section__desc">
          Organize your community with our revolutionary drag-and-drop forum system.
        </p>
      </div>
      <Suspense fallback={<ShowcaseLoading text="Loading Forum Preview..." />}>
        <ForumShowcase />
      </Suspense>
    </section>
  );
}

export function CustomizationShowcaseSection() {
  return (
    <section className="showcase-section showcase-section--alt">
      <div className="showcase-section__header">
        <p className="features__eyebrow font-robert">Personalization</p>
        <h2 className="features__title font-zentry">Make It Yours</h2>
        <p className="showcase-section__desc">
          Customize every aspect of your profile with themes, borders, and effects.
        </p>
      </div>
      <Suspense fallback={<ShowcaseLoading text="Loading Customization Preview..." />}>
        <CustomizationDemo />
      </Suspense>
    </section>
  );
}
