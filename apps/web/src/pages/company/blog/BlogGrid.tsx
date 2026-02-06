/**
 * Blog posts grid section
 *
 * @since v0.9.6
 */

import { motion } from 'framer-motion';
import type { BlogPost } from './types';

interface BlogGridProps {
  posts: BlogPost[];
  selectedCategory: string;
}

export function BlogGrid({ posts, selectedCategory }: BlogGridProps) {
  const displayPosts = posts.filter((p) => !p.featured || selectedCategory !== 'All');

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-sm font-semibold uppercase tracking-wider text-gray-500"
        >
          {selectedCategory === 'All' ? 'All Posts' : selectedCategory}
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayPosts.map((post, index) => (
            <motion.a
              key={post.id}
              href="#"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-orange-500/30 hover:bg-white/10"
            >
              <div className="mb-4 text-4xl">{post.image}</div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                  {post.category}
                </span>
                <span className="text-xs text-gray-500">{post.date}</span>
              </div>
              <h3 className="mb-2 font-semibold text-white transition-colors group-hover:text-orange-300">
                {post.title}
              </h3>
              <p className="mb-4 line-clamp-2 text-sm text-gray-400">{post.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{post.author}</span>
                <span>{post.readTime}</span>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <button className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 font-medium text-white transition-all hover:bg-white/10">
            Load More Posts
          </button>
        </motion.div>
      </div>
    </section>
  );
}
