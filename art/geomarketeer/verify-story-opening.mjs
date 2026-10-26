import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SOURCE, STORY, cameraTransform, cameraCSS, overlayMarkup } from '../../scripts/geomarketeer-story-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const master = await fs.readFile(path.join(root, SOURCE.src));
const original = await fs.readFile(path.join(root, 'art/geomarketeer/detailed-blue-illustration-v2/illustration.png'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(master), hash(original), 'The approved reduced-tree source must remain byte-for-byte unchanged.');
assert.equal(STORY.length, 5);
assert.deepEqual(STORY.map(step => step.id), ['idea', 'assumption', 'doubt', 'context', 'response']);
assert.deepEqual(STORY[3].camera, STORY[4].camera, 'The final response must retain the full-context camera.');
assert.equal(overlayMarkup(0), '', 'Do not introduce context annotations in the opening.');
assert.match(overlayMarkup(1), /<rect/);
assert.match(overlayMarkup(2), /<path/);
for (const word of ['People', 'Spending', 'Competition']) assert.ok(overlayMarkup(3).includes(word));
assert.ok(overlayMarkup(4).includes('opacity=".42"'), 'The final context annotations should be quieter.');

const project = (point, transform) => ({ x: transform.x + point.x * transform.scale, y: transform.y + point.y * transform.scale });
const inside = (point, width, height) => point.x >= 0 && point.y >= 0 && point.x <= width && point.y <= height;
const candidate = [{ x: 416, y: 744 }, { x: 582, y: 942 }];
const metro = [{ x: 1155, y: 482 }, { x: 1450, y: 694 }];
const map = [{ x: 0, y: 0 }, { x: SOURCE.width, y: SOURCE.height }];
let framingChecks = 0;
for (const width of [272, 320, 342, 560, 1120]) {
    const height = width * 9 / 16;
    for (const [index, step] of STORY.entries()) {
        const transform = cameraTransform(step.camera, width, height);
        for (const value of Object.values(transform)) assert.ok(Number.isFinite(value));
        assert.ok(transform.scale > 0);
        assert.ok(!cameraCSS(step.camera, width, height).includes('NaN'));
        for (const point of candidate) assert.ok(inside(project(point, transform), width, height), `Candidate must remain in frame: step ${index + 1}, width ${width}`);
        if (index < 2) {
            assert.ok(metro.every(point => !inside(project(point, transform), width, height)), `Metro must remain outside opening crops: step ${index + 1}`);
            const metroLeft = project(metro[0], transform).x;
            assert.ok(metroLeft > width, 'The metro is excluded horizontally, not merely partially clipped.');
        }
        if (index === 2) for (const point of metro) assert.ok(inside(project(point, transform), width, height), 'The first reveal includes the metro.');
        if (index > 2) for (const point of map) assert.ok(inside(project(point, transform), width, height), 'The full neighborhood must fit in context and response.');
        framingChecks++;
    }
}
const metadata = await sharp(master).metadata();
assert.equal(metadata.width, SOURCE.width);
assert.equal(metadata.height, SOURCE.height);
for (let index = 0; index < STORY.length; index++) {
    const filename = path.join(root, 'assets/portfolio/geomarketeer/story-opening', `frame-${String(index + 1).padStart(2, '0')}.png`);
    const frame = await sharp(filename).metadata();
    assert.equal(frame.width, 1120);
    assert.equal(frame.height, 630);
}
console.log(`Story opening checks passed: 5 beats, ${framingChecks} responsive camera cases, registered annotations, five 1120×630 exports, unchanged approved master.`);
