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

const benefits: Array<{
  icon: string;
  title: string;
  description: string;
}> = [
  // Benefits will be listed when we start hiring
];

const positions: Array<{
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}> = [
  // No open positions at this time
];

const values = [
  {
    title: 'Privacy by Default',
    description: 'We build systems where privacy is the baseline, not an afterthought.',
  },
  {
    title: 'User First',
    description: 'Every decision is made with our users\' best interests in mind.',
  },
  {
    title: 'User Empowerment',
    description: 'Users own their data. Full stop. We build tools that reinforce this.',
  },
  {
    title: 'Continuous Learning',
    description: 'Technology evolves fast. We invest in growth and improvement.',
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
      {benefits.length > 0 && (
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
      )}

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

          {positions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center"
            >
              <div className="mb-4 text-4xl">🚀</div>
              <h3 className="mb-2 text-xl font-semibold text-white">We're Just Getting Started</h3>
              <p className="text-gray-400">
                CGraph is currently a solo project in active development. While we don't have open positions right now,
                we'd love to hear from passionate people who share our vision for privacy-first communication.
              </p>
            </motion.div>
          ) : (
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
          )}
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
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
