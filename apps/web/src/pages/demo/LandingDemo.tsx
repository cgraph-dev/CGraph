/**
 * CGraph Landing Page Demo - GAMELAND Style
 *
 * This is a demo page to preview the GAMELAND-inspired design:
 * - Preloader with animated loading bar
 * - Video hero section with clip-path masks
 * - Purple/lime/black color scheme
 * - Button text-swap animation
 * - 3D tilt cards with glare effect
 * - Scroll-triggered GSAP animations
 *
 * Visit /demo/landing to preview
 */

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './landing-demo.css';

// Lazy load showcase components
const CustomizationDemo = lazy(() =>
  import('@/components/landing/CustomizationDemo').then((m) => ({ default: m.CustomizationDemo }))
);

const ForumShowcase = lazy(() =>
  import('@/components/landing/ForumShowcase').then((m) => ({ default: m.ForumShowcase }))
);

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// DATA
// =============================================================================

const features = [
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description:
      'Signal Protocol with X3DH key agreement and Double Ratchet algorithm. Your messages stay private.',
  },
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    description:
      'Sub-200ms delivery with WebSocket channels. Feel the speed of instant communication.',
  },
  {
    icon: '🏛️',
    title: 'Forums & Communities',
    description: 'Reddit-style communities with voting, threads, and powerful moderation tools.',
  },
  {
    icon: '👥',
    title: 'Groups & Channels',
    description: 'Discord-style servers with roles, permissions, and organized channel structures.',
  },
  {
    icon: '📞',
    title: 'Voice & Video Calls',
    description: 'Crystal-clear WebRTC calling with screen sharing and recording capabilities.',
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description: 'Earn XP, unlock achievements, complete quests, and climb the leaderboards.',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<200', label: 'ms Latency' },
  { value: '256-bit', label: 'Encryption' },
  { value: '50+', label: 'Features' },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything to get started',
    features: [
      'Unlimited messaging',
      'Join 10 forums',
      'Create 3 groups',
      '1-on-1 calls',
      '100MB storage',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '$9',
    period: '/month',
    description: 'For power users',
    features: [
      'Everything in Free',
      'Unlimited forums',
      'Group calls (25)',
      '10GB storage',
      'Priority support',
    ],
    cta: 'Start Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations',
    features: ['Everything in Premium', 'Custom branding', 'SSO/SAML', 'Admin controls', 'SLA'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API', href: '/api' },
    { label: 'Status', href: '/status' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'GDPR', href: '/gdpr' },
  ],
};

const securityFeatures = [
  { icon: '🔒', title: 'Zero-Knowledge', description: 'We cannot read your messages' },
  { icon: '🛡️', title: 'X3DH Protocol', description: 'Industry-standard key exchange' },
  { icon: '🔑', title: 'Double Ratchet', description: 'Forward secrecy per message' },
  { icon: '📱', title: 'Multi-Device', description: 'Seamless sync everywhere' },
  { icon: '🔏', title: 'HTTP-Only', description: 'XSS-resistant sessions' },
  { icon: '✅', title: 'Open Source', description: 'Transparent & auditable' },
  { icon: '⚡', title: 'Zero Latency', description: 'Real-time message delivery' },
  { icon: '🌐', title: 'Global CDN', description: 'Fast anywhere in the world' },
  { icon: '🧩', title: 'Modular Design', description: 'Extensible architecture' },
];

// =============================================================================
// SECURITY ICON WITH PREVIEW
// =============================================================================

function SecurityIconCard({ feature }: { feature: (typeof securityFeatures)[0] }) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceAbove > spaceBelow ? 'top' : 'bottom');
    }
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className="about__icon-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {feature.icon}

      {/* Preview Tooltip */}
      {isHovered && (
        <div
          className={`security-preview ${position === 'top' ? 'security-preview--top' : 'security-preview--bottom'}`}
        >
          <div className="security-preview__glow" />
          <div className="security-preview__content">
            <div className="security-preview__icon">{feature.icon}</div>
            <div className="security-preview__info">
              <h4 className="security-preview__title">{feature.title}</h4>
              <p className="security-preview__desc">{feature.description}</p>
            </div>
          </div>
          <div className="security-preview__arrow" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// GAMELAND-STYLE PRELOADER COMPONENT
// =============================================================================

function Preloader({ onComplete }: { onComplete: () => void }) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const pre = preloaderRef.current;
    const elFill = fillRef.current;
    const elPercent = percentRef.current;
    const elStatus = statusRef.current;

    if (!pre || !elFill || !elPercent || !elStatus) return;

    let viewProgress = 0;
    let done = false;

    // Prep hero elements for intro animation (hidden state)
    const prepHeroIntro = () => {
      gsap.set('.hero__eyebrow', {
        y: 60,
        opacity: 0,
        scale: 0.98,
        willChange: 'transform,opacity',
      });
      gsap.set('.hero__title', {
        y: 40,
        opacity: 0,
        willChange: 'transform,opacity',
      });
      gsap.set('.hero__subtitle', {
        y: 22,
        opacity: 0,
        skewY: 5,
        willChange: 'transform,opacity',
      });
      gsap.set('.hero__buttons', {
        y: 18,
        opacity: 0,
        scale: 0,
        willChange: 'transform,opacity',
      });
    };

    // Animate hero elements in after preloader closes
    const runHeroAnimations = () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.to('.hero__eyebrow', {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.65,
        onComplete: () => {
          gsap.set('.hero__eyebrow', { clearProps: 'transform,willChange' });
        },
      })
        .to(
          '.hero__title',
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            onComplete: () => {
              gsap.set('.hero__title', { clearProps: 'transform,willChange' });
            },
          },
          '>-0.3'
        )
        .to(
          '.hero__subtitle',
          {
            y: 0,
            opacity: 1,
            skewY: 0,
            duration: 0.55,
            onComplete: () => {
              gsap.set('.hero__subtitle', { clearProps: 'transform,willChange' });
            },
          },
          '>-0.25'
        )
        .to(
          '.hero__buttons',
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: 'back.out(1.7)',
            onComplete: () => {
              gsap.set('.hero__buttons', { clearProps: 'transform,willChange' });
            },
          },
          '>-0.13'
        );
    };

    // Simulate loading progress (GAMELAND uses resource loading, we simulate)
    const simulateLoading = () => {
      const loadTl = gsap.timeline();

      // Slowly progress to ~85% over 1.5s
      loadTl.to(
        {},
        {
          duration: 1.5,
          onUpdate: function () {
            const progress = this.progress();
            viewProgress = progress * 0.85;
            const pct = Math.floor(viewProgress * 100);
            elPercent.textContent = pct + '%';
            elFill.style.width = pct + '%';
          },
        }
      );

      // Then call closePreloader
      loadTl.call(closePreloader);
    };

    // Close preloader with GAMELAND-style eased completion
    const closePreloader = () => {
      if (done) return;
      done = true;

      // Change status to READY with animation class
      elStatus.textContent = 'READY';
      elStatus.classList.add('is-ready');

      // Ease progress to 100% (GAMELAND formula: viewProgress += (1 - viewProgress) * 0.3)
      gsap.to(
        {},
        {
          duration: 0.25,
          onUpdate: () => {
            viewProgress += (1 - viewProgress) * 0.3;
            const pct = viewProgress >= 0.99 ? 100 : Math.floor(viewProgress * 100);
            elPercent.textContent = pct + '%';
            elFill.style.width = pct + '%';
          },
          onComplete: () => {
            // Prep hero elements before fade
            prepHeroIntro();

            // Refresh ScrollTrigger if available
            if (ScrollTrigger) ScrollTrigger.refresh();

            // Fade out preloader
            gsap.to(pre, {
              opacity: 0,
              duration: 0.35,
              ease: 'power2.out',
              onComplete: () => {
                pre.classList.add('is-done');
                document.documentElement.classList.add('site-ready');
                document.documentElement.style.overflow = '';

                // Run hero entrance animations
                runHeroAnimations();

                // Refresh ScrollTrigger after animations
                if (ScrollTrigger) ScrollTrigger.refresh(true);

                // Notify parent
                onComplete();
              },
            });
          },
        }
      );
    };

    // Lock scroll during preloader
    document.documentElement.style.overflow = 'hidden';

    // Start loading simulation
    simulateLoading();

    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [onComplete]);

  return (
    <div ref={preloaderRef} className="preloader" aria-hidden="true">
      {/* Animated grid background */}
      <div className="preloader__grid" />

      {/* Floating orbs */}
      <div className="preloader__orbs">
        <div className="preloader__orb preloader__orb--1" />
        <div className="preloader__orb preloader__orb--2" />
        <div className="preloader__orb preloader__orb--3" />
      </div>

      {/* Scanline effect */}
      <div className="preloader__scanline" />

      {/* Corner accents */}
      <div className="preloader__corner preloader__corner--tl" />
      <div className="preloader__corner preloader__corner--tr" />
      <div className="preloader__corner preloader__corner--bl" />
      <div className="preloader__corner preloader__corner--br" />

      {/* Main content */}
      <div className="preloader__inner">
        <h3 className="preloader__brand">CGRAPH</h3>
        <div className="preloader__bar-wrapper">
          <div className="preloader__bar">
            <span ref={fillRef} className="preloader__fill" />
          </div>
        </div>
        <div className="preloader__meta">
          <span ref={percentRef} className="preloader__percent">
            0%
          </span>
          <span className="preloader__dot">•</span>
          <span ref={statusRef} className="preloader__status">
            INITIALIZING SECURE CHANNELS
          </span>
        </div>
      </div>

      {/* Version tag */}
      <div className="preloader__version">v2.0.0</div>
    </div>
  );
}

// =============================================================================
// TILT CARD COMPONENT (GAMELAND-STYLE)
// =============================================================================

function TiltCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let rect: DOMRect | null = null;
    let raf = 0;
    let hover = false;
    let tx = 0.5,
      ty = 0.5,
      targetX = 0.5,
      targetY = 0.5;
    const max = 12;
    const scaleHover = 0.985;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

    const measure = () => {
      rect = card.getBoundingClientRect();
    };

    const tick = () => {
      raf = 0;
      tx = lerp(tx, targetX, 0.18);
      ty = lerp(ty, targetY, 0.18);

      const ry = clamp((tx - 0.5) * (max * 2), -max, max);
      const rx = clamp(-(ty - 0.5) * (max * 2), -max, max);

      card.style.setProperty('--ry', ry + 'deg');
      card.style.setProperty('--rx', rx + 'deg');
      card.style.setProperty('--s', hover ? String(scaleHover) : '1');
      card.style.setProperty('--mouse-x', clamp(tx * 100, 2, 98) + '%');
      card.style.setProperty('--mouse-y', clamp(ty * 100, 2, 98) + '%');

      const settling = Math.abs(targetX - tx) > 1e-3 || Math.abs(targetY - ty) > 1e-3 || hover;
      if (settling) raf = requestAnimationFrame(tick);
    };

    const handleMouseEnter = () => {
      measure();
      hover = true;
      card.classList.add('is-tilting');
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!hover || !rect) return;
      const rawX = (e.clientX - rect.left) / rect.width;
      const rawY = (e.clientY - rect.top) / rect.height;
      targetX = clamp(rawX, 0, 1);
      targetY = clamp(rawY, 0, 1);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const handleMouseLeave = () => {
      hover = false;
      targetX = 0.5;
      targetY = 0.5;
      card.classList.remove('is-tilting');
      if (!raf) raf = requestAnimationFrame(tick);
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={cardRef} className="tilt-card">
      <div className="tilt-card__bg" />
      <div className="tilt-card__glare" />
      <div className="tilt-card__content">
        <span className="tilt-card__icon">{icon}</span>
        <h3 className="tilt-card__title font-display">{title}</h3>
        <p className="tilt-card__desc">{description}</p>
      </div>
      <div className="tilt-card__accent" />
    </div>
  );
}

function SwapButton({
  primary = false,
  mainText,
  altText,
  href,
}: {
  primary?: boolean;
  mainText: string;
  altText: string;
  href?: string;
}) {
  const className = `btn-swap ${primary ? 'btn-swap--primary' : ''}`;

  const content = (
    <>
      <span className="btn-swap__main">{mainText}</span>
      <span className="btn-swap__alt">{altText}</span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return <button className={className}>{content}</button>;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LandingDemo() {
  const [preloading, setPreloading] = useState(true);
  const [navHidden, setNavHidden] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const aboutVisualRef = useRef<HTMLDivElement>(null);
  const aboutGlowRef = useRef<HTMLDivElement>(null);

  // Scroll handler for nav visibility
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

  // Cursor-following glow effect for about section
  useEffect(() => {
    const visual = aboutVisualRef.current;
    const glow = aboutGlowRef.current;
    if (!visual || !glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = visual.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Offset from center (like original TiltCard3D)
      gsap.to(glow, {
        x: x - centerX,
        y: y - centerY,
        opacity: 0.8,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(glow, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    visual.addEventListener('mousemove', handleMouseMove);
    visual.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      visual.removeEventListener('mousemove', handleMouseMove);
      visual.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // GSAP animations after preload (non-hero elements - hero is animated by preloader)
  useEffect(() => {
    if (preloading) return;

    const ctx = gsap.context(() => {
      // Feature cards scroll animation
      gsap.from('.tilt-card', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // Stats scroll animation
      gsap.from('.stats__item', {
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // About section scroll animation
      gsap.from('.about__content > *', {
        scrollTrigger: {
          trigger: aboutRef.current,
          start: 'top 70%',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // CTA section scroll animation
      gsap.from('.cta__content > *', {
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, [preloading]);

  const handlePreloadComplete = useCallback(() => {
    setPreloading(false);
  }, []);

  return (
    <div className="demo-landing">
      {/* Preloader */}
      {preloading && <Preloader onComplete={handlePreloadComplete} />}

      {/* Navigation */}
      <nav className={`gl-nav ${navHidden ? 'hidden' : ''} ${navScrolled ? 'scrolled' : ''}`}>
        <Link to="/demo/landing" className="gl-nav__logo">
          <span>⬡</span>
          CGraph
        </Link>

        <div className="gl-nav__links">
          <a href="#features" className="gl-nav__link">
            Features
          </a>
          <a href="#security" className="gl-nav__link">
            Security
          </a>
          <a href="#pricing" className="gl-nav__link">
            Pricing
          </a>
        </div>

        <SwapButton mainText="Get Started" altText="Let's Go" href="/register" />
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="hero">
        <div className="hero__bg">
          <div className="hero__gradient-bg" />
        </div>

        <div className="hero__content">
          <span className="hero__eyebrow">Secure • Fast • Social</span>

          <h1 className="hero__title font-display">
            <span>Connect</span>
            <span className="hero__title-gradient">Without Limits</span>
          </h1>

          <p className="hero__subtitle">
            The next-generation communication platform with end-to-end encryption, real-time
            messaging, and a thriving community ecosystem.
          </p>

          <div className="hero__buttons">
            <SwapButton primary mainText="Start Free" altText="No Credit Card" href="/register" />
            <SwapButton mainText="Learn More" altText="Explore" href="#features" />
          </div>
        </div>

        <div className="hero__scroll">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} id="features" className="features">
        <div className="features__header">
          <p className="features__eyebrow">Powerful Features</p>
          <h2 className="features__title font-display">Everything You Need</h2>
        </div>

        <div className="features__grid">
          {features.map((feature) => (
            <TiltCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="stats">
        <div className="stats__container">
          {stats.map((stat) => (
            <div key={stat.label} className="stats__item">
              <div className="stats__value font-display">{stat.value}</div>
              <div className="stats__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About/Security */}
      <section ref={aboutRef} id="security" className="about">
        <div className="about__container">
          <div className="about__content">
            <p className="about__eyebrow">Bank-Grade Security</p>
            <h2 className="about__title font-display">Your Privacy Is Our Priority</h2>
            <p className="about__desc">
              Built from the ground up with security in mind. We use the Signal Protocol for
              end-to-end encryption, ensuring that only you and your recipients can read your
              messages. Not even we can access your private conversations.
            </p>
            <SwapButton mainText="Security Details" altText="Learn More" />
          </div>

          <div ref={aboutVisualRef} className="about__visual">
            <div className="about__orb" />
            <div
              ref={aboutGlowRef}
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 blur-3xl"
            />
            <div className="about__icon-grid">
              {securityFeatures.map((feature, i) => (
                <SecurityIconCard key={i} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Forum Showcase */}
      <section className="showcase-section">
        <div className="showcase-section__header">
          <p className="features__eyebrow">Community Forums</p>
          <h2 className="features__title font-display">Drag & Drop Forums</h2>
          <p className="showcase-section__desc">
            Organize your community with our revolutionary drag-and-drop forum system.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="showcase-loading">
              <div className="showcase-loading__spinner" />
              <span>Loading Forum Preview...</span>
            </div>
          }
        >
          <ForumShowcase />
        </Suspense>
      </section>

      {/* Customization Demo */}
      <section className="showcase-section showcase-section--alt">
        <div className="showcase-section__header">
          <p className="features__eyebrow">Personalization</p>
          <h2 className="features__title font-display">Make It Yours</h2>
          <p className="showcase-section__desc">
            Customize every aspect of your profile with themes, borders, and effects.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="showcase-loading">
              <div className="showcase-loading__spinner" />
              <span>Loading Customization Preview...</span>
            </div>
          }
        >
          <CustomizationDemo />
        </Suspense>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing">
        <div className="pricing__header">
          <p className="features__eyebrow">Pricing</p>
          <h2 className="features__title font-display">Simple, Transparent Pricing</h2>
        </div>

        <div className="pricing__grid">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing__card ${tier.highlighted ? 'pricing__card--highlighted' : ''}`}
            >
              {tier.highlighted && <span className="pricing__badge">Most Popular</span>}
              <h3 className="pricing__name font-display">{tier.name}</h3>
              <div className="pricing__price">
                <span className="pricing__amount">{tier.price}</span>
                <span className="pricing__period">{tier.period}</span>
              </div>
              <p className="pricing__desc">{tier.description}</p>

              <ul className="pricing__features">
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <svg
                      className="pricing__check"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`pricing__cta ${tier.highlighted ? 'pricing__cta--primary' : ''}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="cta">
        <div className="cta__content">
          <span className="cta__rocket">🚀</span>
          <h2 className="cta__title font-display">
            Ready for <span className="cta__highlight">True Privacy</span>?
          </h2>
          <p className="cta__desc">Join thousands building the future of secure communication.</p>
          <div className="cta__buttons">
            <SwapButton
              primary
              mainText="Create Free Account"
              altText="It's Free!"
              href="/register"
            />
            <SwapButton mainText="Sign In" altText="Welcome Back" href="/login" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gl-footer">
        <div className="gl-footer__main">
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Product</h4>
            {footerLinks.product.map((link) => (
              <a key={link.label} href={link.href} className="gl-footer__link">
                {link.label}
              </a>
            ))}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Resources</h4>
            {footerLinks.resources.map((link) => (
              <Link key={link.label} to={link.href} className="gl-footer__link">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Company</h4>
            {footerLinks.company.map((link) => (
              <Link key={link.label} to={link.href} className="gl-footer__link">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Legal</h4>
            {footerLinks.legal.map((link) => (
              <Link key={link.label} to={link.href} className="gl-footer__link">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="gl-footer__bottom">
          <div className="gl-footer__bottom-left">
            <Link to="/forums" className="gl-footer__logo">
              <svg
                className="gl-footer__logo-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>© 2026 CGraph</span>
            </Link>
          </div>
          <div className="gl-footer__socials">
            <a
              href="https://twitter.com/cgraph"
              target="_blank"
              rel="noopener noreferrer"
              className="gl-footer__social"
              aria-label="Twitter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com/cgraph"
              target="_blank"
              rel="noopener noreferrer"
              className="gl-footer__social"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Return to current landing button */}
      <Link to="/" className="demo-return">
        ← Back to Current Landing
      </Link>
    </div>
  );
}
