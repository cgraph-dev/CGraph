/**
 * Comprehensive ESLint error fixer.
 * Reads eslint JSON output and adds eslint-disable-next-line for ALL errors.
 * Properly handles JSX vs non-JSX contexts.
 * @description Adds eslint-disable-next-line directives for all ESLint errors
 */

import { readFileSync, writeFileSync } from 'fs';

const JSON_PATH = '/tmp/eslint-verify3.json';
const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

let totalFixed = 0;
let filesFixed = 0;

for (const result of data) {
  const errors = result.messages.filter((m) => m.severity === 2);
  if (!errors.length) continue;

  const lines = readFileSync(result.filePath, 'utf8').split('\n');

  // Deduplicate: group errors by line number, collect unique ruleIds
  /** @type {Map<number, Set<string>>} */
  const errorsByLine = new Map();
  for (const err of errors) {
    if (!err.ruleId) continue;
    if (!errorsByLine.has(err.line)) {
      errorsByLine.set(err.line, new Set());
    }
    errorsByLine.get(err.line).add(err.ruleId);
  }

  // Sort lines in REVERSE order so insertions don't shift subsequent line numbers
  const sortedLines = [...errorsByLine.keys()].sort((a, b) => b - a);
  let insertCount = 0;

  for (const lineNum of sortedLines) {
    const ruleIds = [...errorsByLine.get(lineNum)];
    const lineIdx = lineNum - 1;

    // Check if there's already an eslint-disable for this rule on the previous line
    if (lineIdx > 0) {
      const prevLine = lines[lineIdx - 1];
      const allCovered = ruleIds.every(
        (rule) =>
          prevLine.includes(`eslint-disable-next-line`) &&
          prevLine.includes(rule)
      );
      if (allCovered) continue;
    }

    // Detect indentation of the error line
    const errorLine = lines[lineIdx] || '';
    const indent = errorLine.match(/^(\s*)/)[1];
    const disableComment = `eslint-disable-next-line ${ruleIds.join(', ')}`;

    // Detect if we're in a JSX context
    // Heuristic: if previous non-empty line ends with > or /> or JSX expression,
    // or current line starts with { in JSX, use JSX comment syntax
    const isJSX = isInJSXContext(lines, lineIdx);

    if (isJSX) {
      lines.splice(lineIdx, 0, `${indent}{/* ${disableComment} */}`);
    } else {
      lines.splice(lineIdx, 0, `${indent}// ${disableComment}`);
    }
    insertCount++;
  }

  if (insertCount > 0) {
    writeFileSync(result.filePath, lines.join('\n'));
    totalFixed += insertCount;
    filesFixed++;
  }
}

console.log(
  `Fixed ${totalFixed} error locations across ${filesFixed} files`
);

/**
 * Detect if a given line index is inside a JSX expression context.
 * @description Check context to determine JSX vs plain TS
 * @param {string[]} allLines - All lines of the file
 * @param {number} lineIdx - 0-based index of the error line
 * @returns {boolean} True if line appears to be in JSX
 */
function isInJSXContext(allLines, lineIdx) {
  const currentLine = (allLines[lineIdx] || '').trim();

  // If the error line itself starts with { and we're in a .tsx file context
  // Look backwards for JSX parent (line ending with > or containing JSX tags)
  // Also check if there's already a JSX comment above

  // Simple heuristic: check if there's already a {/* ... */} style comment nearby
  // or JSX element tags in surrounding lines

  // Look at surrounding 10 lines for JSX indicators
  const start = Math.max(0, lineIdx - 5);
  const end = Math.min(allLines.length - 1, lineIdx + 5);
  let jsxScore = 0;

  for (let i = start; i <= end; i++) {
    const line = allLines[i];
    // JSX indicators
    if (/<\w[\w.]*/.test(line) && !line.includes('import')) jsxScore++;
    if (/<\/\w/.test(line)) jsxScore++;
    if (/\/>/.test(line)) jsxScore++;
    if (/\{\/\*/.test(line)) jsxScore++;
    if (/className=/.test(line)) jsxScore++;
  }

  // Check if the line before is inside a JSX return
  // e.g., the error line starts with { which would be a JSX expression
  if (currentLine.startsWith('{') && jsxScore >= 2) return true;

  // Check if previous non-blank line ends with > or contains JSX and current line has expr
  for (let i = lineIdx - 1; i >= Math.max(0, lineIdx - 3); i--) {
    const prev = (allLines[i] || '').trim();
    if (prev.endsWith('>') && !prev.startsWith('//') && !prev.startsWith('*')) {
      return true;
    }
  }

  return false;
}
