/**
 * Blog page constants and mock data
 *
 * @since v0.9.6
 */

import type { BlogPost, NewsletterInfo } from './types';

export const categories = ['All', 'Product', 'Engineering', 'Security', 'Company'];

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Introducing CGraph Enterprise: Secure Communication for Teams',
    excerpt:
      "Today we're launching CGraph Enterprise, bringing end-to-end encrypted messaging to businesses with advanced admin controls and compliance features.",
    category: 'Product',
    author: 'CGraph Team',
    date: 'January 28, 2026',
    readTime: '5 min read',
    featured: true,
    image: '🏢',
  },
  {
    id: 2,
    title: 'How We Built Our Real-Time Messaging Infrastructure',
    excerpt:
      "A deep dive into the architecture behind CGraph's real-time messaging system, handling thousands of concurrent connections with sub-100ms latency.",
    category: 'Engineering',
    author: 'Engineering Team',
    date: 'January 20, 2026',
    readTime: '12 min read',
    featured: true,
    image: '⚡',
  },
  {
    id: 3,
    title: 'Security Audit Results: Q4 2025',
    excerpt:
      "We recently completed our quarterly security audit with an independent firm. Here's what they found and how we're continuously improving our security posture.",
    category: 'Security',
    author: 'Security Team',
    date: 'January 15, 2026',
    readTime: '8 min read',
    featured: false,
    image: '🔒',
  },
  {
    id: 4,
    title: 'The Journey to 50,000 Users',
    excerpt:
      "Reflecting on our growth from a small beta to 50,000 active users. The challenges, learnings, and what's next for CGraph.",
    category: 'Company',
    author: 'CGraph Team',
    date: 'January 10, 2026',
    readTime: '6 min read',
    featured: false,
    image: '🎉',
  },
  {
    id: 5,
    title: 'Introducing Message Reactions and Threads',
    excerpt:
      "Based on community feedback, we're rolling out message reactions and threaded conversations to help you organize your chats better.",
    category: 'Product',
    author: 'Product Team',
    date: 'January 5, 2026',
    readTime: '4 min read',
    featured: false,
    image: '💬',
  },
  {
    id: 6,
    title: 'Understanding Our End-to-End Encryption',
    excerpt:
      'A technical overview of how CGraph implements end-to-end encryption, from key exchange to message delivery.',
    category: 'Security',
    author: 'Security Team',
    date: 'December 28, 2025',
    readTime: '15 min read',
    featured: false,
    image: '🔐',
  },
  {
    id: 7,
    title: 'Mobile App Performance Improvements',
    excerpt:
      'How we reduced app startup time by 60% and improved battery life with our latest mobile updates.',
    category: 'Engineering',
    author: 'Mobile Team',
    date: 'December 20, 2025',
    readTime: '10 min read',
    featured: false,
    image: '📱',
  },
  {
    id: 8,
    title: 'Building an Inclusive Remote Culture',
    excerpt:
      "As a fully remote company, here's how we build connection and maintain a strong culture across time zones.",
    category: 'Company',
    author: 'People Team',
    date: 'December 15, 2025',
    readTime: '7 min read',
    featured: false,
    image: '🌍',
  },
];

export const newsletter: NewsletterInfo = {
  subscribers: '5,000+',
  frequency: 'Weekly',
};
