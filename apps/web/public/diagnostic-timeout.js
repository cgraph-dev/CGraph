/**
 * Diagnostic Timeout — detects when React fails to hydrate.
 *
 * If the initial-loader div is still present after 15 seconds, React
 * failed to mount. Shows collected errors or a generic "took too long"
 * message with a reload button.
 *
 * Loaded as external script to comply with CSP script-src 'self'.
 */

function __cgEscape(str) {
  var d = document.createElement('div');
  d.textContent = String(str || '');
  return d.innerHTML;
}

setTimeout(function () {
  var loader = document.getElementById('initial-loader');
  if (loader) {
    var errors = window.__CGRAPH_ERRORS || [];
    var errorDetail = '';
    if (errors.length > 0) {
      var pre = document.createElement('pre');
      pre.setAttribute(
        'style',
        'color:#fbbf24;font-size:11px;text-align:left;overflow:auto;max-height:200px;background:#1a1a2e;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-all'
      );
      var text = '';
      errors.forEach(function (e) {
        text += (e.stack || e.msg || e.reason || 'Unknown error') + '\n---\n';
      });
      pre.textContent = text;
      errorDetail = pre.outerHTML;
    }

    var wrapper = document.createElement('div');
    wrapper.setAttribute('style', 'text-align:center;max-width:600px;padding:20px');

    var title = document.createElement('p');
    title.setAttribute(
      'style',
      'color:#ef4444;font-size:1.1rem;font-weight:600;margin-bottom:12px'
    );
    title.textContent = 'Failed to load application';
    wrapper.appendChild(title);

    var desc = document.createElement('p');
    desc.setAttribute('style', 'color:#9ca3af;font-size:0.875rem;margin-bottom:16px');
    desc.textContent =
      errors.length > 0
        ? errors.length + ' JavaScript error(s) detected:'
        : 'The app took too long to start. This may be due to a network issue or a JavaScript error. Check Console (F12) for details.';
    wrapper.appendChild(desc);

    if (errorDetail) {
      var temp = document.createElement('div');
      temp.innerHTML = errorDetail; // safe — built via textContent above
      if (temp.firstChild) wrapper.appendChild(temp.firstChild);
    }

    var btn = document.createElement('button');
    btn.setAttribute(
      'style',
      'background:#7c3aed;color:#fff;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:0.875rem;margin-top:12px'
    );
    btn.textContent = 'Reload Page';
    btn.addEventListener('click', function () {
      location.reload();
    });
    wrapper.appendChild(btn);

    loader.textContent = '';
    loader.appendChild(wrapper);
  }
}, 15000);
