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
