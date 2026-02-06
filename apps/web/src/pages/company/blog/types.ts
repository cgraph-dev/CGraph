/**
 * Blog page types
 *
 * @since v0.9.6
 */

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  featured: boolean;
  image: string;
}

export interface NewsletterInfo {
  subscribers: string;
  frequency: string;
}
