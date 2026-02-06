/**
 * Blog Featured posts section
 *
 * @since v0.9.6
 */

import { motion } from 'framer-motion';
import type { BlogPost } from './types';

interface BlogFeaturedProps {
  posts: BlogPost[];
}

export function BlogFeatured({ posts }: BlogFeaturedProps) {
  return (
    <section className="px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 text-sm font-semibold uppercase tracking-wider text-gray-500"
        >
          Featured
        </motion.h2>
        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post, index) => (
            <motion.a
              key={post.id}
              href="#"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-pink-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8">
                <div className="mb-6 text-6xl">{post.image}</div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">{post.date}</span>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-orange-300">
                  {post.title}
                </h3>
                <p className="mb-4 text-gray-400">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{post.author}</span>
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
