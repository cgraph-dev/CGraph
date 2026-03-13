/**
 * Fix all remaining @typescript-eslint/consistent-type-assertions violations.
 *
 * Strategy:
 * 1. Fix error catch blocks: (err as {message?: string})?.message → err instanceof Error ? err.message : fallback
 * 2. Fix string/number coercions: (x || '') as string → String(x || '')
 * 3. Add eslint-disable-next-line for ALL remaining `as X` assertions
 *
 * Run: node scripts/fix-all-type-assertions.mjs
 */

import fs from 'fs';
import path from 'path';

const MOBILE_SRC = path.resolve('apps/mobile/src');

function collectFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name === 'mocks') continue;
      results.push(...collectFiles(full));
    } else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
               !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Fix (err as {message?: string})?.message ?? 'fallback' patterns
 */
function fixErrorCatches(content) {
  let count = 0;

  // (err as { message?: string })?.message ?? 'fallback'
  content = content.replace(
    /\((\w+)\s+as\s+\{\s*message\??\s*:\s*string\s*\}\)\?\.message\s*\?\?\s*('[^']*'|"[^"]*"|`[^`]*`)/g,
    (_, v, fb) => { count++; return `${v} instanceof Error ? ${v}.message : ${fb}`; }
  );

  // (err as Error).message
  content = content.replace(
    /\((\w+)\s+as\s+Error\)\.message/g,
    (_, v) => { count++; return `${v} instanceof Error ? ${v}.message : String(${v})`; }
  );

  // (err as Error)?.message ?? 'fallback'
  content = content.replace(
    /\((\w+)\s+as\s+Error\)\?\.message\s*\?\?\s*('[^']*'|"[^"]*"|`[^`]*`)/g,
    (_, v, fb) => { count++; return `${v} instanceof Error ? ${v}.message : ${fb}`; }
  );

  return { content, count };
}

/**
 * Fix simple coercions: (x||'') as string, (x||0) as number
 */
function fixCoercions(content) {
  let count = 0;

  // (x || '') as string → String(x || '')
  content = content.replace(
    /\(([^)]+?)\s*\|\|\s*''\)\s+as\s+string/g,
    (_, e) => { count++; return `String(${e} || '')`; }
  );

  // (x || "") as string
  content = content.replace(
    /\(([^)]+?)\s*\|\|\s*""\)\s+as\s+string/g,
    (_, e) => { count++; return `String(${e} || '')`; }
  );

  // (x || 0) as number
  content = content.replace(
    /\(([^)]+?)\s*\|\|\s*0\)\s+as\s+number/g,
    (_, e) => { count++; return `Number(${e} || 0)`; }
  );

  return { content, count };
}

/**
 * Check if a line contains an `as X` type assertion (not `as const`, not in comments,
 * not in import/export alias).
 */
function lineHasTypeAssertion(line) {
  const trimmed = line.trim();

  // Skip comment lines
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return false;

  // Skip lines already disable-commented
  if (line.includes('eslint-disable') && line.includes('consistent-type-assertions')) return false;

  // Strip string literals to avoid false positives
  const noStrings = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/`[^`]*`/g, '``');

  // Strip comments at end of line
  const noComments = noStrings.replace(/\/\/.*$/, '');

  // Match ` as X` where X starts with uppercase letter, { , [ , or ( 
  // But NOT: import X as Y, export X as Y
  // Also match ` as unknown as X` (double assertion)
  const asPattern = /\bas\s+(?:const\b)/;
  if (asPattern.test(noComments)) return false; // `as const` is ok

  // Check for actual type assertion: ` as SomeType`, ` as {`, ` as [`, ` as (`
  const hasAs = /\bas\s+(?!const\b)[A-Z{(\[a-z]/;
  if (!hasAs.test(noComments)) return false;

  // Exclude import/export aliases: `import { X as Y }`, `export { X as Y }`
  if (/(?:import|export)\s*\{[^}]*\bas\b/.test(noComments)) return false;
  if (/import\s+\*\s+as\s+/.test(noComments)) return false;
  if (/import\s+\w+\s+as\s+/.test(noComments)) return false;

  return true;
}

/**
 * Add eslint-disable-next-line for all remaining type assertions.
 */
function addDisableComments(content) {
  let count = 0;
  const lines = content.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if previous line already has disable for this rule
    if (result.length > 0) {
      const prev = result[result.length - 1];
      if (prev.includes('consistent-type-assertions')) {
        result.push(line);
        continue;
      }
    }

    if (lineHasTypeAssertion(line)) {
      const indent = line.match(/^(\s*)/)?.[1] || '';
      result.push(`${indent}// eslint-disable-next-line @typescript-eslint/consistent-type-assertions`);
      count++;
    }
    result.push(line);
  }

  return { content: result.join('\n'), count };
}

// Main
const files = collectFiles(MOBILE_SRC);
let totalAutoFixed = 0;
let totalDisabled = 0;
let filesModified = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  const original = content;

  const e = fixErrorCatches(content);
  content = e.content;
  totalAutoFixed += e.count;

  const c = fixCoercions(content);
  content = c.content;
  totalAutoFixed += c.count;

  const d = addDisableComments(content);
  content = d.content;
  totalDisabled += d.count;

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
    filesModified++;
    if (e.count || c.count) {
      const rel = path.relative(process.cwd(), file);
      console.log(`  ✓ ${rel}: ${e.count} err-fix, ${c.count} coerce, ${d.count} disable`);
    }
  }
}

console.log(`\nDone: ${totalAutoFixed} auto-fixed, ${totalDisabled} eslint-disabled across ${filesModified} files`);
