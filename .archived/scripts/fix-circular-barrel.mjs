#!/usr/bin/env node
/**
 * Fix circular imports caused by files that share a name with a sibling directory.
 * Changes imports like `./shader-background` to `./shader-background/index`
 * when the importing file IS `shader-background.tsx`.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';
import { execFileSync } from 'child_process';

const ROOT = 'apps/web/src';

// Validate root is within project directory
const PROJECT_ROOT = resolve('.');
const resolvedRoot = resolve(ROOT);
if (!resolvedRoot.startsWith(PROJECT_ROOT)) {
  console.error('Error: ROOT must be within project directory');
  process.exit(1);
}

// Find all files that share basename with sibling directory
function findConflictingFiles(root) {
  const result = execFileSync(
    'find',
    [root, '-name', '*.tsx', '-o', '-name', '*.ts'],
    { encoding: 'utf-8' }
  ).trim().split('\n').filter(Boolean);

  const conflicts = [];
  for (const f of result) {
    // Validate resolved path stays within project root (prevent path traversal)
    const resolvedFile = resolve(f);
    if (!resolvedFile.startsWith(PROJECT_ROOT)) continue;

    const base = basename(f).replace(/\.[^.]*$/, '');
    const dir = dirname(f);
    const siblingDir = join(dir, base);
    const resolvedSibling = resolve(siblingDir);
    if (!resolvedSibling.startsWith(PROJECT_ROOT)) continue;

    try {
      if (statSync(siblingDir).isDirectory()) {
        conflicts.push({ file: f, base, siblingDir });
      }
    } catch {}
  }
  return conflicts;
}

const conflicts = findConflictingFiles(ROOT);
console.log(`Found ${conflicts.length} files sharing name with sibling directory.`);

let fixed = 0;

for (const { file, base } of conflicts) {
  let content = readFileSync(file, 'utf-8');
  let changed = false;

  // Replace imports from './base-name' with './base-name/index'
  // We look for any import pattern referencing './{base}' without '/index'
  const patterns = [
    // from './base-name'  →  from './base-name/index'
    new RegExp(`(from\\s+['"])\\.\\/${escapeRegex(base)}(['"])`, 'g'),
    // from '../base-name'  →  from '../base-name/index' (less common but possible)
  ];

  for (const pattern of patterns) {
    const newContent = content.replace(pattern, `$1./${base}/index$2`);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(file, content, 'utf-8');
    fixed++;
  }
}

console.log(`Fixed ${fixed} files.`);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
