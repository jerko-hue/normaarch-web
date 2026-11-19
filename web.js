// Norma Studio – normaarch.com
(function () {
  // film na naslovnoj: manja datoteka na mobitelu; bez automatskog pokretanja kad korisnik ne želi pokret
  var v = document.querySelector('.film-v'), g = document.querySelector('.film-gumb');
  if (v) {
    var mob = window.matchMedia('(max-width: 800px)').matches;
    var mir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    v.src = mob ? v.dataset.m : v.dataset.d;
    var stanje = function () {
      var stoji = v.paused;
      g.classList.toggle('stoji', stoji);
      g.setAttribute('aria-label', stoji ? g.dataset.kreni : g.dataset.pauza);
    };
    if (mir) { v.removeAttribute('autoplay'); v.pause(); }
    else { var p = v.play(); if (p && p.catch) p.catch(stanje); }
    v.addEventListener('play', stanje); v.addEventListener('pause', stanje);
    g.addEventListener('click', function () { v.paused ? v.play() : v.pause(); });
    stanje();
  }

  // izbornik na mobitelu
  var b = document.querySelector('.izb'), n = document.getElementById('nav');
  if (b) b.addEventListener('click', function () {
    var o = n.classList.toggle('otvoren');
    b.setAttribute('aria-expanded', o);
    document.body.style.overflow = o ? 'hidden' : '';
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && n.classList.contains('otvoren')) b.click(); });

  // projekti: crno-bijeli, a boju dobiju kad se do njih dođe
  var radovi = document.querySelectorAll('.rad');
  if (radovi.length && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('cb');
    var io = new IntersectionObserver(function (ul) {
      ul.forEach(function (u) { if (u.isIntersecting) { u.target.classList.add('boja'); io.unobserve(u.target); } });
    }, { rootMargin: '0px 0px -30% 0px', threshold: 0.25 });
    radovi.forEach(function (r) { io.observe(r); });
  }

  // filtar projekata
  document.querySelectorAll('.filtar button').forEach(function (bt, _, sve) {
    bt.addEventListener('click', function () {
      sve.forEach(function (x) { x.setAttribute('aria-pressed', x === bt); });
      document.querySelectorAll('.jednako .rad').forEach(function (r) {
        r.hidden = bt.dataset.f !== 'sve' && r.dataset.vrsta !== bt.dataset.f;
      });
    });
  });

  // obrazac za upit (Web3Forms)
  var f = document.querySelector('.obrazac');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var bt = f.querySelector('button'), por = f.querySelector('.poruka'), txt = bt.textContent;
    if (f.botcheck.checked) return;
    bt.disabled = true; bt.textContent = f.dataset.salje; por.textContent = '';
    var d = {}; new FormData(f).forEach(function (v, k) { d[k] = v; });
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json(); })
      .then(function (r) { if (!r.success) throw 0; por.textContent = f.dataset.ok; f.reset(); })
      .catch(function () { por.textContent = f.dataset.err; })
      .then(function () { bt.disabled = false; bt.textContent = txt; });
  });
})();
