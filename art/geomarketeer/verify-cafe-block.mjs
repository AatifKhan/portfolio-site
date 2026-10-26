import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { FontLoader } from '../../assets/vendor/three/addons/loaders/FontLoader.js';
import * as THREE from '../../assets/vendor/three/three.module.js';
import { createCafeBlock, trafficPose } from '../../scripts/geomarketeer-block-model.js';

const font = new FontLoader().parse(JSON.parse(await readFile(new URL('../../assets/vendor/three/fonts/droid_sans_regular.typeface.json', import.meta.url), 'utf8')));
assert(font.data.glyphs['É'], 'The café sign must have its actual accented glyph.');
const block = createCafeBlock({ font });
const names = new Set();
let surfaces = 0, strokes = 0, triangles = 0, textures = 0, removedDuplicateStrokes = 0;
block.scene.traverse(object => {
    removedDuplicateStrokes += object.userData.removedDuplicateStrokes || 0;
    const edges = new Set();
    for (const line of object.children.filter(child => child.isLineSegments2)) {
        const start = line.geometry.getAttribute('instanceStart');
        const end = line.geometry.getAttribute('instanceEnd');
        for (let i = 0; i < start.count; i++) {
            const point = attribute => [attribute.getX(i),attribute.getY(i),attribute.getZ(i)].map(value=>Math.round(value*10000)).join(',');
            const a = point(start), b = point(end), key = a < b ? `${a}:${b}` : `${b}:${a}`;
            assert(!edges.has(key), `${object.name}: coincident stroke is drawn more than once.`);
            edges.add(key);
        }
    }
    if (object.name) { assert(!names.has(object.name), `Duplicate scene-object name: ${object.name}`); names.add(object.name); }
    if (object.isLineSegments2) strokes++;
    else if (object.isMesh && object.layers.mask === 1) surfaces++;
    const geometry = object.geometry;
    if (geometry) {
        for (const [name, attribute] of Object.entries(geometry.attributes)) {
            for (let i = 0; i < attribute.count; i++) {
                assert(Number.isFinite(attribute.getX(i)), `${object.name}/${name}: invalid x`);
                if (attribute.itemSize > 1) assert(Number.isFinite(attribute.getY(i)), `${object.name}/${name}: invalid y`);
                if (attribute.itemSize > 2) assert(Number.isFinite(attribute.getZ(i)), `${object.name}/${name}: invalid z`);
            }
        }
        if (object.isMesh && !object.isLineSegments2 && object.layers.mask === 1) triangles += (geometry.index?.count || geometry.getAttribute('position')?.count || 0) / 3;
    }
    for (const material of [object.material].flat().filter(Boolean)) {
        for (const value of Object.values(material)) if (value?.isTexture) textures++;
    }
});
assert.equal(textures, 0, 'The scene must not use a raster illustration or image textures.');
assert(triangles < 100_000, 'Authored surface geometry exceeds the first-block budget.');
assert(surfaces + strokes < 160, 'The initial scene should remain within the planned batch count.');
const profile = block.materials.line('profile','cafe');
block.materials.resize(1440,760,28,1);
const distantProfile = profile.opacity;
assert(distantProfile < 0.01, 'Inner profiles must disappear before they merge in the overview.');
block.materials.resize(390,380,28,2);
assert.equal(profile.opacity, distantProfile, 'The same projected scale should have the same detail on a smaller screen.');
block.materials.resize(1440,760,28,2);
const midwayProfile = profile.opacity;
block.materials.resize(1440,760,28,2.6);
assert(midwayProfile > distantProfile && midwayProfile < profile.opacity, 'Inner edges should return progressively as spacing increases.');
assert(profile.opacity > 0.99, 'Separated trim should remain available in close views.');
for (const name of ['cafe/upper-storey','cafe/roof-and-services','cafe/interior','cafe/terrace','cafe/awnings','cafe/entrance-door','offices/architecture','garden/furniture-and-planting']) {
    assert(names.has(name), `Missing independently authored component: ${name}`);
}
assert.equal(block.actors.length, 3);
assert.equal(block.walkers.length, 4);
for (const pick of block.picks) assert.equal(pick.layers.mask, 2, 'Picking hulls must not render in the camera layer.');
block.scene.updateMatrixWorld(true);
const camera = new THREE.OrthographicCamera(-22,22,16,-16,0.1,200);
camera.position.set(34,30,34);camera.lookAt(0,2,0);camera.updateMatrixWorld();camera.updateProjectionMatrix();
const raycaster = new THREE.Raycaster();raycaster.layers.set(1);
for (const [id,point] of Object.entries(block.anchors)) {
    const projected = point.clone().project(camera);
    raycaster.setFromCamera(new THREE.Vector2(projected.x,projected.y),camera);
    assert.equal(raycaster.intersectObjects(block.picks,false)[0]?.object.userData.place,id, `The visible ${id} anchor must be pickable as that object.`);
}

block.setInterior(true);
assert.equal(block.scene.getObjectByName('cafe/upper-storey').visible, false);
assert.equal(block.scene.getObjectByName('cafe/roof-and-services').visible, false);
assert.equal(block.scene.getObjectByName('cafe/interior').visible, true);
assert.equal(block.scene.getObjectByName('offices/architecture').visible, true);
block.setInterior(false);
assert.equal(block.scene.getObjectByName('cafe/upper-storey').visible, true);

for (const lane of [0,1]) {
    let previous = trafficPose(0, lane);
    for (let distance = 0.125; distance <= 240; distance += 0.125) {
        const pose = trafficPose(distance, lane);
        assert(Math.hypot(pose.x-previous.x, pose.z-previous.z) <= 0.125001, 'A vehicle teleports at a road corner or route wrap.');
        assert(!(pose.x > -9.95 && pose.x < 7.95 && pose.z > -7.9 && pose.z < 7.6), 'Vehicle route enters the pavement.');
        assert(Number.isFinite(pose.heading));
        previous = pose;
    }
}
block.update(14);
const paused = block.actors.map(actor => actor.group.position.toArray());
block.update(30,false);
assert.deepEqual(block.actors.map(actor => actor.group.position.toArray()), paused, 'Pausing traffic resets vehicle positions.');

const inventory = { surfaces, strokes, surfaceTriangles: triangles, textureCount: textures, removedDuplicateStrokes, vehicles: block.actors.length, walkers: block.walkers.length, componentNames: [...names], checks: ['finite geometry','unique component names','no coincident strokes within a drawing','screen-size-aware progressive edge detail','no image textures','picking isolation','ray picking targets the right object','interior isolation','traffic continuity','traffic pavement clearance','pause preserves positions'], result: 'passed' };
const directory = new URL('../../reports/cafe-block/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('geometry-verification.json', directory), JSON.stringify(inventory,null,2)+'\n');
block.dispose();
console.log(JSON.stringify({ surfaces, strokes, surfaceTriangles: triangles, textures, result: 'passed' }));
