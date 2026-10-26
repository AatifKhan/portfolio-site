import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../../assets/vendor/three/three.module.js';
import {createApprovedNeighborhood,BUILDINGS,REFERENCE,PIXELS_PER_UNIT,fromReference} from '../../scripts/geomarketeer-neighborhood-model.js';
import {BENCHES,CAPSULE_TREES,CONIFERS,ROUND_TREES,PLANTERS,LAMPS,BOLLARDS,TABLES} from '../../scripts/geomarketeer-neighborhood-details.js';

const model=createApprovedNeighborhood(),names=new Set();
let surfaces=0,strokes=0,triangles=0,textures=0,minY=Infinity;
model.scene.traverse(object=>{
    if(object.name){assert(!names.has(object.name),`Duplicate object ${object.name}`);names.add(object.name);}
    if(object.isLineSegments2)strokes++;
    else if(object.isMesh){surfaces++;triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3;}
    for(const attribute of Object.values(object.geometry?.attributes||{}))for(const value of attribute.array)assert(Number.isFinite(value),`${object.name}: invalid geometry`);
    if(object.isMesh&&!object.isLineSegments2){
        const positions=object.geometry.attributes.position;
        for(let i=0;i<positions.count;i++)minY=Math.min(minY,new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld).y);
    }
    for(const material of [object.material].flat().filter(Boolean))for(const value of Object.values(material))if(value?.isTexture)textures++;
});
assert.equal(BUILDINGS.length,5);assert.equal(model.cars.length,5);assert.equal(textures,0);
assert(minY>-.3,'Geometry is unexpectedly below the street; check roof vertex coordinate order.');
assert(surfaces+strokes<100);assert(triangles<225000,'Detailed geometry exceeds the 225k surface-triangle budget.');
const expectedKinds={'capsule-tree':9,conifer:7,'round-tree':2,bench:3,table:3,planter:17,lamp:7,bollard:7,person:7,car:5};
for(const[kind,count]of Object.entries(expectedKinds))assert.equal(Object.values(model.features).filter(f=>f.kind===kind).length,count,`${kind}: source inventory count drifted`);
assert.equal(BENCHES[0].heading,-Math.PI/2,'The west bench must remain perpendicular to the other two.');
const windows={};model.scene.traverse(o=>{if(o.userData.windowCells)windows[o.userData.place]=o.userData.windowCells;});
assert.equal(windows.offices.filter(w=>w.axis==='front').length,17);assert.equal(windows.offices.filter(w=>w.axis==='side').length,24);
assert.equal(windows.cafe.length,4);assert.equal(windows.home.length,7);assert.equal(windows.apartments.length,17);
assert.equal(Object.values(windows).reduce((n,w)=>n+w.length,0),70,'Verified façade cell count drifted');
const profile=model.materials.line('profile','cafe'),hair=model.materials.line('hair');
model.materials.resize(1448,1086,1086/PIXELS_PER_UNIT,1);assert(profile.opacity>.99&&hair.opacity>.74);
model.materials.resize(370,280,1448/PIXELS_PER_UNIT/(370/280),1);assert(profile.opacity<.01&&hair.opacity<.01,'Secondary contours must fade before they merge on mobile');
const camera=new THREE.OrthographicCamera(-REFERENCE.width/PIXELS_PER_UNIT/2,REFERENCE.width/PIXELS_PER_UNIT/2,REFERENCE.height/PIXELS_PER_UNIT/2,-REFERENCE.height/PIXELS_PER_UNIT/2,.1,300);
const y=(REFERENCE.originY-REFERENCE.height/2)/REFERENCE.unit;
camera.position.set(Math.sin(REFERENCE.yaw)*Math.cos(REFERENCE.pitch)*85,y+Math.sin(REFERENCE.pitch)*85,Math.cos(REFERENCE.yaw)*Math.cos(REFERENCE.pitch)*85);camera.lookAt(0,y,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
for(const b of BUILDINGS){
    const point=fromReference(...b.roof,b.h).project(camera);
    assert(Math.abs((point.x+1)*REFERENCE.width/2-b.roof[0])<.001,`${b.id}: roof x drift`);
    assert(Math.abs((1-point.y)*REFERENCE.height/2-b.roof[1])<.001,`${b.id}: roof y drift`);
    const a=model.bounds[b.id];
    for(const [dx,dz]of[[0,0],[a.w,0],[0,a.d],[a.w,a.d]]){
        const p=new THREE.Vector3(a.x+dx,0,a.z+dz).project(camera);assert(Math.abs(p.x)<1.02&&Math.abs(p.y)<1.02,`${b.id}: footprint cropped`);
    }
}
for(const spec of [...BENCHES,...CAPSULE_TREES,...CONIFERS,...ROUND_TREES,...PLANTERS,...LAMPS,...BOLLARDS,...TABLES]){
    const landmark=spec.seat||spec.rim||spec.top||spec.foot;
    const point=new THREE.Vector3(...model.features[spec.id].point).project(camera);
    assert(Math.abs((point.x+1)*REFERENCE.width/2-landmark[0])<.001,`${spec.id}: measured x drift`);
    assert(Math.abs((1-point.y)*REFERENCE.height/2-landmark[1])<.001,`${spec.id}: measured y drift`);
}
model.dispose();

// Execute the actual viewer with a lightweight browser boundary and a real Three camera.
const viewer=await readFile(new URL('../../scripts/geomarketeer-neighborhood-viewer.js',import.meta.url),'utf8');
function fixture(reduced=false){
    let now=0,frames=new Map(),id=0,lastCamera;
    const eventTarget=()=>({listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},dispatch(type,event={}){this.listeners[type]?.(event);}});
    const elements={};
    for(const key of ['neighborhoodStudy','neighborhoodViewport','compareToggle','orbitOutput','zoomOutput','sceneStatus','comparison','referencePanel','sceneLoading','sceneError'])elements[key]={...eventTarget(),dataset:{},style:{},hidden:false,clientWidth:1448,clientHeight:1086,classList:{toggle(){},add(){},remove(){}},append(){},setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){},textContent:''};
    const buttons=Object.fromEntries(['left','right','in','out','reset'].map(name=>[name,{dataset:{action:name},disabled:false}]));
    elements.neighborhoodStudy.querySelector=selector=>buttons[selector.match(/"(.*?)"/)[1]];
    class Renderer{constructor(){this.domElement={setAttribute(){},addEventListener(){}};this.info={render:{calls:61,triangles:0}};}setPixelRatio(){}setClearColor(){}setSize(){}render(scene,camera){lastCamera=camera.clone();}dispose(){}}
    const media={...eventTarget(),matches:reduced};
    const document={...eventTarget(),hidden:false,getElementById:id=>elements[id]};
    const context={THREE:{...THREE,WebGLRenderer:Renderer},createApprovedNeighborhood,REFERENCE,PIXELS_PER_UNIT,document,window:eventTarget(),matchMedia:()=>media,devicePixelRatio:1,performance:{now:()=>now},ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),location:{reload(){}},console};
    vm.runInNewContext(viewer.replace(/^import .*;\n/gm,''),context);
    const step=(count=1)=>{for(let i=0;i<count;i++){now+=16.667;const current=[...frames.values()];frames.clear();for(const fn of current)fn(now);}};
    const click=name=>elements.neighborhoodStudy.dispatch('click',{target:{closest:()=>buttons[name]}});
    const key=k=>elements.neighborhoodViewport.dispatch('keydown',{key:k,preventDefault(){}});
    return {elements,buttons,media,step,click,key,getCamera:()=>lastCamera};
}
const f=fixture();
for(let i=0;i<12;i++)f.click('right');f.step(120);assert.equal(f.elements.neighborhoodStudy.dataset.orbit,'15');assert(f.buttons.right.disabled);
for(let i=0;i<24;i++)f.click('left');f.step(120);assert.equal(f.elements.neighborhoodStudy.dataset.orbit,'-15');assert(f.buttons.left.disabled);
f.key('+');f.key('+');f.key('+');f.step(120);assert.equal(f.elements.neighborhoodStudy.dataset.zoom,'120');assert(f.buttons.in.disabled);
for(let i=0;i<8;i++)f.key('-');f.step(120);assert.equal(f.elements.neighborhoodStudy.dataset.zoom,'80');assert(f.buttons.out.disabled);
f.click('right');f.step(2);f.click('left');f.click('reset');f.step(120);assert.equal(f.elements.neighborhoodStudy.dataset.orbit,'0');assert.equal(f.elements.neighborhoodStudy.dataset.zoom,'100');
const before=f.getCamera().position.clone();f.key('ArrowRight');f.step(120);assert(!before.equals(f.getCamera().position),'Rotation must change the 3D camera position.');
f.elements.neighborhoodViewport.dispatch('pointerdown',{button:0,isPrimary:true,pointerId:1,clientX:800});f.elements.neighborhoodViewport.dispatch('pointermove',{pointerId:1,clientX:1600});f.step();assert.equal(f.elements.neighborhoodStudy.dataset.orbit,'-15');f.elements.neighborhoodViewport.dispatch('pointercancel',{pointerId:1});f.key('0');f.step(120);assert.equal(f.elements.neighborhoodStudy.dataset.orbit,'0');
const r=fixture(true);r.click('right');r.step();assert.equal(r.elements.neighborhoodStudy.dataset.orbit,'3','Reduced motion must update immediately.');r.key('+');r.step();assert.equal(r.elements.neighborhoodStudy.dataset.zoom,'110');
const report={buildings:BUILDINGS.length,cars:5,surfaces,strokes,triangles,textures,minY,checks:['measured feature counts','70 verified window cells','bench orientation','55 measured landmark projections','secondary contour fading','finite geometry','no below-ground roof geometry','calibrated roof landmarks','visible building footprints','orbit limits','zoom limits','latest-action settling','true camera rotation','pointer cancellation','keyboard reset','immediate reduced motion']};
await mkdir(new URL('../../reports/approved-neighborhood/',import.meta.url),{recursive:true});await writeFile(new URL('../../reports/approved-neighborhood/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
