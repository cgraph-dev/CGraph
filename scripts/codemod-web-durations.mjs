#!/usr/bin/env node
/**
 * Codemod: Replace inline duration values in web Framer Motion code
 * with `durations.X.ms / 1000` from @cgraph/animation-constants.
 *
 * Web uses seconds (Framer Motion convention):
 *   duration: 0.2 → duration: durations.normal.ms / 1000
 *   duration: 0.3 → duration: durations.slow.ms / 1000
 *
 * Also handles millisecond patterns in non-Framer contexts:
 *   duration: 200 → duration: durations.normal.ms
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Seconds → preset mapping (for Framer Motion)
const SECONDS_MAP = {
  '0.05':  'durations.stagger.ms / 1000',
  '0.1':   'durations.instant.ms / 1000',
  '0.15':  'durations.fast.ms / 1000',
  '0.2':   'durations.normal.ms / 1000',
  '0.3':   'durations.slow.ms / 1000',
  '0.4':   'durations.smooth.ms / 1000',
  '0.5':   'durations.slower.ms / 1000',
  '0.6':   'durations.dramatic.ms / 1000',
  '0.8':   'durations.extended.ms / 1000',
  '1':     'durations.verySlow.ms / 1000',
  '1.5':   'durations.ambient.ms / 1000',
  '2':     'durations.loop.ms / 1000',
  '3':     'durations.cinematic.ms / 1000',
  '5':     'durations.epic.ms / 1000',
};

// Milliseconds → preset mapping (for timeouts, delays, non-Framer)
const MS_MAP = {
  50:   'durations.stagger.ms',
  100:  'durations.instant.ms',
  150:  'durations.fast.ms',
  200:  'durations.normal.ms',
  300:  'durations.slow.ms',
  400:  'durations.smooth.ms',
  500:  'durations.slower.ms',
  600:  'durations.dramatic.ms',
  800:  'durations.extended.ms',
  1000: 'durations.verySlow.ms',
  1500: 'durations.ambient.ms',
  2000: 'durations.loop.ms',
  3000: 'durations.cinematic.ms',
  5000: 'durations.epic.ms',
};

// Build patterns for seconds values (0.2, 0.3, 1, 1.5, 2, 3, 5)
const SEC_VALUES = Object.keys(SECONDS_MAP).map(s => s.replace('.', '\\.')).join('|');
const MS_VALUES = Object.keys(MS_MAP).join('|');

// Match: duration: <seconds> in transition objects (Framer Motion)
const DURATION_SEC_RE = new RegExp(`(duration:\\s*)(${SEC_VALUES})(?=\\s*[,}\\)\\s])`, 'g');

// Match: duration: <milliseconds> in non-Framer contexts
const DURATION_MS_RE = new RegExp(`(duration:\\s*)(${MS_VALUES})(?=\\s*[,}\\)])`, 'g');

// Skip patterns — files that are data-heavy or non-animation contexts
const SKIP_FILES = [
  'stickers.ts',     // Sticker data with intentional per-sticker durations
  'borderCollections.ts', // Border config data
];

const files = execSync(
  'find apps/web/src -name "*.ts" -o -name "*.tsx" | grep -v __tests__ | grep -v node_modules | grep -v "\\.d\\.ts"',
  { encoding: 'utf8', cwd: '/CGraph' }
).trim().split('\n').filter(Boolean);

let totalReplacements = 0;
let filesModified = 0;

for (const relPath of files) {
  const fileName = relPath.split('/').pop();
  if (SKIP_FILES.includes(fileName)) continue;

  const fullPath = `/CGraph/${relPath}`;
  let content = readFileSync(fullPath, 'utf8');
  let count = 0;

  // Determine if this file uses seconds (Framer Motion) or milliseconds
  const usesFramerMotion = content.includes('framer-motion') || 
    content.includes('motion.') || content.includes('animate(') ||
    content.includes('transition:') || content.includes('transition={') ||
    content.includes('AnimatePresence');

  const newContent = content.replace(DURATION_SEC_RE, (match, prefix, num) => {
    // Only replace seconds values in files that look like they use Framer Motion
    if (!usesFramerMotion && Number(num) < 10) return match;
    const replacement = SECONDS_MAP[num];
    if (replacement) { count++; return `${prefix}${replacement}`; }
    return match;
  }).replace(DURATION_MS_RE, (match, prefix, num) => {
    // Only replace large ms values (skip values that might be seconds in Framer files)
    if (usesFramerMotion && Number(num) < 10) return match;
    const replacement = MS_MAP[Number(num)];
    if (replacement) { count++; return `${prefix}${replacement}`; }
    return match;
  });

  if (count > 0) {
    let finalContent = newContent;
    if (!finalContent.includes("from '@cgraph/animation-constants'") &&
        !finalContent.includes('from "@cgraph/animation-constants"')) {
      const firstImportIdx = finalContent.search(/^import /m);
      if (firstImportIdx >= 0) {
        finalContent = finalContent.slice(0, firstImportIdx) +
          "import { durations } from '@cgraph/animation-constants';\n" +
          finalContent.slice(firstImportIdx);
      }
    } else if (!finalContent.match(/import\s*{[^}]*durations[^}]*}\s*from\s*['"]@cgraph\/animation-constants['"]/)) {
      finalContent = finalContent.replace(
        /import\s*{([^}]*)}\s*from\s*(['"])@cgraph\/animation-constants\2/,
        (m, imports, q) => `import {${imports}, durations } from ${q}@cgraph/animation-constants${q}`
      );
    }

    writeFileSync(fullPath, finalContent, 'utf8');
    totalReplacements += count;
    filesModified++;
    console.log(`  ${relPath}: ${count} replacements`);
  }
}

console.log(`\nDone: ${totalReplacements} replacements across ${filesModified} files`);
