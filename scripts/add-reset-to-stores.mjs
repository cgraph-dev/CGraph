#!/usr/bin/env node
/**
 * Add reset() action to Zustand stores that are missing it.
 *
 * Strategy:
 * - Parse each store file
 * - Extract the initial state fields (everything before first method/action)
 * - Add a `reset()` method that sets state back to initial values
 * - Update the TypeScript interface to include `reset: () => void`
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

// All stores missing reset()
const WEB_STORES = [
  'apps/web/src/components/ui/animated-avatar/store.ts',
  'apps/web/src/lib/crypto/e2ee-store/store.ts',
  'apps/web/src/lib/crypto/e2eeStore.ts',
  'apps/web/src/modules/admin/store/adminStore.ts',
  'apps/web/src/modules/calls/store/incomingCallStore.ts',
  'apps/web/src/modules/chat/store/chatBubbleStore.ts',
  'apps/web/src/modules/chat/store/chatEffectsStore.ts',
  'apps/web/src/modules/chat/store/chatStore.ts',
  'apps/web/src/modules/chat/store/threadStore.ts',
  'apps/web/src/modules/forums/store/announcementStore.ts',
  'apps/web/src/modules/forums/store/forumHostingStore.ts',
  'apps/web/src/modules/forums/store/forumStore.ts',
  'apps/web/src/modules/gamification/hooks/gamificationSocketStore.ts',
  'apps/web/src/modules/gamification/store/gamificationStore.ts',
  'apps/web/src/modules/groups/store/groupStore.ts',
  'apps/web/src/modules/moderation/store/moderationStore.ts',
  'apps/web/src/modules/premium/store/premiumStore.ts',
  'apps/web/src/modules/search/store/searchStore.ts',
  'apps/web/src/modules/settings/components/ui-customization/store.ts',
  'apps/web/src/modules/settings/store/settingsStore.ts',
  'apps/web/src/modules/social/store/friendStore.ts',
  'apps/web/src/modules/social/store/notificationStore.ts',
];

const MOBILE_STORES = [
  'apps/mobile/src/lib/crypto/store/e2eeStore.ts',
  'apps/mobile/src/stores/chatStore.ts',
  'apps/mobile/src/stores/customizationStore.ts',
  'apps/mobile/src/stores/friendStore.ts',
  'apps/mobile/src/stores/groupStore.ts',
  'apps/mobile/src/stores/marketplaceStore.ts',
  'apps/mobile/src/stores/notificationStore.ts',
  'apps/mobile/src/stores/settingsStore.ts',
  'apps/mobile/src/stores/themeStore.ts',
];

const ALL_STORES = [...WEB_STORES, ...MOBILE_STORES];

let totalAdded = 0;
let totalFailed = 0;

for (const relPath of ALL_STORES) {
  const fullPath = resolve(ROOT, relPath);
  let content;
  try {
    content = readFileSync(fullPath, 'utf8');
  } catch (e) {
    // Try .impl.ts variant for chatStore
    const implPath = fullPath.replace(/Store\.ts$/, 'Store.impl.ts').replace(/store\.ts$/, 'store.impl.ts');
    try {
      content = readFileSync(implPath, 'utf8');
      console.log(`  [redirect] ${relPath} → .impl.ts`);
    } catch {
      console.log(`  [SKIP] ${relPath} — file not found`);
      totalFailed++;
      continue;
    }
  }
  
  // Skip if already has reset
  if (/\breset\s*[:=]\s*\(\s*\)\s*=>/.test(content) || /\breset\s*\(\s*\)\s*\{/.test(content)) {
    console.log(`  [SKIP] ${relPath} — already has reset()`);
    continue;
  }
  
  // Strategy: find the initial state fields and add reset before the last action
  // We look for the pattern: create<Type>(...)( ... (set, get) => ({ ...initialState, ...actions })
  
  // Extract initial state fields
  const initialStateFields = extractInitialState(content, relPath);
  if (!initialStateFields) {
    console.log(`  [WARN] ${relPath} — could not extract initial state`);
    totalFailed++;
    continue;
  }
  
  // Find the right place to insert reset()
  // Strategy: find the last action (function assignment) before the closing of the store body
  const resetCode = `\n  reset: () => set({\n${initialStateFields}\n  }),`;
  
  // Find the closing pattern — we insert reset before the last `})` sequence
  // Look for the pattern: last line of actions, followed by }), or }))
  let modified = insertReset(content, resetCode, relPath);
  
  if (modified && modified !== content) {
    // Also update the type interface if it's in the same file
    modified = addResetToInterface(modified, relPath);
    
    writeFileSync(fullPath, modified, 'utf8');
    console.log(`  [OK] ${relPath} — reset() added`);
    totalAdded++;
  } else {
    console.log(`  [FAIL] ${relPath} — could not insert reset()`);
    totalFailed++;
  }
}

console.log(`\nDone: ${totalAdded} stores updated, ${totalFailed} failed/skipped`);

function extractInitialState(content, relPath) {
  const lines = content.split('\n');
  
  // Check if there's an extracted initialState const
  const initialStateMatch = content.match(/const\s+initialState\s*(?::\s*\w+\s*)?=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
  if (initialStateMatch) {
    // Use the named constant
    return '    ...initialState,';
  }
  
  // Check if there's DEFAULT_STATE
  if (content.includes('...DEFAULT_STATE')) {
    return '    ...DEFAULT_STATE,';
  }
  
  // Extract inline initial state — find the create() call and extract state fields
  // State fields are: propertyName: value, where value is NOT a function
  const stateFields = [];
  
  // Find the (set, get) => ({ or (set) => ({ pattern
  const createBodyMatch = content.match(/\(\s*set\s*(?:,\s*get)?\s*\)\s*=>\s*\(\{/);
  if (!createBodyMatch) return null;
  
  const startIdx = content.indexOf(createBodyMatch[0]) + createBodyMatch[0].length;
  
  // Parse lines after the create body start
  let braceDepth = 1;
  let inState = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = content.indexOf(line, i > 0 ? content.indexOf(lines[i-1]) + lines[i-1].length : 0);
    
    if (lineStart < startIdx) continue;
    
    // Check if this is a state field (not a function)
    const trimmed = line.trim();
    
    // Skip empty lines, comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    
    // If it's a function (action), stop collecting state
    if (trimmed.match(/^\w+\s*:\s*\(/) || trimmed.match(/^\w+\s*:\s*async\s*\(/) || trimmed.match(/^\w+\s*:\s*\(\s*\)\s*=>/)) {
      break;
    }
    
    // If it's a spread of initial state
    if (trimmed.startsWith('...initial') || trimmed.startsWith('...DEFAULT')) {
      stateFields.push(`    ${trimmed}`);
      continue;
    }
    
    // If it looks like a state field: key: value,
    const fieldMatch = trimmed.match(/^(\w+)\s*:\s*(.+)$/);
    if (fieldMatch) {
      const value = fieldMatch[2];
      // If the value is a function, this is an action, stop
      if (value.match(/^\(/) || value.match(/^async\s*\(/) || value.match(/^\(\s*\)\s*=>/)) {
        break;
      }
      stateFields.push(`    ${trimmed}`);
    }
  }
  
  if (stateFields.length === 0) return null;
  
  // Ensure last field has trailing comma
  const lastField = stateFields[stateFields.length - 1];
  if (!lastField.endsWith(',')) {
    stateFields[stateFields.length - 1] = lastField + ',';
  }
  
  return stateFields.join('\n');
}

function insertReset(content, resetCode, relPath) {
  const lines = content.split('\n');
  
  // Find the create() body — we need to insert reset before the closing
  // Look for the (set, get) => ({ pattern and find its matching })
  const createMatch = content.match(/\(\s*set\s*(?:,\s*get)?\s*\)\s*=>\s*\(\{/);
  if (!createMatch) return null;
  
  const startPos = content.indexOf(createMatch[0]) + createMatch[0].length;
  
  // Find the matching }) — track brace depth
  let depth = 1;
  let pos = startPos;
  let lastCommaPos = -1;
  
  while (pos < content.length && depth > 0) {
    const ch = content[pos];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    else if (ch === ',' && depth === 1) {
      lastCommaPos = pos;
    }
    pos++;
  }
  
  if (depth !== 0) return null;
  
  // pos is at the closing } of the store body
  // Insert reset before this closing }
  // Find the line that contains this closing }
  const beforeClose = content.substring(0, pos);
  const afterClose = content.substring(pos);
  
  // Add reset before the closing brace
  return beforeClose.trimEnd() + resetCode + '\n' + afterClose;
}

function addResetToInterface(content, relPath) {
  // Find the interface/type that defines the store state
  // Common patterns: interface XxxState { ... } or type XxxState = { ... }
  
  // Look for interface or type with State/Store in name
  const interfaceMatch = content.match(/(interface|type)\s+(\w+(?:State|Store))\s*(?:=\s*)?\{/);
  if (!interfaceMatch) return content;
  
  const interfaceName = interfaceMatch[2];
  
  // Check if reset is already in the interface
  if (content.includes('reset: () => void')) return content;
  
  // Find the closing } of this interface
  const ifaceStart = content.indexOf(interfaceMatch[0]);
  let depth = 0;
  let pos = ifaceStart;
  
  while (pos < content.length) {
    if (content[pos] === '{') depth++;
    else if (content[pos] === '}') {
      depth--;
      if (depth === 0) break;
    }
    pos++;
  }
  
  if (depth !== 0) return content;
  
  // Insert reset: () => void before the closing }
  const beforeClose = content.substring(0, pos);
  const afterClose = content.substring(pos);
  
  return beforeClose.trimEnd() + '\n  reset: () => void;\n' + afterClose;
}
