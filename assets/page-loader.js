(function () {
  /* ── Ecobell 심볼 SVG (피그마 벡터 path 5개) ── */
  var SYMBOL_SVG = [
    '<svg width="100" height="100" viewBox="0 0 258 258" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '<path class="ecbs1" d="M129.006 0C114.757 0 103.201 11.5467 103.201 25.805C103.201 40.0633 114.747 51.61 129.006 51.61C171.75 51.61 206.411 86.2601 206.411 129.015C206.411 143.263 217.957 154.82 232.216 154.82C246.474 154.82 258.021 143.273 258.021 129.015C258.001 57.7536 200.247 0 129.006 0Z" fill="#57B7E1"/>',
    '<path class="ecbs2" d="M129.005 0C143.253 0 154.81 11.5467 154.81 25.805C154.81 40.0533 143.263 51.61 129.005 51.61C86.2603 51.61 51.6002 86.2601 51.6002 129.015C51.6002 143.263 40.0535 154.82 25.7952 154.82C11.5469 154.82 -0.0097713 143.273 -0.0097713 129.015C0.000234511 57.7536 57.7538 0 129.005 0Z" fill="#0968A7"/>',
    '<path class="ecbs3" d="M129.005 258C143.253 258 154.81 246.453 154.81 232.195C154.81 217.947 143.263 206.39 129.005 206.39C86.2603 206.39 51.6002 171.74 51.6002 128.985C51.6002 114.737 40.0535 103.18 25.7952 103.18C11.5469 103.18 -0.0097713 114.727 -0.0097713 128.985C-0.0097713 200.226 57.7438 257.99 128.995 257.99L129.005 258Z" fill="#3995CA"/>',
    '<path class="ecbs4" d="M232.195 103.2H25.805C11.5533 103.2 0 114.751 0 129C0 143.249 11.5533 154.8 25.805 154.8H232.195C246.447 154.8 258 143.249 258 129C258 114.751 246.447 103.2 232.195 103.2Z" fill="#209896"/>',
    '<path class="ecbs5" d="M227.742 202.077C227.742 187.829 216.196 176.272 201.937 176.272C194.843 176.272 188.42 179.134 183.757 183.767L183.717 183.727C169.709 197.735 150.357 206.4 128.985 206.4C114.737 206.4 103.18 217.947 103.18 232.205C103.18 246.463 114.727 258.01 128.985 258.01C163.785 258.01 195.344 244.202 218.547 221.799C224.16 217.066 227.732 209.992 227.732 202.077H227.742Z" fill="#46A538"/>',
    '</svg>'
  ].join('');

  /* ── 페이지 로더 스타일 ── */
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '#ecb-loader {',
    '  position: fixed; inset: 0; background: #fff;',
    '  z-index: 99999;',
    '  display: flex; align-items: center; justify-content: center;',
    '  transition: opacity 0.55s ease;',
    '}',
    '#ecb-loader.ecb-out { opacity: 0; pointer-events: none; }',
    /* Figma blendMode: MULTIPLY */
    '#ecb-loader svg path { mix-blend-mode: multiply; }',
    /* 초기 상태 per draw direction */
    '#ecb-loader svg .ecbs2, #ecb-loader svg .ecbs3 { clip-path: inset(100% 0 0 0); }', /* 아래→위 */
    '#ecb-loader svg .ecbs1 { clip-path: inset(0 0 100% 0); }',                          /* 위→아래 */
    '#ecb-loader svg .ecbs4, #ecb-loader svg .ecbs5 { clip-path: inset(0 0 0 100%); }',  /* 우→좌 */
    /* draw 순서: 5(우하 우→좌) → 3(좌하 아래→위) → 2(좌상 아래→위) → 1(우상 위→아래) → 4(가로바 우→좌) */
    '#ecb-loader.ecb-go .ecbs5 { animation: ecbdraw-rtl  0.48s 0.05s cubic-bezier(0.4,0,0.2,1) forwards; }',
    '#ecb-loader.ecb-go .ecbs3 { animation: ecbdraw-up   0.48s 0.32s cubic-bezier(0.4,0,0.2,1) forwards; }',
    '#ecb-loader.ecb-go .ecbs2 { animation: ecbdraw-up   0.48s 0.58s cubic-bezier(0.4,0,0.2,1) forwards; }',
    '#ecb-loader.ecb-go .ecbs1 { animation: ecbdraw-down 0.48s 0.84s cubic-bezier(0.4,0,0.2,1) forwards; }',
    '#ecb-loader.ecb-go .ecbs4 { animation: ecbdraw-rtl  0.44s 1.1s  cubic-bezier(0.4,0,0.2,1) forwards; }',
    '@keyframes ecbdraw-up   { from { clip-path: inset(100% 0 0 0);   } to { clip-path: inset(0 0 0 0); } }',
    '@keyframes ecbdraw-down { from { clip-path: inset(0 0 100% 0);   } to { clip-path: inset(0 0 0 0); } }',
    '@keyframes ecbdraw-rtl  { from { clip-path: inset(0 0 0 100%);   } to { clip-path: inset(0 0 0 0); } }'
  ].join('\n');
  document.head.appendChild(styleEl);

  /* ── 로더 DOM ── */
  var loader = document.createElement('div');
  loader.id = 'ecb-loader';
  loader.innerHTML = SYMBOL_SVG;

  /* ── 타이밍 ── */
  var startTime   = Date.now();
  var MIN_DISPLAY = 1650; /* 전체 draw 완료(1.58s) + 여유 */

  function showLoader() {
    document.body.insertBefore(loader, document.body.firstChild);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        loader.classList.add('ecb-go');
      });
    });
  }

  function hideLoader() {
    var elapsed = Date.now() - startTime;
    var delay   = Math.max(0, MIN_DISPLAY - elapsed);
    setTimeout(function () {
      loader.classList.add('ecb-out');
      setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 600);
    }, delay);
  }

  if (document.body) {
    showLoader();
  } else {
    document.addEventListener('DOMContentLoaded', showLoader);
  }

  window.addEventListener('load', hideLoader);
})();
