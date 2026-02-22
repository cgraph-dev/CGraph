#!/usr/bin/env node
/**
 * Rename PascalCase directories to kebab-case in mobile app.
 * Updates all import paths across the codebase.
 */

import { readdirSync, readFileSync, writeFileSync, renameSync, statSync, existsSync } from 'fs';
import { resolve, join, relative, dirname, sep } from 'path';
import { execSync } from 'child_process';

const ROOT = resolve(import.meta.dirname, '..');

/**
 * Convert PascalCase to kebab-case
 */
function toKebab(name) {
  return name
    // Handle sequences like UI, API etc — UICustomization → ui-customization 
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    // Handle normal PascalCase — AdminDashboard → Admin-Dashboard
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // Handle WhosOnline → Whos-Online (already handled)
    .toLowerCase();
}

// Top-level PascalCase directories to rename (only rename the PascalCase root, 
// subdirectories like components/ and hooks/ are already lowercase)
const DIRS_TO_RENAME = [
  'apps/mobile/src/components/AttachmentPicker',
  'apps/mobile/src/components/chat/StickerPicker',
  'apps/mobile/src/components/enhanced/ui/HolographicUI',
  'apps/mobile/src/components/gamification/QuestPanel',
  'apps/mobile/src/lib/interactions/FeedbackSystem',
  'apps/mobile/src/screens/admin/AdminDashboardScreen',
  'apps/mobile/src/screens/calendar/CalendarScreen',
  'apps/mobile/src/screens/community/WhosOnlineScreen',
  'apps/mobile/src/screens/forums/CreatePostScreen',
  'apps/mobile/src/screens/forums/ForumLeaderboardScreen',
  'apps/mobile/src/screens/forums/PluginMarketplaceScreen',
  'apps/mobile/src/screens/friends/FriendRequestsScreen',
  'apps/mobile/src/screens/gamification/GamificationHubScreen',
  'apps/mobile/src/screens/groups/GroupListScreen',
  'apps/mobile/src/screens/leaderboard/LeaderboardScreen',
  'apps/mobile/src/screens/messages/ConversationScreen',
  'apps/mobile/src/screens/notifications/NotificationsInboxScreen',
  'apps/mobile/src/screens/premium/CoinShopScreen',
  'apps/mobile/src/screens/referrals/ReferralScreen',
  'apps/mobile/src/screens/search/SearchScreen',
  'apps/mobile/src/screens/settings/AvatarSettingsScreen',
  'apps/mobile/src/screens/settings/ChatBubbleSettingsScreen',
  'apps/mobile/src/screens/settings/UICustomizationScreen',
];

// Build rename map: old dir name -> new dir name
const renameMap = [];
for (const dirPath of DIRS_TO_RENAME) {
  const parts = dirPath.split('/');
  const dirName = parts[parts.length - 1];
  const kebabName = toKebab(dirName);
  const parentDir = parts.slice(0, -1).join('/');
  
  renameMap.push({
    oldPath: dirPath,
    newPath: `${parentDir}/${kebabName}`,
    oldName: dirName,
    newName: kebabName,
  });
}

console.log(`Will rename ${renameMap.length} directories:\n`);
for (const { oldName, newName } of renameMap) {
  console.log(`  ${oldName} → ${newName}`);
}

// Step 1: Find all source files that might contain imports
const allFiles = execSync(
  `find apps/mobile/src -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \\) | grep -v node_modules`,
  { cwd: ROOT, encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`\nScanning ${allFiles.length} files for import updates...`);

let totalImportsUpdated = 0;

// Step 2: Update imports in all files BEFORE renaming dirs  
for (const filePath of allFiles) {
  const fullPath = resolve(ROOT, filePath);
  let content;
  try {
    content = readFileSync(fullPath, 'utf8');
  } catch {
    continue;
  }
  
  let modified = content;
  
  for (const { oldName, newName } of renameMap) {
    // Match import paths containing the old directory name
    // Patterns: './OldName', '../OldName', '../../OldName/components/X'
    const regex = new RegExp(
      `(from\\s+['"])([^'"]*/)${escapeRegex(oldName)}(/[^'"]*|['"])`,
      'g'
    );
    
    modified = modified.replace(regex, (match, prefix, pathBefore, pathAfter) => {
      totalImportsUpdated++;
      return `${prefix}${pathBefore}${newName}${pathAfter}`;
    });
    
    // Also handle require() patterns
    const requireRegex = new RegExp(
      `(require\\s*\\(\\s*['"])([^'"]*/)${escapeRegex(oldName)}(/[^'"]*|['"])`,
      'g'
    );
    
    modified = modified.replace(requireRegex, (match, prefix, pathBefore, pathAfter) => {
      totalImportsUpdated++;
      return `${prefix}${pathBefore}${newName}${pathAfter}`;
    });
  }
  
  if (modified !== content) {
    writeFileSync(fullPath, modified, 'utf8');
  }
}

console.log(`Updated ${totalImportsUpdated} import references.`);

// Step 3: Rename directories (bottom-up to avoid parent rename breaking child paths)
// Sort by depth (deepest first) — not needed here since we only rename top-level PascalCase dirs
let renamed = 0;
for (const { oldPath, newPath } of renameMap) {
  const fullOldPath = resolve(ROOT, oldPath);
  const fullNewPath = resolve(ROOT, newPath);
  
  if (!existsSync(fullOldPath)) {
    console.log(`  [SKIP] ${oldPath} — does not exist`);
    continue;
  }
  
  try {
    renameSync(fullOldPath, fullNewPath);
    console.log(`  [OK] ${oldPath} → ${newPath}`);
    renamed++;
  } catch (e) {
    console.log(`  [FAIL] ${oldPath}: ${e.message}`);
  }
}

console.log(`\nDone: ${renamed} directories renamed, ${totalImportsUpdated} imports updated.`);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
