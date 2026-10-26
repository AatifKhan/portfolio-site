# Review 1 — implementation evidence

Status: first artwork checkpoint; user visual approval pending. The full neighbourhood and eight-beat story have not been implemented in this milestone.

## What is reviewable

- A real Blender-authored sector with the synagogue, café frontage, residences, commercial context, trees, pedestrians and vehicles.
- Orthographic browser viewer, ±14° total-limit controls, 100–125% zoom, reset, four place views and pauseable opposing traffic.
- Desktop two-column composition and stacked phone layout; touch exploration is explicitly enabled.
- Editable source, packed baked Blender scene, local runtime, Meshopt-compressed desktop/mobile GLBs, KTX2 textures, and matching still images.

## Checks performed

- Export verification: named anchors retained, 14 vehicle objects, Meshopt and KTX2 extensions present, asset/triangle/draw-call ceilings satisfied. See `asset-verification.json` for exact values.
- Browser: 1440 × 1000 desktop and 390 × 844 phone-sized viewport in the Codex in-app browser on this Mac. The phone viewport is emulation, not a physical phone.
- Desktop sample: median 16.7 ms and p95 17.4 ms frame interval over 300 frames with 60 fps scheduling cap. Phone-sized sample: median 33.3 ms and p95 34.1 ms with 30 fps cap. These are visible-frame intervals, not isolated GPU timings or a promise across devices.
- Keyboard repeated rotation commands clamp at −14°; right preset settles at +14°. Repeated plus commands clamp at 125%, disabling the zoom-in button. Switching place resets framing and zoom.
- Synagogue and café views update captions and world-anchored labels. Pause toggles to Play traffic. Normal wheel scrolling moves the page.
- Phone Explore/Exit toggles correctly; no horizontal page overflow was detected (375 px content width inside the 390 px viewport with scrollbar).
- The explicit still-view route retains the four place controls, switches the café image to `cafe.webp`, and disables 3D-only controls. Actual OS reduced-motion preference switching and forced WebGL context loss were not simulated.
- No browser console warnings/errors in the checked live and still states. JavaScript syntax checks and `git diff --check` passed. Dependency install reported zero advisories after updating Sharp.

## Visual iteration history

1. First bake made broad walls too dark. Replaced coarse architecture vertex-light baking with a texture atlas.
2. Export was dropping vehicle colours. Corrected the unlit node setup and explicit active-colour export.
3. Roof faces were reversed; road intersections overlapped at identical heights. Corrected face winding and separated surface elevations.
4. Added finer clustered foliage, pitched-roof houses, balcony planters and drainpipes; adjusted the hero viewing direction.
5. Baked colours looked subdued in the browser. Removed the additional tone-mapping pass and matched the still-render transform.
6. Rotated the synagogue's long elevation toward the hero view to better match the selected illustration.

## Limits of this checkpoint

The selected reference is a much larger, denser neighbourhood. The current sector has fewer structures and uses a small building kit. It does not establish final whole-image fidelity, verified geography, or final story effectiveness. Those remain explicit review/production work, rather than implied acceptance from passing technical checks.

The next action is visual review of the architecture, lighting, vegetation and camera. Expand the city only after that review is resolved.
