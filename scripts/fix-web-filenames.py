#!/usr/bin/env python3
"""Rename PascalCase web tsx files to kebab-case and update imports."""
import os
import re

renames = [
    ('apps/web/src/components/nameplate/NameplateBar.tsx', 'nameplate-bar.tsx'),
    ('apps/web/src/components/particles/ParticleEngine.tsx', 'particle-engine.tsx'),
    ('apps/web/src/modules/secret-chat/components/GhostModeIndicator.tsx', 'ghost-mode-indicator.tsx'),
    ('apps/web/src/modules/secret-chat/components/PanicWipeButton.tsx', 'panic-wipe-button.tsx'),
    ('apps/web/src/modules/secret-chat/components/SecretChatHeader.tsx', 'secret-chat-header.tsx'),
    ('apps/web/src/modules/secret-chat/components/SecretIdentity.tsx', 'secret-identity.tsx'),
    ('apps/web/src/modules/secret-chat/components/TimerCountdown.tsx', 'timer-countdown.tsx'),
]

import_map = {}
for old_path, new_name in renames:
    old_base = os.path.basename(old_path).replace('.tsx', '')
    new_base = new_name.replace('.tsx', '')
    import_map[old_base] = new_base

# 1. Rename files
for old_path, new_name in renames:
    new_path = os.path.join(os.path.dirname(old_path), new_name)
    if os.path.exists(old_path):
        os.rename(old_path, new_path)
        print(f'Renamed: {old_path} -> {new_path}')

# 2. Update imports
updated_files = set()
for root, dirs, files in os.walk('apps/web/src/'):
    for fname in files:
        if not fname.endswith(('.ts', '.tsx')):
            continue
        fpath = os.path.join(root, fname)
        try:
            with open(fpath) as f:
                content = f.read()
        except Exception:
            continue

        original = content
        for old_base, new_base in import_map.items():
            # Match: from './OldName' or from '../path/OldName' or from '@/path/OldName'
            pattern = r"(from\s+['\"][^'\"]*?/)" + re.escape(old_base) + r"(['\"])"
            content = re.sub(pattern, r'\g<1>' + new_base + r'\g<2>', content)

        if content != original:
            with open(fpath, 'w') as f:
                f.write(content)
            updated_files.add(fpath)
            print(f'Updated imports: {fpath}')

print(f'\nRenamed {len(renames)} files, updated {len(updated_files)} import files')
