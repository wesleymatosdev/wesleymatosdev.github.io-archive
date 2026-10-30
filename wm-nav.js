/*!
 * wm-nav.js — shared wesleymatos.dev navbar component.
 *
 * One script tag on any site of the network renders the canonical navbar:
 * pixel WESLEY MATOS brand (left, links to the root site) + site links (right).
 * Styling mirrors the hire-site homepage topnav (wesleymatos.dev), the style
 * source. Self-contained: all rules scoped under #wm-nav.
 *
 * Usage:
 *   <script src="https://wesleymatos.dev/wm-nav.js" data-current="Skills"></script>
 *
 * data-current (optional): "Home" | "Blog" | "Open Source" | "Skills" | "Demos"
 *   — gets aria-current="page" + accent highlight. Omit on the root site.
 */
(function () {
  'use strict';

  var ROOT = 'https://wesleymatos.dev';

  var LINKS = [
    { label: 'GitHub', href: 'https://github.com/wesleymatosdev', nav: 'GITHUB' },
    { label: 'Blog', href: 'https://blog.wesleymatos.dev', nav: 'BLOG' },
    { label: 'Open Source', href: 'https://oss.wesleymatos.dev', nav: 'OSS' },
    { label: 'Skills', href: 'https://skills.wesleymatos.dev', nav: 'SKILLS' },
    { label: 'Demos', href: 'https://demo.wesleymatos.dev', nav: 'DEMOS' },
    { label: 'Email', href: 'mailto:wesleymatosdev@gmail.com', nav: 'EMAIL' }
  ];

  var script = document.currentScript;
  var current = script && script.getAttribute('data-current');

  // ---------- styles (homepage topnav palette, scoped under #wm-nav) ----------
  var css = [
    '#wm-nav{position:fixed;top:0;left:0;right:0;z-index:9999;',
    'display:flex;justify-content:space-between;align-items:center;',
    'padding:20px clamp(28px,6vw,96px);',
    "font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;",
    'font-size:11px;letter-spacing:.16em;',
    'background:linear-gradient(180deg,rgba(7,8,13,.92),rgba(7,8,13,0));}',
    '#wm-nav a{text-decoration:none;pointer-events:auto;}',
    '#wm-nav .wm-brand{display:inline-flex;align-items:center;gap:10px;color:#f5f7ff;}',
    '#wm-nav .wm-brand canvas{image-rendering:pixelated;}',
    '#wm-nav .wm-links{display:flex;gap:22px;flex-wrap:wrap;justify-content:flex-end;}',
    '#wm-nav .wm-links a{color:#a9b2c7;padding:4px 2px;white-space:nowrap;}',
    '#wm-nav .wm-links a:hover,#wm-nav .wm-links a:focus-visible{color:#61f0bd;}',
    '#wm-nav .wm-links a[aria-current="page"]{color:#c3b2ff;}',
    '#wm-nav .wm-links a[aria-current="page"]::before{content:"// ";color:#61f0bd;}',
    '@media(max-width:640px){',
    '#wm-nav{flex-direction:column;gap:8px;padding:12px 16px 10px;',
    'background:rgba(7,8,13,.94);border-bottom:1px solid rgba(190,200,255,.16);}',
    '#wm-nav .wm-brand{align-self:flex-start;}',
    '#wm-nav .wm-links{gap:14px;justify-content:center;width:100%;}}'
  ].join('');

  // ---------- pixel brand (same grid as homepage PIXEL.drawBrand) ----------
  var BRAND_ROWS = [
    '...kkkkkkkk...',
    '..kVVVVVVVVk..',
    '.kVmmVmmVmmVk.',
    '..kkkkkkkkkk..',
    '....o.....o...'
  ];
  var PAL = { k: '#3a4160', V: '#9b7cff', m: '#f5f7ff', o: '#ffb27d' };

  function drawBrand(canvas) {
    var px = 2, rows = BRAND_ROWS.length, cols = BRAND_ROWS[0].length;
    canvas.width = cols * px; canvas.height = rows * px;
    canvas.style.width = cols * px + 'px';
    canvas.style.height = rows * px + 'px';
    var ctx = canvas.getContext('2d');
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var ch = BRAND_ROWS[y][x];
        if (ch === '.') continue;
        ctx.fillStyle = PAL[ch];
        ctx.fillRect(x * px, y * px, px, px);
      }
    }
  }

  // ---------- DOM ----------
  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var nav = document.createElement('nav');
    nav.id = 'wm-nav';
    nav.setAttribute('aria-label', 'wesleymatos.dev sites');

    var brand = document.createElement('a');
    brand.className = 'wm-brand';
    brand.href = ROOT + '/';
    brand.setAttribute('aria-label', 'Wesley Matos — home');
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    brand.appendChild(cv);
    var name = document.createElement('span');
    name.textContent = 'WESLEY\u00a0MATOS';
    brand.appendChild(name);

    var links = document.createElement('span');
    links.className = 'wm-links';
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.href;
      a.textContent = l.nav;
      if (current && l.label === current) {
        a.setAttribute('aria-current', 'page');
      }
      links.appendChild(a);
    });

    nav.appendChild(brand);
    nav.appendChild(links);
    document.body.appendChild(nav);
    drawBrand(cv);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
