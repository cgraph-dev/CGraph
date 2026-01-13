import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/guides/QUICKSTART">
            Get Started →
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/api/API_REFERENCE"
            style={{marginLeft: '1rem'}}>
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({title, description, link, icon}) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <Link to={link} className={styles.featureLink}>
          Learn more →
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Documentation for CGraph - The All-in-One Open-Source Communication Platform">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <FeatureCard
                title="Quick Start"
                description="Get CGraph up and running in under 5 minutes with our step-by-step guide."
                link="/guides/QUICKSTART"
                icon="🚀"
              />
              <FeatureCard
                title="API Reference"
                description="Complete REST API documentation with examples and OpenAPI specification."
                link="/api/API_REFERENCE"
                icon="📡"
              />
              <FeatureCard
                title="Architecture"
                description="Deep dive into CGraph's system design, database schema, and real-time architecture."
                link="/architecture/ARCHITECTURE"
                icon="🏗️"
              />
            </div>
            <div className="row" style={{marginTop: '2rem'}}>
              <FeatureCard
                title="Security"
                description="Learn about CGraph's security features including E2EE, authentication, and hardening."
                link="/guides/SECURITY"
                icon="🔒"
              />
              <FeatureCard
                title="Deployment"
                description="Production deployment guides for Docker, Kubernetes, and bare metal."
                link="/guides/DEPLOYMENT"
                icon="☁️"
              />
              <FeatureCard
                title="Contributing"
                description="Join the CGraph community and help build the future of open-source communication."
                link="/guides/CONTRIBUTING"
                icon="🤝"
              />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
