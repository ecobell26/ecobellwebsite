(function () {
  /* ── Ecobell 심볼 SVG: 아크 4개를 <g>로 묶고 SVG clipPath 시계방향 스윕 ── */
  var SYMBOL_SVG = [
    '<svg width="100" height="100" viewBox="0 0 258 258" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '<defs><clipPath id="ecb-sweep-clip"><polygon id="ecb-sweep-poly" points="129,129 258,129"/></clipPath></defs>',
    '<g class="ecb-arcs" clip-path="url(#ecb-sweep-clip)">',
    '<path class="ecbs5" d="M227.742 202.077C227.742 187.829 216.196 176.272 201.937 176.272C194.843 176.272 188.42 179.134 183.757 183.767L183.717 183.727C169.709 197.735 150.357 206.4 128.985 206.4C114.737 206.4 103.18 217.947 103.18 232.205C103.18 246.463 114.727 258.01 128.985 258.01C163.785 258.01 195.344 244.202 218.547 221.799C224.16 217.066 227.732 209.992 227.732 202.077H227.742Z" fill="#46A538"/>',
    '<path class="ecbs3" d="M129.005 258C143.253 258 154.81 246.453 154.81 232.195C154.81 217.947 143.263 206.39 129.005 206.39C86.2603 206.39 51.6002 171.74 51.6002 128.985C51.6002 114.737 40.0535 103.18 25.7952 103.18C11.5469 103.18 -0.0097713 114.727 -0.0097713 128.985C-0.0097713 200.226 57.7438 257.99 128.995 257.99L129.005 258Z" fill="#3995CA"/>',
    '<path class="ecbs2" d="M129.005 0C143.253 0 154.81 11.5467 154.81 25.805C154.81 40.0533 143.263 51.61 129.005 51.61C86.2603 51.61 51.6002 86.2601 51.6002 129.015C51.6002 143.263 40.0535 154.82 25.7952 154.82C11.5469 154.82 -0.0097713 143.273 -0.0097713 129.015C0.000234511 57.7536 57.7538 0 129.005 0Z" fill="#0968A7"/>',
    '<path class="ecbs1" d="M129.006 0C114.757 0 103.201 11.5467 103.201 25.805C103.201 40.0633 114.747 51.61 129.006 51.61C171.75 51.61 206.411 86.2601 206.411 129.015C206.411 143.263 217.957 154.82 232.216 154.82C246.474 154.82 258.021 143.273 258.021 129.015C258.001 57.7536 200.247 0 129.006 0Z" fill="#57B7E1"/>',
    '</g>',
    '<path class="ecbs4" d="M232.195 103.2H25.805C11.5533 103.2 0 114.751 0 129C0 143.249 11.5533 154.8 25.805 154.8H232.195C246.447 154.8 258 143.249 258 129C258 114.751 246.447 103.2 232.195 103.2Z" fill="#209896"/>',
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
    '#ecb-loader svg path { mix-blend-mode: multiply; }',
    /* 가로바: 오른쪽→왼쪽 */
    '#ecb-loader svg .ecbs4 { clip-path: inset(0 0 0 100%); }',
    '#ecb-loader.ecb-go .ecbs4 { animation: ecbdraw-rtl 0.44s 1.1s cubic-bezier(0.4,0,0.2,1) forwards; }',
    '@keyframes ecbdraw-rtl { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0 0 0 0); } }'
  ].join('\n');
  document.head.appendChild(styleEl);

  /* ── 로더 DOM ── */
  var loader = document.createElement('div');
  loader.id = 'ecb-loader';
  loader.innerHTML = SYMBOL_SVG;

  /* ── 시계방향 스윕 polygon 계산 (SVG viewBox 0~258, 3시 방향 시작) ── */
  function sweepPolygon(angle) {
    var cx = 129, cy = 129, b = 258;
    var pts = [[cx, cy], [b, cy]];           /* 중심 + 시작점(3시) */

    if (angle > 45)  pts.push([b, b]);       /* 우하 모서리 */
    if (angle > 135) pts.push([0, b]);       /* 좌하 모서리 */
    if (angle > 225) pts.push([0, 0]);       /* 좌상 모서리 */
    if (angle > 315) pts.push([b, 0]);       /* 우상 모서리 */

    if (angle < 360) {
      var rad = angle * Math.PI / 180;
      var dx = Math.cos(rad), dy = Math.sin(rad);
      var lx, ly, t;
      if (angle <= 45 || angle > 315) {
        t = cx / dx;  lx = b;  ly = cy + t * dy;
      } else if (angle <= 135) {
        t = cy / dy;  ly = b;  lx = cx + t * dx;
      } else if (angle <= 225) {
        t = -cx / dx; lx = 0;  ly = cy + t * dy;
      } else {
        t = -cy / dy; ly = 0;  lx = cx + t * dx;
      }
      pts.push([Math.round(lx * 10) / 10, Math.round(ly * 10) / 10]);
    }

    return pts.map(function(p) { return p[0] + ',' + p[1]; }).join(' ');
  }

  /* ── easing: ease-in-out cubic ── */
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ── 아크 그룹 시계방향 스윕 애니메이션 ── */
  function startSweepAnim() {
    var poly = loader.querySelector('#ecb-sweep-poly');
    if (!poly) return;
    var DELAY = 50, DURATION = 1300;
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var elapsed = ts - t0 - DELAY;
      if (elapsed < 0) { requestAnimationFrame(frame); return; }
      var progress = Math.min(elapsed / DURATION, 1);
      poly.setAttribute('points', sweepPolygon(easeInOut(progress) * 360));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ── 타이밍 ── */
  var startTime   = Date.now();
  var MIN_DISPLAY = 1650; /* 전체 draw 완료(1.54s) + 여유 */

  function showLoader() {
    document.body.insertBefore(loader, document.body.firstChild);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        loader.classList.add('ecb-go');
        startSweepAnim();
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
