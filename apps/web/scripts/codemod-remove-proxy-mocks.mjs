#!/usr/bin/env node
/**
 * Codemod: Remove vi.mock() blocks for aliased modules from test files.
 *
 * Removes vi.mock() calls for 'framer-motion', '@heroicons/react/24/outline',
 * '@heroicons/react/24/solid', '@heroicons/react/20/solid' — but ONLY when
 * the factory body contains `new Proxy`, since those cause vitest hangs
 * when combined with resolve.alias.
 *
 * Usage: node scripts/codemod-remove-proxy-mocks.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const ALIASED_MODULES = new Set([
  'framer-motion',
  '@heroicons/react/24/outline',
  '@heroicons/react/24/solid',
  '@heroicons/react/20/solid',
]);

const raw = execSync(
  "grep -rln 'new Proxy' src/ --include='*.test.*' --include='*.spec.*'",
  { cwd: '/CGraph/apps/web', encoding: 'utf-8' }
);
const files = raw.trim().split('\n').filter(Boolean);
console.log(`Scanning ${files.length} files with 'new Proxy'...\n`);

let totalFiles = 0;
let totalBlocksRemoved = 0;

function extractMockBlock(content, callStartIdx) {
  const parenIdx = content.indexOf('(', callStartIdx);
  if (parenIdx === -1) return null;

  let depth = 1;
  let i = parenIdx + 1;
  for (; i < content.length; i++) {
    const ch = content[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (ch === '(' || ch === '{' || ch === '[') depth++;
    if (ch === ')' || ch === '}' || ch === ']') depth--;
    if (depth === 0) {
      let endIdx = i + 1;
      while (endIdx < content.length && content[endIdx] === ';') endIdx++;
      if (endIdx < content.length && content[endIdx] === '\n') endIdx++;
      return { block: content.substring(callStartIdx, endIdx), endIdx };
    }
  }
  return null;
}

for (const relPath of files) {
  const absPath = `/CGraph/apps/web/${relPath}`;
  let content = readFileSync(absPath, 'utf-8');
  const original = content;
  let blocksRemoved = 0;

  let searchStart = 0;
  while (true) {
    const viMockIdx = content.indexOf('vi.mock(', searchStart);
    if (viMockIdx === -1) break;

    const afterParen = content.substring(viMockIdx + 8);
    const modMatch = afterParen.match(/^['"]([^'"]+)['"]/);
    if (!modMatch) { searchStart = viMockIdx + 8; continue; }

    const moduleName = modMatch[1];
    if (!ALIASED_MODULES.has(moduleName)) { searchStart = viMockIdx + 8; continue; }

    const result = extractMockBlock(content, viMockIdx);
    if (!result) { searchStart = viMockIdx + 8; continue; }
    if (!result.block.includes('new Proxy')) { searchStart = result.endIdx; continue; }

    let removeStart = viMockIdx;
    const before = content.substring(0, viMockIdx);
    const lastNL = before.lastIndexOf('\n');
    if (lastNL >= 0) {
      const prevLineStart = before.lastIndexOf('\n', lastNL - 1) + 1;
      const prevLine = before.substring(prevLineStart, lastNL).trim();
      if (prevLine.startsWith('//') && (prevLine.includes('eslint-disable') || prevLine.includes('Proxy'))) {
        removeStart = prevLineStart;
      }
    }

    content = content.substring(0, removeStart) + content.substring(result.endIdx);
    blocksRemoved++;
    searchStart = removeStart;
  }

  if (blocksRemoved > 0) {
    const anyPropsDecl = /^\s*type AnyProps = Record<string, any>;?\s*\n/m;
    if (anyPropsDecl.test(content)) {
      const withoutDecl = content.replace(anyPropsDecl, '');
      if (!withoutDecl.includes('AnyProps')) content = withoutDecl;
    }
    content = content.replace(/\/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\s*\n(?=\s*\n|vi\.mock|import)/gm, '');
    content = content.replace(/\n{3,}/g, '\n\n');

    writeFileSync(absPath, content, 'utf-8');
    totalFiles++;
    totalBlocksRemoved += blocksRemoved;
    console.log(`  ✓ ${relPath} — removed ${blocksRemoved} Proxy mock(s)`);
  }
}

console.log(`\nDone: ${totalBlocksRemoved} Proxy mocks removed from ${totalFiles} files.`);
