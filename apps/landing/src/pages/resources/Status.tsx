/**
 * Status Page - System status, SLO targets, and infrastructure overview
 *
 * All data reflects real infrastructure decisions from the project documentation.
 * No fabricated uptime metrics — clearly marked as pre-launch.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Removed fake uptime data; reflects actual project state
 * @updated v0.9.15 - Enhanced with SLO targets, infrastructure detail, security pipeline
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';

const plannedServices = [
  {
    name: 'API Server',
    domain: 'cgraph-backend.fly.dev',
    description: 'Elixir/Phoenix REST API on Fly.io (Frankfurt)',
    icon: '🔌',
  },
  {
    name: 'Web Application',
    domain: 'web.cgraph.org',
    description: 'React 19 SPA on Fly.io (IAD)',
    icon: '🌐',
  },
  {
    name: 'Real-Time Messaging',
    domain: 'WebSocket',
    description: 'Phoenix Channels for live messaging & presence',
    icon: '⚡',
  },
  {
    name: 'Authentication',
    domain: 'OAuth + JWT',
    description: 'Google, Apple OAuth providers + Web3 wallets',
    icon: '🔑',
  },
  {
    name: 'Voice & Video',
    domain: 'WebRTC',
    description: 'Peer-to-peer calls with TURN/STUN fallback',
    icon: '📞',
  },
  {
    name: 'Media Service',
    domain: 'CDN',
    description: 'File uploads, image processing, Cloudflare CDN',
    icon: '📁',
  },
];

const sloTargets = [
  {
    metric: 'API Availability',
    target: '99.9%',
    description: 'Core API uptime measured over 30-day rolling window',
    icon: '🟢',
  },
  {
    metric: 'API Latency (P95)',
    target: '<200ms',
    description: 'Response time for 95th percentile of requests',
    icon: '⏱️',
  },
  {
    metric: 'Message Delivery',
    target: '99.95%',
    description: 'End-to-end message delivery success rate',
    icon: '✉️',
  },
  {
    metric: 'WebSocket Uptime',
    target: '99.9%',
    description: 'Real-time connection availability',
    icon: '🔗',
  },
];

const healthEndpoints = [
  {
    path: '/health',
    description: 'Basic liveness check — returns 200 if the BEAM VM is running',
    method: 'GET',
  },
  {
    path: '/ready',
    description: 'Readiness check — verifies DB, Redis, and cache connectivity',
    method: 'GET',
  },
  {
    path: '/metrics',
    description: 'Prometheus metrics endpoint for monitoring scraping',
    method: 'GET',
  },
];

const infrastructureDetails = [
  {
    category: 'Compute',
    items: [
      {
        label: 'Backend',
        value: 'Fly.io (Frankfurt, FRA)',
        detail: 'Elixir/Phoenix with auto-scaling',
      },
      { label: 'Frontend', value: 'Fly.io (IAD)', detail: 'React 19 SPA (WIP deployment)' },
      { label: 'Landing', value: 'Vercel (Edge Network)', detail: 'Vite static site, ~200KB' },
    ],
  },
  {
    category: 'Data',
    items: [
      {
        label: 'Database',
        value: 'PostgreSQL 16 (Supabase)',
        detail: '91 tables, ULID primary keys',
      },
      {
        label: 'Cache Layer 1',
        value: 'ETS (In-Memory)',
        detail: 'BEAM-native, microsecond access',
      },
      { label: 'Cache Layer 2', value: 'Cachex', detail: 'Distributed Elixir cache with TTL' },
      { label: 'Cache Layer 3', value: 'Redis 7', detail: 'PubSub, rate limiting, sessions' },
    ],
  },
  {
    category: 'Security & Edge',
    items: [
      { label: 'CDN / WAF', value: 'Cloudflare', detail: 'DDoS protection, WAF rules, TLS 1.3' },
      { label: 'DNS', value: 'Cloudflare DNS', detail: 'DNSSEC enabled, proxy mode' },
      { label: 'TLS', value: 'TLS 1.3 + HSTS', detail: 'Strict transport security enforced' },
      {
        label: 'Rate Limiting',
        value: '3-Tier',
        detail: '300 req/min general, 60 msg/min, 5 auth/15min',
      },
    ],
  },
];

const securityPipeline = [
  { name: 'Gitleaks', description: 'Secret detection in commits', status: 'Active' },
  { name: 'Sobelow', description: 'Elixir static analysis (SAST)', status: 'Active' },
  { name: 'Grype', description: 'Container CVE scanning', status: 'Active' },
  { name: 'Credo', description: 'Elixir code quality analyzer', status: 'Active' },
  { name: 'ESLint', description: 'TypeScript linting (strict mode)', status: 'Active' },
  { name: 'TypeScript', description: 'Strict type checking, 0 errors', status: 'Active' },
];

export default function Status() {
  return (
    <MarketingLayout
      title="System Status"
      subtitle="Infrastructure overview, SLO targets, and service monitoring for CGraph."
      eyebrow="Status"
    >
      {/* Current Status Banner */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border"
            style={{
              borderColor: 'rgba(234, 179, 8, 0.2)',
              background:
                'linear-gradient(135deg, rgba(234, 179, 8, 0.05), rgba(234, 179, 8, 0.02))',
            }}
          >
            {/* Amber top bar */}
            <div
              className="h-1 w-full"
              style={{ background: 'linear-gradient(90deg, #eab308, #f59e0b, #eab308)' }}
            />
            <div className="p-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mx-auto mb-5 inline-flex items-center gap-3 rounded-full bg-yellow-500/10 px-6 py-3"
              >
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-lg font-semibold text-yellow-400">
                  Pre-Launch Development
                </span>
              </motion.div>

              <h2 className="mb-4 font-zentry text-2xl font-bold text-white">
                CGraph is Currently in Development
              </h2>
              <p
                className="mx-auto max-w-2xl text-sm leading-relaxed"
                style={{ color: 'var(--color-gray)' }}
              >
                We're building toward our <strong className="text-white">v1.0 public beta</strong>{' '}
                targeted for <strong className="text-white">Q2 2026</strong>. Live status monitoring
                with real-time uptime tracking will launch alongside the platform.
              </p>

              {/* Progress indicator */}
              <div className="mx-auto mt-6 max-w-md">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-gray)' }}>Development Progress</span>
                  <span
                    className="font-mono font-semibold"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    v0.9.14 — 80% complete
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '80%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                    }}
                  />
                </div>
                <div
                  className="mt-1.5 flex justify-between text-xs"
                  style={{ color: 'var(--color-gray)' }}
                >
                  <span>55 of 69 features shipped</span>
                  <span>1,342 tests passing</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SLO Targets */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">SLO Targets</h2>
              <p className="marketing-section__desc">
                Service Level Objectives we're engineering toward for production launch.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sloTargets.map((slo, index) => (
              <motion.div
                key={slo.metric}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="marketing-card relative overflow-hidden text-center"
                style={{ padding: '1.75rem 1.25rem' }}
              >
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    background:
                      'radial-gradient(circle at center, var(--color-primary), transparent 70%)',
                  }}
                />
                <div className="relative">
                  <div className="mb-3 inline-flex">
                    <NeonIcon symbol={slo.icon} size={28} title={slo.metric} />
                  </div>
                  <div
                    className="mb-1 font-zentry text-2xl font-bold"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {slo.target}
                  </div>
                  <div className="mb-2 text-sm font-semibold text-white">{slo.metric}</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-gray)' }}>
                    {slo.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planned Services */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Monitored Services</h2>
              <p className="marketing-section__desc">
                These services will be tracked on the live status page at launch.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {plannedServices.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                viewport={{ once: true }}
                className="marketing-card relative overflow-hidden"
                style={{ padding: 0 }}
              >
                {/* Left accent */}
                <div
                  className="absolute left-0 top-0 h-full w-1"
                  style={{
                    background: 'linear-gradient(180deg, var(--color-primary), transparent)',
                  }}
                />
                <div className="flex items-center gap-4 p-4 pl-5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(139, 92, 246, 0.1))',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <NeonIcon symbol={service.icon} size={24} title={service.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-white">{service.name}</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}
                      >
                        Pre-Launch
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--color-gray)' }}>
                      {service.description}
                    </p>
                    <span className="mt-1 inline-block font-mono text-[11px] text-gray-500">
                      {service.domain}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Health Endpoints */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-3xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Health Endpoints</h2>
              <p className="marketing-section__desc">
                Built-in health check endpoints for monitoring and orchestration.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card overflow-hidden"
            style={{ padding: 0 }}
          >
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{
                background:
                  'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(99, 102, 241, 0.08))',
              }}
            >
              <span className="font-mono text-sm font-bold text-white">
                https://cgraph-backend.fly.dev
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {healthEndpoints.map((ep) => (
                <div key={ep.path} className="flex items-start gap-4 px-5 py-3.5">
                  <span
                    className="mt-0.5 inline-flex w-11 shrink-0 items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                    style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399' }}
                  >
                    {ep.method}
                  </span>
                  <div>
                    <span className="font-mono text-sm font-medium text-white">{ep.path}</span>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--color-gray)' }}>
                      {ep.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Infrastructure Details */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-5xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Infrastructure Architecture</h2>
              <p className="marketing-section__desc">
                Multi-layer infrastructure designed for reliability, security, and performance.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {infrastructureDetails.map((section, sectionIndex) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIndex * 0.15 }}
                className="marketing-card"
                style={{ padding: '1.5rem' }}
              >
                <h3 className="mb-4 text-lg font-bold text-white">{section.category}</h3>
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{item.label}</span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {item.value}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-gray)' }}>
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Pipeline */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Security & CI Pipeline</h2>
              <p className="marketing-section__desc">
                Automated security scanning runs on every commit and pull request.
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--3">
            {securityPipeline.map((tool, index) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="marketing-card flex items-center gap-4"
                style={{ padding: '1rem 1.25rem' }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                >
                  <svg
                    className="h-4 w-4"
                    style={{ color: 'var(--color-primary)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{tool.name}</span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}
                    >
                      {tool.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-gray)' }}>
                    {tool.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Monitoring at Launch</h2>
              <p className="marketing-section__desc">
                What the live status page will include when CGraph goes into production.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: '📈',
                title: 'Real-Time Uptime',
                desc: 'Live monitoring of all services with 90-day historical uptime charts and SLO compliance tracking.',
              },
              {
                icon: '⏱️',
                title: 'Latency Metrics',
                desc: 'P50, P95, P99 response times for API, WebSocket, and media services with regional breakdowns.',
              },
              {
                icon: '🔔',
                title: 'Incident Reporting',
                desc: 'Transparent incident timelines, root cause analysis, status updates, and email/SMS notifications.',
              },
              {
                icon: '📊',
                title: 'Prometheus Metrics',
                desc: 'Full observability with Grafana dashboards for request rates, error budgets, and resource utilization.',
              },
              {
                icon: '🌍',
                title: 'Regional Status',
                desc: 'Per-region health checks from multiple probe locations ensuring global reliability visibility.',
              },
              {
                icon: '📱',
                title: 'Status Subscriptions',
                desc: 'Subscribe via email, SMS, or webhook for automated alerts on service degradation or incidents.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="marketing-card"
              >
                <span className="marketing-card__icon">
                  <NeonIcon symbol={feature.icon} size={34} title={feature.title} />
                </span>
                <h3 className="marketing-card__title">{feature.title}</h3>
                <p className="marketing-card__desc">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-white/10 text-center"
            style={{
              padding: '3rem',
              background:
                'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(139, 92, 246, 0.08))',
            }}
          >
            <div
              className="absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-10"
              style={{ background: 'var(--color-primary)' }}
            />
            <div
              className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full opacity-10"
              style={{ background: 'var(--color-secondary)' }}
            />
            <div className="relative">
              <h2 className="mb-4 font-zentry text-2xl font-bold text-white">
                Get Notified at Launch
              </h2>
              <p className="mx-auto mb-6 max-w-xl text-sm" style={{ color: 'var(--color-gray)' }}>
                Status monitoring with email/SMS notifications will be available when CGraph
                launches. In the meantime, follow our progress on GitHub.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://github.com/cgraph-dev/CGraph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="marketing-btn marketing-btn--primary"
                >
                  Follow on GitHub
                </a>
                <Link to="/contact" className="marketing-btn marketing-btn--secondary">
                  Contact Us
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
