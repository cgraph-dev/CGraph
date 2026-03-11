#!/usr/bin/env node
/**
 * Codemod: Replace inline spring transitions with preset imports.
 *
 * Strategy:
 * 1. Find all inline `type: 'spring'` usages in apps/web/src
 * 2. Map stiffness/damping pairs to the closest named preset
 * 3. Replace the inline object with a spread of the preset + any extra props (delay, mass, duration)
 * 4. Add `import { springs } from '@/lib/animation-presets/presets'` if missing
 *
 * Excluded files:
 * - animation-presets/ (these ARE the presets)
 * - animationPresets.ts (barrel re-export)
 * - landing/animations.ts (local duplicates, separate concern)
 * - __tests__/ directories
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, relative } from 'path';

const WEB_SRC = resolve('apps/web/src');

// The FM spring presets (stiffness, damping) from toFMSpring in presets.ts
// which drops mass. These are the ACTUAL runtime values.
const PRESETS = {
  gentle:      { stiffness: 120, damping: 14 },
  default:     { stiffness: 170, damping: 26 },
  bouncy:      { stiffness: 300, damping: 10 },
  snappy:      { stiffness: 400, damping: 30 },
  superBouncy: { stiffness: 500, damping: 8 },
  dramatic:    { stiffness: 200, damping: 20 },
  wobbly:      { stiffness: 180, damping: 12 },
  stiff:       { stiffness: 300, damping: 30 },
  smooth:      { stiffness: 150, damping: 20 },
  ultraSmooth: { stiffness: 100, damping: 18 },
};

function findClosestPreset(stiffness, damping) {
  // Default FM damping when not specified is ~10
  if (damping === undefined) damping = 10;
  
  let bestName = 'default';
  let bestDist = Infinity;
  
  for (const [name, preset] of Object.entries(PRESETS)) {
    // Weighted Euclidean distance — stiffness matters more
    const ds = (stiffness - preset.stiffness) / 100;
    const dd = (damping - preset.damping) / 10;
    const dist = Math.sqrt(ds * ds + dd * dd);
    if (dist < bestDist) {
      bestDist = dist;
      bestName = name;
    }
  }
  
  return bestName;
}

// Files to exclude
const EXCLUDE_PATTERNS = [
  'animation-presets/',
  'animationPresets.ts',
  'landing/animations.ts',
  '__tests__/',
  '.test.',
  '.spec.',
];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(p => filePath.includes(p));
}

// Find all files with inline springs
const grepResult = execSync(
  `grep -rl "type: 'spring'" apps/web/src/ --include='*.tsx' --include='*.ts' || true`,
  { encoding: 'utf-8', cwd: resolve('.') }
).trim();

const files = grepResult.split('\n').filter(f => f && !shouldExclude(f));

console.log(`Found ${files.length} files to process\n`);

let totalReplacements = 0;
let filesModified = 0;

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let replacements = 0;
  
  // Pattern 1: JSX transition prop - transition={{ type: 'spring', stiffness: N, damping: M }}
  // Pattern 2: Object literal - transition: { type: 'spring', stiffness: N, damping: M },
  // Pattern 3: With extra props like delay, mass, duration
  
  // Unified regex to match inline spring objects
  // Matches both {{ }} (JSX) and { } (object literal) contexts
  const springRegex = /\{[\s]*type:\s*['"]spring['"](?:\s*as\s*const)?[\s]*,[\s]*([^}]*?)\}/g;
  
  let match;
  const replacementsList = [];
  
  while ((match = springRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const propsStr = match[1];
    
    // Parse the properties
    const stiffnessMatch = propsStr.match(/stiffness:\s*(\d+)/);
    const dampingMatch = propsStr.match(/damping:\s*(\d+)/);
    const delayMatch = propsStr.match(/delay:\s*([\d.]+)/);
    const massMatch = propsStr.match(/mass:\s*([\d.]+)/);
    const durationMatch = propsStr.match(/duration:\s*([\d.]+)/);
    const bounceMatch = propsStr.match(/bounce:\s*([\d.]+)/);
    
    if (!stiffnessMatch && !bounceMatch) continue; // Can't map without stiffness or bounce
    
    const stiffness = stiffnessMatch ? parseInt(stiffnessMatch[1]) : 300;
    const damping = dampingMatch ? parseInt(dampingMatch[1]) : undefined;
    
    const presetName = findClosestPreset(stiffness, damping);
    
    // Build extra props that should be preserved
    const extras = [];
    if (delayMatch) extras.push(`delay: ${delayMatch[1]}`);
    if (massMatch) extras.push(`mass: ${massMatch[1]}`);
    if (durationMatch) extras.push(`duration: ${durationMatch[1]}`);
    
    let replacement;
    if (extras.length > 0) {
      replacement = `{ ...springs.${presetName}, ${extras.join(', ')} }`;
    } else {
      replacement = `springs.${presetName}`;
    }
    
    replacementsList.push({ original: fullMatch, replacement, index: match.index });
  }
  
  // Also handle: transition={{ type: 'spring' }} (bare, no stiffness)
  const bareSpringJSX = /\{\{[\s]*type:\s*['"]spring['"][\s]*\}\}/g;
  while ((match = bareSpringJSX.exec(content)) !== null) {
    replacementsList.push({ original: match[0], replacement: '{springs.default}', index: match.index });
  }
  
  // Apply replacements in reverse order to preserve indices
  replacementsList.sort((a, b) => b.index - a.index);
  
  for (const { original, replacement } of replacementsList) {
    content = content.replace(original, replacement);
    replacements++;
  }
  
  // Also handle the transition={{ ... }} wrapper pattern:
  // transition={springs.default} needs to stay as is
  // transition={{ ...springs.default, delay: 0.2 }} needs {{ }}
  
  if (replacements > 0) {
    // Fix double-braces: transition={{ springs.default }} → transition={springs.default}
    content = content.replace(/\{\{[\s]*(springs\.\w+)[\s]*\}\}/g, '{$1}');
    
    // Add import if not present
    const hasPresetsImport = content.includes("from '@/lib/animation-presets/presets'") || 
                              content.includes("from '@/lib/animation-presets'");
    
    if (!hasPresetsImport) {
      // Find the last import line
      const lines = content.split('\n');
      let lastImportLine = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') || lines[i].match(/^} from /)) {
          lastImportLine = i;
        }
        // Stop after finding a non-import, non-empty, non-comment line after imports
        if (lastImportLine >= 0 && !lines[i].startsWith('import ') && !lines[i].match(/^}/) && 
            !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('*') &&
            lines[i].trim() !== '' && !lines[i].includes(' from ')) {
          break;
        }
      }
      
      if (lastImportLine >= 0) {
        // Check if springs is already imported from animation-presets
        if (!content.includes("import { springs") && !content.includes("springs }")) {
          lines.splice(lastImportLine + 1, 0, "import { springs } from '@/lib/animation-presets/presets';");
          content = lines.join('\n');
        }
      }
    }
    
    // Check if springs import already exists but from different source
    // If importing springs from @/lib/animation-presets, that's also fine
    
    writeFileSync(filePath, content, 'utf-8');
    totalReplacements += replacements;
    filesModified++;
    console.log(`  ✓ ${filePath} — ${replacements} replacement(s)`);
  }
}

console.log(`\nDone: ${totalReplacements} replacements across ${filesModified} files`);
