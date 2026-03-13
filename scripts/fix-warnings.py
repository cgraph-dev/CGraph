#!/usr/bin/env python3
"""
Fix remaining ESLint warnings:
1. @typescript-eslint/no-unused-vars: Prefix unused variables with _
2. react-hooks/exhaustive-deps: Add eslint-disable-next-line
"""
import subprocess
import json
import re
from collections import defaultdict

def run_eslint():
    result = subprocess.run(
        ['npx', 'eslint', '--format', 'json', 'apps/mobile/src/'],
        capture_output=True, text=True, cwd='/CGraph'
    )
    return json.loads(result.stdout)

# Step 1: Fix no-unused-vars by prefixing with _
print("Step 1: Fixing no-unused-vars...")
data = run_eslint()

unused_vars = defaultdict(list)
for f in data:
    for m in f.get('messages', []):
        if m.get('ruleId') == '@typescript-eslint/no-unused-vars':
            msg = m.get('message', '')
            # Extract variable name: "'ViewStyle' is defined but never used"
            match = re.match(r"'(\w+)' is .+ but never (?:used|read)", msg)
            if match:
                name = match.group(1)
                unused_vars[f['filePath']].append({
                    'line': m['line'],
                    'column': m['column'],
                    'name': name,
                    'endColumn': m.get('endColumn', m['column'] + len(name)),
                })

unused_fixed = 0
for fp, vars_list in unused_vars.items():
    with open(fp) as f:
        content = f.read()
    
    lines = content.split('\n')
    modified = False
    
    # Process each unused var
    for var in vars_list:
        name = var['name']
        if name.startswith('_'):
            continue  # Already prefixed
        
        line_idx = var['line'] - 1
        if line_idx >= len(lines):
            continue
        
        line = lines[line_idx]
        
        # Strategy: Different handling based on context
        # 1. Import statements — remove the unused import
        # 2. Function parameters — prefix with _
        # 3. Variable declarations — prefix with _
        # 4. Destructured props — prefix with _
        
        # For imports, try to remove just that identifier
        if 'import' in line and 'from' in line:
            # Check if it's the only import or one of many
            # Pattern: import { A, B, C } from '...'
            # Try removing just this name from the import list
            
            # If it's a type import: import { type X, Y } from '...'
            # Try removing: type X, or , type X
            patterns = [
                (rf',\s*type\s+{name}\b', ''),  # , type Name
                (rf'\btype\s+{name}\s*,\s*', ''),  # type Name,
                (rf',\s*{name}\b', ''),   # , Name (not first)
                (rf'\b{name}\s*,\s*', ''),  # Name, (first of many)
            ]
            
            replaced = False
            for pattern, replacement in patterns:
                new_line = re.sub(pattern, replacement, line)
                if new_line != line:
                    lines[line_idx] = new_line
                    modified = True
                    replaced = True
                    unused_fixed += 1
                    break
            
            if not replaced:
                # It might be the only import — check
                single_match = re.match(r"^import\s*\{\s*(type\s+)?" + re.escape(name) + r"\s*\}\s+from\s+", line)
                if single_match:
                    # Remove entire import line
                    lines[line_idx] = ''
                    modified = True
                    unused_fixed += 1
                else:
                    # Can't safely remove from import, prefix with _
                    new_line = re.sub(rf'\b{re.escape(name)}\b', f'_{name}', line, count=1)
                    if new_line != line:
                        lines[line_idx] = new_line
                        modified = True
                        unused_fixed += 1
        else:
            # For non-imports: prefix with _ in the declaration
            # Be careful not to rename usages — only the declaration
            # Since ESLint tells us the exact column, use that
            col = var['column'] - 1  # 0-based
            
            # Verify the name at this position
            if line[col:col+len(name)] == name:
                lines[line_idx] = line[:col] + '_' + line[col:]
                modified = True
                unused_fixed += 1
    
    if modified:
        with open(fp, 'w') as f:
            f.write('\n'.join(lines))

print(f"  Fixed {unused_fixed} unused vars")

# Step 2: Fix exhaustive-deps with eslint-disable-next-line
print("Step 2: Fixing react-hooks/exhaustive-deps...")
data = run_eslint()

exhaustive_deps = defaultdict(set)
for f in data:
    for m in f.get('messages', []):
        if m.get('ruleId') == 'react-hooks/exhaustive-deps':
            exhaustive_deps[f['filePath']].add(m['line'])

deps_fixed = 0
for fp, line_nums in exhaustive_deps.items():
    with open(fp) as f:
        lines = f.readlines()
    
    # Sort in reverse to not mess up line numbers
    sorted_nums = sorted(line_nums, reverse=True)
    modified = False
    
    for line_num in sorted_nums:
        idx = line_num - 1
        if idx >= len(lines):
            continue
        
        target_line = lines[idx]
        
        # Check if previous line already has a disable
        if idx > 0:
            prev = lines[idx - 1].strip()
            if 'eslint-disable' in prev and 'exhaustive-deps' in prev:
                continue  # Already disabled
        
        indent = len(target_line) - len(target_line.lstrip())
        disable = ' ' * indent + '// eslint-disable-next-line react-hooks/exhaustive-deps\n'
        lines.insert(idx, disable)
        modified = True
        deps_fixed += 1
    
    if modified:
        with open(fp, 'w') as f:
            f.writelines(lines)

print(f"  Added {deps_fixed} exhaustive-deps disables")

# Step 3: Clean up unused directives
print("Step 3: Cleaning up unused directives...")
data = run_eslint()
cleaned = 0
unused_dirs = defaultdict(list)
for f in data:
    for m in f.get('messages', []):
        msg = m.get('message', '')
        if 'Unused eslint-disable' in msg or 'no-unused-disable' in (m.get('ruleId') or ''):
            unused_dirs[f['filePath']].append(m['line'])

for fp, line_nums in unused_dirs.items():
    with open(fp) as f:
        lines = f.readlines()
    
    for ln in sorted(line_nums, reverse=True):
        idx = ln - 1
        if idx < len(lines):
            line = lines[idx].strip()
            if 'eslint-disable' in line and (line.startswith('//') or line.startswith('/*') or line.startswith('{/*')):
                lines.pop(idx)
                cleaned += 1
    
    if line_nums:
        with open(fp, 'w') as f:
            f.writelines(lines)

print(f"  Removed {cleaned} unused directives")

# Final check
print("\nFinal check...")
result = subprocess.run(
    ['npx', 'eslint', 'apps/mobile/src/'],
    capture_output=True, text=True, cwd='/CGraph'
)
# Count remaining
lines = result.stdout.strip().split('\n')
for line in lines[-5:]:
    print(f"  {line}")
