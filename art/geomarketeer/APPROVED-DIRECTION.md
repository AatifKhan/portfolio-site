# GeoMarketeer — current approved direction

Updated: 2026-10-26.

## Illustration layout

The user explicitly selected the attached **Denser neighborhood — layout sketch** as the illustration layout, after reviewing the front-lane storyboard.

Canonical reference: `approved-layout-selection-v3/approved-layout.png`, copied unchanged from the user's attachment. Preserve its neighborhood arrangement: residential towers back left, offices upper right, metro beside the busy area at middle right, streets and crossings, central building and parking, and foreground café row.

This image supersedes the later generated wide-composition variant in `front-lane-storyboard-v2/` as the authority for the illustration layout. Do not treat a storyboard panel's redrawn geometry as a replacement master layout.

## Storyboard

The user likes the storyboard in `front-lane-storyboard-v2/storyboard.png`. Keep its five-beat narrative and tightly framed opening on the foreground café lane before the wider reveal.

The user's explicit story clarification remains: Sid initially considers a unit **within the existing café row**. The selected layout's handwritten “Proposed café” and “Opening view” annotations predate that clarification; preserve the attached reference unchanged, but do not silently use those annotations to rewrite the approved story or introduce a move to a second site. Camera framing and narrative site identification are governed by the approved storyboard. No second-site recommendation or business outcome has been approved.

## Selected illustration style — 2026-10-25

After exploring other treatments, the user selected the attached cobalt-outline, white/periwinkle filled isometric style. Its unchanged source is preserved in `detailed-blue-illustration-v1/selected-style-reference.png`. Capsule trees, tiered conifers, clean fine contours and filled architectural planes are the current style authority. The earlier blue and fresh-style explorations remain archived alternatives.

The requested detailed image is `detailed-blue-illustration-v1/illustration.png`, generated against both the style attachment and locked neighborhood composition. It awaits review and does not replace the spatial authority or approved front-lane narrative. No SVG, 3D-model or website implementation is implied by style selection.

## Scope

The user approved implementation of the five-beat image opening after the reduced-tree illustration revision. Its unchanged source is `detailed-blue-illustration-v2/illustration.png`, copied to `assets/portfolio/geomarketeer/story-opening/master.png` for the website. This is the current live artwork; prior variants remain preserved.

The opening is integrated into both portfolio entrypoints, stacked within the existing 560px column. Shared camera data renders one image throughout and exports five corresponding frames. See `story-opening/README.md` for assets and validation.

Existing 3D work remains available through the standalone studies and the portable snapshot in `preserved-3d-2026-10-25/`; it is not the active case-study opening. No new 3D modeling was performed as part of the raster-opening implementation.

## Component-based 3D phase

The user subsequently requested a standalone 3D component kit based on the same
reduced-tree illustration, with family-by-family review before neighborhood
assembly. The residential tower master and five identical copies are approved.
Their geometry remains unchanged as the next family is developed.

The café family revision 2 and its furniture are approved: one base plus upstairs,
compact, vacant blue-awning, and corner variations. Their geometry is preserved.

The office family is approved at `/geomarketeer-office-component-study.html`:
one base, a wider office, and a lower rear wing share window bays, entrances and
roof components. The partly hidden wing's unseen details use the shared system.
The small-building family is approved at
`/geomarketeer-small-building-component-study.html?mode=variants`: eight declared
configurations of one shared shell cover nine source structures, including the
gatehouse, utility buildings, homes and attached annex. Hidden access details
use the same parts. The gatehouse reuses the approved café awning generator.
The hatchback is approved at
`/geomarketeer-car-component-study.html?mode=angles`: one static master with
front/rear three-quarter, front and side views, plus three identical review
copies. All thirteen source cars map to that master; positions remain unassigned.
Scooter and bicycle masters are approved at
`/geomarketeer-two-wheeler-component-study.html?mode=angles`, each with four angle
views and three identical review copies. Ten source scooters and three bicycles
map to these two masters. They remain static vehicle masters. The person checkpoint now shows fitted riders
as separate review components. Cafés, offices, small buildings, cars and two-wheelers remain unplaced. The blue-awning candidate remains vacant,
and the live raster portfolio opening is unchanged.
See `component-kit/README.md` and its exported inventory for approval state.


The people family is approved at
`/geomarketeer-people-component-study.html?mode=variants`: one base person with
standing, walking, seated, scooter-riding and bicycle-riding fits. The five fits
keep the same proportions and bone lengths. The approved café chair and vehicles
serve as isolated contact references. All 126 mapped source figures are unplaced;
partly occluded interior guest bounds remain provisional until composition review.
People and support assemblies remain outside the neighborhood and live opening.


The trees and planting family is approved at
`/geomarketeer-planting-component-study.html?mode=variants`: standard and small
capsule trees, standard and small three-tier conifers, two square pot sizes, and
standard/short low planters. The 22 source objects are mapped to four reusable
masters. The short planter is a declared kit variation. Source crops, three-copy
previews and scene-scale views are available. All planting remains unplaced;
people revision 2 and every earlier approved family retain their geometry.


The street furniture family is approved at
`/geomarketeer-street-component-study.html?mode=variants`: six standard masters
for lamps, bollards, benches, bins, fence panels and gateposts. The bin design is
inferred because no unambiguous bin is visible in the reference. A separate
construction preview joins three identical panels to four identical posts.
All street furniture remains unplaced. The approved planting geometry and all
earlier approved components are unchanged. The user requested the metro as the
next component on 2026-10-26. Its approval fingerprint is saved.


The metro entrance is approved at `/geomarketeer-metro-component-study.html`:
one master assembled from stairs/landings, perimeter guards, stair handrails,
canopy/glazing and the geometric M sign. Source crop, isolated parts, a cutaway,
detail close-ups, angle controls and scene-scale previews are available. The
stairwell extends below grade and declares a ground cutout for future composition.
Tread count, depth and concealed structure are inferred from the single image.
No metro placement, people, ground assembly or portfolio integration is included.
The user accepted ground/courtyard as the next checkpoint with “Go ahead then.”


Ground and courtyard are in review at
`/geomarketeer-ground-component-study.html?mode=variants`: seven masters and
eleven configurations cover road surfaces, junctions, pavements, a lowered crossing
edge, kerb segments, crossings, lane dashes, parking bays, the circular courtyard
inset and the metro pavement opening. Review-only crossing, parking and metro fits
check how these parts meet. Thirty-one source regions and marking runs have stable
IDs; final polygons, subdivision and neighborhood positions await composition.
All ground assets remain unplaced. Every earlier approved family and the live
portfolio opening are preserved. Full neighborhood assembly follows ground approval.


## Neighborhood assembly — checkpoint 12

The user accepted assembly after the ground checkpoint with “Go ahead”. All
component families are now approved; the composed scene awaits visual review.
Open `/geomarketeer-kit-neighborhood.html` on port 4174. This separate viewer
contains 326 component instances and eight layout surfaces, five identical
shared towers, eight district views, matching reference comparison, ±15° orbit,
100–300% zoom, keyboard/touch controls and per-district still fallbacks.

The editable placement manifest is
`component-kit/neighborhood-manifest.json`; authoring sources are the
`neighborhood-*.js` modules in `scripts/geomarketeer-kit/`. Approved master
geometry is unchanged. Layout-dependent ground boundaries, crossing lengths,
seating supports and pedestrian clearance corrections are explicit in the
manifest. The live portfolio and older studies are preserved. See
`component-kit/README.md` and `reports/component-kit/neighborhood/` for checks
and review captures. Final composition approval precedes portfolio integration.

## Neighborhood story — checkpoint 13

The requested five-beat story is implemented at
`/geomarketeer-kit-neighborhood.html?mode=story`, pending visual review. The
no-query URL continues to open exploration. Both modes share the assembled scene
and renderer. Original story titles and body copy remain the source of truth;
`cafe-lane-03` is the vacant candidate in every shot.

Actual 3D bounds determine the orthographic shots, with the requested −6°, −3°,
+6°, 0°, 0° offsets, 30° pitch, 850ms camera transitions and 220ms emphasis fades.
The 560px column includes a 16:9 scene, Next/Back, Skip, Story/Explore and Replay.
Five saved renders preserve navigation after WebGL failure, with a separate
script-free reader. Geometry, placements, both portfolio entrypoints, the raster
opening and earlier studies remain unchanged. See `component-kit/story/README.md`
and `reports/component-kit/story/` for captures and validation. Portfolio integration
follows this review checkpoint.
