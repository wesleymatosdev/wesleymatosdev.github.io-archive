/* Variant A behavior: floating nav toggle + full-height mobile menu (B7),
   IntersectionObserver scroll reveals (600–800ms, once),
   B11 tagline word-by-word reveal.
   Motion uses the base curve in CSS; reduced motion degrades to plain opacity. */

(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  doc.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Floating nav + mobile menu ---------- */

  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', open);
    if (open) {
      menu.removeAttribute('inert');
    } else {
      menu.setAttribute('inert', '');
    }
  }

  if (toggle && menu) {
    setMenu(false);
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Scroll reveals: rise 32px + fade, once ---------- */

  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Tagline reveal: words activate one at a time (B11) ---------- */

  var tagline = document.querySelector('.tagline-text');

  if (tagline && !reduceMotion.matches) {
    var words = tagline.textContent.trim().split(/\s+/);
    tagline.textContent = '';
    var spans = words.map(function (word, i) {
      var span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      /* 40ms per word keeps activation in reading order (B11: one at a time) */
      span.style.transitionDelay = Math.min(i * 40, 600) + 'ms';
      tagline.appendChild(span);
      if (i < words.length - 1) tagline.appendChild(document.createTextNode(' '));
      return span;
    });

    if ('IntersectionObserver' in window) {
      var wordWatcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
            wordWatcher.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -35% 0px' });

      spans.forEach(function (span) { wordWatcher.observe(span); });
    } else {
      spans.forEach(function (span) { span.classList.add('on'); });
    }
  }
})();
