/**
 * Careers Page - Job listings and company culture
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const benefits = [
  {
    icon: '🌍',
    title: 'Remote First',
    description: 'Work from anywhere in the world. We have team members across 20+ countries.',
  },
  {
    icon: '💰',
    title: 'Competitive Salary',
    description: 'Top-tier compensation with equity packages for all employees.',
  },
  {
    icon: '🏖️',
    title: 'Unlimited PTO',
    description: 'Take the time you need. We trust you to manage your own schedule.',
  },
  {
    icon: '🏥',
    title: 'Health & Wellness',
    description: 'Comprehensive health, dental, and vision coverage for you and your family.',
  },
  {
    icon: '📚',
    title: 'Learning Budget',
    description: '$3,000 annual budget for courses, conferences, and professional development.',
  },
  {
    icon: '🖥️',
    title: 'Equipment Stipend',
    description: '$5,000 to set up your home office with whatever equipment you need.',
  },
  {
    icon: '👶',
    title: 'Parental Leave',
    description: '16 weeks paid leave for all new parents, regardless of gender.',
  },
  {
    icon: '🎉',
    title: 'Team Events',
    description: 'Quarterly team retreats in amazing locations around the world.',
  },
];

const departments = [
  'All',
  'Engineering',
  'Design',
  'Product',
  'Security',
  'Operations',
  'Marketing',
];

const openings = [
  {
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    description: 'Build scalable, secure systems that power real-time communication for millions.',
  },
  {
    title: 'Staff Frontend Engineer',
    department: 'Engineering',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    description: 'Lead frontend architecture for our web and desktop applications.',
  },
  {
    title: 'Mobile Engineer (iOS)',
    department: 'Engineering',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    description: 'Build native iOS experiences that delight millions of users.',
  },
  {
    title: 'Mobile Engineer (Android)',
    department: 'Engineering',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    description: 'Create beautiful, performant Android applications.',
  },
  {
    title: 'Security Engineer',
    department: 'Security',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    description: 'Protect our users by finding and fixing vulnerabilities before bad actors do.',
  },
  {
    title: 'Cryptography Engineer',
    department: 'Security',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    description: 'Design and implement cryptographic protocols for end-to-end encryption.',
  },
  {
    title: 'Senior Product Designer',
    department: 'Design',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    description: 'Shape the future of how people communicate through thoughtful design.',
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote (US/EU)',
    type: 'Full-time',
    description: 'Drive product strategy and work with cross-functional teams.',
  },
  {
    title: 'DevOps Engineer',
    department: 'Operations',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    description: 'Build and maintain infrastructure that supports millions of concurrent users.',
  },
  {
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Remote (US)',
    type: 'Full-time',
    description: 'Drive user acquisition and retention through data-driven marketing strategies.',
  },
];

const culturePhotos = [
  { title: 'Team Retreat 2025', location: 'Lisbon, Portugal' },
  { title: 'Hackathon Winners', location: 'Virtual' },
  { title: 'Product Launch', location: 'San Francisco' },
  { title: 'Design Sprint', location: 'Berlin' },
];

export default function Careers() {
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const filteredOpenings =
    selectedDepartment === 'All'
      ? openings
      : openings.filter((job) => job.department === selectedDepartment);

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
                to="/about"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                About
              </Link>
              <a
                href="https://app.cgraph.org"
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
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400"
          >
            🚀 We're Hiring
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl font-bold text-white md:text-6xl"
          >
            Build the Future of
            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Private Communication
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-8 max-w-3xl text-xl text-gray-400"
          >
            Join a team of passionate engineers, designers, and security experts building technology
            that empowers millions to communicate freely.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <a
              href="#openings"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              View Open Positions →
            </a>
          </motion.div>
        </div>
      </section>

      {/* Culture Photos */}
      <section className="overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {culturePhotos.map((photo, index) => (
              <motion.div
                key={photo.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20"
              >
                <div className="absolute inset-0 flex items-end p-4">
                  <div>
                    <div className="text-sm font-medium text-white">{photo.title}</div>
                    <div className="text-xs text-gray-400">{photo.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Why Join CGraph?</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              We offer more than just a job. We offer the opportunity to make a real impact on how
              people communicate.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
              >
                <div className="mb-4 text-3xl">{benefit.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{benefit.title}</h3>
                <p className="text-sm text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white/[0.02] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">What We Look For</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
                    <span className="text-emerald-400">1</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-white">Passion for Privacy</h3>
                    <p className="text-gray-400">
                      You believe in the fundamental right to private communication and want to
                      build technology that protects it.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
                    <span className="text-cyan-400">2</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-white">Excellence</h3>
                    <p className="text-gray-400">
                      You have high standards for your work and are constantly looking to improve.
                      You ship quality, not just features.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/20">
                    <span className="text-purple-400">3</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-white">Collaboration</h3>
                    <p className="text-gray-400">
                      You thrive in a team environment. You give and receive feedback gracefully and
                      help others succeed.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/20">
                    <span className="text-orange-400">4</span>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-white">Ownership</h3>
                    <p className="text-gray-400">
                      You take initiative and see things through to completion. You don't wait to be
                      told what to do.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 blur-3xl" />
              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8">
                <div className="mb-4 text-5xl">💬</div>
                <blockquote className="mb-4 text-xl italic text-white">
                  "At CGraph, every engineer has the opportunity to directly impact how millions of
                  people communicate. It's challenging, rewarding, and genuinely fun."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400" />
                  <div>
                    <div className="font-medium text-white">Sarah Chen</div>
                    <div className="text-sm text-gray-400">Engineering Lead</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="openings" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Open Positions</h2>
            <p className="text-lg text-gray-400">
              {openings.length} open positions across {departments.length - 1} departments
            </p>
          </div>

          {/* Department Filter */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedDepartment === dept
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            {filteredOpenings.map((job, index) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-emerald-500/30 hover:bg-white/10"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-emerald-400">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">{job.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <span>📍</span> {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <span>🏢</span> {job.department}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <span>⏰</span> {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                      Apply →
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredOpenings.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl">🔍</div>
              <p className="text-gray-400">No positions in {selectedDepartment} right now.</p>
              <p className="mt-2 text-sm text-gray-500">
                Check back soon or send us your resume anyway!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* No perfect match CTA */}
      <section className="bg-gradient-to-br from-emerald-500/10 to-purple-500/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
            Don't See the Perfect Role?
          </h2>
          <p className="mb-8 text-gray-400">
            We're always looking for exceptional people. Send us your resume and tell us what you'd
            like to work on. We'd love to hear from you.
          </p>
          <a
            href="mailto:careers@cgraph.org"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/20"
          >
            ✉️ Send Your Resume
          </a>
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
              <Link to="/about" className="transition-colors hover:text-white">
                About
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms
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
