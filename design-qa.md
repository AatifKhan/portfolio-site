# Design QA — Portfolio landing page

**Source visual truth:** https://www.anthropic.com/institute/econ-scenarios (captured in the in-app browser on 2026-09-10; desktop reference state).

**Implementation under review:** http://localhost:4173/ (verified in the in-app browser; responsive compact viewport and selected-work anchor state).

## Comparison focus

This is an original portfolio interpretation, not a one-to-one content clone. The review checked the shared visual grammar: warm paper ground, fine editorial rules, high-contrast serif display type, compact research-label metadata, transparent data-color accents, restrained motion, and deliberate open space.

## Findings

- Navigation routes to the existing Work, Writing, and Reading views; Home returns to the new landing page.
- The primary CTA scrolls to Selected Work, and the contact CTA reaches the final contact section.
- The generated research-field artwork retains legible negative space around the hero copy at the compact responsive breakpoint.
- Heading hierarchy, image alternative text, keyboard-focusable links, and reduced-motion fallbacks are present.
- No overflow, clipped hero content, broken asset references, or high-severity visual regressions were visible in the inspected browser states.

## Result

final result: passed

<!-- New reviews are appended below; prior reviews describe earlier implementations. -->

---

# Live portfolio + GeoMarketeer integration QA — 2026-10-23

**Source visual truth:** `https://aatifkhan.github.io/portfolio-site/`. **Local implementation:** `http://127.0.0.1:4174/minimal_portfolio.html?revision=live-geo2`, inspected in the macOS in-app browser at 1266 × 712.

## Verification

- The live portfolio's typography, centered navigation, home introduction, work timeline, writing, reading, transitions, and footer remain the canonical local design.
- “Dashboards Are Boring.” remains the 2024 lead project and opens its own Quick Scan and Full Story views.
- GeoMarketeer is added as a separate 2017 project; it opens the full case study with the approved 1672 × 941 Pune illustration and all eight story beats.
- Both case-study detail toggles retain independent state and controls.
- Browser checks found no broken images; the approved city illustration reported its full natural width of 1672 pixels.
- Static checks found no duplicate IDs, missing local assets, JavaScript syntax errors, or whitespace errors.
- The only console message is the pre-existing Tailwind CDN production advisory inherited from the live source; it does not affect the local prototype.

## Remaining publication follow-up

- Compile Tailwind locally before production deployment to remove the inherited CDN advisory.
- Perform final touch interaction and text-scale checks on a physical phone before publishing.

final result: passed

---

# Design QA — GeoMarketeer interactive city

**Source visual truth:** `assets/portfolio/geomarketeer/pune-cityscape-poster.png` (1672 × 941 PNG; selected low-poly Pune cityscape direction).

**Implementation under review:** `http://127.0.0.1:4174/minimal_portfolio.html`, GeoMarketeer → Full Story. Verified in the in-app browser on 2026-10-22; the browser screenshot is retained in the task's rendered browser evidence (Tab 6). The browser capture service does not expose a project-local screenshot path.

**Viewport and state:** Desktop browser capture (1266 × 711 rendered viewport), story beat 03 / “What if?” active. Mobile viewport tested at 390 × 844. The source is a static illustration; the implementation is intentionally a real-time, simplified 3D interpretation so it can rotate and zoom.

## Full-view comparison

- The implementation preserves the selected scene’s warm paper background, low-poly miniature language, muted clay / sage / blue palette, roads, buildings, a landmark church silhouette, commercial block, and Pune-style autos.
- It intentionally does not attempt pixel-for-pixel reproduction of the raster cityscape: the scene is rebuilt from simple native 3D geometry to allow credible controlled rotation and data-layer reveals.

## Focused interaction checks

- Case study opens directly to Full Story and the scrollytelling scene is visible above the narrative.
- Scroll activated beat 03 and updated the live caption to “What if local demand was visible before deciding?” while revealing the associated data state.
- Canvas exposes a keyboard-focusable interaction target and a visible Reset view control; drag, wheel and pinch are bounded in code to a 28° rotation range and 0.9–1.35× zoom range.
- Console check found no application errors; the only warning is the pre-existing Tailwind CDN production warning.

## Findings

- [P3] The runtime scene is intentionally more schematic than the selected poster. A future visual pass can replace primitive buildings with a hand-authored low-poly GLB scene while preserving the interaction contract.
- [P3] On small screens, the poster fallback and the reduced-height interactive viewport remain functional, but the story copy is necessarily compact.

## Required fidelity surfaces

- **Fonts and typography:** Uses the existing Fraunces display and small editorial UI treatment; readable at desktop and mobile capture sizes.
- **Spacing and layout rhythm:** Stage is sticky with narrative cards paced below; mobile collapses controls and copy without horizontal overflow in the inspected state.
- **Colors and visual tokens:** Matches the warm ivory, muted terracotta, sage, dusty blue and charcoal direction from the selected scene.
- **Image quality and asset fidelity:** The selected cityscape is retained as the image fallback. The live city is an intentional native 3D reinterpretation, not a substitute asset presented as an exact copy.
- **Copy and content:** All four beats follow the agreed problem → blind spot → what-if → stronger choice story.

## Result

final result: passed

---

# Design QA — GeoMarketeer case study

**Source visual truth:** https://aatifkhan.github.io/portfolio-site/ (desktop and 390 px-wide mobile states captured in the in-app browser on 2026-10-21).

**Implementation under review:** http://127.0.0.1:4174/minimal_portfolio.html (same states captured in the in-app browser on 2026-10-21; local preview screenshot is retained in this task's browser evidence).

## Comparison focus

Faithful recreation of the source portfolio's quiet, editorial layout: off-white field, narrow centred column, Fraunces display typography, compact navigation, muted metadata, and the existing Quick Scan / Full Story pattern. GeoMarketeer is added as the first selected-work item without changing the design language.

## Findings

- Home and Work retain the source layout and navigation treatment.
- The 2017 GeoMarketeer entry appears first in Selected Work and opens its dedicated case-study view.
- Quick Scan exposes the problem, research gap, design question, and approach; Full Story reveals the longer narrative.
- Desktop and 390 px-wide mobile views show readable wrapping, visible controls, and no clipped or overflowing content.
- The visible work thumbnails have been copied into local assets; the portfolio no longer depends on remote Unsplash image URLs.

## Result

final result: passed

---

# GeoMarketeer — Blender Review 1, 2026-10-22

This section supersedes the earlier primitive-city assessment. It covers the new standalone artwork checkpoint at `http://127.0.0.1:4174/cityscape-review.html`, not the complete case-study introduction.

**Source visual truth:** `assets/portfolio/geomarketeer/pune-cityscape-poster.png` (1672 × 941) and the user's two-column wireframe. The former represents the full neighbourhood; this checkpoint intentionally covers a smaller representative sector.

**Implementation evidence:** `reports/geomarketeer-review-1/desktop.png` (1440 × 1000 browser capture), `mobile.png` (390 × 844 viewport), `detail-browser.png`, `right-boundary.png`, and `still-cafe.png`. Source and implementation are composited into `browser-comparison.png`; reference and Blender reconstruction into `reference-comparison.png`; landmark crops into `landmark-comparison.png`. Panels use contain-fit normalization; density and different scene extents are not treated as pixel-identical targets.

## Required fidelity surfaces

- Typography: Fraunces display headings maintain the portfolio's serif direction. Body and control text use Inter/Arial; wrapping and hierarchy inspected on desktop and phone.
- Layout: city on the left and narrative on the right; separate view controls; stacked phone treatment. Main narrative does not cover the model. Desktop scene height was reduced after initial inspection to keep more of the viewer and controls together.
- Colours: cream/terracotta architecture, muted blue glazing, green foliage and warm background. Removed a second tone-mapping treatment after the browser appeared too subdued. Standard still rendering now matches the baked-texture viewer treatment.
- Image quality: actual exported 3D geometry and baked lighting, not a transformed reference plane. Landmark, roof faces, façade shading, foliage and camera underwent the iterations recorded in `reports/geomarketeer-review-1/review.md`. The current kit and street context remain less varied and less dense than the selected full-neighbourhood illustration.
- Copy: four clearly identified visual-review locations; illustrative geography disclosed. No invented footfall, financial outcomes or research results. Eight-beat story deliberately awaits the agreed artwork gates.

## Checks and open acceptance

Asset verification and the tested browser interactions passed; console checks returned no warnings/errors. Exact sizes, counts, timings, device limitations and untested scenarios are recorded in the review report. Reduced-motion uses the same still presentation inspected through the explicit still-view route; OS preference changes and forced context loss have not been exercised.

**Visual acceptance remains open.** This is the user-requested Review 1 checkpoint. The current architectural detail, foliage and lighting need the user's visual judgment before expanding the model. Passing the technical checks does not establish parity with the generated reference. No full-city or integrated-story completion is claimed.

final result: blocked

---

## Focused fidelity pass — 2026-10-23

**Source visual truth:** `assets/portfolio/geomarketeer/pune-approved-reference.png`, unchanged. **Implementation:** `/cityscape-blueprint.html?revision=focus1&view=detail`, tested in the macOS in-app browser at 1266 × 712.

The earlier full-section view made authored improvements difficult to distinguish. The default presentation is now a source-calibrated crop of the synagogue–café junction, with dedicated synagogue, café and street close-ups. A native range control reveals the matching reference crop directly over the live 3D canvas; this makes both improvements and remaining drift inspectable rather than relying on memory. `reports/reference-blockout/focus-cafe-comparison.png` records the 50% live/reference split; `focus-cafe-reference.png` records the unchanged source crop.

The café frontage received an authored continuous blue awning, warm interior layer, terrace parasols and planters. The rebuild is 1,906,336 bytes / 35,415 triangles / 83 primitives / one KTX2 atlas with Meshopt. Browser verification passed for all four focus buttons, reveal values 0/50/100, +14° rotation, automatic reveal reset on rotation, and empty warning/error logs.

### Remaining visual findings

- P1: the underlying reconstruction still does not align pixel-for-pixel with the source. Building footprints are source-traced, but single-image perspective recovery is approximate; the reveal correctly exposes this drift.
- P1: the source has much denser vegetation, pavement furniture, traffic and individually authored façades. The focused section is now easy to evaluate, but not yet an exact match.
- P2: the café is more legible, although its roof silhouette, neighbouring mall frontage and street planting remain simpler than the reference.
- Pending: mobile/browser reflow, −14° screenshot in this revision, forced WebGL failure and reduced-motion checks.

final result: blocked

This is a stronger and more reviewable fidelity checkpoint, not final reference parity or full-city acceptance.

Blocker for final design sign-off: Review 1 artwork approval and resolution of any requested visual refinements. The local preview is available for that review; this is not a deployment or final implementation handoff.

## Revision 02 — full composition reconstruction, 2026-10-22

The latest source visual is `assets/portfolio/geomarketeer/pune-approved-reference.png`. The earlier sector captures above are historical, not evidence of this revision. Current browser evidence: `reports/geomarketeer-review-1/revision-02-browser.png`.

The reconstruction now establishes the sweeping main road, central synagogue, upper-right mall, residential clusters and open grounds. Both café candidates are present. Landmark-facing details and baked atlases were revised; mobile detail has a separate export. The standalone review remains separate from the portfolio's final narrative.

Verified exported assets: desktop 7,113,736 bytes / 219,954 triangles / 47 draw calls; mobile 3,554,404 bytes / 139,704 triangles / 47 draw calls. Both meet ceilings, but exceed the preferred 6 MB / 3 MB download targets. Asset checks confirm five anchors, compressed geometry/textures and equal opposing moving-vehicle counts. The latest live desktop preview loaded without captured console warnings/errors. No real-device mobile performance claim is made.

Open visual findings:

- P1: Architectural variety, foliage shapes and warm material richness still fall short of the approved image. Composition is closer; exact visual parity is not established.
- P2: Small dark bake artifacts remain visible in close road/junction details and require cleanup.
- P2: Preferred download targets are not yet met.
- Pending: refreshed mobile browser verification for this revision, real-device performance, and full narrative integration after artwork acceptance.

final result: blocked

This is a progress checkpoint, not final artwork approval or integrated-story acceptance.

---

## Reference reconstruction study 01 — 2026-10-23

Scope: the user requested a measured blueprint and separate grey massing checkpoint before further architectural detail. This is not final-city acceptance. Existing Review 2 assets and portfolio pages were not modified.

Source visual truth: `assets/portfolio/geomarketeer/pune-approved-reference.png`, 1672 × 941 pixels.
Implementation: `/cityscape-blueprint.html?revision=blockout3`, desktop in-app browser, 1266 × 712 screenshot pixels. The scene region preserves the source 1672:941 aspect ratio at approximately 1150 × 647 CSS pixels; source and render are overlaid at the same scale without cropping. Current accepted browser comparison: `reports/reference-blockout/overlay-browser.png` (50% original / 50% live GLB, perspective diagnostic camera, main angle). This combined input was opened and inspected after capture.

Additional combined evidence: `assets/portfolio/geomarketeer/reference-blockout/reference-vs-grey.png`, source and latest Blender render each normalized to 836 × 471; focused landmark comparison `reports/reference-blockout/landmark-comparison.png`, identical source-pixel crops (700,315,340,260), both enlarged 2×. Both combined images were opened and inspected. `annotated-reference.png` in the same asset directory records the final IDs, including the corrected quiet café. Earlier `grey-browser.png` and `blueprint-browser.png` captures are iteration evidence, not the final geometry revision.

### Comparison history

1. P1: the first four-corner hypothesis misidentified the cut front-right corner, leaving the foreground base too shallow. Fixed the five-point island boundary and repeated calibration. Old provisional 4.3/84.8 px numbers are invalidated; current rectangular-hypothesis residuals are 31.8/47.6 px. The source is not a consistent rectangular projection. The boundary itself is now explicitly traced, not asserted to be a recovered rectangle.
2. P2: overlapping road planes produced black intersection artifacts in the first Blender render. Assigned distinct small elevations and disabled road shadow casting; latest Blender comparison no longer has those black intersection patches.
3. P1: quiet café S13 was initially traced over the neighbouring house. Inspected a source close-up, moved the envelope to the café's actual roof, regenerated Blender, GLB, inventory and annotation. Latest browser overlay includes the corrected placement.
4. P2: inventory selection replaced its focused button. Restored focus to the rebuilt same-ID button. Source checks passed; a final keyboard-focused retest remains outstanding.

### Current findings and limits

- P1, final-artwork scope: roof silhouettes, stepped buildings, façade shapes and landmark proportions remain simplified masses. Source-projected roof envelopes are not independent evidence of accurate 3D geometry. Heights and concealed boundaries need manual architecture review. Do not start the finishing pass under an assumption that these are approved.
- P1, camera decision: perspective is a diagnostic proposal only. The orthographic contract remains unchanged in production. Single-view constraints cannot establish a unique original camera or hidden geometry; review both diagnostic modes before adopting a change.
- P2, trace completeness: 86 catalogued visible masses / 12 road sections / 4 grounds are a first inventory, not a verified exhaustive building count. Peripheral fragments, courtyards, pavement widths, plot boundaries and smooth junction contours need another tracing pass. Confidence labels describe visibility, not measured accuracy.
- Expected for this checkpoint: no materials, greenery, façade detail or traffic. Missing finished-artwork content is not presented as a final result.

### Required fidelity surfaces

- Typography: review UI uses existing quiet editorial serif headings/system controls; no typography is part of the source city illustration. Desktop labels are readable and inventory provides text alternatives to canvas IDs.
- Spacing/layout: source and model share the exact aspect ratio in the overlay; corrected foreground cut corner. Full stage visible in accepted capture. Mobile is not browser-verified this turn.
- Colour/tokens: neutral grey is intentional for geometry inspection. Warm reference material/lighting fidelity is deferred, not passed.
- Image/model fidelity: approved image remains unchanged. Blender GLB contains all 86 stable reference IDs and both camera objects. Curved villa and tower have preliminary silhouettes. Landmark close-up confirms substantial architectural detail still remains.
- Copy/content: labels clearly distinguish observed traces, inferred heights, calibration hypotheses and unchanged production behaviour. No claims of surveyed geography or measured business outcomes.

### Verification

`node --check scripts/cityscape-blueprint.js` and `node art/geomarketeer/reference-evidence.mjs` passed. GLB: 137,892 bytes; 86 unique reference IDs; two cameras. Browser verified model load, overlay, 50→70→50 opacity, orthographic/perspective switching, ±14° controls, zone filtering and selected-row description. Console warning/error query returned an empty list for final revision. No continuous animation loop. Reduced-motion is naturally static in this review tool. WebGL failure handling exists but forced failure, real mobile, screen-reader and zoom/reflow tests were not exercised.

### Next implementation gate

Review camera and traced layout; correct remaining contours and per-building masses, then finish the synagogue test section. No portfolio story integration or replacement of existing city assets at this stage.

final result: blocked

Final artwork sign-off remains blocked by camera/layout approval and unfinished geometric fidelity. The separate study is available for the requested intermediate review; it is not a completed-city handoff.

---

# GeoMarketeer — Review 1 representative neighbourhood, 2026-10-23

**Source visual truth:** `assets/portfolio/geomarketeer/pune-approved-reference.png`, 1672 × 941.

**Implementation:** `http://127.0.0.1:4174/cityscape-blueprint.html?revision=review1c&view=detail` in the macOS in-app browser. Browser screenshot: `reports/reference-blockout/review1-browser-full.png`, 1266 × 712 at device density 1. The live canvas is 859 × 555 CSS/image pixels. It uses a `[560,210,900,580]` camera crop from the source, normalized to 859 × 555 for comparison.

**Combined evidence:** `reports/reference-blockout/review1-browser-comparison.png`, source left and browser implementation right at 859 × 555 each. Focused landmark evidence: `assets/portfolio/geomarketeer/landmark-section/comparison.png`, identical `[700,315,340,260]` source coordinates enlarged to 680 × 520. Blender section evidence: `assets/portfolio/geomarketeer/landmark-section/review1-comparison.png`, identical `[620,250,780,500]` crop normalized to 936 × 600 per side. Rotation captures: `reports/reference-blockout/review1-left.png` and `review1-right.png`.

## Comparison history

1. P1: first implementation showed an isolated landmark/café/residence in a mostly grey crop. Added authored geometry for all traced buildings occupying the Review 1 neighbourhood: M01–M05, N16, W24, S13–S23 and E01–E06. Post-fix evidence is the final browser comparison.
2. P1: contextual façades repeated the same dark balcony/window treatment. Added four deterministic frontage styles, lighter framed glazing, selective balconies, ground canopies, hipped roofs and varied rooftop cores. Latest render shows varied window rhythm and roof colour.
3. P2: streets and plots remained visually disconnected. Added 37 street trees, eight palms, pavement, two crossings, pedestrians and balanced opposing main-road vehicles. Palm crowns were thickened after the first planting render looked skeletal.
4. P2: close camera framing clipped the tower and later failed to contain the expanded section at rotation limits. Reframed the viewer to 900 × 580 source-equivalent pixels and verified both ±14° endpoints plus reset.

## Required fidelity surfaces

- Fonts/typography: the review interface retains its established editorial serif/system-body hierarchy. The reference art contains no page typography. Labels, controls and status copy remain legible at the tested viewport.
- Spacing/layout: source and browser artwork are compared at equal 859 × 555 dimensions. Main angle and rotation endpoints preserve the landmark and café. The review crop boundary is visible by design; this is not the final case-study layout.
- Colours/tokens: warm brick, cream, terracotta, muted blue glazing and varied greens now carry through the baked browser material. The source still has richer tonal variation and softer light falloff.
- Image/asset fidelity: the browser renders actual 3D geometry with one baked KTX2 atlas and Meshopt compression, not a reference plane. The synagogue, cafés, building context, traffic and vegetation are authored. Remaining grey geometry explicitly marks work outside this checkpoint.
- Copy/content: all review copy distinguishes traced geometry from inferred hidden surfaces and illustrative geography. No fabricated footfall, demographic or financial outcomes are introduced.
- Responsiveness/accessibility: semantic buttons, visible focus styles, descriptive canvas/image text and native page scrolling remain. Mobile, forced WebGL loss, reduced-motion OS preference and enlarged-text reflow were not retested for this intermediate checkpoint.

## Verification

`python3 -m py_compile art/geomarketeer/build_landmark_section.py`, Node syntax checks and `git diff --check` passed. Optimized GLB: 1,898,508 bytes / 34,781 triangles / 83 primitives / five materials / one KTX2 atlas. Browser loaded the compressed asset, main/−14°/+14°/reset worked, and final warning/error capture was empty. No real-device FPS claim is made.

## Remaining findings

- P1, full-city fidelity: the approved illustration contains substantially more architectural silhouette variation, plot-level landscaping and street micro-detail. The completed crop establishes a reusable quality system but does not make the unfinished outer city an exact match.
- P2, artwork polish: contextual buildings still derive from a small deterministic frontage grammar; several façades are simpler than the source’s individual buildings.
- P2, vegetation: greenery is denser and more connected, but palms and tree crowns remain visibly more geometric than the reference.
- Pending: mobile browser, real-device performance, WebGL-failure and reduced-motion verification; eight-beat story integration follows full-city approval.

final result: blocked
# Detailed landmark checkpoint — 2026-10-23

Scope: a separate authored synagogue/garden in the approved grey study; not final city acceptance. Image-to-code reference-comparison workflow informed the paired source/render crops and browser evidence.

Evidence: `assets/portfolio/geomarketeer/landmark-section/comparison.png`, and `reports/reference-blockout/landmark-browser.png`, `landmark-left.png`, `landmark-right.png`.

Checks on macOS in-app browser, 1266 × 712: compressed GLB/KTX2/Meshopt loaded; ±14° rotation, reset and grey/detail mode switching passed; captured console warnings/errors empty. Initial tower clipping was fixed by widening the inspection crop. Node syntax checks passed for the viewer and optimizer. Asset size 1,977,112 bytes; no FPS or mobile-device claims.

Visual iterations: corrected reversed window/gable normals, replaced dark vertex-light bake with a texture atlas, reduced roof seam thickness, varied tree lobes and added warm sunlight. Remaining P1 artwork gaps: foliage too regular, façade/material richness below reference, browser colour differs from Blender, adjacent architecture/streets unfinished. P2: grey context has depth-overlap artifacts at some alternate views. Failure-mode/mobile tests remain outstanding.

Result: BLOCKED for final artwork fidelity and full Review 1 acceptance; usable intermediate landmark review only. Existing production city is preserved.

---

# Golden section fidelity pass 01 — 2026-10-23

**Source visual truth:** `assets/portfolio/geomarketeer/pune-approved-reference.png`, 1672 × 941. **Implementation:** `http://127.0.0.1:4174/cityscape-blueprint.html?revision=golden3&view=detail`, macOS in-app browser at 1266 × 712.

**Normalized comparison evidence:** `assets/portfolio/geomarketeer/landmark-section/golden-overview-comparison.png` presents the identical `[650,270,780,380]` source crop and Blender crop side by side at 780 × 380 pixels each. `golden-cafe-comparison.png` does the same for `[1040,270,430,300]`. Browser evidence: `reports/reference-blockout/golden3-junction-comparison.png`; its reveal control composites the same crop over the live WebGL canvas.

## Comparison history

1. P1: generic mall towers and pale road made the commercial edge unrelated to the source. Replaced M01–M04 with bespoke curtain-wall volumes, roof services and entrances; added authored dark road surfaces, parking, pavement and a planted café apron. Post-fix evidence: `golden-overview-comparison.png`.
2. P1: first golden bake retained an incorrect cream café roof and undersized traffic. Added the source-like blue roof cap and enlarged cars/autos/scooters. Post-fix evidence: `golden-cafe-comparison.png`.
3. P1: lower building plots remained empty cream surfaces. Added planted plot surfaces and a denser middle-ground tree layer while keeping traced roads above them. Post-fix evidence: second half of `golden-overview-comparison.png`.
4. P2: the apartment cluster had blank roofs and palms/trees read as mechanically repeated primitives. Added roof gardens, pergolas, water tanks, broader layered crowns and tapered palm-leaf ribbons. Post-fix evidence: `golden-overview-comparison.png`.

## Required fidelity surfaces

- Typography: review-tool typography is unchanged and outside the illustration target.
- Spacing/layout: source and reconstruction crops are pixel-normalized; live focus framing stays synchronized with the crop selector and bounded rotation.
- Colour/tokens: the commercial glass, blue café roof, dark asphalt, warm masonry and planted ground now move materially closer to the approved palette. The source still has softer tonal transitions and richer contact lighting.
- Image quality/assets: the implementation remains real baked 3D geometry, not the reference image on a plane. The new detail survives WebGL export. Foliage, vehicles and peripheral façades remain visibly more geometric than the source.
- Copy/content: explanatory labels continue to distinguish traced and inferred geometry; no geographic or business-data claims were added.

## Verification and remaining findings

Optimized GLB: 1,762,028 bytes / 57,069 triangles / 83 primitives / one KTX2 atlas / Meshopt. Browser load, 0→50% reveal, +14° rotation, reveal reset and main-angle reset passed. Warning/error log query returned empty.

- P1: the source is still significantly denser in individually authored residences, continuous landscaping, street furniture and pedestrian life. The golden section is closer, but not yet strong perceptual parity.
- P1: exact source alignment remains impossible from the single inconsistent generated projection; visible geometry is still approximate at the reveal boundary.
- P2: vegetation is less mechanical but still needs softer silhouette breakup and more species variation; the commercial forecourt needs more varied planting and parked-car detail.
- P2: residential façades below the junction now have authored rooftop detail, but their wall elevations still use the smaller deterministic grammar and require the same bespoke treatment as the mall.
- Pending: mobile/reduced-motion/WebGL-failure verification and real-device frame-time testing.

final result: blocked

Blocker: actionable visual-fidelity work remains before the golden section can be approved as the reusable standard for the full city.

---

# GeoMarketeer 2.5D image-story QA — 2026-10-23

**Source visual truth:** `assets/portfolio/geomarketeer/pune-approved-reference.png`, 1672 × 941 pixels. The approved illustration is now used directly rather than reconstructed as browser 3D.

**Implementation:** `http://127.0.0.1:4174/?revision=2d4`, GeoMarketeer case study open in the macOS in-app browser. Browser capture: `reports/geomarketeer-2d/implementation-beat-01.png`, 828 × 743 pixels. Visible city stage: 754 × 424 CSS pixels at the opening state. Browser screenshot density is 1×; the source image is downsampled by the browser without an intermediate asset.

**Full-view comparison evidence:** `reports/geomarketeer-2d/reference-vs-implementation.png` places the normalized 754 × 424 source image and browser-rendered opening stage side by side. The composition and geometry are identical because the implementation serves the approved source file directly. The implementation adds only the scenario label, one contextual hotspot, and the visible zoom controls.

**Focused evidence:** `reports/geomarketeer-2d/implementation-beat-08.png` verifies the final comparison state with both café candidates visible. A separate crop was not required because the city stage occupies 754 × 424 pixels in the browser capture and all interactive labels are legible at that size.

## Comparison history

1. P1: the earlier implementation attempted to reproduce the approved artwork as live 3D and remained visibly less dense and less polished. Fix: replaced the WebGL reconstruction in the case-study introduction with the approved source image and a transformable 2.5D plane. Evidence: `reference-vs-implementation.png`.
2. P2: the first mobile button-driven pass advanced the text while leaving the image just above the viewport. Fix: Previous/Next now restores the image stage to the top of the viewport on narrow or short screens. Evidence: live beat progression from 01 through 08.
3. P2: pointer capture on the image stage intercepted clicks on the zoom controls. Fix: pointer-drag capture now ignores control buttons. Zoom-in changes scale from 1.000 to 1.100; Reset restores the story framing.
4. P2: a 4:3 phone crop would have removed the edges of the approved composition. Fix: the stage now retains the source's 16:9 aspect ratio at every breakpoint.

## Required fidelity surfaces

- **Fonts and typography:** the story uses the portfolio's existing Fraunces and sans-serif system, with responsive editorial hierarchy and no new font dependency.
- **Spacing and layout rhythm:** desktop uses the requested city-left/story-right composition; narrow and short viewports use city-above/text-below with button progression and no long pinned section.
- **Colors and visual tokens:** the illustration is unmodified. Interface colors reuse the portfolio's paper, ink, green, clay, and muted neutrals.
- **Image quality and asset fidelity:** the approved 1672 × 941 PNG is the rendered source. No placeholder, CSS recreation, or lower-fidelity model replaces it. The combined QA image inherits some JPEG softness from the in-app browser capture, not from the served PNG.
- **Copy and content:** all eight specified beats are present. The scenario is explicitly labelled illustrative and makes no measured footfall, demographic, financial, or success claim.

## Interaction and resilience verification

- Opening response buttons update a polite live acknowledgement without blocking progression.
- Previous/Next progressed through all eight beats and returned from beat 08 to beat 07.
- Visible zoom, reset, pointer pan, and keyboard pan/zoom are implemented; ordinary page-wheel input remains page scrolling.
- The two-image crossfade loader is ready for later exact-camera alternate images; the current build intentionally uses one approved master image.
- Reduced-motion mode removes camera and opacity transitions.
- Quick Scan and Full Story switching still works.
- Browser warning/error log query returned empty.

## Remaining P3 follow-up polish

- Revisit hotspot coordinates after the final café storefront locations are chosen.
- Add exact-camera alternate art only when a story beat genuinely needs a changed city state; keep the master image for all other beats.
- Verify small-phone touch panning and text scaling on a real device before publication.

final result: passed

---

# Final integrated local portfolio check — 2026-10-23

The live portfolio design, original dashboard case study, separately added GeoMarketeer case study, approved Pune illustration, and independent case-study controls were rechecked together at `http://127.0.0.1:4174/minimal_portfolio.html?revision=live-geo2`. Browser inspection found no broken local images; static checks found no duplicate IDs, missing local assets, JavaScript syntax errors, or whitespace errors. The Tailwind CDN advisory inherited from the source remains a publication-only follow-up.

final result: passed



---

# Design QA — Café Corner detailed illustration and explorer — 2026-10-24

**Source visual truth:** `assets/portfolio/geomarketeer/cafe-corner/cafe-corner-detailed.png`, the refined version of the user's selected third displayed illustration. The refinement was generated and displayed before implementation. Actual source size is 1448 × 1086 pixels.

**Implementation:** `http://127.0.0.1:4174/minimal_portfolio.html?project=geomarketeer` and `http://127.0.0.1:4174/?project=geomarketeer`. Both existing entrypoints use the same explorer CSS, JavaScript, and lossless WebP artwork. This is an interactive illustration at the selected isometric angle, with pan/zoom and place inspection.

## Evidence and comparison state

- `reports/cafe-corner/desktop.jpg`: fullscreen overview at 1440 × 1000 CSS pixels; screenshot 1440 × 1000, effective capture density 1.0. Neighborhood selected, 100% zoom, labels off, inspector closed.
- `reports/cafe-corner/browser-art.jpg`: artwork-only capture at 1016 × 762, matching the 4:3 source ratio. Source PNG normalized from 1448 × 1086 to 1016 × 762 before comparison.
- `reports/cafe-corner/art-comparison.png`: source left and browser right together in one image. This raw comparison retains the PNG/JPEG capture difference.
- `reports/cafe-corner/art-comparison-normalized.png`: additional full-view comparison with JPEG 4:2:0 applied to the normalized source to account for the browser capture format.
- `reports/cafe-corner/cafe-detail-comparison.png` and `cafe-detail-comparison-normalized.png`: matched foreground café crops, source left and browser right. These make window mullions, awning seams, interior equipment, seating, planters, and street details large enough to inspect.
- `reports/cafe-corner/cafe-selected.jpg`: 1440 × 1000 fullscreen café selection at 190% zoom, details open.
- `reports/cafe-corner/index-desktop.jpg`: the editorial entrypoint, 1266 × 712 capture, in its existing page styling.
- `reports/cafe-corner/mobile-overview.jpg`: embedded overview at a 390 × 844 viewport, with native page scrollbar reducing the captured content width to 375 pixels.
- `reports/cafe-corner/mobile-selected.jpg`: fullscreen café detail at 390 × 844, with inspector below the artwork and all controls visible. An earlier screenshot taken during viewport repaint was rejected and replaced with this settled capture.
- `reports/cafe-corner/comparison-metadata.json`: dimensions and normalization details.

All listed screenshots and both combined full-view/focused comparisons were opened and inspected.

## Findings and repair history

1. **[P2, fixed] Controls below the initial desktop viewport.** The first 68vh illustration stage pushed the zoom/fullscreen toolbar below the fold at the default 843 × 756 viewport. The stage now uses a viewport-relative height with reserved room for the header and controls. The repeat desktop check placed the toolbar bottom at approximately 705px within the 756px viewport; final desktop and mobile evidence confirms access to controls.
2. **[P2, fixed] Fullscreen keyboard isolation.** The custom fullscreen view now makes background body elements inert, traps Tab and Shift+Tab, excludes clipped map labels from the focus order, and restores focus, element placement, and page overflow on exit. Native browser checks confirmed forward/reverse wrapping, background inert state while open, and focus restoration to Fullscreen after Escape.
3. **[P3, fixed] Excess empty space around the mobile artwork.** The fixed 400px mobile stage left unnecessary letterboxing. A responsive 75vw height with bounds now fits the 4:3 illustration more closely; the repeat mobile overview shows the complete neighborhood with toolbar and supporting note visible.
4. **[P3, fixed] Accumulation during rapid zoom commands.** Button zoom now accumulates against the destination camera state while an earlier move is still settling. Two rapid zoom-in commands from the overview settled at 160%, retaining smooth interruption.

There are no remaining actionable P0/P1/P2 findings in the implemented scope.

## Required fidelity surfaces

- **Fonts and typography:** The source artwork contains no lettering. Added UI uses the existing portfolio sans-serif and Fraunces display font. Headings, supporting text, place buttons, and inspector text retain clear hierarchy and wrap without clipping in the inspected desktop and mobile states.
- **Spacing and layout rhythm:** The whole illustration is contained at its original 4:3 ratio. Fullscreen and embedded layouts reserve space for controls; mobile place choices scroll horizontally rather than causing page overflow. The inspector overlays the lower-right corner on desktop and sits below the artwork on narrow screens.
- **Colors and tokens:** The artwork is served without CSS filtering, opacity changes, or blending. Decoded lossless WebP pixels exactly equal the source PNG. Browser screenshots are JPEG 4:2:0 and show some softening/hue shift on fine saturated-blue edges; raw and normalized comparisons are retained rather than compensating by altering the artwork. Controls use restrained blue/white tokens appropriate to the illustration.
- **Image quality and asset fidelity:** The five-building composition, roads, camera angle, café interior, planting, furniture, and small vehicles remain intact. Full-view and focused comparisons show no cropping or geometric distortion in the overview. Artwork is the generated raster asset, not a CSS/vector approximation. At high zoom, detail is limited by the 1448 × 1086 source resolution.
- **Copy and content:** Place descriptions refer to visible scene features. They do not invent measured footfall, demographic data, business performance, or outcomes. The scene is identified as illustrative. The existing case-study narrative is preserved below in a disclosure.

## Interaction validation

- Direct click on the café artwork selects the café, reveals details, and moves the camera to it.
- Place chips select offices, apartments, the local shop, and the terrace house; rapid changes settle on the last selection with consistent pressed states.
- Native drag pans the artwork and releases without a stuck dragging state or unintended place selection.
- Arrow-key panning, button zoom, reset, optional labels, fullscreen, Escape, focus trapping, and focus restoration were exercised in the browser.
- Move map changes touch-action from pan-y to none, leaving native page scrolling available by default. Multi-touch pinch is implemented; physical-device pinch was not exercised by this desktop browser session.
- Both entrypoints load the new illustration and open the correct case study through the project query parameter.
- The previous walkthrough initializes on disclosure opening (`data-bound=true`) and retains its existing content and controls.
- No JavaScript errors were captured on either entrypoint. JavaScript syntax checks, duplicate-ID checks, local-asset checks, and `git diff --check` passed.
- Reduced-motion handling is implemented through the media query and immediate camera updates; the OS preference was not toggled in this run.

## Remaining polish and limits

Physical-device gesture testing and display-level color comparison remain follow-up checks. The native browser capture's JPEG processing limits exact pixel/color judgments on thin blue line work. The lossless project asset remains unchanged. The optional older walkthrough retains its prior city art and is collapsed by default.

final result: passed

---

# Design QA — Authored café block in live 3D — 2026-10-25

**Current implementation supersedes the raster explorer reviewed above.** The new primary explorer uses an orthographic Three.js scene with authored geometry, vertex-colored faces, explicit blue strokes, and foliage silhouettes. The earlier image assets and optional older narrative remain in the repository; they are not used to render this block.

**Agreed scope:** one café block and neighboring office, with street life, reviewed from multiple angles before expanding the neighborhood. The detailed Café Corner image supplies the art direction. This is not a literal reproduction of the entire five-building image. The reference showcase supplies the interaction/technical precedent, not copied illustration geometry or proprietary source.

## Source and implementation comparison

Source: `assets/portfolio/geomarketeer/cafe-corner/cafe-corner-detailed.png` (1448 × 1086).

Live: `http://127.0.0.1:4174/minimal_portfolio.html?project=geomarketeer` and `http://127.0.0.1:4174/?project=geomarketeer`.

`reports/cafe-block/cafe-comparison.png` presents both café crops together. Source crop: x415/y440/w550/h470. Live crop: x410/y102/w700/h720 from a 1440 × 1000 desktop capture at 225% zoom, view 45°, street life paused, labels off. Both crops are contained within 620 × 620 panels without geometric stretching or color changes. This is an art-direction comparison with deliberately different scene proportions, not a pixel-difference test. Native browser captures use JPEG; fine-edge color/softness differences are retained.

`four-angles.png`, `mobile-review.png`, `index-embedded.jpg`, the full café exterior, and the interior cutaway were also opened and inspected.

## Findings and corrections

1. **P2, fixed — insufficient visible café detail.** The first geometry pass had opaque, empty upper panes and a distant ground-floor counter hidden by the floor above. Upper walls now have actual openings with transparent glazing, furnished lounge tables, chairs, a patron, bookshelves, plants, and pendants. A street-facing display counter and espresso station are visible through the ground-floor glazing. The cutaway reveals the deeper interior.
2. **P2, fixed — weak edge hierarchy.** The first scene used faint detail lines. The final palette and three line weights strengthen architectural outlines while keeping paving and small features lighter. Awning stripes use a clearer alternating fill, and trees have denser curved leaf marks.
3. **P2, fixed — accented sign glyph.** A geometry check caught the original font's missing uppercase É. A locally vendored Droid Sans vector typeface supplies the actual glyph for CORNER CAFÉ.
4. **P2, fixed — pause continuity and route corners.** Traffic follows a continuous rounded route with tangent-based headings. Pausing preserves actor positions. Automated checks cover route wraps, pavement clearance, and pause behavior.
5. **P3, fixed — hidden façades and floating details.** Alternate-angle inspection prompted resolved service doors, vents, utility windows, and lobby mullions. Vehicle ground clearance and walking-figure feet were corrected. Paving was localized so it supports the street detail without covering the entire block in a grid.
6. **P3, fixed — unnecessary transparent draw calls.** Upstairs glazing was combined into one batch and lounge geometry shares the upper-storey batches. The final model has 86 surface meshes and 71 stroke batches, 94,152 surface triangles including silhouette meshes, and zero textures. The runtime's higher triangle counter also includes expanded line geometry.

## Required design surfaces

- **Fonts and typography:** existing portfolio typography is preserved around the component. Map controls remain compact, readable, and keyboard accessible. The café sign is actual vector font geometry.
- **Spacing and layout rhythm:** desktop framing contains the block at overview; selected views intentionally move closer. Mobile uses a separate inspector row and wraps controls within the viewport. The 390 × 844 fullscreen toolbar bottom was approximately 831px, with no horizontal page overflow. The embedded mobile controls were also reachable within the inspected view.
- **Colors and tokens:** white and pale blue faces, blue architectural strokes, lighter paving detail, and directional face colors follow the source's restrained illustration language. No bitmap or texture supplies the appearance.
- **Illustration quality:** café architecture, furniture, foliage, street objects, vehicles, and people are modeled independently and remain present when the camera turns. All four façades are resolved. The roof, upper floor, awnings, interior, terrace, entrance, and glazing are separate components. The source still has denser decorative planting and more detailed people; subjective art signoff is pending, appropriate to this first-block review milestone.
- **Copy and content:** descriptions refer to modeled scene features. No footfall, demographic, or business-performance claim is added. The scene is identified as a café block study.

## Verification

- Both entrypoints rendered the same live scene, with one canvas and no image elements inside the explorer. No JavaScript errors were captured; the inherited Tailwind CDN advisory remains unrelated to this scene.
- Four quarter-turn views were captured from actual camera rotation, with correct occlusion and side/rear geometry.
- Direct object picking, place chips, interrupted rapid selection, labels, keyboard turning/panning/zoom, native pointer drag/release, reset, and zoom controls were exercised. Rapid office → garden → café selection settled on the café with consistent pressed state.
- The real cutaway removes the upper floor and roof while retaining the ground-floor interior and office. Closing it restores the same geometry.
- Fullscreen made the page header/main/footer inert. Tab and Shift+Tab wrapped within the scene; Escape restored body overflow, page interaction, and focus to the fullscreen control.
- Mobile Move map changed touch-action from pan-y to none. Phone-sized overview, café selection, and interior states had no page overflow; all scene actions remained accessible. Physical-device touch/pinch was not simulated or claimed.
- Render updates stop when idle with street life paused, and when offscreen or the tab is hidden. Reduced-motion handling starts with street life paused and uses immediate camera updates; the OS setting was not toggled during browser checks.
- A desktop sample with motion enabled reported median frame interval 16.7ms and approximately 161 draw calls in the inspected view. This is not a physical-phone performance measurement.
- `node art/geomarketeer/verify-cafe-block.mjs` passed finite-geometry, unique-name, texture-count, triangle/batch-budget, correct ray-target, picking-layer, cutaway-isolation, traffic-continuity, pavement-clearance, and pause-position checks.
- JavaScript syntax checks, both HTML entrypoints' duplicate-ID/local-asset checks, and `git diff --check` passed.

## Remaining review limits

This passes the functional and responsive gate for the agreed single-block review build. It does not certify reproduction of the full source illustration or final artistic quality for the whole map. Review the block's proportions, stroke strength, planting, and figure style before expanding it. Physical-device gestures/performance and OS preference switching remain publication checks.

final result: passed (single-block review scope; artistic signoff pending)

---

# Design QA — Outline clarity across zoom levels — 2026-10-25

The user identified double/triple outlines merging into thick lines when zoomed out. This refinement preserves the existing art direction and geometry while changing how architectural edges are drawn.

**P2, fixed:** roof lips, floor bands, window piers, and sills had several adjacent full-strength contours. Café and office roofs now have a primary contour; secondary profiles fade continuously until there is enough projected spacing to distinguish them. The café upper architecture no longer receives both an inverted-hull outline and authored strokes. Furniture retains silhouettes. Coincident/reversed edges are deduplicated within each drawing, and the general line hierarchy is finer at overview scale.

The profile fade uses viewport height, orthographic span, and zoom, rather than zoom percentage alone. It applies opacity to antialiased stroke caps as well as bodies. Close inspection restores separated inner profiles without a hard detail switch.

`reports/cafe-block/linework/overview-comparison.png` and `detail-comparison.png` place the prior and current views together at matching camera states. Corresponding crops are resized equally without recoloring. `rotations-review.png`, `interior-after.jpg`, and phone-sized evidence document the other inspected views. The comparison sheets, all three rotated views, cutaway, and selected mobile state were opened and inspected. The model retains its prior fonts, copy, scene layout, fill palette, textures count of zero, and responsive controls.

Verification passed: finite geometry; no coincident strokes within a drawing; progressive profile visibility; equal detail at equal projected scale across screen sizes; correct ray picking; isolated cutaway; traffic continuity/clearance; and pause continuity. The final model contains 87 surface meshes and 72 stroke batches, 93,708 surface triangles including silhouettes, and 41 removed duplicate strokes. Browser checks at 1440 × 1000 and 390 × 844 captured no JavaScript errors. Syntax and whitespace checks passed. No remaining P0/P1/P2 findings were identified within this outline-refinement scope.

Detailed evidence and normalization: `reports/cafe-block/linework/review.md`. Physical-device gestures and final artistic signoff remain as previously recorded.

final result: passed

---

# Design QA — GeoMarketeer live vector atlas study — 2026-10-25

**Implemented target:** the user's approved plan for a standalone live SVG atlas and café close-up, using the selected Café Corner artwork as art-direction reference. This is a new design study, not a pixel clone or an update to the existing city viewer.

Preview: `http://127.0.0.1:4174/geomarketeer-atlas-study.html`.

The atlas contains the five planned building types, streets, crossings, and pocket garden. Café identity, footprint, street-facing awnings, roof equipment, and surrounding geography carry into the close-up and its miniature overview. White/pale blue fills, fine cobalt contours, restrained amber, existing portfolio typography, semantic controls, and responsive fitted compositions follow the approved direction. All illustration geometry is inline SVG, with no embedded raster art or canvas renderer.

**Combined visual review:** `reports/atlas-study/paired-views.png`, `mobile-pair.png`, and `reference-comparison.png` were opened and inspected. Desktop states use the same 1440 × 1000 viewport; mobile states use 390 × 844. The reference comparison contains the café identity crop beside the authored SVG café, normalized proportionally without recoloring. Metadata, source/capture dimensions, and crop coordinates are recorded in `reports/atlas-study/capture-metadata.json`.

**Repairs:** contained outgoing view transforms to eliminate horizontal overflow; repositioned the café sign; recomposed clipped interior equipment so it remains visible beneath the awning; corrected narrow-screen sentence spacing; stabilized mobile heading height; and refined tree canopies and secondary contour visibility.

**Required surfaces:** the page retains Fraunces/DM Sans hierarchy; a spacious single illustration stage and caption replace dashboard chrome; blue/white tokens and a limited amber selection identify the café consistently; vector details remain editable and resolution independent; copy describes an imagined neighborhood without performance or demographic claims. The new composition deliberately uses calmer detail density than the original generated reference.

**Interaction checks:** pointer and keyboard café selection, main CTA, header navigation, back action, miniature overview, Escape, visible SVG focus, inactive-view isolation, rapid interrupted changes, font loading, and resizing passed. The transition uses 500ms native CSS focus/crossfade. Reduced-motion logic passed automated media-preference tests, and the matching CSS disables movement and transitions; host OS preference switching was not exercised. Desktop and phone layouts have no horizontal overflow. The miniature overview is desktop-only.

**Technical checks:** browser inspection found three SVG roots, five named main-atlas buildings, no duplicate IDs, no images/canvas/foreignObject, and no warning or error logs. `node art/geomarketeer/verify-atlas-study.mjs` passed finite-geometry, vector-only, internal-reference, focus, navigation-interruption, and reduced-motion checks. Syntax, local-asset, and whitespace checks passed.

Full findings and evidence: `reports/atlas-study/review.md`. No remaining P0/P1/P2 findings were identified within the approved study scope. Physical-device testing and subjective visual refinements remain follow-up work.

final result: passed

---

# Design QA — Direct interaction with the SVG study — 2026-10-25

The user's follow-up requested modest zoom and rotation. Both SVG views now support 80–120% zoom, ±15° flat tilt, zoomed dragging/arrow panning, and Reset. Each view remembers its own settings. Controls and the miniature overview remain outside the transformed groups.

The SVG art and typography are preserved; native group transforms provide the interaction, with non-scaling strokes and responsive detail opacity. Camera adjustments ease for 300ms, interrupted adjustments continue from the current presentation, and reduced motion removes the easing. Tilt changes the existing drawing's in-plane angle, rather than revealing new façades.

Browser validation covered the upper/lower zoom bounds, tilt limit, independent view settings, keyboard zoom/tilt/reset, mouse drag without accidental café selection, pointer release, responsive controls at 1440 × 1000 and 390 × 844, and restoration of native touch scrolling after Reset. The added toolbar required a small stage-height adjustment so the desktop page still fits its target viewport. No horizontal overflow or new console errors were observed. Geometry remains SVG-only.

The existing automated suite was extended to cover camera bounds, per-view retention, keyboard pan/reset, and automatic centering at overview scale; all checks pass. Reduced-motion behavior passed the controlled media-preference fixtures. OS preference switching, physical touch dragging, and modifier-wheel input were not manually exercised. Syntax and whitespace checks passed.

Evidence and full notes: `reports/atlas-study/interaction/review.md`, `desktop-cafe.jpg`, and `mobile-cafe.jpg` in the same directory. No remaining P0/P1/P2 findings were identified in this interaction scope.

final result: passed

---

# Design QA — Approved Corner Café neighborhood recreation — 2026-10-25

The user approved the generated five-building Corner Café neighborhood and selected a real 3D orbit limited to ±15°. The new standalone preview is `geomarketeer-neighborhood-study.html`; the existing portfolio scene and SVG study are preserved.

The five-building composition and orthographic reference camera were calibrated from the selected image. The café has three front and two side upper windows, wraparound striped awnings, a glazed ground floor, serving equipment, tables, chairs, people, plants, and rooftop machinery. Capsule highlights, layered conifers, round trees, five cars, benches, paving, crossings, and street furniture follow the source's blue-and-white language. All live artwork is editable geometry, with zero textures. The PNG is shown only in the labeled comparison panel.

Visual iterations repaired missing buildings, café proportions, weak contrast, the shop awning's orientation, rooftop landmarks, plant silhouettes, hidden interior equipment, merged bench slats, a misplaced house-roof plane, and a narrow-screen aspect-ratio issue. Final source/render comparisons were opened together: `reports/approved-neighborhood/reference-and-recreation.png` and `cafe-detail-comparison.png`. The ±15° views were inspected in `orbit-review.png`; desktop and phone screenshots were inspected after font loading. Normalization is recorded in `capture-metadata.json`.

The page retains Fraunces/DM Sans, fits the 4:3 artwork proportionally, uses the source's cobalt/pale blue/white palette, and clearly labels comparison and navigation controls. Core interaction checks passed for drag, orbit boundaries, 80–120% zoom, keyboard/reset, rapid changes, visible focus, comparison, responsive resizing, and returning from the case study. The browser recorded no warnings or errors. Desktop 1440 × 1000 and phone 390 × 844 have no horizontal overflow; phone buttons are at least 44px high.

`node art/geomarketeer/verify-approved-neighborhood.mjs` passed geometry, landmark projection, bounds, five-building/five-car, zero-texture, camera movement, interruption, pointer-cancellation, and reduced-motion checks. The source-driven reduced-motion fixture passes; host OS preference switching and physical-device touch remain untested. The final model has 19 surface meshes, 42 stroke batches, and 130,485 surface triangles including silhouettes. The original café-block suite still passes with its prior geometry counts.

This is a close geometric recreation, not a pixel-identical match. Small window and interior vignettes, foliage clusters, vehicle details, curb shapes, and the source's softer tonal transitions remain P3 artistic likeness notes. No open P0/P1/P2 issues were identified within the limited-orbit preview scope. Full evidence and the five required fidelity surfaces are documented in `reports/approved-neighborhood/review.md`.

final result: passed (interactive geometric recreation preview; exact image equivalence is not claimed)

---

# Design QA — Reference detail mapping and refinement — 2026-10-25

The user requested a detailed source comparison and improvements, specifically naming benches and nearby trees/bushes. A fresh source/before/current review was performed at equal crop sizes. This supersedes the earlier incorrect three-front-window café assumption: the approved source has two wide upper windows per visible café face. It also has three office-left columns, two home window rows, and three apartment rows. These are now corrected.

A native interactive reference map contains 157 annotated regions and 70 façade window cells, with category filters, matching close-ups, and reference/before/updated views. Its inventory covers 3 benches, 18 trees, 17 planters, 7 lamps, 7 bollards, 3 tables/9 chairs/5 visible guests, 5 cars, 7 standing people, crossings, grates and small roof/interior details. The editable source measurements live in `scripts/geomarketeer-neighborhood-details.js`; the full inventory is in `reports/approved-neighborhood/detail-pass/reference-detail-inventory.json`.

The park now has three benches, including a perpendicular western bench facing the viewer. Bench proportions, slats, feet, depth, white faces and shared contours were refined. Tree canopy positions, ovoid proportions, blue trunk fills, exposed stems, tiered conifers and curved white glints were corrected. Sparse bushes became foliage volumes with recessed soil, white flower heads, blue centers and blue-green leaves. Matching crops exposed and repaired backwards seating, excessive backrest height, wire-like duplicate contours, sparse/peanut-like foliage and mis-scaled intermediate captures.

The café has corrected wide upper windows, native glazing, fuller seating, small door details, pendant lamps and more resolved counter equipment. Façade rows/columns, roof tank/platform, mast, balconies, grates, lamps, bollards, menu board, source-derived crossing paint and compact hatchbacks were also refined. Main portfolio typography and navigation remain intact; the new detail map is linked from the study.

Final combined comparisons were opened: `park-comparison.png`, `cafe-comparison.png`, `office-comparison.png`, `east-comparison.png`, and `orbit-review.png` under `reports/approved-neighborhood/detail-pass/`. Source/before/current crops use identical coordinates, no recoloring, and a verified 1448 × 1086 master art crop. Loaded-font desktop and phone states were inspected, with no horizontal overflow or warning/error logs. The map supports keyboard selection, filters, before/after switching and marker visibility.

The five fidelity surfaces—typography, layout, color, asset quality and copy—are documented in `detail-pass/review.md`. Remaining P3 likeness notes include tonal washes, a few leaf/flower contours and tiny ambiguous interior marks. This is a measured geometric recreation, not a literal pixel clone; the source art is not baked into the scene.

The expanded actual-source verification passes source feature counts, 70 actual window cells, bench orientation, 55 landmark projections, geometry validity, secondary contour fading, camera bounds, interruptions, pointer cancellation, keyboard operation and reduced motion. Final geometry: 24 surface meshes, 44 stroke batches, 223,449 surface triangles including silhouettes, zero textures. The original café-block suite remains unchanged and passing. Physical touch/slow-device performance and OS preference switching remain untested. No open P0/P1/P2 implementation defects were identified in this refinement scope.

final result: passed (measured detail refinement; exact pixel identity is not claimed)

---

# Design QA — Blue fills and softer planting — 2026-10-25

The user requested a less wireframe appearance while preserving interaction. Source/before/after comparisons were captured at the calibrated reference camera. A source-only browser capture was used alongside the original image to avoid mistaking the browser screenshot pipeline's slight blue shift for an artwork palette error. Matched crops are in reports/approved-neighborhood/fill-pass/.

This pass corrected the architectural light direction, gave walls and windows fuller native blue washes, added filled window reveals/reflections, strengthened the primary/secondary line hierarchy, filled bench surfaces, removed repeated conifer brim rings, softened interior contours and replaced fragmented bushes with continuous white crowns over blue-green foliage. Trees have subtle vertex-color washes. Failed woolly, lacy and ribbed planting iterations were compared and replaced.

All five fidelity surfaces and iteration evidence are documented in fill-pass/review.md. The latest office, park and café crops, both ±15° compositions, desktop 1440 × 1000 and phone 390 × 844 were inspected. No horizontal overflow or console warning/error was observed; loaded fonts and 44px phone controls were verified. Interaction remains native 3D with 80–120% zoom, ±15° orbit and the existing keyboard/reset/reduced-motion behavior. Temporary viewport overrides were reset.

Both geometry/viewer verification suites, syntax and whitespace checks pass. The updated study has 26 surface meshes, 43 stroke batches, 216,303 surface triangles including silhouettes, and zero textures. The measured inventory and 70 window cells remain intact; the reference map now points at the final paint revision. The original portfolio renderer is unchanged.

Remaining P3 likeness notes are simplified floral contours, some interior vignettes and the source's painted grain. Exact pixel identity is not claimed; physical-device touch, OS preference switching and low-end device performance were not newly measured. No open P0/P1/P2 defects remain in this paint-and-contour scope.

final result: passed
