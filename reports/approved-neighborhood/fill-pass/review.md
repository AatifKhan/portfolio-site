# Blue fills, line hierarchy and softer planting — 2026-10-25

The selected target is the approved Corner Café neighborhood at `assets/portfolio/geomarketeer/cafe-corner/cafe-corner-approved-v2.png`. This pass refines paint and contour treatment in the live native 3D study. The camera, building footprints, feature counts, navigation and interaction model remain unchanged.

## Comparison and normalization

The source and fresh before/after renders were opened and compared in matching crops. Master art is 1448 × 1086, captured from a verified 1500 × 1286 CSS viewport with a 1452 × 1086 canvas at (24, 96.09375), cropped at (26, 96) to exclude its fitting margin. Orbit is 0°, zoom 100%. No source recoloring or artwork textures were introduced.

The browser screenshot pipeline shifts saturated blue slightly. A source-only page was therefore captured through the same browser at the source's natural dimensions (`reference-browser.jpg`), rather than compensating the live art for a screenshot color shift. `park-comparison.png`, `office-comparison.png` and `cafe-comparison.png` use this matched source capture, followed by Before and Updated. The original PNG was also opened separately. `capture-metadata.json` records the dimensions and states.

## Findings and fixes

1. **P2 — reversed/weak façade fills.** The office's left face was too pale and its right face too dark; windows were almost flat panes. Native vertex-color washes now give the left face a fuller blue, the right face a lighter wash, and glazing a blue reveal and broad pale reflection. The café keeps a gentler left-face fill appropriate to the source. `paint-comparison.png` shows the result.
2. **P2 — detail lines competing with structural edges.** Similar line weights and repeated organic brim contours made furniture, interiors and planting read as wire. Main contours remain 2.25px at the source scale; detail is 1.35px, hairline 0.6px and secondary profile 0.8px. Secondary detail still fades as projected size decreases. Duplicate conifer brim rings are removed; interior silhouettes have their own quieter treatment. Bench slats and legs now have filled blue surfaces.
3. **P2 — fragmented bushes and flat trees.** Capsule and ovoid trees have subtle native color washes; conifers have a somewhat deeper blue and smoother tiers. Bushes now use one continuous white crown over a blue-green foliage body, with a limited number of colored flower centers and filled leaf marks. Their boundary has one controlled contour rather than a dense stack of individually outlined components.
4. **Rejected intermediate planting treatments.** Gradient banks appeared woolly, individually outlined petals made a lacy grid, and extruded scallops introduced repeated ribs. Those versions were compared and replaced. The final crowns are closed smooth meshes with flat white fill, and the lower greenery supplies the secondary detail.

## Required fidelity surfaces

- **Typography:** Fraunces/DM Sans and the existing text hierarchy remain intact. Fonts were loaded in both desktop and phone captures.
- **Spacing/layout:** Drawing proportions and measured landmarks are retained. Desktop 1440 × 1000 and mobile 390 × 844 have no horizontal overflow; mobile controls remain at least 44px high.
- **Colors/tokens:** Blue architectural washes, lighter right façades, shaded glazing, quieter secondary strokes, white tree highlights and pale blue-green planting were compared against the matched source capture. Warm café floor fill improves separation of the interior from its linework.
- **Image/geometry quality:** All live artwork remains editable native geometry with no texture maps or baked reference. Soft plants retain real volume at ±15°. Comparison exports only are raster screenshots. There are 26 surface meshes, 43 stroke batches and 216,303 surface triangles including silhouette geometry, below the previous 223,449.
- **Copy/content:** Existing scene instructions and accessible labels remain accurate. The reference map's Updated crop and revision hash have been refreshed to this final rendering.

## Validation

Browser inspection covered ±15° orbit, keyboard turning/reset, rapid zoom/turn/reset changes, comparison switching, loaded fonts, desktop and phone resizing, and both orbit-limit compositions. No browser warnings or errors were recorded. Phone controls are 44px high with no horizontal overflow. Temporary viewport overrides were reset and the live study left open.

`verify-approved-neighborhood.mjs` passes feature counts, 70 window cells, 55 source landmark projections, finite geometry, bounds, zero textures, detail fading, real camera movement, orbit/zoom limits, latest-action settling, pointer cancellation, keyboard reset and immediate reduced-motion fixtures. The original café-block verification also passes unchanged. Syntax and Git whitespace checks pass. Physical-device touch, host OS reduced-motion preference switching and low-end device frame rate were not newly measured.

The white crowns intentionally simplify the source's small floral contours; some foliage distribution and tiny interior silhouettes remain interpretive P3 likeness notes. The source's subtle painted grain is not reproduced. No open P0/P1/P2 implementation findings remain in this paint-and-contour refinement scope. Exact pixel identity is not claimed.

final result: passed
