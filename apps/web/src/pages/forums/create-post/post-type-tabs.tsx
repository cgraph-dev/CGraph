/**
 * PostTypeTabs Component - Post type selector tabs
 * @module pages/forums/create-post
 */
import { PhotoIcon, LinkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { PostType } from './types';

interface PostTypeTabsProps {
  postType: PostType;
  setPostType: (type: PostType) => void;
}

/**
 * Post Type Tabs component.
 */
export default function PostTypeTabs({ postType, setPostType }: PostTypeTabsProps) {
  return (
    <div className="mb-6 flex gap-2 border-b border-white/[0.06] pb-4">
      <button
        onClick={() => setPostType('text')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'text'
            ? 'bg-primary-600 text-white'
            : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
        }`}
      >
        Text
      </button>
      <button
        onClick={() => setPostType('image')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'image'
            ? 'bg-primary-600 text-white'
            : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
        }`}
      >
        <PhotoIcon className="h-5 w-5" />
        Image
      </button>
      <button
        onClick={() => setPostType('link')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'link'
            ? 'bg-primary-600 text-white'
            : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
        }`}
      >
        <LinkIcon className="h-5 w-5" />
        Link
      </button>
      <button
        onClick={() => setPostType('poll')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'poll'
            ? 'bg-primary-600 text-white'
            : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
        }`}
      >
        <ChartBarIcon className="h-5 w-5" />
        Poll
      </button>
    </div>
  );
}
