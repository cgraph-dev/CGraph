/**
 * PDF Generator
 *
 * Core PDF generation logic using jsPDF.
 * Handles document creation, layout, and content rendering.
 */

import type { ThreadData, PDFExportOptions } from './types';
import { FONT_SIZE_MAP, PDF_MARGINS, LINE_HEIGHT } from './constants';
import { htmlToPlainText, formatDate } from './utils';

// =============================================================================
// TYPES
// =============================================================================

type ProgressCallback = (progress: number) => void;

// =============================================================================
// PDF GENERATION
// =============================================================================

/**
 * Generate PDF document from thread data
 *
 * @param thread - Thread data to export
 * @param options - Export configuration options
 * @param onProgress - Progress callback (0-100)
 * @returns Promise resolving to PDF blob
 */
export async function generatePDF(
  thread: ThreadData,
  options: PDFExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  // Dynamically import jsPDF to reduce bundle size
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: options.pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PDF_MARGINS.left - PDF_MARGINS.right;
  const fontSize = FONT_SIZE_MAP[options.fontSize];
  const lineHeight = fontSize * LINE_HEIGHT;

  let currentY = PDF_MARGINS.top;
  let pageNumber = 1;

  // Helper: Add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - PDF_MARGINS.bottom) {
      doc.addPage();
      pageNumber++;
      currentY = PDF_MARGINS.top;

      // Add header if specified
      if (options.headerText) {
        doc.setFontSize(9);
        doc.setTextColor(128);
        doc.text(options.headerText, PDF_MARGINS.left, 25);
      }

      // Add footer with page number
      doc.setFontSize(9);
      doc.setTextColor(128);
      const footerText = options.footerText || `Page ${pageNumber}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: 'center' });

      doc.setTextColor(0);
    }
  };

  // Helper: Add wrapped text
  const addWrappedText = (text: string, x: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, x, currentY);
      currentY += lineHeight;
    }
  };

  // Report initial progress
  onProgress?.(5);

  // ==========================================================================
  // TITLE
  // ==========================================================================

  doc.setFontSize(fontSize + 6);
  doc.setFont('helvetica', 'bold');
  addWrappedText(thread.title, PDF_MARGINS.left, contentWidth);
  currentY += lineHeight / 2;

  onProgress?.(10);

  // ==========================================================================
  // METADATA
  // ==========================================================================

  if (options.includeMetadata) {
    doc.setFontSize(fontSize - 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);

     
    const metadataLines = [
      `Author: ${thread.author.name}`,
      `Posted: ${formatDate(thread.createdAt)}`,
      thread.categoryName ? `Category: ${thread.categoryName}` : null,
      thread.viewCount !== undefined ? `Views: ${thread.viewCount.toLocaleString()}` : null,
      thread.replyCount !== undefined ? `Replies: ${thread.replyCount.toLocaleString()}` : null,
    ].filter(Boolean) as string[]; // type assertion: filter(Boolean) removes nulls, leaving only strings

    for (const line of metadataLines) {
      checkPageBreak(lineHeight);
      doc.text(line, PDF_MARGINS.left, currentY);
      currentY += lineHeight * 0.9;
    }

    currentY += lineHeight;
    doc.setTextColor(0);
  }

  onProgress?.(15);

  // ==========================================================================
  // DIVIDER
  // ==========================================================================

  checkPageBreak(lineHeight * 2);
  doc.setDrawColor(200);
  doc.line(PDF_MARGINS.left, currentY, pageWidth - PDF_MARGINS.right, currentY);
  currentY += lineHeight;

  // ==========================================================================
  // MAIN CONTENT
  // ==========================================================================

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');

  const mainContent = htmlToPlainText(thread.content);
  addWrappedText(mainContent, PDF_MARGINS.left, contentWidth);

  onProgress?.(30);

  // ==========================================================================
  // REPLIES
  // ==========================================================================

  if (options.includeReplies && thread.posts.length > 0) {
    currentY += lineHeight;

    // Section header
    checkPageBreak(lineHeight * 3);
    doc.setDrawColor(200);
    doc.line(PDF_MARGINS.left, currentY, pageWidth - PDF_MARGINS.right, currentY);
    currentY += lineHeight;

    doc.setFontSize(fontSize + 2);
    doc.setFont('helvetica', 'bold');
    doc.text(`Replies (${thread.posts.length})`, PDF_MARGINS.left, currentY);
    currentY += lineHeight * 1.5;

    // Process each reply
    const totalPosts = thread.posts.length;
    for (let i = 0; i < totalPosts; i++) {
      const post = thread.posts[i];
      if (!post) continue;

      // Reply header
      checkPageBreak(lineHeight * 4);

      doc.setFontSize(fontSize - 1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60);

      let headerText = post.authorName;
      if (post.isOp) headerText += ' (OP)';
      doc.text(headerText, PDF_MARGINS.left, currentY);

      // Timestamp and likes
      if (options.includeTimestamps || options.includeLikes) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);

        const subTextParts: string[] = [];
        if (options.includeTimestamps) {
          subTextParts.push(formatDate(post.createdAt));
        }
        if (options.includeLikes && post.likes !== undefined) {
          subTextParts.push(`${post.likes} likes`);
        }

        currentY += lineHeight * 0.9;
        doc.setFontSize(fontSize - 2);
        doc.text(subTextParts.join(' • '), PDF_MARGINS.left, currentY);
      }

      currentY += lineHeight;

      // Reply content
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);

      const replyContent = htmlToPlainText(post.content);
      addWrappedText(replyContent, PDF_MARGINS.left, contentWidth);

      // Spacing between replies
      currentY += lineHeight;

      // Light divider between replies (except last)
      if (i < totalPosts - 1) {
        checkPageBreak(lineHeight);
        doc.setDrawColor(230);
        doc.line(PDF_MARGINS.left + 20, currentY, pageWidth - PDF_MARGINS.right - 20, currentY);
        currentY += lineHeight;
      }

      // Update progress
      const progress = 30 + Math.round((i / totalPosts) * 60);
      onProgress?.(progress);
    }
  }

  onProgress?.(95);

  // ==========================================================================
  // FINAL PAGE ELEMENTS
  // ==========================================================================

  // Add header to first page if specified
  if (options.headerText) {
    doc.setPage(1);
    doc.setFontSize(9);
    doc.setTextColor(128);
    doc.text(options.headerText, PDF_MARGINS.left, 25);
  }

  // Add footer to first page
  doc.setPage(1);
  doc.setFontSize(9);
  doc.setTextColor(128);
  const firstPageFooter = options.footerText || 'Page 1';
  doc.text(firstPageFooter, pageWidth / 2, pageHeight - 20, { align: 'center' });

  onProgress?.(100);

  // Return as blob
  return doc.output('blob');
}
