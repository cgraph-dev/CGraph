/**
 * Utility functions for E2EE verification screen.
 * @module screens/security/e2-ee-verification-screen/utils
 */

export function generateFallbackSafetyNumber(): string {
  let number = '';
  for (let i = 0; i < 60; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
}

export function formatSafetyNumberForShare(number: string): string {
  const blocks = number.match(/.{1,5}/g) || [];
  const rows = [];
  for (let i = 0; i < blocks.length; i += 4) {
    rows.push(blocks.slice(i, i + 4).join(' '));
  }
  return rows.join('\n');
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
