// public/js/loaders.js
(function () {
  function spinnerMarkup() {
    return '<span class="btn-spinner" aria-hidden="true" style="display:inline-block; width:1em; height:1em; border:2px solid currentColor; border-radius:50%; border-right-color:transparent; animation:spin 0.75s linear infinite; margin-right:5px; vertical-align:middle;"></span>';
  }

  // Add global keyframes for spinner if not present
  if (!document.getElementById('loader-styles')) {
    const style = document.createElement('style');
    style.id = 'loader-styles';
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  function start(btn, label) {
    if (!btn) return;
    if (btn.getAttribute('aria-busy') === 'true') return;

    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');

    const text = label || btn.dataset.loadingLabel || (btn.textContent || 'Loading').trim();
    btn.innerHTML = spinnerMarkup() + '<span>' + text + '</span>';
  }

  function stop(btn) {
    if (!btn) return;
    const original = btn.dataset.originalHtml;
    if (typeof original === 'string') btn.innerHTML = original;
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');
    delete btn.dataset.originalHtml;
  }

  function bindFormAutoLoaders() {
    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', () => {
        const btn = form.querySelector('button[type="submit"][data-loading]');
        if (btn) start(btn);
      });
    });
  }

  window.Loaders = { start, stop, bind: bindFormAutoLoaders };
  document.addEventListener('DOMContentLoaded', bindFormAutoLoaders);
})();