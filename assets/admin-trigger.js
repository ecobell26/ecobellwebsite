(function () {
  var clicks = 0, timer;
  document.addEventListener('click', function (e) {
    var cp = document.querySelector('.ft-copyright');
    if (cp && cp.contains(e.target)) {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(function () { clicks = 0; }, 800);
      if (clicks >= 3) { clicks = 0; window.open('admin.html', '_blank'); }
    }
  });
})();
