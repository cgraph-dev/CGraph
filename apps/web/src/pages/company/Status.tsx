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
    description: 'Login, registration, and session management',
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

const recentIncidents = [
  {
    date: 'January 15, 2025',
    title: 'Push Notification Delays',
    status: 'resolved',
    description: 'Some users experienced delayed push notifications. Issue was identified and resolved within 45 minutes.',
    duration: '45 minutes',
  },
  {
    date: 'January 8, 2025',
    title: 'Scheduled Maintenance',
    status: 'completed',
    description: 'Planned maintenance window for infrastructure upgrades. All services remained available.',
    duration: '2 hours',
  },
  {
    date: 'December 20, 2024',
    title: 'Video Call Quality Issues',
    status: 'resolved',
    description: 'Users in certain regions experienced video quality degradation. CDN routing was optimized.',
    duration: '1 hour',
  },
];

const uptimeData = [
  { month: 'Jul', uptime: 99.98 },
  { month: 'Aug', uptime: 99.99 },
  { month: 'Sep', uptime: 99.97 },
  { month: 'Oct', uptime: 99.99 },
  { month: 'Nov', uptime: 99.96 },
  { month: 'Dec', uptime: 99.98 },
  { month: 'Jan', uptime: 99.97 },
];

function getStatusColor(status: string): string {
  switch (status) {
    case 'operational':
      return 'bg-emerald-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'partial_outage':
      return 'bg-orange-500';
    case 'major_outage':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

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
  const allOperational = services.every(s => s.status === 'operational');
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <MarketingLayout
      title="System Status"
      subtitle="Real-time status of CGraph services"
    >
      {/* Overall Status */}
      <section className="bg-gray-950 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`rounded-2xl border p-8 text-center ${
              allOperational 
                ? 'border-emerald-500/30 bg-emerald-500/10' 
                : 'border-yellow-500/30 bg-yellow-500/10'
            }`}
          >
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              allOperational ? 'bg-emerald-500' : 'bg-yellow-500'
            }`}>
              {allOperational ? (
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {allOperational ? 'All Systems Operational' : 'Some Services Affected'}
            </h2>
            <p className="mt-2 text-sm text-gray-400">Last updated: {currentDate}</p>
          </motion.div>
        </div>
      </section>

      {/* Individual Services */}
      <section className="bg-gray-900 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-white">Service Status</h2>
          </motion.div>

          <div className="space-y-3">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/50 px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(service.status)}`} />
                  <div>
                    <h3 className="font-medium text-white">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-emerald-400">{getStatusText(service.status)}</span>
                  <p className="text-sm text-gray-500">{service.uptime} uptime</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Uptime Chart */}
      <section className="bg-gray-950 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-white">Historical Uptime</h2>
            <p className="text-sm text-gray-400">Last 90 days average: 99.97%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
          >
            <div className="flex items-end justify-between gap-2" style={{ height: '150px' }}>
              {uptimeData.map((data) => {
                const height = ((data.uptime - 99.9) / 0.1) * 100;
                return (
                  <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-purple-500 to-indigo-500"
                        style={{ height: `${Math.max(height, 20)}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{data.month}</p>
                      <p className="text-sm font-medium text-white">{data.uptime}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recent Incidents */}
      <section className="bg-gray-900 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-white">Recent Incidents</h2>
          </motion.div>

          <div className="space-y-4">
            {recentIncidents.map((incident, index) => (
              <motion.div
                key={incident.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">{incident.date}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getIncidentStatusColor(incident.status)}`}>
                    {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-white">{incident.title}</h3>
                <p className="text-sm text-gray-400">{incident.description}</p>
                <p className="mt-2 text-xs text-gray-500">Duration: {incident.duration}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="bg-gray-950 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center"
          >
            <h2 className="mb-4 text-xl font-bold text-white">Subscribe to Status Updates</h2>
            <p className="mb-6 text-gray-400">
              Get notified when there's an incident or scheduled maintenance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-5 py-3 text-white transition-all hover:border-purple-500/50 hover:bg-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-5 py-3 text-white transition-all hover:border-purple-500/50 hover:bg-gray-700"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                Twitter
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-5 py-3 text-white transition-all hover:border-purple-500/50 hover:bg-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
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
