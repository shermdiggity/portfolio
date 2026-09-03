# Cole Sherman, portfolio

A single static page. No build step, no framework, no dependencies: open
`index.html` on any static host and it works.

```
index.html      all copy and structure (the page is fully readable with JS off)
styles.css      tokens, layout, the sheet silhouette
main.js         the background field, the tabs, and the link config
favicon.svg     a cut-paper chip off the field
assets/         photos, the self-hosted display face, the social card
tools/          source for regenerating assets/og.png
```

## Filling in the links

Everything that needs a URL lives in one object at the top of `main.js`:

```js
const LINKS = {
  'resume':    '',   // e.g. 'assets/cole-sherman-resume.pdf'
  'github':    '',
  'linkedin':  '',
  'project-1': '',
  'project-2': '',
  'project-3': ''
};
```

Anything left empty stays **plain text** on the page rather than becoming a link
that goes nowhere. Fill a value in and that label turns into a real link on the
next load. The project names and blurbs themselves are ordinary markup in
`index.html` under `<section id="projects">`.

## The design

**The field.** The background is a flat-colour poster field: 3D simplex noise,
domain-warped, then posterised through a lookup table of colour bands with
uneven widths, so it reads as big flat islands with hard edges rather than a
gradient. It is painted onto a small canvas (roughly 240 cells on the long edge,
whatever the screen size) and upscaled with `image-rendering: pixelated`. The
chunky cells are the aesthetic, and capping the grid means a 4K display costs no
more to paint than a laptop does. It repaints about 14 times a second, stops
entirely when the tab is hidden, and freezes on a single painted frame under
`prefers-reduced-motion`.

Three palettes ship, switchable from the footer and remembered in
`localStorage`. All three are black-dominant, because the black is what stops
the bright flats from colliding. Add another by adding an entry to `PALETTES`;
the swatch builds itself from the three widest non-ink bands.

**The sheet.** One sheet of warm paper, trimmed at the top-right corner like a
filing card, with fine grain in the substrate behind the type. The cast shadow
sits on a wrapper rather than the sheet itself, because CSS applies `filter`
before `clip-path`: put it on the sheet and the shadow is generated from the
untrimmed rectangle and then clipped away along with the corner.

**Type.** Gambarino (self-hosted, from Fontshare) carries the name and the tab
labels. Everything else is the system UI face, which is genuinely neutral and
costs nothing to load.

## Behaviour

- The four sections are a real ARIA tablist: click, tap, `←` `→` `Home` `End`.
- Each tab has its own URL (`#work`, `#projects`, …) so sections are linkable
  and the back button works.
- **With JavaScript disabled every section renders, in full, as one continuous
  page.** Nothing on this site is hidden behind a script or an animation.

## Local development

```sh
python3 -m http.server 8731     # then open http://localhost:8731
```

Regenerating the social card needs a running server and Puppeteer:

```sh
node tools/og.mjs               # writes assets/og.png
```

## Credit

Display face: [Gambarino](https://www.fontshare.com/fonts/gambarino) by Indian
Type Foundry, free for personal and commercial use under the Fontshare licence.
