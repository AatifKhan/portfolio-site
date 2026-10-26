# GeoMarketeer cityscape — Review 2

This milestone is the full-neighbourhood artwork review, not the complete eight-beat case-study introduction. It lives at `/cityscape-review.html`; the existing portfolio remains the destination for subsequent integration after this artwork checkpoint.

## Authoring and ownership

The geometry is authored in `build_scene.py` and the three `layout_*.py` includes, with deterministic placements and seed 41. No purchased or external model assets are used. The latest selected image at `assets/portfolio/geomarketeer/pune-approved-reference.png` supplies the art direction. This is a Camp-inspired illustrative neighbourhood, not a survey or property listing.

The user approved the previous composition as the basis for continuing. Review 2 preserves its road route, landmark and both café anchors. It adds twelve frontage treatments, rounder sculpted tree canopies, warmer daylight, and a separate road-paint batch. Ground self-shadowing is disabled to remove near-coplanar junction artifacts while retaining shadows received from buildings and trees. The earlier assets remain intact in `review-1/`; the earlier sector builder is retained as `build_scene-sector-v1.py`.

The browser comparison also caught inward-facing nave window normals and vegetation obscuring the alternative storefront. The main builder now corrects the lancet orientation and invokes `clear_forecourt.py` after assembly. The latter removes only vegetation components in the café sightline; it does not relocate the shop or change the road. `repair_arch_normals.py` records the one-time correction applied to the initial unbaked Review 2 source; it is not needed for clean builds.

Export optimization removes unused normal/tangent attributes from these unlit meshes before welding. The baked facet lighting is retained in the textures, while mobile geometry can be reduced without preserving redundant hard-normal seams. Desktop atlases use 2560 px architecture / 1024 px ground, mobile 1536 / 768. Narrow road paint remains vertex-coloured geometry. When publishing a later artwork revision at the same filenames, update the viewer's `assetFile` revision and HTML script/style revision together to avoid stale cached models.

Blender 5.2.3 LTS was used. The unbaked editable source and the baked model are both saved under `assets/portfolio/geomarketeer/review-2/`:

- `pune-source.blend`: source materials, geometry, lights and hero camera.
- `pune-baked.blend`: packed texture atlases and the export-ready scene.
- `pune-desktop.glb` / `pune-mobile.glb`: Meshopt geometry and KTX2/UASTC textures.
- Seven PNG and WebP stills: hero, rotation endpoints, synagogue detail, primary café, homes and alternative storefront.
- `scene.json`: named anchors, vehicle routes and authoring metadata.

Architecture and ground are two batched meshes with baked diffuse lighting; road paint is a third, vertex-coloured batch so narrow markings do not rely on tiny UV islands. Vehicle meshes remain separate; `scene.json` records the actual total and the moving subset. Five named anchors survive optimization. Ground baking hides vehicles to prevent static shadows from staying behind moving cars. The GLBs use unlit materials; no real-time light or shadow calculation is required. The mobile export removes narrow sub-pixel detail components while retaining the landmark and large silhouettes; it does not merely downsample textures on the desktop geometry.

## Reproduce

1. Install Blender and Node.js, then run `npm ci`.
2. Install the official Khronos KTX-Software 4.4.2 tools, or set `TOKTX` to the absolute path of its `toktx` executable. Its matching `libktx` must be available alongside the tool. During this build, the official macOS package was extracted into `/private/tmp/geomarketeer-ktx-tools/`; it was not installed globally.
3. Run `npm run city:build`. On this Mac, Blender requires execution outside the command sandbox for Metal initialization.
4. Run `npm run city:optimize` with `TOKTX` set if it is not on PATH.
5. Run `node art/geomarketeer/verify.mjs` to verify budgets, anchors, texture formats and compression.
6. Serve the repository with `npm run dev` (or use the existing server on port 4174), then open `/cityscape-review.html`.

The optimizer vendors the pinned Three.js 0.160.1 runtime and matching model/texture decoders, so the 3D scene has no CDN dependency. Fonts are loaded from Google Fonts with local fallbacks. No framework is added.

To rerender stills without rebaking: launch Blender in background with `pune-baked.blend` and `--python art/geomarketeer/render_views.py`, then rerun the optimizer. The source script also invokes this rendering script after each build.

For a faster composition-only check, append `-- --preview` to the build command. To rebake without rebuilding geometry, open `pune-source.blend` in background with `--python art/geomarketeer/rebake.py`. `export_mobile.py` can also be run against `pune-baked.blend` independently. Do not save that reduced-detail scene over the editable source.

## Review behaviour

- Five location views are visual-review controls, not the eventual eight story beats.
- Orthographic camera; 28° total yaw, fixed pitch; 100–125% zoom within each view.
- Page wheel scrolling remains native. Touch manipulation requires Explore mode.
- Ambient traffic uses two opposing fourteen-vehicle lanes on the authored curved route, and pauses offscreen or in hidden tabs. Other vehicles remain parked or stationary.
- Render scheduling is capped at 60 fps desktop / 30 fps narrow layouts.
- Reduced-motion mode defaults to matched stills. `?view=still` exposes the same still-view presentation for review.
- WebGL/load failure keeps the selected still visible and disables unavailable 3D controls.

## Remaining approved milestones

Review 2 covers the full city. Review 3 adds the scroll-driven eight-beat story and integrates it into `minimal_portfolio.html`, after this artwork review. This checkpoint does not assert pixel-identical illustration fidelity or real-device mobile performance. Asset sizes use decimal MB, consistently with the 6/3 MB preferred targets and 8/4 MB ceilings.

## Reference reconstruction study — 2026-10-23

Review 2 artwork is retained unchanged, but is not accepted as a faithful match. A separate first-pass blueprint and grey model lives at `/cityscape-blueprint.html?revision=blockout3`.

- `reference-blockout.json`: manually traced roof envelopes, road polygons, island boundary and inferred façade drops. Stable IDs identify 86 visible building masses, not an exhaustive survey of hidden structures.
- `build_reference_blockout.py`: creates the separate editable Blender scene, GLB, two diagnostic camera renders and inventory in `assets/portfolio/geomarketeer/reference-blockout/`.
- `reference-evidence.mjs`: creates the annotated source and source/render comparison, checks unique IDs and verifies all 86 reference IDs and both cameras survive GLB export.

Reproduce with Blender `--background --python art/geomarketeer/build_reference_blockout.py`, then `node art/geomarketeer/reference-evidence.mjs`. Neither script touches the existing city or portfolio HTML.

The camera calibration fits a rectangular hypothesis to four manually selected landmarks. The reference actually has a five-point island outline with a cut front-right corner; it is back-projected separately. Consequently the residuals (31.8 px perspective / 47.6 px orthographic at 1672 × 941) are diagnostics, not an accuracy score or evidence of a unique recovered camera. Earlier provisional 4.3/84.8 px results used the wrong front-right landmark and are superseded.

Roof envelopes are projected onto inferred-height planes. Their alignment at the main view is by construction, not independent validation. Rear geometry, ground footprints and heights need review at alternate angles. This pass deliberately has no textures, windows, traffic or vegetation. Curved and pitched silhouettes are basic masses; stepped façades and roof details remain for the architecture pass. Calibration-camera changes are proposals only; the production camera remains orthographic.

The browser study offers original/annotated reference, overlay opacity, perspective/orthographic comparison and ±14° inspection. It renders on demand, uses local Three.js, and retains a Blender still if WebGL loading fails. It is a review tool, not the final narrative introduction.

## Detailed landmark checkpoint — 2026-10-23

Open `/cityscape-blueprint.html?revision=landmark3&view=detail`. This adds an authored synagogue and garden to a copy of the approved grey study; the existing Review 2 assets remain unchanged. The source/current comparison below the viewer uses identical source crop coordinates.

Reproduce using Blender `--background --python art/geomarketeer/build_landmark_section.py`, then `node art/geomarketeer/optimize_landmark.mjs`. The optimizer uses the existing official toktx executable specified in its source. Outputs live in `assets/portfolio/geomarketeer/landmark-section/`: editable `landmark-source.blend`, baked scene, raw and optimized GLBs, light atlas, main/detail renders, comparison and asset report.

The section has 8,722 authored triangles. A 2048px baked illumination atlas is carried by an unlit material, encoded to KTX2; geometry uses Meshopt. The optimized model including grey context is 1,977,112 bytes (1.98 decimal MB). This is an asset-size measurement, not a frame-rate result. Local viewer dependencies and decoders are reused.

Verified in the macOS in-app browser at 1266 × 712: model loads, both ±14° endpoints keep the landmark visible, reset works, grey/detail switching works, and no warnings/errors were captured. Screenshots: `reports/reference-blockout/landmark-{browser,left,right}.png`. No real-device mobile or FPS acceptance is claimed.

This is a partial artwork checkpoint, not completion of Review 1. Remaining work includes more irregular foliage, richer façade detail, browser/Blender colour matching, grey-context depth overlap artifacts at alternate angles, and the adjacent café, residence, pavement and traffic section. Full reference fidelity remains unapproved.

## Review 1 representative neighbourhood — 2026-10-23

Open `/cityscape-blueprint.html?revision=golden3&view=detail`. This supersedes the landmark-only checkpoint above and remains separate from the existing Review 2 production city.

The authored batch now covers L01–L03, M01–M05, N16, W24, S13–S23 and E01–E06. It includes the landmark, main-road café, quieter café, surrounding residential/commercial buildings, varied roof treatments, windows, balconies, street trees, palms, two crossings, pedestrians and twelve vehicles split across opposing main-road directions. Buildings beyond the Review 1 crop remain grey to expose the boundary of completed work.

The editable and baked Blender files, renders and GLBs remain in `assets/portfolio/geomarketeer/landmark-section/`. `review1-section.png`, `reference-review1.png` and `review1-comparison.png` use the same `[620,250,780,500]` source crop. `reports/reference-blockout/review1-browser-comparison.png` compares the browser camera’s `[560,210,900,580]` crop at 859 × 555 pixels per side.

The viewer now offers four source-calibrated close views—junction, synagogue, café and street—and a draggable reveal of the matching approved-reference crop. Changing focus restores the main camera; using either rotation endpoint clears the reveal because the single source image cannot truthfully represent a rotated view. The main-road café now has a continuous awning, warm shopfront, terrace parasols and planted edges so its story role remains legible at close range.

The first golden-section rebuild replaces M01–M04 with bespoke commercial volumes: deep curtain-wall bays, framed entrances, roof services, parking, a planted café apron and parked cars. It also adds a darker authored main road, twelve balanced moving vehicles, more pedestrians and a denser planted commercial edge.

The second pass adds the source's blue café roof, larger readable vehicles, planted apartment plots and a denser middle-ground tree canopy.

The third pass gives the visible apartment group roof gardens, pergolas and water tanks, broadens layered tree canopies, and replaces radial palm spokes with authored tapered leaf ribbons.

Final optimized asset: 1,762,028 bytes, 57,069 triangles, 83 meshes/primitives, one KTX2 light atlas, five materials and Meshopt geometry. The browser loaded at 1266 × 712; all close-view controls, the 0–100% reveal, main angle, reset and +14° endpoint passed with no captured warnings/errors. These are desktop test results, not real-device FPS or mobile claims.

Remaining visual work before full-city expansion: architectural silhouettes are still less varied than the approved illustration, foliage remains more geometric, streets lack the source’s full density of micro-detail, and the grey boundary is intentionally visible. Review 1 is ready for visual approval but does not claim exact full-reference parity.
