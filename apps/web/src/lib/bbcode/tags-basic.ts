/**
 * BBCode tag definitions — basic formatting, links, media, and code tags
 */

import {
  isValidLinkUrl,
  isValidImageUrl,
  sanitizeLinkUrl,
  sanitizeImageUrl,
} from '../../utils/urlSecurity';
import type { BBCodeTag } from './types';
import { escapeHtml, extractYouTubeId } from './sanitizers';

/** Basic formatting, links, media, and code BBCode tags */
export const basicTags: BBCodeTag[] = [
  // === BASIC FORMATTING ===
  // Bold
  {
    pattern: /\[b\]([\s\S]*?)\[\/b\]/gi,
    replace: (_, content) => `<strong class="font-bold">${content}</strong>`,
    priority: 10,
  },
  // Italic
  {
    pattern: /\[i\]([\s\S]*?)\[\/i\]/gi,
    replace: (_, content) => `<em class="italic">${content}</em>`,
    priority: 10,
  },
  // Underline
  {
    pattern: /\[u\]([\s\S]*?)\[\/u\]/gi,
    replace: (_, content) => `<span class="underline">${content}</span>`,
    priority: 10,
  },
  // Strikethrough
  {
    pattern: /\[s\]([\s\S]*?)\[\/s\]/gi,
    replace: (_, content) => `<del class="line-through">${content}</del>`,
    priority: 10,
  },
  // Subscript
  {
    pattern: /\[sub\]([\s\S]*?)\[\/sub\]/gi,
    replace: (_, content) => `<sub>${content}</sub>`,
    priority: 10,
  },
  // Superscript
  {
    pattern: /\[sup\]([\s\S]*?)\[\/sup\]/gi,
    replace: (_, content) => `<sup>${content}</sup>`,
    priority: 10,
  },

  // === LINKS ===
  // URL with text: [url=http://...]text[/url]
  {
    pattern: /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi,
    replace: (_, url, text) => {
      if (!isValidLinkUrl(url)) {
        return `<span class="text-gray-400">${text}</span>`;
      }
      const safeUrl = sanitizeLinkUrl(url);
      return `<a href="${safeUrl}" class="text-primary-400 hover:text-primary-300 underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    priority: 5,
  },
  // URL without text: [url]http://...[/url]
  {
    pattern: /\[url\]([\s\S]*?)\[\/url\]/gi,
    replace: (_, url) => {
      if (!isValidLinkUrl(url)) {
        return `<span class="text-gray-400">${url}</span>`;
      }
      const safeUrl = sanitizeLinkUrl(url);
      return `<a href="${safeUrl}" class="text-primary-400 hover:text-primary-300 underline" target="_blank" rel="noopener noreferrer">${url}</a>`;
    },
    priority: 5,
  },
  // Email
  {
    pattern: /\[email=([^\]]+)\]([\s\S]*?)\[\/email\]/gi,
    replace: (_, email, text) =>
      `<a href="mailto:${escapeHtml(email)}" class="text-primary-400 hover:text-primary-300 underline">${text}</a>`,
    priority: 5,
  },
  {
    pattern: /\[email\]([\s\S]*?)\[\/email\]/gi,
    replace: (_, email) =>
      `<a href="mailto:${escapeHtml(email)}" class="text-primary-400 hover:text-primary-300 underline">${email}</a>`,
    priority: 5,
  },

  // === MEDIA ===
  // Image: [img=WxH]url[/img]
  {
    pattern: /\[img=(\d+)x(\d+)\]([\s\S]*?)\[\/img\]/gi,
    replace: (_, width, height, url) => {
      if (!isValidImageUrl(url)) {
        return '<span class="text-gray-400 italic">[Invalid image]</span>';
      }
      const safeUrl = sanitizeImageUrl(url);
      const w = Math.min(parseInt(width, 10), 1200);
      const h = Math.min(parseInt(height, 10), 800);
      return `<img src="${safeUrl}" width="${w}" height="${h}" class="max-w-full h-auto rounded-lg my-2" loading="lazy" alt="User image" />`;
    },
    priority: 5,
  },
  // Image: [img]url[/img]
  {
    pattern: /\[img\]([\s\S]*?)\[\/img\]/gi,
    replace: (_, url) => {
      if (!isValidImageUrl(url)) {
        return '<span class="text-gray-400 italic">[Invalid image]</span>';
      }
      const safeUrl = sanitizeImageUrl(url);
      return `<img src="${safeUrl}" class="max-w-full h-auto rounded-lg my-2" loading="lazy" alt="User image" />`;
    },
    priority: 5,
  },
  // YouTube embed
  {
    pattern: /\[youtube\]([\s\S]*?)\[\/youtube\]/gi,
    replace: (_, url) => {
      const videoId = extractYouTubeId(url.trim());
      if (!videoId) {
        return '<span class="text-gray-400 italic">[Invalid YouTube URL]</span>';
      }
      return `<div class="relative w-full pt-[56.25%] my-4 rounded-lg overflow-hidden bg-white/[0.06]">
        <iframe 
          src="https://www.youtube-nocookie.com/embed/${videoId}" 
          class="absolute inset-0 w-full h-full"
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`;
    },
    priority: 5,
  },
  // Video
  {
    pattern: /\[video\]([\s\S]*?)\[\/video\]/gi,
    replace: (_, url) => {
      if (!isValidLinkUrl(url)) {
        return '<span class="text-gray-400 italic">[Invalid video URL]</span>';
      }
      const safeUrl = sanitizeLinkUrl(url);
      return `<video src="${safeUrl}" class="max-w-full rounded-lg my-2" controls preload="metadata">Your browser does not support video.</video>`;
    },
    priority: 5,
  },

  // === CODE ===
  // Code block with language: [code=language]...[/code]
  {
    pattern: /\[code=([a-zA-Z0-9]+)\]([\s\S]*?)\[\/code\]/gi,
    replace: (_, lang, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre class="bg-white/[0.06] rounded-lg p-4 my-4 overflow-x-auto"><code class="language-${lang.toLowerCase()} text-sm font-mono text-gray-200">${escapedCode}</code></pre>`;
    },
    priority: 1,
  },
  // Code block
  {
    pattern: /\[code\]([\s\S]*?)\[\/code\]/gi,
    replace: (_, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre class="bg-white/[0.06] rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-gray-200">${escapedCode}</code></pre>`;
    },
    priority: 1,
  },
  // PHP code (legacy MyBB)
  {
    pattern: /\[php\]([\s\S]*?)\[\/php\]/gi,
    replace: (_, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre class="bg-white/[0.06] rounded-lg p-4 my-4 overflow-x-auto"><code class="language-php text-sm font-mono text-gray-200">${escapedCode}</code></pre>`;
    },
    priority: 1,
  },
  // HTML code (legacy MyBB)
  {
    pattern: /\[html\]([\s\S]*?)\[\/html\]/gi,
    replace: (_, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre class="bg-white/[0.06] rounded-lg p-4 my-4 overflow-x-auto"><code class="language-html text-sm font-mono text-gray-200">${escapedCode}</code></pre>`;
    },
    priority: 1,
  },
];
