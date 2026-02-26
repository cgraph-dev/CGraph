/**
 * BBCode content renderer component.
 * @module
 */
import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { parseBBCode, validateBBCode } from '@/lib/bbcode';

interface BBCodeRendererProps {
  content: string;
  className?: string;
  /** Show validation warnings for malformed BBCode */
  showWarnings?: boolean;
  /** Maximum content length before truncation */
  maxLength?: number;
}

/**
 * BBCodeRenderer - Renders BBCode formatted content
 *
 * Supports full MyBB-compatible BBCode including:
 * - Basic: [b], [i], [u], [s], [sub], [sup]
 * - Links: [url], [email]
 * - Media: [img], [video], [youtube]
 * - Code: [code], [php], [html]
 * - Formatting: [color], [size], [font], [align], [indent]
 * - Lists: [list], [*]
 * - Quotes: [quote], [quote=author]
 * - Special: [spoiler], [hr], [me], @mentions
 *
 * Security:
 * - XSS prevention through HTML escaping
 * - URL validation for links and images
 * - Content sanitization
 */
export default function BBCodeRenderer({
  content,
  className = '',
  showWarnings = false,
  maxLength,
}: BBCodeRendererProps) {
  // Parse BBCode to HTML
  const { html, validation } = useMemo(() => {
    if (!content) {
      return { html: '', validation: { valid: true, errors: [] } };
    }

    let text = content;

    // Truncate if needed
    if (maxLength && text.length > maxLength) {
      text = text.slice(0, maxLength) + '...';
    }

    const validation = validateBBCode(text);
    const html = parseBBCode(text);

    return { html, validation };
  }, [content, maxLength]);

  if (!content) {
    return null;
  }

  return (
    <div className={`bbcode-content ${className}`}>
      {/* Show validation warnings if enabled */}
      {showWarnings && !validation.valid && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
          <div className="mb-1 font-medium text-yellow-400">BBCode Warning</div>
          <ul className="list-inside list-disc text-yellow-300/80">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Render parsed content */}
      <div
        className="bbcode-rendered prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
        }}
      />
    </div>
  );
}

/**
 * Inline BBCode renderer for short content (comments, titles, etc.)
 * Does not include block-level elements like quotes or spoilers
 */
// Validate CSS color values to prevent XSS
function isValidCssColor(color: string): boolean {
  // Hex colors: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#[0-9A-Fa-f]{3,8}$/.test(color)) return true;
  // RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i.test(color)) return true;
  // HSL/HSLA
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/i.test(color)) return true;
  // Named colors (common safe ones)
  const safeColors = new Set([
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
    'transparent',
    'inherit',
    'currentColor',
  ]);
  return safeColors.has(color.toLowerCase());
}

/**
 * unknown for the content module.
 */
/**
 * Inline B B Code Renderer component.
 */
export function InlineBBCodeRenderer({
  content,
  className = '',
}: {
  content: string;
  className?: string;
}) {
  const html = useMemo(() => {
    if (!content) return '';

    // Parse with limited tags for inline content
    let text = content;

    // Only process inline tags
    const inlineTags = [
      { pattern: /\[b\]([\s\S]*?)\[\/b\]/gi, replace: '<strong>$1</strong>' },
      { pattern: /\[i\]([\s\S]*?)\[\/i\]/gi, replace: '<em>$1</em>' },
      { pattern: /\[u\]([\s\S]*?)\[\/u\]/gi, replace: '<span class="underline">$1</span>' },
      { pattern: /\[s\]([\s\S]*?)\[\/s\]/gi, replace: '<del>$1</del>' },
      // Color tag with validation - only apply if color is valid
      {
        pattern: /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi,
        replace: (_match: string, color: string, text: string) => {
          if (isValidCssColor(color)) {
            return `<span style="color: ${color}">${text}</span>`;
          }
          return text; // Strip invalid color tag but keep content
        },
      },
      {
        pattern: /@([a-zA-Z0-9_-]+)/g,
        replace: '<a href="/u/$1" class="text-primary-400">@$1</a>',
      },
    ];

    for (const { pattern, replace } of inlineTags) {
      if (typeof replace === 'function') {
         
        text = text.replace(pattern, replace as (substring: string, ...args: string[]) => string);
      } else {
        text = text.replace(pattern, replace);
      }
    }

    // Sanitize output with DOMPurify
    return DOMPurify.sanitize(text, { USE_PROFILES: { html: true } });
  }, [content]);

  if (!content) return null;

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
