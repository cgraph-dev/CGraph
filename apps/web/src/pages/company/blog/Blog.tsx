/**
 * Blog Page - Company blog and updates
 *
 * @since v0.9.6
 */

import { useState } from 'react';
import { MarketingLayout } from '@/components/marketing';
import { blogPosts } from './constants';
import { BlogHero } from './BlogHero';
import { BlogFeatured } from './BlogFeatured';
import { BlogGrid } from './BlogGrid';
import { BlogNewsletter } from './BlogNewsletter';
import { BlogFooterLinks } from './BlogFooterLinks';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts =
    selectedCategory === 'All'
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter((post) => post.featured);

  return (
    <MarketingLayout transparentNav showLandingLinks>
      <BlogHero selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      {selectedCategory === 'All' && <BlogFeatured posts={featuredPosts} />}

      <BlogGrid posts={filteredPosts} selectedCategory={selectedCategory} />

      <BlogNewsletter />

      <BlogFooterLinks />
    </MarketingLayout>
  );
}
