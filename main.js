/* ==========================================================================
   Cole Sherman, portfolio
   A direct port of the logic in Portfolio.dc.html. The simplex noise, the
   domain warp, the two-octave fbm, the palettes and the prop values are all
   carried over unchanged from the design file.
   ========================================================================== */

'use strict';

/* The design file's props, at the defaults it was saved with. */
var PROPS = {
  palette: 'Blue & violet',
  bands: 7,
  cellSize: 3,
  zoom: 40,
  speed: 6
};

var G3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];

function makeSimplex3(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
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
      if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
      else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
      else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
    } else {
      if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
      else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
      else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
    }
    const x1=x0-i1+G, y1=y0-j1+G, z1=z0-k1+G;
    const x2=x0-i2+2*G, y2=y0-j2+2*G, z2=z0-k2+2*G;
    const x3=x0-1+3*G, y3=y0-1+3*G, z3=z0-1+3*G;
    const ii=i&255, jj=j&255, kk=k&255;
    let n = 0, t, g;
    t = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t > 0) { g = G3[perm[ii+perm[jj+perm[kk]]] % 12]; t*=t; n += t*t*(g[0]*x0+g[1]*y0+g[2]*z0); }
    t = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t > 0) { g = G3[perm[ii+i1+perm[jj+j1+perm[kk+k1]]] % 12]; t*=t; n += t*t*(g[0]*x1+g[1]*y1+g[2]*z1); }
    t = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t > 0) { g = G3[perm[ii+i2+perm[jj+j2+perm[kk+k2]]] % 12]; t*=t; n += t*t*(g[0]*x2+g[1]*y2+g[2]*z2); }
    t = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t > 0) { g = G3[perm[ii+1+perm[jj+1+perm[kk+1]]] % 12]; t*=t; n += t*t*(g[0]*x3+g[1]*y3+g[2]*z3); }
    return 32 * n;
  };
}

// Flat poster colors with uneven band widths: big fields, rare accents.
// [r,g,b, share] , share is the proportion of the noise range that color owns.
var PALETTES = {
  "Blue & violet": [
    [11,10,30, 0.26],[59,86,255, 0.24],[123,63,242, 0.18],
    [11,10,30, 0.12],[183,142,255, 0.11],[45,214,245, 0.06],[255,94,168, 0.03]
  ],
  "Ink & electric": [
    [8,8,20, 0.30],[40,64,240, 0.22],[8,8,20, 0.14],[104,120,255, 0.16],
    [166,196,255, 0.11],[0,214,220, 0.05],[255,214,90, 0.02]
  ],
  "Violet & cyan": [
    [16,10,38, 0.24],[92,44,200, 0.22],[147,90,255, 0.18],[16,10,38, 0.12],
    [64,196,235, 0.13],[190,236,246, 0.08],[255,120,190, 0.03]
  ]
};

/* --- the field ----------------------------------------------------------- */

function startField(canvas) {
  const noise = makeSimplex3(1337);
  const noise2 = makeSimplex3(90210);

  let ctx = null, grid = null, gctx = null, img = null;
  let cols = 0, rows = 0;
  let lut = null, lutKey = '';
  let t = 0, last = 0, raf = 0, resizeTimer = 0;

  function setup() {
    const cell = Math.max(1, PROPS.cellSize);
    cols = Math.ceil(window.innerWidth / cell) + 1;
    rows = Math.ceil(window.innerHeight / cell) + 1;
    if (!grid) grid = document.createElement('canvas');
    grid.width = cols;
    grid.height = rows;
    canvas.width = cols;
    canvas.height = rows;
    gctx = grid.getContext('2d');
    img = gctx.createImageData(cols, rows);
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    paint();
  }

  function paint() {
    if (!ctx || !img) return;
    const pal = PALETTES[PROPS.palette] || PALETTES["Blue & violet"];
    const want = Math.max(2, Math.min(pal.length, PROPS.bands));
    const zoom = Math.max(1, PROPS.zoom);
    const f = 1 / zoom;
    const d = img.data;

    // 256-entry color lookup: uneven shares -> uneven field sizes, hard edges
    if (lutKey !== PROPS.palette + '|' + want) {
      const used = pal.slice(0, want);
      const total = used.reduce((s, c) => s + c[3], 0);
      const table = new Uint8Array(256 * 3);
      let acc = 0, k = 0;
      for (const c of used) {
        const end = Math.min(256, Math.round((acc + c[3] / total) * 256));
        for (; k < end; k++) { table[k*3] = c[0]; table[k*3+1] = c[1]; table[k*3+2] = c[2]; }
        acc += c[3] / total;
      }
      const lastC = used[used.length - 1];
      for (; k < 256; k++) { table[k*3] = lastC[0]; table[k*3+1] = lastC[1]; table[k*3+2] = lastC[2]; }
      lut = table;
      lutKey = PROPS.palette + '|' + want;
    }

    for (let y = 0; y < rows; y++) {
      const yf = y * f;
      for (let x = 0; x < cols; x++) {
        const xf = x * f;
        // two-octave fbm, gently warped , big organic blobs, no fine detail
        const wx = xf + 0.55 * noise2(xf * 0.7, yf * 0.7, t * 0.6);
        const wy = yf + 0.55 * noise2(xf * 0.7 + 4.7, yf * 0.7 + 2.1, t * 0.6);
        const n = noise(wx, wy, t) * 0.78 + noise2(wx * 2.2, wy * 2.2, t * 1.1) * 0.22;
        let u = (n + 0.72) * 0.694;
        u = u < 0 ? 0 : u > 0.999 ? 0.999 : u;
        const p = ((u * 256) | 0) * 3;
        const i = (y * cols + x) * 4;
        d[i] = lut[p]; d[i+1] = lut[p+1]; d[i+2] = lut[p+2]; d[i+3] = 255;
      }
    }
    gctx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, cols, rows);
    ctx.drawImage(grid, 0, 0);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (last && now - last < 30) return;
    const dt = last ? Math.min(60, now - last) : 16;
    last = now;
    t += PROPS.speed / 100 * (dt / 1000);
    paint();
  }

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 120);
  });

  // Not in the design file, and invisible while the page is on screen: it just
  // stops the loop burning a core in a background tab.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; last = 0; }
    else if (!raf) raf = requestAnimationFrame(loop);
  });

  setup();
  raf = requestAnimationFrame(loop);
}

/* --- tabs ---------------------------------------------------------------- */

function startTabs() {
  const buttons = Array.prototype.slice.call(document.querySelectorAll('nav button'));
  const panels = Array.prototype.slice.call(document.querySelectorAll('section[data-panel]'));
  if (!buttons.length || !panels.length) return;

  function show(tab) {
    buttons.forEach(function (b) { b.classList.toggle('is-active', b.dataset.tab === tab); });
    panels.forEach(function (p) { p.hidden = p.dataset.panel !== tab; });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.tab); });
  });

  document.querySelectorAll('a[data-tab]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      show(a.dataset.tab);
    });
  });

  show('about');
}

document.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('noise');
  if (canvas && canvas.getContext) {
    try { startField(canvas); } catch (err) { canvas.style.display = 'none'; }
  }
  startTabs();
});
