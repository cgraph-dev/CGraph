#!/usr/bin/env node
/**
 * Codemod: Replace inline duration values in mobile `withTiming()` / `withDelay()` calls
 * with `durations.X.ms` from @cgraph/animation-constants.
 *
 * Handles patterns:
 *   withTiming(value, { duration: 200 })  → withTiming(value, { duration: durations.normal.ms })
 *   withDelay(200, ...)                   → withDelay(durations.normal.ms, ...)
 *   Animated.timing(ref, { ..., duration: 300, ... }) → duration: durations.slow.ms
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const DURATION_MAP = {
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

const DURATION_VALUES = Object.keys(DURATION_MAP).map(Number).join('|');

// Match: duration: <number> (in object literal context)
const DURATION_PROP_RE = new RegExp(`(duration:\\s*)(${DURATION_VALUES})(?=\\s*[,}\\)])`, 'g');

// Match: withDelay(<number>, ...)
const WITH_DELAY_RE = new RegExp(`(withDelay\\()(${DURATION_VALUES})(?=\\s*,)`, 'g');

// Match: setTimeout(..., <number>)  and setInterval(..., <number>)
// Skip these — they're not animation durations

const files = execSync(
  'find apps/mobile/src -name "*.ts" -o -name "*.tsx" | grep -v __tests__ | grep -v node_modules',
  { encoding: 'utf8', cwd: '/CGraph' }
).trim().split('\n').filter(Boolean);

let totalReplacements = 0;
let filesModified = 0;

for (const relPath of files) {
  const fullPath = `/CGraph/${relPath}`;
  let content = readFileSync(fullPath, 'utf8');
  let count = 0;

  const newContent = content
    .replace(DURATION_PROP_RE, (match, prefix, num) => {
      const replacement = DURATION_MAP[Number(num)];
      if (replacement) { count++; return `${prefix}${replacement}`; }
      return match;
    })
    .replace(WITH_DELAY_RE, (match, prefix, num) => {
      const replacement = DURATION_MAP[Number(num)];
      if (replacement) { count++; return `${prefix}${replacement}`; }
      return match;
    });

  if (count > 0) {
    // Add import if not already present
    let finalContent = newContent;
    if (!finalContent.includes("from '@cgraph/animation-constants'") &&
        !finalContent.includes('from "@cgraph/animation-constants"')) {
      // Find first import line
      const firstImportIdx = finalContent.search(/^import /m);
      if (firstImportIdx >= 0) {
        finalContent = finalContent.slice(0, firstImportIdx) +
          "import { durations } from '@cgraph/animation-constants';\n" +
          finalContent.slice(firstImportIdx);
      }
    } else if (!finalContent.match(/import\s*{[^}]*durations[^}]*}\s*from\s*['"]@cgraph\/animation-constants['"]/)) {
      // Has import from animation-constants but doesn't include durations — add it
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
