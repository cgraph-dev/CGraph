/**
 * List all web lint errors with context.
 * @description Shows remaining errors from web app lint
 */

import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('/tmp/web-lint2.json', 'utf8'));
for (const r of data) {
  for (const m of r.messages) {
    if (m.severity === 2) {
      console.log(
        r.filePath.replace('/CGraph/', '') +
          ':' +
          m.line +
          ' [' +
          (m.ruleId || 'null') +
          '] ' +
          m.message.slice(0, 100)
      );
    }
  }
}
