import * as THREE from '../../assets/vendor/three/three.module.js';
import { Drawing, PALETTE, createIllustrationMaterials } from '../geomarketeer-block-model.js';

export const STYLE = Object.freeze({
    ...PALETTE, ink: '#183fff', detail: '#345dff', hair: '#6f96ef', profile: '#7a9cee',
    paper: '#ffffff', wall: '#e2eaff', shade: '#b8cdff', glass: '#b4ccff',
    accent: '#2854ff', road: '#d6e3ff', shadow: '#d5e2ff',
});
export const CAMERA = Object.freeze({yaw: Math.PI / 4, pitch: Math.PI / 6, orbitLimit:15, minZoom:1, maxZoom:3});

// Reuse the existing renderer, but keep this study's paint and stroke settings isolated.
export function createKitMaterials() {
    const materials = createIllustrationMaterials(STYLE);
    const originalLine = materials.line.bind(materials);
    const lines = new Map();
    materials.line = (weight, place) => {
        const material = originalLine(weight, place);
        lines.set(material, weight);
        return material;
    };
    materials.resize = (width, height, span, zoom = 1) => {
        const pixelsPerUnit = height / span * zoom;
        const close = THREE.MathUtils.smoothstep(pixelsPerUnit, 18, 65);
        for (const [material, weight] of lines) {
            material.resolution.set(width, height);
            material.linewidth = ({ink:1.4, detail:.85, hair:.48, profile:.6}[weight] || .7) * (.85 + close * .55);
            material.opacity = weight === 'hair' ? .35 + close * .6 : 1;
        }
    };
    return materials;
}

// Directional fills retain the illustrated surface hierarchy without a lighting rig.
export class KitDrawing extends Drawing {
    geometry(geometry, transform, tint = 'paper', edges = 'detail', threshold = 30) {
        const start = this.vertices.length;
        super.geometry(geometry, transform, tint, edges, threshold);
        if (tint !== 'paper') return this;
        const colour = new THREE.Color();
        for (let i = start; i < this.vertices.length; i += 3) {
            const nx = this.normals[i], ny = this.normals[i + 1];
            const rise = THREE.MathUtils.clamp(this.vertices[i + 1] / 8, 0, 1);
            if (ny > .5) colour.set('#ffffff');
            else if (ny < -.5) colour.set('#b9ceff');
            else if (Math.abs(nx) > .5) colour.set('#e8efff').lerp(new THREE.Color('#fafcff'), rise * .6);
            else colour.set('#c5d7ff').lerp(new THREE.Color('#e1eaff'), rise * .6);
            this.colors[i] = colour.r; this.colors[i + 1] = colour.g; this.colors[i + 2] = colour.b;
        }
        return this;
    }
}
