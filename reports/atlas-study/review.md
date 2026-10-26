# GeoMarketeer live vector atlas study — 2026-10-25

Latest addition: see `interaction/review.md` for 80–120% zoom, ±15° flat tilt, zoomed dragging, keyboard controls, Reset, and validation. This extends the original two-view study below.

Preview: http://127.0.0.1:4174/geomarketeer-atlas-study.html

## Delivered study

A standalone preview pairs a north-up neighborhood atlas with an isometric Corner Café close-up. It contains five buildings: offices, a local shop, a home, courtyard homes, and the café. The café faces Market Lane to the south and Linden Street to the east in both compositions. The pocket garden remains to its west.

Both views are authored inline SVG. The café footprint is shared through the `PLACES` definition, and its roof equipment and two striped awnings are repeated in the atlas. The detailed view contains clipped interior groups, a pastry counter, espresso station, shelves, lounge furniture, pendant lamps, signage, terrace furniture, plants, people, and street objects. These are vector paths and shapes rather than embedded image assets.

The palette uses white and pale blue fills, cobalt contours, and restrained amber on the selected café. Primary architectural edges use one intentional contour; inner roof profiles and small marks fade based on the rendered scale. The original portfolio and its existing interactive city remain available through the study's links.

## Implementation

- `geomarketeer-atlas-study.html`: semantic page structure, SVG roots, descriptions, and view controls.
- `styles/geomarketeer-atlas-study.css`: visual tokens, illustration styles, responsive layouts, focus states, and coordinated 500ms transitions.
- `scripts/geomarketeer-atlas-study.js`: vector drafting helpers, named architecture groups, both compositions, miniature overview, scale-aware detail, and navigation.

There are no added package dependencies. The study uses the portfolio's Fraunces and DM Sans typefaces. Fonts have system fallbacks; no illustration depends on a font or image download to draw its geometry.

## Visual evidence

- `desktop-atlas.jpg` / `desktop-cafe.jpg`: matching 1440 × 1000 viewport states.
- `paired-views.png`: both complete desktop states together, each resized proportionally to 720 × 500.
- `mobile-atlas.jpg` / `mobile-cafe.jpg`: 390 × 844 CSS viewport states; native scrollbar capture widths are recorded in `capture-metadata.json`.
- `mobile-pair.png`: the two phone-sized states together.
- `reference-comparison.png`: the selected café illustration crop and the new SVG café together. Exact crop and normalization details are in `capture-metadata.json`.
- `keyboard-focus.jpg`: visible dashed focus around the atlas café after native Tab navigation.

All three comparison sheets were opened and inspected. The café reference supplies identity, architectural language, and detail categories. This is a new design exploration with an approved amber accent and a top-down companion; it is not a pixel-identical clone. Crops are contained in equal panels without stretching or recoloring. Browser evidence uses JPEG capture, which softens fine colored edges.

## Findings and repairs

1. **P2, fixed — horizontal overflow during view changes.** The enlarged outgoing atlas extended the page's scroll area despite being transparent. The illustration stage now clips its own compositing layers. Both final view states and rapid changes have no horizontal page overflow.
2. **P2, fixed — storefront equipment hidden behind the awning.** The first arrangement placed the counter and espresso machine too far behind the illustrated façade. Awning depth now matches the atlas, and the interior is deliberately composed within the storefront clip, making the pastry display, espresso equipment, and shelves visible.
3. **P2, fixed — café sign clearance.** The fascia was previously beneath the awning's top edge. It now sits above the awning, clear of the upstairs windows.
4. **P2, fixed — narrow-screen copy spacing and layout movement.** Hiding the desktop line break joined sentences together, and the headings used unequal line counts. The copy now retains spaces and the mobile headings reserve the same two-line height.
5. **P3, fixed — sparse tree silhouettes and dense small contours.** Canopies were enlarged and roof inset strokes were moved into the fading profile layer. Small details remain subordinate to the building silhouettes.

## Verification

- Native pointer selection on the café opened the detailed view without moving the desktop page (`scrollY = 0`). Main action, view navigation, back control, and miniature overview also work.
- Enter and Space activate the café. Back and Escape return to the atlas. The detailed view moves focus to its back control, and return moves focus to the café. Native Tab navigation showed the café's dashed focus outline.
- Inactive panels are inert and have `aria-hidden=true`; the inactive SVG café target has `tabindex=-1`. Current navigation pressed states remain consistent.
- Rapid atlas/café switching settled on the latest request. Stale completion callbacks are canceled, and CSS transitions continue from their current values.
- Both 1440 × 1000 and 390 × 844 layouts were inspected after fonts loaded and after resizing. The miniature overview is hidden on phones. Primary actions remained reachable, and there was no horizontal overflow.
- Browser DOM checks found three SVG roots, five named main-atlas buildings, 1,347 SVG primitives including reusable instances, no duplicate IDs, and zero image, canvas, or foreignObject elements.
- No warning or error logs were captured in the new study.
- `node art/geomarketeer/verify-atlas-study.mjs` passed checks for finite vector coordinates, named buildings, unique SVG definitions, resolved internal references, keyboard activation, focus isolation, interrupted navigation, Escape, and reduced-motion behavior both at load and after preference changes.
- Reduced-motion logic was tested with a controlled media-preference fixture; the stylesheet removes motion under the same media query. The host OS preference was not changed during browser validation.
- JavaScript syntax, local HTML asset references, and whitespace checks passed.

## Limits and follow-up

This is the requested illustration and navigation study. Traffic animation, data overlays, additional building close-ups, and portfolio integration remain outside this milestone. Physical-device testing and the user's artistic feedback can guide the next iteration.

final result: passed
