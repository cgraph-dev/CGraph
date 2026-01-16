/**
 * About Page
 * 
 * Company information, mission, values, and team.
 * 
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const values = [
  {
    icon: '🔐',
    title: 'Privacy First',
    description: 'We believe privacy is a fundamental human right. Our architecture ensures we cannot access your messages, even if we wanted to.',
  },
  {
    icon: '🌐',
    title: 'Open Source',
    description: 'Transparency builds trust. Our core protocols and clients are open source, allowing anyone to verify our security claims.',
  },
  {
    icon: '🤝',
    title: 'User Ownership',
    description: 'Your data belongs to you. Export it, delete it, or take it elsewhere. We make it easy to exercise your digital rights.',
  },
  {
    icon: '⚡',
    title: 'Performance',
    description: 'Security should not mean sacrifice. We optimize relentlessly to deliver real-time messaging with sub-100ms latency.',
  },
  {
    icon: '🎨',
    title: 'Beautiful Design',
    description: 'Privacy software doesn\'t have to be ugly. We craft delightful experiences that make secure communication a joy.',
  },
  {
    icon: '🌍',
    title: 'Accessibility',
    description: 'Everyone deserves secure communication. We follow WCAG guidelines and support screen readers, keyboard navigation, and more.',
  },
];

const team = [
  {
    name: 'Alexandra Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former security engineer at Signal. PhD in Cryptography from Stanford.',
    avatar: 'AC',
  },
  {
    name: 'Marcus Williams',
    role: 'CTO & Co-Founder',
    bio: 'Ex-Discord infrastructure lead. Built systems serving 100M+ users.',
    avatar: 'MW',
  },
  {
    name: 'Sarah Nakamoto',
    role: 'Head of Security',
    bio: 'Led security at Coinbase. Published researcher in post-quantum cryptography.',
    avatar: 'SN',
  },
  {
    name: 'David Park',
    role: 'Head of Product',
    bio: 'Former product lead at Telegram. Passionate about privacy UX.',
    avatar: 'DP',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Head of Engineering',
    bio: 'Ex-Google SRE. Built Phoenix/Elixir systems at scale.',
    avatar: 'ER',
  },
  {
    name: 'James Liu',
    role: 'Head of Design',
    bio: 'Former design lead at Figma. Believer in design systems.',
    avatar: 'JL',
  },
];

const milestones = [
  { year: '2024', event: 'CGraph founded with mission to build privacy-first messaging' },
  { year: '2024', event: 'Seed funding from privacy-focused investors' },
  { year: '2025', event: 'Public beta launch with E2E encryption' },
  { year: '2025', event: 'Mobile apps for iOS and Android released' },
  { year: '2025', event: 'Forum and community features launched' },
  { year: '2026', event: 'Signal Protocol integration complete' },
  { year: '2026', event: 'Reached 100,000+ active users' },
];

export default function About() {
  return (
    <MarketingLayout
      title="About CGraph"
      subtitle="Building the future of private, secure communication"
      showCTA
    >
      {/* Mission Section */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">Our Mission</h2>
            <p className="text-xl text-gray-400">
              CGraph was founded on a simple belief: <span className="text-white">private communication is a fundamental right</span>, 
              not a premium feature. We're building the messaging platform we wished existed—one that combines 
              the security of Signal, the community features of Discord, and the user experience people deserve.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Our Values</h2>
            <p className="mt-4 text-gray-400">The principles that guide everything we build</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <div className="mb-4 text-4xl">{value.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-white">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Our Team</h2>
            <p className="mt-4 text-gray-400">
              A world-class team with experience from Signal, Discord, Google, and more
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-2xl font-bold text-white">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                <p className="mb-3 text-purple-400">{member.role}</p>
                <p className="text-sm text-gray-400">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Our Journey</h2>
            <p className="mt-4 text-gray-400">Key milestones in our mission</p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-gradient-to-b from-purple-500 to-indigo-600 md:block" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="hidden w-16 flex-shrink-0 text-right md:block">
                    <span className="font-mono text-purple-400">{milestone.year}</span>
                  </div>
                  <div className="relative hidden md:block">
                    <div className="absolute left-1/2 top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-purple-500 bg-gray-900" />
                  </div>
                  <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                    <span className="mb-2 inline-block font-mono text-sm text-purple-400 md:hidden">
                      {milestone.year}
                    </span>
                    <p className="text-gray-300">{milestone.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Investors Section */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Backed By</h2>
            <p className="mb-12 text-gray-400">
              Supported by investors who believe in privacy
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
              <div className="text-2xl font-bold text-gray-400">Privacy Capital</div>
              <div className="text-2xl font-bold text-gray-400">Crypto Ventures</div>
              <div className="text-2xl font-bold text-gray-400">Open Source Fund</div>
              <div className="text-2xl font-bold text-gray-400">Digital Rights VC</div>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
