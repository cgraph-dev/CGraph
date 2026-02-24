/**
 * Codemod: Replace inline Framer Motion transitions with preset imports.
 *
 * Replaces patterns like:
 *   transition={{ duration: 0.3 }}           → transition={tweens.standard}
 *   transition={{ duration: 2, repeat: Infinity }} → transition={loop(tweens.ambient)}
 *
 * Run: node scripts/codemod-transitions.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const DRY_RUN = process.argv.includes('--dry-run');

// ============================================================================
// 1. Map inline patterns → preset references
// ============================================================================
// Each entry: [regex, replacement string, needs `loop` import, needs `loopWithDelay`]
const REPLACEMENTS = [
  // ── Simple duration-only transitions ──
  [/transition=\{\{\s*duration:\s*0\.1\s*\}\}/g, 'transition={tweens.instant}', false, false],
  [/transition=\{\{\s*duration:\s*0\.15\s*\}\}/g, 'transition={tweens.quickFade}', false, false],
  [/transition=\{\{\s*duration:\s*0\.2\s*\}\}/g, 'transition={tweens.fast}', false, false],
  [/transition=\{\{\s*duration:\s*0\.25\s*\}\}/g, 'transition={tweens.brisk}', false, false],
  [/transition=\{\{\s*duration:\s*0\.3\s*\}\}/g, 'transition={tweens.standard}', false, false],
  [/transition=\{\{\s*duration:\s*0\.4\s*\}\}/g, 'transition={tweens.moderate}', false, false],
  [/transition=\{\{\s*duration:\s*0\.5\s*\}\}/g, 'transition={tweens.smooth}', false, false],
  [/transition=\{\{\s*duration:\s*0\.6\s*\}\}/g, 'transition={tweens.emphatic}', false, false],
  [/transition=\{\{\s*duration:\s*0\.8\s*\}\}/g, 'transition={tweens.dramatic}', false, false],
  [/transition=\{\{\s*duration:\s*1\s*\}\}/g, 'transition={tweens.slow}', false, false],
  [/transition=\{\{\s*duration:\s*1\.5\s*\}\}/g, 'transition={tweens.verySlow}', false, false],
  [/transition=\{\{\s*duration:\s*2\s*\}\}/g, 'transition={tweens.ambient}', false, false],

  // ── duration + ease: 'easeOut' → use the preset (already easeOut) ──
  [/transition=\{\{\s*duration:\s*0\.3,\s*ease:\s*'easeOut'\s*\}\}/g, 'transition={tweens.standard}', false, false],
  [/transition=\{\{\s*duration:\s*0\.5,\s*ease:\s*'easeOut'\s*\}\}/g, 'transition={tweens.smooth}', false, false],
  [/transition=\{\{\s*duration:\s*0\.6,\s*ease:\s*'easeOut'\s*\}\}/g, 'transition={tweens.emphatic}', false, false],
  [/transition=\{\{\s*duration:\s*0\.8,\s*ease:\s*'easeOut'\s*\}\}/g, 'transition={tweens.dramatic}', false, false],
  [/transition=\{\{\s*duration:\s*1\.5,\s*ease:\s*'easeOut'\s*\}\}/g, 'transition={tweens.verySlow}', false, false],

  // ── Looping transitions: duration + repeat: Infinity ──
  [/transition=\{\{\s*duration:\s*0\.8,\s*repeat:\s*Infinity,\s*ease:\s*'linear'\s*\}\}/g, 'transition={loop(tweens.dramatic)}', true, false],
  [/transition=\{\{\s*duration:\s*1,\s*repeat:\s*Infinity,\s*ease:\s*'linear'\s*\}\}/g, 'transition={loop(tweens.slow)}', true, false],
  [/transition=\{\{\s*repeat:\s*Infinity,\s*duration:\s*1,\s*ease:\s*'linear'\s*\}\}/g, 'transition={loop(tweens.slow)}', true, false],
  [/transition=\{\{\s*duration:\s*1,\s*repeat:\s*Infinity\s*\}\}/g, 'transition={loop(tweens.slow)}', true, false],
  [/transition=\{\{\s*duration:\s*1\.5,\s*repeat:\s*Infinity,\s*ease:\s*'linear'\s*\}\}/g, 'transition={loop(tweens.verySlow)}', true, false],
  [/transition=\{\{\s*duration:\s*1\.5,\s*repeat:\s*Infinity\s*\}\}/g, 'transition={loop(tweens.verySlow)}', true, false],
  [/transition=\{\{\s*duration:\s*2,\s*repeat:\s*Infinity,\s*ease:\s*'linear'\s*\}\}/g, 'transition={loop(tweens.ambient)}', true, false],
  [/transition=\{\{\s*duration:\s*2,\s*repeat:\s*Infinity,\s*ease:\s*'easeInOut'\s*\}\}/g, 'transition={loop(tweens.ambient)}', true, false],
  [/transition=\{\{\s*duration:\s*2,\s*repeat:\s*Infinity,\s*ease:\s*'easeOut'\s*\}\}/g, 'transition={loop(tweens.ambient)}', true, false],
  [/transition=\{\{\s*duration:\s*2,\s*repeat:\s*Infinity\s*\}\}/g, 'transition={loop(tweens.ambient)}', true, false],
  [/transition=\{\{\s*repeat:\s*Infinity,\s*duration:\s*2\s*\}\}/g, 'transition={loop(tweens.ambient)}', true, false],
  [/transition=\{\{\s*duration:\s*2\.5,\s*repeat:\s*Infinity,\s*ease:\s*'easeInOut'\s*\}\}/g, 'transition={loop(tweens.ambientSlow)}', true, false],
  [/transition=\{\{\s*duration:\s*2\.5,\s*repeat:\s*Infinity\s*\}\}/g, 'transition={loop(tweens.ambientSlow)}', true, false],
  [/transition=\{\{\s*duration:\s*3,\s*repeat:\s*Infinity,\s*ease:\s*'linear'\s*\}\}/g, 'transition={loop(tweens.decorative)}', true, false],
  [/transition=\{\{\s*repeat:\s*Infinity,\s*duration:\s*3\s*\}\}/g, 'transition={loop(tweens.decorative)}', true, false],
  [/transition=\{\{\s*duration:\s*3,\s*repeat:\s*Infinity\s*\}\}/g, 'transition={loop(tweens.decorative)}', true, false],
  [/transition=\{\{\s*duration:\s*4,\s*repeat:\s*Infinity,\s*ease:\s*'easeInOut'\s*\}\}/g, 'transition={loop(tweens.glacial)}', true, false],
  [/transition=\{\{\s*duration:\s*4,\s*repeat:\s*Infinity\s*\}\}/g, 'transition={loop(tweens.glacial)}', true, false],

  // ── Looping with repeatDelay ──
  [/transition=\{\{\s*duration:\s*1,\s*repeat:\s*Infinity,\s*repeatDelay:\s*1\s*\}\}/g, 'transition={loopWithDelay(tweens.slow, 1)}', false, true],

  // ── Duration + delay combos ──
  [/transition=\{\{\s*duration:\s*0\.3,\s*delay:\s*0\.2\s*\}\}/g, 'transition={{ ...tweens.standard, delay: 0.2 }}', false, false],
  [/transition=\{\{\s*duration:\s*0\.4,\s*delay:\s*0\.1\s*\}\}/g, 'transition={{ ...tweens.moderate, delay: 0.1 }}', false, false],
  [/transition=\{\{\s*duration:\s*0\.5,\s*delay:\s*0\.2\s*\}\}/g, 'transition={{ ...tweens.smooth, delay: 0.2 }}', false, false],
  [/transition=\{\{\s*duration:\s*3,\s*repeat:\s*Infinity,\s*delay:\s*0\.5\s*\}\}/g, 'transition={{ ...loop(tweens.decorative), delay: 0.5 }}', true, false],
];

// ============================================================================
// 2. Find all target TSX files
// ============================================================================
const files = execSync(
  `find apps/web/src -name '*.tsx' | grep -v node_modules | grep -v __tests__ | grep -v '.test.'`,
  { cwd: process.cwd(), encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

// ============================================================================
// 3. Process each file
// ============================================================================
let totalReplacements = 0;
let filesModified = 0;

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf8');
  const original = content;
  let fileReplacements = 0;
  let needsLoop = false;
  let needsLoopWithDelay = false;
  let needsTweens = false;

  for (const [pattern, replacement, requiresLoop, requiresLoopDelay] of REPLACEMENTS) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      fileReplacements += matches.length;
      if (replacement.includes('tweens.')) needsTweens = true;
      if (requiresLoop) needsLoop = true;
      if (requiresLoopDelay) needsLoopWithDelay = true;
    }
  }

  if (fileReplacements > 0) {
    // Add imports if needed
    const imports = [];
    if (needsTweens) imports.push('tweens');
    if (needsLoop) imports.push('loop');
    if (needsLoopWithDelay) imports.push('loopWithDelay');

    if (imports.length > 0) {
      const importStr = imports.join(', ');
      const presetImportPath = '@/lib/animation-presets';

      // Check if already importing from animation-presets
      const existingImport = content.match(
        /import\s*\{([^}]*)\}\s*from\s*['"]@\/lib\/animation-presets['"]/
      );

      if (existingImport) {
        // Merge new imports into existing import statement
        const existingNames = existingImport[1].split(',').map(s => s.trim()).filter(Boolean);
        const allNames = [...new Set([...existingNames, ...imports])];
        content = content.replace(
          existingImport[0],
          `import { ${allNames.join(', ')} } from '${presetImportPath}'`
        );
      } else {
        // Add new import after last import statement
        const lastImportIdx = content.lastIndexOf('\nimport ');
        if (lastImportIdx !== -1) {
          const lineEnd = content.indexOf('\n', lastImportIdx + 1);
          // Find the actual end of this import (might be multi-line)
          let importEnd = lineEnd;
          // Handle multi-line imports
          const afterImport = content.substring(lastImportIdx + 1);
          const singleLineMatch = afterImport.match(/^import[^;]+;/);
          if (singleLineMatch) {
            importEnd = lastImportIdx + 1 + singleLineMatch[0].length;
          }
          content =
            content.substring(0, importEnd) +
            `\nimport { ${importStr} } from '${presetImportPath}';` +
            content.substring(importEnd);
        } else {
          // No imports found, add at top after any comments/JSDoc
          const firstNonComment = content.search(/^(?!\s*\/\/|\/\*|\*| \*)/m);
          const insertAt = firstNonComment > 0 ? firstNonComment : 0;
          content =
            content.substring(0, insertAt) +
            `import { ${importStr} } from '${presetImportPath}';\n` +
            content.substring(insertAt);
        }
      }
    }

    totalReplacements += fileReplacements;
    filesModified++;

    if (DRY_RUN) {
      console.log(`[DRY RUN] ${filePath}: ${fileReplacements} replacements`);
    } else {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✓ ${filePath}: ${fileReplacements} replacements`);
    }
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Done: ${totalReplacements} replacements across ${filesModified} files`);

// Report remaining inline transitions that weren't handled
const remaining = execSync(
  `grep -rn 'transition={{.*duration:' apps/web/src/ --include='*.tsx' | grep -v node_modules | grep -v __tests__ | grep -v '.test.' | wc -l`,
  { encoding: 'utf8' }
).trim();
console.log(`Remaining inline transitions: ${remaining}`);
