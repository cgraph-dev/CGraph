/**
 * Careers Page
 * 
 * Open positions and company culture.
 * 
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';

const benefits = [
  {
    icon: '🌍',
    title: 'Remote-First',
    description: 'Work from anywhere in the world. We believe great talent is everywhere.',
  },
  {
    icon: '💰',
    title: 'Competitive Pay',
    description: 'Top-of-market compensation with equity for all team members.',
  },
  {
    icon: '🏥',
    title: 'Health Coverage',
    description: 'Comprehensive health, dental, and vision insurance for you and your family.',
  },
  {
    icon: '📚',
    title: 'Learning Budget',
    description: '$2,500 annual budget for courses, conferences, and books.',
  },
  {
    icon: '🏖️',
    title: 'Unlimited PTO',
    description: 'Take the time you need. We trust you to manage your schedule.',
  },
  {
    icon: '🖥️',
    title: 'Home Office',
    description: '$1,500 stipend to set up your perfect home workspace.',
  },
  {
    icon: '👶',
    title: 'Parental Leave',
    description: '16 weeks paid leave for all parents, regardless of gender.',
  },
  {
    icon: '🧘',
    title: 'Wellness',
    description: 'Monthly wellness allowance for gym, meditation, or whatever helps you recharge.',
  },
];

const positions = [
  {
    id: 'senior-rust-engineer',
    title: 'Senior Rust Engineer',
    department: 'Engineering',
    location: 'Remote (Global)',
    type: 'Full-time',
    description: 'Help build the core encryption and peer-to-peer infrastructure powering CGraph.',
    requirements: [
      '5+ years of systems programming experience',
      'Strong Rust expertise (2+ years)',
      'Experience with cryptography and security',
      'Understanding of distributed systems',
    ],
  },
  {
    id: 'staff-elixir-engineer',
    title: 'Staff Elixir Engineer',
    department: 'Engineering',
    location: 'Remote (Global)',
    type: 'Full-time',
    description: 'Architect and scale our real-time backend infrastructure built on Phoenix.',
    requirements: [
      '7+ years of backend engineering experience',
      '3+ years with Elixir/Phoenix',
      'Experience with real-time systems',
      'Strong understanding of OTP patterns',
    ],
  },
  {
    id: 'react-native-engineer',
    title: 'React Native Engineer',
    department: 'Engineering',
    location: 'Remote (Global)',
    type: 'Full-time',
    description: 'Build beautiful, performant mobile experiences on iOS and Android.',
    requirements: [
      '4+ years of mobile development experience',
      '2+ years with React Native',
      'Published apps in App Store and Play Store',
      'Experience with native modules',
    ],
  },
  {
    id: 'security-engineer',
    title: 'Security Engineer',
    department: 'Security',
    location: 'Remote (Global)',
    type: 'Full-time',
    description: 'Ensure our platform remains secure and conduct security audits.',
    requirements: [
      '5+ years in security engineering',
      'Experience with cryptographic protocols',
      'Bug bounty or security research background',
      'Knowledge of compliance frameworks',
    ],
  },
  {
    id: 'product-designer',
    title: 'Senior Product Designer',
    department: 'Design',
    location: 'Remote (Global)',
    type: 'Full-time',
    description: 'Design intuitive interfaces that make privacy accessible to everyone.',
    requirements: [
      '5+ years of product design experience',
      'Strong portfolio of consumer apps',
      'Experience with design systems',
      'User research experience',
    ],
  },
  {
    id: 'devrel-engineer',
    title: 'Developer Relations Engineer',
    department: 'Developer Experience',
    location: 'Remote (Global)',
    type: 'Full-time',
    description: 'Build community and help developers integrate with CGraph APIs.',
    requirements: [
      'Strong software engineering background',
      'Excellent communication skills',
      'Experience creating technical content',
      'Active in developer communities',
    ],
  },
];

const values = [
  {
    title: 'Privacy by Default',
    description: 'We build systems where privacy is the baseline, not an afterthought.',
  },
  {
    title: 'Open Source First',
    description: 'Transparency in code builds trust. We default to open.',
  },
  {
    title: 'User Empowerment',
    description: 'Users own their data. Full stop. We build tools that reinforce this.',
  },
  {
    title: 'Continuous Learning',
    description: 'Technology evolves fast. We invest in growth for everyone.',
  },
];

export default function Careers() {
  return (
    <MarketingLayout
      title="Join Our Team"
      subtitle="Help us build the future of private, secure communication"
    >
      {/* Values Section */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">What We Believe</h2>
            <p className="mt-2 text-gray-400">Our values guide everything we do</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <h3 className="mb-2 font-semibold text-white">{value.title}</h3>
                <p className="text-sm text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Benefits & Perks</h2>
            <p className="mt-2 text-gray-400">We take care of our team so they can focus on great work</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <div className="mb-3 text-3xl">{benefit.icon}</div>
                <h3 className="mb-1 font-semibold text-white">{benefit.title}</h3>
                <p className="text-sm text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Open Positions</h2>
            <p className="mt-2 text-gray-400">Find your next opportunity</p>
          </motion.div>

          <div className="space-y-4">
            {positions.map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-purple-500/50 hover:bg-gray-900"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{position.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-400">
                        {position.department}
                      </span>
                      <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">
                        {position.location}
                      </span>
                      <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`mailto:careers@cgraph.org?subject=Application: ${position.title}`}
                    className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40"
                  >
                    Apply Now
                  </a>
                </div>
                
                <p className="mb-4 text-gray-400">{position.description}</p>
                
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-300">Requirements:</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-gray-500">
                    {position.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Don't See Your Role */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-800 bg-gray-950 p-8 text-center"
          >
            <h2 className="mb-4 text-xl font-bold text-white">Don't See Your Role?</h2>
            <p className="mb-6 text-gray-400">
              We're always looking for talented people who are passionate about privacy 
              and security. Send us your resume and tell us how you can contribute.
            </p>
            <a
              href="mailto:careers@cgraph.org?subject=General Application"
              className="inline-flex rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40"
            >
              Send General Application
            </a>
          </motion.div>
        </div>
      </section>

      {/* Company Links */}
      <section className="bg-gray-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <Link to="/about" className="hover:text-purple-400">Learn more about CGraph →</Link>
            <span>•</span>
            <a href="https://github.com/cgraph-org" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">
              View our open source work →
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
