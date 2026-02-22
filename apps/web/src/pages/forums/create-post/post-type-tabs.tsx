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

export default function PostTypeTabs({ postType, setPostType }: PostTypeTabsProps) {
  return (
    <div className="mb-6 flex gap-2 border-b border-dark-700 pb-4">
      <button
        onClick={() => setPostType('text')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'text'
            ? 'bg-primary-600 text-white'
            : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
        }`}
      >
        Text
      </button>
      <button
        onClick={() => setPostType('image')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'image'
            ? 'bg-primary-600 text-white'
            : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
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
            : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
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
            : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
        }`}
      >
        <ChartBarIcon className="h-5 w-5" />
        Poll
      </button>
    </div>
  );
}
