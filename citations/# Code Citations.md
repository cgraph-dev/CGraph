# Code Citations

## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```


## License: unknown
https://github.com/ZxBing0066/Blog/blob/57eade525c5f72f7affee86532dc1a0821c6c398/blog/cool-gradient-next-js-conf-btn.md

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/freebot/freebot.github.io/blob/22873a88cfa1f2f5367fa907455ea08efc7f5d6e/blog/%26quot%3Blink.url%26quot%3B/index.html

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: GPL-3.0
https://github.com/sorenabedi/artist-svelte/blob/9234b22ae05920e16ee31948ec66cbaff237c8da/src/lib/scss/components/badge/_gradient.scss

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45
```


## License: unknown
https://github.com/kotvasili/kotvasili.github.io/blob/9e8ac10dc5c189ce7dd7286cd23bd9c430b7d523/src/components/ChatList/ChatListItem/ChatListItem.styles.ts

```
I can't edit files directly right now. Here's the complete implementation — two files to update:

---

**1. [Navigation.tsx](apps/landing/src/components/marketing/layout/Navigation.tsx)** — Add `cta` state and replace the CTA `<a>` with a `motion.a`:

Add state after `mobileMenuOpen` (line ~100):
```tsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cta, setCta] = useState({ x: 0, y: 0 });
  const location = useLocation();
```

Replace the CTA block (lines ~168-183):
```tsx
        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />
          {/* Diagonal light sweep */}
          <span className="gl-nav-unified__cta-sweep" />
          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>
```

---

**2. [marketing-pages.css](apps/landing/src/components/marketing/marketing-pages.css)** — Replace lines 1166-1203 (the entire `.gl-nav-unified__cta` block):

```css
.gl-nav-unified__cta {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 50px;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 18px -4px rgba(16, 185, 129, 0.25);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 768px) {
  .gl-nav-unified__cta {
    display: flex;
  }
}

/* Animated gradient border ring */
.gl-nav-unified__cta-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(16, 185, 129, 0.6) 25%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(16, 185, 129, 0.6) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.45;
  animation: nav
```

