import BBCodeRenderer from '@/components/BBCodeRenderer';

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
    <div className={`user-signature mt-4 pt-4 border-t border-dark-600/50 ${className}`}>
      <div 
        className="text-sm text-gray-400 overflow-hidden"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <BBCodeRenderer content={content} className="prose-sm" />
      </div>
    </div>
  );
}
