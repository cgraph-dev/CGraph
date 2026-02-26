/**
 * Thread Lines
 *
 * Visual thread lines connecting parent-child comments.
 */

interface ThreadLineProps {
  depth: number;
  isLast: boolean;
}

/**
 * unknown for the forums module.
 */
/**
 * Thread Line component.
 */
export function ThreadLine({ depth, isLast }: ThreadLineProps) {
  if (depth <= 0) return null;

  return (
    <>
      {/* Vertical line connecting to parent */}
      <div
        className="absolute left-0 top-0 w-0.5 bg-dark-600"
        style={{
          left: -12,
          height: isLast ? 24 : '100%',
        }}
      />
      {/* Horizontal connector to thread line */}
      <div
        className="absolute h-0.5 bg-dark-600"
        style={{
          left: -12,
          top: 24,
          width: 12,
        }}
      />
    </>
  );
}
