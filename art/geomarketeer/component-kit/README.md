# GeoMarketeer component kit — story checkpoint 13

Status: **five-beat story implemented; awaiting visual review**.
Open [the standalone story](http://127.0.0.1:4174/geomarketeer-kit-neighborhood.html?mode=story)
or [read the five saved frames](http://127.0.0.1:4174/art/geomarketeer/component-kit/story/index.html).
The unchanged URL still opens exploration. Both modes reuse one scene and renderer.
The approved copy, geometry, placements, portfolio openings and earlier studies
are preserved. See [story documentation](story/README.md) for shots, controls,
fallbacks, captures and validation results. Portfolio integration remains later.

---

# Neighborhood checkpoint 12 — preserved assembly

Status: **all twelve families approved; assembled composition awaiting visual review**.
Open [the standalone neighborhood](http://127.0.0.1:4174/geomarketeer-kit-neighborhood.html).
The live portfolio opening and older neighborhood study remain unchanged.

## Review the assembly

Eight views cover the overview, housing, offices, central café/parking, metro,
foreground café lane, western homes and eastern home. Compare with reference
uses the same calibrated orthographic projection. Turning is limited to ±15°;
zoom is 100–300%. Left/right arrows turn, +/− zoom, and 0/Home reset the overview.
Touch exploration is opt-in. People and vehicles remain static.

This assembly contains **326 component instances plus eight layout surfaces**:
five identical towers, three offices, eight small buildings, five cafés, two
extra terrace sets using the approved furniture, 13 cars, 13 two-wheelers,
126 people, 22 planting instances, 62 street-furniture instances, one metro,
one courtyard, six crossings, four parking bays and 55 lane dashes.

The blue-awning candidate remains vacant. Café geometry and its built-in table
counts are unchanged. The two extra terrace sets occupy source seating locations
outside the café shells. Existing seated guests use actual chair positions;
riders use the approved vehicle-relative poses. Twenty-three pedestrians receive
small placement corrections for clearance, recorded in the manifest. Metro
occupants stand on actual landings or tread centers. Source seats that have no
approved chair use a standing guest, explicitly recorded as a pose adaptation.

## Editable source and inventory

- `scripts/geomarketeer-kit/neighborhood-manifest.js` maps stable source IDs to
  masters, variants, positions, headings, support IDs and review status.
- `neighborhood-ground.js` defines the road and seven pavement polygons with
  the approved palette, grid and grade. Real openings expose the metro well
  and central parking. Boundaries and concealed surfaces are inferred from
  the illustration. Crossing depths of 2.6, 3.0 or 3.8 units are declared layout
  dimensions; all stripes retain their approved width, count and spacing.
- `neighborhood-fit.js` fits pedestrians around buildings, furniture and rails.
- `neighborhood-model.js` creates the shared assets, instanced opaque meshes,
  batched outlines and individually sorted glazing. Corrections to a master
  still propagate to all its instances. It owns only its extra ground,
  terrace and batching resources; library resource disposal stays separate.
- `neighborhood-viewer.js` starts the shared controller. The story checkpoint
  extracts framing and rendering into `neighborhood-stage.js`, with district
  selection, comparison, controls and recovery in `neighborhood-controller.js`.
- `neighborhood-manifest.json` is the exported placement inventory, including
  layout surfaces, embedded furniture, source locations, part paths, local
  master bounds and omitted lane dashes. `inventory.json` preserves component
  study records and links to this complete assembled inventory.

Regenerate after editing:

```sh
node art/geomarketeer/component-kit/export-inventory.mjs
node art/geomarketeer/component-kit/export-neighborhood.mjs
node art/geomarketeer/component-kit/verify-neighborhood.mjs
node art/geomarketeer/component-kit/verify-neighborhood-viewer.mjs
```

## Verification and review images

All **51 approved geometry fingerprints** match, including ground revision 1.
The checks cover shared tower geometry, finite buffers, exported placements,
render-instance transforms, building support, road markings, car contact,
chair/rider alignment, the actual metro opening, fence connections and one-time
resource disposal. Viewer fixtures exercise all districts, camera bounds,
projection alignment, touch, reduced motion, idle rendering, visibility,
context loss, initialization failure and saved previews.

Browser review covers 1440 × 1100 desktop and 390 × 844 phone layouts, reference
comparison, overview/café/metro at both orbit limits, 300% detail, all eight
fallbacks and recovery. No browser errors or horizontal phone overflow were
observed. The assembled scene uses 150 render objects / 179 draw calls and
approximately 2.76 million rendered triangles. Further optimization follows
composition approval.

Captures and verification reports: `reports/component-kit/neighborhood/`.
Fallbacks: `assets/portfolio/geomarketeer/component-kit/neighborhood-*-still.jpg`.
These are **review captures**, not user-approved composition captures.
The next checkpoint is composition review; portfolio integration remains later.

---

# Ground checkpoint 11 — approved (preserved component study)

Ground revision 1 is approved. The user accepted neighborhood assembly with
“Go ahead”. The isolated ground study and its eleven configurations remain
available unchanged in geometry. The section below documents that checkpoint.

Open `/geomarketeer-ground-component-study.html?mode=variants` on port 4174.
Seven masters have eleven declared configurations:

| Master | Configurations | Review treatment |
| --- | --- | --- |
| `road` | `straight`, `junction` | Pale-blue, continuous road slabs |
| `pavement` | `straight`, `plaza`, `ramp`, `metro` | Shared grid, flat/rounded/flared edges, actual metro opening |
| `kerb` | `standard` | Five copies joined at their end anchors |
| `crossing` | `standard` | Eight separated white bars on road context |
| `lane-marking` | `standard` | Five repeated dashes on road context |
| `parking-bay` | `standard` | Open-ended U-shaped white marking |
| `courtyard` | `standard` | White rim and pale-blue circular inset on plaza context |

Select a component for its source crop and surface/edge close-up. Component tiles
use individual framing to keep small markings inspectable; asset scales stay at
one. Reference, Plan, Low and Rear cameras retain ±15° orbit and 100–300% zoom.
Scene scale uses the illustration calibration. The viewer retains keyboard input,
reset, explicit touch exploration, on-demand rendering, reduced-motion behavior
and a saved fallback for each configuration.

Three separate fit checks reuse the same library assets:
- Crossing fit: one road and zebra crossing meet two mirrored lowered pavement
  edges, with lane dashes kept outside the crossing.
- Parking fit: four repeated bays and three unchanged approved hatchbacks show
  wheel contact, body/mirror clearance and the empty fourth bay.
- Metro fit: the approved entrance meets a matching pavement opening. The upper
  landing is flush, and the lower landing remains exposed through the cutout.

`ground.js` owns all surface and marking geometry. `ground-review.js` composes
isolated review fixtures; it adds no neighborhood instances. Pavement grade is
Y=0, road grade is Y=-.12, and both slabs meet a Y=-.18 base. Paint sits .002 above
the road. These are illustrative units. Straight roads are 8 × 4.6, junction arms
share the 4.6 width, plazas are 6 × 6 with .45 corner radii, and the paving grid
uses .65 spacing. The ramp has piecewise planar flares; grid strips split at the
same slope changes. Straight pavement ends are square for continuous joins.

The circular inset has a 2.3 radius, .18-wide rim and a .065 rim top. Its function
is deliberately unspecified because the source is ambiguous. No fountain, water
animation, new planting or people are invented. The metro paving is 9.2 × 6.2 and
uses the approved entrance’s exact `[[-2.8,-1.47],[2.8,1.47]]` X/Z cutout. Both
slab faces and grid strips omit the opening. Kerb sections, slab thickness and
concealed crossing slopes are coherent interpretations of the reference.

`ground-inventory.js` records 31 visible surface regions, crossing features,
parking areas and lane-marking runs, with stable source IDs and review bounds.
Final district polygons, subdivision into modules and instance positions follow
composition review. The source boxes are provisional where buildings and people
obscure the surfaces. All ground records remain unplaced; only the existing five
towers have neighborhood positions.

Run `node art/geomarketeer/component-kit/verify-ground.mjs` for actual surface
ray checks, ramp contacts, real holes and stripe gaps, courtyard continuity,
car/bay clearance, bounds, shared buffers/materials, disposal, inventory, camera
limits, framing and lifecycle checks against the real viewer with a stub renderer.
`verify-street.mjs` protects the earlier approved geometry, and `verify-metro.mjs`
checks the unchanged metro. Browser captures and evidence live under
`reports/component-kit/ground/`; per-component fallback captures are in
`assets/portfolio/geomarketeer/component-kit/ground-*-still.jpg`.

Desktop and phone viewport checks do not substitute for physical-device touch or
low-end GPU testing. Technical verification does not imply artistic approval.

# Metro entrance checkpoint 10 (approved)

Status: **architecture, café furniture, vehicles, people, planting and street
furniture and metro entrance approved**. The user requested
“Go ahead with the metro entrance mnow” after the street review. The metro remains
unplaced. Ground/courtyard is now in review.

Open `/geomarketeer-metro-component-study.html` on port 4174. The complete entrance
appears beside the source crop. Components shows five assemblies at a common
projection scale; selecting one isolates it. Stairwell cutaway hides the canopy,
near wall and two railing runs to reveal the descent. Stairs, canopy and sign have
detail framing. Reference, front, side and rear cameras support ±15° orbit and
100–300% zoom, keyboard controls, reset and explicit touch exploration. Scene
scale checks readability against the full reference. Rendering is on demand and
`?view=still` tests the saved fallback.

`metro.js` defines one `metro-entrance/standard` master and five named assemblies:
structure, guards, handrails, canopy and sign. Eight equal .30 × .14 treads join
two landings. The clear well is 2.94 units wide and extends 1.12 below grade.
Four columns support six transparent roof panes; six side panes leave the upper
approach open. A geometric white M appears on both faces of the cobalt disc.
The mast ends below the letter. Dimensions, tread count, hidden faces and stair
depth are coherent interpretations of the illustration, not measured infrastructure.

The entrance faces local -X; stairs descend toward +X. The grade anchor remains
Y=0 and the lower landing anchor is `[1.85,-1.12,0]`. The returned group, bounds
and independent anchors retain the library contract. The asset declares its ground
cutout as `[[-2.8,-1.47],[2.8,1.47]]` in X/Z. The final pavement must retain this
opening. A separate white review ground mask conceals the below-grade exterior;
it belongs to the viewer, not the reusable component.

The compiler's opt-in hierarchy path preserves named metro assemblies for the
cutaway. Prior assets retain their original compilation path. Repeated entrance
instances share geometry and materials; visibility changes remain instance-local.
The master has 4,286 surface triangles and 55 batches; the complete viewer uses
57 draw calls including transparent rendering and the ground mask. Captures are
in `reports/component-kit/metro/`, and the reference-angle fallback lives at
`assets/portfolio/geomarketeer/component-kit/metro-entrance-still.jpg`.

Run `node art/geomarketeer/component-kit/verify-metro.mjs`. It checks real tread
surfaces and landing contacts, rail feet, open access, canopy contact, glazing,
M clearance, bounds, shared resources, disposal and the actual viewer's controls
and framing with a stub renderer. The street verification checks every earlier
approval fingerprint; `approved-street-geometry.json` protects the street family.
Only the five approved towers retain neighborhood placements. Both live portfolio
entrypoints and all previously approved geometry remain unchanged.

Open `/geomarketeer-street-component-study.html?mode=variants` on port 4174 for
all six masters at one shared projection scale. Select any component for its
source crop and close-up. The Detail close-up toggle frames the lantern, bollard
cap, bench supports, bin mouth, fence corner or gatepost cap/plaque. Reference,
front, side and true rear views retain ±15°
orbit and 100–300% zoom. Three copies and Scene scale previews are available.
The Fence assembly tab shows three identical panels connected to four identical
posts. These are review-only compositions, outside the neighborhood manifest.
The bin is explicitly an inferred component, with street context rather than a
claimed exact source match. No definite source bin has been identified.

Open `/geomarketeer-planting-component-study.html?mode=variants` on port 4174 for
four masters and eight fixed variations. Tree sizes share one comparison scale;
containers share a closer scale. Each component has a reference crop, reference/
side/rear views, three identical review copies, and a full-illustration Scene scale
preview. Keyboard controls retain ±15° orbit and 100–300% zoom. Touch exploration
is opt-in. Rendering is on demand, with reduced motion and per-variation still
fallbacks.

Open `/geomarketeer-people-component-study.html?mode=variants` on port 4174 for
all five pose fits at the same projection scale. Standing, walking and seated are
joined by two riding fits, one for each approved vehicle. Reference, side and rear
camera buttons retain ±15° orbit and 100–300% zoom. Select a pose for its source
crop or use Scene scale. The context button hides the chair/vehicles so the person
can be inspected independently. Keyboard controls, optional touch exploration,
on-demand rendering, reduced motion and pose-specific fallbacks are included.
Example: `?variant=riding-bicycle` or `?view=still&variant=seated`.

Open `/geomarketeer-two-wheeler-component-study.html?mode=angles` on port 4174.
The Scooter and Bicycle selectors keep the current preview mode. Each master has
front/rear three-quarter, front and side views, a three-copy preview, a
source-crop comparison and a scene-size view. The board uses equal camera scale
across the four views of the selected master. Orbit is ±15° per view; zoom is
100–300%. Keyboard controls, touch opt-in, reduced motion, reset, on-demand
rendering and eight angle-specific still fallbacks follow the existing viewers.
Use `?master=bicycle&mode=copies` or `?master=bicycle&view=still&angle=rear`.

Open `/geomarketeer-car-component-study.html?mode=angles` for four views of the
same hatchback. Reference angle and Rear three-quarter use 30° elevation; Front
and Side use level orthographic views. Each allows ±15° orbit and 100–300% zoom.
`?mode=copies` shows three static, identical copies with different positions and
headings. These review-only placements are separate from the neighborhood manifest.
`?mode=scale` checks scene-size readability. Saved fallbacks are angle-specific,
for example `?view=still&angle=rear`. Controls retain keyboard support, touch
opt-in, reduced-motion handling, on-demand rendering and reset.

Open `/geomarketeer-small-building-component-study.html?mode=variants` for eight
small-building configurations at the same projection scale. Individual models
appear beside their exact reference crop. Doors & windows and Roof detail offer
close-up framing; Scene scale checks neighborhood readability. The board is four
columns on desktop, three on tablet, and one on phones. Keyboard controls, ±15°
orbit, 100–300% zoom, reset, optional touch exploration, reduced motion and saved
fallbacks match the earlier viewers. Try `?view=still&variant=home-annex`.

Open `/geomarketeer-office-component-study.html?mode=variants` on the existing
server (port 4174) for three office variations at the same scale. Each selection
opens beside its source crop. Entrance and Façade detail buttons provide close-up
framing; Scene scale compares readability against the entire illustration.
Orbit remains ±15°, zoom 100–300%, with keyboard controls, reset, explicit touch
exploration, reduced-motion handling, on-demand rendering and a saved fallback.
The fallback can be checked with `?view=still&variant=wide`.

Open `/geomarketeer-cafe-component-study.html?mode=variants` on the existing server
(port 4174) for the five-café comparison board. Each label opens the individual
model beside its source crop. Whole café, Seating detail and Storefront detail
buttons provide review framing without changing the orthographic angle. Seating
is unavailable on the vacant unit. Reset restores the whole café; selecting a
variant or preview mode also resets detail framing. `?focus=seating` and
`?focus=storefront` open the corresponding detail directly.
The board uses one camera scale across all five
models, plus common orbit and zoom. `/geomarketeer-component-study.html` retains
the approved tower's master, five-copy and scene-scale views.
Source comparison uses the unchanged reduced-tree image, with SVG viewBox and
clipping for the displayed crops. No source image pixels were edited.

## Asset and placement contract

The library lives in `scripts/geomarketeer-kit/`. `createAssetLibrary()` owns
materials and a compiled-master cache. `createAsset({assetId, variantId,
instanceId})` returns `{group, bounds, anchors}` in local coordinates. Place the
group using the separate instance manifest. Returned bounds and anchors are
independent values; surface and stroke geometry and materials are shared.

Implemented combinations are `residential-tower/standard`, `cafe` with the
variant IDs `base`, `upper-floor`, `compact`, `blue-awning`, and `corner`, and
`office` with `base`, `wide`, and `low-wing`; and `small-building` with `base`,
`gatehouse`, `utility-hut`, `stacked-home`, `compact-store`, `frontage-unit`,
`utility-block`, and `home-annex`; plus `hatchback/standard`, `scooter/standard` and `bicycle/standard`; and `person`
with `standing`, `walking`, `seated`, `riding-scooter` and `riding-bicycle`.
Unknown assets/variants throw rather than silently substituting geometry. Instance
transforms never change master dimensions. Call the library's idempotent
`dispose()` once the consuming scene is finished; do not dispose individual
instances' shared geometry or materials.

`tower.js` authors named floor, window, balcony, entrance and roof assemblies.
`compile.js` batches those editable definitions into one surface mesh and three
stroke batches. The original component names survive in `group.userData.parts`.
Each tower has eight floors, sixteen balconies and ninety glazing/door-window
units including the rooftop enclosure. Its source dimensions are illustrative
units, not a surveyed or metre-accurate building.

`inventory.js` contains the authoritative family map, district bounds, reference
coordinates and five tower placements. `inventory.json` is its review export;
verification checks that the exported families and instances remain in sync.
Only approved tower instances have scene placements. Five café, three office,
nine small-building, thirteen car and thirteen two-wheeler source objects have
stable IDs, reference bounds, master/variant assignments and explicit `unplaced`
status. Architecture, vehicles and people are approved. The people inventory adds 126
reference figures with pose IDs, review bounds and unplaced status. Partly hidden
interior guest boundaries are provisional until composition review. The eastern home and annex are two source objects in one
review configuration. Run
`node art/geomarketeer/component-kit/export-inventory.mjs` after changing the
catalog. It exports the approval record, variants, source objects and placements.
The remaining families stay planned.

## Street furniture

`street.js` defines six masters, each with one `standard` variant:

| Asset ID | Construction |
| --- | --- |
| `lamp` | Stepped foot, narrow pole, four transparent lantern panes, diffuser and pyramidal roof |
| `bollard` | Circular foot, slim shaft and rounded cap |
| `bench` | Five open seat slats, two cross supports, connected under-seat braces and four feet |
| `bin` | Cylindrical shell, fitted annular lid and a genuinely recessed opening; inferred design |
| `fence-panel` | Thirteen pickets, two rails and fixed upper/lower end anchors |
| `gatepost` | Square pier, thin cap, inset plaque and panel attachment points |

The shared asset interface remains `createAsset({assetId, variantId, instanceId})`.
Geometry and materials are cached per master; copies have unit scale and receive
independent groups, bounds and anchors. Every asset has ground, center and top
anchors. The bench adds a seat anchor, the lamp a light-center anchor, and fence
panels/posts share left/right upper/lower attachment anchors.

`street-review.js` joins the fence example exclusively through these anchors.
It creates no scene placements. The panel deliberately has ground clearance;
its supports are the gateposts. `street-inventory.js` maps 62 source review
records: 19 lamps, 34 bollards, one bench, five posts and three continuous fence
runs. Pole bounds and occluded bases are provisional review boxes. Whole-panel
repeat counts will be resolved during composition review; no arbitrary scaling
is introduced. The inferred bin has no invented source instance. Metro railings
remain in the separate metro family.

Run `node art/geomarketeer/component-kit/verify-street.mjs`. Actual geometry checks
cover grounded bases, slat gaps and support contact, the recessed bin mouth,
transparent lantern panes, open fence gaps, and both connection levels in the
fence assembly. Tests also cover bounds, finite geometry, resource sharing and
disposal, all approved geometry fingerprints, and the real viewer under a DOM/
renderer fixture. It exercises the four camera views, feature-focused detail framing, orbit/zoom limits, copies,
assembly, responsive board, keyboard/touch input, reduced motion, on-demand
rendering and per-component fallbacks. Browser evidence is under
`reports/component-kit/street/`; six saved previews are under
`assets/portfolio/geomarketeer/component-kit/street-*-still.jpg`.

## Trees and planting

Revision 1 is approved: “The trees and planting look good. Let’s move on to street
furniture.” All 22 mapped planting source objects remain unplaced.

`planting.js` authors four masters around a ground origin, without scene positions:

| Asset ID | Declared variant IDs | Construction |
| --- | --- | --- |
| `capsule-tree` | `standard`, `small` | Smooth capsule, slim trunk, circular foot and two conforming white highlights |
| `conifer` | `standard`, `small` | Three closed, overlapping flared tiers on a shared trunk |
| `pot` | `standard`, `small` | Tapered square tub, rim, recessed soil and flowering mound |
| `low-planter` | `standard`, `short` | Shared trough with three or two repeated flowering mounds |

The short planter is an explicit kit variation, not an additional source object.
The canonical reference has 11 capsule trees, 8 conifers, 2 pots and 1 long planter.
`planting-inventory.js` records their stable IDs, source bounds, reference ground
points, district, master and variant, review status, and unplaced status. It adds
no scene placements. Tree sizes are fixed geometry variants; copies have unit scale.

The normal `createAsset({assetId, variantId, instanceId})` contract returns the
compiled group, independent bounds and anchors. Ground, bounds-center and top
anchors are common; containers also expose rim and soil anchors. All copies of a
variant share geometry and materials. Container walls have real thickness and
soil below the rim; foliage roots penetrate soil without crossing inner walls.
Smooth trees and foliage use the existing silhouette pass. The tree highlights
follow the capsule surface, and small five-lobed white flowers use light contours.
No textures or raster reference planes are used in the live assets.

Run `node art/geomarketeer/component-kit/verify-planting.mjs`. It checks actual
surface contacts, bounds, finite geometry, outward winding, shared resources and
disposal, source metadata, all approved geometry hashes, and the real viewer at
its camera limits. The viewer fixture also checks repeated copies, projection
scales, keyboard and touch controls, reduced motion, rendering lifecycle and
variant-specific fallbacks. Browser captures and verification are saved under
`reports/component-kit/planting/`. The eight fallback images live under
`assets/portfolio/geomarketeer/component-kit/planting-*-still.jpg`.

## People

Revision 2, including corrected standing and walking arm curves, is approved by
the user: “The people look good now. Let’s move on to trees and planting.” All
126 reference figures remain unplaced. Their approval fingerprint is preserved.

Revision 2 corrects reversed elbow bends in the standing and walking poses.
Their elbow bend direction now follows the back of the torso, with unchanged
wrist targets and bone lengths. Seated and riding geometry is byte-identical
to revision 1. Verification checks the bend direction in the actual arm surfaces.

`people.js` defines one base and five static pose records. The same rounded head,
plain torso, continuous tapered limbs, simple hands and rounded shoes appear in
every pose. The figures follow the reference’s featureless white/pale-blue style.
There are no identity, clothing or body-size variations in this checkpoint.

Each leg has .375/.365-unit bones; each arm has .235/.225-unit bones. A two-bone
solver bends knees and elbows to the pose’s contact targets without changing bone
lengths. All poses share .105-unit hip half-width, .125-unit shoulder half-width,
and a .152 × .216 × .142 head. Standing height is 1.463 illustrative scene units.
The meshes sweep continuously around joints rather than exposing ball joints.
The existing organic fill and silhouette material render clean contours from
all supported angles. Library resize updates silhouette thickness in screen pixels.

The API is `createAsset({assetId:'person', variantId:poseId, instanceId})`.
Returned anchors include ground, seat, both hands and both foot contacts. The
person faces +X and uses the same local origin as its review support. Riding
poses therefore have feet above Y=0; their shoes meet the floorboard or pedals.
The person asset contains no chair or vehicle geometry. Every repeated pose
shares compiled geometry/material references; bounds and anchors are independent.

`people-review.js` composes the review context. The seated pose uses a chair from
the unchanged approved café seating generator. Riders use the unchanged cached
scooter or bicycle master. Hips meet actual seat surfaces, hands reach the grip
anchors, and feet contact actual supports. The scooter foot placement and shared
hip spacing were refined against geometry intersections. The bicycle riding fit
is inferred: the source figure is beside its bicycle. No person is added to a
café asset, vehicle asset, neighborhood or live portfolio opening.

`people-inventory.js` maps 126 reference figures to stable IDs and the same person
master. It records pedestrians, café guests and four road riders, with links to
the existing scooter source IDs. Seated guests partly hidden by glazing or tables
retain provisional review boxes; composition review can refine these boundaries.
The bicycle rider is an additional fit of the base, not an invented source person.

Each pose has 7,448 surface triangles compiled into two batches: organic fill and
silhouette. The full review board uses 27 draw calls including context and shadow
pads. Rendering stops when controls are idle. The compiled silhouette pass draws
the same surfaces again, so browser triangle totals include both passes.

Run `node art/geomarketeer/component-kit/verify-people.mjs`. Tests check fixed
bone lengths, equal head dimensions, surface winding, actual shoe/seat contact,
hand anchors, riding-limb triangle edges against vehicle surfaces (allowing the
intended wrist/grip contact zone), reusable geometry, disposal, inventory,
approved fingerprints and real viewer controls/framing with a stub renderer.
Captures in `reports/component-kit/people/` include the pose board, side/rear views,
both orbit limits, 300% details, scene-size, phone layouts and fallback evidence.
Five stills live in `assets/portfolio/geomarketeer/component-kit/person-*-still.jpg`.

## Scooters and bicycles

`two-wheelers.js` authors two independent, reusable masters with a shared tube,
wheel and outline approach. The scooter has a curved leg shield with thickness,
a step-through floor, rear shell with a wheel arch, a padded saddle and connected
seat mount, front mudguard, fork, grips, brake levers, mirrors, lamps and center
stand. Its fork remains behind the front shield at all supported review angles.
The bicycle has an open diamond frame, paired stays and fork, eight sparse spokes
per wheel, a tapered saddle and post, swept handlebars, brake lever/cable detail,
chainring, rear sprocket, chain, opposing pedals and a grounded kickstand.

Both use `standard` as their only variant ID. They face local +X, contact grade
at Y = 0, and provide ground, axle, seat and grip anchors. These illustrative
scene units are derived from the reference, not measured vehicle specifications:

| Master | Wheel radius | Wheelbase | Overall length | Overall height |
| --- | --- | --- | --- | --- |
| `scooter` | .185 | .97 | 1.471 | 1.073 |
| `bicycle` | .290 | 1.04 | 1.620 | .933 |

Each pair of wheels shares the same authored buffers. Compiled master geometry
and materials are shared by every instance. Scooter geometry has 7,242 surface
triangles and four batches; bicycle geometry has 9,496 triangles and three
batches. A single review view including its shadow uses five or four draw calls,
respectively. The four-angle boards use twenty and sixteen. Browser triangle
counts include the screen-space strokes.

`TWO_WHEELER_SOURCE_OBJECTS` maps ten scooters and three bicycles to these masters.
Four source scooters have riders and one bicycle has an adjacent person; these
are recorded in `referenceConfiguration`. This checkpoint shows only the parked
masters. Person poses are now shown in the separate people checkpoint. No source
object has a scene position. `TWO_WHEELER_REVIEW_COPIES` is an isolated arrangement
of three same-scale copies per master with distinct headings and no overlap.

The parked scooter at `[990, 888, 50, 48]` and bicycle at `[1087, 646, 47, 61]`
provide the visual reference crops. Tiny mechanical parts, hidden faces and
stands are coherent interpretations in the shared illustration style. Source
pixels are unchanged. There are no invented brands or decorations.

Run `node art/geomarketeer/component-kit/verify-two-wheelers.mjs` for actual
wheel/stand contact, tire clearance, shield/fork separation, frame/axle contact,
open bicycle wheels, shared geometry, bounds, disposal, approved fingerprints,
inventory and camera/event checks against the real viewer with a stub renderer.
Browser captures and observations live in `reports/component-kit/two-wheelers/`:
angle boards, copies, both orbit limits, 300% details, scene-scale views, phone
layouts and fallbacks. Eight saved renders are in
`assets/portfolio/geomarketeer/component-kit/{scooter,bicycle}-*-still.jpg`.

## Hatchback

`car.js` authors one master with a rounded body profile, actual wheel arches,
cambered cabin, filled blue glazing, four identical wheels, lights, mirrors,
door handles, a hatch seam and bumpers. Windscreen surfaces follow the same cabin
curve, avoiding intersections from a separately approximated flat pane. Glazing
uses the opaque illustrated treatment because the source shows no car interior.

The foreground car at source bounds `[438, 630, 85, 68]` sets the silhouette:
short hood, tall cabin and white roof. Hidden rear details are coherent
interpretations, without a brand or license number. Body dimensions are 2.22 ×
1.04 units, overall height 1.075, wheelbase 1.40, track 1.02 and tire radius .205.
Mirrors and trim extend beyond the body footprint; returned bounds include them.
These are illustrative scene units. The car faces local +X and contacts grade at
local Y = 0. Anchors provide ground, front/rear bumper and both axles.

`CAR_ANGLES` supplies review cameras, not geometry variants. All four views and
all three `CAR_REVIEW_COPIES` instantiate the same `hatchback/standard` cached
geometry and materials. The copies do not overlap. `CAR_SOURCE_OBJECTS` maps the
thirteen visible cars to that master, with no scene positions yet. No drivers or animations are introduced.

Run `node art/geomarketeer/component-kit/verify-cars.mjs`. It verifies actual tire
contact, wheel-arch clearance with rays, glazing against the cabin surface,
shared wheel buffers and repeated-car geometry, bounds, disposal, approved-family
fingerprints, inventory and viewer controls/framing. The master has 3,520 surface
triangles compiled into four batches. The browser renders five draw calls for a
single car including its shadow, and twenty for the four-angle comparison.
Browser triangle totals include screen-space outline geometry.

Review evidence lives in `reports/component-kit/cars/`: `angles-board.jpg`,
`three-copies.jpg`, both orbit limits for each angle, a 300% close-up, scene-size
preview, phone layouts, and fallback evidence. Four angle-specific saved renders
are in `assets/portfolio/geomarketeer/component-kit/hatchback-*-still.jpg`.

## Small-building family

`small-building.js` uses one shell builder with real wall apertures and shared
window, door, plinth, roof and rooftop enclosure definitions. Parameters declare
footprints, wall heights and opening arrangements; no instance scaling changes
proportions. `home-annex` builds its annex from that same shell. Wall ends meet
without overlapping corner caps, and walls start above the plinth to avoid
coplanar surface flicker. Window frames and sills have depth, doors have handles
and thresholds, and roofs use actual parapet geometry where the reference shows it.

| Variant | Main footprint | Wall height | Defining configuration |
| --- | --- | --- | --- |
| `base` | 2.50 × 2.50 | 1.45 | Southwestern home, framed windows, single entrance |
| `gatehouse` | 1.75 × 1.60 | 1.30 | Transparent service glazing, counter, striped awning |
| `utility-hut` | 1.45 × 1.40 | 1.00 | Plain roof, paired side window |
| `stacked-home` | 1.80 × 1.65 | 1.60 | Two rows of side windows, double entrance |
| `compact-store` | 1.85 × 1.80 | 1.25 | Double service doors, parapet roof |
| `frontage-unit` | 1.80 × 1.70 | 1.30 | Warm glazed double entry, paired side window |
| `utility-block` | 3.65 × 3.90 | 1.65 | Wider shell, two front door sets, two side windows |
| `home-annex` | 3.70 × 3.40 | 1.90 | Roof enclosure and 1.80 × 1.60 × 1.05 annex |

Dimensions are illustrative scene units. The source has no use labels: utility,
store and home names are working inventory labels. Tree-obscured or rear access
is inferred with the standard door parts. The compact home's two window rows do
not assert an internal floor plan. The eastern annex has an aligned internal
connection and its own source ID. There are no people, planting, furniture or
neighborhood placements in this checkpoint.

The gatehouse imports the unchanged `awning` generator from the approved café
family; that helper is now exported, with all café geometry fingerprints
preserved. Only the gatehouse's service panes use transparency. Other windows and
glazed-looking doors use filled illustration surfaces, matching the simple source.
Repeated instances share compiled geometry/materials; named authoring modules and
all parameters remain editable. Fixing a module updates every configuration using it.

Run `node art/geomarketeer/component-kit/verify-small-buildings.mjs`. Tests cover
geometry, apertures, corner solids, the annex connection, shared window/door
modules, café awning reuse, approved-family fingerprints, resource disposal and
viewer interactions. Captures and browser evidence live in
`reports/component-kit/small-buildings/`; eight saved fallback images are
`assets/portfolio/geomarketeer/component-kit/small-building-*-still.jpg`.

## Office family

`office.js` authors one building system and three declared configurations:

| Variant | Footprint | Storeys | Façades | Roof |
| --- | --- | --- | --- | --- |
| `base` | 3.6 × 3.2 | 4 | Street bands, paired side windows | Small enclosure |
| `wide` | 4.3 × 4.8 | 4 | Continuous bands, offset entry | Large enclosure and vent |
| `low-wing` | 2.8 × 3.1 | 3 | Continuous bands, compact entry | Open parapet roof |

Dimensions are illustrative scene units, inferred from the reference. The base
has a 1.18-unit ground floor and 1.10-unit upper floors; the wide version uses
1.24 and 1.18, preserving its slightly taller proportions. The lower wing shares
the base's floor heights. Every window bay has byte-identical .49 × .59 geometry,
assembled into rows on all four sides. A correction to that module propagates to
every row and variation. Compilation shares a completed variant's geometry and
materials across its instances.

The source shows the central office, eastern office and partly hidden rear wing.
The wing's visible front retains uninterrupted bands; its entrance is on the
obscured right side. That entrance and the other concealed faces are coherent
inferences using the same system. The source crops remain unmodified. The office checkpoint introduced no fourth office, district layout, vegetation or people.

All variants have a real recessed lobby opening, transparent entrance glazing,
double doors with handles, canopy supports meeting grade, and a shared parapet.
Upper glazing uses the filled blue treatment of the illustration. Hidden faces
are complete, making each component independent of scene placement. Return values
retain the library's `{group, bounds, anchors}` contract and local origins.

The office viewer is isolated from the approved café and tower viewers. Its
comparison uses one WebGL renderer with three scissor views and equal projection
scale. `?focus=entrance` or `?focus=facade` opens an individual detail. Selecting a
variant or mode resets framing; detail and board selections focus and reveal the
model on phones. Reference comparison is always a separate original-image crop.

Run `node art/geomarketeer/component-kit/verify-offices.mjs` for geometry,
reuse, resource ownership, approved-family fingerprints, inventory and actual
viewer event checks. Browser evidence, three fallback renders, close-ups and
phone captures are recorded under `reports/component-kit/offices/` and
`assets/portfolio/geomarketeer/component-kit/office-*-still.jpg`.

## Café family

`cafe.js` is one base builder with explicit variant records. Shared modules cover
the shell, real interior opening, framed storefront, double entry door, scalloped
awning, parapet, upper windows, tables, chairs, cups, menu board and counter.
Revision 2 adds physical frame/sill relief, pull handles and a threshold, curved
awning fabric with thickness and brackets, an espresso machine with group heads
and drip tray, a glazed pastry case, cup shelves and pendants. A shared geometric
cup emblem appears on the occupied storefronts and menu boards.

`cafe-furniture.js` owns the refined seating assembly, cups, pastry plates and
emblem. Each chair faces its table anchor; backrests, seat, legs and table remain
named authoring parts. The two chairs sit along the depth of each terrace set to
keep the entire door approach clear. Feet have physical ground contact. Every
terrace table carries two cups/saucers and one pastry plate; the corner interior
set has two cups and no pastry plate. The old drawing helpers are unchanged.

The asset interface remains unchanged. Internal `group.userData.reviewBounds`
provides serializable seating and storefront bounds for the review camera; the
seating bounds are measured from the authored assembly.

- `base`: one storey, 4.2 × 3.1 footprint, striped awning, two terrace tables.
- `upper-floor`: the identical ground shell plus one upper floor.
- `compact`: 3.0 × 2.8 footprint, upper floor, small vent and one seating set.
- `blue-awning`: the upstairs shell with solid-blue awning and no furniture or
  service fixtures. This preserves the vacant candidate unit in the story.
- `corner`: 5.1 × 4.0 footprint, corner glazing, rooftop enclosure and three
  terrace sets, plus a small interior seating set.

Source dimensions are illustrative units. Variants share definitions and
materials; repeated instances of a variant share compiled geometry by reference.
Same-footprint variants have byte-identical ground-shell geometry. The compiler
retains transparent glazing in a separate material batch rather than flattening
it into an opaque wall. People and planting are deliberately left for their own
component checkpoints. The complete model is visible at ±15°; occluded surfaces
and small fixtures are coherent interpretations of the single source image.

## Reference and interpretation

The reference is `art/geomarketeer/detailed-blue-illustration-v2/illustration.png`
(1536 × 1024), pixel-identical to the attachment in this chat. The foreground
tower supplies the master silhouette. The user's choice of five identical towers
overrides the varying heights in the source. Placement is inferred from the five
visible ground centers using a 45° yaw / 30° pitch orthographic projection.
Occluded faces and the small entrance are coherent interpretations of that
family, not a unique reconstruction from the image.

Style, camera and materials are isolated from the older studies. The existing
Drawing/material helpers are imported without modifying their original files.
No portfolio entrypoint, preserved archive, or storyboard changes. The tower and café
viewers and inventory record approvals; the tower and street viewers link to the metro entrance review.

## Review and verification

Run `node art/geomarketeer/component-kit/verify.mjs`. It checks shared master
identity, finite geometry, contact with the ground, nonintersecting placements,
compile fidelity, resource disposal, inventory parity and actual viewer event
behavior using a real Three camera with a stub DOM/renderer. It writes
`reports/component-kit/verification.json`.

Run `node art/geomarketeer/component-kit/verify-cafes.mjs` for the café family.
It checks the shared ground-shell hashes, declared variations, transparency,
compile fidelity, shared-resource ownership, absence of café scene placements,
unchanged tower fingerprint, and actual café viewer events with a stub DOM and
renderer. Revision 2 also checks actual world-space backrest vertices against
the table direction (including rotated fixtures), feet against their supporting
floor, seat/table clearance, nonoverlapping seating sets, and unobstructed
entrance approaches. It verifies detail framing and the vacant-unit exclusion. The board projection is checked at desktop and phone breakpoints.

Review captures in `reports/component-kit/cafes/` include `seating-detail.jpg`,
`storefront-detail.jpg`, `scene-scale.jpg` and the refreshed five-variation board.
All fallback stills are captures of revision 2.

Browser review covers desktop (1440 × 1000), phone layout (390 × 844), individual
variation selection, the comparison board, orbit and zoom controls, reset, touch
opt-in, and the rendered-still fallback. `?view=still&variant=blue-awning` forces a
variant-specific fallback; Try 3D again returns to the interactive page. Saved
stills are browser captures of each version, used only when 3D is unavailable.

Reduced motion, pointer cancellation, hidden-page pause and shared-resource
cleanup are checked in the executable viewer fixture. Physical-device touch and
low-end GPU performance have not been measured. Metro entrance fidelity remains subject to the user's review; technical
checks do not constitute artistic approval.

Tower evidence is in `reports/component-kit/`; café evidence is in its `cafes/`
subdirectory. The single tower takes five draw
calls including its ground pad; the five-copy preview takes twenty-five. Authored
surface geometry is 6,686 triangles per tower; browser totals also include the
screen-space line triangles. The renderer is idle when controls are at rest.
