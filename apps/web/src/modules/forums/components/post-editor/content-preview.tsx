/**
 * Post content preview component.
 * @module
 */
import DOMPurify from 'dompurify';

interface ContentPreviewProps {
  title: string;
  content: string;
}

/**
 * ContentPreview Component
 *
 * Renders sanitized HTML preview of post content
 */
export function ContentPreview({ title, content }: ContentPreviewProps) {
  return (
    <div className="prose prose-invert min-h-[200px] max-w-none rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
      <h1>{title || 'Post Title'}</h1>
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content || '<p>Your content will appear here...</p>', {
            USE_PROFILES: { html: true },
          }),
        }}
      />
    </div>
  );
}

export default ContentPreview;
