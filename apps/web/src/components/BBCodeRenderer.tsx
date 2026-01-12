import { useMemo } from 'react';
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
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm">
          <div className="font-medium text-yellow-400 mb-1">BBCode Warning</div>
          <ul className="text-yellow-300/80 list-disc list-inside">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Render parsed content */}
      <div 
        className="bbcode-rendered prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

/**
 * Inline BBCode renderer for short content (comments, titles, etc.)
 * Does not include block-level elements like quotes or spoilers
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
      { pattern: /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, replace: '<span style="color: $1">$2</span>' },
      { pattern: /@([a-zA-Z0-9_-]+)/g, replace: '<a href="/u/$1" class="text-primary-400">@$1</a>' },
    ];
    
    for (const { pattern, replace } of inlineTags) {
      text = text.replace(pattern, replace);
    }
    
    return text;
  }, [content]);

  if (!content) return null;

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
