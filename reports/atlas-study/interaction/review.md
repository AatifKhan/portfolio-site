# SVG zoom, tilt, and pan — 2026-10-25

The user's follow-up requested direct interaction with the SVG, including a small amount of zoom and rotation.

Added controls to both views:

- Zoom from 80% to 120%, in 10-percentage-point button steps.
- Flat drawing tilt from −15° to +15°, in 5° steps.
- Drag to pan when zoomed above 100%; arrow keys also move the zoomed view.
- Reset the current view to 100%, 0°, and centered positioning.
- Separate remembered settings for atlas and café. The miniature overview and HTML controls stay stationary.

The transformations act on SVG groups. Tilt rotates the existing drawing in its plane; it is not a 3D orbit and reveals no additional façades. SVG geometry, clipping, and non-scaling strokes remain intact. Native 300ms transitions continue from their current values during rapid adjustments, and reduced motion removes the easing. Grabbing an easing drawing starts from its displayed matrix. Drag release suppresses accidental café activation. Zooming back to 100% or below recenters the view and restores native touch scrolling.

## Verification

- Native browser checks exercised 120% zoom, ± tilt controls through the +15° bound, the 80% zoom bound, keyboard + / ] / 0, and Reset.
- Dragging the atlas from the café hit region changed pan coordinates without opening the café, released pointer capture, and produced no errors.
- Opening the café after the atlas was transformed showed its independent default 100% / 0° state.
- Phone-sized controls wrap within the page. At 390 × 844, the toolbar fit between approximately y593 and y688, with no horizontal overflow. Zooming enabled map dragging; Reset restored `pan-y pinch-zoom` touch behavior.
- Desktop layout at 1440 × 1000 fits the controls and page within the viewport. `desktop-cafe.jpg` shows 110% zoom / +5° tilt. `mobile-cafe.jpg` records the corresponding phone-sized state.
- Existing fixture checks were extended with zoom/tilt limits, per-view camera settings, keyboard pan/reset, and recentering when zooming out. Reduced-motion fixtures still pass. The matching CSS disables camera easing under the OS media preference; the OS setting itself was not changed in browser validation.
- JavaScript syntax and whitespace checks passed. No new dependencies or raster art were added.

Physical touch dragging and modifier-wheel zoom were not manually exercised; the tested controls provide the same zoom/pan capabilities without those gestures.

final result: passed
