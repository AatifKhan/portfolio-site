# Preserved GeoMarketeer 3D studies — 2026-10-25

The case-study opening is moving to the approved raster illustration and five-beat story. The existing 3D work is preserved for a future phase, not deleted or rebuilt.

## Open the existing 3D work

- From the normal project server: /geomarketeer-cafe-block-study.html — the procedural café block formerly embedded in both portfolio entrypoints.
- /geomarketeer-neighborhood-study.html — the existing limited-orbit full neighborhood study, unchanged.
- /cityscape-review.html and /cityscape-blueprint.html — earlier city/model studies remain at their existing project paths, unchanged.

## Self-contained procedural snapshot

[Download the portable source snapshot](snapshot.tar.gz). The unpacked `snapshot/` directory is also retained for direct inspection.

The snapshot/ directory contains the procedural café and neighborhood source modules, associated styles, local Three.js/vendor modules and fonts, approved neighborhood reference image, package manifests, and original portfolio HTML from before removal of the embedded 3D opening. The original HTML is context backup, not a full portfolio asset bundle.

To run the preserved procedural studies independently:

```sh
python3 -m http.server 4175 --bind 127.0.0.1 --directory art/geomarketeer/preserved-3d-2026-10-25/snapshot
```

Then open http://127.0.0.1:4175/geomarketeer-cafe-block-study.html or /geomarketeer-neighborhood-study.html. These procedural views use bundled local Three.js assets. Google Fonts may fall back offline; geometry does not require a remote service.

Original Blender/GLB city assets and their builders remain under assets/portfolio/geomarketeer/ and art/geomarketeer/. This snapshot does not duplicate those larger binary assets; they have not been altered by the raster-opening work. Reuse their corresponding existing review pages for the prior city pipeline.

The archive records original source file hashes in manifest.json. The new standalone café-block wrapper is a presentation shell around the unmodified viewer and geometry.
