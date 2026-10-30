// pixel.js — 8-bit sprite engine + scenes. All art hand-authored, no assets, no CDN.
(() => {
  const PAL = {
    k: '#05060b', b: '#1b2033', B: '#2a3152',
    v: '#9b7cff', V: '#c3b2ff', d: '#6a4fd8',
    m: '#61f0bd', M: '#2e9d7d',
    w: '#f5f7ff', s: '#a9b2c7', g: '#68738a',
    o: '#ffb27d', y: '#ffd27d'
  };

  // Draw a char-grid sprite. Rows may be ragged; short rows are padded transparent.
  function drawGrid(ctx, rows, x, y, scale = 1, flip = false) {
    const w = Math.max(...rows.map(r => r.length));
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === '.' || c === ' ') continue;
        const col = PAL[c];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x + (flip ? (w - 1 - i) : i) * scale, y + j * scale, scale, scale);
      }
    }
    return w;
  }
  const gridWidth = rows => Math.max(...rows.map(r => r.length));

  // ---------- character sprites ----------
  const AGENT_A = [
    '....kk....',
    '...kmmk...',
    '..kkkkkk..',
    '.kvvvvvvk.',
    '.kvkkkkvk.',
    '.kvkmmkvk.',
    '.kvkkkkvk.',
    '.kvvvvvvk.',
    '..kkkkkk..',
    '..kmmmmk..',
    '.kvvvvvvk.',
    '.kv....vk.',
    '.kk....kk.'
  ];
  const AGENT_B = AGENT_A.slice(0, 11).concat([
    '..kv..kv..',
    '..kk..kk..'
  ]);

  const SHIP = [
    '......kkkkkkkkkkkk......',
    '....kkVVVVVVVVVVVVkk....',
    '..kkVVVVVVVVVVVVVVVVkk..',
    '.kVvmmvmmvmmvmmvmmvmmVk.',
    '.kVVVVVVVVVVVVVVVVVVVVk.',
    '..kkkkkkkkkkkkkkkkkkkk..',
    '.....o.......o.......o..'
  ];

  // ---------- icons (12x12) ----------
  const ICONS = {
    robot: [
      '.....mm.....',
      '....kkkk....',
      '...kvvvvk...',
      '..kvvvvvvk..',
      '..kvkkkkvk..',
      '..kvkmmkvk..',
      '..kvkkkkvk..',
      '..kvvvvvvk..',
      '...kvvvvk...',
      '..kmmkkmmk..',
      '..kvvkkvvk..',
      '..kkk..kkk..'
    ],
    bolt: [
      '......kkk...',
      '.....kyyk...',
      '....kyyk....',
      '...kyyk.....',
      '..kyyyykk...',
      '.kyyykyyk...',
      '..kkkkyyk...',
      '.....kyyk...',
      '....kyyk....',
      '...kyyk.....',
      '...kyk......',
      '...kk.......'
    ],
    shield: [
      '..kkkkkkkk..',
      '.kmmmmmmmmk.',
      '.kmmmmmmmmk.',
      '.kmmkkkkmmk.',
      '.kmkkkkkkmk.',
      '.kmmkkkkmmk.',
      '.kmmmmmmmmk.',
      '.kmmmmmmmmk.',
      '..kmmmmmmk..',
      '..kkmmmmkk..',
      '....kmmk....',
      '.....kk.....'
    ],
    brain: [
      '..kkkkkkk...',
      '.kvvvvvvvk..',
      'kvvkkvvvvvk.',
      'kvmkkvvvmvk.',
      'kvmkkvvvmvk.',
      'kvvkkvvvvvk.',
      '.kvvvvvvvvk.',
      '.kvvkkvvvvk.',
      '..kvvvvvvk..',
      '...kkkkkk...',
      '.....kk.....',
      '....kmmk....'
    ],
    globe: [
      '...kkkkkk...',
      '..kmmmmmmk..',
      '.kmkkkkkkmk.',
      '.kmkmmmmkmk.',
      'kmmkmmmmkmmk',
      'kmmkkkkkkmmk',
      'kmmkmmmmkmmk',
      '.kmkmmmmkmk.',
      '.kmkkkkkkmk.',
      '..kmmmmmmk..',
      '...kkkkkk...',
      '............'
    ],
    magnifier: [
      '..kkkk......',
      '.kmmmmk.....',
      'kmkbbkmk....',
      'kmkbwbkmk...',
      'kmkbbkmk....',
      '.kmmmmk.....',
      '..kkkkkk....',
      '......kyyk..',
      '.......kyyk.',
      '........kyyk',
      '.........kkk',
      '............'
    ],
    star: [
      '.....m......',
      '.....m......',
      '....kmk.....',
      '....kmk.....',
      '.kk.kmk.kk..',
      '..kkkmkkk...',
      'kkkkmmmmkkkk',
      '..kkkmkkk...',
      '.kk.kmk.kk..',
      '....kmk.....',
      '....kmk.....',
      '.....m......'
    ],
    terminal: [
      'kkkkkkkkkkkk',
      'kBBBBBBBBBBk',
      'kBmmBBBBBBBk',
      'kBkmmBBBBBBk',
      'kBkkmmBBBBBk',
      'kBkmmBBBBBBk',
      'kBmmBBmmmBBk',
      'kBBBBBBBBBBk',
      'kBBBBBBBBBBk',
      'kBBBBBBBBBBk',
      'kkkkkkkkkkkk',
      '............'
    ],
    house: [
      '.....kk.....',
      '....kkkk....',
      '...kkkkkk...',
      '..kkkkkkkk..',
      '.kkVVVVVVkk.',
      'kkVVVVVVVVkk',
      '.kvvvvvvvvk.',
      '.kvvkkkvvvk.',
      '.kvvkmkvvvk.',
      '.kvvkkkvvvk.',
      '.kvvvvvvvvk.',
      '.kkkkkkkkkk.'
    ],
    book: [
      '.kkkk..kkkk.',
      'kwwwwkkwwwwk',
      'kwsswkkwsswk',
      'kwwwwkkwwwwk',
      'kwsswkkwsswk',
      'kwwwwkkwwwwk',
      'kwsswkkwsswk',
      'kwwwwkkwwwwk',
      '.kwwkkkkwwk.',
      '.kkkvvvvkkk.',
      '...kvvvvk...',
      '....kkkk....'
    ],
    wrench: [
      'kkkk........',
      'ksssk.......',
      'ksskkskkkkk.',
      '.kkksssssssk',
      '....ksssssk.',
      '.....ksskssk',
      '.....kkkkkkk',
      '............',
      '............',
      '............',
      '............',
      '............'
    ],
    orbit: [
      '....kkkk....',
      '..kkvvvvkk..',
      '.kvvvvvvvvk.',
      '.kvvkvvkvvk.',
      'kVvvvvvvvvVk',
      'kVVvkvvkvVVk',
      'kVvvvvvvvvVk',
      '.kVvvvvvvVk.',
      '..kkvvvvkk..',
      '....kkkk....',
      '........mm..',
      '.......mm...'
    ]
  };

  function drawIcon(canvas, name, scale = 3) {
    const rows = ICONS[name] || ICONS.robot;
    const w = gridWidth(rows), h = rows.length;
    canvas.width = w * scale;
    canvas.height = h * scale;
    canvas.style.width = (w * scale) + 'px';
    canvas.style.height = (h * scale) + 'px';
    const ctx = canvas.getContext('2d');
    drawGrid(ctx, rows, 0, 0, scale);
    return canvas;
  }

  // seeded rng so scenes are stable across renders
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // fixed-canvas sizing: logical pixels, CSS upscales with image-rendering:pixelated
  function setup(canvas, w, h) {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  // ---------- hero scene: fleet crossing a starfield ----------
  // logical 240x150; agents walk right, mothership bobs, beam pulses.
  function renderHero(canvas, t, reduced) {
    const W = 240, H = 150;
    const ctx = setup(canvas, W, H);
    const r = rng(20260911);
    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, W, H);

    // stars (two depths)
    for (let i = 0; i < 52; i++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * 104);
      const deep = r() > .6;
      const tw = reduced ? 1 : (.65 + .35 * Math.sin(t / (deep ? 1700 : 900) + i * 1.7));
      ctx.fillStyle = deep ? 'rgba(104,115,138,' + (.5 * tw).toFixed(3) + ')'
                          : 'rgba(245,247,255,' + (.8 * tw).toFixed(3) + ')';
      ctx.fillRect(x, y, 1, 1);
    }
    // distant violet nebula: pixel squares
    for (let i = 0; i < 26; i++) {
      const x = 150 + Math.floor(r() * 80), y = 8 + Math.floor(r() * 40);
      ctx.fillStyle = 'rgba(106,79,216,' + (.05 + r() * .06).toFixed(3) + ')';
      ctx.fillRect(x, y, 2 + Math.floor(r() * 3), 2 + Math.floor(r() * 3));
    }

    // mothership
    const bob = reduced ? 0 : Math.round(Math.sin(t / 900) * 2);
    const shipX = 148, shipY = 12 + bob;
    drawGrid(ctx, SHIP, shipX, shipY, 2);
    // tractor beam (flickers, not under reduced motion)
    const beamA = reduced ? .10 : .08 + .05 * Math.sin(t / 260);
    ctx.fillStyle = 'rgba(155,124,255,' + beamA.toFixed(3) + ')';
    for (let j = 0; j < 58; j++) {
      const half = 2 + Math.floor(j / 6);
      ctx.fillRect(shipX + 17 - half, shipY + 14 + j, half * 2, 1);
    }

    // ground ridge
    const ridge = [112, 110, 113, 109, 112, 111, 113, 110, 112, 114, 111, 113];
    for (let col = 0; col < W; col++) {
      const top = ridge[Math.floor(col / 20) % ridge.length];
      ctx.fillStyle = '#2a3152';
      ctx.fillRect(col, top, 1, 1);
      ctx.fillStyle = '#1b2033';
      ctx.fillRect(col, top + 1, 1, H - top - 1);
    }

    // the fleet: 4 agents walking right, loop around
    const agents = [
      { sp: .014, off: 0,   y: 88 },
      { sp: .010, off: 90,  y: 89 },
      { sp: .017, off: 160, y: 87 },
      { sp: .012, off: 40,  y: 90 }
    ];
    agents.forEach((a, i) => {
      const x = reduced ? (a.off % (W + 40)) - 20 : (((t * a.sp + a.off) % (W + 60)) - 30);
      const frame = reduced ? 0 : Math.floor(t / 280 + i) % 2;
      drawGrid(ctx, frame ? AGENT_B : AGENT_A, Math.floor(x), a.y, 2);
    });
  }

  // ---------- command center scene (the fleet, as pixel art) ----------
  // logical 320x120. wall screen + server racks + consoles + workers.
  function renderCommand(canvas, t, reduced) {
    const W = 320, H = 120;
    const ctx = setup(canvas, W, H);
    const r = rng(424242);
    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, W, H);

    // back wall
    ctx.fillStyle = '#0b0e17';
    ctx.fillRect(0, 0, W, 96);
    ctx.fillStyle = '#05060b';
    for (let y = 0; y < 96; y += 8) ctx.fillRect(0, y, W, 1);

    // ---- big wall screen: FLEET STATUS ----
    ctx.fillStyle = '#05060b';
    ctx.fillRect(120, 10, 150, 62);
    ctx.fillStyle = '#1b2033';
    ctx.fillRect(122, 12, 146, 58);
    // header dashes
    for (let i = 0; i < 9; i++) { ctx.fillStyle = i < 6 ? '#61f0bd' : '#9b7cff'; ctx.fillRect(126 + i * 6, 16, 4, 2); }
    ctx.fillStyle = '#2a3152';
    ctx.fillRect(126, 22, 138, 1);
    // agent rows: dot + activity bar
    for (let row = 0; row < 4; row++) {
      const y = 28 + row * 10;
      const blink = !reduced && Math.floor(t / 500 + row) % 3 === 0;
      ctx.fillStyle = row % 2 ? '#9b7cff' : '#61f0bd';
      if (blink) ctx.fillStyle = '#ffd27d';
      ctx.fillRect(128, y, 3, 3);
      const w = 30 + Math.floor(r() * 70);
      ctx.fillStyle = 'rgba(169,178,199,.4)';
      ctx.fillRect(136, y + 1, 120, 1);
      ctx.fillStyle = row % 2 ? '#c3b2ff' : '#61f0bd';
      ctx.fillRect(136, y + 1, w, 1);
    }
    // scan shimmer down the screen
    if (!reduced) {
      const sy = 12 + Math.floor((t / 22) % 58);
      ctx.fillStyle = 'rgba(97,240,189,.06)';
      ctx.fillRect(122, sy, 146, 2);
    }

    // ---- server racks (two) ----
    const rack = (x, seedOff) => {
      ctx.fillStyle = '#05060b';
      ctx.fillRect(x, 30, 44, 66);
      ctx.fillStyle = '#1b2033';
      ctx.fillRect(x + 2, 32, 40, 62);
      for (let s = 0; s < 7; s++) {
        const y = 35 + s * 8;
        ctx.fillStyle = '#0b0e17';
        ctx.fillRect(x + 4, y, 36, 6);
        // status lights: seeded + slow blink
        for (let li = 0; li < 3; li++) {
          const phase = Math.floor(t / 700 + seedOff + s * 3 + li * 7) % 5;
          const col = phase === 0 ? '#9b7cff' : phase === 1 ? '#61f0bd' : phase === 4 ? '#ffb27d' : '#2a3152';
          if (reduced && phase === 4) continue;
          ctx.fillStyle = col;
          ctx.fillRect(x + 7 + li * 5, y + 2, 2, 2);
        }
        ctx.fillStyle = '#2a3152';
        ctx.fillRect(x + 26, y + 2, 12, 2);
      }
      // antenna + blinking tip
      ctx.fillStyle = '#68738a';
      ctx.fillRect(x + 40, 20, 1, 10);
      const on = reduced || Math.floor(t / 600) % 2 === 0;
      ctx.fillStyle = on ? '#61f0bd' : '#1b2033';
      ctx.fillRect(x + 39, 17, 3, 3);
    };
    rack(10, 0);
    rack(62, 5);

    // ---- operator desk + CRT ----
    ctx.fillStyle = '#05060b';
    ctx.fillRect(110, 84, 60, 4);         // desk top
    ctx.fillStyle = '#1b2033';
    ctx.fillRect(113, 88, 5, 26);         // legs
    ctx.fillRect(162, 88, 5, 26);
    ctx.fillStyle = '#05060b';
    ctx.fillRect(118, 62, 34, 24);        // CRT frame
    ctx.fillStyle = '#1b2033';
    ctx.fillRect(120, 64, 30, 20);
    // code lines scrolling on CRT
    for (let li = 0; li < 5; li++) {
      const w = 8 + ((li * 13 + Math.floor(t / 300)) % 18);
      ctx.fillStyle = li % 2 ? '#61f0bd' : '#c3b2ff';
      ctx.fillRect(123, 67 + li * 3, Math.min(w, 24), 1);
    }
    if (!reduced && Math.floor(t / 450) % 2 === 0) {
      ctx.fillStyle = '#61f0bd';
      ctx.fillRect(123 + Math.min(8 + ((2 * 13 + Math.floor(t / 300)) % 18), 24), 73, 2, 2); // cursor
    }
    ctx.fillStyle = '#68738a';
    ctx.fillRect(154, 80, 8, 3);          // keyboard

    // ---- workers (sprites) ----
    const w1 = reduced ? 0 : Math.floor(t / 280) % 2;
    drawGrid(ctx, w1 ? AGENT_B : AGENT_A, 98, 71, 2);        // at the desk, left of CRT
    drawGrid(ctx, w1 ? AGENT_A : AGENT_B, 276, 74, 2, true); // walking back to the racks

    // ---- floor ----
    ctx.fillStyle = '#1b2033';
    ctx.fillRect(0, 96, W, H - 96);
    ctx.fillStyle = '#05060b';
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 96, 1, H - 96);
    ctx.fillStyle = '#2a3152';
    ctx.fillRect(0, 96, W, 1);
  }

  // ---------- parallax starfield backdrop ----------
  // logical resolution = viewport/2; three depths shift with scroll.
  function makeBackdrop(canvas) {
    const SCALE = 2;
    let W = 0, H = 0, layers = null, blobs = null;
    const seedAll = () => {
      const r = rng(987654321);
      layers = [0, 1, 2].map(depth => {
        const n = Math.round((W * H) / (depth === 0 ? 260 : depth === 1 ? 420 : 900));
        return Array.from({ length: n }, () => ({
          x: Math.floor(r() * W), y: Math.floor(r() * H),
          tw: .5 + r() * 2, ph: r() * 6.28,
          c: depth === 2 && r() > .8 ? '#c3b2ff' : depth === 2 ? '#f5f7ff' : depth === 1 ? '#a9b2c7' : '#68738a'
        }));
      });
      blobs = Array.from({ length: 3 }, (_, i) => ({
        x: Math.floor(r() * W), y: Math.floor(r() * H * .6),
        s: 30 + Math.floor(r() * 40), c: i === 1 ? '97,124,255' : '106,79,216'
      }));
    };
    const resize = () => {
      W = Math.max(320, Math.ceil(window.innerWidth / SCALE));
      H = Math.max(240, Math.ceil(window.innerHeight / SCALE));
      setup(canvas, W, H);
      canvas.style.width = W * SCALE + 'px';
      canvas.style.height = H * SCALE + 'px';
      seedAll();
    };
    resize();
    return {
      resize,
      render(scrollX, t, reduced) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#07080d';
        ctx.fillRect(0, 0, W, H);
        // pixel nebula blobs
        blobs.forEach((b, i) => {
          const drift = reduced ? 0 : Math.sin(t / 9000 + i * 2) * 4;
          ctx.fillStyle = 'rgba(' + b.c + ',.05)';
          const x = Math.floor(b.x - scrollX * .01 + drift), y = b.y;
          for (let ring = 3; ring >= 0; ring--) {
            const pad = ring * 8;
            ctx.fillStyle = 'rgba(' + b.c + ',' + (.012 + (3 - ring) * .012).toFixed(3) + ')';
            ctx.fillRect(x - b.s / 2 - pad, y - b.s / 4 - pad, b.s + pad * 2, b.s / 2 + pad * 2);
          }
        });
        // star layers, far to near
        const fac = [.012, .03, .06];
        layers.forEach((stars, depth) => {
          const off = scrollX * fac[depth];
          for (const st of stars) {
            let x = ((st.x - off) % W + W) % W;
            const tw = reduced ? .8 : (.55 + .45 * Math.sin(t / (600 + st.tw * 900) + st.ph));
            ctx.globalAlpha = tw * (depth === 0 ? .5 : depth === 1 ? .7 : .95);
            ctx.fillStyle = st.c;
            ctx.fillRect(Math.floor(x), st.y, 1, 1);
          }
        });
        ctx.globalAlpha = 1;
      }
    };
  }

  // tiny brand mark: mini mothership
  function drawBrand(canvas) {
    const rows = [
      '...kkkkkkkk...',
      '..kVVVVVVVVk..',
      '.kVmmVmmVmmVk.',
      '..kkkkkkkkkk..',
      '....o.....o...'
    ];
    const w = gridWidth(rows);
    setup(canvas, w, rows.length);
    canvas.style.width = w * 2 + 'px';
    canvas.style.height = rows.length * 2 + 'px';
    drawGrid(canvas.getContext('2d'), rows, 0, 0, 2);
  }

  window.PIXEL = { drawGrid, drawIcon, renderHero, renderCommand, makeBackdrop, drawBrand, PAL, ICONS, AGENT_A };
})();
