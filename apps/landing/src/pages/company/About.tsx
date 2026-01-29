/**
 * About Page - Company information and mission
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const stats = [
  { value: '10M+', label: 'Active Users' },
  { value: '99.99%', label: 'Uptime' },
  { value: '150+', label: 'Countries' },
  { value: '500M+', label: 'Messages/Day' },
];

const values = [
  {
    icon: '🔒',
    title: 'Privacy First',
    description: 'End-to-end encryption by default. Your conversations belong to you, not us.',
  },
  {
    icon: '🌐',
    title: 'Open & Transparent',
    description: 'Open-source core, public roadmap, and transparent business practices.',
  },
  {
    icon: '⚡',
    title: 'Performance',
    description:
      'Built for speed. Lightning-fast messaging even in challenging network conditions.',
  },
  {
    icon: '🎨',
    title: 'User Experience',
    description: 'Beautiful, intuitive design that gets out of your way and lets you communicate.',
  },
  {
    icon: '🤝',
    title: 'Community Driven',
    description: 'Features shaped by our community. Your feedback directly impacts our roadmap.',
  },
  {
    icon: '🌱',
    title: 'Sustainable',
    description: 'Carbon-neutral infrastructure and a commitment to digital sustainability.',
  },
];

const timeline = [
  {
    year: '2024',
    title: 'The Beginning',
    description:
      'CGraph was founded with a mission to create a privacy-first communication platform.',
  },
  {
    year: '2025',
    title: 'Public Launch',
    description: 'After extensive beta testing, CGraph launched publicly with E2E encryption.',
  },
  {
    year: '2025',
    title: 'Mobile Apps',
    description: 'Native iOS and Android apps launched, bringing CGraph to billions of devices.',
  },
  {
    year: '2026',
    title: 'Enterprise',
    description: 'Launched CGraph Enterprise for businesses with advanced admin controls.',
  },
];

const team = [
  {
    name: 'Leadership',
    description: 'Our executive team brings decades of experience from leading tech companies.',
    count: '5',
  },
  {
    name: 'Engineering',
    description: 'World-class engineers passionate about building secure, scalable systems.',
    count: '45+',
  },
  {
    name: 'Design',
    description: 'Designers focused on creating delightful user experiences.',
    count: '12',
  },
  {
    name: 'Security',
    description: 'Dedicated security researchers and cryptography experts.',
    count: '8',
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                <span className="text-xl font-bold text-black">C</span>
              </div>
              <span className="text-lg font-semibold text-white">CGraph</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/careers"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Careers
              </Link>
              <a
                href="https://app.cgraph.org/login"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Open CGraph
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400"
          >
            About CGraph
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl font-bold text-white md:text-6xl"
          >
            Communication Should Be
            <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Private & Beautiful
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-3xl text-xl text-gray-400"
          >
            We're building the communication platform we always wanted—one that respects your
            privacy, delights you with its design, and just works.
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">Our Mission</h2>
              <p className="mb-6 text-lg text-gray-400">
                We believe that private communication is a fundamental right. In an era of
                increasing surveillance and data exploitation, CGraph stands as a beacon for
                privacy-respecting technology.
              </p>
              <p className="mb-6 text-lg text-gray-400">
                Our mission is to make secure communication accessible to everyone. Privacy
                shouldn't be a luxury—it should be the default.
              </p>
              <p className="text-lg text-gray-400">
                We're not just building a messaging app. We're building the infrastructure for
                private digital communication in the 21st century.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-3xl" />
              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8">
                <blockquote className="text-xl italic text-white">
                  "Privacy is not about hiding something. It's about having a space to be yourself,
                  to think freely, and to communicate without being watched."
                </blockquote>
                <div className="mt-4 text-gray-400">— CGraph Founding Team</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white/[0.02] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Our Values</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              These principles guide every decision we make, from product features to business
              strategy.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
              >
                <div className="mb-4 text-4xl">{value.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-white">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Our Journey</h2>
            <p className="text-lg text-gray-400">From idea to millions of users worldwide.</p>
          </div>
          <div className="relative">
            <div className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-emerald-500 via-cyan-500 to-purple-500 md:left-1/2" />
            <div className="space-y-12">
              {timeline.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div
                    className={`hidden w-1/2 md:block ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}
                  >
                    <div className="mb-1 text-lg font-bold text-emerald-400">{event.year}</div>
                    <h3 className="mb-2 text-xl font-semibold text-white">{event.title}</h3>
                    <p className="text-gray-400">{event.description}</p>
                  </div>
                  <div className="absolute left-4 h-4 w-4 -translate-x-1/2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 md:left-1/2" />
                  <div className="ml-12 md:hidden">
                    <div className="mb-1 text-lg font-bold text-emerald-400">{event.year}</div>
                    <h3 className="mb-2 text-xl font-semibold text-white">{event.title}</h3>
                    <p className="text-gray-400">{event.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white/[0.02] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Our Team</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              A diverse group of engineers, designers, and dreamers united by a shared vision.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {team.map((dept, index) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 text-center"
              >
                <div className="mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
                  {dept.count}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{dept.name}</h3>
                <p className="text-sm text-gray-400">{dept.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/careers"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Join Our Team →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            Ready to Experience CGraph?
          </h2>
          <p className="mb-8 text-xl text-gray-400">
            Join millions of users who trust CGraph for their private communications.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://app.cgraph.org/register"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Create Free Account
            </a>
            <Link
              to="/contact"
              className="rounded-xl bg-white/10 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                <span className="text-xl font-bold text-black">C</span>
              </div>
              <span className="font-semibold text-white">CGraph</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link to="/cookies" className="transition-colors hover:text-white">
                Cookies
              </Link>
              <Link to="/press" className="transition-colors hover:text-white">
                Press
              </Link>
              <Link to="/contact" className="transition-colors hover:text-white">
                Contact
              </Link>
            </div>
            <div className="text-sm text-gray-500">© 2026 CGraph. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
