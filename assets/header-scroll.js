(function () {
  /* Inject header transparency CSS */
  var style = document.createElement('style');
  style.textContent = [
    'header {',
    '  background: rgba(255,255,255,0.7) !important;',
    '  backdrop-filter: blur(12px);',
    '  -webkit-backdrop-filter: blur(12px);',
    '  transition: background 0.35s ease, box-shadow 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1) !important;',
    '}',
    'header.at-top {',
    '  background: transparent !important;',
    '  box-shadow: none !important;',
    '  backdrop-filter: none;',
    '  -webkit-backdrop-filter: none;',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  function update() {
    var h = document.querySelector('header');
    if (!h) return;
    if (window.scrollY === 0) {
      h.classList.add('at-top');
    } else {
      h.classList.remove('at-top');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }
})();
