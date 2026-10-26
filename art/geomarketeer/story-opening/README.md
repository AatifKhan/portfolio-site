# GeoMarketeer — five-beat image opening

Implemented in both portfolio entrypoints on 2026-10-25. The introduction stays inside the 560px article column, with illustration, story copy and controls stacked vertically.

- [Five frames and exact story copy](index.html) — also the script-free reading fallback.
- [Plain-text copy](copy.txt).
- [Export manifest](exports.json).
- [Browser validation and screenshots](../../../reports/geomarketeer-story-opening/README.md).
- [Preserved 3D work](../preserved-3d-2026-10-25/README.md).

The live page transforms one unchanged master PNG from `assets/portfolio/geomarketeer/story-opening/master.png`. Camera coordinates and registered annotations are shared with the frame exporter through `scripts/geomarketeer-story-data.js`. The five exported PNGs are 1120 × 630 presentation renders of that same 1536 × 1024 source, not independently generated scenes or new high-resolution detail.

Re-export and verify from the project root:

```sh
node art/geomarketeer/export-story-opening.mjs
node art/geomarketeer/verify-story-opening.mjs
node art/geomarketeer/verify-story-controller.mjs
```

Story state one appears immediately. Four Next actions reveal the remaining states; Read the case study selects Full Story and focuses the research section. Back, Skip introduction, rapid reversals and resizing preserve the shared image and geography. Existing standalone 3D studies are retained, and the portfolio introduction does not load their renderer.
