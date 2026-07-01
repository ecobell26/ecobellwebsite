(function () {
  /* ── 첫 페인트 전에 html 전체를 숨김 (head에서 동기 실행 → 반드시 적용) ── */
  document.documentElement.style.opacity = '0';

  /* ── Ecobell 심볼 SVG ── */
  var SYMBOL_SVG = [
    '<svg width="100" height="100" viewBox="0 0 258 258" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '<path class="ecbs5" d="M227.742 202.077C227.742 187.829 216.196 176.272 201.937 176.272C194.843 176.272 188.42 179.134 183.757 183.767L183.717 183.727C169.709 197.735 150.357 206.4 128.985 206.4C114.737 206.4 103.18 217.947 103.18 232.205C103.18 246.463 114.727 258.01 128.985 258.01C163.785 258.01 195.344 244.202 218.547 221.799C224.16 217.066 227.732 209.992 227.732 202.077H227.742Z" fill="#46A538"/>',
    '<path class="ecbs3" d="M129.005 258C143.253 258 154.81 246.453 154.81 232.195C154.81 217.947 143.263 206.39 129.005 206.39C86.2603 206.39 51.6002 171.74 51.6002 128.985C51.6002 114.737 40.0535 103.18 25.7952 103.18C11.5469 103.18 -0.0097713 114.727 -0.0097713 128.985C-0.0097713 200.226 57.7438 257.99 128.995 257.99L129.005 258Z" fill="#3995CA"/>',
    '<path class="ecbs2" d="M129.005 0C143.253 0 154.81 11.5467 154.81 25.805C154.81 40.0533 143.263 51.61 129.005 51.61C86.2603 51.61 51.6002 86.2601 51.6002 129.015C51.6002 143.263 40.0535 154.82 25.7952 154.82C11.5469 154.82 -0.0097713 143.273 -0.0097713 129.015C0.000234511 57.7536 57.7538 0 129.005 0Z" fill="#0968A7"/>',
    '<path class="ecbs1" d="M129.006 0C114.757 0 103.201 11.5467 103.201 25.805C103.201 40.0633 114.747 51.61 129.006 51.61C171.75 51.61 206.411 86.2601 206.411 129.015C206.411 143.263 217.957 154.82 232.216 154.82C246.474 154.82 258.021 143.273 258.021 129.015C258.001 57.7536 200.247 0 129.006 0Z" fill="#57B7E1"/>',
    '<path class="ecbs4" d="M232.195 103.2H25.805C11.5533 103.2 0 114.751 0 129C0 143.249 11.5533 154.8 25.805 154.8H232.195C246.447 154.8 258 143.249 258 129C258 114.751 246.447 103.2 232.195 103.2Z" fill="#209896"/>',
    '</svg>'
  ].join('');

  /* ── 로더 CSS ── */
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '#ecb-loader {',
    '  position: fixed; inset: 0; background: #fff;',
    '  z-index: 998;',
    '  display: flex; align-items: center; justify-content: center;',
    '  transition: opacity 0.55s ease;',
    '}',
    '#ecb-loader.ecb-out { opacity: 0; pointer-events: none; }',
    '#ecb-loader svg path { mix-blend-mode: multiply; opacity: 0; }',
    '#ecb-loader.ecb-go .ecbs5 { animation: ecb-twinkle 0.72s 0.08s ease-in-out forwards; }',
    '#ecb-loader.ecb-go .ecbs3 { animation: ecb-twinkle 0.72s 0.40s ease-in-out forwards; }',
    '#ecb-loader.ecb-go .ecbs2 { animation: ecb-twinkle 0.72s 0.72s ease-in-out forwards; }',
    '#ecb-loader.ecb-go .ecbs1 { animation: ecb-twinkle 0.72s 1.04s ease-in-out forwards; }',
    '#ecb-loader.ecb-go .ecbs4 { animation: ecb-twinkle 0.72s 1.36s ease-in-out forwards; }',
    '@keyframes ecb-twinkle {',
    '  0%   { opacity: 0; }',
    '  40%  { opacity: 1; }',
    '  62%  { opacity: 0.28; }',
    '  100% { opacity: 1; }',
    '}'
  ].join('\n');
  document.head.appendChild(styleEl);

  /* ── 상태 ── */
  var ANIM_DURATION = 2100;
  var FADE_DURATION = 600;
  var loaded    = false;
  var domReady  = false;
  var currentEl = null;
  var animTimer = null;
  var removeTimer = null;

  /* html opacity 복원: loader가 body 안에서 덮고 있는 상태에서 호출 */
  function revealPage() {
    document.documentElement.style.opacity = '';
  }

  function fadeOut(el, cb) {
    /* 경로를 먼저 즉시 숨김 → mix-blend-mode 경로가 페이지 위에 떠 보이는 현상 방지 */
    el.classList.remove('ecb-go');
    el.querySelectorAll('svg path').forEach(function (p) {
      p.style.animation = 'none';
      p.style.opacity   = '0';
    });
    /* 흰 배경만 페이드아웃 */
    el.classList.add('ecb-out');
    removeTimer = setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (cb) cb();
    }, FADE_DURATION);
  }

  function runCycle() {
    if (loaded) {
      revealPage();
      return;
    }
    var el = document.createElement('div');
    el.id = 'ecb-loader';
    el.innerHTML = SYMBOL_SVG;
    currentEl = el;
    document.body.insertBefore(el, document.body.firstChild);

    /* loader가 body 첫 자식으로 들어간 뒤 html 복원
       → 브라우저는 이 두 줄을 한 태스크에서 처리, 중간 페인트 없음
       → 사용자에게는 로더(흰 배경)가 즉시 덮인 상태로 등장 */
    revealPage();

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('ecb-go');
      });
    });

    animTimer = setTimeout(function () {
      fadeOut(el, function () {
        currentEl = null;
        if (!loaded) runCycle();
      });
    }, ANIM_DURATION);
  }

  function onLoaded() {
    loaded = true;
    if (animTimer)   { clearTimeout(animTimer);   animTimer   = null; }
    if (removeTimer) { clearTimeout(removeTimer);  removeTimer = null; }
    if (!domReady) {
      /* DOMContentLoaded 전에 load (극히 드문 케이스) */
      revealPage();
      return;
    }
    if (currentEl) {
      fadeOut(currentEl, null);
      currentEl = null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    domReady = true;
    if (loaded) {
      revealPage();
    } else {
      runCycle();
    }
  });

  window.addEventListener('load', onLoaded);
})();
