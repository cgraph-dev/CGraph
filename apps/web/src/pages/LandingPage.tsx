/**
 * CGraph Landing Page - GAMELAND Style
 *
 * Official landing page featuring:
 * - Instant hero animations on mount (no preloader for speed)
 * - Video hero section with clip-path masks
 * - Purple/lime/black color scheme
 * - Button text-swap animation
 * - 3D tilt cards with glare effect
 * - Scroll-triggered GSAP animations
 * - Skeleton loaders for lazy-loaded sections
 */

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LogoIcon } from '@/components/Logo';
import {
  CustomizationDemoSkeleton,
  ForumShowcaseSkeleton,
} from '@/components/landing/LandingSkeletons';
import './landing-page.css';

// Import from landing page module
import {
  features,
  showcaseCards,
  pricingTiers,
  footerLinks,
  securityFeatures,
  throttle,
  debounce,
  TiltCard,
  SecurityIconCard,
  FeatureShowcaseCard,
  SignInButton,
  SwapButton,
} from './landing';

// Lazy load showcase components
const CustomizationDemo = lazy(() =>
  import('@/components/landing/CustomizationDemo').then((m) => ({ default: m.CustomizationDemo }))
);

const ForumShowcase = lazy(() =>
  import('@/components/landing/ForumShowcase').then((m) => ({ default: m.ForumShowcase }))
);

const InteractiveDemo = lazy(() =>
  import('@/components/landing/InteractiveDemo').then((m) => ({ default: m.InteractiveDemo }))
);

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [navHidden, setNavHidden] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const aboutVisualRef = useRef<HTMLDivElement>(null);
  const aboutGlowRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Redirect authenticated users to messages
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/messages', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle hash navigation on page load (e.g., /#pricing, /#features)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, []);

  // Scroll handler for nav visibility - throttled for performance
  useEffect(() => {
    let lastScroll = 0;

    const handleScroll = throttle(() => {
      const currentScroll = window.scrollY;
      setNavHidden(currentScroll > lastScroll && currentScroll > 100);
      setNavScrolled(currentScroll > 50);
      lastScroll = currentScroll;
    }, 16); // ~60fps

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cursor-following glow effect for about section - throttled for performance
  useEffect(() => {
    const visual = aboutVisualRef.current;
    const glow = aboutGlowRef.current;
    if (!visual || !glow) return;

    const handleMouseMove = throttle((e: MouseEvent) => {
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
        overwrite: 'auto', // Prevent animation queue buildup
      });
    }, 16); // ~60fps

    const handleMouseLeave = () => {
      gsap.to(glow, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    visual.addEventListener('mousemove', handleMouseMove, { passive: true });
    visual.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      visual.removeEventListener('mousemove', handleMouseMove);
      visual.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // GSAP animations on mount (hero + scroll-triggered elements)
  useEffect(() => {
    let gsapContextRef: gsap.Context | null = null;
    let heroTl: gsap.core.Timeline | null = null;

    // Hero entrance animations - run immediately
    gsap.set('.hero__eyebrow', { y: 60, opacity: 0, scale: 0.98 });
    gsap.set('.hero__title', { y: 40, opacity: 0 });
    gsap.set('.hero__subtitle', { y: 22, opacity: 0, skewY: 5 });
    gsap.set('.hero__buttons', { y: 18, opacity: 0, scale: 0 });

    heroTl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power2.out' } });
    heroTl
      .to('.hero__eyebrow', { y: 0, opacity: 1, scale: 1, duration: 0.65 })
      .to('.hero__title', { y: 0, opacity: 1, duration: 0.6 }, '>-0.3')
      .to('.hero__subtitle', { y: 0, opacity: 1, skewY: 0, duration: 0.55 }, '>-0.25')
      .to(
        '.hero__buttons',
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' },
        '>-0.13'
      );

    // Mark site as ready for CSS transitions
    document.documentElement.classList.add('site-ready');

    // Defer scroll-triggered animations slightly to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Section zoom effect - unified smooth parallax-style scaling
        const sections = document.querySelectorAll('.zoom-section');

        // Set initial states for all sections
        sections.forEach((section, index) => {
          // First visible section starts at full scale, others start scaled down
          if (index === 0) {
            gsap.set(section, { scale: 1, opacity: 1, transformOrigin: 'center center' });
          } else {
            gsap.set(section, { scale: 0.75, opacity: 0.2, transformOrigin: 'center center' });
          }
        });

        // Create unified zoom animation for each section
        // Sections hit 100% scale when centered in viewport (top 50%)
        sections.forEach((section) => {
          // Single timeline with scrub for smooth bidirectional scrolling
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 100%', // Animation starts when section enters viewport bottom
              end: 'top -50%', // Animation ends when section top is 50% above viewport
              scrub: 1.2, // Ultra-smooth scrubbing
              invalidateOnRefresh: true, // Recalculate on refresh
            },
          });

          // Phase 1: Scale up as section approaches center (0% to 33% progress)
          // Section scales from 75% to 100% as it moves from bottom to center
          tl.fromTo(
            section,
            { scale: 0.75, opacity: 0.2, transformOrigin: 'center center' },
            { scale: 1, opacity: 1, duration: 0.33, ease: 'sine.out' }
          );

          // Phase 2: Hold at full scale while centered (33% to 66% progress)
          // This is when section top is near viewport center (top 50%)
          tl.to(section, { scale: 1, opacity: 1, duration: 0.34, ease: 'none' });

          // Phase 3: Scale down as section leaves center (66% to 100% progress)
          // Section shrinks 25% as it scrolls past center
          tl.to(section, {
            scale: 0.75,
            opacity: 0.2,
            duration: 0.33,
            ease: 'sine.in',
          });
        });

        // Refresh ScrollTrigger after setup to ensure accurate positions
        ScrollTrigger.refresh();

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

        // Scroll indicator - follows user scroll
        if (scrollIndicatorRef.current) {
          const scrollDot = scrollIndicatorRef.current.querySelector('.hero__scroll-dot');
          const scrollArrows = scrollIndicatorRef.current.querySelectorAll(
            '.hero__scroll-arrows span'
          );

          // Animate the dot based on scroll progress
          if (scrollDot) {
            gsap.to(scrollDot, {
              scrollTrigger: {
                trigger: heroRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
              },
              y: 20,
              opacity: 0.2,
              ease: 'none',
            });
          }

          // Animate arrows cascading based on scroll
          scrollArrows.forEach((arrow, index) => {
            gsap.to(arrow, {
              scrollTrigger: {
                trigger: heroRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
              },
              y: 8 + index * 4,
              opacity: 0,
              ease: 'none',
            });
          });

          // Fade out entire scroll indicator as user scrolls
          gsap.to(scrollIndicatorRef.current, {
            scrollTrigger: {
              trigger: heroRef.current,
              start: 'top top',
              end: '30% top',
              scrub: 0.3,
            },
            opacity: 0,
            y: 20,
            ease: 'none',
          });
        }
      });

      // Store context for cleanup
      gsapContextRef = ctx;

      // ResizeObserver to refresh ScrollTrigger when lazy content loads
      const resizeObserver = new ResizeObserver(
        debounce(() => {
          ScrollTrigger.refresh();
        }, 200)
      );

      // Observe the main container for size changes (lazy content loading)
      const mainContainer = document.querySelector('.demo-landing');
      if (mainContainer) {
        resizeObserver.observe(mainContainer);
      }

      // Store in ref for cleanup
      resizeObserverRef.current = resizeObserver;
    }, 100); // Small delay to improve initial paint

    return () => {
      clearTimeout(timeoutId);
      heroTl?.kill();
      // Clean up ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      // Properly revert GSAP context and kill ScrollTriggers
      if (gsapContextRef) {
        gsapContextRef.revert();
        gsapContextRef = null;
      }
    };
  }, []);

  return (
    <div className="demo-landing">
      {/* Navigation */}
      <nav className={`gl-nav ${navHidden ? 'hidden' : ''} ${navScrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="gl-nav__logo">
          <LogoIcon size={32} showGlow animated color="gradient" />
          <span className="gl-nav__logo-text">CGraph</span>
        </Link>

        <div className="gl-nav__links">
          <a
            href="#features"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('features');
              if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
            }}
          >
            Features
          </a>
          <a
            href="#security"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('security');
              if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
            }}
          >
            Security
          </a>
          <a
            href="#pricing"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('pricing');
              if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
            }}
          >
            Pricing
          </a>
        </div>

        <SignInButton />
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="hero">
        <div className="hero__bg">
          <div className="hero__gradient-bg" />
          <div className="hero__bg-aurora" />
          <div className="hero__bg-grid" />
          <div className="hero__bg-particles" />
          <div className="hero__bg-streaks" />
          <div className="hero__bg-spotlight" />
          <div className="hero__bg-interactive" />
          <div className="hero__bg-noise" />
          <div className="hero__bg-vignette" />
          <div className="hero__bg-fade" />
        </div>

        <div className="hero__content">
          <span className="hero__eyebrow font-robert">The All-in-One Platform</span>

          <h1 className="hero__title">
            <span className="hero__title-beyond">Beyond</span>
            <span className="hero__title-gradient">Messaging</span>
          </h1>

          <p className="hero__subtitle font-robert">
            Real-time messaging meets community forums — with bank-grade encryption, Web3
            authentication, and rewards that make every interaction count.
          </p>

          <div className="hero__buttons">
            <SwapButton primary mainText="Start Free" altText="No Credit Card" href="/register" />
            <SwapButton mainText="Learn More" altText="Explore" href="#features" />
          </div>
        </div>

        <div ref={scrollIndicatorRef} className="hero__scroll">
          <span>Scroll</span>
          <div className="hero__scroll-line">
            <span className="hero__scroll-dot" />
          </div>
          <div className="hero__scroll-arrows">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section ref={statsRef} className="stats-section zoom-section">
        <div className="showcase-header">
          <span className="showcase-header__badge">✨ See the Difference</span>
          <h3 className="showcase-header__title">Hover to Discover Premium Features</h3>
        </div>
        <div className="stats-grid">
          {showcaseCards.map((card) => (
            <FeatureShowcaseCard key={card.id} data={card} />
          ))}
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="interactive-demo-section zoom-section">
        <div className="section-header">
          <span className="section-header__badge section-header__badge--cyan">🎮 Try It Now</span>
          <h2 className="section-header__title font-zentry">
            Experience CGraph <span className="section-header__gradient">Live</span>
          </h2>
          <p className="section-header__desc">
            No signup required. Explore our features in this interactive demo.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="interactive-demo-skeleton">
              <div className="interactive-demo-skeleton__header" />
              <div className="interactive-demo-skeleton__content" />
            </div>
          }
        >
          <InteractiveDemo />
        </Suspense>
      </section>

      {/* Features */}
      <section ref={featuresRef} id="features" className="features zoom-section">
        <div className="section-header">
          <span className="section-header__badge section-header__badge--emerald">
            ✨ Powerful Features
          </span>
          <h2 className="section-header__title font-zentry">
            Everything You <span className="section-header__gradient">Need</span>
          </h2>
          <p className="section-header__desc">
            Build, customize, and grow your community with our comprehensive feature set.
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature) => (
            <TiltCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Customization Demo */}
      <section className="showcase-section zoom-section">
        <Suspense fallback={<CustomizationDemoSkeleton />}>
          <CustomizationDemo />
        </Suspense>
      </section>

      {/* Forum Showcase */}
      <section className="showcase-section showcase-section--alt zoom-section">
        <Suspense fallback={<ForumShowcaseSkeleton />}>
          <ForumShowcase />
        </Suspense>
      </section>

      {/* About/Security */}
      <section ref={aboutRef} id="security" className="about zoom-section">
        <div className="about__container">
          <div className="about__content">
            <span className="mb-4 inline-block animate-[badge-subtle-pulse_4s_ease-in-out_infinite] cursor-default rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15),0_0_24px_rgba(168,85,247,0.08)] transition-all duration-300 hover:scale-[1.02] hover:animate-none hover:border-purple-500/60 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.3),0_0_40px_rgba(168,85,247,0.15)]">
              🔒 Privacy-First Design
            </span>
            <h2 className="about__title font-zentry">
              Your Privacy Is Our <span className="about__gradient">Priority</span>
            </h2>
            <p className="about__desc">
              Built from the ground up with security in mind. Your messages are end-to-end encrypted
              with AES-256, and we use Signal-inspired encryption protocols. Not even we can access
              your private conversations.
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

      {/* Pricing */}
      <section id="pricing" className="pricing zoom-section">
        <div className="section-header">
          <span className="section-header__badge section-header__badge--cyan">💎 Pricing</span>
          <h2 className="section-header__title font-zentry">
            Simple, <span className="pricing__gradient-animated">Transparent</span> Pricing
          </h2>
          <p className="section-header__desc">
            Choose the plan that fits your community. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="pricing__grid">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing__card ${tier.highlighted ? 'pricing__card--highlighted' : ''}`}
            >
              {tier.highlighted && <span className="pricing__badge">Most Popular</span>}
              <h3 className="pricing__name font-robert">{tier.name}</h3>
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
      <section ref={ctaRef} className="cta zoom-section">
        <div className="cta__content">
          <span className="mb-4 inline-block animate-[badge-emerald-pulse_4s_ease-in-out_infinite] cursor-default rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15),0_0_24px_rgba(16,185,129,0.08)] transition-all duration-300 hover:scale-[1.02] hover:animate-none hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.3),0_0_40px_rgba(16,185,129,0.15)]">
            🚀 Ready to Start?
          </span>
          <h2 className="cta__title font-zentry">
            Build Your <span className="cta__gradient-animated">Community</span>
          </h2>
          <p className="cta__desc">
            Create forums, customize your space, and connect with like-minded people.
          </p>
          <div className="cta__buttons">
            <SwapButton primary mainText="Create Account" altText="Join Now!" href="/register" />
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
              <Link key={link.label} to={link.href} className="gl-footer__link">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Resources</h4>
            {footerLinks.resources.map((link) =>
              'external' in link && link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="gl-footer__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.href} className="gl-footer__link">
                  {link.label}
                </Link>
              )
            )}
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
              <LogoIcon size={24} color="white" />
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
    </div>
  );
}
