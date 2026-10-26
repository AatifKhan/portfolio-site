# Neighborhood story — checkpoint 13

Status: **awaiting story review**. Portfolio integration is a later phase.

- [Interactive story](http://127.0.0.1:4174/geomarketeer-kit-neighborhood.html?mode=story)
- [Existing exploration viewer](http://127.0.0.1:4174/geomarketeer-kit-neighborhood.html)
- [Script-free five-frame reader](http://127.0.0.1:4174/art/geomarketeer/component-kit/story/index.html)
- [Saved-view story](http://127.0.0.1:4174/geomarketeer-kit-neighborhood.html?mode=story&view=still)

The story uses the original titles and body copy from
`scripts/geomarketeer-story-data.js`. The candidate remains the vacant
`cafe-lane-03` blue-awning unit. No components, placements, people or vehicles
were changed for this checkpoint.

## Shots and controls

| Beat | Camera and emphasis |
| --- | --- |
| The idea | Café lane close-up, −6°; wider landmarks stay outside the frame. |
| The assumption | Closer view, −3°; candidate frontage outline and label. |
| The doubt | Pull back and right, +6°; first metro reveal, crossing and parking connection labeled illustrative. |
| The context | Full neighborhood, 0°; People, Spending and Competition remain questions in the original copy. |
| The response | Same full-neighborhood camera; quieter categories and candidate emphasis. |

All shots use a 30° orthographic pitch. Framing derives from actual component
surfaces and bounds. The column is 560px wide, with a fixed 16:9 scene and normal
page scrolling on phones. Camera transitions last 850ms; copy and emphasis fade
over 220ms. Reduced motion selects the destination directly.

Next/Back advance the story. Skip and the final action open the exploration
overview. Story resumes the last beat, while Replay returns to the opening.
Manual scene controls are locked during Story and restored in Explore. Both
modes share one scene, model and renderer. The opening camera is applied before
the first render. Nothing renders continuously while idle or hidden.

## Editable implementation

- `scripts/geomarketeer-kit/neighborhood-story-shots.js`: beat IDs, targets,
  camera offsets, independent annotations and image paths.
- `neighborhood-stage.js`: shared scene/render/camera lifecycle.
- `neighborhood-controller.js`: story/exploration navigation, transitions,
  input, visibility and WebGL recovery.
- `neighborhood-viewer.js`: standalone entrypoint.
- `geomarketeer-kit-neighborhood.html` and
  `styles/geomarketeer-kit-neighborhood.css`: shared viewer interface.
- `exports.json`: five camera definitions, unchanged story copy and image paths.
- `index.html`: generated script-free reader.

Annotations use separate SVG/HTML layers anchored to world positions, so no
shared component material is modified. The visible frontage sides of the
candidate footprint are outlined; concealed edges do not draw through its shell.

WebGL initialization failure or context loss switches to the active beat's
saved image, retaining copy and navigation. Try 3D again reconstructs the stage
at that beat. `view=still` makes this behavior directly reviewable.

## Captures and validation

The five images in
`assets/portfolio/geomarketeer/component-kit/story-*-still.jpg` are actual
560×315 renders of the final shots, including their annotations. They are review
captures, not user-approved captures. `reports/component-kit/story/` contains:

- `desktop-*.jpg`, `phone390-*.jpg`, `phone320-*.jpg`: all five beats.
- `frame-*.jpg`: scene-only captures.
- `transition-1-2.jpg` through `transition-4-5.jpg`: transition review; the last
  deliberately holds its camera.
- `context-loss-doubt.jpg`, `context-loss-recovery.jpg`: fallback and recovery.
- `five-frame-reader.jpg`: script-free reading page.
- `verification.json`, `browser-verification.json`: automated and browser results.
- `preserved-before.json`: hashes for the portfolio, raster story and approved
  geometry/placement sources.

Browser checks pass at the desktop column width and at 390px/320px. Navigation,
keyboard operation, rapid reversal, mode resume, Skip, Replay, restored exploration
controls, actual WebGL context loss, deliberately failed startup, saved-shot
navigation and recovery all pass. No browser warnings/errors were observed.
The phone DOM checks show no horizontal overflow and stable navigation placement.

Production-controller fixtures additionally verify reduced-motion preference
changes, hidden-page pausing, BFCache lifecycle, disposal and absence of idle
rendering. Reduced motion was tested through the controller's media-query input;
the operating system preference was not changed. Geometry verification confirms
all 51 approved fingerprints and the unchanged 326-instance placement manifest.

Run from the project root:

```sh
node art/geomarketeer/component-kit/export-neighborhood-story.mjs
node art/geomarketeer/component-kit/verify-neighborhood-story.mjs
node art/geomarketeer/component-kit/verify-neighborhood-viewer.mjs
node art/geomarketeer/component-kit/verify-neighborhood.mjs
```

The exporter regenerates camera/copy metadata, the reader and the browser test
fixture. Recapture the five actual browser shots after any visual or camera change;
the exporter does not fabricate rendered images. `browser-fixture.html` is a
separate test surface with a context-loss button and an optional `initFailure=1`
parameter; these fault controls are absent from the production page.
