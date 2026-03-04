/**
 * Markdown content renderer component.
 * @module
 */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  isValidLinkUrl,
  isValidImageUrl,
  sanitizeLinkUrl,
  sanitizeImageUrl,
} from '../../utils/urlSecurity';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer - Renders markdown content with GitHub Flavored Markdown support.
 *
 * Supports:
 * - Headers, bold, italic, strikethrough
 * - Code blocks with syntax highlighting classes
 * - Links, images
 * - Lists (ordered, unordered, task lists)
 * - Tables
 * - Blockquotes
 *
 * Security:
 * - Validates URLs to prevent javascript: protocol attacks
 * - Uses react-markdown which doesn't render raw HTML by default
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom link rendering - open external links in new tab with URL validation
          a: ({ href, children }) => {
            // Validate URL before rendering
            if (!isValidLinkUrl(href)) {
              // For invalid URLs, render as plain text
              return <span className="text-gray-400">{children}</span>;
            }

            const safeHref = sanitizeLinkUrl(href);
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-primary-400 underline hover:text-primary-300"
              >
                {children}
              </a>
            );
          },
          // Code blocks
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-primary-300"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`block overflow-x-auto rounded-lg bg-white/[0.06] p-4 text-sm ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Pre blocks for code
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg bg-white/[0.06]">{children}</pre>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-primary-500 pl-4 italic text-gray-300">
              {children}
            </blockquote>
          ),
          // Images with lazy loading and URL validation
          img: ({ src, alt }) => {
            // Validate image URL before rendering
            if (!isValidImageUrl(src)) {
              // For invalid URLs, don't render the image
              return <span className="italic text-gray-400">[Invalid image]</span>;
            }

            const safeSrc = sanitizeImageUrl(src);
            return (
              <img
                src={safeSrc}
                alt={alt || ''}
                loading="lazy"
                className="my-4 h-auto max-w-full rounded-lg"
              />
            );
          },
          // Tables
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-white/[0.08]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-white/[0.08] px-4 py-2">{children}</td>,
          // Task lists
          input: ({ checked, ...props }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-2 accent-primary-500"
              {...props}
            />
          ),
          // Headers with proper spacing
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-2xl font-bold text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-xl font-bold text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-lg font-semibold text-white">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => <p className="my-3 leading-relaxed text-gray-300">{children}</p>,
          // Lists
          ul: ({ children }) => (
            <ul className="my-3 list-inside list-disc space-y-1 text-gray-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-inside list-decimal space-y-1 text-gray-300">{children}</ol>
          ),
          // Horizontal rules
          hr: () => <hr className="my-6 border-white/[0.08]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
