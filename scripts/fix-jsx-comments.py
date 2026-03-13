#!/usr/bin/env python3
"""
Fix JSX-style eslint-disable comments that were incorrectly placed inside JS contexts.
Converts {/* eslint-disable-next-line ... */} to // eslint-disable-next-line ...
when they appear inside non-JSX code (object literals, regular JS).
"""
import subprocess
import re

# Get all files with parsing errors
result = subprocess.run(
    ['npx', 'eslint', '--format', 'json', 'apps/mobile/src/'],
    capture_output=True, text=True, cwd='/CGraph'
)

import json
data = json.loads(result.stdout)

parse_error_files = set()
for f in data:
    for m in f.get('messages', []):
        if 'Parsing error' in m.get('message', ''):
            parse_error_files.add(f['filePath'])

print(f'Found {len(parse_error_files)} files with parsing errors')

# Strategy: In ALL mobile files, replace {/* eslint-disable-next-line ... */}
# with // eslint-disable-next-line ... ONLY when it appears inside a non-JSX context.
# 
# Heuristic: A {/* ... */} comment is in JSX context if:
# - The previous non-empty line ends with > or /> or starts with <
# - The next non-empty line starts with < or starts with {
#
# If it's inside an object literal or regular JS, convert to // comment.

# Actually, simpler approach: just convert ALL {/* eslint-disable-next-line */} 
# to // eslint-disable-next-line in the parse-error files, since the JSX form
# is causing the parse issues.

fixed = 0
for fp in parse_error_files:
    with open(fp) as f:
        content = f.read()
    
    original = content
    
    # Replace {/* eslint-disable-next-line @typescript-eslint/XXX */} with // eslint-disable-next-line @typescript-eslint/XXX
    content = re.sub(
        r'\{/\*\s*eslint-disable-next-line\s+([@\w/, -]+?)\s*\*/\}',
        r'// eslint-disable-next-line \1',
        content
    )
    
    if content != original:
        with open(fp, 'w') as f:
            f.write(content)
        fixed += 1

print(f'Fixed {fixed} files')
