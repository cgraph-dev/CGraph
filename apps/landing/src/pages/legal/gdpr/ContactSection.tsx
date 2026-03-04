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
      className="marketing-card"
    >
      <h3 className="mb-4 text-xl font-semibold" style={{ color: 'var(--color-light)' }}>
        Contact
      </h3>
      <div
        className="marketing-grid"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '2rem' }}
      >
        <div>
          <p style={{ color: 'var(--color-gray)' }}>General Privacy Inquiries</p>
          <a
            href="mailto:privacy@cgraph.org"
            style={{ color: 'var(--color-primary)' }}
            className="hover:opacity-80"
          >
            privacy@cgraph.org
          </a>
        </div>
        <div>
          <p style={{ color: 'var(--color-gray)' }}>Data Protection Officer</p>
          <a
            href="mailto:dpo@cgraph.org"
            style={{ color: 'var(--color-primary)' }}
            className="hover:opacity-80"
          >
            dpo@cgraph.org
          </a>
        </div>
      </div>

      <h4 className="mb-4 font-semibold" style={{ color: 'var(--color-light)' }}>
        Related Documents
      </h4>
      <div className="marketing-grid marketing-grid--3">
        <a href="/privacy" className="marketing-card" style={{ padding: '1rem' }}>
          <h5 className="font-medium" style={{ color: 'var(--color-light)' }}>
            Privacy Policy
          </h5>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
            How we handle your data
          </p>
        </a>
        <a href="/terms" className="marketing-card" style={{ padding: '1rem' }}>
          <h5 className="font-medium" style={{ color: 'var(--color-light)' }}>
            Terms of Service
          </h5>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
            Rules for using CGraph
          </p>
        </a>
        <a href="/cookies" className="marketing-card" style={{ padding: '1rem' }}>
          <h5 className="font-medium" style={{ color: 'var(--color-light)' }}>
            Cookie Policy
          </h5>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
            How we use cookies
          </p>
        </a>
      </div>
    </motion.div>
  );
}
