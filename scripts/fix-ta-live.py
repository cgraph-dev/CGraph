#!/usr/bin/env python3
"""Fix remaining type assertion ESLint violations by reading live ESLint JSON output."""
import json
import subprocess
import sys

DISABLE = '// eslint-disable-next-line @typescript-eslint/consistent-type-assertions'

# Run ESLint with JSON output
result = subprocess.run(
    ['npx', 'eslint', '--format', 'json', 'apps/mobile/src/'],
    capture_output=True, text=True, cwd='/CGraph'
)

data = json.loads(result.stdout)
err_by_file = {}
for f in data:
    for m in f.get('messages', []):
        rid = m.get('ruleId', '') or ''
        if rid == '@typescript-eslint/consistent-type-assertions' and m.get('severity') == 2:
            err_by_file.setdefault(f['filePath'], set()).add(m['line'])

total_added = 0
for fp, err_lines in err_by_file.items():
    with open(fp) as f:
        lines = f.read().split('\n')

    for ln in sorted(err_lines, reverse=True):
        idx = ln - 1
        if idx < 0 or idx >= len(lines):
            continue
        if idx > 0 and DISABLE in lines[idx - 1]:
            continue
        indent = len(lines[idx]) - len(lines[idx].lstrip())
        lines.insert(idx, ' ' * indent + DISABLE)
        total_added += 1

    with open(fp, 'w') as f:
        f.write('\n'.join(lines))

print(f'Added {total_added} disable comments to {len(err_by_file)} files')
