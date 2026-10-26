# GeoMarketeer opening — validation

2026-10-25. Verified in the macOS in-app browser against the local project server.

## Browser checks

- Both `index.html?project=geomarketeer` and `minimal_portfolio.html?project=geomarketeer` open the new raster introduction directly.
- Target CSS viewports: 1440 × 1000, 390 × 844 and 320px width. The article and opening share the same width; no horizontal overflow was observed. Captured PNG dimensions exclude browser chrome/scrollbars and can differ from the requested CSS viewport dimensions.
- All five states render from one unchanged master image. The metro is excluded from the first two camera views and appears in the third.
- Navigation positions stay constant relative to the component across all five states. Touch targets are at least 44px high. Phone presentation is stacked.
- Rapid Next/Back reversals settle on the latest requested state with one visible article. Resizing preserves the active state and recalculates the camera.
- Keyboard Enter activates the final button, selects Full Story and focuses the research heading. Quick Scan immediately followed by the final action no longer allows stale tab callbacks to hide the research.
- A real missing-image fixture (`image-failure.html`) produces an accessible status and retry button while the story text remains usable. Retry loads the real artwork and preserves the requested beat. The live master file was never moved or changed during this test.
- The script-free frame review has five loaded images and all five story texts, with zero scripts. Both portfolio pages expose a global noscript link to this fallback outside their hidden SPA pages.
- The portfolio case-study section has no canvas or 3D viewer script. The main entrypoint retains unrelated pre-existing homepage 2D canvases.
- The preserved standalone café-block page boots its existing 3D canvas successfully; loading completes and its error panel remains hidden.

## Automated checks

- `verify-story-opening.mjs`: five states, 25 responsive camera cases, candidate visible in every state, metro reveal timing, full-map framing, registered annotations, five PNG exports, and unchanged source SHA-256.
- `verify-story-controller.mjs`: routing, rapid reversal, responsive/hidden-to-visible geometry, reduced-motion zero-duration camera and no copy animation, failed loading/retry, stale decode protection, fifth-action focus and late-font completion.
- Case-tab transition race exercised with stale request callbacks; inline scripts parse and HTML IDs are unique.
- `git diff --check` passes.

The controller's reduced-motion input was tested in a small simulated environment and the CSS media rule was inspected. OS-level reduced-motion emulation was unavailable through the browser tools, so it was not visually toggled in this browser session. The controller test is not a visual browser test. No new controller exceptions were observed; the missing-image fixture produces an expected 404, and the minimal entrypoint retains its existing Tailwind CDN warning.

## Screenshots

- [Opening, desktop crop](opening-desktop.png).
- Desktop states: [1](minimal-desktop-beat-01.png), [2](minimal-desktop-beat-02.png), [3](minimal-desktop-beat-03.png), [4](minimal-desktop-beat-04.png), [5](minimal-desktop-beat-05.png).
- [Main entrypoint, desktop](index-desktop-1440.png).
- Main entrypoint on phone: [1](index-mobile-beat-01.png), [3](index-mobile-beat-03.png), [5](index-mobile-beat-05.png).
- Minimal entrypoint on phone: [1](minimal-mobile-beat-01.png), [3](minimal-mobile-beat-03.png).
- [Preserved 3D study](preserved-3d.png).

The source remains 1536 × 1024. Close views show some source softness on dense screens; no upscaled output is claimed to add illustration detail.
