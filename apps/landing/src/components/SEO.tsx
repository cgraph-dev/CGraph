/**
 * SEO Component — Centralized per-page meta tag management
 *
 * Provides consistent Open Graph, Twitter Card, and standard meta tags
 * across all pages. Built on react-helmet-async for SSR compatibility.
 *
 * @since v0.9.27
 */

import { Helmet } from 'react-helmet-async';
import { LANDING_URL } from '@/constants';

interface SEOProps {
  /** Page title — appended with " | CGraph" suffix */
  title?: string;
  /** Meta description (max ~160 chars recommended) */
  description?: string;
  /** Canonical path, e.g. "/blog" (domain is prepended automatically) */
  path?: string;
  /** og:type — defaults to "website" */
  type?: string;
  /** og:image URL — defaults to the site-wide OG image */
  image?: string;
  /** Prevents indexing when true */
  noindex?: boolean;
  /** Additional structured data (JSON-LD) */
  jsonLd?: Record<string, unknown>;
}

const DEFAULTS = {
  title: 'CGraph - Beyond Messaging | Secure Real-Time Communication Platform',
  description:
    'Real-time messaging meets community forums — with end-to-end encryption, Web3 authentication, and rewards that make every interaction count.',
  image: `${LANDING_URL}/og-image.png`,
} as const;

export default function SEO({
  title,
  description = DEFAULTS.description,
  path = '',
  type = 'website',
  image = DEFAULTS.image,
  noindex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | CGraph` : DEFAULTS.title;
  const canonicalUrl = `${LANDING_URL}${path}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="CGraph" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
