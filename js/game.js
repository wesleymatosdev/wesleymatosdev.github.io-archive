// game.js — DEFEND beat: a space-invaders style arcade in the site's pixel engine.
// One interceptor vs waves of tangle-bugs (knots of wire). Same rules as the rest
// of the site: no assets, no CDN, palette chars from pixel.js, works from file://.
// Sound is OFF by default — user has to flip the switch (persisted).
(() => {
  'use strict';

  const PIXEL = window.PIXEL;
  if (!PIXEL) return;

  // ---------- dom ----------
  const beat = document.getElementById('arcade');
  if (!beat) return;
  const canvas = document.getElementById('arc-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('arc-score');
  const bestEl = document.getElementById('arc-best');
  const waveEl = document.getElementById('arc-wave');
  const livesEl = document.getElementById('arc-lives');
  const sndBtn = document.getElementById('arc-snd');
  const overlay = document.getElementById('arc-overlay');
  const banner = document.getElementById('arc-banner');
  const finalEl = document.getElementById('arc-final');
  const finalBestEl = document.getElementById('arc-final-best');
  const screens = {};
  overlay.querySelectorAll('[data-screen]').forEach(el => { screens[el.dataset.screen] = el; });

  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionMq.matches;

  // ---------- sprites (palette chars, same as pixel.js) ----------
  // tangle-bugs: knots of wire, two frames each (the twitch)
  const BUG_A = [[ // violet overhand knot — 30 pts
    '...kkkkkk...',
    '..kvvvvvvk..',
    '.kvvkvvkvvk.',
    'kvvvvkkvvvvk',
    'kVkvkvvkvkVk',
    '.kvvkvvkvvk.',
    '..kvk..kvk..',
    '..kk....kk..'
  ], [
    '...kkkkkk...',
    '..kvvvvvvk..',
    '.kvkvvvkvkk.',
    'kvvkkvvkkvvk',
    'kVkvkkvkkvVk',
    '.kvkvkkvkvk.',
    '..kvk..kvk..',
    '..kk....kk..'
  ]];
  const BUG_B = [[ // orange coil — 20 pts
    '..kkkkkkk...',
    '.koooooook..',
    'kokokokokok.',
    'koooooooook.',
    'kokokokokok.',
    '.koooooook..',
    '..kk.kk.kk..',
    '..kk....kk..'
  ], [
    '..kkkkkkk...',
    '.koooooook..',
    'k.kokokokok.',
    '.kooooooook.',
    'k.kokokokok.',
    '.koooooook..',
    '..kk.kk.kk..',
    '..kk....kk..'
  ]];
  const BUG_C = [[ // yellow frayed scrap — 10 pts
    '..kkkkkk..',
    '.kyyyyyyk.',
    'kyykyykyyk',
    'kyyyyyyyyk',
    '.kykyykyk.',
    '..kyyyyk..',
    '.kyk..kyk.',
    '.kk....kk.'
  ], [
    '..kkkkkk..',
    '.kyyyyyyk.',
    'kykykyykyk',
    'kyyyyyyyyk',
    '.kyykyyky.',
    '..kyyyyk..',
    '.kyk..kyk.',
    '.kk....kk.'
  ]];
  const SHIP = [[
    '......k......',
    '.....kmk.....',
    '....kmmmk....',
    '.k..kvmvk..k.',
    '.kkkvmmmvkkk.',
    'kmmmmmmmmmmmk',
    '.kkkkkkkkkkk.'
  ], [
    '......k......',
    '.....kmk.....',
    '....kmmmk....',
    '.k..kvmvk..k.',
    '.kkkvmmmvkkk.',
    'kmmmmmmmmmmmk',
    '.kkkkkkkkkkk.',
    '..o...o...o..'
  ], [
    '......k......',
    '.....kmk.....',
    '....kmmmk....',
    '.k..kvmvk..k.',
    '.kkkvmmmvkkk.',
    'kmmmmmmmmmmmk',
    '.kkkkkkkkkkk.',
    '..y...y...y..'
  ]];
  const BOOM = [
    '.y..y.y..y.',
    '..y.y.y.y..',
    'y..wowow..y',
    '.yywoooowyy',
    'y..wowow..y',
    '..y.y.y.y..',
    '.y..y.y..y.',
    '...........'
  ];
  const UFO = [[
    '.....kkkkkk.....',
    '...kkyyyyyykk...',
    '..kyoyoyoyoyk...',
    '.kyyoyoyoyoyyk..',
    'kkkkkkkkkkkkkkkk',
    '...kk..kk..kk...'
  ], [
    '.....kkkkkk.....',
    '...kkoooooookk..',
    '..kyoyoyoyoyk...',
    '.koooooooyooyk..',
    'kkkkkkkkkkkkkkkk',
    '...kk..kk..kk...'
  ]];
  const BOLT_A = ['y..', '.y.', '..y', '.y.', 'y..'];
  const BOLT_B = ['..y', '.y.', 'y..', '.y.', '..y'];
  // the mothership from the old hero animation — returns as the final boss every 5th wave
  const BOSS_SHIP = [
    '......kkkkkkkkkkkk......',
    '....kkVVVVVVVVVVVVkk....',
    '..kkVVVVVVVVVVVVVVVVkk..',
    '.kVvmmvmmvmmvmmvmmvmmVk.',
    '.kVVVVVVVVVVVVVVVVVVVVk.',
    '..kkkkkkkkkkkkkkkkkkkk..',
    '.....o.......o.......o..'
  ];
  const BOSS_W = 24 * 3, BOSS_H = 7 * 3;

  const spriteW = rows => Math.max(...rows.map(r => r.length));

  // ---------- tunables (logical px; playfield is 320x180) ----------
  const W = 320, H = 180;
  const SHIP_W = 13, SHIP_H = 7, SHIP_Y = H - 17, SHIP_SPEED = 110;
  const COLS = 5, ROWS = 4, CELL_W = 24, CELL_H = 13;
  const GRID_W = COLS * CELL_W;
  // difficulty ramp: a 5th (elite) row joins from wave 3
  const ROW_SPRITE = [BUG_A, BUG_B, BUG_B, BUG_C, BUG_A];   // top → bottom
  const ROW_POINTS = [30, 20, 20, 10, 30];
  const BUNKER_Y = 138, BUNKER_W = 26, BUNKER_H = 16;
  const INVASION_Y = SHIP_Y + 2;

  // ---------- state ----------
  let state = 'title';          // title | playing | paused | over
  let score = 0, best = parseInt(store.get('hire-site.arcade.best', '0'), 10) || 0;
  let wave = 1, lives = 3, bugTotal = COLS * ROWS;
  let shipX = (W - SHIP_W) / 2, shipDesiredX = null;
  let invulnUntil = 0, freezeUntil = 0;
  let bugs = [], marchDir = 1, marchTimer = 0, marchFrame = 0, marchAlt = false;
  let bullets = [], bolts = [], booms = [], debris = [], ufo = null;
  let boss = null, bossPhase = false, floaters = [];
  let fireCooldown = 0, boltTimer = 0, ufoTimer = 14000;
  let flashUntil = 0;
  let soundOn = store.get('hire-site.arcade.sound', 'off') === 'on';
  let raf = null, lastT = 0;

  // bunkers: erodible pixel grids, one offscreen canvas each
  const bunkers = [];
  // ---------- state ----------
  // junction boxes: 3 walls on wave 1, 2 on wave 2, the middle one on wave 3,
  // then you're on your own (Wesley's spec, voice note 3)
  const WALL_CENTERS = {
    3: [64, 160, 256],
    2: [107, 213],
    1: [160],
    0: []
  };
  function buildBunkers() {
    bunkers.length = 0;
    const centers = WALL_CENTERS[Math.max(0, Math.min(3, 4 - wave))];
    for (const cx of centers) {
      const grid = new Uint8Array(BUNKER_W * BUNKER_H);
      for (let y = 0; y < BUNKER_H; y++) {
        for (let x = 0; x < BUNKER_W; x++) {
          let solid = 1;
          if (y >= 10 && x > 7 && x < 18) solid = 0;              // entry arch
          if (y < 3 && (x < 2 - y || x > BUNKER_W - 3 + y)) solid = 0; // shoulder cuts
          grid[y * BUNKER_W + x] = solid;
        }
      }
      const cnv = document.createElement('canvas');
      cnv.width = BUNKER_W; cnv.height = BUNKER_H;
      bunkers.push({ x: cx - BUNKER_W / 2, y: BUNKER_Y, grid, cnv, dirty: true });
    }
  }
  function bunkerErode(b, px, py, r) {
    const r2 = r * r;
    for (let y = Math.max(0, Math.floor(py - r)); y <= Math.min(BUNKER_H - 1, Math.ceil(py + r)); y++) {
      for (let x = Math.max(0, Math.floor(px - r)); x <= Math.min(BUNKER_W - 1, Math.ceil(px + r)); x++) {
        const dx = x + .5 - px, dy = y + .5 - py;
        if (dx * dx + dy * dy <= r2) b.grid[y * BUNKER_W + x] = 0;
      }
    }
    b.dirty = true;
  }
  function bunkerSolidAt(b, x, y) {
    const gx = Math.floor(x - b.x), gy = Math.floor(y - b.y);
    if (gx < 0 || gy < 0 || gx >= BUNKER_W || gy >= BUNKER_H) return false;
    return b.grid[gy * BUNKER_W + gx] === 1;
  }
  function drawBunker(b) {
    const c = b.cnv.getContext('2d');
    c.clearRect(0, 0, BUNKER_W, BUNKER_H);
    for (let y = 0; y < BUNKER_H; y++) {
      for (let x = 0; x < BUNKER_W; x++) {
        if (!b.grid[y * BUNKER_W + x]) continue;
        const edge = y === 0 || x === 0 || y === BUNKER_H - 1 || x === BUNKER_W - 1 ||
          !b.grid[(y - 1) * BUNKER_W + x] || !b.grid[y * BUNKER_W + x - 1];
        c.fillStyle = edge ? '#61f0bd' : '#2e9d7d';
        c.fillRect(x, y, 1, 1);
      }
    }
    b.dirty = false;
  }

  // ---------- audio (OFF until the user flips the switch) ----------
  let audio = null;
  function ensureAudio() {
    if (!soundOn) return null;
    if (!audio) {
      try { audio = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { soundOn = false; syncSndBtn(); return null; }
    }
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    return audio;
  }
  function beep(type, f0, f1, dur, vol, delay = 0) {
    const ac = ensureAudio();
    if (!ac) return;
    try {
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t); o.stop(t + dur + .02);
    } catch (e) { /* never let sfx break the game */ }
  }
  function noiseBurst(dur, vol, delay = 0) {
    const ac = ensureAudio();
    if (!ac) return;
    try {
      const t = ac.currentTime + delay;
      const len = Math.floor(ac.sampleRate * dur);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource(), g = ac.createGain();
      src.buffer = buf;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      src.connect(g).connect(ac.destination);
      src.start(t);
    } catch (e) { /* ditto */ }
  }
  const sfx = {
    shoot: () => beep('square', 880, 240, .09, .04),
    hit: () => { beep('triangle', 320, 60, .14, .06); noiseBurst(.08, .03); },
    shipHit: () => { beep('sawtooth', 160, 32, .5, .08); noiseBurst(.4, .06); },
    march: () => beep('square', marchAlt ? 96 : 72, 0, .06, .03),
    packet: () => { beep('square', 660, 0, .05, .04); beep('square', 880, 0, .05, .04, .06); beep('square', 1100, 0, .07, .04, .12); },
    waveClear: () => [440, 587, 784, 1047].forEach((f, i) => beep('square', f, 0, .09, .04, i * .09)),
    over: () => [392, 262, 131].forEach((f, i) => beep('triangle', f, 0, .22, .05, i * .2))
  };
  function syncSndBtn() {
    sndBtn.textContent = soundOn ? 'SOUND: ON' : 'SOUND: OFF';
    sndBtn.setAttribute('aria-pressed', String(soundOn));
  }
  sndBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    store.set('hire-site.arcade.sound', soundOn ? 'on' : 'off');
    syncSndBtn();
    if (soundOn) sfx.hit();  // confirmation blip, only ever after the user's own click
    sndBtn.blur();
  });
  syncSndBtn();

  // ---------- hud dom ----------
  const pad4 = n => String(Math.min(9999, n)).padStart(4, '0');
  function syncHud() {
    scoreEl.textContent = pad4(score);
    bestEl.textContent = pad4(best);
    waveEl.textContent = String(wave);
    const lc = livesEl.querySelector('canvas');
    lc.width = 3 * 16; lc.height = SHIP_H + 1;
    const lctx = lc.getContext('2d');
    for (let i = 0; i < Math.max(0, lives); i++) PIXEL.drawGrid(lctx, SHIP[0], i * 16, 0, 1);
  }
  function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => { el.hidden = k !== name; });
    overlay.hidden = !name;
  }
  let bannerTimer = null;
  function showBanner(text) {
    banner.textContent = text;
    banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.remove('show'), 1100);
  }

  // ---------- waves ----------
  function spawnWave() {
    bugs = [];
    const rows = wave >= 3 ? 5 : 4;   // the elite row shows up at wave 3 and stays
    bugTotal = COLS * rows;
    const startY = 22 + Math.min(24, (wave - 1) * 6);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < COLS; col++) {
        bugs.push({
          col, row,
          x: 100 + col * CELL_W + Math.floor((CELL_W - spriteW(ROW_SPRITE[row][0])) / 2),
          y: startY + row * CELL_H,
          type: row
        });
      }
    }
    marchDir = 1; marchTimer = 0; marchFrame = 0; marchAlt = false;
    bullets = []; bolts = []; booms = []; debris = []; ufo = null; floaters = [];
    boltTimer = 1600; ufoTimer = 12000 + Math.random() * 8000;
    buildBunkers();
    syncHud();
  }
  function resetGame() {
    score = 0; wave = 1; lives = 3;
    shipX = (W - SHIP_W) / 2; shipDesiredX = null;
    boss = null; bossPhase = false; floaters = [];
    spawnWave();
  }

  // ---------- the mothership (final boss, every 5th wave) ----------
  function spawnBoss() {
    bossPhase = true;
    const hp = 6 + wave;
    boss = { x: W / 2 - BOSS_W / 2, y: 12, hp, maxHp: hp, t: 0, fireT: 1400, dropT: 3000 };
    bugs = []; bullets = []; bolts = []; booms = []; debris = []; ufo = null; floaters = [];
    buildBunkers();
    syncHud();
  }
  function bossFire() {
    const cx = boss.x + BOSS_W / 2;
    const vx = Math.max(-50, Math.min(50, (shipX + SHIP_W / 2 - cx) * .3));
    for (const spread of [-38, vx, 38]) bolts.push({ x: cx - 1, y: boss.y + BOSS_H, vx: spread, born: 0 });
  }
  function dropMinions() {
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      floaters.push({
        x: boss.x + 12 + Math.random() * (BOSS_W - 24),
        y: boss.y + BOSS_H,
        vy: 24 + wave * 2 + Math.random() * 10,
        ph: Math.random() * 6.28,
        type: 2 + Math.floor(Math.random() * 3)
      });
    }
  }
  function bossDie() {
    score += 500;
    if (score > best) { best = score; store.set('hire-site.arcade.best', String(best)); }
    syncHud();
    for (let i = 0; i < 6; i++) {
      booms.push({ x: boss.x + 6 + Math.random() * (BOSS_W - 20), y: boss.y + Math.random() * (BOSS_H - 4), until: performance.now() + 320 + i * 110 });
    }
    for (let i = 0; i < 26; i++) {
      debris.push({
        x: boss.x + Math.random() * BOSS_W, y: boss.y + Math.random() * BOSS_H,
        vx: (Math.random() - .5) * 130, vy: -20 - Math.random() * 90,
        life: .6 + Math.random() * .5,
        c: ['y', 'o', 'w', 'v'][Math.floor(Math.random() * 4)]
      });
    }
    flashUntil = reduced() ? 0 : performance.now() + 90;
    boss = null; bossPhase = false;
    showBanner('MOTHERSHIP DOWN');
    sfx.shipHit(); sfx.waveClear();
  }

  // ---------- marching ----------
  const aliveRatio = () => bugs.length / bugTotal;
  // each wave marches ~12% faster from the start, and thins out to a frenzy as it dies
  const marchInterval = () => Math.max(60, 560 * Math.pow(.88, wave - 1) * (.2 + .8 * aliveRatio()));

  function marchStep() {
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of bugs) { minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x + 12); maxY = Math.max(maxY, b.y + 8); }
    const step = 3 * marchDir;
    if (minX + step < 4 || maxX + step > W - 4) {
      marchDir = -marchDir;
      if (state !== 'playing') return;
      for (const b of bugs) b.y += 8;
      // descending bugs chew straight through the junction boxes
      for (const b of bugs) {
        for (const bk of bunkers) {
          if (b.x < bk.x + BUNKER_W && b.x + 12 > bk.x && b.y < bk.y + BUNKER_H && b.y + 8 > bk.y) {
            bunkerErode(bk, b.x + 6 - bk.x, b.y + 4 - bk.y, 8);
          }
        }
      }
      maxY += 8;
    } else {
      for (const b of bugs) b.x += step;
    }
    marchAlt = !marchAlt;
    if (!reduced()) marchFrame = marchAlt ? 1 : 0;
    if (state === 'playing') sfx.march();
    if (maxY >= INVASION_Y && state === 'playing') gameOver(true);
  }

  // ---------- entities ----------
  function fire() {
    if (state !== 'playing' || fireCooldown > 0 || bullets.length >= 2) return;
    bullets.push({ x: shipX + 6, y: SHIP_Y - 4 });
    fireCooldown = .26;
    sfx.shoot();
  }
  function dropBolt() {
    if (!bugs.length || bolts.length >= Math.min(1 + wave, 5)) return;
    // random occupied column, bottom-most bug fires
    const cols = [...new Set(bugs.map(b => b.col))];
    const col = cols[Math.floor(Math.random() * cols.length)];
    let shooter = null;
    for (const b of bugs) if (b.col === col && (!shooter || b.y > shooter.y)) shooter = b;
    bolts.push({ x: shooter.x + 5, y: shooter.y + 8, born: 0 });
  }
  function explode(x, y, n) {
    booms.push({ x: x - 5, y: y - 4, until: performance.now() + 190 });
    for (let i = 0; i < n; i++) {
      debris.push({
        x: x + (Math.random() - .5) * 8, y: y + (Math.random() - .5) * 6,
        vx: (Math.random() - .5) * 90, vy: -30 - Math.random() * 60,
        life: .45 + Math.random() * .3,
        c: ['y', 'o', 'w', 'v'][Math.floor(Math.random() * 4)]
      });
    }
  }
  const DEBRIS_COLOR = { y: '#ffd27d', o: '#ffb27d', w: '#f5f7ff', v: '#9b7cff' };

  function shipHit() {
    if (performance.now() < invulnUntil) return;
    explode(shipX + 6, SHIP_Y + 3, 18);
    flashUntil = reduced() ? 0 : performance.now() + 70;
    sfx.shipHit();
    lives--;
    syncHud();
    if (lives <= 0) { gameOver(false); return; }
    freezeUntil = performance.now() + 900;
    shipX = (W - SHIP_W) / 2; shipDesiredX = null;
    invulnUntil = performance.now() + 1700;
  }

  function gameOver(invasion) {
    state = 'over';
    if (score > best) { best = score; store.set('hire-site.arcade.best', String(best)); }
    finalEl.textContent = pad4(score) + (invasion ? ' · THEY LANDED' : '');
    finalBestEl.textContent = pad4(best);
    showScreen('over');
    sfx.over();
  }

  function nextWave() {
    wave++;
    if (wave % 5 === 0) { spawnBoss(); showBanner('MOTHERSHIP'); sfx.packet(); }
    else { spawnWave(); showBanner('WAVE ' + wave); sfx.waveClear(); }
    freezeUntil = performance.now() + 1100;
  }

  // ---------- update ----------
  function update(dt, now) {
    if (state === 'playing' && now < freezeUntil) return;

    // ship control
    if (state === 'playing') {
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (dir) { shipX += dir * SHIP_SPEED * dt; shipDesiredX = null; }
      else if (shipDesiredX != null) shipX += (shipDesiredX - SHIP_W / 2 - shipX) * Math.min(1, dt * 14);
      shipX = Math.max(4, Math.min(W - SHIP_W - 4, shipX));
      fireCooldown = Math.max(0, fireCooldown - dt);
      if ((keys.fire || touchFiring) && now >= freezeUntil) fire();
    }

    // march (title attract marches in place; only real play descends)
    const marching = state === 'playing' || state === 'title';
    if (marching && bugs.length) {
      marchTimer += dt * 1000;
      const iv = state === 'title' ? 640 : marchInterval();
      if (marchTimer >= iv) { marchTimer = 0; marchStep(); }
    }

    // bug bolts
    if (state === 'playing') {
      boltTimer -= dt * 1000;
      if (boltTimer <= 0) {
        dropBolt();
        boltTimer = Math.max(340, 1400 * Math.pow(.84, wave - 1)) * (.55 + Math.random() * .8);
      }
    }
    const boltSpeed = 80 + wave * 16;
    for (let i = bolts.length - 1; i >= 0; i--) {
      const bo = bolts[i];
      bo.y += boltSpeed * dt; bo.x += (bo.vx || 0) * dt; bo.born += dt;
      let dead = bo.y > H || bo.x < -4 || bo.x > W + 4;
      for (const bk of bunkers) {
        if (bo.x > bk.x - 1 && bo.x < bk.x + BUNKER_W + 1 && bo.y > bk.y && bo.y < bk.y + BUNKER_H) {
          const sx = bo.x - bk.x, sy = bo.y + 4 - bk.y;
          let hit = false;
          for (let yy = 0; yy < 5 && !hit; yy++) for (let xx = 0; xx < 3 && !hit; xx++)
            if (bunkerSolidAt(bk, sx + xx, sy + yy)) hit = true;
          if (hit) { bunkerErode(bk, sx + 1, sy + 2, 3); dead = true; }
        }
      }
      if (!dead && state === 'playing' && now >= invulnUntil &&
          bo.x + 2 > shipX + 2 && bo.x < shipX + SHIP_W - 2 && bo.y + 5 > SHIP_Y && bo.y < SHIP_Y + SHIP_H) {
        dead = true;
        shipHit();
      }
      if (dead) bolts.splice(i, 1);
    }

    // boss minions drifting down out of the tractor beam
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y += f.vy * dt;
      f.x += Math.sin(now / 400 + f.ph) * 36 * dt;
      let dead = f.y > H + 8;
      if (!dead && state === 'playing' && now >= invulnUntil &&
          f.x + 12 > shipX + 1 && f.x < shipX + SHIP_W - 1 && f.y + 8 > SHIP_Y && f.y < SHIP_Y + SHIP_H) {
        dead = true;
        explode(f.x + 6, f.y + 4, 10);
        shipHit();
      }
      if (dead) floaters.splice(i, 1);
    }

    // player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bu = bullets[i];
      bu.y -= 220 * dt;
      let dead = bu.y < 12;
      if (!dead && ufo && bu.x + 1 > ufo.x && bu.x < ufo.x + 16 && bu.y < 14 && bu.y > 6) {
        explode(ufo.x + 8, 10, 12);
        ufo = null;
        dead = true;
        score += 100; syncHud();
        sfx.packet();
      }
      if (!dead && boss && bu.x > boss.x && bu.x < boss.x + BOSS_W && bu.y < boss.y + BOSS_H && bu.y > boss.y) {
        dead = true;
        boss.hp--;
        explode(bu.x, boss.y + BOSS_H - 3, 4);
        sfx.hit();
        if (boss.hp <= 0) bossDie();
      }
      for (const f of floaters) {
        if (!dead && bu.x + 1 > f.x && bu.x < f.x + 12 && bu.y < f.y + 8 && bu.y + 4 > f.y) {
          dead = true;
          floaters.splice(floaters.indexOf(f), 1);
          score += ROW_POINTS[f.type];
          if (score > best) { best = score; store.set('hire-site.arcade.best', String(best)); }
          syncHud();
          explode(f.x + 6, f.y + 4, 9);
          sfx.hit();
          break;
        }
      }
      for (const bk of bunkers) {
        if (!dead && bu.x >= bk.x && bu.x < bk.x + BUNKER_W && bu.y + 3 >= bk.y && bu.y <= bk.y + BUNKER_H) {
          // sample the full 4px body so fast bullets can't tunnel through a wall
          for (let yy = 0; yy < 4 && !dead; yy++) {
            if (bunkerSolidAt(bk, bu.x - bk.x, bu.y + yy - bk.y)) {
              bunkerErode(bk, bu.x - bk.x, bu.y + yy - bk.y, 2.4);
              dead = true;
            }
          }
        }
      }
      for (const b of bugs) {
        if (!dead && bu.x + 1 > b.x && bu.x < b.x + 12 && bu.y < b.y + 8 && bu.y + 4 > b.y) {
          dead = true;
          bugs.splice(bugs.indexOf(b), 1);
          score += ROW_POINTS[b.type];
          if (score > best) { best = score; store.set('hire-site.arcade.best', String(best)); }
          syncHud();
          explode(b.x + 6, b.y + 4, 9);
          sfx.hit();
          break;
        }
      }
      if (dead) bullets.splice(i, 1);
    }

    // ufo "stray packet" (not during a boss fight)
    if (state === 'playing' && !bossPhase) {
      if (!ufo) {
        ufoTimer -= dt * 1000;
        if (ufoTimer <= 0) {
          const fromLeft = Math.random() < .5;
          ufo = { x: fromLeft ? -18 : W + 2, dir: fromLeft ? 1 : -1 };
          sfx.packet();
        }
      } else {
        ufo.x += ufo.dir * 62 * dt;
        if (ufo.x < -20 || ufo.x > W + 20) { ufo = null; ufoTimer = 14000 + Math.random() * 9000; }
      }
    }

    // mothership boss: strafes, fires aimed spreads, drops minions through the beam
    if (boss && state === 'playing') {
      boss.t += dt * 1000;
      boss.x = W / 2 - BOSS_W / 2 + Math.sin(boss.t / 1700) * 92;
      boss.y = 12 + Math.sin(boss.t / 2300) * 5;
      boss.fireT -= dt * 1000;
      if (boss.fireT <= 0) { bossFire(); boss.fireT = Math.max(650, 1500 - wave * 60); }
      boss.dropT -= dt * 1000;
      if (boss.dropT <= 0) { dropMinions(); boss.dropT = Math.max(2200, 5200 - wave * 200); }
    }

    // wave clear (boss phases advance only once the mothership is down)
    if (state === 'playing' && !bossPhase && !bugs.length) nextWave();

    // fx decay
    const nowMs = performance.now();
    booms = booms.filter(b => b.until > nowMs);
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.life -= dt;
      if (d.life <= 0) { debris.splice(i, 1); continue; }
      d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 150 * dt;
    }
  }

  // ---------- render ----------
  const STARS = Array.from({ length: 42 }, (_, i) => ({
    x: (i * 97 + 31) % W, y: (i * 53 + 11) % 130,
    deep: i % 3 === 0, ph: (i * 1.7) % 6.28
  }));
  function render(now) {
    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, W, H);

    for (const s of STARS) {
      const tw = reduced() ? .8 : .55 + .45 * Math.sin(now / (700 + s.ph * 400) + s.ph);
      ctx.fillStyle = s.deep ? 'rgba(104,115,138,' + (.6 * tw).toFixed(3) + ')'
                             : 'rgba(245,247,255,' + (.9 * tw).toFixed(3) + ')';
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    const dimmed = state === 'title';
    if (dimmed) ctx.globalAlpha = .6;

    if (ufo) PIXEL.drawGrid(ctx, UFO[reduced() ? 0 : Math.floor(now / 130) % 2], Math.floor(ufo.x), 8, 1);

    for (const bk of bunkers) { if (bk.dirty) drawBunker(bk); ctx.drawImage(bk.cnv, Math.floor(bk.x), bk.y); }

    for (const b of bugs) {
      const frames = ROW_SPRITE[b.type];
      PIXEL.drawGrid(ctx, frames[marchFrame % frames.length], Math.floor(b.x), Math.floor(b.y), 1);
    }

    if (boss) {
      // tractor beam — same as the old hero animation, now the minion drop chute
      const beamA = reduced() ? .10 : .08 + .05 * Math.sin(now / 260);
      ctx.fillStyle = 'rgba(155,124,255,' + beamA.toFixed(3) + ')';
      const bx = Math.floor(boss.x) + BOSS_W / 2, by = Math.floor(boss.y) + BOSS_H;
      for (let j = 0; j < SHIP_Y - by; j++) {
        const half = 2 + Math.floor(j / 6);
        ctx.fillRect(bx - half, by + j, half * 2, 1);
      }
      PIXEL.drawGrid(ctx, BOSS_SHIP, Math.floor(boss.x), Math.floor(boss.y), 3);
      // hull integrity bar
      ctx.fillStyle = '#1b2033';
      ctx.fillRect(boss.x + 6, boss.y - 6, BOSS_W - 12, 3);
      ctx.fillStyle = '#61f0bd';
      ctx.fillRect(boss.x + 6, boss.y - 6, (BOSS_W - 12) * boss.hp / boss.maxHp, 3);
    }
    for (const f of floaters) {
      PIXEL.drawGrid(ctx, ROW_SPRITE[f.type][marchFrame % 2], Math.floor(f.x), Math.floor(f.y), 1);
    }

    ctx.fillStyle = '#ffd27d';
    for (const bo of bolts) {
      const grid = Math.floor(bo.born * 20) % 2 ? BOLT_B : BOLT_A;
      for (let r = 0; r < grid.length; r++) for (let c = 0; c < 3; c++)
        if (grid[r][c] === 'y') ctx.fillRect(Math.floor(bo.x) + c, Math.floor(bo.y) + r, 1, 1);
    }

    if (state !== 'title') {
      const blink = now < invulnUntil && Math.floor(now / 130) % 2 === 0;
      if (!blink) {
        let frame = 0;
        if (!reduced() && (keys.left || keys.right || shipDesiredX != null)) frame = 1 + Math.floor(now / 90) % 2;
        PIXEL.drawGrid(ctx, SHIP[frame], Math.floor(shipX), SHIP_Y, 1);
      }
    }

    ctx.fillStyle = '#61f0bd';
    for (const bu of bullets) ctx.fillRect(Math.floor(bu.x), Math.floor(bu.y), 1, 4);

    for (const bm of booms) PIXEL.drawGrid(ctx, BOOM, Math.floor(bm.x), Math.floor(bm.y), 1);
    for (const d of debris) { ctx.fillStyle = DEBRIS_COLOR[d.c]; ctx.fillRect(Math.floor(d.x), Math.floor(d.y), 1, 1); }

    ctx.globalAlpha = 1;
    if (now < flashUntil) {
      ctx.fillStyle = 'rgba(245,247,255,.35)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- loop ----------
  const near = () => {
    const r = canvas.getBoundingClientRect();
    return r.right > 60 && r.left < window.innerWidth - 60 && r.bottom > 60 && r.top < window.innerHeight - 60;
  };
  function running() {
    if (document.hidden) return false;
    if (state === 'playing' || state === 'paused') return state === 'playing';
    return near(); // title attract + over-screen debris keep moving while visible
  }
  function tick(t) {
    raf = null;
    const dt = lastT ? Math.min(.12, (t - lastT) / 1000) : .016;
    lastT = t;
    if (state === 'playing' && !near()) pause(true);
    if (running()) {
      update(dt, t);
      render(t);
      raf = requestAnimationFrame(tick);
    } else {
      lastT = 0;
    }
  }
  function wake() {
    if (raf === null && running()) { lastT = 0; raf = requestAnimationFrame(tick); }
  }

  // ---------- states ----------
  function start() {
    resetGame();
    state = 'playing';
    showScreen(null);
    banner.classList.remove('show');
    wake();
  }
  function pause(auto) {
    if (state !== 'playing') return;
    state = 'paused';
    document.getElementById('arc-pause-note').hidden = !auto;
    showScreen('paused');
    render(performance.now());
  }
  function resume() {
    if (state !== 'paused') return;
    state = 'playing';
    showScreen(null);
    wake();
  }

  // ---------- input ----------
  const keys = { left: false, right: false, fire: false };
  let touchFiring = false;

  window.addEventListener('keydown', e => {
    const k = e.key;
    const relevant = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'a' || k === 'd' ||
      k === 'A' || k === 'D' || k === ' ' || k === 'Enter' || k === 'p' || k === 'P' || k === 'Escape' ||
      k === 'w' || k === 'W' || k === 'm' || k === 'M';
    if (!relevant) return;
    if (state !== 'playing' && state !== 'paused' && !near()) return;

    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = true; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { if (state === 'playing') { keys.fire = true; e.preventDefault(); } }
    else if (k === ' ') {
      e.preventDefault();
      if (state === 'playing') keys.fire = true;
      else if (state === 'title' || state === 'over') start();
      else if (state === 'paused') resume();
    }
    else if (k === 'Enter') {
      if (state === 'title' || state === 'over') start();
      else if (state === 'paused') resume();
    }
    else if (k === 'p' || k === 'P' || k === 'Escape') {
      if (state === 'playing') pause(false);
      else if (state === 'paused') resume();
    }
    else if (k === 'm' || k === 'M') sndBtn.click();
  });
  window.addEventListener('keyup', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') keys.fire = false;
  });

  // pointer / touch: drag to fly, hold to auto-fire. While playing, the cabinet
  // owns the gesture so the journey doesn't scroll out from under the ship.
  function localX(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientX - r.left) / r.width * W;
  }
  canvas.addEventListener('pointerdown', e => {
    if (state === 'title' || state === 'over') { start(); return; }
    if (state === 'paused') { resume(); return; }
    if (e.pointerType === 'touch' || e.buttons) {
      touchFiring = true;
      shipDesiredX = localX(e);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or already-released pointer */ }
      e.preventDefault();
      e.stopPropagation();
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (state === 'playing' && (touchFiring || (e.pointerType !== 'touch' && e.buttons))) {
      shipDesiredX = localX(e);
      e.stopPropagation();
    }
  });
  const endPointer = () => { touchFiring = false; };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  // don't let wheel/touch drive the journey while playing
  canvas.addEventListener('wheel', e => {
    if (state === 'playing' || state === 'paused') { e.preventDefault(); e.stopPropagation(); }
  }, { passive: false });
  canvas.addEventListener('touchstart', e => { if (state === 'playing') e.stopPropagation(); }, { passive: true });
  canvas.addEventListener('touchmove', e => { if (state === 'playing') { e.preventDefault(); e.stopPropagation(); } }, { passive: false });
  canvas.addEventListener('touchend', e => { if (state === 'playing') e.stopPropagation(); }, { passive: true });

  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); else wake(); });
  window.addEventListener('resize', () => wake());

  // main.js nudge: keeps the attract loop alive as the journey moves
  window.ARCADE = {
    wantsKeys: () => state === 'playing',
    isPlaying: () => state === 'playing',
    pause: () => pause(true),
    notify: () => wake(),
    state: () => state,
    // debug/cheat: jump straight to a wave (5, 10, … = mothership). verify-arcade.js uses it.
    jump: n => {
      if (state !== 'playing') return;
      wave = Math.max(1, ((n | 0) || 1) - 1);
      bugs = []; boss = null; bossPhase = false; floaters = [];
      nextWave();
      wake();
    }
  };

  // ---------- boot ----------
  spawnWave();
  syncHud();
  showScreen('title');
  render(performance.now());
  wake();
})();
