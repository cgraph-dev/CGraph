/**
 * Find and display null-ruleId warnings (unused eslint-disable directives).
 * @description Lists unused eslint-disable comments
 */

import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('/tmp/eslint-verify6.json', 'utf8'));
for (const r of data) {
  for (const m of r.messages) {
    if (m.severity === 1 && !m.ruleId) {
      console.log(
        r.filePath.replace('/CGraph/', '') + ':' + m.line + ' ' + m.message
      );
    }
  }
}
