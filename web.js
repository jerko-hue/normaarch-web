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

  // stranica Projekti: razbacani raspored, ulaz kartica i pomak u dubini (svaka kartica svojom brzinom)
  var mreza = document.querySelector('.razbacano'), raspored = function () {}, mjeri = function () {};
  if (mreza) {
    var miran = window.matchMedia('(prefers-reduced-motion: reduce)'), sirok = window.matchMedia('(min-width: 861px)');
    var BRZ = { h: 0, 0: 0.03, 1: 0.09, 2: 0.06, 3: 0.02, 4: 0, 5: 0.07, 6: 0.04, 7: 0.08 };
    var karte = [], vh = 0, okvir = 0;
    // vidljivima iznova podijeli mjesta u ritmu (nakon filtra nema rupa)
    raspored = function () {
      var k = 0;
      mreza.querySelectorAll('.rad').forEach(function (r) {
        if (r.hidden) return;
        r.dataset.p = k === 0 ? 'h' : String((k - 1) % 8); k++;
      });
    };
    var pomakni = function () {
      okvir = 0;
      var c = window.scrollY + vh / 2;
      karte.forEach(function (k) {
        var t = Math.round(Math.max(-48, Math.min(48, (k.y - c) * k.v)) * 10) / 10;
        if (t !== k.t) { k.t = t; k.el.style.transform = t ? 'translate3d(0,' + t + 'px,0)' : ''; }
      });
    };
    // položaji iz rasporeda (offsetTop ne vidi transform, pa nema povratne petlje)
    mjeri = function () {
      karte.forEach(function (k) { k.el.style.transform = ''; });
      karte = []; vh = window.innerHeight;
      if (miran.matches || !sirok.matches) return;
      mreza.querySelectorAll('.rad').forEach(function (r) {
        if (r.hidden) return;
        var y = 0, el = r;
        while (el) { y += el.offsetTop; el = el.offsetParent; }
        karte.push({ el: r, y: y + r.offsetHeight / 2, v: BRZ[r.dataset.p] || 0, t: null });
      });
      pomakni();
    };
    window.addEventListener('scroll', function () { if (karte.length && !okvir) okvir = requestAnimationFrame(pomakni); }, { passive: true });
    var naknadno = 0, kasnije = function () { if (!naknadno) naknadno = requestAnimationFrame(function () { naknadno = 0; mjeri(); }); };
    if ('ResizeObserver' in window) new ResizeObserver(kasnije).observe(mreza);
    window.addEventListener('resize', kasnije);
    window.addEventListener('load', kasnije);
    [miran, sirok].forEach(function (m) { if (m.addEventListener) m.addEventListener('change', kasnije); });
    mjeri();

    // ulaz: kartica se tiho podigne kad dođe u pogled (one već na ekranu odmah stoje)
    if (!miran.matches && 'IntersectionObserver' in window) {
      var ulaz = new IntersectionObserver(function (ul) {
        ul.forEach(function (u) { if (u.isIntersecting) { u.target.classList.add('vidljiv'); ulaz.unobserve(u.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      mreza.querySelectorAll('.rad').forEach(function (r) {
        if (r.getBoundingClientRect().top < window.innerHeight * 0.92) r.classList.add('vidljiv');
        else ulaz.observe(r);
      });
      document.documentElement.classList.add('ziv');
    }
  }

  // filtar projekata
  document.querySelectorAll('.filtar button').forEach(function (bt, _, sve) {
    bt.addEventListener('click', function () {
      sve.forEach(function (x) { x.setAttribute('aria-pressed', x === bt); });
      document.querySelectorAll('.jednako .rad').forEach(function (r) {
        r.hidden = bt.dataset.f !== 'sve' && r.dataset.vrsta !== bt.dataset.f;
      });
      raspored(); mjeri();
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
