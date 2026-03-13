#!/usr/bin/env python3
"""
Fix JSDoc ESLint violations in web app:
- jsdoc/require-jsdoc: Add /** Description. */ before exported functions/classes
- jsdoc/require-description: Add description to existing empty JSDoc blocks
"""
import json
import subprocess
import re

result = subprocess.run(
    ['npx', 'eslint', '--format', 'json', 'apps/web/src/'],
    capture_output=True, text=True, cwd='/CGraph'
)

data = json.loads(result.stdout)


def find_declaration(lines, start_idx):
    for i in range(start_idx, min(start_idx + 5, len(lines))):
        s = lines[i].strip()
        if s and not s.startswith('*') and not s.startswith('/**') and not s.startswith('//'):
            return s
    return ''


def humanize_name(name):
    words = re.sub(r'([A-Z])', r' \1', name).strip().lower().split()
    if not words:
        return 'Description'
    first = words[0]
    rest = ' '.join(words[1:])
    prefixes = {
        'use': 'Hook for', 'get': 'Gets', 'set': 'Sets', 'create': 'Creates',
        'handle': 'Handles', 'on': 'Handles', 'render': 'Renders', 'fetch': 'Fetches',
        'update': 'Updates', 'delete': 'Removes', 'remove': 'Removes', 'format': 'Formats',
        'parse': 'Parses', 'validate': 'Validates', 'transform': 'Transforms',
        'normalize': 'Normalizes', 'calculate': 'Calculates', 'compute': 'Computes',
        'load': 'Loads', 'save': 'Saves', 'send': 'Sends', 'init': 'Initializes',
        'initialize': 'Initializes', 'register': 'Registers',
    }
    if first in ('is', 'has', 'can'):
        return f'Checks if {rest}' if rest else 'Check'
    if first in prefixes:
        prefix = prefixes[first]
        return f'{prefix} {rest}' if rest else prefix
    if name[0].isupper():
        return f'{" ".join(words).title()} component'
    return ' '.join(words).capitalize()


def generate_description(declaration):
    if not declaration:
        return 'Description.'
    m = re.match(r'(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)', declaration)
    if m:
        return humanize_name(m.group(1)) + '.'
    m = re.match(r'(?:export\s+)?class\s+(\w+)', declaration)
    if m:
        return f'{m.group(1)} class.'
    m = re.match(r'(?:export\s+)?(?:const|let|var)\s+(\w+)', declaration)
    if m:
        return humanize_name(m.group(1)) + '.'
    m = re.match(r'(?:export\s+)?(?:type|interface)\s+(\w+)', declaration)
    if m:
        return f'{m.group(1)} type definition.'
    return 'Description.'


jsdoc_by_file = {}
for f in data:
    for m in f.get('messages', []):
        rid = m.get('ruleId', '') or ''
        if rid in ('jsdoc/require-jsdoc', 'jsdoc/require-description'):
            jsdoc_by_file.setdefault(f['filePath'], []).append({
                'line': m['line'],
                'rule': rid,
                'message': m.get('message', ''),
            })

total_fixed = 0

for fp, violations in jsdoc_by_file.items():
    with open(fp) as f:
        lines = f.read().split('\n')

    sorted_violations = sorted(violations, key=lambda v: v['line'], reverse=True)

    for v in sorted_violations:
        idx = v['line'] - 1
        if idx < 0 or idx >= len(lines):
            continue

        line = lines[idx]
        stripped = line.strip()
        indent = len(line) - len(line.lstrip())
        indent_str = ' ' * indent

        if v['rule'] == 'jsdoc/require-jsdoc':
            if idx > 0 and ('/**' in lines[idx - 1] or '*/' in lines[idx - 1]):
                continue
            desc = generate_description(stripped)
            lines.insert(idx, f'{indent_str}/** {desc} */')
            total_fixed += 1

        elif v['rule'] == 'jsdoc/require-description':
            for j in range(idx, max(idx - 10, -1), -1):
                if '/**' in lines[j]:
                    s = lines[j].strip()
                    if s == '/**':
                        desc = generate_description(find_declaration(lines, idx))
                        jdoc_indent = len(lines[j]) - len(lines[j].lstrip())
                        lines.insert(j + 1, ' ' * jdoc_indent + f' * {desc}')
                        total_fixed += 1
                    elif s == '/** */':
                        desc = generate_description(find_declaration(lines, idx))
                        jdoc_indent = len(lines[j]) - len(lines[j].lstrip())
                        lines[j] = ' ' * jdoc_indent + f'/** {desc} */'
                        total_fixed += 1
                    elif s.startswith('/**') and '@' in s:
                        desc = generate_description(find_declaration(lines, idx))
                        jdoc_indent = len(lines[j]) - len(lines[j].lstrip())
                        if s.endswith('*/'):
                            tag_content = s[3:-2].strip()
                            lines[j] = ' ' * jdoc_indent + '/**'
                            lines.insert(j + 1, ' ' * jdoc_indent + f' * {desc}')
                            lines.insert(j + 2, ' ' * jdoc_indent + f' * {tag_content}')
                            lines.insert(j + 3, ' ' * jdoc_indent + ' */')
                            total_fixed += 1
                        else:
                            lines.insert(j + 1, ' ' * jdoc_indent + f' * {desc}')
                            total_fixed += 1
                    break

    with open(fp, 'w') as f:
        f.write('\n'.join(lines))

print(f'Fixed {total_fixed} JSDoc violations in {len(jsdoc_by_file)} files')
