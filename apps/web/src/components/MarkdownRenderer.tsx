import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={`markdown-content prose prose-invert max-w-none ${className}`}
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom link rendering - open external links in new tab
        a: ({ href, children }) => {
          const isExternal = href?.startsWith('http');
          return (
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-primary-400 hover:text-primary-300 underline"
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
                className="bg-dark-700 px-1.5 py-0.5 rounded text-sm text-primary-300"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className={`block bg-dark-700 p-4 rounded-lg overflow-x-auto text-sm ${className || ''}`}
              {...props}
            >
              {children}
            </code>
          );
        },
        // Pre blocks for code
        pre: ({ children }) => (
          <pre className="bg-dark-700 rounded-lg overflow-x-auto my-4">
            {children}
          </pre>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary-500 pl-4 my-4 text-gray-300 italic">
            {children}
          </blockquote>
        ),
        // Images with lazy loading
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            loading="lazy"
            className="max-w-full h-auto rounded-lg my-4"
          />
        ),
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-dark-600">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-dark-600 bg-dark-700 px-4 py-2 text-left font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-dark-600 px-4 py-2">
            {children}
          </td>
        ),
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
          <h1 className="text-2xl font-bold text-white mt-6 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-white mt-5 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="text-gray-300 my-3 leading-relaxed">{children}</p>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside my-3 text-gray-300 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside my-3 text-gray-300 space-y-1">{children}</ol>
        ),
        // Horizontal rules
        hr: () => <hr className="border-dark-600 my-6" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
