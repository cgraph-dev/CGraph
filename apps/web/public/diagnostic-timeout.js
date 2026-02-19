/**
 * Diagnostic Timeout — detects when React fails to hydrate.
 *
 * If the initial-loader div is still present after 15 seconds, React
 * failed to mount. Shows collected errors or a generic "took too long"
 * message with a reload button.
 *
 * Loaded as external script to comply with CSP script-src 'self'.
 */

setTimeout(function () {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    const errors = window.__CGRAPH_ERRORS || [];
    let errorDetail = '';
    if (errors.length > 0) {
      errorDetail =
        '<pre style="color:#fbbf24;font-size:11px;text-align:left;overflow:auto;max-height:200px;background:#1a1a2e;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-all">';
      errors.forEach(function (e) {
        errorDetail += (e.stack || e.msg || e.reason || 'Unknown error') + '\n---\n';
      });
      errorDetail += '</pre>';
    }
    loader.innerHTML =
      '<div style="text-align:center;max-width:600px;padding:20px">' +
      '<p style="color:#ef4444;font-size:1.1rem;font-weight:600;margin-bottom:12px">Failed to load application</p>' +
      '<p style="color:#9ca3af;font-size:0.875rem;margin-bottom:16px">' +
      (errors.length > 0
        ? errors.length + ' JavaScript error(s) detected:'
        : 'The app took too long to start. This may be due to a network issue or a JavaScript error. Check Console (F12) for details.') +
      '</p>' +
      errorDetail +
      '<button onclick="location.reload()" style="background:#7c3aed;color:#fff;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:0.875rem;margin-top:12px">Reload Page</button>' +
      '</div>';
  }
}, 15000);
