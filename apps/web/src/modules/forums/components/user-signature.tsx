import BBCodeRenderer from '@/components/content/bb-code-renderer';

interface UserSignatureProps {
  content: string;
  className?: string;
  /** Maximum height before scrolling */
  maxHeight?: number;
}

/**
 * UserSignature - Displays a user's signature below their posts
 *
 * Signatures are rendered as BBCode and displayed with a separator.
 * They have a maximum height to prevent abuse.
 */
export default function UserSignature({
  content,
  className = '',
  maxHeight = 150,
}: UserSignatureProps) {
  if (!content || content.trim() === '') {
    return null;
  }

  return (
    <div className={`user-signature mt-4 border-t border-dark-600/50 pt-4 ${className}`}>
      <div
        className="overflow-hidden text-sm text-gray-400"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <BBCodeRenderer content={content} className="prose-sm" />
      </div>
    </div>
  );
}
