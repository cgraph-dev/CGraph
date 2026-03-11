import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const FeatureList = [
  {
    title: '🔒 End-to-End Encryption',
    description: (
      <>
        Messages secured with Signal Protocol-inspired encryption. Your conversations are private by
        default with industry-standard AES-256-GCM encryption.
      </>
    ),
    link: '/docs/architecture/ARCHITECTURE',
  },
  {
    title: '⚡ Real-Time Everything',
    description: (
      <>
        Phoenix Channels deliver instant message delivery, presence updates, and live collaboration
        with sub-50ms latency.
      </>
    ),
    link: '/docs/architecture/REALTIME_COMMUNICATION',
  },
  {
    title: '🎮 Gamification Built-In',
    description: (
      <>
        XP, levels, achievements, quests, and seasonal badges. Keep your community engaged with
        RPG-style progression.
      </>
    ),
    link: '/docs/guides/USER_GUIDE',
  },
  {
    title: '💬 Forums & Communities',
    description: (
      <>
        Full-featured forum system with boards, threads, subscriptions, and rich text editing.
        Perfect for community building.
      </>
    ),
    link: '/docs/guides/FORUM_HOSTING_PLATFORM',
  },
  {
    title: '📱 Cross-Platform',
    description: (
      <>
        Native apps for iOS, Android, and web. Shared codebase with React Native and React for
        consistent experiences.
      </>
    ),
    link: '/docs/guides/MOBILE',
  },
  {
    title: '🚀 Production Ready',
    description: (
      <>
        Built on Elixir/Phoenix for massive scalability. Handle millions of concurrent connections
        with fault-tolerant architecture.
      </>
    ),
    link: '/docs/guides/DEPLOYMENT',
  },
];

function Feature({ title, description, link }) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className={styles.featureCard}>
        <div className={styles.featureContent}>
          <h3 className={styles.featureTitle}>{title}</h3>
          <p className={styles.featureDescription}>{description}</p>
        </div>
        <div className={styles.featureArrow}>→</div>
      </Link>
    </div>
  );
}

function HeroSection() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroBackground}>
        <div className={styles.heroGlow}></div>
        <div className={styles.heroGrid}></div>
      </div>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>CG</div>
          </div>
          <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
          <p className={styles.heroSubtitle}>
            The all-in-one open-source communication platform with
            <span className={styles.highlight}> end-to-end encryption</span>,
            <span className={styles.highlight}> gamification</span>, and
            <span className={styles.highlight}> real-time collaboration</span>
          </p>
          <div className={styles.buttons}>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/guides/QUICKSTART"
            >
              Get Started →
            </Link>
            <Link
              className={clsx('button button--lg', styles.secondaryButton)}
              to="/docs/architecture/ARCHITECTURE"
            >
              Architecture
            </Link>
            <Link
              className={clsx('button button--lg', styles.githubButton)}
              href="https://github.com/cgraph-dev/CGraph"
            >
              <svg className={styles.githubIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsSection() {
  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>50k+</div>
            <div className={styles.statLabel}>Lines of Code</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>3</div>
            <div className={styles.statLabel}>Platforms</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>E2E</div>
            <div className={styles.statLabel}>Encrypted</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>MIT</div>
            <div className={styles.statLabel}>Licensed</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TechStackSection() {
  const technologies = [
    { name: 'Elixir', icon: '💧' },
    { name: 'Phoenix', icon: '🔥' },
    { name: 'React', icon: '⚛️' },
    { name: 'React Native', icon: '📱' },
    { name: 'TypeScript', icon: '🔷' },
    { name: 'PostgreSQL', icon: '🐘' },
    { name: 'Redis', icon: '🔴' },
    { name: 'WebRTC', icon: '📹' },
  ];

  return (
    <section className={styles.techSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Built with Modern Tech</h2>
        <div className={styles.techGrid}>
          {technologies.map((tech) => (
            <div key={tech.name} className={styles.techItem}>
              <span className={styles.techIcon}>{tech.icon}</span>
              <span className={styles.techName}>{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <HeroSection />
      <StatsSection />
      <main>
        <section className={styles.features}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Why CGraph?</h2>
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
        <TechStackSection />
        <section className={styles.ctaSection}>
          <div className="container">
            <h2 className={styles.ctaTitle}>Ready to Build?</h2>
            <p className={styles.ctaDescription}>
              Get started with CGraph in minutes. Self-host your own instance or contribute to the
              open-source project.
            </p>
            <div className={styles.ctaButtons}>
              <Link
                className={clsx('button button--lg', styles.primaryButton)}
                to="/docs/guides/QUICKSTART"
              >
                Quick Start Guide
              </Link>
              <Link
                className={clsx('button button--lg', styles.secondaryButton)}
                to="/docs/api/API_REFERENCE"
              >
                API Reference
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
