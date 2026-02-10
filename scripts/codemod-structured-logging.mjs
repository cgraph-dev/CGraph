#!/usr/bin/env node
/**
 * Codemod: Convert Elixir Logger interpolation to structured keyword format.
 *
 * Converts:
 *   Logger.info("Starting process #{pid} for #{user_id}")
 * To:
 *   Logger.info("starting_process", pid: pid, user_id: user_id)
 *
 * Strategy:
 *   1. Find all Logger.{info|warn|error|debug}("...#{...}...") calls
 *   2. Extract interpolated expressions
 *   3. Generate a snake_case event name from the static text
 *   4. Build keyword list from interpolated variables
 *   5. Handle multi-line Logger calls
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Get all files with violations
const grepResult = execSync(
  `grep -rl -E 'Logger\\.(info|warn|error|debug)\\(".*#\\{' apps/backend/lib/ --include='*.ex' | grep -v 'test/'`,
  { encoding: 'utf-8', cwd: process.cwd() }
).trim();

const files = grepResult.split('\n').filter(Boolean);
console.log(`Found ${files.length} files to process\n`);

let totalFixes = 0;
let filesFixed = 0;

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;
  let fixes = 0;

  // Match Logger calls with interpolation - handles single and multi-line
  // Pattern: Logger.level("string with #{expr}")
  const loggerPattern = /Logger\.(info|warn|error|debug)\("([^"]*#\{[^"]*?)"\)/g;

  content = content.replace(loggerPattern, (match, level, msgBody) => {
    // Extract all interpolated expressions #{...}
    const interpolations = [];
    const interpRegex = /#\{([^}]+)\}/g;
    let im;
    while ((im = interpRegex.exec(msgBody)) !== null) {
      interpolations.push(im[1].trim());
    }

    if (interpolations.length === 0) return match; // No interpolations found

    // Generate event name from static text
    const staticText = msgBody
      .replace(/#\{[^}]+\}/g, '') // Remove interpolations
      .replace(/[^a-zA-Z0-9\s]/g, ' ') // Remove special chars
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_') // Spaces to underscores
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, ''); // Trim leading/trailing underscores

    // Keep event name short and meaningful
    const eventName = staticText.substring(0, 50);

    if (!eventName) {
      // If no static text, generate from first interpolated var
      const fallbackName = interpolations[0]
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase()
        .substring(0, 30);
      // Build keyword args
      const kwargs = interpolations.map(expr => {
        const key = exprToKey(expr);
        return `${key}: ${wrapExpr(expr)}`;
      }).join(', ');
      fixes++;
      return `Logger.${level}("${fallbackName}", ${kwargs})`;
    }

    // Build keyword args
    const kwargs = interpolations.map(expr => {
      const key = exprToKey(expr);
      return `${key}: ${wrapExpr(expr)}`;
    }).join(', ');

    fixes++;
    return `Logger.${level}("${eventName}", ${kwargs})`;
  });

  if (fixes > 0) {
    writeFileSync(filePath, content, 'utf-8');
    totalFixes += fixes;
    filesFixed++;
    console.log(`  ✓ ${filePath} — ${fixes} fix(es)`);
  }
}

console.log(`\nDone: ${totalFixes} fixes across ${filesFixed} files`);

/**
 * Convert an interpolated expression to a keyword key.
 * e.g., "user.id" → "user_id", "inspect(data)" → "data",
 *        "length(items)" → "items_count"
 */
function exprToKey(expr) {
  // Handle inspect(x) → x
  let e = expr.replace(/^inspect\(([^)]+)\)$/, '$1');
  // Handle length(x) → x_count
  if (/^length\(/.test(expr)) {
    e = expr.replace(/^length\(([^)]+)\)$/, '$1') + '_count';
  }
  // Handle map_size(x) → x_count
  if (/^map_size\(/.test(expr)) {
    e = expr.replace(/^map_size\(([^)]+)\)$/, '$1') + '_count';
  }
  // Handle Enum.count(x) → x_count
  if (/^Enum\.count\(/.test(expr)) {
    e = expr.replace(/^Enum\.count\(([^)]+)\)$/, '$1') + '_count';
  }
  // Handle function calls: Module.func(x) → func_result or x
  if (/^\w+\.\w+\(/.test(e)) {
    // Try to extract the argument
    const argMatch = e.match(/\w+\.(\w+)\(([^)]*)\)/);
    if (argMatch) {
      e = argMatch[2] || argMatch[1];
    }
  }
  // Convert dots and special chars to underscores
  e = e
    .replace(/\./g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();

  // If empty after processing, use generic name
  return e || 'value';
}

/**
 * Wrap expression if it's a complex expression that needs inspect().
 * Simple vars and function calls don't need wrapping.
 */
function wrapExpr(expr) {
  // Already has inspect? Leave it
  if (expr.startsWith('inspect(')) return expr;
  // Simple variable access: user_id, state.count, etc.
  if (/^[\w.]+$/.test(expr)) return expr;
  // Function calls like length(x), Enum.count(x) — use inspect
  if (/^\w+[\.(]/.test(expr)) return `inspect(${expr})`;
  // Map/struct access pattern
  if (/\[/.test(expr)) return `inspect(${expr})`;
  // Arithmetic or complex expression
  return `inspect(${expr})`;
}
