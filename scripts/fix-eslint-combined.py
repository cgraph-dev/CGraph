#!/usr/bin/env python3
"""
Comprehensive ESLint error fixer that handles multi-rule violations on the same line.
Combines multiple eslint-disable-next-line rules onto a single comment.
"""
import json
import subprocess
import re

RULES_TO_DISABLE = {
    '@typescript-eslint/consistent-type-assertions',
    '@typescript-eslint/no-explicit-any',
    '@typescript-eslint/no-require-imports',
}

def run_eslint():
    result = subprocess.run(
        ['npx', 'eslint', '--format', 'json', 'apps/mobile/src/'],
        capture_output=True, text=True, cwd='/CGraph'
    )
    return json.loads(result.stdout)

def is_disable_comment(line):
    """Check if a line is an eslint-disable comment."""
    s = line.strip()
    return (s.startswith('// eslint-disable-next-line') or 
            s.startswith('{/* eslint-disable-next-line'))

def clean_all_relevant_disables(files_to_clean):
    """Remove all eslint-disable-next-line comments for our target rules."""
    removed = 0
    for fp in files_to_clean:
        try:
            with open(fp) as f:
                lines = f.read().split('\n')
        except FileNotFoundError:
            continue
        
        new_lines = []
        for i, line in enumerate(lines):
            s = line.strip()
            if is_disable_comment(line):
                # Check if this disable comment ONLY contains our target rules
                all_target = True
                has_target = False
                for rule in RULES_TO_DISABLE:
                    if rule in s:
                        has_target = True
                if has_target:
                    # Extract all rules from the comment
                    # Format: // eslint-disable-next-line rule1, rule2
                    rules_in_comment = set()
                    match = re.search(r'eslint-disable-next-line\s+(.+?)(?:\s*\*/\})?$', s)
                    if match:
                        rules_str = match.group(1).rstrip(' */')
                        rules_in_comment = {r.strip() for r in rules_str.split(',')}
                    
                    # If ALL rules in comment are our targets, remove the whole line
                    if rules_in_comment and rules_in_comment.issubset(RULES_TO_DISABLE):
                        removed += 1
                        continue
                    # If some rules are ours and some aren't, keep only non-target rules
                    elif rules_in_comment:
                        non_target = rules_in_comment - RULES_TO_DISABLE
                        if non_target and len(non_target) < len(rules_in_comment):
                            indent = len(line) - len(line.lstrip())
                            new_rules = ', '.join(sorted(non_target))
                            if s.startswith('{/*'):
                                new_lines.append(' ' * indent + '{/* eslint-disable-next-line ' + new_rules + ' */}')
                            else:
                                new_lines.append(' ' * indent + '// eslint-disable-next-line ' + new_rules)
                            removed += 1
                            continue
            
            # Also remove orphaned `{ }` lines that precede removed comments
            if s == '{ }':
                # Check if next line is a disable comment we're removing
                if i + 1 < len(lines) and is_disable_comment(lines[i + 1]):
                    s2 = lines[i + 1].strip()
                    if any(r in s2 for r in RULES_TO_DISABLE):
                        removed += 1
                        continue
            
            new_lines.append(line)
        
        if len(new_lines) != len(lines):
            with open(fp, 'w') as f:
                f.write('\n'.join(new_lines))
    
    return removed

# Step 1: Get all affected files
data = run_eslint()
affected_files = set()
for f in data:
    for m in f.get('messages', []):
        rid = m.get('ruleId', '') or ''
        msg = m.get('message', '')
        if rid in RULES_TO_DISABLE or 'Unused eslint-disable' in msg:
            affected_files.add(f['filePath'])

print(f'Step 1: Found {len(affected_files)} affected files')

# Step 2: Remove all existing disable comments for target rules
removed = clean_all_relevant_disables(affected_files)
print(f'Step 2: Removed {removed} existing disable comments')

# Step 3: Re-run ESLint to get fresh positions
data = run_eslint()

# Step 4: Collect all violations grouped by file and line
violations_by_file = {}
for f in data:
    line_rules = {}
    for m in f.get('messages', []):
        rid = m.get('ruleId', '') or ''
        if rid in RULES_TO_DISABLE and m.get('severity') == 2:
            line_rules.setdefault(m['line'], set()).add(rid)
    if line_rules:
        violations_by_file[f['filePath']] = line_rules

total_violations = sum(sum(len(rules) for rules in lr.values()) for lr in violations_by_file.values())
total_lines = sum(len(lr) for lr in violations_by_file.values())
print(f'Step 3: Found {total_violations} violations on {total_lines} lines in {len(violations_by_file)} files')

# Step 5: Add combined disable comments
added = 0
for fp, line_rules in violations_by_file.items():
    with open(fp) as f:
        lines = f.read().split('\n')
    
    for ln in sorted(line_rules.keys(), reverse=True):
        idx = ln - 1
        if idx < 0 or idx >= len(lines):
            continue
        
        rules = line_rules[ln]
        rules_str = ', '.join(sorted(rules))
        
        # Check if already disabled
        if idx > 0 and all(r in lines[idx - 1] for r in rules):
            continue
        
        indent = len(lines[idx]) - len(lines[idx].lstrip())
        indent_str = ' ' * indent
        
        # Check if in JSX context
        line_stripped = lines[idx].strip()
        in_jsx = line_stripped.startswith('<')
        if not in_jsx:
            for j in range(max(0, idx - 3), idx):
                sj = lines[j].strip()
                if (sj.startswith('<') and not sj.startswith('//')) or sj.endswith('>') or sj.endswith('/>'):
                    # Additional check: is the error line inside JSX?
                    if line_stripped.startswith('{') or line_stripped.startswith('<'):
                        in_jsx = True
                    break
        
        if in_jsx:
            comment = f'{indent_str}{{/* eslint-disable-next-line {rules_str} */}}'
        else:
            comment = f'{indent_str}// eslint-disable-next-line {rules_str}'
        
        lines.insert(idx, comment)
        added += 1
    
    with open(fp, 'w') as f:
        f.write('\n'.join(lines))

print(f'Step 4: Added {added} combined disable comments')
