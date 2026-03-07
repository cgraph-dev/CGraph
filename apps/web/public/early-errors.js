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
  var e = { msg: msg, src: src, line: line, col: col, stack: err && err.stack };
  window.__CGRAPH_ERRORS.push(e);
  console.error('[CGraph:early]', msg, src, line, col, err);
  var loader = document.getElementById('initial-loader');
  if (loader) {
    var wrapper = document.createElement('div');
    wrapper.setAttribute('style', 'text-align:center;max-width:600px;padding:20px');

    var title = document.createElement('p');
    title.setAttribute(
      'style',
      'color:#ef4444;font-size:1.1rem;font-weight:600;margin-bottom:12px'
    );
    title.textContent = 'JavaScript Error';
    wrapper.appendChild(title);

    var pre = document.createElement('pre');
    pre.setAttribute(
      'style',
      'color:#fbbf24;font-size:11px;text-align:left;overflow:auto;max-height:300px;background:#1a1a2e;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-all'
    );
    var errorText =
      (err ? err.stack || err.message || String(err) : msg) +
      '\n\nSource: ' +
      (src || 'unknown') +
      ':' +
      line +
      ':' +
      col;
    pre.textContent = errorText;
    wrapper.appendChild(pre);

    var btn = document.createElement('button');
    btn.setAttribute(
      'style',
      'background:#7c3aed;color:#fff;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:0.875rem;margin-top:12px'
    );
    btn.textContent = 'Reload';
    btn.addEventListener('click', function () {
      location.reload();
    });
    wrapper.appendChild(btn);

    loader.textContent = '';
    loader.appendChild(wrapper);
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
