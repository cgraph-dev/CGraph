/**
 * Status Page - System status and uptime monitoring
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to MarketingLayout for consistent styling
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface Service {
  name: string;
  status: ServiceStatus;
  uptime: string;
  latency?: string;
}

interface Incident {
  id: number;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  date: string;
  updates: { time: string; message: string }[];
}

const services: Service[] = [
  { name: 'API', status: 'operational', uptime: '99.99%', latency: '45ms' },
  { name: 'Web App', status: 'operational', uptime: '99.98%', latency: '120ms' },
  { name: 'Messaging (WebSocket)', status: 'operational', uptime: '99.99%', latency: '12ms' },
  { name: 'Media Upload', status: 'operational', uptime: '99.95%', latency: '250ms' },
  { name: 'Push Notifications', status: 'operational', uptime: '99.90%', latency: '180ms' },
  { name: 'Authentication', status: 'operational', uptime: '99.99%', latency: '85ms' },
  { name: 'Voice & Video', status: 'operational', uptime: '99.85%', latency: '35ms' },
  { name: 'Search', status: 'operational', uptime: '99.92%', latency: '65ms' },
];

const recentIncidents: Incident[] = [
  {
    id: 1,
    title: 'Increased API Latency',
    status: 'resolved',
    severity: 'minor',
    date: 'January 25, 2026',
    updates: [
      { time: '14:30 UTC', message: 'Investigating increased latency on API endpoints.' },
      { time: '14:45 UTC', message: 'Identified database connection pool exhaustion.' },
      { time: '15:00 UTC', message: 'Deployed fix and monitoring recovery.' },
      { time: '15:30 UTC', message: 'Resolved. All systems operating normally.' },
    ],
  },
  {
    id: 2,
    title: 'Media Upload Slowdown',
    status: 'resolved',
    severity: 'minor',
    date: 'January 18, 2026',
    updates: [
      { time: '09:00 UTC', message: 'Users reporting slow media uploads.' },
      { time: '09:15 UTC', message: 'Identified CDN configuration issue.' },
      { time: '09:30 UTC', message: 'Resolved after CDN cache purge.' },
    ],
  },
];

const uptimeData = [
  { day: 'Mon', uptime: 100 },
  { day: 'Tue', uptime: 100 },
  { day: 'Wed', uptime: 99.8 },
  { day: 'Thu', uptime: 100 },
  { day: 'Fri', uptime: 100 },
  { day: 'Sat', uptime: 100 },
  { day: 'Sun', uptime: 99.9 },
  { day: 'Mon', uptime: 100 },
  { day: 'Tue', uptime: 100 },
  { day: 'Wed', uptime: 100 },
  { day: 'Thu', uptime: 100 },
  { day: 'Fri', uptime: 99.7 },
  { day: 'Sat', uptime: 100 },
  { day: 'Sun', uptime: 100 },
];

const statusColors: Record<ServiceStatus, { bg: string; text: string; dot: string }> = {
  operational: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  degraded: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  outage: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
  maintenance: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
};

const getOverallStatus = (svcs: Service[]): ServiceStatus => {
  if (svcs.some((s) => s.status === 'outage')) return 'outage';
  if (svcs.some((s) => s.status === 'degraded')) return 'degraded';
  if (svcs.some((s) => s.status === 'maintenance')) return 'maintenance';
  return 'operational';
};

const statusLabels: Record<ServiceStatus, string> = {
  operational: 'All Systems Operational',
  degraded: 'Partial System Outage',
  outage: 'Major Outage',
  maintenance: 'Scheduled Maintenance',
};

export default function Status() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedIncident, setExpandedIncident] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const overallStatus = getOverallStatus(services);

  return (
    <MarketingLayout>
      {/* Status Hero - Custom since it has dynamic status indicator */}
      <section className="relative overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Status Indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mx-auto mb-8 inline-flex items-center gap-3 rounded-full px-6 py-3 ${statusColors[overallStatus].bg}`}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`h-3 w-3 rounded-full ${statusColors[overallStatus].dot}`}
            />
            <span className={`text-lg font-semibold ${statusColors[overallStatus].text}`}>
              {statusLabels[overallStatus]}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 font-zentry text-4xl font-bold text-white md:text-5xl"
          >
            CGraph System Status
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-lg"
            style={{ color: 'var(--color-gray)' }}
          >
            Real-time status and uptime monitoring for all CGraph services.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            Last updated:{' '}
            {currentTime.toLocaleTimeString('en-US', { hour12: true, timeZoneName: 'short' })}
          </motion.div>
        </div>
      </section>

      {/* Uptime Chart */}
      <section
        className="marketing-section marketing-section--alt"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--color-gray)' }}>
              14-Day Uptime
            </span>
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
              99.95% Average
            </span>
          </div>
          <div className="flex gap-1">
            {uptimeData.map((day, index) => (
              <motion.div
                key={index}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex-1"
              >
                <div
                  className={`h-12 rounded-sm transition-all ${
                    day.uptime === 100
                      ? 'bg-emerald-500'
                      : day.uptime >= 99.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ opacity: day.uptime / 100 }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {day.uptime}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 font-zentry text-2xl font-bold text-white">Services</h2>
          <div className="space-y-3">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="marketing-card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${statusColors[service.status].dot}`} />
                  <span className="font-medium text-white">{service.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  {service.latency && (
                    <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                      <span style={{ color: 'var(--color-gray)', opacity: 0.7 }}>Latency:</span>{' '}
                      {service.latency}
                    </span>
                  )}
                  <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                    <span style={{ color: 'var(--color-gray)', opacity: 0.7 }}>Uptime:</span>{' '}
                    {service.uptime}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[service.status].bg} ${statusColors[service.status].text}`}
                  >
                    {service.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 font-zentry text-2xl font-bold text-white">Performance Metrics</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { label: 'Average Response Time', value: '89ms', trend: '↓ 12%' },
              { label: 'Requests per Second', value: '15.2K', trend: '↑ 8%' },
              { label: 'Error Rate', value: '0.01%', trend: '↓ 5%' },
              { label: 'Active Connections', value: '45K', trend: '↑ 15%' },
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="marketing-card"
              >
                <div className="mb-2 text-2xl font-bold text-white">{metric.value}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                    {metric.label}
                  </span>
                  <span
                    className={`text-xs ${metric.trend.includes('↓') ? 'text-emerald-400' : 'text-blue-400'}`}
                  >
                    {metric.trend}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Incidents */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 font-zentry text-2xl font-bold text-white">Recent Incidents</h2>
          {recentIncidents.length === 0 ? (
            <div className="marketing-card text-center">
              <div className="mb-4 text-4xl">🎉</div>
              <p style={{ color: 'var(--color-gray)' }}>No incidents in the past 90 days.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentIncidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="marketing-card overflow-hidden"
                  style={{ padding: 0 }}
                >
                  <button
                    onClick={() =>
                      setExpandedIncident(expandedIncident === incident.id ? null : incident.id)
                    }
                    className="flex w-full items-center justify-between p-6 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          incident.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {incident.status}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{incident.title}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                          {incident.date}
                        </p>
                      </div>
                    </div>
                    <motion.svg
                      animate={{ rotate: expandedIncident === incident.id ? 180 : 0 }}
                      className="h-5 w-5"
                      style={{ color: 'var(--color-gray)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </motion.svg>
                  </button>

                  {expandedIncident === incident.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/5 px-6 pb-6"
                    >
                      <div className="mt-4 space-y-4">
                        {incident.updates.map((update, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="relative">
                              <div className="h-3 w-3 rounded-full bg-gray-600" />
                              {i !== incident.updates.length - 1 && (
                                <div className="absolute left-1/2 top-3 h-full w-px -translate-x-1/2 bg-gray-700" />
                              )}
                            </div>
                            <div className="pb-4">
                              <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                                {update.time}
                              </span>
                              <p className="mt-1 text-sm text-gray-300">{update.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Subscribe */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="marketing-card text-center"
            style={{
              padding: '3rem',
              background:
                'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(139, 92, 246, 0.1))',
            }}
          >
            <h2 className="mb-4 font-zentry text-2xl font-bold text-white">
              Subscribe to Status Updates
            </h2>
            <p className="mx-auto mb-6 max-w-xl" style={{ color: 'var(--color-gray)' }}>
              Get notified via email or SMS when there are incidents or scheduled maintenance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#" className="marketing-btn marketing-btn--primary">
                Subscribe via Email
              </a>
              <a href="#" className="marketing-btn marketing-btn--secondary">
                RSS Feed
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
