#!/usr/bin/env node
/**
 * Codemod: Rename PascalCase files to kebab-case and update all imports.
 *
 * Usage:
 *   node scripts/rename-to-kebab.mjs [--dry-run] [--dir apps/web/src]
 *
 * What it does:
 *   1. Finds all PascalCase .ts/.tsx files in the target directories
 *   2. Converts filenames to kebab-case (e.g., MessageBubble.tsx → message-bubble.tsx)
 *   3. Uses `git mv` to rename files (preserving git history)
 *   4. Updates all import/export paths in .ts/.tsx/.js/.jsx files
 *
 * Exclusions:
 *   - node_modules, dist, build, .docusaurus, coverage
 *   - App.tsx (React Native entry point — must stay PascalCase)
 *   - Files starting with underscore
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename, dirname, join, relative, extname } from 'path';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const dirArg = args.find(a => !a.startsWith('--'));

// Directories to process
const TARGET_DIRS = dirArg ? [dirArg] : ['apps/web/src', 'apps/mobile/src'];

// Files to exclude from renaming (must stay PascalCase)
const EXCLUDE_FILES = new Set([
  'App.tsx',
  'App.ts',
  'App.test.tsx',
]);

// Directories to skip entirely
const SKIP_DIRS = ['node_modules', 'dist', 'build', '.docusaurus', 'coverage', '__mocks__'];

/** Convert PascalCase/CamelCase filename to kebab-case */
function toKebabCase(name) {
  return name
    // Insert hyphen before uppercase letters that follow lowercase letters
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // Insert hyphen before uppercase letters that are followed by lowercase, after other uppercase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    // Lowercase everything
    .toLowerCase();
}

/** Check if filename starts with uppercase (PascalCase) */
function isPascalCase(filename) {
  return /^[A-Z]/.test(filename);
}

/** Get all .ts/.tsx files in a directory recursively */
function getAllFiles(dir) {
  const result = execSync(
    `find ${dir} -type f \\( -name '*.ts' -o -name '*.tsx' \\) | grep -v node_modules | grep -v '/dist/' | grep -v '/build/' | grep -v '/.docusaurus/' | grep -v '/coverage/'`,
    { encoding: 'utf-8' }
  ).trim();
  return result ? result.split('\n') : [];
}

/** Get all source files that might contain imports (wider search) */
function getAllSourceFiles() {
  const result = execSync(
    `find apps/web/src apps/mobile/src packages -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \\) | grep -v node_modules | grep -v '/dist/' | grep -v '/build/' | grep -v '/coverage/'`,
    { encoding: 'utf-8' }
  ).trim();
  return result ? result.split('\n') : [];
}

// Step 1: Find all PascalCase files and compute renames
console.log('📁 Scanning for PascalCase files...');
const renames = []; // { oldPath, newPath, oldBase, newBase }

for (const dir of TARGET_DIRS) {
  const files = getAllFiles(dir);
  for (const filePath of files) {
    const base = basename(filePath);
    const ext = extname(base);
    const nameWithoutExt = base.slice(0, -ext.length);

    if (!isPascalCase(nameWithoutExt)) continue;
    if (EXCLUDE_FILES.has(base)) continue;
    if (SKIP_DIRS.some(d => filePath.includes(`/${d}/`))) continue;

    const kebabName = toKebabCase(nameWithoutExt) + ext;

    // Skip if already kebab-case (edge case: single word like "App.tsx")
    if (kebabName === base) continue;

    const newPath = join(dirname(filePath), kebabName);
    renames.push({
      oldPath: filePath,
      newPath,
      oldBase: nameWithoutExt,
      newBase: toKebabCase(nameWithoutExt),
      ext,
    });
  }
}

console.log(`Found ${renames.length} files to rename.`);

if (renames.length === 0) {
  console.log('Nothing to do!');
  process.exit(0);
}

// Step 2: Build a lookup map from old basename (without ext) to new basename
// We need to handle imports which might reference files with or without extension
const renameMap = new Map(); // oldBasenameNoExt -> newBasenameNoExt
const pathRenameMap = new Map(); // oldFullPath -> newFullPath

for (const r of renames) {
  // Map basename without extension
  if (!renameMap.has(r.oldBase)) {
    renameMap.set(r.oldBase, r.newBase);
  }
  pathRenameMap.set(r.oldPath, r.newPath);
}

// Step 3: Update all imports in all source files
console.log('🔄 Updating imports...');
const allSourceFiles = getAllSourceFiles();
let filesUpdated = 0;
let importsUpdated = 0;

for (const sourceFile of allSourceFiles) {
  let content;
  try {
    content = readFileSync(sourceFile, 'utf-8');
  } catch {
    continue;
  }

  let newContent = content;

  // Match import/export/require statements with paths
  // Patterns:
  //   import ... from 'path/PascalCase'
  //   import ... from './PascalCase'
  //   import ... from '@/path/PascalCase'
  //   export ... from 'path/PascalCase'
  //   require('path/PascalCase')
  //   import('path/PascalCase')

  // Replace PascalCase segments in import paths
  newContent = newContent.replace(
    /((?:import|export)\s+(?:(?:type\s+)?(?:\{[^}]*\}|[^;'"]*)\s+from\s+|)['"])([^'"]+)(['"])/g,
    (match, prefix, importPath, suffix) => {
      const newPath = transformImportPath(importPath, sourceFile);
      if (newPath !== importPath) {
        importsUpdated++;
        return prefix + newPath + suffix;
      }
      return match;
    }
  );

  // Also handle re-export patterns like: export { X } from './PascalCase'
  // and dynamic imports: import('./PascalCase')
  newContent = newContent.replace(
    /(import\(['"])([^'"]+)(['"]\))/g,
    (match, prefix, importPath, suffix) => {
      const newPath = transformImportPath(importPath, sourceFile);
      if (newPath !== importPath) {
        importsUpdated++;
        return prefix + newPath + suffix;
      }
      return match;
    }
  );

  // Handle require() calls
  newContent = newContent.replace(
    /(require\(['"])([^'"]+)(['"]\))/g,
    (match, prefix, importPath, suffix) => {
      const newPath = transformImportPath(importPath, sourceFile);
      if (newPath !== importPath) {
        importsUpdated++;
        return prefix + newPath + suffix;
      }
      return match;
    }
  );

  if (newContent !== content) {
    filesUpdated++;
    if (!DRY_RUN) {
      writeFileSync(sourceFile, newContent, 'utf-8');
    } else {
      console.log(`  Would update: ${sourceFile}`);
    }
  }
}

console.log(`Updated ${importsUpdated} imports across ${filesUpdated} files.`);

// Step 4: Rename the actual files using git mv
console.log(`📦 Renaming ${renames.length} files...`);
let renamed = 0;
let errors = 0;

for (const r of renames) {
  if (DRY_RUN) {
    console.log(`  Would rename: ${r.oldPath} → ${r.newPath}`);
    renamed++;
    continue;
  }

  try {
    // Check if old file still exists (might have been renamed by prior iteration)
    if (!existsSync(r.oldPath)) {
      // Check if new path already exists (already renamed)
      if (existsSync(r.newPath)) continue;
      console.warn(`  ⚠ Missing: ${r.oldPath}`);
      errors++;
      continue;
    }

    // Use git mv for proper tracking
    execSync(`git mv "${r.oldPath}" "${r.newPath}"`, { stdio: 'pipe' });
    renamed++;
  } catch (e) {
    // Fallback: try regular rename (case-insensitive filesystem workaround)
    try {
      const tmpPath = r.oldPath + '.tmp-rename';
      execSync(`git mv "${r.oldPath}" "${tmpPath}"`, { stdio: 'pipe' });
      execSync(`git mv "${tmpPath}" "${r.newPath}"`, { stdio: 'pipe' });
      renamed++;
    } catch (e2) {
      console.error(`  ❌ Failed: ${r.oldPath} → ${r.newPath}: ${e2.message}`);
      errors++;
    }
  }
}

console.log(`\n✅ Done!`);
console.log(`   Renamed: ${renamed} files`);
console.log(`   Imports updated: ${importsUpdated}`);
console.log(`   Files touched: ${filesUpdated}`);
if (errors > 0) console.log(`   Errors: ${errors}`);
if (DRY_RUN) console.log(`   (DRY RUN — no changes made)`);

// ─── Helper ───

/**
 * Transform an import path by replacing PascalCase segments with kebab-case.
 * Only transforms the *last* segment (the filename), not directory names.
 */
function transformImportPath(importPath, sourceFile) {
  // Don't touch package imports (no ./ or @/ prefix)
  if (!importPath.startsWith('.') && !importPath.startsWith('@/') && !importPath.startsWith('@features/') && !importPath.startsWith('@components/') && !importPath.startsWith('@hooks/') && !importPath.startsWith('@stores/')) {
    return importPath;
  }

  // Split path into segments
  const parts = importPath.split('/');
  const lastPart = parts[parts.length - 1];

  // Check if last segment is a PascalCase name (with or without extension)
  const ext = extname(lastPart);
  const nameNoExt = ext ? lastPart.slice(0, -ext.length) : lastPart;

  if (isPascalCase(nameNoExt) && renameMap.has(nameNoExt)) {
    const newName = renameMap.get(nameNoExt);
    parts[parts.length - 1] = ext ? newName + ext : newName;
    return parts.join('/');
  }

  return importPath;
}
