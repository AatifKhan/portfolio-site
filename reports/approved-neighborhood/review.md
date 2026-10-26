# Approved Corner Café neighborhood recreation

The selected target is the second generated Corner Café image, preserved in `assets/portfolio/geomarketeer/cafe-corner/cafe-corner-approved-v2.png`. The user selected a real 3D orbit limited to ±15°. This replaces the rejected SVG-study direction with a standalone five-building illustration preview. The portfolio entrypoints retain their existing scene and navigation.

Preview: http://127.0.0.1:4174/geomarketeer-neighborhood-study.html

## Findings and repairs

- P1, fixed: the earlier two-building scene did not reproduce the selected neighborhood. The new model contains the six-storey office, awning shop, terrace house, balcony apartment, and two-storey café. Building dimensions and the approved camera were calibrated from five roof landmarks. Café upper windows follow the reference's three-front/two-side arrangement. Source-style capsule, conifer, and round trees, angular cars, people, planters, benches, paving, crossings, lamps, and café seating complete the composition.
- P2, fixed: weak contrast, narrow café windows, the shop awning on the wrong street face, misplaced rooftop services, and tiny stem-like planting. Blue fills and stroke weights were strengthened; café façades were rebuilt; the shop awning changed face; services moved to image landmarks; plant pots, leaf silhouettes, people and cups were added to the upper windows.
- P2, fixed: upper equipment was concealed beneath the awning and the park slats merged at review scale. Counter heights were lowered, street-facing display equipment was added, and bench slats were spaced farther apart.
- P2, fixed: the initial house roof used swapped coordinates, producing a below-ground wire rectangle. The roof coordinates are corrected, and verification rejects geometry unexpectedly below the ground plane.
- P2, fixed: the phone stage's aspect ratio could produce a slightly wider child. The viewport now has explicit width, visible focus, 44px buttons, and no horizontal overflow.
- P3, review note: this is a close geometric recreation, not a pixel-identical copy. Small window vignettes, café equipment, foliage clusters, vehicle body details, and some paving and curb shapes differ from the generated artwork. The source's soft tonal transitions are represented by flat geometry and tinted surfaces. Do not call this an exact image match.

## Visual comparison

The source and final render were compared together in the browser at equal scale. `reference-and-recreation.png` contains equal 685 × 514 content crops from the same 1440 × 1000 browser capture, with the source on the left. `cafe-detail-comparison.png` contains the same 350 × 400 master-image region from source and recreation, resized equally. `orbit-review.png` shows −15°, 0°, and +15° from the same master frame. All were opened and visually inspected; final desktop and phone views were also inspected after fonts loaded. Crop coordinates and density are recorded in `capture-metadata.json`. No recoloring was applied to comparisons.

The compositions share the same building hierarchy, roof orientation, café identity, pale street base, capsule highlights, planting forms, cars, and furniture. Fine café vignettes and softer material treatment remain subjective likeness refinements. They do not obstruct the working illustration or change its principal composition.

## Required fidelity surfaces

- Typography: the source artwork contains no text; the surrounding preview retains the portfolio's Fraunces and DM Sans families, restrained hierarchy, and responsive heading wrapping. Fonts were loaded during capture.
- Layout: the source's 4:3 art frame is fitted proportionally, with an orthographic reference camera and modest additional fit at the orbit limits. No drawing is stretched. The desktop reference comparison uses equal columns; the phone comparison stacks both views.
- Color: white, pale lavender/blue, and cobalt are used throughout; no amber selection or analytical overlays were introduced. The source uses subtle tonal modeling that the authored geometry approximates. Screenshot color/compression differences are retained in the evidence.
- Asset quality: the live illustration contains editable Three.js surfaces, geometry patches, and intentional stroke batches. There are no image textures, illustration planes, or baked artwork in the scene. The supplied PNG appears only in the explicitly labeled reference panel. Native WebGL antialiasing and a capped device pixel ratio are used.
- Copy/content: the page identifies an illustration study, explains drag/orbit/zoom/reset, links back to GeoMarketeer, and labels reference versus recreation. No invented business outcomes or real-world neighborhood claims are presented.

## Interaction and technical validation

Browser checks passed for drag rotation, both ±15° boundaries, 120% zoom boundary, keyboard rotation/zoom/reset, visible focus, rapid requests, reference comparison, resizing from desktop to phone, font loading, and returning from the case-study link. The scene remained interactive after browser back navigation. Both 1440 × 1000 and 390 × 844 layouts have no horizontal overflow. Phone controls fit and have a 44px minimum height. No warnings or errors were captured in the browser.

`node art/geomarketeer/verify-approved-neighborhood.mjs` passed: finite geometry, unique names, 5 buildings, 5 cars, zero textures, no below-ground roof, calibrated roof landmarks, fitted building footprints, camera movement rather than flat tilt, orbit/zoom limits, latest-action settling, keyboard operation, pointer cancellation, and immediate reduced motion. Reduced motion was exercised against the actual viewer source with a controlled media fixture; OS preference switching and physical-device touch gestures were not manually tested. Native touch scrolling and pinch behavior remain enabled; explicit controls provide illustration zoom.

Final model: 19 surface meshes, 42 stroke batches, 130,485 surface triangles including silhouettes; the browser reports 61 draw calls. Frame requests stop after settling and while hidden. The original café-block verification still passes with unchanged counts: 87 surface meshes, 72 stroke batches, 93,708 surface triangles, zero textures. Syntax and whitespace checks passed.

No open P0/P1/P2 issues were identified for this limited-orbit recreation preview. Exact pixel equivalence is not claimed. Fine-detail artistic approval remains with the user.

final result: passed (interactive geometric recreation preview)
