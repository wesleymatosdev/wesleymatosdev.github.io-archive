// main.js — horizontal scroll engine + HUD + data rendering.
(() => {
  'use strict';

  const stage = document.querySelector('.stage');
  const track = document.querySelector('.track');
  const beats = Array.from(document.querySelectorAll('.beat'));
  const levelEl = document.querySelector('.hud .level');
  const segsEl = document.querySelector('.hud .segments');
  const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const data = window.HIRE_DATA || {};

  // ---------- HUD segments ----------
  const segBtns = beats.map((beat, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Go to ' + (beat.dataset.title || ('section ' + (i + 1))));
    b.innerHTML = '<span class="fill"></span>';
    b.addEventListener('click', () => gotoBeat(i));
    segsEl.appendChild(b);
    return b;
  });

  // ---------- data-driven cards ----------
  const makeIcon = name => {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    window.PIXEL.drawIcon(c, name, 3);
    return c;
  };

  if (data.proof) {
    const row = document.querySelector('.proof-row');
    data.proof.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      const top = document.createElement('div');
      top.className = 'card-top';
      top.appendChild(makeIcon(p.icon));
      const kind = document.createElement('span');
      kind.className = 'kind';
      kind.textContent = p.kind;
      top.appendChild(kind);
      card.appendChild(top);

      const h3 = document.createElement('h3');
      h3.textContent = p.name;
      card.appendChild(h3);
      const d = document.createElement('p');
      d.textContent = p.desc;
      card.appendChild(d);

      const tags = document.createElement('div');
      tags.className = 'tags';
      (p.tags || []).forEach(t => {
        const i = document.createElement('i');
        i.textContent = t;
        tags.appendChild(i);
      });
      card.appendChild(tags);

      const link = document.createElement('a');
      link.className = 'card-link';
      link.textContent = p.linkLabel || '';
      if (p.link) { link.href = p.link; link.target = '_blank'; link.rel = 'noopener'; }
      else link.classList.add('none');
      card.appendChild(link);
      row.appendChild(card);
    });
  }

  if (data.now) {
    const grid = document.querySelector('.now-grid');
    data.now.forEach(n => {
      const card = document.createElement('article');
      card.className = 'now-card';
      const head = document.createElement('header');
      head.appendChild(makeIcon(n.icon));
      const h3 = document.createElement('h3');
      h3.textContent = n.title;
      head.appendChild(h3);
      card.appendChild(head);

      const st = document.createElement('span');
      st.className = 'status' + (n.live ? ' live' : ' quiet');
      st.textContent = n.status;
      card.appendChild(st);

      const d = document.createElement('p');
      d.textContent = n.desc;
      card.appendChild(d);
      grid.appendChild(card);
    });
  }

  if (data.numbers) {
    const grid = document.querySelector('.numbers');
    data.numbers.forEach(n => {
      const cell = document.createElement('div');
      cell.className = 'number';
      const val = document.createElement('div');
      val.className = 'val';
      val.appendChild(document.createTextNode(n.prefix || ''));
      const count = document.createElement('b');
      count.textContent = '0';
      count.dataset.count = n.value;
      val.appendChild(count);
      const suffix = document.createElement('small');
      suffix.textContent = n.suffix || '';
      val.appendChild(suffix);
      const lbl = document.createElement('div');
      lbl.className = 'lbl';
      lbl.textContent = n.label;
      cell.append(val, lbl);
      grid.appendChild(cell);
    });
  }

  if (data.ticker) {
    const ticker = document.querySelector('.ticker');
    const line = s => {
      const sp = document.createElement('span');
      const [head, ...rest] = s.split(':');
      const b = document.createElement('b'); b.textContent = head + ':';
      sp.appendChild(b);
      sp.appendChild(document.createTextNode(' ' + rest.join(':').trim()));
      return sp;
    };
    data.ticker.forEach(s => ticker.appendChild(line(s)));
    data.ticker.forEach(s => ticker.appendChild(line(s))); // duplicated for the -50% loop
  }

  // experience era icons
  document.querySelectorAll('.era[data-icon]').forEach(era => {
    era.appendChild(makeIcon(era.dataset.icon));
  });

  // in-page jumps (nav brand, hero CTAs)
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      gotoBeat(parseInt(el.dataset.goto, 10) || 0);
    });
  });

  // ---------- canvases ----------
  window.PIXEL.drawBrand(document.querySelector('.topnav .brand canvas'));
  const cmdCanvas = document.querySelector('.fleet-scene canvas');
  const backdrop = window.PIXEL.makeBackdrop(document.querySelector('#bg'));

  const reduced = () => motionMq.matches;
  const cmdIndex = beats.findIndex(b => b.classList.contains('beat--fleet'));
  const numbersIndex = beats.findIndex(b => b.classList.contains('beat--numbers'));
  let countersDone = false;

  function runCounters() {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      if (reduced()) { el.textContent = target; return; }
      const t0 = performance.now(), dur = 900;
      const step = now => {
        const p = clamp((now - t0) / dur, 0, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ---------- engine ----------
  let target = 0, current = 0, max = 0, raf = null;
  let active = -1;
  let dragging = false, dragMoved = 0, dragStartX = 0, dragStartTarget = 0, suppressClick = false;
  let touchAxis = null, touchStartX = 0, touchStartY = 0, touchStartTarget = 0;

  function measure() {
    max = Math.max(0, track.scrollWidth - stage.clientWidth);
    target = clamp(target, 0, max);
  }

  function beatOffset(i) { return beats[i].offsetLeft; }

  function gotoBeat(i) {
    i = clamp(i, 0, beats.length - 1);
    target = beatOffset(i);
    wake();
  }

  function updateActive() {
    const probe = current + stage.clientWidth * .45;
    let idx = 0;
    for (let i = 0; i < beats.length; i++) if (beatOffset(i) <= probe) idx = i;
    if (idx !== active) {
      active = idx;
      const title = beats[idx].dataset.title || '';
      levelEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + title;
      segBtns.forEach((b, i) => {
        b.classList.toggle('active', i === idx);
        b.classList.toggle('done', i < idx);
      });
      if (idx === numbersIndex) runCounters();
    }
  }

  let lastT = 0;
  function tick(t) {
    raf = null;
    const dt = lastT ? Math.min(120, t - lastT) : 16;
    lastT = t;
    // time-based lerp: same feel at 60fps, 20fps, or a throttled background tab
    const k = reduced() ? 1 : 1 - Math.exp(-dt / 120);
    current += (target - current) * k;
    if (Math.abs(target - current) < .5) current = target;
    track.style.transform = 'translate3d(' + (-Math.round(current * 100) / 100) + 'px,0,0)';

    const frac = max ? current / max : 0;
    segBtns.forEach((b, i) => {
      const f = i === active ? 1 : clamp(frac * segBtns.length - i, 0, 1);
      b.querySelector('.fill').style.width = (f * 100) + '%';
    });
    updateActive();

    backdrop.render(current, t, reduced());
    if (Math.abs(active - cmdIndex) <= 1) window.PIXEL.renderCommand(cmdCanvas, t, reduced());
    if (window.ARCADE) window.ARCADE.notify();

    const idle = current === target && !dragging;
    if (!idle || !reduced()) wake();  // keep animating (sprites/starfield) unless reduced
  }

  function wake() {
    if (raf === null && !document.hidden) raf = requestAnimationFrame(tick);
  }

  // wheel → horizontal (ctrlKey = pinch-zoom, leave it to the browser)
  window.addEventListener('wheel', e => {
    if (e.ctrlKey) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    e.preventDefault();
    target = clamp(target + d, 0, max);
    wake();
  }, { passive: false });

  // touch swipe: axis locks on first decisive move — horizontal drives the journey,
  // vertical stays native (touch-action: pan-y lets the browser have it)
  stage.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { touchAxis = 'multi'; return; }
    touchAxis = null;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTarget = target;
  }, { passive: true });
  stage.addEventListener('touchmove', e => {
    if (touchAxis === 'multi' || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (!touchAxis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      touchAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }
    if (touchAxis === 'x') {
      e.preventDefault();
      target = clamp(touchStartTarget - dx, 0, max);
      wake();
    }
  }, { passive: false });
  const endTouch = () => { touchAxis = null; };
  stage.addEventListener('touchend', endTouch);
  stage.addEventListener('touchcancel', endTouch);

  // mouse/pen drag (touch has the dedicated path above)
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;
    if (e.target.closest('a, button, input, textarea, select')) return;
    dragging = true; dragMoved = 0;
    dragStartX = e.clientX; dragStartTarget = target;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    dragMoved = Math.max(dragMoved, Math.abs(dx));
    if (dragMoved > 6) {
      document.body.classList.add('dragging');
      suppressClick = true;
      target = clamp(dragStartTarget - dx, 0, max);
      wake();
    }
  });
  const endDrag = () => { dragging = false; document.body.classList.remove('dragging'); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
  }, true);

  // keyboard
  window.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    // while the arcade beat is being played, it owns the arrow keys
    if (window.ARCADE && window.ARCADE.wantsKeys() && ['ArrowRight', 'ArrowDown', 'PageDown', 'ArrowLeft', 'ArrowUp', 'PageUp', 'Home', 'End'].includes(e.key)) return;
    const step = stage.clientWidth * .8;
    const map = {
      ArrowRight: target + step, ArrowDown: target + step, PageDown: target + step,
      ArrowLeft: target - step, ArrowUp: target - step, PageUp: target - step,
      Home: 0, End: max
    };
    if (e.key in map) {
      e.preventDefault();
      target = clamp(map[e.key], 0, max);
      wake();
    }
  });

  // focus moves → bring its beat into view
  window.addEventListener('focusin', e => {
    const beat = e.target.closest && e.target.closest('.beat');
    if (!beat) return;
    const i = beats.indexOf(beat);
    if (i >= 0) gotoBeat(i);
  });

  // init / resize / mode switches
  function initStatic() {
    // one static frame of every scene (also covers mobile + reduced motion)
    const t = performance.now();
    backdrop.render(current, t, reduced());
    window.PIXEL.renderCommand(cmdCanvas, t, reduced());
  }

  function resetEngine() {
    measure();
    target = clamp(target, 0, max);
    initStatic();
    wake();
  }

  window.addEventListener('resize', () => { measure(); resetEngine(); });
  motionMq.addEventListener('change', resetEngine);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });

  measure();
  updateActive();
  initStatic();
  wake();
})();
