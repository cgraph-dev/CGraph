/**
 * BBCode sanitization and validation utilities
 *
 * Security-related helpers: HTML escaping, color/font/size validation,
 * and YouTube URL extraction.
 */

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

/** Escape HTML entities to prevent XSS */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------

/** Extract video ID from various YouTube URL formats */
export function extractYouTubeId(url: string): string | null {
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

// ---------------------------------------------------------------------------
// Color validation
// ---------------------------------------------------------------------------

/** Validate a CSS color value (hex or named) */
export function isValidColor(color: string): boolean {
  // Hex colors
  if (/^#[0-9A-Fa-f]{3,6}$/.test(color)) return true;
  // Named colors (common ones)
  const namedColors = [
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
    'black',
    'white',
    'gray',
    'grey',
    'cyan',
    'magenta',
    'lime',
    'navy',
    'teal',
    'maroon',
    'olive',
    'silver',
    'aqua',
    'fuchsia',
    'gold',
    'indigo',
    'violet',
    'brown',
    'coral',
    'crimson',
    'darkblue',
    'darkgreen',
    'darkred',
    'lightblue',
    'lightgreen',
  ];
  return namedColors.includes(color.toLowerCase());
}

// ---------------------------------------------------------------------------
// Font size
// ---------------------------------------------------------------------------

/** Sanitize a font-size value – clamp numeric sizes, map named sizes */
export function sanitizeFontSize(size: string): string {
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
    small: '14px',
    medium: '16px',
    large: '18px',
    'x-large': '22px',
    'xx-large': '28px',
  };
  return namedSizes[size.toLowerCase()] || '16px';
}

// ---------------------------------------------------------------------------
// Font family
// ---------------------------------------------------------------------------

/** Whitelist of safe font families */
const SAFE_FONTS = [
  'arial',
  'helvetica',
  'times new roman',
  'times',
  'courier new',
  'courier',
  'georgia',
  'palatino',
  'garamond',
  'bookman',
  'comic sans ms',
  'trebuchet ms',
  'arial black',
  'impact',
  'verdana',
  'tahoma',
  'geneva',
  'lucida console',
  'monaco',
  'consolas',
  'menlo',
  'monospace',
  'sans-serif',
  'serif',
];

/** Sanitize a font-family value against a whitelist */
export function sanitizeFontFamily(font: string): string {
  const lowerFont = font.toLowerCase().replace(/['"]/g, '');
  if (SAFE_FONTS.includes(lowerFont)) {
    return `"${font}", sans-serif`;
  }
  return '"Arial", sans-serif';
}
