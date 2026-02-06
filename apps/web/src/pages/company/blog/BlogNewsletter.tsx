/**
 * Blog Newsletter subscription section
 *
 * @since v0.9.6
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { newsletter } from './constants';

export function BlogNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
    setEmail('');
  };

  return (
    <section className="bg-white/[0.02] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 p-12"
        >
          {/* Floating elements */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute right-10 top-10 text-6xl opacity-50"
          >
            ✉️
          </motion.div>

          <div className="relative text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Stay in the Loop</h2>
            <p className="mx-auto mb-8 max-w-xl text-gray-300">
              Get the latest updates, product news, and engineering insights delivered to your
              inbox. Join {newsletter.subscribers} subscribers.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-6 py-4 text-emerald-400"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Thanks for subscribing!
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-orange-500/25"
                >
                  Subscribe
                </motion.button>
              </form>
            )}

            <p className="mt-4 text-xs text-gray-400">
              {newsletter.frequency} digest. Unsubscribe anytime.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
