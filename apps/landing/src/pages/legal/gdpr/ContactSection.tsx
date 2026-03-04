/**
 * GDPR Contact Section
 *
 * Contact information for privacy inquiries and DPO,
 * plus links to related legal documents.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';

export default function ContactSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-surface rounded-2xl p-6 shadow-glass"
    >
      <h3 className="mb-4 text-xl font-semibold text-slate-900">Contact</h3>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-slate-500">General Privacy Inquiries</p>
          <a href="mailto:privacy@cgraph.org" className="text-glow-purple hover:opacity-80">
            privacy@cgraph.org
          </a>
        </div>
        <div>
          <p className="text-slate-500">Data Protection Officer</p>
          <a href="mailto:dpo@cgraph.org" className="text-glow-purple hover:opacity-80">
            dpo@cgraph.org
          </a>
        </div>
      </div>

      <h4 className="mb-4 font-semibold text-slate-900">Related Documents</h4>
      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href="/privacy"
          className="glass-surface rounded-xl p-4 shadow-glass transition-shadow hover:shadow-glass-lg"
        >
          <h5 className="font-medium text-slate-900">Privacy Policy</h5>
          <p className="mt-1 text-sm text-slate-500">How we handle your data</p>
        </a>
        <a
          href="/terms"
          className="glass-surface rounded-xl p-4 shadow-glass transition-shadow hover:shadow-glass-lg"
        >
          <h5 className="font-medium text-slate-900">Terms of Service</h5>
          <p className="mt-1 text-sm text-slate-500">Rules for using CGraph</p>
        </a>
        <a
          href="/cookies"
          className="glass-surface rounded-xl p-4 shadow-glass transition-shadow hover:shadow-glass-lg"
        >
          <h5 className="font-medium text-slate-900">Cookie Policy</h5>
          <p className="mt-1 text-sm text-slate-500">How we use cookies</p>
        </a>
      </div>
    </motion.div>
  );
}
