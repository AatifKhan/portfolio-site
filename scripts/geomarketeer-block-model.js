import * as THREE from '../assets/vendor/three/three.module.js';
import { LineMaterial } from '../assets/vendor/three/addons/lines/LineMaterial.js';
import { LineSegments2 } from '../assets/vendor/three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from '../assets/vendor/three/addons/lines/LineSegmentsGeometry.js';

export const PALETTE = {
    ink: '#2c56ed', detail: '#4b73e7', hair: '#8aa5ec', profile: '#7794e8', paper: '#ffffff',
    wall: '#edf1ff', shade: '#e1e8ff', glass: '#dce7ff', road: '#e9edff',
    curb: '#d3ddfa', leaf: '#eaf0ff', metal: '#a7b9ed', accent: '#466bd9',
};

const color = (value, palette = PALETTE) => new THREE.Color(palette[value] || value);
const matrix = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1),
);
const position = new THREE.Vector3();
const normal = new THREE.Vector3();
const normalMatrix = new THREE.Matrix3();

// Authored surfaces and intentional edges are batched independently. No raster
// textures or traced image planes participate in the illustration.
class Drawing {
    constructor(name, materials, place = null) {
        this.name = name;
        this.materials = materials;
        this.place = place;
        this.vertices = [];
        this.colors = [];
        this.normals = [];
        this.strokes = { ink: [], detail: [], hair: [], profile: [] };
    }

    geometry(geometry, transform, tint = 'paper', edges = 'detail', threshold = 30) {
        const source = geometry.index ? geometry.toNonIndexed() : geometry;
        const vertices = source.getAttribute('position');
        const normals = source.getAttribute('normal');
        const base = color(tint, this.materials.palette || PALETTE);
        normalMatrix.getNormalMatrix(transform);
        for (let i = 0; i < vertices.count; i++) {
            position.fromBufferAttribute(vertices, i).applyMatrix4(transform);
            this.vertices.push(position.x, position.y, position.z);
            if (normals) normal.fromBufferAttribute(normals, i).applyMatrix3(normalMatrix).normalize();
            else normal.set(0,1,0);
            this.normals.push(normal.x, normal.y, normal.z);
            let shade = 1, green = 1;
            if (tint === 'paper' && normals) {
                const tones = this.materials.paperShading || { x:[.79,.86], z:[.91,.95] };
                shade = normal.y > 0.5 ? 1 : normal.x > 0.5 ? tones.x[0] : tones.z[0];
                green = normal.y > 0.5 ? 1 : normal.x > 0.5 ? tones.x[1] : tones.z[1];
            }
            this.colors.push(base.r * shade, base.g * green, base.b);
        }
        if (edges) {
            const edgeGeometry = new THREE.EdgesGeometry(geometry, threshold);
            const points = edgeGeometry.getAttribute('position');
            for (let i = 0; i < points.count; i++) {
                position.fromBufferAttribute(points, i).applyMatrix4(transform);
                this.strokes[edges].push(position.x, position.y, position.z);
            }
            edgeGeometry.dispose();
        }
        if (source !== geometry) source.dispose();
        geometry.dispose();
        return this;
    }

    box(x, y, z, w, h, d, tint = 'paper', edge = 'detail', rotation = 0) {
        return this.geometry(new THREE.BoxGeometry(w, h, d), matrix(x, y, z, 0, rotation), tint, edge);
    }

    cylinder(x, y, z, r, h, tint = 'paper', edge = 'detail', rotation = 0) {
        return this.geometry(new THREE.CylinderGeometry(r, r, h, 32), matrix(x, y, z, rotation), tint, edge, 35);
    }

    path(points, weight = 'detail', closed = false) {
        for (let i = 0; i < points.length - 1; i++) this.strokes[weight].push(...points[i], ...points[i + 1]);
        if (closed && points.length > 2) this.strokes[weight].push(...points.at(-1), ...points[0]);
        return this;
    }

    ring(x, y, z, r, weight = 'detail', segments = 36) {
        return this.path(Array.from({ length: segments }, (_, i) => [x + Math.cos(i / segments * Math.PI * 2) * r, y, z + Math.sin(i / segments * Math.PI * 2) * r]), weight, true);
    }

    quad(points, tint = 'paper', edge = 'detail') {
        const n=new THREE.Vector3().crossVectors(new THREE.Vector3(...points[1]).sub(new THREE.Vector3(...points[0])),new THREE.Vector3(...points[2]).sub(new THREE.Vector3(...points[0]))).normalize();
        for (const index of [0, 1, 2, 0, 2, 3]) {
            this.vertices.push(...points[index]);
            this.normals.push(n.x,n.y,n.z);
            const c = color(tint, this.materials.palette || PALETTE);
            this.colors.push(c.r, c.g, c.b);
        }
        if (edge) this.path(points, edge, true);
        return this;
    }

    rounded(x, y, z, w, h, d, radius = 0.15, tint = 'paper', edge = 'detail') {
        const shape = roundedRect(w, d, radius);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 5 });
        return this.geometry(geometry, matrix(x, y - h / 2, z, -Math.PI / 2), tint, edge, 35);
    }

    finish() {
        const group = new THREE.Group();
        group.name = this.name;
        group.userData.place = this.place;
        if (this.vertices.length) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.vertices, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
            geometry.computeBoundingSphere();
            const mesh = new THREE.Mesh(geometry, this.materials.faces);
            mesh.name = `${this.name}/surfaces`;
            group.add(mesh);
        }
        const seen = new Set();
        let removed = 0;
        for (const [weight, points] of Object.entries(this.strokes)) {
            const unique = [];
            for (let i = 0; i < points.length; i += 6) {
                const a = points.slice(i, i + 3).map(value => Math.round(value * 10000)).join(',');
                const b = points.slice(i + 3, i + 6).map(value => Math.round(value * 10000)).join(',');
                const key = a < b ? `${a}:${b}` : `${b}:${a}`;
                if (a === b || seen.has(key)) { removed++; continue; }
                seen.add(key);
                unique.push(...points.slice(i, i + 6));
            }
            if (!unique.length) continue;
            const geometry = new LineSegmentsGeometry().setPositions(unique);
            const material = this.materials.line(weight, this.place);
            const lines = new LineSegments2(geometry, material);
            lines.name = `${this.name}/${weight}`;
            lines.computeLineDistances();
            lines.renderOrder = 2;
            group.add(lines);
        }
        group.userData.removedDuplicateStrokes = removed;
        return group;
    }
}

function roundedRect(w, d, radius) {
    const x = -w / 2, z = -d / 2, r = Math.min(radius, w / 2, d / 2);
    const shape = new THREE.Shape();
    shape.moveTo(x + r, z);
    shape.lineTo(x + w - r, z);
    shape.quadraticCurveTo(x + w, z, x + w, z + r);
    shape.lineTo(x + w, z + d - r);
    shape.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
    shape.lineTo(x + r, z + d);
    shape.quadraticCurveTo(x, z + d, x, z + d - r);
    shape.lineTo(x, z + r);
    shape.quadraticCurveTo(x, z, x + r, z);
    return shape;
}

function materials(palette = PALETTE) {
    const faces = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const lines = new Map();
    const widths = { ink: 1.15, detail: 0.85, hair: 0.5, profile: 0.65 };
    const smooth = THREE.MathUtils.smoothstep;
    const organicFill = new THREE.MeshBasicMaterial({ vertexColors: true });
    const silhouette = new THREE.ShaderMaterial({
        uniforms: { width: { value: 0.022 }, ink: { value: color('ink', palette) } },
        vertexShader: 'uniform float width; void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*width,1.0); }',
        fragmentShader: 'uniform vec3 ink; void main(){ gl_FragColor=vec4(ink,1.0); #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }'.replace('; #include', ';\n #include'),
        side: THREE.BackSide, depthWrite: false,
    });
    return {
        faces, organicFill, silhouette, palette,
        line(weight, place) {
            const key = `${weight}:${place || ''}`;
            if (!lines.has(key)) {
                const material = new LineMaterial({ color: palette[weight], linewidth: widths[weight], alphaToCoverage: true, depthWrite: false });
                // Apply fade to the caps as well as the body of each AA stroke.
                material.onBeforeCompile = shader => {
                    shader.fragmentShader = shader.fragmentShader
                        .replace('float alpha = opacity;', 'float alpha = 1.0;')
                        .replace('vec4 diffuseColor = vec4( diffuse, alpha );', 'alpha *= opacity;\n vec4 diffuseColor = vec4( diffuse, alpha );');
                };
                material.customProgramCacheKey = () => 'geomarketeer-stroke-fade-v1';
                lines.set(key, { weight, place, material });
            }
            return lines.get(key).material;
        },
        resize(w, h, span, zoom) {
            // Detail depends on actual projected size, including small screens.
            const pixelsPerUnit = h / span * zoom;
            const close = smooth(pixelsPerUnit, 14, 48);
            const profileVisibility = smooth(pixelsPerUnit * 0.14 / Math.sqrt(3), 2.5, 4.5);
            for (const item of lines.values()) {
                item.material.resolution.set(w, h);
                item.material.linewidth = item.weight === 'ink' ? 1.0 + close * 0.25
                    : item.weight === 'detail' ? 0.65 + close * 0.3
                    : item.weight === 'hair' ? 0.35 + close * 0.2 : 0.7;
                item.material.opacity = item.weight === 'profile' ? profileVisibility
                    : item.weight === 'hair' ? 0.25 + close * 0.65 : 1;
                item.material.visible = item.material.opacity > 0.002;
            }
            silhouette.uniforms.width.value = span / h / zoom * (0.65 + close * 0.2);
        },
        highlight(id) {
            for (const item of lines.values()) item.material.color.set(item.place === id && item.weight === 'ink' ? palette.accent : palette[item.weight]);
        },
        dispose() {
            faces.dispose(); organicFill.dispose(); silhouette.dispose();
            for (const item of lines.values()) item.material.dispose();
        },
    };
}

function planter(draw, x, z, w = 0.8, d = 0.55) {
    draw.rounded(x, 0.33, z, w, 0.36, d, 0.08, 'wall', 'detail');
    draw.rounded(x, 0.52, z, w + 0.06, 0.06, d + 0.06, 0.09, 'paper', 'detail');
    draw.box(x, 0.55, z, w - 0.1, 0.025, d - 0.1, 'shade', false);
    for (let i = 0; i < 9; i++) {
        const angle = i * 2.4;
        const xx = x + Math.cos(angle) * w * 0.28;
        const zz = z + Math.sin(angle) * d * 0.25;
        const height = 0.15 + (i % 3) * 0.08;
        draw.path([[xx, 0.55, zz], [xx + Math.sin(angle) * 0.08, 0.55 + height, zz + Math.cos(angle) * 0.08]], 'hair');
        draw.geometry(new THREE.SphereGeometry(0.11, 10, 6), matrix(xx,0.59+height,zz), 'leaf', false);
        draw.path(Array.from({length:9},(_,j)=>[xx+Math.cos(j/8*Math.PI)*0.1,0.59+height+Math.sin(j/8*Math.PI)*0.08,zz]),'hair');
    }
}

function pot(draw, x, y, z, radius = 0.23) {
    draw.geometry(new THREE.CylinderGeometry(radius, radius * 0.76, radius * 1.6, 24), matrix(x, y + radius * 0.8, z), 'wall', 'detail');
    draw.ring(x, y + radius * 1.65, z, radius * 1.04, 'detail');
    for (let i = 0; i < 9; i++) {
        const a = i * 2.4, h = radius * (1.3 + i % 3 * 0.4);
        draw.path([[x, y + radius, z], [x + Math.cos(a) * radius * 0.3, y + radius * 1.6 + h, z + Math.sin(a) * radius * 0.3], [x + Math.cos(a) * radius * 1.2, y + radius * 1.5 + h * 0.65, z + Math.sin(a) * radius * 1.2]], 'detail');
    }
}

function chair(draw, x, z, heading = 0, y = 0.18) {
    const p = (xx, yy, zz) => [x + xx * Math.cos(heading) - zz * Math.sin(heading), y + yy, z + xx * Math.sin(heading) + zz * Math.cos(heading)];
    draw.geometry(new THREE.CylinderGeometry(0.23, 0.23, 0.055, 24), matrix(x, y + 0.47, z), 'paper', 'detail');
    for (const xx of [-0.16, 0.16]) for (const zz of [-0.15, 0.15]) draw.path([p(xx * 1.15, 0, zz * 1.2), p(xx, 0.46, zz)], 'detail');
    const back = Array.from({ length: 15 }, (_, i) => {
        const a = Math.PI * 0.12 + i / 14 * Math.PI * 0.76;
        return p(Math.cos(a) * 0.25, 0.87, Math.sin(a) * 0.22);
    });
    draw.path([p(-0.21, 0.43, 0.14), ...back.toReversed(), p(0.21, 0.43, 0.14)], 'detail');
    draw.path([p(-0.2, 0.65, 0.16), p(0.2, 0.65, 0.16)], 'hair');
}

function table(draw, x, z, y = 0.18) {
    draw.cylinder(x, y + 0.84, z, 0.47, 0.065, 'paper', 'ink');
    draw.cylinder(x, y + 0.4, z, 0.035, 0.8, 'metal', false);
    for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2;
        draw.path([[x, y + 0.2, z], [x + Math.cos(a) * 0.28, y + 0.02, z + Math.sin(a) * 0.28]], 'detail');
    }
    draw.cylinder(x + 0.13, y + 0.91, z, 0.065, 0.09, 'paper', 'hair');
    draw.ring(x + 0.13, y + 0.96, z, 0.05, 'hair');
    draw.cylinder(x - 0.17, y + 0.88, z + 0.05, 0.12, 0.012, 'wall', 'hair');
}

function bench(draw, x, z, heading = 0) {
    const transform = matrix(x, 0, z, 0, heading);
    for (let i = 0; i < 5; i++) draw.geometry(new THREE.BoxGeometry(1.65, 0.05, 0.075), transform.clone().multiply(matrix(0, 0.65, -0.2 + i * 0.1)), 'wall', 'detail');
    for (let i = 0; i < 3; i++) draw.geometry(new THREE.BoxGeometry(1.65, 0.08, 0.055), transform.clone().multiply(matrix(0, 0.83 + i * 0.13, 0.25)), 'paper', 'detail');
    for (const xx of [-0.63, 0.63]) {
        draw.path([[xx, 0.19, -0.2], [xx, 0.63, -0.2], [xx, 0.63, 0.2]].map(p => new THREE.Vector3(...p).applyMatrix4(transform).toArray()), 'detail');
        draw.path([[xx, 0.2, 0.23], [xx, 1.13, 0.25]].map(p => new THREE.Vector3(...p).applyMatrix4(transform).toArray()), 'detail');
    }
}

function pane(draw, axis, side, horizontal, y, w, h, tint = 'glass') {
    const offset = side;
    const p = (a, b, depth = offset) => axis === 'z' ? [a, b, depth] : [depth, b, a];
    draw.quad([p(horizontal - w / 2, y - h / 2), p(horizontal + w / 2, y - h / 2), p(horizontal + w / 2, y + h / 2), p(horizontal - w / 2, y + h / 2)], tint, 'detail');
    draw.path([p(horizontal, y - h / 2), p(horizontal, y + h / 2)], 'hair');
    draw.path([p(horizontal - w * 0.37, y + h * 0.2), p(horizontal - w * 0.14, y + h * 0.4)], 'hair');
}

function staticFigure(draw,x,y,z,heading=0,seated=false) {
    const base=matrix(x,y,z,0,heading);
    const transformed=(geometry,x,y,z)=>draw.geometry(geometry,base.clone().multiply(matrix(x,y,z)),'paper',false);
    const segment=(from,to,radius)=>{
        const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),length=a.distanceTo(b);
        const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
        draw.geometry(new THREE.CapsuleGeometry(radius,Math.max(0.001,length-radius*2),3,8),base.clone().multiply(new THREE.Matrix4().compose(a.add(b).multiplyScalar(0.5),q,new THREE.Vector3(1,1,1))),'paper',false);
    };
    const torso=seated?0.71:1.04,head=seated?1.07:1.38;
    transformed(new THREE.CylinderGeometry(0.11,0.16,0.44,12),0,torso,0);
    transformed(new THREE.CapsuleGeometry(0.095,0.08,4,12),0,head,0);
    for(const side of[-1,1]){
        if(seated){
            segment([side*0.075,0.48,0],[side*0.085,0.44,0.32],0.037);
            segment([side*0.085,0.44,0.32],[side*0.085,0.06,0.34],0.032);
            segment([side*0.16,0.88,0],[side*0.18,0.65,0.18],0.027);
            segment([side*0.18,0.65,0.18],[side*0.14,0.84,0.4],0.025);
        }else{
            segment([side*0.075,0.84,0],[side*0.085,0.04,0.04],0.034);
            segment([side*0.16,1.18,0],[side*0.2,0.95,0.15],0.027);
            segment([side*0.2,0.95,0.15],[side*0.12,0.95,0.3],0.025);
        }
    }
}

function outlinedPart(drawing,materials) {
    const part=drawing.finish();
    for(const mesh of [...part.children])if(mesh.isMesh&&!mesh.isLineSegments2){const hull=new THREE.Mesh(mesh.geometry,materials.silhouette);hull.name=mesh.name+'/silhouette';part.add(hull);}
    return part;
}

function awning(draw, axis, side, start, end, top, direction, sectionCount = null) {
    const stripe = 0.32;
    const depth = 0.78;
    const sections = sectionCount || Math.ceil((end - start) / stripe);
    const point = (a, y, b) => axis === 'z' ? [a, y, side + b * direction] : [side + b * direction, y, a];
    for (let i = 0; i < sections; i++) {
        const a = start + i / sections * (end - start), b = start + (i + 1) / sections * (end - start);
        draw.quad([point(a, top, 0), point(b, top, 0), point(b, top - 0.44, depth), point(a, top - 0.44, depth)], i % 2 ? 'shade' : 'paper', 'detail');
        const rim = [];
        for (let j = 0; j <= 8; j++) rim.push(point(a + (b - a) * j / 8, top - 0.44 - Math.sin(j / 8 * Math.PI) * 0.11, depth));
        draw.quad([point(a, top - 0.44, depth), point(b, top - 0.44, depth), point(b, top - 0.51, depth), point(a, top - 0.51, depth)], i % 2 ? 'shade' : 'paper', false);
        draw.path(rim, 'ink');
    }
    draw.path([point(start, top, 0), point(end, top, 0)], 'ink');
}

function cafe(materials, font, options = {}) {
    const draw = new Drawing('cafe/architecture', materials, 'cafe');
    const upper = new Drawing('cafe/upper-storey', materials, 'cafe');
    const roof = new Drawing('cafe/roof-and-services', materials, 'cafe');
    const interior = new Drawing('cafe/interior', materials, 'cafe');
    const terrace = new Drawing('cafe/terrace', materials, 'cafe');
    const shade = new Drawing('cafe/awnings', materials, 'cafe');
    const x0 = -0.25, x1 = 5.75, z0 = -0.4, z1 = 4.8;
    const frontWindows = options.frontWindows || [0.5, 2, 3.5, 5];
    const sideWindows = options.sideWindows || [0.35, 1.65, 2.95, 4.15];
    draw.rounded(2.75, 0.2, 2.2, 6.35, 0.16, 5.55, 0.12, 'paper', 'ink');
    draw.box(2.75, 0.32, 2.2, 6.0, 0.12, 5.2, 'wall', 'ink');
    upper.box(2.75, 2.44, 2.2, 6.15, 0.22, 5.35, 'paper', false);
    upper.box(2.75, 4.61, 2.2, 6.15, 0.16, 5.35, 'paper', false);
    const floorRing = y => [[-0.325,y,-0.475],[5.825,y,-0.475],[5.825,y,4.875],[-0.325,y,4.875]];
    upper.path(floorRing(2.55),'ink',true);
    upper.path(floorRing(2.33),'profile',true);
    for(const x of[x0,x1])for(const z of[z0,z1])upper.path([[x,2.55,z],[x,4.99,z]],'ink');
    const upstairsWindows=[];
    // Actual openings keep the upstairs lounge visible from every street side.
    function upperWall(axis,side,start,end,centers,width) {
        const box=(a,y,w,h,d=0.16)=>axis==='z'?upper.box(a,y,side,w,h,d,'paper',false):upper.box(side,y,a,d,h,w,'paper',false);
        box((start+end)/2,2.69,end-start,0.37);
        box((start+end)/2,4.38,end-start,0.31);
        let cursor=start;
        for(const a of centers){
            const left=a-width/2,right=a+width/2;
            if(left>cursor)box((cursor+left)/2,3.55,left-cursor,1.35);
            cursor=right;
            const outward=side===(axis==='z'?z0+0.08:x0+0.08)?-1:1;
            const surface=side+outward*0.09;
            const p=(u,y)=>axis==='z'?[u,y,surface]:[surface,y,u];
            upper.path([p(left,2.875),p(right,2.875),p(right,4.225),p(left,4.225)],'detail',true);
            upper.path([p(a,2.875),p(a,4.225)],'detail');
            upper.path([p(left,3.97),p(right,3.97)],'hair');
            upstairsWindows.push({axis,side:surface,center:a,width});
        }
        if(cursor<end)box((cursor+end)/2,3.55,end-cursor,1.35);
    }
    upperWall('z',z1-0.08,x0,x1,frontWindows,options.frontWindowWidth || 1.15);
    upperWall('x',x1-0.08,z0,z1,sideWindows,options.sideWindowWidth || 0.95);
    upperWall('z',z0+0.08,x0,x1,[0.65,2.2,3.75,5.05],0.92);
    upperWall('x',x0+0.08,z0,z1,[0.45,1.9,3.65],1.0);
    draw.box(2.75, 1.35, z0 + 0.08, 6, 2.02, 0.16, 'wall', 'ink');
    draw.box(x0 + 0.08, 1.35, 2.2, 0.16, 2.02, 5.2, 'wall', 'ink');
    // Open street façades: posts and beams surround real interior space.
    for (const x of options.frontPosts || [x0 + 0.08, 1.25, 2.75, 4.25, x1 - 0.08]) {
        draw.box(x,1.37,z1-0.08,0.14,2.0,0.16,'paper',false);
        draw.path([[x,0.37,z1+0.01],[x,2.37,z1+0.01]],'detail');
    }
    for (const z of [z0 + 0.08, 1.0, 2.3, 3.55, z1 - 0.08]) {
        draw.box(x1-0.08,1.37,z,0.16,2.0,0.14,'paper',false);
        draw.path([[x1+0.01,0.37,z],[x1+0.01,2.37,z]],'detail');
    }
    for (const x of frontWindows) {
        upper.box(x, 2.88, z1, 1.25, 0.075, 0.22, 'paper', false);
        upper.path([[x-0.625,2.9175,z1+0.11],[x+0.625,2.9175,z1+0.11]],'profile');
    }
    for (const z of sideWindows) {
        upper.box(x1, 2.88, z, 0.22, 0.075, 1.05, 'paper', false);
        upper.path([[x1+0.11,2.9175,z-0.525],[x1+0.11,2.9175,z+0.525]],'profile');
    }
    // Side and rear façades remain resolved when the block turns.
    pane(draw, 'z', z0 - 0.015, 4.6, 1.36, 0.85, 1.85, 'wall');
    for(const z of[0.65,3.55])pane(draw,'x',x0-0.012,z,1.4,0.82,0.82);
    draw.rounded(4.6,0.27,z0-0.35,1.2,0.11,0.6,0.05,'paper','detail');
    draw.path([[4.84,1.22,z0-0.03],[4.84,1.52,z0-0.03]],'detail');
    draw.path([[x0-0.08,0.35,2.55],[x0-0.08,4.55,2.55],[x0+0.18,4.55,2.55]],'detail');
    for (let i = 0; i < 6; i++) draw.path([[0.4, 1.05 + i * 0.13, z0 - 0.03], [1.7, 1.05 + i * 0.13, z0 - 0.03]], 'hair');
    for (const [axis, side, values] of [['z', z1 - 0.03, [0.5, 2, 3.5]], ['x', x1 - 0.03, [0.35, 1.65, 2.95, 4.15]]]) {
        for (const a of values) {
            const p = (horizontal, y) => axis === 'z' ? [horizontal, y, side] : [side, y, horizontal];
            draw.path([p(a - 0.65, 0.45), p(a - 0.65, 2.28), p(a + 0.65, 2.28), p(a + 0.65, 0.45)], 'hair');
            draw.path([p(a, 0.45), p(a, 2.28)], 'hair');
        }
    }
    draw.path([[4.35, 0.4, z1 + 0.01], [4.35, 2.3, z1 + 0.01], [5.55, 2.3, z1 + 0.01], [5.55, 0.4, z1 + 0.01]], 'detail');
    draw.path([[4.95, 0.4, z1 + 0.02], [4.95, 2.3, z1 + 0.02]], 'detail');
    draw.path([[4.77, 1.13, z1 + 0.04], [4.77, 1.46, z1 + 0.04]], 'ink');
    awning(shade, 'z', z1 + 0.02, x0 + 0.12, x1 - 0.1, 2.56, 1, options.frontStripes);
    awning(shade, 'x', x1 + 0.02, z0 + 0.12, z1 - 0.1, 2.56, 1, options.sideStripes);
    // Roof parapet, cap, service equipment, and fine ventilation louvers.
    for (const z of [z0, z1]) roof.box(2.75, 4.83, z, 6.2, 0.32, 0.14, 'paper', false);
    for (const x of [x0, x1]) roof.box(x, 4.83, 2.2, 0.14, 0.32, 5.2, 'paper', false);
    const roofRing=(y,inset=0)=>[[x0-0.07+inset,y,z0-0.07+inset],[x1+0.07-inset,y,z0-0.07+inset],[x1+0.07-inset,y,z1+0.07-inset],[x0-0.07+inset,y,z1+0.07-inset]];
    roof.path(roofRing(4.99),'ink',true);
    roof.path(roofRing(4.99,0.14),'profile',true);
    roof.path(roofRing(4.67),'profile',true);
    roof.box(2.75, 4.72, 2.2, 5.8, 0.04, 5.0, 'paper', false);
    roof.box(1.4, 5.03, 1.0, 1.2, 0.6, 0.85, 'wall', 'detail');
    roof.box(1.4, 5.35, 1.0, 1.28, 0.06, 0.93, 'paper', 'detail');
    for (let i = 0; i < 5; i++) roof.path([[0.9, 4.86 + i * 0.08, 1.435], [1.9, 4.86 + i * 0.08, 1.435]], 'profile');
    // Counter, back bar, machine, cups, shelving, and pendant lights.
    interior.box(1.5, 0.82, 0.45, 2.7, 0.9, 0.65, 'wall', 'detail');
    interior.box(1.5, 1.3, 0.45, 2.83, 0.08, 0.76, 'paper', 'ink');
    interior.rounded(1.25, 1.59, 0.45, 1.05, 0.5, 0.46, 0.06, 'shade', 'detail');
    interior.box(1.25, 1.87, 0.45, 1.13, 0.055, 0.52, 'paper', 'detail');
    for (const x of [0.93, 1.24, 1.55]) {
        interior.cylinder(x, 1.93, 0.45, 0.07, 0.1, 'paper', 'hair');
        interior.path([[x, 1.55, 0.7], [x, 1.43, 0.75], [x + 0.1, 1.43, 0.75]], 'detail');
    }
    for (const y of [1.35, 1.83]) {
        interior.box(1.3, y, z0 + 0.24, 2.2, 0.045, 0.24, 'paper', 'detail');
        for (let i = 0; i < 7; i++) interior.cylinder(0.5 + i * 0.24, y + 0.11, z0 + 0.24, 0.055, 0.17, 'wall', 'hair');
    }
    for (const x of [0.7, 2.1, 3.6]) {
        interior.path([[x, 2.31, 3.8], [x, 1.88, 3.8]], 'detail');
        interior.geometry(new THREE.SphereGeometry(0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), matrix(x, 1.84, 3.8), 'paper', false);
        interior.ring(x, 1.84, 3.8, 0.15, 'detail');
    }
    table(interior, 4.5, 2.5, 0.38); chair(interior, 4, 2.5, Math.PI / 2, 0.38); chair(interior, 5.0, 2.5, -Math.PI / 2, 0.38);
    table(interior, 1.7, 3.3, 0.38); chair(interior, 1.15, 3.3, Math.PI / 2, 0.38);
    pot(interior, 4.4, 0.4, 0.55, 0.27);
    staticFigure(interior,1.8,0.38,-0.02,0,false);
    // Street-facing display counter, espresso station, and cups remain visible
    // through the glazing even when the complete building is assembled.
    interior.box(1.05,0.86,4.12,1.65,0.9,0.58,'wall','detail');
    interior.box(1.05,1.34,4.12,1.78,0.065,0.68,'paper','ink');
    interior.box(1.05,1.58,4.08,1.35,0.035,0.45,'paper','detail');
    for(const x of[0.42,1.68])interior.path([[x,1.36,4.32],[x,1.84,4.32],[x,1.84,3.87],[x,1.36,3.87]],'detail');
    for(const x of[0.65,1.02,1.39]){
        interior.cylinder(x,1.41,4.14,0.13,0.06,'shade','detail');
        interior.cylinder(x,1.64,4.14,0.09,0.07,'paper','detail');
    }
    interior.box(3.25,0.86,4.03,1.3,0.9,0.64,'wall','detail');
    interior.box(3.25,1.34,4.03,1.43,0.065,0.76,'paper','ink');
    interior.rounded(3.25,1.59,4.02,0.95,0.45,0.48,0.045,'shade','detail');
    interior.box(3.25,1.84,4.02,1.02,0.04,0.55,'paper','detail');
    for(const x of[3.0,3.26,3.5]){
        interior.cylinder(x,1.91,4.02,0.06,0.1,'paper','detail');
        interior.path([[x,1.56,4.28],[x,1.44,4.34],[x+0.1,1.44,4.34]],'detail');
    }
    pot(interior,5.15,0.4,0.6,0.22);
    // Outdoor terrace furniture and two accessible approaches.
    for (const [x,z] of [[0.4, 6.1], [2.1, 6.1], [7.0, 3.8]]) {
        table(terrace, x, z); chair(terrace, x - 0.52, z, Math.PI / 2); chair(terrace, x + 0.52, z, -Math.PI / 2);
    }
    staticFigure(terrace,-0.12,0.18,6.1,Math.PI/2,true);
    for (const [x,z] of [[-0.75,5.0], [3.4,6.1], [6.9,0.2], [7.0,5.15]]) pot(terrace,x,0.18,z,0.28);
    planter(terrace, 6.8, 1.65, 0.6, 1.25);
    // Freestanding menu board is geometry, including its blank inset face.
    terrace.box(4.4, 0.76, 5.95, 0.48, 0.83, 0.065, 'wall', 'detail');
    terrace.path([[4.16,0.2,6.1],[4.16,1.2,5.95],[4.16,0.2,5.65]], 'detail');
    terrace.path([[4.64,0.2,6.1],[4.64,1.2,5.95],[4.64,0.2,5.65]], 'detail');
    for (let i=0;i<3;i++) terrace.path([[4.26,0.65+i*0.13,5.99],[4.55,0.65+i*0.13,5.99]],'hair');
    const group = draw.finish();
    // These trims share visibility with the roof in the cutaway and can share
    // one draw call rather than giving each architectural part another pass.
    roof.strokes.profile.push(...upper.strokes.profile);
    upper.strokes.profile=[];
    const roofGroup = roof.finish();
    const lounge=new Drawing('cafe/upper-lounge',materials,'cafe');
    lounge.box(2.75,2.57,2.2,5.7,0.045,4.9,'wall',false);
    for(const[x,z]of[[0.65,4.02],[3.65,4.02],[4.95,1.15]]){
        table(lounge,x,z,2.6);chair(lounge,x-0.49,z,Math.PI/2,2.6);chair(lounge,x+0.49,z,-Math.PI/2,2.6);
    }
    staticFigure(lounge,3.16,2.6,4.02,Math.PI/2,true);
    for(const[x,z]of[[2.0,4.35],[5.3,3.1],[0.4,0.1]])pot(lounge,x,2.6,z,0.23);
    // The bookcase and wall shelves resolve the rear views as well.
    lounge.box(1.7,3.05,0.0,2.4,0.85,0.36,'wall','detail');
    for(const y of[2.68,3.03,3.39]){
        lounge.box(1.7,y,0.22,2.45,0.045,0.44,'paper','detail');
        for(let i=0;i<9;i++)lounge.box(0.7+i*0.24,y+0.13,0.18,0.11,0.22+(i%3)*0.025,0.16,i%3?'wall':'shade','hair');
    }
    for(const x of[0.65,2.5,4.4]){
        lounge.path([[x,4.48,4.0],[x,4.05,4.0]],'detail');
        lounge.geometry(new THREE.SphereGeometry(0.14,16,8,0,Math.PI*2,0,Math.PI/2),matrix(x,4.01,4.0),'paper',false);
        lounge.ring(x,4.01,4.0,0.14,'detail');
    }
    // Furniture needs silhouettes; the architecture already has authored edges.
    // Share the stroke batches without outlining the architectural surfaces twice.
    for(const weight of Object.keys(upper.strokes)) {
        upper.strokes[weight].push(...lounge.strokes[weight]);
        lounge.strokes[weight]=[];
    }
    const upperGroup=upper.finish();
    upperGroup.add(outlinedPart(lounge,materials));
    group.add(upperGroup, roofGroup, outlinedPart(interior,materials), shade.finish());
    if (options.includeTerrace !== false) group.add(outlinedPart(terrace,materials));
    group.userData.upper = upperGroup;
    group.userData.roof = roofGroup;
    const glazing = new THREE.MeshBasicMaterial({ color: '#dce7ff', transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
    function glass(name, points, parent = group) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>points[i]),3));
        const mesh=new THREE.Mesh(geometry,glazing);mesh.name=name;mesh.userData.ownedMaterial=true;parent.add(mesh);
    }
    const upperGlassPositions=[];
    for(const window of upstairsWindows){
        const{axis,side,center,width}=window;
        const p=(a,y)=>axis==='z'?[a,y,side]:[side,y,a];
        const points=[p(center-width/2,2.875),p(center+width/2,2.875),p(center+width/2,4.225),p(center-width/2,4.225)];
        upperGlassPositions.push(...[0,1,2,0,2,3].flatMap(i=>points[i]));
    }
    const upperGlassGeometry=new THREE.BufferGeometry();
    upperGlassGeometry.setAttribute('position',new THREE.Float32BufferAttribute(upperGlassPositions,3));
    const upperGlass=new THREE.Mesh(upperGlassGeometry,glazing);upperGlass.name='cafe/upper-glazing';upperGlass.userData.ownedMaterial=true;upperGroup.add(upperGlass);
    glass('cafe/front-glazing',[[x0+0.14,0.4,z1-0.04],[4.31,0.4,z1-0.04],[4.31,2.3,z1-0.04],[x0+0.14,2.3,z1-0.04]]);
    glass('cafe/side-glazing',[[x1-0.04,0.4,z0+0.14],[x1-0.04,0.4,z1-0.14],[x1-0.04,2.3,z1-0.14],[x1-0.04,2.3,z0+0.14]]);
    const door=new THREE.Group();door.name='cafe/entrance-door';door.position.set(4.35,0.37,z1+0.03);door.rotation.y=-0.24;
    const joinery=new Drawing('cafe/entrance-door/frame',materials,'cafe');
    joinery.box(0.575,1.93,0,1.15,0.04,0.045,'paper','detail');
    joinery.box(0.575,0.02,0,1.15,0.04,0.045,'paper','detail');
    for(const x of[0.02,1.13])joinery.box(x,0.975,0,0.04,1.93,0.045,'paper','detail');
    joinery.path([[0.98,0.77,0.06],[0.98,1.12,0.06]],'ink');door.add(joinery.finish());
    glass('cafe/entrance-door/glass',[[0.04,0.04,0],[1.11,0.04,0],[1.11,1.91,0],[0.04,1.91,0]],door);
    group.add(door);
    if (font) {
        const geometry = new THREE.ShapeGeometry(font.generateShapes('CORNER CAFÉ', 0.18), 5);
        geometry.computeBoundingBox();
        geometry.translate(-(geometry.boundingBox.max.x + geometry.boundingBox.min.x)/2,0,0);
        const text = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: PALETTE.ink, side: THREE.DoubleSide }));
        text.name = 'cafe/fascia-lettering';
        text.position.set(2.75,2.67,z1+0.1);
        upperGroup.add(text);
        const side=text.clone(); side.name='cafe/side-lettering';side.rotation.y=Math.PI/2;side.position.set(x1+0.1,2.67,2.2);upperGroup.add(side);
    }
    return group;
}

// Shared drafting primitives for additional authored neighborhoods. Defaults
// preserve the original café block's geometry and rendering behavior.
export { Drawing, materials as createIllustrationMaterials, cafe as createCafeArchitecture,
    car as createIllustratedCar, person as createIllustratedPerson,
    pot, planter, bench, table, chair, staticFigure, outlinedPart };

function office(materials) {
    const d = new Drawing('offices/architecture', materials, 'offices');
    const cx=-5.45, cz=-3.15, w=5.1, depth=4.6, bottom=0.25, top=9.15;
    const x0=cx-w/2,x1=cx+w/2,z0=cz-depth/2,z1=cz+depth/2;
    d.rounded(cx,0.2,cz,w+0.4,0.16,depth+0.4,0.1,'paper','ink');
    d.box(cx,5.39,cz,w,7.52,depth,'paper','ink');
    d.box(cx,1.65,cz,w+0.08,0.2,depth+0.08,'paper','ink');
    for (const x of [x0+0.1,cx,x1-0.1]) d.box(x,0.93,z1-0.1,0.2,1.35,0.2,'paper','detail');
    d.box(x0+0.1,0.93,cz,0.2,1.35,depth,'wall','detail');
    d.box(cx,0.93,z0+0.1,w,1.35,0.2,'wall','detail');
    d.box(cx,0.3,cz,w-0.3,0.04,depth-0.3,'paper',false);
    for (let floor=0;floor<6;floor++) {
        const y=2.35+floor*1.1;
        for (let bay=0;bay<4;bay++) for (const side of [z0-0.005,z1+0.005]) pane(d,'z',side,cx+(bay-1.5)*1.15,y,0.84,0.78);
        for (let bay=0;bay<3;bay++) for (const side of [x0-0.005,x1+0.005]) pane(d,'x',side,cz+(bay-1)*1.35,y,1.0,0.78);
        for (const side of [z0,z1]) d.path([[x0,y-0.55,side],[x1,y-0.55,side]],'hair');
    }
    // Lobby glazing has mullions but no opaque image or plane over the interior.
    for (let i=0;i<5;i++) d.path([[x0+0.35+i*1.1,0.35,z1+0.01],[x0+0.35+i*1.1,1.5,z1+0.01]],'detail');
    for(let i=0;i<4;i++)d.path([[x1+0.01,0.35,z0+0.35+i*1.2],[x1+0.01,1.5,z0+0.35+i*1.2]],'detail');
    pane(d,'z',z0-0.012,cx-0.8,0.91,0.86,1.22,'wall');
    pane(d,'z',z0-0.012,cx+1.0,0.96,1.2,0.58,'wall');
    for(let i=0;i<5;i++)d.path([[cx+0.48,0.73+i*0.11,z0-0.025],[cx+1.52,0.73+i*0.11,z0-0.025]],'hair');
    d.path([[cx-0.55,0.77,z0-0.035],[cx-0.55,1.04,z0-0.035]],'detail');
    for(const z of[cz-1.15,cz+1.15])pane(d,'x',x0-0.012,z,0.96,0.9,0.94);
    d.path([[x0+0.2,0.35,z1+0.02],[x1-0.2,0.35,z1+0.02]],'hair');
    d.box(cx,1.52,z1+0.48,2.1,0.08,0.95,'paper','ink');
    for(const x of [cx-0.9,cx+0.9]) d.path([[x,0.25,z1+0.86],[x,1.5,z1+0.86]],'detail');
    for(const z of [z0,z1]) d.box(cx,top+0.16,z,w+0.15,0.32,0.14,'paper',false);
    for(const x of [x0,x1]) d.box(x,top+0.16,cz,0.14,0.32,depth,'paper',false);
    const roofRing=(y,inset=0)=>[[x0-0.07+inset,y,z0-0.07+inset],[x1+0.07-inset,y,z0-0.07+inset],[x1+0.07-inset,y,z1+0.07-inset],[x0-0.07+inset,y,z1+0.07-inset]];
    d.path(roofRing(top+0.32),'ink',true);
    d.path(roofRing(top+0.32,0.14),'profile',true);
    d.path(roofRing(top),'profile',true);
    d.box(cx,top+0.04,cz,w-0.2,0.04,depth-0.2,'paper',false);
    for(const [x,z,ww] of [[cx-1.2,cz-0.9,1.05],[cx+0.8,cz+0.8,1.45]]) {
        d.box(x,top+0.35,z,ww,0.55,0.9,'wall','detail');
        d.box(x,top+0.65,z,ww+0.1,0.06,1,'paper','detail');
        for(let i=0;i<5;i++)d.path([[x-ww*0.4,top+0.15+i*0.08,z+0.46],[x+ww*0.4,top+0.15+i*0.08,z+0.46]],'hair');
    }
    d.path([[cx-1.2,top+0.65,cz-0.9],[cx-1.2,top+1.45,cz-0.9]],'detail');
    for(let i=0;i<3;i++)d.path([[cx-1.4,top+0.95+i*0.15,cz-0.9],[cx-1.0,top+1.07+i*0.15,cz-0.9]],'detail');
    planter(d,cx-1.85,z1+0.6,0.7,1);planter(d,cx+1.85,z1+0.6,0.7,1);
    pot(d,cx+1.5,0.3,cz-0.7,0.3);
    bench(d,cx-0.8,cz+0.5);
    return d.finish();
}

function streets(materials) {
    const d=new Drawing('street/ground-and-pavement',materials,'crossing');
    d.rounded(-1,0.015,-0.1,25.0,0.04,22.0,1.3,'road',false);
    d.rounded(-1,0.11,-0.15,18.1,0.16,15.7,0.55,'curb','detail');
    d.rounded(-1,0.2,-0.15,17.9,0.04,15.5,0.5,'paper','detail');
    // Paving is localized to the terrace and entrances, leaving the rest quiet.
    for(const[x0,x1,z0,z1]of[[-0.9,7.5,5,7.5],[5.9,7.5,-0.5,5],[-8.1,-2.7,-0.7,0.8],[-8.2,-3.6,1.5,5.9]]){
        for(let x=x0;x<=x1;x+=0.75)d.path([[x,0.225,z0],[x,0.225,z1]],'hair');
        for(let z=z0;z<=z1;z+=0.75)d.path([[x0,0.225,z],[x1,0.225,z]],'hair');
    }
    for(let x=-11.6;x<9.6;x+=1.35)for(const z of [-9.1,8.85])d.box(x,0.044,z,0.66,0.008,0.065,'paper',false);
    for(let z=-8.5;z<8.5;z+=1.35)for(const x of [-11.2,9.25])d.box(x,0.044,z,0.065,0.008,0.66,'paper',false);
    // Front crossing meets the café terrace and includes a lowered approach.
    for(let i=0;i<7;i++)d.box(2.25+(i-3)*0.32,0.045,8.8,0.17,0.012,2.25,'paper',false);
    for(let i=0;i<6;i++)d.box(9.2,0.045,-0.4+(i-2.5)*0.32,2.0,0.012,0.17,'paper',false);
    for(const x of [0.65,3.9]) {
        d.cylinder(x,0.59,7.1,0.055,0.75,'paper','detail');
        d.ring(x,0.92,7.1,0.058,'detail');
    }
    for(const [x,z]of[[-9.2,-5.8],[-9.2,4.8],[7.3,-6],[7.3,5.8]]) {
        d.cylinder(x,1.6,z,0.035,2.75,'paper',false);
        d.cylinder(x,3.01,z,0.13,0.07,'paper','detail');
        d.cylinder(x,0.3,z,0.12,0.16,'wall','detail');
    }
    for(const [x,z] of [[-8.8,2.1],[6.9,-2.2]]) {
        d.cylinder(x,0.55,z,0.16,0.65,'wall','detail');
        d.ring(x,0.89,z,0.17,'detail');
        for(let i=0;i<9;i++){const a=i/9*Math.PI*2;d.path([[x+Math.cos(a)*0.16,0.3,z+Math.sin(a)*0.16],[x+Math.cos(a)*0.16,0.78,z+Math.sin(a)*0.16]],'hair');}
    }
    for(const[x,z]of[[3.1,7.35],[-9.45,-1.2],[7.4,2.7]]) {
        d.box(x,0.228,z,0.38,0.012,0.5,'shade','detail');
        for(let i=0;i<5;i++)d.path([[x-0.14+i*0.07,0.24,z-0.19],[x-0.14+i*0.07,0.24,z+0.19]],'hair');
    }
    return d.finish();
}

function garden(materials) {
    const d=new Drawing('garden/furniture-and-planting',materials,'garden');
    for(const[x,z,angle]of[[-7.0,2.0,0],[-4.7,2.0,0],[-6.0,5.5,Math.PI]])bench(d,x,z,angle);
    for(const[x,z,w,depth]of[[-7.6,3.8,0.65,2.4],[-3.8,4.4,0.65,1.6],[0.5,-6.7,2.7,0.65],[4.7,-6.7,1.8,0.65]])planter(d,x,z,w,depth);
    // Bicycle rack: bent metal rails, anchored individually in the pavement.
    for(let i=0;i<3;i++){
        const x=-1.8+i*0.5,z=-5.9;
        d.path([[x,0.22,z-0.3],[x,0.75,z-0.3],[x,0.88,z-0.18],[x,0.88,z+0.18],[x,0.75,z+0.3],[x,0.22,z+0.3]],'detail');
    }
    // A parked bicycle is built from tubes, rims, spokes, and frame lines.
    for(const x of[-1.45,-0.5]){
        d.geometry(new THREE.TorusGeometry(0.25,0.018,6,32),matrix(x,0.48,-5.65),'metal',false);
        d.path(Array.from({length:32},(_,i)=>[x+Math.cos(i/32*Math.PI*2)*0.25,0.48+Math.sin(i/32*Math.PI*2)*0.25,-5.625]),'detail',true);
        for(let i=0;i<6;i++){const a=i/6*Math.PI*2;d.path([[x,0.48,-5.62],[x+Math.cos(a)*0.23,0.48+Math.sin(a)*0.23,-5.62]],'hair');}
    }
    d.path([[-1.45,0.48,-5.65],[-1.1,0.98,-5.65],[-0.95,0.48,-5.65],[-1.45,0.48,-5.65]],'detail');
    d.path([[-1.1,0.98,-5.65],[-0.65,0.96,-5.65],[-0.5,0.48,-5.65],[-0.95,0.48,-5.65],[-0.65,0.96,-5.65],[-0.7,1.18,-5.65],[-0.55,1.18,-5.65]],'detail');
    d.box(-1.1,1.0,-5.65,0.22,0.035,0.09,'wall','detail');
    return d.finish();
}

function canopyGeometry(radius, seed) {
    const geometry=new THREE.SphereGeometry(radius,36,24);
    const vertices=geometry.getAttribute('position');
    const colors=[];
    const top=color('paper'), bottom=color('leaf');
    for(let i=0;i<vertices.count;i++){
        position.fromBufferAttribute(vertices,i);
        const theta=Math.atan2(position.z,position.x),phi=Math.acos(Math.max(-1,Math.min(1,position.y/radius)));
        const wave=1+0.1*Math.sin(theta*7+seed)*Math.sin(phi)**2+0.045*Math.cos(theta*13+phi*5+seed)*Math.sin(phi);
        position.x*=wave;position.z*=wave;position.y*=1.12+0.025*Math.sin(theta*4+seed);
        vertices.setXYZ(i,position.x,position.y,position.z);
        const tone=bottom.clone().lerp(top,Math.max(0,(position.y/radius+0.4)*0.32));
        colors.push(tone.r,tone.g,tone.b);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    return geometry;
}

function tree(materials,x,z,height=3.2,radius=0.9,seed=1) {
    const group=new THREE.Group();group.name=`garden/tree-${seed}`;group.userData.place='garden';
    const d=new Drawing(`${group.name}/branches`,materials,'garden');
    d.geometry(new THREE.CylinderGeometry(0.035,0.075,height-0.3,12),matrix(x,(height-0.3)/2+0.22,z),'paper',false);
    for(let i=0;i<3;i++){
        const a=i*2.4+seed;
        d.path([[x,0.8,z],[x+Math.cos(a)*0.23,height-1.2,z+Math.sin(a)*0.23],[x+Math.cos(a)*0.43,height-0.75,z+Math.sin(a)*0.43]],'detail');
    }
    d.rounded(x,0.25,z,0.8,0.08,0.8,0.1,'paper','detail');
    group.add(d.finish());
    const geometry=canopyGeometry(radius,seed);
    const fill=new THREE.Mesh(geometry,materials.organicFill);fill.name=`${group.name}/canopy`;fill.position.set(x,height-0.2,z);fill.renderOrder=1;
    const outline=new THREE.Mesh(geometry,materials.silhouette);outline.name=`${group.name}/silhouette`;outline.position.copy(fill.position);
    group.add(outline,fill);
    const foliage=new Drawing(`${group.name}/leaf-marks`,materials,'garden');
    for(let i=0;i<58;i++){
        const theta=seed+i*2.39996,phi=0.45+(i*0.73)%2.15;
        const points=Array.from({length:7},(_,j)=>{
            const a=theta+(j/6-0.5)*0.22,p=phi+Math.sin(j/6*Math.PI)*0.09;
            const wave=1+0.1*Math.sin(a*7+seed)*Math.sin(p)**2+0.045*Math.cos(a*13+p*5+seed)*Math.sin(p);
            return[x+Math.cos(a)*Math.sin(p)*(radius*wave+0.012),height-0.2+Math.cos(p)*radius*(1.12+0.025*Math.sin(a*4+seed)),z+Math.sin(a)*Math.sin(p)*(radius*wave+0.012)];
        });
        foliage.path(points,'detail');
    }
    group.add(foliage.finish());
    return group;
}

function car(materials,name) {
    const d=new Drawing(name,materials,'crossing');
    const side=[[-0.78,0.22],[-0.77,0.42],[-0.57,0.49],[-0.3,0.75],[0.28,0.75],[0.58,0.49],[0.77,0.43],[0.78,0.22]];
    const shape=new THREE.Shape(side.map(([x,y])=>new THREE.Vector2(x,y)));
    d.geometry(new THREE.ExtrudeGeometry(shape,{depth:0.7,bevelEnabled:false}),matrix(0,0,-0.35),'paper','ink');
    for(const z of[-0.357,0.357]) {
        d.quad([[-0.51,0.49,z],[-0.25,0.7,z],[-0.03,0.7,z],[-0.03,0.49,z]],'glass','detail');
        d.quad([[0.04,0.49,z],[0.04,0.7,z],[0.25,0.7,z],[0.48,0.49,z]],'glass','detail');
        d.path([[-0.04,0.23,z],[-0.04,0.48,z]],'hair');
        d.path([[0.08,0.43,z],[0.23,0.43,z]],'hair');
    }
    d.quad([[0.3,0.74,-0.3],[0.55,0.51,-0.3],[0.55,0.51,0.3],[0.3,0.74,0.3]],'glass','detail');
    d.quad([[-0.3,0.74,-0.3],[-0.55,0.51,-0.3],[-0.55,0.51,0.3],[-0.3,0.74,0.3]],'glass','detail');
    for(const x of[-0.48,0.48])for(const z of[-0.37,0.37]){
        d.geometry(new THREE.CylinderGeometry(0.145,0.145,0.085,24),matrix(x,0.19,z,Math.PI/2),'metal','detail');
        d.geometry(new THREE.CylinderGeometry(0.07,0.07,0.09,20),matrix(x,0.19,z+(z>0?0.012:-0.012),Math.PI/2),'paper','hair');
    }
    d.box(0.79,0.32,0,0.025,0.06,0.54,'wall','detail');
    for(const z of[-0.23,0.23])d.box(0.785,0.43,z,0.025,0.075,0.13,'glass','hair');
    const group=d.finish();group.userData.actor=true;return group;
}

function person(materials,name,walking=false) {
    const group=new THREE.Group();group.name=name;group.userData.place='crossing';
    const body=new Drawing(`${name}/body`,materials,'crossing');
    body.geometry(new THREE.CapsuleGeometry(0.095,0.08,4,12),matrix(0,1.38,0),'paper','detail',45);
    body.geometry(new THREE.CylinderGeometry(0.11,0.16,0.44,12),matrix(0,1.04,0),'paper','detail',40);
    group.add(outlinedPart(body,materials));
    const limbs=[];
    for(const [part,x,length,y]of[['arm',-0.16,0.4,1.18],['arm',0.16,0.4,1.18],['leg',-0.075,0.8,0.84],['leg',0.075,0.8,0.84]]) {
        const pivot=new THREE.Group();pivot.position.set(x,y,0);pivot.name=`${name}/${part}-${x}`;
        const d=new Drawing(`${pivot.name}/shape`,materials,'crossing');
        d.geometry(new THREE.CapsuleGeometry(part==='arm'?0.027:0.036,length-0.05,3,8),matrix(0,-length/2,0),'paper',false);
        d.path([[0,0,0],[0,-length,0]],'detail');
        if(part==='leg')d.rounded(0,-length-0.015,0.035,0.09,0.05,0.18,0.025,'paper','detail');
        pivot.add(outlinedPart(d,materials));group.add(pivot);limbs.push({pivot,part,side:x<0?-1:1});
    }
    group.userData.walking=walking;group.userData.limbs=limbs;
    return group;
}

export function trafficPose(distance, lane=0) {
    const x0=-11.0+lane*0.35,x1=9.1-lane*0.35,z0=-9.05+lane*0.35,z1=8.85-lane*0.35;
    const r=1.15,w=x1-x0-2*r,d=z1-z0-2*r,arc=Math.PI*r/2,total=2*(w+d)+4*arc;
    let s=((distance%total)+total)%total;
    if(s<w)return {x:x0+r+s,z:z1,heading:0};s-=w;
    if(s<arc){const a=s/r;return{x:x1-r+Math.sin(a)*r,z:z1-r+Math.cos(a)*r,heading:a};}s-=arc;
    if(s<d)return{x:x1,z:z1-r-s,heading:Math.PI/2};s-=d;
    if(s<arc){const a=s/r;return{x:x1-r+Math.cos(a)*r,z:z0+r-Math.sin(a)*r,heading:Math.PI/2+a};}s-=arc;
    if(s<w)return{x:x1-r-s,z:z0,heading:Math.PI};s-=w;
    if(s<arc){const a=s/r;return{x:x0+r-Math.sin(a)*r,z:z0+r-Math.cos(a)*r,heading:Math.PI+a};}s-=arc;
    if(s<d)return{x:x0,z:z0+r+s,heading:Math.PI*1.5};s-=d;
    const a=s/r;return{x:x0+r-Math.cos(a)*r,z:z1-r+Math.sin(a)*r,heading:Math.PI*1.5+a};
}

export function createCafeBlock({font=null}={}) {
    const ink=materials();
    const scene=new THREE.Group();scene.name='geomarketeer/cafe-block';
    const anchors={cafe:new THREE.Vector3(2.7,1.9,2.4),offices:new THREE.Vector3(-5.45,4.5,-3.15),garden:new THREE.Vector3(-5.7,0.8,3.5),crossing:new THREE.Vector3(2.5,0.5,8)};
    const cafeBuilding=cafe(ink,font);
    scene.add(streets(ink),garden(ink),cafeBuilding,office(ink));
    for(const [i,config]of[[-8.5,4.7,3.3,0.95],[-8.5,-0.3,3.6,1.05],[-8.3,-6.7,3.4,0.95],[-3.4,5.3,2.9,0.85],[0.1,-6.5,3.0,0.8],[4.5,-6.3,3.5,1.0],[6.7,-2.9,3.2,0.9],[6.85,5.8,2.7,0.7]].entries())scene.add(tree(ink,...config,i+1));
    const actors=[];
    for(let i=0;i<3;i++){
        const group=car(ink,`traffic/car-${i+1}`);group.scale.setScalar(1.1);scene.add(group);
        actors.push({group,offset:i*24.5,speed:0.9+i*0.08,lane:i%2,phase:i*2.0});
    }
    const walkers=[];
    for(const [i,start]of[[-1.3,6.25],[5.9,6.65],[-5.35,0.9],[6.85,2.9]].entries()) {
        const group=person(ink,`people/walker-${i+1}`,true);scene.add(group);
        walkers.push({group,x:start[0],z:start[1],phase:i*1.7,direction:i%2?1:-1});
    }
    const picks=[];
    for(const[id,center,size]of[['cafe',[2.75,2.55,2.2],[6.5,5.0,5.6]],['offices',[-5.45,4.65,-3.15],[5.3,9.1,4.8]],['garden',[-6,1.0,3.6],[6.5,1.6,4.9]],['crossing',[2.3,0.15,8.6],[3.4,0.3,2.9]]]) {
        const pick=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial());pick.position.set(...center);pick.layers.set(1);pick.name=`pick/${id}`;pick.userData.place=id;scene.add(pick);picks.push(pick);
    }
    for(const actor of actors){const pick=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.9,0.9),new THREE.MeshBasicMaterial());pick.position.y=0.4;pick.layers.set(1);pick.name=`pick/${actor.group.name}`;pick.userData.place='crossing';pick.userData.actor=actor;actor.group.add(pick);picks.push(pick);}
    let animationTime=0;
    function update(time,moving=true) {
        if(moving)animationTime=time;
        for(const actor of actors) {
            const pose=trafficPose(actor.offset+animationTime*actor.speed,actor.lane);
            actor.group.position.set(pose.x,-0.01,pose.z);actor.group.rotation.y=pose.heading;
        }
        for(const walker of walkers) {
            const t=animationTime;
            walker.group.position.set(walker.x+Math.sin(t*0.19+walker.phase)*0.65,0.2,walker.z+Math.cos(t*0.19+walker.phase)*0.45);
            walker.group.rotation.y=Math.atan2(Math.cos(t*0.19+walker.phase)*walker.direction,-Math.sin(t*0.19+walker.phase));
            for(const limb of walker.group.userData.limbs)limb.pivot.rotation.x=Math.sin(t*2.8+walker.phase)*0.34*limb.side*(limb.part==='arm'?-1:1);
        }
    }
    update(0);
    return {scene,anchors,picks,actors,walkers,materials:ink,update,
        setInterior(open){cafeBuilding.userData.upper.visible=!open;cafeBuilding.userData.roof.visible=!open;},
        dispose(){
        const geometries=new Set(),ownedMaterials=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.name.includes('lettering')||object.userData.ownedMaterial)ownedMaterials.add(object.material);});
        for(const geometry of geometries)geometry.dispose();
        for(const material of ownedMaterials)material.dispose();
        for(const pick of picks)pick.material.dispose();ink.dispose();
    }};
}
