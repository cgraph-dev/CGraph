/**
 * Merge duplicate imports in files flagged by ESLint no-duplicate-imports.
 * @description Merges duplicate import statements from the same module
 */

import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('/tmp/mobile-dup.json', 'utf8'));

let filesFixed = 0;

for (const result of data) {
  const errors = result.messages.filter(
    (m) => m.severity === 2 && m.ruleId === 'no-duplicate-imports'
  );
  if (!errors.length) continue;

  let content = readFileSync(result.filePath, 'utf8');
  const lines = content.split('\n');

  // Parse all import statements
  /** @type {Map<string, { indices: number[], specifiers: Set<string>, defaultImport: string|null, hasType: boolean }>} */
  const importMap = new Map();
  const importRegex =
    /^import\s+(?:(type)\s+)?(?:({[^}]+})|(\w+)(?:\s*,\s*({[^}]+}))?)?\s*(?:from\s+)?['"]([^'"]+)['"]\s*;?\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('import ')) continue;

    // Match: import { A, B } from 'mod'
    // Match: import Default from 'mod'
    // Match: import Default, { A, B } from 'mod'
    // Match: import type { A } from 'mod'
    const m = line.match(importRegex);
    if (!m) continue;

    const [, typeKw, namedGroup, defaultName, namedAfterDefault, source] = m;
    if (!source) continue;

    if (!importMap.has(source)) {
      importMap.set(source, {
        indices: [],
        specifiers: new Set(),
        defaultImport: null,
        hasType: false,
      });
    }

    const entry = importMap.get(source);
    entry.indices.push(i);
    if (typeKw) entry.hasType = true;

    if (defaultName) entry.defaultImport = defaultName;

    const namedStr = namedGroup || namedAfterDefault;
    if (namedStr) {
      const names = namedStr
        .replace(/[{}]/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      names.forEach((n) => entry.specifiers.add(n));
    }
  }

  let changed = false;
  // Process modules with duplicates (2+ import lines)
  // Work in reverse to preserve line numbers
  const duplicates = [...importMap.entries()]
    .filter(([, v]) => v.indices.length > 1)
    .sort((a, b) => b[1].indices[0] - a[1].indices[0]);

  for (const [source, entry] of duplicates) {
    // Build merged import
    const parts = [];
    if (entry.defaultImport) parts.push(entry.defaultImport);
    if (entry.specifiers.size) {
      const named = [...entry.specifiers].sort().join(', ');
      if (entry.defaultImport) {
        parts.push(`{ ${named} }`);
      } else {
        parts.push(`{ ${named} }`);
      }
    }

    let merged;
    if (entry.defaultImport && entry.specifiers.size) {
      merged = `import ${entry.defaultImport}, { ${[...entry.specifiers].sort().join(', ')} } from '${source}';`;
    } else if (entry.defaultImport) {
      merged = `import ${entry.defaultImport} from '${source}';`;
    } else if (entry.specifiers.size) {
      const typePrefix = entry.hasType ? 'type ' : '';
      merged = `import ${typePrefix}{ ${[...entry.specifiers].sort().join(', ')} } from '${source}';`;
    } else {
      merged = `import '${source}';`;
    }

    // Replace first import with merged, delete the rest
    const sorted = [...entry.indices].sort((a, b) => b - a);
    // Delete all but first (in reverse order to preserve indices)
    for (let k = 0; k < sorted.length - 1; k++) {
      lines.splice(sorted[k], 1);
    }
    // Replace the first (lowest index)
    const firstIdx = Math.min(...entry.indices);
    lines[firstIdx] = merged;
    changed = true;
  }

  if (changed) {
    writeFileSync(result.filePath, lines.join('\n'));
    filesFixed++;
  }
}

console.log(`Merged duplicate imports in ${filesFixed} files`);
