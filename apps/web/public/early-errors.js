/**
 * Early Error Capture — runs BEFORE React/Vite module loads.
 *
 * Catches module evaluation errors and unhandled rejections, displays
 * them in the initial-loader div so users see actionable error info
 * instead of a blank screen.
 *
 * This file MUST be loaded as an external script (not inline) to comply
 * with CSP script-src 'self' without requiring 'unsafe-inline'.
 */

window.__CGRAPH_ERRORS = [];

window.onerror = function (msg, src, line, col, err) {
  const e = { msg: msg, src: src, line: line, col: col, stack: err && err.stack };
  window.__CGRAPH_ERRORS.push(e);
  console.error('[CGraph:early]', msg, src, line, col, err);
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.innerHTML =
      '<div style="text-align:center;max-width:600px;padding:20px">' +
      '<p style="color:#ef4444;font-size:1.1rem;font-weight:600;margin-bottom:12px">JavaScript Error</p>' +
      '<pre style="color:#fbbf24;font-size:11px;text-align:left;overflow:auto;max-height:300px;background:#1a1a2e;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-all">' +
      (err ? err.stack || err.message || String(err) : msg) +
      '\n\nSource: ' +
      (src || 'unknown') +
      ':' +
      line +
      ':' +
      col +
      '</pre>' +
      '<button onclick="location.reload()" style="background:#7c3aed;color:#fff;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:0.875rem;margin-top:12px">Reload</button>' +
      '</div>';
  }
  return false;
};

window.addEventListener('unhandledrejection', function (e) {
  const { reason } = e;
  window.__CGRAPH_ERRORS.push({
    type: 'unhandledrejection',
    reason: String(reason),
    stack: reason && reason.stack,
  });
  console.error('[CGraph:early] Unhandled rejection:', reason);
});
