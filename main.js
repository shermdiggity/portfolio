/* ============================================================================
   Cole Sherman, portfolio
   ========================================================================== */

'use strict';

/* ----------------------------------------------------------------------------
   LINKS: fill these in and they become real links. Anything left as an empty
   string stays plain text on the page, so nothing ever renders as a control
   that does not go anywhere.
   -------------------------------------------------------------------------- */

const LINKS = {
  'resume':    '',   // e.g. 'assets/cole-sherman-resume.pdf'
  'github':    '',   // e.g. 'https://github.com/<username>'
  'linkedin':  '',   // e.g. 'https://www.linkedin.com/in/<username>'
  'project-1': '',
  'project-2': '',
  'project-3': ''
};

/* ----------------------------------------------------------------------------
   The field
   Flat poster colour with uneven band widths: big fields, rare accents. Every
   palette is black-dominant, because the black is what keeps the bright flats
   from colliding with each other. [r, g, b, share].
   -------------------------------------------------------------------------- */

const PALETTES = {
  'Cut paper': [
    [ 15,  14,  12, 0.280],   // ink
    [232, 179,  28, 0.225],   // ochre
    [ 44,  99, 216, 0.160],   // cobalt
    [ 15,  14,  12, 0.110],   // Ink returns once mid-ramp: that single repeat is
    [185, 137,  90, 0.135],   // what breaks the colour into separate islands
    [222,  68,  38, 0.070],   // rather than one continuous ramp. The last two
    [121, 198, 232, 0.020]    // bands stay narrow so the peaks read as a blob
  ],                          // with a highlight, never as a stack of rings.
  'Ember': [
    [ 13,  11,  10, 0.285],
    [122,  31,  27, 0.175],
    [226, 101,  28, 0.160],
    [ 13,  11,  10, 0.110],
    [233, 167,  44, 0.140],
    [232, 220, 195, 0.090],
    [180, 103,  74, 0.040]
  ],
  'Meridian': [
    [ 10,  15,  14, 0.280],
    [ 18,  73,  74, 0.185],
    [217, 164,  35, 0.155],
    [ 10,  15,  14, 0.110],
    [196,  85,  47, 0.140],
    [143, 196, 180, 0.095],
    [237, 227, 206, 0.035]
  ]
};

const DEFAULT_PALETTE = 'Cut paper';

/* One noise unit per this many CSS pixels, i.e. roughly one blob. Held in CSS
   px rather than in cells so the composition is identical whatever cell size a
   viewport ends up choosing, and scaled with the viewport so the field reads as
   about five big shapes across on any screen instead of turning to camouflage
   on a wide one. */
function featureSize(vw) {
  return Math.max(130, vw / 5.2);
}

const DRIFT = 0.06;          // noise units per second
const WARP = 0.28;           // domain warp: enough to bend the shapes, not braid them
const MAX_CELLS_LONG = 240;  // caps the per-frame work on large displays
const MIN_FRAME_MS = 70;     // ~14fps; the field drifts far too slowly to need more

/* --- simplex noise ---------------------------------------------------------
   Carried over from the design file unchanged, so the field keeps the exact
   character that was tuned there. */

const G3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
];

function makeSimplex3(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const F3 = 1 / 3, G = 1 / 6;

  return function (xin, yin, zin) {
    const t0s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + t0s), j = Math.floor(yin + t0s), k = Math.floor(zin + t0s);
    const t0 = (i + j + k) * G;
    const x0 = xin - (i - t0), y0 = yin - (j - t0), z0 = zin - (k - t0);
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0)      { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else               { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0)       { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0)  { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else               { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G,     y1 = y0 - j1 + G,     z1 = z0 - k1 + G;
    const x2 = x0 - i2 + 2 * G, y2 = y0 - j2 + 2 * G, z2 = z0 - k2 + 2 * G;
    const x3 = x0 - 1 + 3 * G,  y3 = y0 - 1 + 3 * G,  z3 = z0 - 1 + 3 * G;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0, t, g;
    t = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t > 0) { g = G3[perm[ii + perm[jj + perm[kk]]] % 12]; t *= t; n += t * t * (g[0] * x0 + g[1] * y0 + g[2] * z0); }
    t = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t > 0) { g = G3[perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12]; t *= t; n += t * t * (g[0] * x1 + g[1] * y1 + g[2] * z1); }
    t = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t > 0) { g = G3[perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12]; t *= t; n += t * t * (g[0] * x2 + g[1] * y2 + g[2] * z2); }
    t = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t > 0) { g = G3[perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12]; t *= t; n += t * t * (g[0] * x3 + g[1] * y3 + g[2] * z3); }
    return 32 * n;
  };
}

/* --- renderer ------------------------------------------------------------ */

function createField(canvas) {
  const noise = makeSimplex3(1337);
  const noise2 = makeSimplex3(90210);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let ctx = null, img = null, cols = 0, rows = 0, cell = 1, feature = 240;
  let lut = null, lutKey = '';
  let palette = DEFAULT_PALETTE;
  let t = 0, last = 0, raf = 0, resizeTimer = 0;

  function buildLut(name) {
    if (lutKey === name) return;
    const bands = PALETTES[name] || PALETTES[DEFAULT_PALETTE];
    const total = bands.reduce((sum, b) => sum + b[3], 0);
    const table = new Uint8Array(256 * 3);
    let acc = 0, k = 0;
    for (const b of bands) {
      const end = Math.min(256, Math.round((acc + b[3] / total) * 256));
      for (; k < end; k++) { table[k * 3] = b[0]; table[k * 3 + 1] = b[1]; table[k * 3 + 2] = b[2]; }
      acc += b[3] / total;
    }
    const tail = bands[bands.length - 1];
    for (; k < 256; k++) { table[k * 3] = tail[0]; table[k * 3 + 1] = tail[1]; table[k * 3 + 2] = tail[2]; }
    lut = table;
    lutKey = name;
  }

  function resize() {
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    // Deliberately not multiplied by devicePixelRatio: the upscale is the look.
    cell = Math.max(3, Math.ceil(Math.max(vw, vh) / MAX_CELLS_LONG));
    feature = featureSize(vw);
    cols = Math.ceil(vw / cell) + 1;
    rows = Math.ceil(vh / cell) + 1;
    canvas.width = cols;
    canvas.height = rows;
    ctx = canvas.getContext('2d');
    img = ctx.createImageData(cols, rows);
    paint();
  }

  function paint() {
    if (!ctx || !img) return;
    buildLut(palette);
    const data = img.data;
    const f = cell / feature;
    for (let y = 0; y < rows; y++) {
      const yf = y * f;
      for (let x = 0; x < cols; x++) {
        const xf = x * f;
        // Two-octave fbm, gently domain-warped: big organic islands, no fine
        // detail. The posterising LUT throws fine detail away regardless.
        const wx = xf + WARP * noise2(xf * 0.7, yf * 0.7, t * 0.6);
        const wy = yf + WARP * noise2(xf * 0.7 + 4.7, yf * 0.7 + 2.1, t * 0.6);
        const n = noise(wx, wy, t) * 0.90 + noise2(wx * 2.2, wy * 2.2, t * 1.1) * 0.10;
        let u = (n + 0.72) * 0.694;
        u = u < 0 ? 0 : u > 0.999 ? 0.999 : u;
        const p = ((u * 256) | 0) * 3;
        const i = (y * cols + x) * 4;
        data[i] = lut[p]; data[i + 1] = lut[p + 1]; data[i + 2] = lut[p + 2]; data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (last && now - last < MIN_FRAME_MS) return;
    const dt = last ? Math.min(200, now - last) : 16;
    last = now;
    t += DRIFT * (dt / 1000);
    paint();
  }

  function start() {
    if (raf || reduced.matches || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 130);
  });

  // Never burn a core painting a field nobody is looking at.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  // Safari below 14 has no addEventListener on a MediaQueryList, and an
  // uncaught throw here would cost the whole field.
  const onReducedChange = () => {
    if (reduced.matches) { stop(); paint(); } else start();
  };
  if (reduced.addEventListener) reduced.addEventListener('change', onReducedChange);
  else if (reduced.addListener) reduced.addListener(onReducedChange);

  resize();
  start();

  return {
    setPalette(name) {
      if (!PALETTES[name]) return;
      palette = name;
      paint();
    },
    get palette() { return palette; }
  };
}

/* ----------------------------------------------------------------------------
   Tabs. A real tablist. Every panel is in the document and visible until this
   runs, so a failure here leaves a long readable page rather than a blank one.
   -------------------------------------------------------------------------- */

function createTabs(field) {
  const nav = document.querySelector('.tabs');
  const panelsHost = document.querySelector('.panels');
  const marker = document.querySelector('.tabs-marker');
  if (!nav || !panelsHost) return;

  const tabs = Array.from(nav.querySelectorAll('.tab'));
  const panels = new Map();
  tabs.forEach(tab => {
    const key = tab.dataset.tab;
    const panel = panelsHost.querySelector('[data-panel="' + key + '"]');
    if (!panel) return;
    panels.set(key, panel);
    tab.id = 'tab-' + key;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.setAttribute('tabindex', '-1');
  });
  if (!panels.size) return;

  nav.setAttribute('role', 'tablist');
  panelsHost.setAttribute('data-tabs', 'on');

  const keys = tabs.map(t => t.dataset.tab).filter(k => panels.has(k));
  let current = null;

  function placeMarker(tab) {
    if (!marker) return;
    marker.style.left = tab.offsetLeft + 'px';
    marker.style.width = tab.offsetWidth + 'px';
    marker.style.top = (tab.offsetTop + tab.offsetHeight - 1) + 'px';
    marker.hidden = false;
  }

  function show(key, opts) {
    if (!panels.has(key) || key === current) {
      if (key === current) placeMarker(tabs[keys.indexOf(key)]);
      return;
    }
    current = key;
    tabs.forEach(tab => {
      const on = tab.dataset.tab === key;
      tab.setAttribute('aria-selected', String(on));
      tab.setAttribute('tabindex', on ? '0' : '-1');
    });
    panels.forEach((panel, k) => {
      const on = k === key;
      panel.classList.toggle('is-active', on);
      panel.hidden = !on;
    });
    placeMarker(tabs[keys.indexOf(key)]);

    if (opts && opts.push && location.hash !== '#' + key) {
      history.pushState({ tab: key }, '', '#' + key);
    }
    if (opts && opts.focus) {
      tabs[keys.indexOf(key)].focus();
    }
  }

  nav.addEventListener('click', event => {
    const tab = event.target.closest('.tab');
    if (!tab || !nav.contains(tab)) return;
    event.preventDefault();
    show(tab.dataset.tab, { push: true });
  });

  nav.addEventListener('keydown', event => {
    const index = keys.indexOf(document.activeElement && document.activeElement.dataset
      ? document.activeElement.dataset.tab : null);
    if (index < 0) return;
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % keys.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + keys.length) % keys.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = keys.length - 1;
    if (next < 0) return;
    event.preventDefault();
    show(keys[next], { push: true, focus: true });
  });

  window.addEventListener('popstate', () => {
    const key = location.hash.slice(1);
    show(panels.has(key) ? key : keys[0]);
  });

  const onResize = () => { if (current) placeMarker(tabs[keys.indexOf(current)]); };
  window.addEventListener('resize', onResize);
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(nav);
  // Gambarino changes the tab widths when it lands, so measure again after.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

  const initial = location.hash.slice(1);
  if (panels.has(initial)) {
    show(initial);
    window.scrollTo(0, 0);
  } else {
    show(keys[0]);
  }
}

/* ----------------------------------------------------------------------------
   Field picker
   -------------------------------------------------------------------------- */

const STORE_KEY = 'cs-field-palette';

function readStored() {
  try {
    const v = localStorage.getItem(STORE_KEY);
    return v && PALETTES[v] ? v : null;
  } catch (err) { return null; }
}

function writeStored(value) {
  try { localStorage.setItem(STORE_KEY, value); } catch (err) { /* private mode */ }
}

function createPicker(field) {
  const picker = document.querySelector('.field-picker');
  const host = picker && picker.querySelector('.swatches');
  if (!host) return;

  const buttons = Object.keys(PALETTES).map(name => {
    const bands = PALETTES[name];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.setAttribute('aria-label', name);
    button.title = name;
    // The three widest non-ink bands, so each chip actually reads as its palette.
    const ink = bands[0];
    const picks = bands
      .filter(b => !(b[0] === ink[0] && b[1] === ink[1] && b[2] === ink[2]))
      .sort((a, b) => b[3] - a[3])
      .slice(0, 3);
    picks.forEach((band, i) => {
      button.style.setProperty('--s' + (i + 1), 'rgb(' + band[0] + ',' + band[1] + ',' + band[2] + ')');
    });
    button.addEventListener('click', () => select(name));
    host.appendChild(button);
    return { name, button };
  });

  function select(name) {
    field.setPalette(name);
    writeStored(name);
    buttons.forEach(b => b.button.setAttribute('aria-pressed', String(b.name === name)));
  }

  select(readStored() || DEFAULT_PALETTE);
  picker.hidden = false;
}

/* ----------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

function upgradeLinks() {
  document.querySelectorAll('[data-link]').forEach(el => {
    const url = LINKS[el.dataset.link];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.textContent = el.textContent;
    if (/^https?:/i.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    el.replaceWith(a);
  });
}

function stampYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

(function boot() {
  upgradeLinks();
  stampYear();

  const canvas = document.getElementById('field');
  let field = { setPalette() {}, palette: DEFAULT_PALETTE };
  if (canvas && canvas.getContext) {
    try { field = createField(canvas); } catch (err) { canvas.remove(); }
  }

  createTabs(field);
  createPicker(field);
})();
