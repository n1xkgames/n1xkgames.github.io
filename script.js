/*! ============================================================
   n1xkgames — luxury portfolio motion
   GSAP + ScrollTrigger, smooth-scrolling via Lenis on the ticker
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOVER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
    document.documentElement.classList.add('no-gsap');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  function escHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------------------------------------------------------
     SMOOTH SCROLL — Lenis driven by the GSAP ticker
  --------------------------------------------------------------- */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined' && !REDUCED) {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.3
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (!target) return;
    if (lenis) { lenis.scrollTo(target, { duration: 1.55, offset: 0 }); }
    else if (target.scrollIntoView) { target.scrollIntoView({ behavior: 'smooth' }); }
  }

  /* ---------------------------------------------------------------
     ANCHOR NAVIGATION + MOBILE MENU
  --------------------------------------------------------------- */
  var menu = $('#mobileMenu');
  var menuBtn = $('#menuToggle');

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-locked');
    if (menuBtn) { menuBtn.classList.remove('is-active'); menuBtn.setAttribute('aria-expanded', 'false'); }
    if (lenis) lenis.start();
  }
  function openMenu() {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-locked');
    if (menuBtn) { menuBtn.classList.add('is-active'); menuBtn.setAttribute('aria-expanded', 'true'); }
    if (lenis) lenis.stop();
    if (REDUCED) { menu.style.clipPath = 'inset(0% 0% 0% 0%)'; return; }
    gsap.fromTo(menu,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'power4.inOut' });
    gsap.fromTo($$('.m-link'),
      { y: 72, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.075 });
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) { closeMenu(); } else { openMenu(); }
    });
    menu.addEventListener('click', function (e) { if (e.target === menu) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
    });
  });

  /* ---------------------------------------------------------------
     CORE INTERACTIVITY below (vault authentication, gallery
     filters, clipboard copy) stays enabled for ALL users, including
     prefers-reduced-motion. The decorative motion suite is wrapped
     in its own guard further down.
  --------------------------------------------------------------- */

  /* ---------------------------------------------------------------
     SCROLL PROGRESS + NAV STATE
  --------------------------------------------------------------- */
  gsap.to('#scrollProgress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 'top top', end: 'max', scrub: 0.4 }
  });

  var navBar = $('#header');
  ScrollTrigger.create({
    start: 60, end: 'max',
    onToggle: function (self) { if (navBar) navBar.classList.toggle('scrolled', self.isActive); }
  });

  var navLinks = $$('.nav__link');
  function setActiveLink(id) {
    navLinks.forEach(function (l) {
      l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
    });
  }
  $$('section[id]').forEach(function (sec) {
    ScrollTrigger.create({
      trigger: sec, start: 'top 45%', end: 'bottom 45%',
      onEnter: function () { setActiveLink(sec.id); },
      onEnterBack: function () { setActiveLink(sec.id); }
    });
  });

  /* ---------------------------------------------------------------
     CUSTOM CURSOR (fine pointer only)
  --------------------------------------------------------------- */
  var cursor = $('#cursor');
  if (HOVER && cursor) {
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.32, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.32, ease: 'power3.out' });
    var cursorOn = false;
    window.addEventListener('mousemove', function (e) {
      if (!cursorOn) { cursorOn = true; cursor.style.opacity = '1'; }
      cx(e.clientX);
      cy(e.clientY);
    });
    $$('a, button, input, textarea, [data-copy], .g-item, .studio-card, .prod-card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('cursor--hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor--hover'); });
    });
  }

  /* ---------------------------------------------------------------
     DECORATIVE MOTION SUITE — wrapped in a reduced-motion guard so
     content stays static & readable. Functional systems below are
     registered regardless.
  --------------------------------------------------------------- */
  if (!REDUCED) {

  /* ---------------------------------------------------------------
     HERO — cinematic letter-by-letter + fill mask reveal
  --------------------------------------------------------------- */
  var heroTitle = $('#heroTitle');
  var strokeEl = $('.hero__title-stroke', heroTitle);
  var fillEl = $('.hero__title-fill', heroTitle);

  var text = 'N1XKGAMES';
  strokeEl.innerHTML = '';
  var frag = document.createDocumentFragment();
  var letters = [];
  text.split('').forEach(function (ch) {
    var holder = document.createElement('span');
    holder.className = 'ch';
    var inner = document.createElement('span');
    inner.className = 'ch__i';
    inner.textContent = ch;
    holder.appendChild(inner);
    frag.appendChild(holder);
    letters.push(inner);
  });
  strokeEl.appendChild(frag);

  gsap.set(letters, { yPercent: 130, opacity: 0, rotate: 8 });
  gsap.set(fillEl, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set($$('.hero__eyebrow, .hero__meta, .hero__foot'), { opacity: 0, y: 28 });

  var heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  heroTl
    .to(letters, { yPercent: 0, opacity: 1, rotate: 0, duration: 1.25, stagger: 0.05 }, 0.15)
    .to(fillEl, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power4.inOut' }, 0.55)
    .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.9 }, 0.95)
    .to('.hero__meta', { opacity: 1, y: 0, duration: 1 }, 1.2)
    .to('.hero__foot', { opacity: 1, y: 0, duration: 1 }, 1.5);

  // ambient breathing glow + content exit parallax
  gsap.to('.hero__glow', { opacity: 0.8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.hero__content', {
    yPercent: 16, opacity: 0.2, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 30%', scrub: true }
  });

  /* ---------------------------------------------------------------
     MASKED HEADING / WORD REVEALS (enter viewport)
  --------------------------------------------------------------- */
  function maskReveal(el) {
    var mode = el.getAttribute('data-mask');
    var innerEls;
    if (mode === 'words') {
      var words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', words.join(' '));
      el.innerHTML = words.map(function (w) {
        return '<span class="w" aria-hidden="true"><span class="w__in">' + escHTML(w) + '</span></span>';
      }).join(' ');
      innerEls = $$('.w__in', el);
    } else {
      el.innerHTML = '<span class="line" aria-hidden="true"><span class="line__in">' + escHTML(el.textContent.trim()) + '</span></span>';
      innerEls = $$('.line__in', el);
    }
    gsap.fromTo(innerEls,
      { yPercent: 118, opacity: 0 },
      {
        yPercent: 0, opacity: 1,
        duration: 1.15,
        ease: 'power4.out',
        stagger: mode === 'words' ? 0.04 : 0,
        scrollTrigger: { trigger: el, start: 'top 84%', toggleActions: 'play none none none' }
      });
  }
  $$('[data-mask]').forEach(maskReveal);

  /* ---------------------------------------------------------------
     SIMPLE TEXT-BLOCK FADE-UPS
  --------------------------------------------------------------- */
  $$('[data-fade]').forEach(function (el) {
    gsap.fromTo(el,
      { y: 36, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
      });
  });

  /* ---------------------------------------------------------------
     VELOCITY-SENSITIVE CARD REVEALS
     Each card's progress is scrubbed against scroll position, so
     scrolling speed directly drives scale / fade-up motion.
  --------------------------------------------------------------- */
  $$('[data-group-item]').forEach(function (item, i) {
    var dist = 64 + (i % 3) * 38;
    gsap.fromTo(item,
      { y: dist, opacity: 0, scale: 0.95 },
      {
        y: 0, opacity: 1, scale: 1, ease: 'none',
        scrollTrigger: { trigger: item, start: 'top 96%', end: 'top 48%', scrub: true }
      });
  });

  /* ---------------------------------------------------------------
     SUBTLE PARALLAX (only on elements without a pre-set transform)
  --------------------------------------------------------------- */
  $$('[data-parallax]').forEach(function (el) {
    var speed = parseFloat(el.getAttribute('data-parallax')) || 8;
    gsap.fromTo(el,
      { yPercent: 0 },
      {
        yPercent: speed, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
  });

  } // end decorative motion suite

  /* ---------------------------------------------------------------
     SECURE VAULT — gallery is public to view; uploading photos &
     videos requires authorized clearance (N1xk / ELO4o4MeatLover313!)
  --------------------------------------------------------------- */
  var CREDENTIALS = { name: 'N1xk', password: 'ELO4o4MeatLover313!' };

  var modalEl = $('#vaultModal');
  var lockCard = $('#lockCard');
  var galleryEl = $('#vaultGallery');
  var galleryGrid = $('#galleryGrid');
  var form = $('#vaultForm');
  var nameEl = $('#vaultName');
  var passEl = $('#vaultPass');
  var toastEl = $('#vaultToast');
  var statusEl = $('#lockStatus');
  var passToggle = $('#passToggle');
  var uploadOpen = $('#uploadOpen');
  var uploadZone = $('#uploadZone');
  var uploadInput = $('#uploadInput');
  var uploadPick = $('#uploadPick');
  var uploadStatus = $('#uploadStatusText');

  var MEDIA_KEY = 'n1xkgames.vault.media.v1';
  var SESSION_KEY = 'n1xkgames.upload.session.v1';

  var authorized = false;
  var uploads = []; // persisted entries { cat, name, size, type, src }

  /* ---------- authorization / modal ---------- */
  function setAuthorized() {
    authorized = true;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (err) { /* noop */ }
    if (uploadStatus) {
      uploadStatus.textContent = 'Session authorized — post photos & videos';
      uploadStatus.classList.add('is-ok');
    }
    if (uploadOpen) {
      uploadOpen.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V5m0 0l-4.5 4.5M12 5l4.5 4.5"/><path d="M4 16v3.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V16"/></svg> Add Media';
    }
    if (uploadZone) {
      uploadZone.hidden = false;
      gsap.fromTo(uploadZone, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
    }
  }

  function openVaultModal() {
    if (!modalEl) return;
    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-locked');
    if (lenis) lenis.stop();
    if (toastEl) { toastEl.textContent = ''; toastEl.className = 'lock-toast'; }
    if (statusEl) statusEl.textContent = 'Access Restricted';
    if (passEl) passEl.value = '';
    setTimeout(function () { if (nameEl) nameEl.focus(); }, 420);
  }

  function closeVaultModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-locked');
    if (lenis) lenis.start();
  }

  var modalClose = $('#modalClose');
  var modalBackdrop = modalEl ? modalEl.querySelector('.vault-modal__backdrop') : null;
  if (modalClose) modalClose.addEventListener('click', closeVaultModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeVaultModal);

  function failAuth() {
    toastEl.textContent = 'Access denied — invalid credentials. Please retry.';
    toastEl.classList.remove('is-ok');
    toastEl.classList.add('is-error');
    lockCard.classList.remove('shake');
    void lockCard.offsetWidth;
    lockCard.classList.add('shake');
    passEl.value = '';
    passEl.focus();
    gsap.fromTo(toastEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
  }

  if (passToggle) {
    passToggle.addEventListener('click', function () {
      var hidden = passEl.type === 'password';
      passEl.type = hidden ? 'text' : 'password';
      passToggle.textContent = hidden ? 'Hide' : 'Show';
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = nameEl.value.trim() === CREDENTIALS.name && passEl.value === CREDENTIALS.password;
      if (!ok) { failAuth(); return; }
      toastEl.textContent = 'Access granted — session authorized.';
      toastEl.classList.remove('is-error');
      toastEl.classList.add('is-ok');
      if (statusEl) statusEl.textContent = 'Access Granted';
      setTimeout(function () { closeVaultModal(); setAuthorized(); }, 700);
    });
  }

  if (uploadOpen) {
    uploadOpen.addEventListener('click', function () {
      if (authorized) { if (uploadInput) uploadInput.click(); }
      else { openVaultModal(); }
    });
  }
  if (uploadPick) {
    uploadPick.addEventListener('click', function () { if (uploadInput) uploadInput.click(); });
  }

  /* ---------- media pipeline ---------- */
  function readableSize(bytes) {
    if (!bytes) return '';
    var units = ['B', 'KB', 'MB', 'GB'];
    var n = bytes, i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
    return (i === 0 ? Math.round(n) : n.toFixed(1)) + ' ' + units[i];
  }

  function addMediaEntry(entry, src, animate) {
    var item = document.createElement('article');
    item.className = 'g-item';
    item.setAttribute('data-cat', entry.cat);

    var media = document.createElement('div');
    media.className = 'g-media g-media--live';
    if (entry.cat === 'photo') {
      var img = document.createElement('img');
      img.className = 'g-preview';
      img.src = src;
      img.alt = entry.name;
      img.loading = 'lazy';
      media.appendChild(img);
    } else {
      var vid = document.createElement('video');
      vid.className = 'g-preview';
      vid.src = src;
      vid.controls = true;
      vid.preload = 'metadata';
      media.appendChild(vid);
    }

    var meta = document.createElement('div');
    meta.className = 'g-meta';
    var tag = document.createElement('span');
    tag.className = 'g-tag';
    tag.textContent = entry.cat === 'photo' ? 'Photo' : 'Video';
    var name = document.createElement('h4');
    name.className = 'g-name';
    name.textContent = entry.name;
    var sub = document.createElement('p');
    sub.className = 'g-sub';
    sub.textContent = (entry.cat === 'photo' ? 'Image' : 'Video') + ' · ' + readableSize(entry.size);
    meta.appendChild(tag); meta.appendChild(name); meta.appendChild(sub);

    item.appendChild(media);
    item.appendChild(meta);
    if (galleryGrid) galleryGrid.appendChild(item);
    if (animate !== false) {
      gsap.fromTo(item, { y: 36, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
    }
  }

  function persistUploads() {
    try {
      var json = JSON.stringify(uploads);
      if (json.length > 3.4 * 1024 * 1024) return false;
      localStorage.setItem(MEDIA_KEY, json);
      return true;
    } catch (err) {
      return false;
    }
  }

  function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    var mediaFiles = files.filter(function (f) {
      return /^image\//.test(f.type) || /^video\//.test(f.type);
    });
    if (!mediaFiles.length) {
      if (uploadStatus) uploadStatus.textContent = 'No supported photos or videos selected.';
      return;
    }
    mediaFiles.forEach(function (file) {
      var cat = /^image\//.test(file.type) ? 'photo' : 'video';
      var label = file.name || (cat === 'photo' ? 'Photo' : 'Video');
      var url = URL.createObjectURL(file);
      addMediaEntry({ cat: cat, name: label, size: file.size, type: file.type }, url, true);
      if (file.size <= 3.5 * 1024 * 1024) {
        (function (f, c) {
          var reader = new FileReader();
          reader.onload = function (e) {
            uploads.push({ cat: c, name: f.name || 'Untitled', size: f.size, type: f.type, src: String(e.target.result) });
            persistUploads();
          };
          reader.readAsDataURL(f);
        })(file, cat);
      } else {
        // preview kept for this session only — too large to persist
      }
    });
    if (uploadStatus) {
      uploadStatus.textContent = mediaFiles.length + (mediaFiles.length === 1 ? ' file added' : ' files added') + ' to the archive.';
      uploadStatus.classList.add('is-ok');
    }
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', function (e) {
      handleFiles(e.target.files);
      uploadInput.value = '';
    });
  }

  if (uploadZone) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      uploadZone.addEventListener(ev, function (e) {
        e.preventDefault();
        uploadZone.classList.add('upload-zone--over');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      uploadZone.addEventListener(ev, function (e) {
        e.preventDefault();
        uploadZone.classList.remove('upload-zone--over');
        if (ev === 'drop' && e.dataTransfer) handleFiles(e.dataTransfer.files);
      });
    });
  }

  /* ---------- restore persisted session & uploads ---------- */
  (function restoreVault() {
    try { if (sessionStorage.getItem(SESSION_KEY) === '1') setAuthorized(); } catch (err) { /* noop */ }
    var raw = null;
    try { raw = localStorage.getItem(MEDIA_KEY); } catch (err) { /* noop */ }
    if (!raw) return;
    var list = null;
    try { list = JSON.parse(raw); } catch (err) { try { localStorage.removeItem(MEDIA_KEY); } catch (e2) { /* noop */ } return; }
    if (!Array.isArray(list)) return;
    list.forEach(function (entry) {
      if (!entry || !entry.src) return;
      if (entry.cat !== 'photo' && entry.cat !== 'video') return;
      uploads.push(entry);
      addMediaEntry(entry, entry.src, false);
    });
  })();

  /* ---------------------------------------------------------------
     GALLERY FILTERS
  --------------------------------------------------------------- */
  if (galleryEl) {
    $$('.gal-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.gal-filter').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var filter = btn.getAttribute('data-filter');
        $$('.g-item', galleryEl).forEach(function (item) {
          var show = filter === 'all' || item.getAttribute('data-cat') === filter;
          if (show) {
            item.style.display = '';
            gsap.to(item, { autoAlpha: 1, scale: 1, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
          } else {
            gsap.to(item, {
              autoAlpha: 0, scale: 0.96, duration: 0.4, ease: 'power2.in', overwrite: 'auto',
              onComplete: function () { item.style.display = 'none'; }
            });
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------
     CLIPBOARD COPY (discord handle)
  --------------------------------------------------------------- */
  function copyText(text, done) {
    var ok = function () { if (done) done(); };
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); ok(); } catch (err) { /* noop */ }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  $$('[data-copy]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var val = el.getAttribute('data-copy');
      var label = el.querySelector('.c-copy');
      var old = label ? label.textContent : '';
      copyText(val, function () {
        if (label) {
          label.textContent = 'Copied — handle on clipboard';
          setTimeout(function () { label.textContent = old; }, 1800);
        }
      });
    });
  });

  /* ---------------------------------------------------------------
     MAINTENANCE
  --------------------------------------------------------------- */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  window.addEventListener('resize', function () {
    if (lenis) lenis.resize();
    ScrollTrigger.refresh();
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) ScrollTrigger.refresh();
  });
})();