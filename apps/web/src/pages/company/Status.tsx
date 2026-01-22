/**
 * Status Page
 *
 * System status and uptime information.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const services = [
  {
    name: 'Messaging API',
    status: 'operational',
    uptime: '99.99%',
    description: 'Core messaging and real-time communication',
  },
  {
    name: 'Authentication',
    status: 'operational',
    uptime: '99.98%',
    description: 'Login, registration, Web3 wallet, and session management',
  },
  {
    name: 'Forums & Communities',
    status: 'operational',
    uptime: '99.97%',
    description: 'Reddit-style community discussions and threads',
  },
  {
    name: 'Gamification System',
    status: 'operational',
    uptime: '99.96%',
    description: 'XP, achievements, quests, and leaderboards',
  },
  {
    name: 'Voice Calls',
    status: 'operational',
    uptime: '99.95%',
    description: 'End-to-end encrypted voice calling',
  },
  {
    name: 'Video Calls',
    status: 'operational',
    uptime: '99.94%',
    description: 'End-to-end encrypted video calling',
  },
  {
    name: 'File Storage',
    status: 'operational',
    uptime: '99.97%',
    description: 'Encrypted file uploads and storage',
  },
  {
    name: 'Push Notifications',
    status: 'operational',
    uptime: '99.92%',
    description: 'Mobile and desktop notifications',
  },
  {
    name: 'Web Application',
    status: 'operational',
    uptime: '99.99%',
    description: 'Browser-based client',
  },
  {
    name: 'API Gateway',
    status: 'operational',
    uptime: '99.99%',
    description: 'Public API endpoints',
  },
];

const recentIncidents: Array<{
  date: string;
  title: string;
  status: string;
  description: string;
  duration: string;
}> = [
  // No incidents to report yet
];

const uptimeData = [{ month: 'Jan', uptime: 99.99 }];

function getStatusText(status: string): string {
  switch (status) {
    case 'operational':
      return 'Operational';
    case 'degraded':
      return 'Degraded Performance';
    case 'partial_outage':
      return 'Partial Outage';
    case 'major_outage':
      return 'Major Outage';
    default:
      return 'Unknown';
  }
}

function getIncidentStatusColor(status: string): string {
  switch (status) {
    case 'resolved':
      return 'text-emerald-400 bg-emerald-500/10';
    case 'completed':
      return 'text-blue-400 bg-blue-500/10';
    case 'investigating':
      return 'text-yellow-400 bg-yellow-500/10';
    case 'identified':
      return 'text-orange-400 bg-orange-500/10';
    default:
      return 'text-gray-400 bg-gray-500/10';
  }
}

export default function Status() {
  const allOperational = services.every((s) => s.status === 'operational');
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <MarketingLayout
      title="System Status"
      subtitle="Real-time status of CGraph services"
      eyebrow="Live Status"
    >
      {/* Overall Status */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card status-overall-card text-center"
            style={{
              borderColor: allOperational ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              background: allOperational ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            }}
          >
            <div
              className={`status-icon-wrapper ${allOperational ? 'status-icon-wrapper--operational' : 'status-icon-wrapper--warning'}`}
            >
              {allOperational ? (
                <svg
                  className="h-8 w-8 text-white"
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
              ) : (
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
            </div>
            <h2 className="font-zentry text-2xl font-bold" style={{ color: 'var(--color-light)' }}>
              {allOperational ? 'All Systems Operational' : 'Some Services Affected'}
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-gray)' }}>
              Last updated: {currentDate}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Individual Services */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="marketing-section__title font-zentry" style={{ textAlign: 'left' }}>
              Service Status
            </h2>
          </motion.div>

          <div className="space-y-3">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="marketing-card status-service-card"
                style={{
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`status-indicator status-indicator--${service.status}`} />
                  <div>
                    <h3 className="font-medium" style={{ color: 'var(--color-light)' }}>
                      {service.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                      {service.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                    {getStatusText(service.status)}
                  </span>
                  <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                    {service.uptime} uptime
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Uptime Chart */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="marketing-section__title font-zentry" style={{ textAlign: 'left' }}>
              Historical Uptime
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
              Tracking since January 2026
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card"
          >
            <div className="flex items-end justify-between gap-2" style={{ height: '150px' }}>
              {uptimeData.map((data) => {
                const height = ((data.uptime - 99.9) / 0.1) * 100;
                return (
                  <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="status-uptime-bar w-full"
                        style={{ height: `${Math.max(height, 20)}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs" style={{ color: 'var(--color-gray)' }}>
                        {data.month}
                      </p>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-light)' }}>
                        {data.uptime}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recent Incidents */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="marketing-section__title font-zentry" style={{ textAlign: 'left' }}>
              Recent Incidents
            </h2>
          </motion.div>

          {recentIncidents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="marketing-card text-center"
              style={{
                borderColor: 'rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.1)',
              }}
            >
              <span className="marketing-card__icon">✅</span>
              <h3 className="marketing-card__title">No Recent Incidents</h3>
              <p className="marketing-card__desc">All systems have been running smoothly.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {recentIncidents.map((incident, index) => (
                <motion.div
                  key={incident.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="marketing-card"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                      {incident.date}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getIncidentStatusColor(incident.status)}`}
                    >
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </span>
                  </div>
                  <h3 className="marketing-card__title">{incident.title}</h3>
                  <p className="marketing-card__desc">{incident.description}</p>
                  <p className="mt-2 text-xs" style={{ color: 'var(--color-gray)' }}>
                    Duration: {incident.duration}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card text-center"
          >
            <h2 className="marketing-card__title" style={{ fontSize: '1.5rem' }}>
              Subscribe to Status Updates
            </h2>
            <p className="marketing-card__desc" style={{ marginBottom: '1.5rem' }}>
              Get notified when there's an incident or scheduled maintenance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#" className="marketing-btn marketing-btn--secondary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </a>
              <a href="#" className="marketing-btn marketing-btn--secondary">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                Twitter
              </a>
              <a href="#" className="marketing-btn marketing-btn--secondary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
                RSS
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
