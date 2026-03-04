/**
 * Footer — Liquid Glass footer with link columns and social links.
 */
import { motion } from 'framer-motion';
import { Github, Twitter } from 'lucide-react';
import { staggerContainer, staggerItem } from './shared';
import { footerLinks } from '@/data/landing-data';
import { EXTERNAL_LINKS } from '@/constants';

const columnOrder = ['product', 'resources', 'company', 'legal'] as const;

export function Footer() {
  return (
    <footer className="relative px-6 pb-12 pt-24 lg:px-12">
      {/* Divider glow */}
      <div
        aria-hidden
        className="mx-auto mb-16 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-glow-purple/30 to-transparent"
      />

      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-8 md:grid-cols-5"
        >
          {/* Brand column */}
          <motion.div variants={staggerItem} className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-glow-blue via-glow-purple to-glow-pink">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="text-lg font-bold text-slate-900">CGraph</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
              Post-quantum encrypted messaging, forums, and communities — all in one open platform.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={EXTERNAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100/60 hover:text-slate-700"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href={EXTERNAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100/60 hover:text-slate-700"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          {/* Link columns */}
          {columnOrder.map((key) => (
            <motion.div key={key} variants={staggerItem}>
              <h4 className="mb-3 text-sm font-semibold capitalize text-slate-800">{key}</h4>
              <ul className="flex flex-col gap-2">
                {footerLinks[key].map((link) => (
                  <li key={link.label}>
                    <a
                      href={
                        (link as { to?: string; href?: string }).to ??
                        (link as { to?: string; href?: string }).href ??
                        '#'
                      }
                      className="text-sm text-slate-500 transition-colors hover:text-slate-800"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} CGraph. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">Built with ❤ and post-quantum encryption.</p>
        </div>
      </div>
    </footer>
  );
}
