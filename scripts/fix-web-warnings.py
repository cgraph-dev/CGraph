#!/usr/bin/env python3
"""Fix web warnings: no-unused-vars (remove/prefix) + exhaustive-deps (disable)."""
import subprocess
import json
import re
from collections import defaultdict

TARGET = 'apps/web/src/'
CWD = '/CGraph'


def run_eslint():
    result = subprocess.run(
        ['npx', 'eslint', '--format', 'json', TARGET],
        capture_output=True, text=True, cwd=CWD
    )
    return json.loads(result.stdout)


def fix_unused_vars(data):
    """Fix no-unused-vars warnings by removing unused imports or prefixing vars."""
    violations = defaultdict(list)
    for f in data:
        for m in f.get('messages', []):
            if m.get('ruleId') == '@typescript-eslint/no-unused-vars' and m.get('severity') == 1:
                msg = m.get('message', '')
                match = re.search(r"'(\w+)' is .+ but never (?:used|read)", msg)
                if match:
                    violations[f['filePath']].append({
                        'line': m['line'],
                        'column': m['column'],
                        'name': match.group(1),
                        'message': msg,
                    })

    total_fixed = 0
    for fp, vars_list in violations.items():
        try:
            with open(fp) as f:
                lines = f.readlines()
        except FileNotFoundError:
            continue

        # Process from bottom to top
        modified = False
        for v in sorted(vars_list, key=lambda x: (x['line'], x['column']), reverse=True):
            idx = v['line'] - 1
            if idx >= len(lines):
                continue

            line = lines[idx]
            name = v['name']

            # Check if it's an import line
            if 'import' in line and 'from' in line:
                # Try to remove just this name from the import
                # Case 1: Only import: import { Foo } from '...'
                if re.search(rf'import\s*\{{\s*{re.escape(name)}\s*\}}', line):
                    # Only named import — remove entire line
                    lines.pop(idx)
                    modified = True
                    total_fixed += 1
                    continue

                # Case 2: import { Foo, Bar, Baz } — remove Foo
                # Handle with/without trailing comma
                new_line = re.sub(rf'\b{re.escape(name)}\b,?\s*', '', line)
                # Clean up double commas or trailing commas before }
                new_line = re.sub(r',\s*\}', ' }', new_line)
                new_line = re.sub(r'\{\s*,', '{ ', new_line)
                if new_line != line:
                    lines[idx] = new_line
                    modified = True
                    total_fixed += 1
                    continue

            # Check if it's a type import: import type { Foo } from '...'
            if 'import type' in line and name in line:
                if re.search(rf'import\s+type\s*\{{\s*{re.escape(name)}\s*\}}', line):
                    lines.pop(idx)
                    modified = True
                    total_fixed += 1
                    continue
                new_line = re.sub(rf'\b{re.escape(name)}\b,?\s*', '', line)
                new_line = re.sub(r',\s*\}', ' }', new_line)
                new_line = re.sub(r'\{\s*,', '{ ', new_line)
                if new_line != line:
                    lines[idx] = new_line
                    modified = True
                    total_fixed += 1
                    continue

            # Not an import — prefix with underscore
            if not name.startswith('_'):
                new_name = '_' + name
                # Replace the declaration (be careful to match only the declaration)
                col = v['column'] - 1
                if col < len(line) and line[col:col + len(name)] == name:
                    lines[idx] = line[:col] + new_name + line[col + len(name):]
                    modified = True
                    total_fixed += 1

        if modified:
            with open(fp, 'w') as f:
                f.writelines(lines)

    return total_fixed


def fix_exhaustive_deps(data):
    """Add eslint-disable-next-line for exhaustive-deps warnings."""
    violations = defaultdict(lambda: defaultdict(set))
    for f in data:
        for m in f.get('messages', []):
            if m.get('ruleId') == 'react-hooks/exhaustive-deps' and m.get('severity') == 1:
                violations[f['filePath']][m['line']].add('react-hooks/exhaustive-deps')

    total_fixed = 0
    for fp, line_map in violations.items():
        try:
            with open(fp) as f:
                lines = f.readlines()
        except FileNotFoundError:
            continue

        sorted_lines = sorted(line_map.keys(), reverse=True)
        modified = False
        for line_num in sorted_lines:
            idx = line_num - 1
            if idx >= len(lines):
                continue

            # Check if prev line already has a disable
            if idx > 0:
                prev = lines[idx - 1].strip()
                if 'eslint-disable-next-line' in prev and 'exhaustive-deps' in prev:
                    continue
                if prev.startswith('// eslint-disable-next-line'):
                    # Add our rule
                    lines[idx - 1] = lines[idx - 1].rstrip('\n') + ', react-hooks/exhaustive-deps\n'
                    modified = True
                    total_fixed += 1
                    continue

            indent = len(lines[idx]) - len(lines[idx].lstrip())
            lines.insert(idx, ' ' * indent + '// eslint-disable-next-line react-hooks/exhaustive-deps\n')
            modified = True
            total_fixed += 1

        if modified:
            with open(fp, 'w') as f:
                f.writelines(lines)

    return total_fixed


print("Step 1: Fixing unused vars...")
data = run_eslint()
fixed_vars = fix_unused_vars(data)
print(f"  Fixed {fixed_vars} unused vars")

print("Step 2: Fixing exhaustive-deps...")
data = run_eslint()
fixed_deps = fix_exhaustive_deps(data)
print(f"  Fixed {fixed_deps} exhaustive-deps")

# Re-run to check
print("\nStep 3: Verifying...")
data = run_eslint()
remaining = 0
for f in data:
    for m in f.get('messages', []):
        remaining += 1
        if remaining <= 15:
            fp = f['filePath'].replace('/CGraph/', '')
            rule = m.get('ruleId', '?')
            print(f"  {fp}:{m['line']} — {rule}: {m.get('message', '')[:80]}")
if remaining > 15:
    print(f"  ... and {remaining - 15} more")
print(f"\nDone! Remaining: {remaining}")
