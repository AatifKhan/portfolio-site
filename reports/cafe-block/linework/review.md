# Outline refinement — 2026-10-25

The user's concern was multiple nearby contours merging into heavy lines at overview scale.

The model now gives café/office roofs and the café floor band a primary contour. Secondary roof profiles and sills use a separate light stroke, fading continuously according to projected spacing. The fade depends on viewport height, camera span, and zoom, so small screens do not reveal dense detail simply because their zoom percentage is high. There is no hard level-of-detail switch.

The café upper architecture no longer has both generated surface silhouettes and authored edge strokes. Lounge furniture retains its own silhouette mesh. Window piers and ground-floor posts use intentional lines, and duplicate/reversed coincident strokes are removed within each drawing before batching.

Overview primary strokes are approximately 1 CSS pixel, increasing to 1.25px for close views. Secondary detail is lighter, with reduced hairline opacity at a distance. The antialiased cap shader applies opacity consistently, preventing isolated cap dots when a profile fades out.

Evidence:

- `overview-comparison.png`: before and after at the same 1440 × 1000 fullscreen overview, view 45°, labels off and street life paused. Both image crops x200/y100/w1040/h720 are resized equally to 624 × 432, without color changes.
- `detail-comparison.png`: corresponding café selections at 225% zoom, crop x400/y100/w700/h730, resized equally to 560 × 584.
- `rotations-review.png`: 135°, 225°, and 315° views, inspected for missing contours and doubled seams.
- `interior-after.jpg`: cutaway at 260% zoom.
- `mobile-overview.jpg` and `mobile-detail.jpg`: 390 × 844 phone-sized views, including the selected café.

All comparison sheets and the cutaway were opened and inspected; the selected mobile view was also inspected directly in the browser. Browser captures remain JPEG, so exact blue-edge color measurements are not implied.

The model verification passed, including no coincident strokes within a drawing, gradual profile visibility, equal detail at equal projected sizes across viewport sizes, finite geometry, picking, cutaway isolation, traffic continuity, and pause behavior. It reports 87 surface meshes, 72 stroke batches, 93,708 surface triangles including silhouettes, and 41 removed duplicate strokes. Browser rotation, close selection, cutaway, and phone-sized checks captured no JavaScript errors. JavaScript syntax and whitespace checks passed.

The live preview was left open with the new outlines. Physical-device testing remains outside this desktop validation.

final result: passed
