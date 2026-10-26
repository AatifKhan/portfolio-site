# Reference detail mapping and illustration refinement

The user requested a detailed comparison down to the small visible features, followed by improvements to the current native illustration. The approved 1448 × 1086 Corner Café image remains the source. The new map is an inspection report; the live drawing remains real Three.js geometry, with ±15° orbit and 80–120% zoom.

- Live illustration: http://127.0.0.1:4174/geomarketeer-neighborhood-study.html
- Interactive reference map: http://127.0.0.1:4174/reports/approved-neighborhood/detail-pass/reference-map.html
- Editable measured instance data: `scripts/geomarketeer-neighborhood-details.js`
- Full region inventory: `reference-detail-inventory.json`

## Mapping coverage

The map contains **157 annotated regions**, including **70 window cells** and the main building, vegetation, seating, vehicle, roof and street features. Each region has a description and matching source/current crops. Category filters and Reference / Before / Updated modes let the user inspect the comparison without relying on a full-scene thumbnail.

| Feature | Reference inventory used for the refinement |
| --- | --- |
| Main buildings | Office, shop, terrace home, apartment, café |
| Park benches | 3; western bench perpendicular to the other two, facing the viewer |
| Trees | 9 capsule trees, 7 tiered conifers, 2 ovoid trees |
| Flower planters | 17; individually positioned by upper rim center and sized independently |
| Poles | 7 lamps and 7 short bollards, with separate cap/foot measurements |
| Café seating | 3 outdoor tables, 9 chairs, 5 visible seated guests |
| Standing people | 7 visible street figures |
| Cars | 5 boxy compact hatchbacks |
| Window cells | 41 office, 4 café, 7 home, 17 apartment, 1 main shop display; storefront bays recorded separately |
| Crossings and drainage | 2 zebra crossings, 7 and 8 stripes; 5 recessed grates |
| Other small features | Menu board, bin, lanceolate potted plants, tank platform/lid, terrace stool, roof services, antenna, balconies, door hardware, mat, glazing and pavement details |

Counts and major visible landmarks were checked against enlarged source crops. Window positions are calibrated construction cells, not a claim that every painted interior mark was unambiguously identified. Hidden sides, faint reflections, tiny vessels and generated perspective inconsistencies remain interpretations.

## Comparison steps and results

### 1. Neighborhood overview — corrected

The initial reconstruction reproduced the overall five-building arrangement but missed several visible counts. The café actually has **two wide upper windows on each visible face**, rather than three on the left. The office left face has **three columns**, rather than four. The apartment has **three window rows**, rather than four; the terrace home has **two**, rather than three. These earlier assumptions were incorrect and are corrected in both geometry and inventory. The office height and entry proportions were recalibrated while retaining its roof landmark.

### 2. Park and nearby planting — substantially refined

The fourth bench was removed. The western bench is perpendicular and now faces toward the viewer. Backrests were lowered, legs shortened and thickened, seat depth refined, white slat faces retained, and repeated box outlines replaced by one outer contour plus one line per gap. Real separated slats and square legs remain visible as the camera turns.

Tree centers, canopy dimensions and trunk lengths were measured independently. The front round tree was too high; several capsule stems were too long; the conifers were too short or too far forward. Capsules now have curved, tessellated white highlight patches that do not disappear into the canopy; trunks use the source's blue fill. Conifers have three straight tapered tiers and clear curved brims. The two round trees use their measured ovoid proportions.

Planters use measured rim centers, a raised rim, recessed soil, pale side faces and varied widths/depths. Sparse spheres were replaced by continuous foliage volumes with irregular small lobes, blue-green lower growth, separate leaves, white five-lobed flower heads and blue centers. Enlarged source/current crops drove several iterations; smooth peanut-like masses and paired "eye" dots were rejected. The final result is more botanical while retaining the reference's simplified white/blue language.

Evidence: `park-comparison.png` and `park-reference-updated.png`.

### 3. Café close-up — refined

The upper window layout is corrected to two broad openings per face. The three outdoor tables now have three chairs each, with five visible guests. Table sizes, chair-back slats, legs, and guest scale were revised. The open storefront has actual transparent glazing, door hardware, pendant lamps, display equipment, a barista, fluted counter faces, and a wider espresso station with two group heads, spouts, drip area and cup rail. The menu board has a sloped blue inset face and rear support. Planters, tall-leaf pots, trees, lamps and bollards now use the measured positions.

The generated source compresses interior depth inconsistently. Equipment is resolved as real objects within the street-facing service area; small interior glyphs and exact occlusion do not claim pixel identity.

Evidence: `cafe-comparison.png`.

### 4. Office and east buildings — corrected

Office window counts and lower entry geometry now match the measured source grid. Prominent repeated plant drawings were quieted to restrained window silhouettes. The mast has the measured height/position and three crossbars, drawn with one stroke per feature. Roof services retain separate louvers and white caps.

The home has two rows of larger openings, an entry replacing a lower window, a threshold step, a roof tank on a slatted platform, cap/knob, chimney, three-legged stool and a pot. The apartment has three rows, a lower central entry, and two closed balcony fronts with fine rails and three pots each. The shop has a quieter left display, planted side displays, door handle and a shallow entrance mat.

Evidence: `office-comparison.png`, `east-comparison.png`.

### 5. Streets and vehicles — refined

Empty drain rectangles became filled recessed grates with five pale slots. Lamps have white stems, elliptical capped heads and widened feet; short bollards are separate instances. The source's varied pole heights are retained. The road base has rounded corners; paving and curbs remain fitted to the parcels.

Crossing corners/progression were derived from white-component measurements in the source. Seven western stripes and eight eastern stripes replace the approximate repetitions; the unsupported third zebra group was removed, and stop lines were added. Paint remains ordinary editable floor polygons. Cars were rebuilt as boxy hatchbacks with short hoods, high cabins, two side panes, front/rear glazing, wheels/hubs, seams, handles, headlights, grille, bumper and plate.

## Visual QA and remaining likeness differences

The source/before/current park, café, office and east crops were placed in the same comparison inputs and opened during the review. They use equal pixel regions and no recoloring. The master captures were checked against actual browser dimensions: 1500 × 1286 viewport, 1452 × 1086 canvas at x24/y96.09375, and a 1448 × 1086 art crop at x26/y96. An intermediate capture at the wrong scale was rejected and replaced. Browser JPEG compression is retained; source PNG content remains unchanged. `capture-metadata.json` records the normalization.

The final geometry is a closer, measured reconstruction, **not a literal pixel clone**. Remaining P3 likeness notes are the source's softer tonal washes, some leaf/flower silhouettes, very small interior furniture/vessels, exact chair poses, and a few curb/roof-lip nuances. These are visible in the map rather than hidden by a raster overlay.

The five required fidelity surfaces were checked:

- **Typography:** portfolio Fraunces/DM Sans unchanged; the source artwork contains no typography. The map uses legible report text and explicit feature names.
- **Layout:** source frame and crops are proportional; the same reference camera is retained. Desktop and phone controls fit without horizontal overflow.
- **Color:** cobalt outlines, white/pale blue/lavender architecture, muted blue-green vegetation, white flower heads and restrained cream interior surfaces follow the source. Tonal washes remain an interpretation.
- **Asset quality:** authored mesh surfaces, intentional strokes, actual glazing and small geometry patches. There are no textures or baked illustration planes. Reference PNG/JPEG captures appear only in comparison/report UI.
- **Copy/content:** inventory descriptions distinguish measured counts from calibrated positions and ambiguous micro-details. No claims about real locations, customer outcomes or literal pixel equivalence are introduced.

## Verification

`node art/geomarketeer/verify-approved-neighborhood.mjs` passes finite geometry, unique names, source counts, 70 actual window cells, bench orientation, 55 measured landmark projections, secondary-line fading, no below-ground roof geometry, fitted building footprints, orbit/zoom bounds, true camera movement, interruption settling, keyboard reset, pointer cancellation and immediate reduced motion. Final geometry: **24 surface meshes, 44 stroke batches, 223,449 surface triangles including silhouettes, zero textures**, within the 225k detailed-geometry budget. The runtime stops drawing after settling; phone-size rendering hides secondary contours before they merge.

The original café-block suite still passes with unchanged counts: 87 surfaces, 72 stroke batches, 93,708 surface triangles, zero textures. No dependencies were added. Syntax and whitespace checks pass.

Browser inspection covered the reference camera, both orbit limits, responsive resizing, keyboard input/reset, comparison, loaded fonts, and warning/error logs. At 390 × 844 the page has no horizontal overflow and visible buttons retain their 44px height. The map was checked for category filters, matching crop viewBoxes, keyboard region selection, before/after modes and marker visibility. Physical-device touch, slow-device frame rate, OS media-preference switching and full accessibility compliance were not established by this review; reduced motion is verified with the actual viewer source in a controlled fixture.

No open P0/P1/P2 implementation defects were found in this detailed-refinement scope. Artistic likeness remains reviewable through the map.

final result: passed (measured detail refinement; exact pixel identity is not claimed)
