/**
 * Remove unnecessary jsdoc eslint-disable directives from test files.
 * Test files are excluded from jsdoc rules, so referencing jsdoc rules
 * in eslint-disable comments causes "definition not found" errors.
 * @description Cleans up unnecessary jsdoc directives in excluded files
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Find all files with jsdoc eslint-disable references
const files = execSync(
  'grep -rl "eslint-disable.*jsdoc/" apps/mobile/src/ apps/web/src/ packages/ 2>/dev/null || true',
  { encoding: 'utf8', cwd: '/CGraph' }
).trim().split('\n').filter(Boolean);

console.log(`Found ${files.length} files with jsdoc eslint-disable directives`);

let cleaned = 0;

// Files that should NOT have jsdoc directives (test/spec/mock files)
const isExcluded = (f) =>
  f.includes('__tests__') ||
  f.includes('/mocks/') ||
  f.endsWith('.test.ts') ||
  f.endsWith('.test.tsx') ||
  f.endsWith('.spec.ts') ||
  f.endsWith('.spec.tsx');

for (const file of files) {
  if (!isExcluded(file)) continue;

  let content = readFileSync(file, 'utf8');
  const original = content;

  // Remove lines that are solely eslint-disable-next-line jsdoc/* comments
  content = content.replace(
    /^[ \t]*\/\/ eslint-disable-next-line [^\n]*jsdoc\/[^\n]*\n/gm,
    ''
  );

  // Remove {/* eslint-disable-next-line jsdoc/* */} JSX comments
  content = content.replace(
    /^[ \t]*\{\/\* eslint-disable-next-line [^\n]*jsdoc\/[^\n]*\*\/\}\n/gm,
    ''
  );

  // Remove jsdoc/require-jsdoc from combined eslint-disable comments  
  // e.g., "// eslint-disable-next-line @typescript-eslint/foo, jsdoc/require-jsdoc"
  content = content.replace(
    /,\s*jsdoc\/require-jsdoc/g,
    ''
  );
  content = content.replace(
    /jsdoc\/require-jsdoc,?\s*/g,
    ''
  );

  if (content !== original) {
    writeFileSync(file, content);
    cleaned++;
  }
}

console.log(`Cleaned jsdoc directives from ${cleaned} test/mock files`);
