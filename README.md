# Cole Sherman, portfolio

A static port of the Claude Design project `Portfolio.dc.html`. No build step
and no dependencies: serve the folder.

```sh
python3 -m http.server 8731
```

## Why this is a port and not the exported file

`Portfolio.dc.html` is not self-contained. It is a design-canvas document: the
`<x-dc>` / `<sc-if>` template is parsed at runtime by `support.js`, which needs
`window.React` and `window.ReactDOM` (the canvas host supplies those, the file
does not load them), plus `_ds_bundle.js`, `image-slot.js`, and the
`.image-slots.state.json` sidecar that holds the three photos. Dropped on a
static host it renders nothing.

So the design was ported instead:

| design file | here |
|---|---|
| `<x-dc>` template + `renderVals()` | plain HTML, `main.js` toggles the panels |
| inline `style="..."` on every node | the same values, in `styles.css` |
| `_ds/classical-.../styles.css` | only the tokens and base rules that affect the render, copied into `styles.css` |
| `<image-slot>` + sidecar | `<img>`, with the stored pan resolved to `object-position` |
| `class Component extends DCLogic` | `startField()` and `startTabs()` in `main.js` |

The noise function, the domain warp, the two-octave fbm, the three palettes and
the prop values (`palette: "Blue & violet"`, `bands: 7`, `cellSize: 3`,
`zoom: 40`, `speed: 6`) are carried over unchanged.

## Still to fill in

Four links are `href="#"`, exactly as in the design: the r&eacute;sum&eacute; PDF,
GitHub, LinkedIn, and the three projects. The project names and blurbs are the
design's placeholder copy.

## Two knobs

**Palette.** `PROPS.palette` in `main.js`, one of `"Blue & violet"` (the
design's), `"Ink & electric"`, `"Violet & cyan"`.

**Field cost.** `PROPS.cellSize` is `3`, as designed. That is one noise cell per
3px of viewport, so the work scales with screen area: measured frame gaps are
16.7ms at 390px and at 1440x900, but 83 to 100ms (about 10fps, one core busy) at
2560x1440. Raising `cellSize` to `4` or `5` makes the pixels slightly chunkier
and the cost drop roughly with the square.

## The one thing not from the design

The design has no breakpoints, so on a phone the card would keep its 76/72px
padding and leave about 200px for text. There is a `@media (max-width: 720px)`
block at the bottom of `styles.css` that only shrinks that padding and the outer
margin. Delete the block for the design exactly as drawn at every width.
