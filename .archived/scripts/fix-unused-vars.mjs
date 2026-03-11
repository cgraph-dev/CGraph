#!/usr/bin/env node
/**
 * @fileoverview Codemod to fix @typescript-eslint/no-unused-vars warnings.
 * Runs eslint in JSON mode, then for each warning:
 * - Removes unused imports
 * - Prefixes unused parameters/variables with _
 * - Removes unused variable declarations
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const targetDir = process.argv[2] || 'apps/mobile/src';

console.log(`Scanning ${targetDir} for no-unused-vars warnings...`);

// Run eslint with JSON output
const eslintOutput = execSync(
  `cd /CGraph && npx eslint "${targetDir}" --format json 2>/dev/null || true`,
  { maxBuffer: 50 * 1024 * 1024, encoding: 'utf8' }
);

const results = JSON.parse(eslintOutput);
let totalFixed = 0;
let totalSkipped = 0;

for (const fileResult of results) {
  const unusedWarnings = fileResult.messages.filter(
    (m) => m.ruleId === '@typescript-eslint/no-unused-vars'
  );
  if (unusedWarnings.length === 0) continue;

  const filePath = fileResult.filePath;
  let lines = readFileSync(filePath, 'utf8').split('\n');
  let modified = false;

  // Process warnings in reverse line order to avoid offset issues
  const sorted = [...unusedWarnings].sort((a, b) => b.line - a.line || b.column - a.column);

  for (const warning of sorted) {
    const { line, column, message } = warning;
    const lineIdx = line - 1;
    const lineText = lines[lineIdx];
    if (!lineText) continue;

    // Extract the variable name from the message
    const nameMatch = message.match(/^'(\w+)'/);
    if (!nameMatch) continue;
    const varName = nameMatch[1];

    // Determine the type of unused variable
    const isImportDefined = message.includes('is defined but never used');
    const isAssigned = message.includes('is assigned a value but never used');
    const isParam = message.includes('Allowed unused args must match');
    const isCatch = message.includes('Allowed unused caught errors must match');

    if (isCatch) {
      // Prefix catch variable with _
      const newLine = lineText.replace(
        new RegExp(`\\bcatch\\s*\\(\\s*${varName}\\b`),
        `catch (_${varName}`
      );
      if (newLine !== lineText) {
        lines[lineIdx] = newLine;
        modified = true;
        totalFixed++;
      } else {
        // Try simple replacement
        const newLine2 = lineText.replace(
          new RegExp(`\\b${varName}\\b`),
          `_${varName}`
        );
        if (newLine2 !== lineText) {
          lines[lineIdx] = newLine2;
          modified = true;
          totalFixed++;
        } else {
          totalSkipped++;
        }
      }
      continue;
    }

    if (isImportDefined && lineText.includes('import')) {
      // It's an unused import — try to remove just this name
      const result = removeImportName(lines, lineIdx, varName);
      if (result) {
        lines = result;
        modified = true;
        totalFixed++;
      } else {
        totalSkipped++;
      }
      continue;
    }

    if (isParam || (isImportDefined && !lineText.includes('import'))) {
      // It's a function parameter or destructured prop — prefix with _
      // But check if we're in a function signature or destructuring
      const col = column - 1;
      // Make sure we're replacing the right occurrence
      const before = lineText.substring(0, col);
      const after = lineText.substring(col);

      if (after.startsWith(varName)) {
        lines[lineIdx] = before + '_' + after;
        modified = true;
        totalFixed++;
      } else {
        // Fallback: replace first occurrence of the word
        const newLine = lineText.replace(
          new RegExp(`\\b${varName}\\b`),
          `_${varName}`
        );
        if (newLine !== lineText) {
          lines[lineIdx] = newLine;
          modified = true;
          totalFixed++;
        } else {
          totalSkipped++;
        }
      }
      continue;
    }

    if (isAssigned) {
      // It's an assigned but unused variable
      // Check if it's in a destructuring pattern
      if (lineText.includes('{') || lineText.includes('[')) {
        // Destructured — prefix with _
        const col = column - 1;
        const before = lineText.substring(0, col);
        const after = lineText.substring(col);
        if (after.startsWith(varName)) {
          lines[lineIdx] = before + '_' + after;
          modified = true;
          totalFixed++;
        } else {
          const newLine = lineText.replace(
            new RegExp(`\\b${varName}\\b(?!\\s*[:(])`),
            `_${varName}`
          );
          if (newLine !== lineText) {
            lines[lineIdx] = newLine;
            modified = true;
            totalFixed++;
          } else {
            totalSkipped++;
          }
        }
      } else {
        // Simple variable — prefix with _
        const col = column - 1;
        const before = lineText.substring(0, col);
        const after = lineText.substring(col);
        if (after.startsWith(varName)) {
          lines[lineIdx] = before + '_' + after;
          modified = true;
          totalFixed++;
        } else {
          totalSkipped++;
        }
      }
      continue;
    }

    // Fallback for "defined but never used" that isn't clearly an import
    if (isImportDefined) {
      // Check if this is actually on an import line (maybe multi-line)
      // Look backwards for import keyword
      let isInImport = false;
      for (let i = lineIdx; i >= Math.max(0, lineIdx - 5); i--) {
        if (lines[i].includes('import ')) {
          isInImport = true;
          break;
        }
      }
      if (isInImport) {
        const result = removeImportNameMultiLine(lines, lineIdx, varName);
        if (result) {
          lines = result;
          modified = true;
          totalFixed++;
          continue;
        }
      }
      // Prefix with _
      const col = column - 1;
      const before = lineText.substring(0, col);
      const after = lineText.substring(col);
      if (after.startsWith(varName)) {
        lines[lineIdx] = before + '_' + after;
        modified = true;
        totalFixed++;
      } else {
        totalSkipped++;
      }
    }
  }

  if (modified) {
    writeFileSync(filePath, lines.join('\n'));
  }
}

console.log(`Fixed: ${totalFixed}, Skipped: ${totalSkipped}`);

/**
 * Remove a single import name from an import statement.
 */
function removeImportName(lines, lineIdx, varName) {
  const line = lines[lineIdx];

  // Check if this is a multi-line import
  if (line.includes('import') && !line.includes('from')) {
    return removeImportNameMultiLine(lines, lineIdx, varName);
  }

  // Single-line import patterns:
  // import { A, B, C } from 'module'
  // import A from 'module'
  // import { type A, B } from 'module'

  // Default import
  const defaultMatch = line.match(/^import\s+(\w+)\s+from/);
  if (defaultMatch && defaultMatch[1] === varName) {
    // Remove the entire import line
    const newLines = [...lines];
    newLines.splice(lineIdx, 1);
    return newLines;
  }

  // Named import — remove just this name
  // Pattern: { ..., varName, ... } or { type varName, ... }
  const newLine = line
    .replace(new RegExp(`\\btype\\s+${varName}\\s*,\\s*`), '')
    .replace(new RegExp(`\\b${varName}\\s*,\\s*`), '')
    .replace(new RegExp(`,\\s*type\\s+${varName}\\b`), '')
    .replace(new RegExp(`,\\s*${varName}\\b`), '')
    .replace(new RegExp(`\\btype\\s+${varName}\\b`), '')
    .replace(new RegExp(`\\b${varName}\\b(?!['"])`), '');

  // Check if the import is now empty: import {  } from ...
  if (newLine.match(/import\s*{\s*}\s*from/)) {
    const newLines = [...lines];
    newLines.splice(lineIdx, 1);
    return newLines;
  }

  // Clean up double commas or leading/trailing commas in braces
  const cleaned = newLine
    .replace(/{\s*,/, '{')
    .replace(/,\s*}/, ' }')
    .replace(/,\s*,/g, ',')
    .replace(/{\s+}/, '{ }');

  if (cleaned !== line) {
    const newLines = [...lines];
    newLines[lineIdx] = cleaned;
    return newLines;
  }
  return null;
}

/**
 * Remove a name from a multi-line import.
 */
function removeImportNameMultiLine(lines, lineIdx, varName) {
  const lineText = lines[lineIdx];
  const newLines = [...lines];

  // Check if this line has just the variable name (possibly with comma/type)
  const trimmed = lineText.trim();
  if (trimmed === `${varName},` || trimmed === varName || trimmed === `type ${varName},` || trimmed === `type ${varName}`) {
    // Remove the entire line
    newLines.splice(lineIdx, 1);
    return newLines;
  }

  // Otherwise, try to remove just the name from this line
  const cleaned = lineText
    .replace(new RegExp(`\\btype\\s+${varName}\\s*,?\\s*`), '')
    .replace(new RegExp(`\\b${varName}\\s*,\\s*`), '')
    .replace(new RegExp(`,\\s*${varName}\\b`), '')
    .replace(new RegExp(`\\b${varName}\\b`), '');

  if (cleaned.trim() === '' || cleaned.trim() === ',') {
    newLines.splice(lineIdx, 1);
    return newLines;
  }

  if (cleaned !== lineText) {
    newLines[lineIdx] = cleaned;
    return newLines;
  }

  return null;
}
