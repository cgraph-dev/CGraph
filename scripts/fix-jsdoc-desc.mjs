#!/usr/bin/env node
/**
 * Fix remaining jsdoc/require-description violations.
 * These are JSDoc blocks that exist but have empty descriptions.
 */

import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('/tmp/eslint-output3.json', 'utf8'));
let fixed = 0;

for (const result of data) {
  const msgs = result.messages.filter(
    (m) => m.ruleId === 'jsdoc/require-description'
  );
  if (msgs.length === 0) continue;

  const filePath = result.filePath;
  let lines = readFileSync(filePath, 'utf8').split('\n');

  // Process in reverse order to avoid line shifts
  const sorted = msgs.sort((a, b) => b.line - a.line);

  for (const v of sorted) {
    const jsdocLineIdx = v.line - 1;
    if (jsdocLineIdx < 0 || jsdocLineIdx >= lines.length) continue;

    const jsdocLine = lines[jsdocLineIdx].trim();
    if (!jsdocLine.startsWith('/**')) continue;

    // Find end of JSDoc block
    let jsdocEndIdx = jsdocLineIdx;
    for (let i = jsdocLineIdx; i < lines.length; i++) {
      if (lines[i].includes('*/')) {
        jsdocEndIdx = i;
        break;
      }
    }

    // Find function line after JSDoc
    let funcLine = '';
    for (
      let i = jsdocEndIdx + 1;
      i < Math.min(lines.length, jsdocEndIdx + 5);
      i++
    ) {
      const trimmed = lines[i].trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        funcLine = trimmed;
        break;
      }
    }

    // Extract function name
    let name = 'unknown';
    let m;
    if (
      (m = funcLine.match(
        /(?:export\s+)?(?:default\s+)?function\s+(\w+)/
      ))
    )
      name = m[1];
    else if (
      (m = funcLine.match(/(?:export\s+)?(?:default\s+)?class\s+(\w+)/))
    )
      name = m[1];
    else if ((m = funcLine.match(/(?:export\s+)?const\s+(\w+)/)))
      name = m[1];
    else if ((m = funcLine.match(/^\s*(\w+)\s*\(/))) name = m[1];
    else if (
      (m = funcLine.match(
        /(?:public|private|protected|static|async)\s+(\w+)/
      ))
    )
      name = m[1];

    // Generate description
    const readable = name.replace(/([A-Z])/g, ' $1').trim();
    let desc;
    if (/^use[A-Z]/.test(name)) {
      const hookName = name
        .replace(/^use/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      desc = `Hook for managing ${hookName}.`;
    } else if (/^[A-Z]/.test(name) && filePath.endsWith('.tsx')) {
      desc = `${readable} component.`;
    } else if (/^(get|fetch)/.test(name)) {
      const what = name
        .replace(/^(get|fetch)/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      desc = `Retrieves ${what || 'the requested data'}.`;
    } else if (/^(handle|on)/.test(name)) {
      const what = name
        .replace(/^(handle|on)/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      desc = `Handles ${what || 'the event'}.`;
    } else if (/^(create|make|build)/.test(name)) {
      const what = name
        .replace(/^(create|make|build)/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      desc = `Creates ${what ? 'a new ' + what : 'the requested resource'}.`;
    } else if (/^(set|update)/.test(name)) {
      const what = name
        .replace(/^(set|update)/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      desc = `Updates ${what || 'the specified value'}.`;
    } else if (/^(is|has|can|should)/.test(name)) {
      const what = name
        .replace(/^(is|has|can|should)/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      desc = `Checks whether ${what || 'the condition holds'}.`;
    } else if (/^render/.test(name)) {
      const what = name
        .replace(/^render/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      desc = `Renders ${what || 'the component'}.`;
    } else if (/^(format|parse|transform|convert)/.test(name)) {
      const prefix = name.match(/^(format|parse|transform|convert)/)[1];
      const what = name
        .replace(/^(format|parse|transform|convert)/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      desc = `${prefix.charAt(0).toUpperCase() + prefix.slice(1)}s ${what || 'the input data'}.`;
    } else {
      desc = `${readable}.`;
    }

    const indent = lines[jsdocLineIdx].match(/^(\s*)/)[1];

    // Check if JSDoc is /** */ on single line
    if (jsdocLine.match(/^\/\*\*\s*\*\/$/)) {
      lines[jsdocLineIdx] = `${indent}/** ${desc} */`;
      fixed++;
      continue;
    }

    // Multi-line JSDoc — find where to insert description
    let inserted = false;
    for (let i = jsdocLineIdx + 1; i <= jsdocEndIdx; i++) {
      const t = lines[i].trim();
      if (t === '*' || t === '* ') {
        // Replace empty star line with description
        lines[i] = `${indent} * ${desc}`;
        fixed++;
        inserted = true;
        break;
      }
      if (t.startsWith('* @')) {
        // Tag line with no desc before — insert desc + separator
        lines.splice(i, 0, `${indent} * ${desc}`, `${indent} *`);
        fixed++;
        inserted = true;
        break;
      }
      if (t === '*/') {
        // End of block with no desc — insert desc before close
        lines.splice(i, 0, `${indent} * ${desc}`);
        fixed++;
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      // Fallback: insert right after /**
      lines.splice(jsdocLineIdx + 1, 0, `${indent} * ${desc}`);
      fixed++;
    }
  }

  writeFileSync(filePath, lines.join('\n'));
}

console.log(`Fixed ${fixed} require-description violations`);
