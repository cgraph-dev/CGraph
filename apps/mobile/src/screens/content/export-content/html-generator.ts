/**
 * HTML generator for content export.
 */
import { ExportOptions, ContentData } from './export-types';

/** Description. */
/** Generate h t m l. */
export function generateHTML(data: ContentData, options: ExportOptions): string {
  const paperWidth = options.paperSize === 'a4' ? '210mm' : '8.5in';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1f2937;
          padding: 20mm;
          max-width: ${paperWidth};
          margin: 0 auto;
        }
        .header {
          border-bottom: 2px solid #10b981;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .title {
          font-size: 18pt;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .meta {
          font-size: 10pt;
          color: #6b7280;
        }
        .meta span {
          margin-right: 16px;
        }
        .content {
          margin-bottom: 32px;
        }
        .content p {
          margin-bottom: 12px;
        }
        .content img {
          max-width: 100%;
          height: auto;
          margin: 12px 0;
          border-radius: 8px;
        }
        .replies {
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
        }
        .replies-title {
          font-size: 14pt;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
        }
        .reply {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .reply-meta {
          font-size: 9pt;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .reply-content {
          font-size: 11pt;
        }
        .footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 9pt;
          color: #9ca3af;
          text-align: center;
        }
        @media print {
          body {
            padding: 15mm;
          }
          .reply {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${data.title}</h1>
        <div class="meta">
          ${options.includeUsernames ? `<span>By: ${data.author}</span>` : ''}
          ${options.includeTimestamps ? `<span>Date: ${data.date}</span>` : ''}
        </div>
      </div>
      
      <div class="content">
        ${data.content}
      </div>
      
      ${
        options.includeReplies && data.replies && data.replies.length > 0
          ? `
        <div class="replies">
          <h2 class="replies-title">Replies (${data.replies.length})</h2>
          ${data.replies
            .map(
              (reply) => `
            <div class="reply">
              <div class="reply-meta">
                ${options.includeUsernames ? `<strong>${reply.author}</strong>` : ''}
                ${options.includeTimestamps ? ` • ${reply.date}` : ''}
              </div>
              <div class="reply-content">${reply.content}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
      
      <div class="footer">
        Exported on ${new Date().toLocaleDateString()} • CGraph Forum
      </div>
    </body>
    </html>
  `;
}
