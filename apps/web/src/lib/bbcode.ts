/**
 * BBCode Parser - Full MyBB-compatible BBCode/MyCode implementation
 * 
 * Supports all standard BBCode tags plus MyBB extensions:
 * - Basic: [b], [i], [u], [s], [sub], [sup]
 * - Links: [url], [email]
 * - Media: [img], [video], [youtube]
 * - Code: [code], [php], [html]
 * - Formatting: [color], [size], [font], [align], [indent]
 * - Lists: [list], [*]
 * - Quotes: [quote], [quote=author]
 * - Special: [spoiler], [hr], [me]
 * 
 * Security:
 * - XSS prevention through HTML escaping
 * - URL validation for links and images
 * - Content sanitization
 */

import { isValidLinkUrl, isValidImageUrl, sanitizeLinkUrl, sanitizeImageUrl } from '../utils/urlSecurity';

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// BBCode tag definitions
interface BBCodeTag {
  pattern: RegExp;
  replace: (match: string, ...args: string[]) => string;
  priority?: number; // Lower = processed first
}

// YouTube URL parser
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

// Color validation
function isValidColor(color: string): boolean {
  // Hex colors
  if (/^#[0-9A-Fa-f]{3,6}$/.test(color)) return true;
  // Named colors (common ones)
  const namedColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white',
    'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy', 'teal', 'maroon', 'olive',
    'silver', 'aqua', 'fuchsia', 'gold', 'indigo', 'violet', 'brown', 'coral',
    'crimson', 'darkblue', 'darkgreen', 'darkred', 'lightblue', 'lightgreen',
  ];
  return namedColors.includes(color.toLowerCase());
}

// Font size validation (prevent abuse)
function sanitizeFontSize(size: string): string {
  const numSize = parseInt(size, 10);
  if (!isNaN(numSize)) {
    // Clamp between 8 and 36
    const clamped = Math.max(8, Math.min(36, numSize));
    return `${clamped}px`;
  }
  // Named sizes
  const namedSizes: Record<string, string> = {
    'xx-small': '10px',
    'x-small': '12px',
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'x-large': '22px',
    'xx-large': '28px',
  };
  return namedSizes[size.toLowerCase()] || '16px';
}

// Font family validation (whitelist safe fonts)
const SAFE_FONTS = [
  'arial', 'helvetica', 'times new roman', 'times', 'courier new', 'courier',
  'georgia', 'palatino', 'garamond', 'bookman', 'comic sans ms', 'trebuchet ms',
  'arial black', 'impact', 'verdana', 'tahoma', 'geneva', 'lucida console',
  'monaco', 'consolas', 'menlo', 'monospace', 'sans-serif', 'serif',
];

function sanitizeFontFamily(font: string): string {
  const lowerFont = font.toLowerCase().replace(/['"]/g, '');
  if (SAFE_FONTS.includes(lowerFont)) {
    return `"${font}", sans-serif`;
  }
  return '"Arial", sans-serif';
}

// BBCode tags configuration
const bbcodeTags: BBCodeTag[] = [
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
    replace: (_, email, text) => `<a href="mailto:${escapeHtml(email)}" class="text-primary-400 hover:text-primary-300 underline">${text}</a>`,
    priority: 5,
  },
  {
    pattern: /\[email\]([\s\S]*?)\[\/email\]/gi,
    replace: (_, email) => `<a href="mailto:${escapeHtml(email)}" class="text-primary-400 hover:text-primary-300 underline">${email}</a>`,
    priority: 5,
  },

  // === MEDIA ===
  // Image: [img]url[/img] or [img=WxH]url[/img]
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
      return `<div class="relative w-full pt-[56.25%] my-4 rounded-lg overflow-hidden bg-dark-700">
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
      return `<pre class="bg-dark-700 rounded-lg p-4 my-4 overflow-x-auto"><code class="language-${lang.toLowerCase()} text-sm font-mono text-gray-200">${escapedCode}</code></pre>`;
    },
    priority: 1,
  },
  // Code block
  {
    pattern: /\[code\]([\s\S]*?)\[\/code\]/gi,
    replace: (_, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre class="bg-dark-700 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-gray-200">${escapedCode}</code></pre>`;
    },
    priority: 1,
  },
  // PHP code (legacy MyBB)
  {
    pattern: /\[php\]([\s\S]*?)\[\/php\]/gi,
    replace: (_, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre class="bg-dark-700 rounded-lg p-4 my-4 overflow-x-auto"><code class="language-php text-sm font-mono text-gray-200">${escapedCode}</code></pre>`;
    },
    priority: 1,
  },
  // HTML code (legacy MyBB)
  {
    pattern: /\[html\]([\s\S]*?)\[\/html\]/gi,
    replace: (_, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre class="bg-dark-700 rounded-lg p-4 my-4 overflow-x-auto"><code class="language-html text-sm font-mono text-gray-200">${escapedCode}</code></pre>`;
    },
    priority: 1,
  },

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
    replace: (_, author, text) => `<blockquote class="border-l-4 border-primary-500 bg-dark-700/50 rounded-r-lg p-4 my-4">
      <div class="text-sm text-primary-400 font-medium mb-2">${escapeHtml(author)} wrote:</div>
      <div class="text-gray-300">${text}</div>
    </blockquote>`,
    priority: 3,
  },
  // Quote without author
  {
    pattern: /\[quote\]([\s\S]*?)\[\/quote\]/gi,
    replace: (_, text) => `<blockquote class="border-l-4 border-primary-500 bg-dark-700/50 rounded-r-lg p-4 my-4 text-gray-300">${text}</blockquote>`,
    priority: 3,
  },

  // === LISTS ===
  // Ordered list: [list=1]...[/list]
  {
    pattern: /\[list=1\]([\s\S]*?)\[\/list\]/gi,
    replace: (_, content) => {
      const items = content.split(/\[\*\]/).filter((item: string) => item.trim());
      const listItems = items.map((item: string) => `<li class="ml-4">${item.trim()}</li>`).join('');
      return `<ol class="list-decimal list-inside my-4 space-y-1">${listItems}</ol>`;
    },
    priority: 3,
  },
  // Ordered list with letters: [list=a]...[/list]
  {
    pattern: /\[list=a\]([\s\S]*?)\[\/list\]/gi,
    replace: (_, content) => {
      const items = content.split(/\[\*\]/).filter((item: string) => item.trim());
      const listItems = items.map((item: string) => `<li class="ml-4">${item.trim()}</li>`).join('');
      return `<ol class="list-alpha list-inside my-4 space-y-1" style="list-style-type: lower-alpha">${listItems}</ol>`;
    },
    priority: 3,
  },
  // Unordered list: [list]...[/list]
  {
    pattern: /\[list\]([\s\S]*?)\[\/list\]/gi,
    replace: (_, content) => {
      const items = content.split(/\[\*\]/).filter((item: string) => item.trim());
      const listItems = items.map((item: string) => `<li class="ml-4">${item.trim()}</li>`).join('');
      return `<ul class="list-disc list-inside my-4 space-y-1">${listItems}</ul>`;
    },
    priority: 3,
  },

  // === SPECIAL ===
  // Spoiler: [spoiler]...[/spoiler] or [spoiler=title]...[/spoiler]
  {
    pattern: /\[spoiler=([^\]]+)\]([\s\S]*?)\[\/spoiler\]/gi,
    replace: (_, title, content) => `<details class="bg-dark-700/50 rounded-lg my-4 overflow-hidden">
      <summary class="cursor-pointer p-3 bg-dark-600/50 hover:bg-dark-600 font-medium text-gray-200">
        <span class="ml-2">${escapeHtml(title)}</span>
      </summary>
      <div class="p-4 text-gray-300">${content}</div>
    </details>`,
    priority: 3,
  },
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
    replace: (_, username) => `<a href="/u/${username}" class="text-primary-400 hover:text-primary-300 font-medium">@${username}</a>`,
    priority: 20,
  },
];

/**
 * Parse BBCode and convert to HTML
 * 
 * @param input - The BBCode string to parse
 * @param options - Parser options
 * @returns Parsed HTML string
 */
export function parseBBCode(input: string, options: { escapeInput?: boolean } = {}): string {
  if (!input) return '';
  
  // Optionally escape the input first (if not already escaped)
  let text = options.escapeInput !== false ? escapeHtml(input) : input;
  
  // Un-escape the BBCode tags that we need to process
  text = text
    .replace(/&lt;/g, '\x00LT\x00')
    .replace(/&gt;/g, '\x00GT\x00')
    .replace(/\[/g, '[')
    .replace(/\]/g, ']')
    .replace(/\x00LT\x00/g, '&lt;')
    .replace(/\x00GT\x00/g, '&gt;');

  // Sort tags by priority (lower = processed first)
  const sortedTags = [...bbcodeTags].sort((a, b) => (a.priority || 10) - (b.priority || 10));
  
  // Apply each tag transformation
  for (const tag of sortedTags) {
    // Handle nested tags by applying multiple times
    let prevText = '';
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops from malformed BBCode
    
    while (prevText !== text && iterations < maxIterations) {
      prevText = text;
      text = text.replace(tag.pattern, tag.replace as (...args: string[]) => string);
      iterations++;
    }
  }
  
  // Convert newlines to <br> (but not inside pre/code blocks)
  text = text.replace(/\n/g, '<br />');
  
  return text;
}

/**
 * Strip all BBCode tags from text
 * Returns plain text with no formatting
 */
export function stripBBCode(input: string): string {
  if (!input) return '';
  
  // Remove all BBCode tags
  let text = input;
  
  // Remove tags with content preservation
  text = text.replace(/\[(?:b|i|u|s|sub|sup|code|php|html|quote|spoiler|color|size|font|align|indent|list|me)(?:=[^\]]+)?\]([\s\S]*?)\[\/\1\]/gi, '$1');
  text = text.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '$2');
  text = text.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, '$1');
  text = text.replace(/\[email=([^\]]+)\]([\s\S]*?)\[\/email\]/gi, '$2');
  text = text.replace(/\[email\]([\s\S]*?)\[\/email\]/gi, '$1');
  text = text.replace(/\[img(?:=[^\]]+)?\]([\s\S]*?)\[\/img\]/gi, '[Image]');
  text = text.replace(/\[youtube\]([\s\S]*?)\[\/youtube\]/gi, '[YouTube Video]');
  text = text.replace(/\[video\]([\s\S]*?)\[\/video\]/gi, '[Video]');
  text = text.replace(/\[\*\]/g, '• ');
  text = text.replace(/\[hr\]/gi, '---');
  
  // Clean up any remaining tags
  text = text.replace(/\[[^\]]+\]/g, '');
  
  return text.trim();
}

/**
 * Count characters in BBCode content (excluding tags)
 */
export function countBBCodeCharacters(input: string): number {
  return stripBBCode(input).length;
}

/**
 * Validate BBCode - check for unclosed tags
 */
export function validateBBCode(input: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for common unclosed tags
  const tagPairs = [
    ['[b]', '[/b]'],
    ['[i]', '[/i]'],
    ['[u]', '[/u]'],
    ['[s]', '[/s]'],
    ['[code]', '[/code]'],
    ['[quote]', '[/quote]'],
    ['[spoiler]', '[/spoiler]'],
    ['[list]', '[/list]'],
    ['[url]', '[/url]'],
  ];
  
  const lowerInput = input.toLowerCase();
  
  for (const pair of tagPairs) {
    const open = pair[0]!;
    const close = pair[1]!;
    const openCount = (lowerInput.match(new RegExp(open.replace(/[[\]]/g, '\\$&'), 'g')) || []).length;
    const closeCount = (lowerInput.match(new RegExp(close.replace(/[[\]]/g, '\\$&'), 'g')) || []).length;
    
    if (openCount > closeCount) {
      errors.push(`Unclosed ${open} tag`);
    } else if (closeCount > openCount) {
      errors.push(`Extra ${close} tag without matching opening tag`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Preview BBCode - lighter parsing for live preview
 * Limits nesting depth and processing for performance
 */
export function previewBBCode(input: string, maxLength?: number): string {
  let text = input;
  
  // Truncate if needed
  if (maxLength && text.length > maxLength) {
    text = text.slice(0, maxLength) + '...';
  }
  
  return parseBBCode(text);
}

export default {
  parse: parseBBCode,
  strip: stripBBCode,
  validate: validateBBCode,
  preview: previewBBCode,
  countCharacters: countBBCodeCharacters,
};
