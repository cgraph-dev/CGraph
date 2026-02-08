/**
 * BBCode tag definitions — formatting, quotes, lists, and special tags
 */

import type { BBCodeTag } from './types';
import { escapeHtml, isValidColor, sanitizeFontSize, sanitizeFontFamily } from './sanitizers';

/** Formatting, quotes, lists, and special BBCode tags */
export const formattingTags: BBCodeTag[] = [
  // === FORMATTING ===
  // Color: [color=#hex]text[/color] or [color=name]text[/color]
  {
    pattern: /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi,
    replace: (_, color, text) => {
      if (!isValidColor(color)) {
        return text;
      }
      return `<span style="color: ${escapeHtml(color)}">${text}</span>`;
    },
    priority: 10,
  },
  // Size: [size=14]text[/size]
  {
    pattern: /\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/gi,
    replace: (_, size, text) => {
      const safeSize = sanitizeFontSize(size);
      return `<span style="font-size: ${safeSize}">${text}</span>`;
    },
    priority: 10,
  },
  // Font: [font=Arial]text[/font]
  {
    pattern: /\[font=([^\]]+)\]([\s\S]*?)\[\/font\]/gi,
    replace: (_, font, text) => {
      const safeFont = sanitizeFontFamily(font);
      return `<span style="font-family: ${safeFont}">${text}</span>`;
    },
    priority: 10,
  },
  // Alignment: [align=center]text[/align]
  {
    pattern: /\[align=([^\]]+)\]([\s\S]*?)\[\/align\]/gi,
    replace: (_, align, text) => {
      const validAligns = ['left', 'center', 'right', 'justify'];
      const safeAlign = validAligns.includes(align.toLowerCase()) ? align.toLowerCase() : 'left';
      return `<div style="text-align: ${safeAlign}">${text}</div>`;
    },
    priority: 10,
  },
  // Indent
  {
    pattern: /\[indent\]([\s\S]*?)\[\/indent\]/gi,
    replace: (_, text) => `<div class="ml-8">${text}</div>`,
    priority: 10,
  },

  // === QUOTES ===
  // Quote with author: [quote=Author]...[/quote]
  {
    pattern: /\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi,
    replace: (
      _,
      author,
      text
    ) => `<blockquote class="border-l-4 border-primary-500 bg-dark-700/50 rounded-r-lg p-4 my-4">
      <div class="text-sm text-primary-400 font-medium mb-2">${escapeHtml(author)} wrote:</div>
      <div class="text-gray-300">${text}</div>
    </blockquote>`,
    priority: 3,
  },
  // Quote without author
  {
    pattern: /\[quote\]([\s\S]*?)\[\/quote\]/gi,
    replace: (_, text) =>
      `<blockquote class="border-l-4 border-primary-500 bg-dark-700/50 rounded-r-lg p-4 my-4 text-gray-300">${text}</blockquote>`,
    priority: 3,
  },

  // === LISTS ===
  // Ordered list: [list=1]...[/list]
  {
    pattern: /\[list=1\]([\s\S]*?)\[\/list\]/gi,
    replace: (_, content) => {
      const items = content.split(/\[\*\]/).filter((item: string) => item.trim());
      const listItems = items
        .map((item: string) => `<li class="ml-4">${item.trim()}</li>`)
        .join('');
      return `<ol class="list-decimal list-inside my-4 space-y-1">${listItems}</ol>`;
    },
    priority: 3,
  },
  // Ordered list with letters: [list=a]...[/list]
  {
    pattern: /\[list=a\]([\s\S]*?)\[\/list\]/gi,
    replace: (_, content) => {
      const items = content.split(/\[\*\]/).filter((item: string) => item.trim());
      const listItems = items
        .map((item: string) => `<li class="ml-4">${item.trim()}</li>`)
        .join('');
      return `<ol class="list-alpha list-inside my-4 space-y-1" style="list-style-type: lower-alpha">${listItems}</ol>`;
    },
    priority: 3,
  },
  // Unordered list: [list]...[/list]
  {
    pattern: /\[list\]([\s\S]*?)\[\/list\]/gi,
    replace: (_, content) => {
      const items = content.split(/\[\*\]/).filter((item: string) => item.trim());
      const listItems = items
        .map((item: string) => `<li class="ml-4">${item.trim()}</li>`)
        .join('');
      return `<ul class="list-disc list-inside my-4 space-y-1">${listItems}</ul>`;
    },
    priority: 3,
  },

  // === SPECIAL ===
  // Spoiler with title: [spoiler=title]...[/spoiler]
  {
    pattern: /\[spoiler=([^\]]+)\]([\s\S]*?)\[\/spoiler\]/gi,
    replace: (
      _,
      title,
      content
    ) => `<details class="bg-dark-700/50 rounded-lg my-4 overflow-hidden">
      <summary class="cursor-pointer p-3 bg-dark-600/50 hover:bg-dark-600 font-medium text-gray-200">
        <span class="ml-2">${escapeHtml(title)}</span>
      </summary>
      <div class="p-4 text-gray-300">${content}</div>
    </details>`,
    priority: 3,
  },
  // Spoiler: [spoiler]...[/spoiler]
  {
    pattern: /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
    replace: (_, content) => `<details class="bg-dark-700/50 rounded-lg my-4 overflow-hidden">
      <summary class="cursor-pointer p-3 bg-dark-600/50 hover:bg-dark-600 font-medium text-gray-200">
        <span class="ml-2">Spoiler (click to reveal)</span>
      </summary>
      <div class="p-4 text-gray-300">${content}</div>
    </details>`,
    priority: 3,
  },
  // Horizontal rule
  {
    pattern: /\[hr\]/gi,
    replace: () => '<hr class="border-dark-500 my-6" />',
    priority: 10,
  },
  // Me action: [me]does something[/me] -> * Username does something *
  {
    pattern: /\[me\]([\s\S]*?)\[\/me\]/gi,
    replace: (_, action) => `<span class="text-primary-400 italic">* ${action} *</span>`,
    priority: 10,
  },
  // Mention: @username
  {
    pattern: /@([a-zA-Z0-9_-]+)/g,
    replace: (_, username) =>
      `<a href="/u/${username}" class="text-primary-400 hover:text-primary-300 font-medium">@${username}</a>`,
    priority: 20,
  },
];
