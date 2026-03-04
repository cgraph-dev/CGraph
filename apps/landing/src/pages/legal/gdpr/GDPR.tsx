/**
 * GDPR Compliance Page
 *
 * Renders the GDPR compliance information with consistent
 * marketing page styling.
 *
 * @since v0.9.2
 */

import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { LiquidGlassLayout } from '@/components/liquid-glass';
import { sections } from './sections';
import QuickActions from './QuickActions';
import ContactSection from './ContactSection';

export default function GDPR() {
  return (
    <LiquidGlassLayout
      title="GDPR Compliance"
      subtitle="Last updated: February 10, 2026 • Version 1.2"
    >
      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-surface mb-12 rounded-2xl p-6 shadow-glass"
      >
        <p className="text-lg leading-relaxed text-slate-500">
          This document outlines CGraph&apos;s compliance with the General Data Protection
          Regulation (GDPR) and explains the rights available to users in the European Economic Area
          (EEA), United Kingdom, and other jurisdictions with similar data protection laws. CGraph
          is a company registered in Georgia, and we are committed to upholding the highest
          standards of data protection for all of our users worldwide.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Table of Contents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Table of Contents</h2>
        <nav className="grid gap-2 sm:grid-cols-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-slate-500 transition-colors hover:text-glow-purple"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </motion.div>

      {/* Sections */}
      {sections.map((section) => (
        <motion.section
          key={section.id}
          id={section.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 scroll-mt-24"
        >
          <h2 className="mb-6 text-2xl font-bold text-slate-900">{section.title}</h2>
          <div
            className="prose prose-slate prose-headings:text-slate-900 prose-a:text-glow-purple max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(section.content, { USE_PROFILES: { html: true } }),
            }}
          />
        </motion.section>
      ))}

      {/* Contact */}
      <ContactSection />
    </LiquidGlassLayout>
  );
}
