/**
 * Blog post listing metadata — used for the blog index page
 *
 * Each entry corresponds to an article in articles.ts.
 * To add a new post: add an entry here AND in articles.ts + constants.ts.
 *
 * @since v0.9.26
 */

import type { BlogPost } from './types';

export const blogPosts: BlogPost[] = [
  {
    id: 11,
    slug: 'architecture-refactor',
    title: 'Architecture Refactor: Router Split, Component Organization & Build Hardening',
    excerpt:
      'v0.9.26 — Phoenix router went from 989 lines down to 122 by splitting into 7 domain modules. Organized 28 flat component files into 6 categorized directories. Added Turborepo remote caching, bundle size monitoring with size-limit, and removed 854 lines of dead code.',
    category: 'Architecture',
    author: 'Burca Lucas',
    date: 'February 15, 2026',
    readTime: '8 min read',
    featured: true,
    image: '🏗️',
    tags: ['Architecture', 'Phoenix', 'React', 'Turborepo', 'DX'],
  },
  {
    id: 10,
    slug: 'compliance-pass',
    title: 'Architecture Compliance Pass: All Modules Under Size Limits',
    excerpt:
      'v0.9.25 — Set hard caps: 500 lines max for backend modules, 300 for React components. Had to split 8 Elixir modules and 5 React components. Also added 56 @spec annotations and audited all 45 Repo.delete calls for soft delete compliance.',
    category: 'Architecture',
    author: 'Burca Lucas',
    date: 'February 15, 2026',
    readTime: '10 min read',
    featured: false,
    image: '🏗️',
    tags: ['Architecture', 'Elixir', 'React', 'Compliance'],
  },
  {
    id: 1,
    slug: 'platform-parity',
    title: 'Platform Parity: 17/17 Features on Web & Mobile',
    excerpt:
      'v0.9.13–14 — Every feature on web now works on mobile too. 1,342 tests passing. Migrated to Reanimated v4 (had to fix 222 TypeScript errors to get there). 132 facade tests covering store reliability.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 8, 2026',
    readTime: '6 min read',
    featured: true,
    image: '🎯',
    tags: ['React Native', 'Reanimated v4', 'Testing'],
  },
  {
    id: 2,
    slug: 'architecture-transformation',
    title: 'Architecture Transformation: From 4.2 to 9.0',
    excerpt:
      'The codebase was a mess — 32 scattered stores, god components, circular deps. Restructured everything into 12 feature modules with 7 facade hooks, extracted 90+ shared UI components. Architecture score jumped from 4.2 to 9.0.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 2, 2026',
    readTime: '12 min read',
    featured: true,
    image: '🏗️',
    tags: ['Architecture', 'Zustand', 'Modules'],
  },
  {
    id: 3,
    slug: 'e2ee-test-suite',
    title: 'E2EE Test Suite: 192 Tests for Triple Ratchet Protocol',
    excerpt:
      "Wrote 192 tests for the crypto layer — PQXDH key exchange, hybrid ratcheting, post-quantum forward secrecy, adversarial scenarios, and stress tests. If it can break, there's a test for it.",
    category: 'Security',
    author: 'Burca Lucas',
    date: 'February 1, 2026',
    readTime: '10 min read',
    featured: false,
    image: '🔐',
    tags: ['E2EE', 'Triple Ratchet', 'Post-Quantum', 'Testing'],
  },
  {
    id: 4,
    slug: 'store-consolidation',
    title: 'Store Consolidation: 32 Stores → 7 Facades',
    excerpt:
      "32 Zustand stores was too many. Consolidated them into 7 facade hooks (Auth, Chat, Gamification, Settings, Community, Marketplace, UI) with composition patterns. 25 dedicated tests to make sure the facades don't lie.",
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 1, 2026',
    readTime: '8 min read',
    featured: false,
    image: '⚙️',
    tags: ['Zustand', 'State Management', 'Facades'],
  },
  {
    id: 5,
    slug: 'code-simplification',
    title: 'Code Simplification Sprint: console.log 325 → 2',
    excerpt:
      'Killed 323 console.log calls (two were printing decrypted messages — yikes). Replaced 27 `as any` casts with proper types. Split Settings.tsx from 1,172 lines to 221. SocketManager from 960 to 5 focused modules.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'January 30, 2026',
    readTime: '7 min read',
    featured: false,
    image: '✨',
    tags: ['Code Quality', 'TypeScript', 'Refactoring'],
  },
  {
    id: 6,
    slug: 'dual-app-architecture',
    title: 'Dual-App Architecture: Landing vs Web App',
    excerpt:
      'Why cgraph.org (landing, ~200KB) and app.cgraph.org (full app, ~2MB) are separate apps. Separate CI, separate deploys, separate performance budgets. 62 lazy-loaded pages, 168 build chunks.',
    category: 'Architecture',
    author: 'Burca Lucas',
    date: 'January 27, 2026',
    readTime: '9 min read',
    featured: false,
    image: '🌐',
    tags: ['Architecture', 'Performance', 'Vite'],
  },
  {
    id: 7,
    slug: 'critical-security-fixes',
    title: 'Critical Security Fixes: E2EE Plaintext Fallback',
    excerpt:
      'Found a bad one — messages could silently fall back to unencrypted delivery when encryption failed. Fixed that, plus a presence privacy leak, Stripe webhook without signature verification, IP spoofing via X-Forwarded-For, and MIME type spoofing in uploads.',
    category: 'Security',
    author: 'Burca Lucas',
    date: 'January 27, 2026',
    readTime: '8 min read',
    featured: false,
    image: '🛡️',
    tags: ['Security', 'E2EE', 'Vulnerability'],
  },
  {
    id: 8,
    slug: 'why-elixir',
    title: 'Why Elixir, Phoenix, and the BEAM VM',
    excerpt:
      'Looked at Node, Go, Rust, and Elixir for the backend. Picked Elixir because the BEAM VM was literally built for telecom-scale concurrency. 91 Postgres tables, 3-tier caching (ETS → Cachex → Redis), Phoenix Channels for WebSocket.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'January 2026',
    readTime: '14 min read',
    featured: false,
    image: '💜',
    tags: ['Elixir', 'Phoenix', 'Backend'],
  },
  {
    id: 9,
    slug: 'introducing-cgraph',
    title: 'Introducing CGraph: The Vision',
    excerpt:
      'The idea behind CGraph — one platform that handles messaging, forums, encryption, and gamification. 3 subscription tiers from free to enterprise. Built for communities that want privacy without giving up engagement.',
    category: 'Product',
    author: 'Burca Lucas',
    date: 'January 2026',
    readTime: '5 min read',
    featured: false,
    image: '🚀',
    tags: ['Product', 'Vision', 'Launch'],
  },
];
