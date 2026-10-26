# Café block review build — 2026-10-25

Latest refinement: see `linework/review.md` for simplified contours, adaptive profile fading, and before/after evidence addressing the user's concern about thick lines at a distance.

Preview: http://127.0.0.1:4174/minimal_portfolio.html?project=geomarketeer

This is the agreed first-block milestone: the café, its office neighbor, pavement, planting, furniture, three cars, and four walking figures. It establishes actual geometry and interaction before expanding the neighborhood. It is an art-direction review build, not a claim that the complete generated illustration or the reference site's production quality has been reproduced.

## What to inspect

- Select **Corner café**, then **Look inside**. The upper storey and roof are removed from the same scene, revealing the counter, espresso equipment, display case, seating, and pendants.
- Turn left or right to see the side and rear façades. Glazing, upper lounge furniture, doors, service vents, and rooftop equipment are geometry.
- Pause **Street life** to study the details without resetting cars or people.
- Drag to pan, use zoom controls, or use the viewport's keyboard controls: arrows, +/−, brackets, and Home.
- On a phone, ordinary swipes scroll the page. **Move map** enables map panning and pinch handling. Place selection and all controls also work without gestures.

## Authoring

- `scripts/geomarketeer-block-model.js`: dimensions, palette, geometry helpers, architecture, interior, foliage, vehicles, walkers, picking hulls, and animation paths.
- `scripts/geomarketeer-block-viewer.js`: orthographic camera, framing, selection, hover, pan/zoom, rotation, fullscreen, and lifecycle.
- `styles/geomarketeer-block.css`: the live-scene additions to the existing explorer UI.
- Both portfolio entrypoints load these shared modules. Their surrounding layouts and the existing menu remain separate.

The café roof and upper storey are named scene components, allowing later animation without reconstructing the art. Faces, intentional edges, and foliage silhouettes use separate materials. The uppercase café sign is vector font geometry. There are no raster image planes, textures, or external rendering requests in the new scene.

The local Three.js modules remain pinned to the repository's existing 0.160.1 version, with MIT notices retained. The matching line and font loader helpers are vendored locally; no new package dependency was introduced for this block.

## Evidence

- `cafe-comparison.png`: source café and live café together; crop sizes and normalization are recorded in `comparison-metadata.json`.
- `four-angles.png`: the same block at four quarter-turn views.
- `cafe-detail.jpg` / `cafe-interior.jpg`: full-size exterior and cutaway.
- `mobile-review.png`: 390 × 844 embedded, selected, and cutaway states.
- `index-embedded.jpg`: the shared scene inside the other portfolio layout.
- `geometry-verification.json`: finite geometry, component naming, zero textures, actual ray picking, isolated cutaway behavior, vehicle clearance/continuity, and pause checks.

Browser captures are JPEG. Fine blue strokes are softened and their color is affected by capture processing. The comparison retains those differences without recoloring either source.

## Scope and remaining review

Functional and responsive checks passed for this first-block scope. Art direction still needs the user's review before expansion: the model has its own proportions, simpler planting and figures, and less small-scale decorative detail than the generated illustration. It intentionally contains two buildings rather than the source's whole neighborhood. Physical-device pinch, GPU performance, and OS-level reduced-motion switching were not exercised in this desktop session.

The desktop sample reported a median rendered-frame interval of 16.7ms with street life running, approximately 161 draw calls in the observed view, and no new JavaScript errors. This is an observation on the current machine, not a mobile performance guarantee.

To run the independent geometry checks:

```sh
node art/geomarketeer/verify-cafe-block.mjs
```
