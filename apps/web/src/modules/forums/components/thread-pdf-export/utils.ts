/**
 * Thread PDF Export Utilities
 *
 * Helper functions for text processing and formatting.
 */

// =============================================================================
// TEXT CONVERSION
// =============================================================================

/**
 * Convert HTML content to plain text
 * Strips HTML tags and decodes entities
 *
 * @param html - HTML string to convert
 * @returns Plain text string
 */
export function htmlToPlainText(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  // Strip all HTML tags to text-only before DOM insertion to prevent script execution
  temp.textContent = html.replace(/<[^>]*>/g, ' ');

  // Get text content and clean up whitespace
  const text = temp.textContent || '';

  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n\n') // Keep paragraph breaks
    .trim();
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Format a date for display in PDF
 *
 * @param date - Date to format (Date object or string)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// TEXT MANIPULATION
// =============================================================================

/**
 * Truncate text to a maximum length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sanitize filename by removing invalid characters
 *
 * @param filename - Original filename
 * @param maxLength - Maximum filename length
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string, maxLength: number = 50): string {
  return filename.replace(/[^a-z0-9]/gi, '_').slice(0, maxLength);
}

/**
 * Split text into lines that fit within a specified width
 * Used for PDF text wrapping
 *
 * @param text - Text to split
 * @param maxWidth - Maximum width in characters (approximate)
 * @returns Array of text lines
 */
export function splitTextIntoLines(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
