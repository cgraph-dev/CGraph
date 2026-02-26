#!/usr/bin/env node
/**
 * Automated JSDoc annotation script.
 *
 * Reads ESLint jsdoc/require-jsdoc and jsdoc/require-description violations,
 * then inserts appropriate JSDoc comments above the offending declarations.
 *
 * Usage: node scripts/add-jsdoc.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { basename, dirname } from 'path';
import { execSync } from 'child_process';

const WEB_SRC = 'apps/web/src';

// Read pre-generated ESLint JSON output
console.log('Reading ESLint violations from /tmp/eslint-output.json...');
const eslintJsonPath = '/tmp/eslint-output.json';
const raw = readFileSync(eslintJsonPath, 'utf8');
const eslintResults = JSON.parse(raw);

let totalFixed = 0;
let totalFiles = 0;

for (const result of eslintResults) {
  const jsdocMsgs = result.messages.filter(
    (m) => m.ruleId === 'jsdoc/require-jsdoc' || m.ruleId === 'jsdoc/require-description'
  );
  if (jsdocMsgs.length === 0) continue;

  const filePath = result.filePath;
  const relPath = filePath.replace(/.*apps\/web\/src\//, '');
  let lines = readFileSync(filePath, 'utf8').split('\n');
  
  // Sort violations by line number descending so we can insert without shifting indices
  const violations = jsdocMsgs.sort((a, b) => b.line - a.line);
  
  let fileModified = false;
  
  for (const v of violations) {
    const lineIdx = v.line - 1; // 0-based
    if (lineIdx < 0 || lineIdx >= lines.length) continue;
    
    const line = lines[lineIdx];
    
    // Skip if there's already a JSDoc comment above
    if (lineIdx > 0) {
      const prevLine = lines[lineIdx - 1].trim();
      if (prevLine === '*/' || prevLine.startsWith('/**')) continue;
    }
    
    if (v.ruleId === 'jsdoc/require-description') {
      // Find the JSDoc block above and add a description
      let jsdocStart = -1;
      for (let i = lineIdx - 1; i >= 0; i--) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('/**')) {
          jsdocStart = i;
          break;
        }
        if (!trimmed.startsWith('*') && trimmed !== '') break;
      }
      if (jsdocStart >= 0) {
        const funcName = extractFunctionName(line);
        const desc = generateDescription(funcName, relPath, line);
        const indent = lines[jsdocStart].match(/^(\s*)/)[1];
        // Replace /** with /** desc
        if (lines[jsdocStart].trim() === '/**') {
          // Multi-line JSDoc — add description on next line
          lines.splice(jsdocStart + 1, 0, `${indent} * ${desc}`);
        } else {
          // Single-line or inline — try to add description
          lines[jsdocStart] = lines[jsdocStart].replace('/**', `/** ${desc}`);
        }
        fileModified = true;
        totalFixed++;
      }
      continue;
    }
    
    // jsdoc/require-jsdoc — need to add a full JSDoc block
    const indent = line.match(/^(\s*)/)[1];
    const funcName = extractFunctionName(line);
    const desc = generateDescription(funcName, relPath, line);
    const params = extractParams(line, lines, lineIdx);
    const hasReturn = detectReturn(line);
    
    const jsdocLines = [`${indent}/**`, `${indent} * ${desc}`];
    
    if (params.length > 0) {
      jsdocLines.push(`${indent} *`);
      for (const p of params) {
        jsdocLines.push(`${indent} * @param ${p.name} - ${p.desc}`);
      }
    }
    
    if (hasReturn) {
      jsdocLines.push(`${indent} * @returns ${guessReturnDesc(funcName, line, relPath)}`);
    }
    
    jsdocLines.push(`${indent} */`);
    
    lines.splice(lineIdx, 0, ...jsdocLines);
    fileModified = true;
    totalFixed++;
  }
  
  if (fileModified) {
    writeFileSync(filePath, lines.join('\n'));
    totalFiles++;
    if (totalFiles % 50 === 0) {
      console.log(`  Processed ${totalFiles} files (${totalFixed} annotations)...`);
    }
  }
}

console.log(`\nDone! Added ${totalFixed} JSDoc annotations across ${totalFiles} files.`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractFunctionName(line) {
  // export function FooBar(...)
  let m = line.match(/(?:export\s+)?(?:default\s+)?function\s+(\w+)/);
  if (m) return m[1];
  // export class FooBar
  m = line.match(/(?:export\s+)?(?:default\s+)?class\s+(\w+)/);
  if (m) return m[1];
  // export const FooBar = ...
  m = line.match(/(?:export\s+)?const\s+(\w+)/);
  if (m) return m[1];
  // methodName(...) — class method
  m = line.match(/^\s+(\w+)\s*\(/);
  if (m) return m[1];
  // public/private/protected method
  m = line.match(/(?:public|private|protected|static|async)\s+(\w+)/);
  if (m) return m[1];
  return 'unknown';
}

function generateDescription(name, filePath, line) {
  // React component — PascalCase function
  if (/^[A-Z]/.test(name) && (filePath.endsWith('.tsx') || line.includes('React') || line.includes('JSX'))) {
    const readable = name.replace(/([A-Z])/g, ' $1').trim();
    // Check specific patterns
    if (name.includes('Modal')) return `${readable} dialog component.`;
    if (name.includes('Button')) return `${readable} component.`;
    if (name.includes('Card')) return `${readable} display component.`;
    if (name.includes('List')) return `${readable} component.`;
    if (name.includes('Form')) return `${readable} component.`;
    if (name.includes('Header')) return `${readable} component.`;
    if (name.includes('Footer')) return `${readable} component.`;
    if (name.includes('Nav') || name.includes('Navigation')) return `${readable} component.`;
    if (name.includes('Sidebar')) return `${readable} component.`;
    if (name.includes('Panel')) return `${readable} component.`;
    if (name.includes('Badge')) return `${readable} component.`;
    if (name.includes('Avatar')) return `${readable} component.`;
    if (name.includes('Icon')) return `${readable} component.`;
    if (name.includes('Input')) return `${readable} component.`;
    if (name.includes('Select')) return `${readable} component.`;
    if (name.includes('Dropdown')) return `${readable} component.`;
    if (name.includes('Tab')) return `${readable} component.`;
    if (name.includes('Tooltip')) return `${readable} component.`;
    if (name.includes('Empty')) return `${readable} — fallback UI for empty data states.`;
    if (name.includes('Error')) return `${readable} — fallback UI for error states.`;
    if (name.includes('Loading') || name.includes('Skeleton')) return `${readable} — loading placeholder.`;
    if (name.includes('Provider')) return `${readable} — context provider wrapper.`;
    if (name.includes('Layout')) return `${readable} — page layout wrapper.`;
    if (name.includes('Page')) return `${readable} — route-level page component.`;
    if (name.includes('Section')) return `${readable} section component.`;
    if (name.includes('Item')) return `${readable} component.`;
    if (name.includes('Row')) return `${readable} component.`;
    if (name.includes('Container')) return `${readable} wrapper component.`;
    if (name.includes('Wrapper')) return `${readable} wrapper component.`;
    if (name.includes('Menu')) return `${readable} component.`;
    if (name.includes('Dialog')) return `${readable} dialog component.`;
    if (name.includes('Picker')) return `${readable} component.`;
    if (name.includes('Preview')) return `${readable} component.`;
    if (name.includes('Editor')) return `${readable} component.`;
    if (name.includes('Settings')) return `${readable} component.`;
    if (name.includes('Admin')) return `${readable} administration component.`;
    return `${readable} component.`;
  }
  
  // Hooks
  if (name.startsWith('use')) {
    const hookName = name.replace(/^use/, '');
    const readable = hookName.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Hook for managing ${readable}.`;
  }
  
  // Class
  if (line.includes('class ')) {
    const readable = name.replace(/([A-Z])/g, ' $1').trim();
    if (name.includes('Store')) return `${readable} — state management class.`;
    if (name.includes('Service')) return `${readable} — service layer implementation.`;
    if (name.includes('Manager')) return `${readable} — resource management class.`;
    if (name.includes('Handler')) return `${readable} — event/request handler.`;
    if (name.includes('Controller')) return `${readable} — controller implementation.`;
    if (name.includes('Validator')) return `${readable} — validation logic.`;
    if (name.includes('Factory')) return `${readable} — factory for creating instances.`;
    if (name.includes('Builder')) return `${readable} — builder pattern implementation.`;
    return `${readable} class.`;
  }
  
  // Utility / helper functions
  if (name.startsWith('get') || name.startsWith('fetch')) {
    const what = name.replace(/^(get|fetch)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Retrieves ${readable || 'the requested data'}.`;
  }
  if (name.startsWith('set') || name.startsWith('update')) {
    const what = name.replace(/^(set|update)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Updates ${readable || 'the specified value'}.`;
  }
  if (name.startsWith('create') || name.startsWith('make') || name.startsWith('build')) {
    const what = name.replace(/^(create|make|build)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Creates ${readable ? 'a new ' + readable : 'the requested resource'}.`;
  }
  if (name.startsWith('delete') || name.startsWith('remove')) {
    const what = name.replace(/^(delete|remove)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Removes ${readable || 'the specified item'}.`;
  }
  if (name.startsWith('handle') || name.startsWith('on')) {
    const what = name.replace(/^(handle|on)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Handles ${readable || 'the event'}.`;
  }
  if (name.startsWith('is') || name.startsWith('has') || name.startsWith('can') || name.startsWith('should')) {
    const what = name.replace(/^(is|has|can|should)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Checks whether ${readable || 'the condition holds'}.`;
  }
  if (name.startsWith('format') || name.startsWith('parse') || name.startsWith('transform') || name.startsWith('convert')) {
    const prefix = name.match(/^(format|parse|transform|convert)/)[1];
    const what = name.replace(/^(format|parse|transform|convert)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `${prefix.charAt(0).toUpperCase() + prefix.slice(1)}s ${readable || 'the input data'}.`;
  }
  if (name.startsWith('validate') || name.startsWith('check') || name.startsWith('verify')) {
    const what = name.replace(/^(validate|check|verify)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Validates ${readable || 'the input'}.`;
  }
  if (name.startsWith('render')) {
    const what = name.replace(/^render/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Renders ${readable || 'the component'}.`;
  }
  if (name.startsWith('init') || name.startsWith('setup') || name.startsWith('configure')) {
    const what = name.replace(/^(init|setup|configure)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Initializes ${readable || 'the module'}.`;
  }
  if (name.startsWith('load')) {
    const what = name.replace(/^load/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Loads ${readable || 'the requested resource'}.`;
  }
  if (name.startsWith('save') || name.startsWith('persist') || name.startsWith('store')) {
    const what = name.replace(/^(save|persist|store)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Persists ${readable || 'the data'}.`;
  }
  if (name.startsWith('send') || name.startsWith('emit') || name.startsWith('dispatch') || name.startsWith('publish')) {
    const what = name.replace(/^(send|emit|dispatch|publish)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Dispatches ${readable || 'the event'}.`;
  }
  if (name.startsWith('subscribe') || name.startsWith('listen')) {
    const what = name.replace(/^(subscribe|listen)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Subscribes to ${readable || 'events'}.`;
  }
  if (name.startsWith('toggle')) {
    const what = name.replace(/^toggle/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Toggles ${readable || 'the state'}.`;
  }
  if (name.startsWith('reset') || name.startsWith('clear')) {
    const what = name.replace(/^(reset|clear)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Resets ${readable || 'to initial state'}.`;
  }
  if (name.startsWith('compute') || name.startsWith('calculate') || name.startsWith('derive')) {
    const what = name.replace(/^(compute|calculate|derive)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `Computes ${readable || 'the derived value'}.`;
  }
  if (name.startsWith('map') || name.startsWith('reduce') || name.startsWith('filter') || name.startsWith('sort')) {
    const prefix = name.match(/^(map|reduce|filter|sort)/)[1];
    const what = name.replace(/^(map|reduce|filter|sort)/, '');
    const readable = what.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `${prefix.charAt(0).toUpperCase() + prefix.slice(1)}s ${readable || 'the collection'}.`;
  }
  
  // Fallback — use context from file path
  const dirParts = filePath.split('/');
  const module = dirParts.find((p) => ['modules', 'pages', 'components', 'lib', 'hooks', 'stores'].includes(p));
  const moduleIdx = dirParts.indexOf(module);
  const context = moduleIdx >= 0 && moduleIdx + 1 < dirParts.length ? dirParts[moduleIdx + 1] : '';
  
  const readable = name.replace(/([A-Z])/g, ' $1').trim();
  if (context) {
    return `${readable} for the ${context} module.`;
  }
  return `${readable}.`;
}

function extractParams(line, lines, lineIdx) {
  // Gather the full function signature (may span multiple lines)
  let sig = line;
  let depth = 0;
  for (let i = 0; i < sig.length; i++) {
    if (sig[i] === '(') depth++;
    if (sig[i] === ')') depth--;
  }
  let nextIdx = lineIdx + 1;
  while (depth > 0 && nextIdx < lines.length) {
    sig += ' ' + lines[nextIdx].trim();
    for (let i = lines[nextIdx].length - 1; i >= 0; i--) {
      // recount from full sig
    }
    depth = 0;
    for (let i = 0; i < sig.length; i++) {
      if (sig[i] === '(') depth++;
      if (sig[i] === ')') depth--;
    }
    nextIdx++;
  }
  
  // Extract params from the signature
  const parenMatch = sig.match(/\(([^)]*)\)/);
  if (!parenMatch) return [];
  
  const paramStr = parenMatch[1].trim();
  if (!paramStr || paramStr === '') return [];
  
  // Skip destructured objects — they're too complex to document per-param
  if (paramStr.startsWith('{')) return [];
  
  // Split by comma (simple params only)
  const params = [];
  const parts = paramStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Skip rest params, default values, destructured
    if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('...')) continue;
    const nameMatch = trimmed.match(/^(\w+)/);
    if (nameMatch) {
      const pName = nameMatch[1];
      // Skip common non-param patterns
      if (['props', 'children', 'className', 'ref'].includes(pName)) continue;
      const typeMatch = trimmed.match(/:\s*([^=]+)/);
      const type = typeMatch ? typeMatch[1].trim() : '';
      params.push({
        name: pName,
        desc: guessParamDesc(pName, type),
      });
    }
  }
  
  return params;
}

function guessParamDesc(name, type) {
  if (name === 'id') return 'Unique identifier.';
  if (name === 'key') return 'Lookup key.';
  if (name === 'value') return 'The value to set.';
  if (name === 'data') return 'Input data.';
  if (name === 'options') return 'Configuration options.';
  if (name === 'config') return 'Configuration object.';
  if (name === 'callback') return 'Callback function.';
  if (name === 'event' || name === 'e') return 'The event object.';
  if (name === 'error' || name === 'err') return 'The error instance.';
  if (name === 'message' || name === 'msg') return 'The message content.';
  if (name === 'index' || name === 'idx') return 'The index position.';
  if (name === 'count') return 'The count value.';
  if (name === 'label') return 'Display label.';
  if (name === 'title') return 'Display title.';
  if (name === 'name') return 'The name identifier.';
  if (name === 'url') return 'The URL string.';
  if (name === 'path') return 'The file or route path.';
  if (name === 'text') return 'The text content.';
  if (name === 'content') return 'The content to render.';
  if (name === 'items') return 'Array of items.';
  if (name === 'user') return 'The user object.';
  if (name === 'token') return 'Authentication token.';
  const readable = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  return `The ${readable}.`;
}

function detectReturn(line) {
  // Simple check — functions that start with get/is/has/compute/calculate/create usually return
  const name = extractFunctionName(line);
  if (/^(get|is|has|can|should|compute|calculate|create|make|build|find|parse|format|convert|derive|generate|resolve|select|extract|fetch|load|read)/.test(name)) {
    return true;
  }
  // Functions with explicit return type annotation
  if (line.match(/\):\s*(?!void)/)) return true;
  return false;
}

function guessReturnDesc(name, line, filePath) {
  if (/^(is|has|can|should)/.test(name)) return 'True if the condition is met.';
  if (/^get/.test(name)) {
    const what = name.replace(/^get/, '').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return `The ${what || 'requested value'}.`;
  }
  if (/^(create|make|build|generate)/.test(name)) return 'The newly created instance.';
  if (/^(find|select)/.test(name)) return 'The matched result, or undefined if not found.';
  if (/^(parse|format|convert|transform)/.test(name)) return 'The processed result.';
  if (/^(compute|calculate|derive)/.test(name)) return 'The computed value.';
  if (/^(fetch|load|read)/.test(name)) return 'The loaded data.';
  if (/^(resolve|extract)/.test(name)) return 'The resolved value.';
  if (filePath.endsWith('.tsx') && /^[A-Z]/.test(name)) return 'The rendered JSX element.';
  return 'The result.';
}
