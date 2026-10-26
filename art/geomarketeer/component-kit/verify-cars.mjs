import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from '../../../assets/vendor/three/three.module.js';
import {createAssetLibrary} from '../../../scripts/geomarketeer-kit/library.js';
import {CAR_BASE,CAR_ANGLES,CAR_REVIEW_COPIES,CAR_SOURCE_OBJECTS,buildCar} from '../../../scripts/geomarketeer-kit/car.js';
import {CAFE_VARIANTS} from '../../../scripts/geomarketeer-kit/cafe.js';
import {OFFICE_VARIANTS} from '../../../scripts/geomarketeer-kit/office.js';
import {SMALL_VARIANTS} from '../../../scripts/geomarketeer-kit/small-building.js';
import {CAMERA,KitDrawing} from '../../../scripts/geomarketeer-kit/style.js';
import {REFERENCE} from '../../../scripts/geomarketeer-kit/inventory.js';
function hashGeometry(group){const h=createHash('sha256');group.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes)){const d=a.isInterleavedBufferAttribute?a.data.array:a.array;h.update(Buffer.from(d.buffer,d.byteOffset,d.byteLength));}});return h.digest('hex');}
const lib=createAssetLibrary(),asset=lib.createAsset({assetId:'hatchback'}),copy=lib.createAsset({assetId:'hatchback',instanceId:'copy'}),authored=buildCar(lib.materials),geometries=new Set(),materials=new Set();
assert.equal(asset.group.userData.approval,'approved');assert.equal(asset.group.userData.revision,CAR_BASE.revision);assert.equal(asset.group.userData.static,true);
assert.deepEqual(asset.group.position.toArray(),[0,0,0]);assert.deepEqual(asset.group.scale.toArray(),[1,1,1]);
const ours=[],theirs=[];asset.group.traverse(o=>{if(o.geometry)ours.push(o);});copy.group.traverse(o=>{if(o.geometry)theirs.push(o);});assert.equal(ours.length,4,'One surface and three stroke batches');
let triangles=0;for(const[i,o]of ours.entries()){
    assert.equal(o.geometry,theirs[i].geometry);assert.equal(o.material,theirs[i].material);geometries.add(o.geometry);materials.add(o.material);
    for(const a of Object.values(o.geometry.attributes))for(let n=0;n<a.count;n++)for(let c=0;c<a.itemSize;c++)assert(Number.isFinite(a[['getX','getY','getZ','getW'][c]](n)));
    if(o.isMesh&&!o.isLineSegments2){triangles+=o.geometry.getAttribute('position').count/3;assert.equal(o.material,lib.materials.faces,'Glazing retains the filled reference treatment');}
}
const box=new THREE.Box3().setFromObject(asset.group);assert(box.min.distanceTo(asset.bounds.min)<1e-5);assert(box.max.distanceTo(asset.bounds.max)<1e-5);assert(Math.abs(box.min.y)<1e-6);assert(Math.abs(box.max.y-CAR_BASE.height)<1e-6);
const wheelGroups=authored.group.children.filter(o=>o.userData.component==='wheel');assert.equal(wheelGroups.length,4);assert.equal(new Set(wheelGroups.map(hashGeometry)).size,1);
const wheelBuffers=wheelGroups.map(w=>{const all=[];w.traverse(o=>{if(o.geometry)all.push(o.geometry)});return all;});
for(const w of wheelGroups){const b=new THREE.Box3().setFromObject(w);assert(Math.abs(b.min.y)<1e-6,'Every actual tire touches grade');assert(Math.abs(b.max.y-CAR_BASE.wheelRadius*2)<1e-6);assert(Math.abs(Math.abs(w.position.x)-CAR_BASE.wheelbase/2)<1e-6);assert(Math.abs(Math.abs(w.position.z)-CAR_BASE.track/2)<1e-6);}
for(const buffers of wheelBuffers)for(const[i,g]of buffers.entries())assert.equal(g,wheelBuffers[0][i],'All four authored wheels share geometry');
const body=authored.group.getObjectByName('car/body');assert(Math.abs(new THREE.Box3().setFromObject(body).min.y-CAR_BASE.groundClearance)<1e-6);
let clearArchSamples=0;
for(const x of[-.7,.7])for(let i=0;i<=12;i++){
    const angle=i/12*Math.PI,r=CAR_BASE.wheelRadius+.018,origin=new THREE.Vector3(x+Math.cos(angle)*r,CAR_BASE.wheelRadius+Math.sin(angle)*r,1);
    assert.equal(new THREE.Raycaster(origin,new THREE.Vector3(0,0,-1),0,2).intersectObject(body.getObjectByName('car/body/surfaces')).length,0,'Actual wheel arch is clear around the tire');clearArchSamples++;
}
// Glazing triangles must sit outside their supporting cabin, including the
// cambered windshield where an approximate plane previously intersected it.
const cabin=authored.group.getObjectByName('car/cabin/surfaces'),glass=authored.group.getObjectByName('car/glazing/surfaces'),positions=glass.geometry.getAttribute('position');let glazingSamples=0;
for(let i=0;i<positions.count;i+=3){
    const center=new THREE.Vector3().add(new THREE.Vector3().fromBufferAttribute(positions,i)).add(new THREE.Vector3().fromBufferAttribute(positions,i+1)).add(new THREE.Vector3().fromBufferAttribute(positions,i+2)).multiplyScalar(1/3);
    const direction=Math.abs(center.z)>.40?new THREE.Vector3(0,0,Math.sign(center.z)):center.x>.23?new THREE.Vector3(1,1,0).normalize():new THREE.Vector3(-1,.75,0).normalize();
    assert.equal(new THREE.Raycaster(center.clone().addScaledVector(direction,.0001),direction,.0001,.07).intersectObject(cabin).length,0,'Glazing stays clear of the cabin surface');glazingSamples++;
}
const previewBounds=[];for(const spec of CAR_REVIEW_COPIES){assert(spec.reviewOnly&&spec.scale===1);const a=lib.createAsset({assetId:spec.assetId,variantId:spec.variantId,instanceId:spec.id});assert.equal(hashGeometry(a.group),hashGeometry(asset.group));a.group.position.set(...spec.position);a.group.rotation.y=spec.rotation;a.group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(a.group);for(const prev of previewBounds)assert(!b.intersectsBox(prev),'Review copies have physical clearance');previewBounds.push(b);assert(Math.abs(b.min.y)<1e-6);}
assert.equal(CAR_REVIEW_COPIES.length,3);assert.equal(CAR_ANGLES.length,4);
let authoredTriangles=0;const owned=new Set();authored.group.traverse(o=>{if(o.geometry)owned.add(o.geometry);if(o.isMesh&&!o.isLineSegments2)authoredTriangles+=o.geometry.getAttribute('position').count/3;});assert.equal(triangles,authoredTriangles);
copy.bounds.max.y+=20;copy.anchors.front.x+=20;assert.notEqual(copy.bounds.max.y,asset.bounds.max.y);assert.notEqual(copy.anchors.front.x,asset.anchors.front.x);
assert.throws(()=>lib.createAsset({assetId:'hatchback',variantId:'missing'}),/not available/);assert.throws(()=>buildCar(lib.materials,'missing'),/Unknown hatchback/);
const inventory=JSON.parse(await readFile(new URL('./inventory.json',import.meta.url),'utf8'));assert.deepEqual(inventory.car.base,CAR_BASE);assert.deepEqual(inventory.car.sourceObjects,CAR_SOURCE_OBJECTS);assert.equal(CAR_SOURCE_OBJECTS.length,13);assert.equal(new Set(CAR_SOURCE_OBJECTS.map(o=>o.id)).size,13);assert(CAR_SOURCE_OBJECTS.every(o=>o.variantId==='standard'&&o.placementStatus==='unplaced'&&o.reviewStatus==='approved'));assert(inventory.instances.every(o=>o.assetId==='residential-tower'));assert(inventory.smallBuildings.sourceObjects.every(o=>o.reviewStatus==='approved'&&o.placementStatus==='unplaced'));
for(const[assetId,specs,file]of[['cafe',CAFE_VARIANTS,'approved-cafe-geometry.json'],['office',OFFICE_VARIANTS,'approved-office-geometry.json'],['small-building',SMALL_VARIANTS,'approved-small-building-geometry.json']]){const snapshot=JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));for(const spec of specs){const a=lib.createAsset({assetId,variantId:spec.id});assert.equal(a.group.userData.approval,'approved');assert.equal(hashGeometry(a.group),snapshot.hashes[spec.id]);}}
assert.equal(hashGeometry(lib.createAsset({assetId:'residential-tower'}).group),(await readFile(new URL('approved-tower-geometry.sha256',import.meta.url),'utf8')).trim());
for(const g of owned)g.dispose();let disposedGeometry=0,disposedMaterial=0;for(const g of geometries)g.addEventListener('dispose',()=>disposedGeometry++);for(const m of materials)m.addEventListener('dispose',()=>disposedMaterial++);lib.dispose();lib.dispose();assert.equal(disposedGeometry,geometries.size);assert.equal(disposedMaterial,materials.size);

// The same real viewer is exercised with a stub DOM/renderer boundary.
const viewer=await readFile(new URL('../../../scripts/geomarketeer-kit/car-viewer.js',import.meta.url),'utf8');
function fixture({reduced=false,narrow=false,medium=false,query=''}={}){
    let now=0,id=0,frames=new Map(),renders=[],rendererDisposed=false,rectangles=[];
    function element(tag='div'){return{tagName:typeof tag==='string'?tag.toUpperCase():'DIV',dataset:{},style:{},hidden:false,disabled:false,textContent:'',value:'',clientWidth:632,clientHeight:480,children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;},setAttribute(k,v){this[k]=v;},append(...v){this.children.push(...v);},prepend(...v){this.children.unshift(...v);},addEventListener(type,fn){this.listeners[type]=fn;},dispatch(type,event={}){this.listeners[type]?.(event);},setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};}
    const elements=new Map(),get=id=>{if(!elements.has(id)){const value=element();if(id==='carViewport')value.clientHeight=narrow?1400:740;elements.set(id,value);}return elements.get(id);};
    const actions=['left','right','in','out','reset','reload'].map(action=>Object.assign(element('button'),{dataset:{action}}));
    const modes=['single','angles','copies','scale'].map(mode=>Object.assign(element('button'),{dataset:{mode}}));
    const focuses=['whole','openings','roof'].map(focus=>Object.assign(element('button'),{dataset:{focus}}));
    const media={...element(),matches:reduced};
    const document={...element(),hidden:false,body:element(),getElementById:get,createElement:element,createTextNode:s=>({textContent:s}),querySelector:s=>get(s),querySelectorAll:s=>s==='[data-action]'?actions:s==='[data-mode]'?modes:s==='button[data-focus]'?focuses:s==='#anglePicks button'?get('anglePicks').children:[...actions,...modes,...focuses,...get('anglePicks').children]};
    const window=element();
    class Renderer{constructor(){this.domElement=element('canvas');this.info={render:{calls:0,triangles:0},reset(){this.render.calls=0;}};}setPixelRatio(){}setSize(){}setScissorTest(){}setViewport(x,y,w,h){assert(w>0&&h>0);rectangles.push({x,y,w,h});}setScissor(){}clear(){}render(scene,camera){assert(Number.isFinite(camera.left));renders.push({id:scene.children[0].name,camera:camera.clone(),count:scene.children.filter(o=>o.userData.assetId==='hatchback').length});if(camera.zoom===1){const bounds=new THREE.Box3().setFromObject(scene);for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001,'Model fits at supported camera angles');}}this.info.render.calls++;}dispose(){rendererDisposed=true;}}
    vm.runInNewContext(viewer.replace(/^import .*;\n/gm,''),{THREE:{...THREE,WebGLRenderer:Renderer},createAssetLibrary,CAR_BASE,CAR_ANGLES,CAR_REVIEW_COPIES,CAMERA,KitDrawing,REFERENCE,document,window,matchMedia:q=>q.includes('reduced')?media:{...element(),matches:q.includes('650px')?narrow:q.includes('1100px')?medium||narrow:false},URLSearchParams,URL,location:{search:query,href:'http://localhost/review'+query,replace(){}},devicePixelRatio:1,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}disconnect(){}},console});
    const step=(count=120)=>{for(let i=0;i<count;i++){now+=16.667;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
    const click=(data,fromBoard=false)=>get('carStudy').dispatch('click',{target:{closest:()=>({dataset:data,closest:()=>fromBoard})}});
    const key=key=>get('carViewport').dispatch('keydown',{key,preventDefault(){}});
    return{get,step,click,key,document,window,media,actions,focuses,frames:()=>frames.size,renders:()=>renders,rectangles:()=>rectangles,disposed:()=>rendererDisposed};
}

const f=fixture();assert.equal(f.get('carStudy').dataset.state,'ready');assert.equal(f.get('carStudy').dataset.angle,'reference');
for(const spec of CAR_ANGLES){f.click({angle:spec.id});assert.equal(f.get('carStudy').dataset.angle,spec.id);assert.equal(f.renders().at(-1).id,`review-angle/${spec.id}`);assert.equal(f.get('sourceCropRect').x,CAR_BASE.referenceCrop[0]);}
f.click({mode:'angles'});assert.deepEqual(f.renders().slice(-4).map(r=>r.id),CAR_ANGLES.map(s=>`review-angle/${s.id}`));const cameras=f.renders().slice(-4).map(r=>r.camera);assert(cameras.every(c=>c.top===cameras[0].top));assert.equal(new Set(f.rectangles().slice(-4).map(r=>r.x)).size,2);
f.click({angle:'rear'},true);assert(f.get('carViewport').focused&&f.get('carViewport').scrolled);
for(let i=0;i<8;i++)f.click({action:'right'});f.step();assert.equal(f.get('carStudy').dataset.orbit,'15.00');assert(f.actions.find(b=>b.dataset.action==='right').disabled);
for(let i=0;i<20;i++)f.key('ArrowLeft');f.step();assert.equal(f.get('carStudy').dataset.orbit,'-15.00');for(let i=0;i<12;i++)f.key('+');f.step();assert.equal(f.get('carStudy').dataset.zoom,'3.00');
f.click({angle:'front'});assert.equal(f.get('carStudy').dataset.orbit,'0.00');assert.equal(f.get('carStudy').dataset.zoom,'1.00');f.click({mode:'copies'});assert.equal(f.renders().at(-1).count,3);assert.equal(f.get('carStudy').dataset.mode,'copies');f.click({action:'right'});f.step();f.key('0');f.step();assert.equal(f.get('carStudy').dataset.orbit,'0.00');
f.click({mode:'scale'});assert.equal(f.get('carStudy').dataset.mode,'scale');f.key('0');f.step();assert.equal(f.frames(),0);
const pointer={button:0,isPrimary:true,pointerId:1,pointerType:'touch',clientX:500,target:{closest:()=>null}};f.get('carViewport').dispatch('pointerdown',pointer);f.get('carViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step();assert.equal(f.get('carStudy').dataset.orbit,'0.00');f.get('touchExplore').dispatch('click',{currentTarget:f.get('touchExplore')});f.get('carViewport').dispatch('pointerdown',pointer);f.get('carViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step(1);assert.equal(f.get('carStudy').dataset.orbit,'-15.00');f.get('carViewport').dispatch('pointercancel',{pointerId:1});f.key('0');f.step();
f.click({action:'in'});f.document.hidden=true;f.document.dispatch('visibilitychange');assert.equal(f.frames(),0);f.document.hidden=false;f.document.dispatch('visibilitychange');f.step();f.window.dispatch('pagehide',{persisted:false});assert(f.disposed());
const r=fixture({reduced:true,narrow:true,query:'?angle=side'});assert.equal(r.get('carStudy').dataset.angle,'side');r.key('ArrowRight');r.step(1);assert.equal(r.get('carStudy').dataset.orbit,'3.00');r.click({mode:'angles'});assert.equal(new Set(r.rectangles().slice(-4).map(v=>v.x)).size,1);r.window.dispatch('pagehide',{persisted:false});
const s=fixture({query:'?view=still&angle=rear'});assert.equal(s.get('carStudy').dataset.state,'fallback');assert(s.get('fallbackStill').src.endsWith(`hatchback-rear-still.jpg?v=${CAR_BASE.revision}`));
const report={checkpoint:'cars-05',revision:CAR_BASE.revision,status:'approved',masters:1,sourceCars:13,reviewCopies:3,neighborhoodCarInstances:0,surfaceTriangles:triangles,geometryBatches:ours.length,clearArchSamples,glazingSamples,approvedFamiliesUnchanged:true,checks:['all three review copies share geometry and materials with one master','four byte-identical wheels with shared authoring buffers','actual tire bounds contact grade','ray checks around both wheel arches','glazing triangles clear the cambered cabin surface','finite buffers, actual bounds, local origin and declared height','authored/compiled surface triangle parity','independent bounds and anchors','shared-resource disposal once','three review copies do not overlap and have no neighborhood placements','thirteen stable source IDs map to one standard hatchback','approved tower, cafés, offices and small-building geometry fingerprints unchanged','four camera presets render one master at equal board scale','orthographic framing fits the model at supported orbit angles','three-copy mode and scene-scale view','desktop and phone board breakpoints','board selection reveals the selected angle','±15 degree orbit, 100–300 percent zoom, reset and keyboard controls','touch opt-in and cancellation','idle rendering, hidden-page pause and reduced motion','angle-specific saved fallback']};
await writeFile(new URL('../../../reports/component-kit/cars/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
