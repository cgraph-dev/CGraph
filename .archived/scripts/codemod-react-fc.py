#!/usr/bin/env python3
"""
Codemod: Convert React.FC<Props> arrow functions to function declarations.
Handles:
  - export const X: React.FC<Props> = ({ ... }) => { ... }
  - export const X: React.FC<Props> = ({ ... }) => ( ... )
  - export const X: React.FC = () => ( ... )
  - const X: React.FC<Props> = ({ ... }) => { ... }

Skips:
  - React.FC used as type reference (Record<K, React.FC>, ): React.FC<P>)
  - React.FC with memo() wrapping (too complex for automated transform)
  - HOC patterns (withProfiler, withErrorBoundary)
"""

import re
import os
import sys

def get_files():
    """Get all files with React.FC usage."""
    import subprocess
    result = subprocess.run(
        ['grep', '-rln', r'React\.FC\b', 'apps/web/src/', 'apps/mobile/src/',
         '--include=*.tsx', '--include=*.ts'],
        capture_output=True, text=True, cwd='/CGraph'
    )
    files = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
    # Filter out test files
    files = [f for f in files if '__tests__' not in f and '.test.' not in f]
    return files

def transform_file(filepath):
    """Transform React.FC patterns in a single file."""
    full_path = os.path.join('/CGraph', filepath)
    with open(full_path, 'r') as f:
        content = f.read()
    
    original = content
    changes = 0
    
    # Pattern 1: export const X: React.FC<Props> = ({ destructured }) => {
    # or: export const X: React.FC<Props> = ({ destructured }) => (
    # Convert to: export function X({ destructured }: Props): React.ReactElement {
    
    # Skip files with memo wrapping on React.FC lines - too complex
    # Skip HOC patterns (return type React.FC<P>)
    # Skip Record type usages
    
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip: React.FC used as a type reference (Record, return type, type annotation)
        if re.search(r'Record<.*React\.FC', line) or re.search(r'\):\s*React\.FC', line):
            new_lines.append(line)
            i += 1
            continue
        
        # Skip: React.FC with memo() - too complex
        if 'React.FC' in line and 'memo(' in line:
            new_lines.append(line)
            i += 1
            continue
        
        # Pattern: (export )const X: React.FC<Props> = (params) => {
        # or:      (export )const X: React.FC<Props> = (params) => (
        # or:      (export )const X: React.FC = () => (
        match = re.match(
            r'^(\s*)(export\s+)?const\s+(\w+):\s*React\.FC(?:<([^>]*)>)?\s*=\s*\(([^)]*)\)\s*=>\s*([({])',
            line
        )
        
        if match:
            indent = match.group(1)
            export_kw = match.group(2) or ''
            func_name = match.group(3)
            props_type = match.group(4)  # None if no generic
            params = match.group(5).strip()
            brace_or_paren = match.group(6)
            
            # Build the function declaration
            if props_type:
                if params:
                    func_sig = f"{indent}{export_kw}function {func_name}({params}: {props_type}): React.ReactElement {{"
                else:
                    func_sig = f"{indent}{export_kw}function {func_name}(): React.ReactElement {{"
            else:
                func_sig = f"{indent}{export_kw}function {func_name}(): React.ReactElement {{"
            
            if brace_or_paren == '{':
                # Arrow with { body } — just replace the declaration, body stays
                new_lines.append(func_sig)
                changes += 1
            elif brace_or_paren == '(':
                # Arrow with ( JSX ) — need to add return
                # Check if it's a single-line return
                rest_of_line = line[match.end():]
                if rest_of_line.rstrip().endswith(');'):
                    # Single line: const X: React.FC = () => (<div/>);
                    jsx_content = rest_of_line.rstrip()[:-2]  # Remove );
                    new_lines.append(func_sig)
                    new_lines.append(f"{indent}  return ({jsx_content});")
                    new_lines.append(f"{indent}}}")
                    changes += 1
                else:
                    # Multi-line: opening paren, find matching close
                    new_lines.append(func_sig)
                    new_lines.append(f"{indent}  return (")
                    changes += 1
                    # The rest continues normally - we need to find the closing ); 
                    # and replace it with ); }
                    # Scan forward for the matching close
                    paren_depth = 1
                    i += 1
                    while i < len(lines) and paren_depth > 0:
                        cur_line = lines[i]
                        # Count parens
                        for ch in cur_line:
                            if ch == '(':
                                paren_depth += 1
                            elif ch == ')':
                                paren_depth -= 1
                                if paren_depth == 0:
                                    break
                        
                        if paren_depth == 0:
                            # This line has the closing paren
                            # It usually looks like "  );" or ");"
                            # Replace the ); with ); then add }
                            close_match = re.match(r'^(\s*)\);\s*$', cur_line)
                            if close_match:
                                new_lines.append(f"{close_match.group(1)});")
                                new_lines.append(f"{indent}}}")
                            else:
                                # More complex close, just add the line + closing brace
                                new_lines.append(cur_line)
                                new_lines.append(f"{indent}}}")
                        else:
                            new_lines.append(cur_line)
                        i += 1
                    # Don't increment i again at the bottom
                    continue
            
            i += 1
            continue
        
        # Pattern for inline with no destructuring on same line but props on next:
        # const X: React.FC<Props> = ({
        match2 = re.match(
            r'^(\s*)(export\s+)?const\s+(\w+):\s*React\.FC(?:<([^>]*)>)?\s*=\s*\(\{$',
            line
        )
        
        if match2:
            indent = match2.group(1)
            export_kw = match2.group(2) or ''
            func_name = match2.group(3)
            props_type = match2.group(4)  # None if no generic
            
            # Collect the destructured params until we find }) =>
            param_lines = []
            i += 1
            while i < len(lines):
                cur_line = lines[i]
                # Check for closing: }) => { or }) => (
                close_match = re.match(r'^(\s*)\}\)\s*=>\s*([({])\s*$', cur_line)
                if close_match:
                    brace_or_paren = close_match.group(2)
                    
                    # Build the function
                    if props_type:
                        new_lines.append(f"{indent}{export_kw}function {func_name}({{")
                        for pl in param_lines:
                            new_lines.append(pl)
                        new_lines.append(f"{close_match.group(1)}}}}}: {props_type}): React.ReactElement {{")
                    else:
                        new_lines.append(f"{indent}{export_kw}function {func_name}({{")
                        for pl in param_lines:
                            new_lines.append(pl)
                        close_indent = close_match.group(1)
                        new_lines.append(f"{close_indent}}}): React.ReactElement {{")
                    
                    if brace_or_paren == '(':
                        new_lines.append(f"{indent}  return (")
                        # Find matching close paren
                        paren_depth = 1
                        i += 1
                        while i < len(lines) and paren_depth > 0:
                            cur_line2 = lines[i]
                            for ch in cur_line2:
                                if ch == '(':
                                    paren_depth += 1
                                elif ch == ')':
                                    paren_depth -= 1
                                    if paren_depth == 0:
                                        break
                            
                            if paren_depth == 0:
                                close_m = re.match(r'^(\s*)\);\s*$', cur_line2)
                                if close_m:
                                    new_lines.append(f"{close_m.group(1)});")
                                    new_lines.append(f"{indent}}}")
                                else:
                                    new_lines.append(cur_line2)
                                    new_lines.append(f"{indent}}}")
                            else:
                                new_lines.append(cur_line2)
                            i += 1
                    
                    changes += 1
                    break
                else:
                    param_lines.append(cur_line)
                    i += 1
            continue
        
        new_lines.append(line)
        i += 1
    
    if changes > 0:
        content = '\n'.join(new_lines)
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"  ✓ {filepath}: {changes} React.FC → function declaration(s)")
    
    return changes

def main():
    files = get_files()
    print(f"Found {len(files)} files with React.FC")
    
    total_changes = 0
    changed_files = 0
    skipped_patterns = []
    
    for filepath in sorted(files):
        changes = transform_file(filepath)
        total_changes += changes
        if changes > 0:
            changed_files += 1
    
    print(f"\n{'='*60}")
    print(f"Total: {total_changes} conversions in {changed_files} files")
    
    # Check remaining
    import subprocess
    result = subprocess.run(
        ['grep', '-rn', r'React\.FC\b', 'apps/web/src/', 'apps/mobile/src/',
         '--include=*.tsx', '--include=*.ts'],
        capture_output=True, text=True, cwd='/CGraph'
    )
    remaining = [l for l in result.stdout.strip().split('\n') if l and '__tests__' not in l and '.test.' not in l]
    print(f"Remaining React.FC usages: {len(remaining)}")
    if remaining:
        print("\nSkipped (type refs, memo, HOCs):")
        for r in remaining:
            print(f"  {r.split(':')[0]}:{r.split(':')[1]}")

if __name__ == '__main__':
    main()
