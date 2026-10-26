import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../../../assets/vendor/three/three.module.js';
import { createAssetLibrary } from '../../../scripts/geomarketeer-kit/library.js';
import { buildTower,TOWER } from '../../../scripts/geomarketeer-kit/tower.js';
import { CAMERA,KitDrawing } from '../../../scripts/geomarketeer-kit/style.js';
import { REFERENCE,FAMILIES,TOWER_INSTANCES,fromReference } from '../../../scripts/geomarketeer-kit/inventory.js';

const lib=createAssetLibrary();
const assets=TOWER_INSTANCES.map(spec=>lib.createAsset({assetId:spec.assetId,variantId:spec.variantId,instanceId:spec.id}));
assert.equal(assets.length,5);assert.equal(new Set(TOWER_INSTANCES.map(s=>s.id)).size,5);
assert.deepEqual(fromReference(REFERENCE.origin),[0,0,0]);
const geometries=new Set(),materials=new Set();let triangles=0;
for(const[index,asset]of assets.entries()){
    assert.equal(asset.group.userData.floors,8);assert.equal(asset.group.userData.balconies,16);assert.equal(asset.group.userData.windows,90);
    assert.equal(asset.group.userData.approval,'approved');assert.deepEqual(asset.group.scale.toArray(),[1,1,1]);
    assert(asset.bounds.min.y>=-.00001,'No tower geometry below grade');
    const actualBounds=new THREE.Box3().setFromObject(asset.group);assert(actualBounds.min.distanceTo(asset.bounds.min)<.00001);assert(actualBounds.max.distanceTo(asset.bounds.max)<.00001);
    asset.group.traverse(object=>{
        if(!object.geometry)return;geometries.add(object.geometry);materials.add(object.material);
        for(const key of['map','normalMap','alphaMap','emissiveMap'])assert(!object.material[key],'3D art must not use raster textures');
        for(const attribute of Object.values(object.geometry.attributes))for(let i=0;i<attribute.count;i++)for(let c=0;c<attribute.itemSize;c++)assert(Number.isFinite(attribute[['getX','getY','getZ','getW'][c]](i)),'Finite geometry');
        if(index===0&&object.isMesh&&!object.isLineSegments2)triangles+=object.geometry.getAttribute('position').count/3;
    });
    if(index){for(let child=0;child<asset.group.children.length;child++){
        assert.equal(asset.group.children[child].geometry,assets[0].group.children[child].geometry,'Instances share geometry by reference');
        assert.equal(asset.group.children[child].material,assets[0].group.children[child].material,'Instances share materials by reference');
    }}
    asset.group.position.fromArray(TOWER_INSTANCES[index].position);asset.group.updateMatrixWorld(true);
}
assert.equal(geometries.size,4,'One surface and three stroke batches');
assert.equal(assets[0].group.children.length,4);
for(let a=0;a<assets.length;a++)for(let b=a+1;b<assets.length;b++)assert(!new THREE.Box3().setFromObject(assets[a].group).intersectsBox(new THREE.Box3().setFromObject(assets[b].group)),'Repeated towers must not intersect');
assets[0].anchors.entrance.set(99,99,99);assert(assets[1].anchors.entrance.x!==99,'Anchor copies are independent');
assert.throws(()=>lib.createAsset({assetId:'cafe-shell'}),/not available/);
assert.throws(()=>lib.createAsset({assetId:TOWER.id,variantId:'tall'}),/not available/);
const authored=buildTower(lib.materials),surface=assets[0].group.children[0].geometry;
let authoredTriangles=0;authored.group.traverse(o=>{if(o.isMesh&&!o.isLineSegments2)authoredTriangles+=o.geometry.getAttribute('position').count/3;});
assert.equal(triangles,authoredTriangles,'Batching preserves every authored surface triangle');
assert.equal(surface.getAttribute('normal').count,surface.getAttribute('position').count);
const authoredGeometries=new Set();authored.group.traverse(o=>{if(o.geometry)authoredGeometries.add(o.geometry);});for(const geometry of authoredGeometries)geometry.dispose();
let geometryDisposals=0,materialDisposals=0;
for(const geometry of geometries)geometry.addEventListener('dispose',()=>geometryDisposals++);
for(const material of materials)material.addEventListener('dispose',()=>materialDisposals++);
lib.dispose();lib.dispose();assert.equal(geometryDisposals,4);assert.equal(materialDisposals,materials.size);
assert.throws(()=>lib.createAsset({assetId:TOWER.id}),/disposed/);
const stored=JSON.parse(await readFile(new URL('./inventory.json',import.meta.url),'utf8'));
assert.deepEqual(stored.instances,TOWER_INSTANCES);assert.deepEqual(stored.families,FAMILIES);

// Execute the actual viewer, with a stub DOM/renderer and the real 3D model and
// camera. This covers event state and lifecycle without mocking the behavior.
const viewer=await readFile(new URL('../../../scripts/geomarketeer-kit/viewer.js',import.meta.url),'utf8');
function fixture(reduced=false,query=''){
    let now=0,id=0,lastCamera=null,frames=new Map(),disposed=false;
    function element(){return{dataset:{},style:{},hidden:false,disabled:false,textContent:'',value:'',clientWidth:675,clientHeight:480,children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this[k]=v;},append(...v){this.children.push(...v);},addEventListener(type,fn){this.listeners[type]=fn;},dispatch(type,event={}){this.listeners[type]?.(event);},setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};}
    const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
    const buttons=['left','right','out','in','reset','reload'].map(action=>Object.assign(element(),{dataset:{action}}));
    const modes=['master','repeat','scale'].map(view=>Object.assign(element(),{dataset:{view}}));
    const document={...element(),hidden:false,body:element(),getElementById:get,createElement:element,createElementNS:element,querySelectorAll:s=>s==='[data-action]'?buttons:modes,querySelector:s=>get(s)};
    const window=element(),media={...element(),matches:reduced};
    class Renderer{constructor(){this.domElement=element();this.info={render:{calls:0,triangles:0}};}setPixelRatio(){}setSize(){}render(scene,camera){lastCamera=camera.clone();}dispose(){disposed=true;}}
    vm.runInNewContext(viewer.replace(/^import .*;\n/gm,''),{THREE:{...THREE,WebGLRenderer:Renderer},createAssetLibrary,CAMERA,KitDrawing,REFERENCE,FAMILIES,TOWER_INSTANCES,document,window,matchMedia:query=>query.includes('reduced')?media:{...element(),matches:false},URLSearchParams,location:{search:query,reload(){}},devicePixelRatio:1,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}disconnect(){}},console});
    const step=(count=120)=>{for(let i=0;i<count;i++){now+=16.667;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
    const click=action=>get('componentStudy').dispatch('click',{target:{closest:()=>buttons.find(b=>b.dataset.action===action)}});
    const mode=view=>get('componentStudy').dispatch('click',{target:{closest:()=>modes.find(b=>b.dataset.view===view)}});
    const key=key=>get('kitViewport').dispatch('keydown',{key,preventDefault(){}});
    return {get,step,click,mode,key,media,document,window,buttons,getCamera:()=>lastCamera,getDisposed:()=>disposed,frames:()=>frames.size};
}
const f=fixture();assert.equal(f.get('componentStudy').dataset.state,'ready');
const initialCamera=f.getCamera().position.clone();
for(let i=0;i<10;i++)f.click('right');f.step();assert.equal(f.get('componentStudy').dataset.orbit,'15.00');assert(f.buttons.find(b=>b.dataset.action==='right').disabled);assert(!initialCamera.equals(f.getCamera().position),'Orbit changes the real camera');
for(let i=0;i<20;i++)f.key('ArrowLeft');f.step();assert.equal(f.get('componentStudy').dataset.orbit,'-15.00');
for(let i=0;i<15;i++)f.key('+');f.step();assert.equal(f.get('componentStudy').dataset.zoom,'3.00');
for(let i=0;i<15;i++)f.key('-');f.step();assert.equal(f.get('componentStudy').dataset.zoom,'1.00');
f.click('right');f.step(1);f.click('in');f.click('reset');f.step();assert.equal(f.get('componentStudy').dataset.orbit,'0.00');assert.equal(f.get('componentStudy').dataset.zoom,'1.00');
f.mode('repeat');assert.equal(f.get('componentStudy').dataset.mode,'repeat');f.mode('scale');assert.equal(f.get('componentStudy').dataset.mode,'scale');f.mode('master');
f.get('kitViewport').dispatch('pointerdown',{button:0,isPrimary:true,pointerId:1,pointerType:'mouse',clientX:500});f.get('kitViewport').dispatch('pointermove',{pointerId:1,clientX:1000});f.step(1);assert.equal(f.get('componentStudy').dataset.orbit,'-15.00');f.get('kitViewport').dispatch('pointercancel',{pointerId:1});f.key('0');f.step();
f.get('kitViewport').dispatch('pointerdown',{button:0,isPrimary:true,pointerId:2,pointerType:'touch',clientX:500});f.get('kitViewport').dispatch('pointermove',{pointerId:2,clientX:1000});f.step();assert.equal(f.get('componentStudy').dataset.orbit,'0.00','Touch scroll does not rotate before opt-in');
f.get('touchExplore').dispatch('click',{currentTarget:f.get('touchExplore')});f.get('kitViewport').dispatch('pointerdown',{button:0,isPrimary:true,pointerId:3,pointerType:'touch',clientX:500});f.get('kitViewport').dispatch('pointermove',{pointerId:3,clientX:1000});f.step(1);assert.equal(f.get('componentStudy').dataset.orbit,'-15.00');f.get('kitViewport').dispatch('pointerup',{pointerId:3});
f.step();assert.equal(f.frames(),0,'Idle scene does not keep rendering');
f.click('right');f.document.hidden=true;f.document.dispatch('visibilitychange');assert.equal(f.frames(),0);f.document.hidden=false;f.document.dispatch('visibilitychange');f.step();
f.window.dispatch('pagehide',{persisted:false});assert(f.getDisposed());
const r=fixture(true);r.key('ArrowRight');r.step(1);assert.equal(r.get('componentStudy').dataset.orbit,'3.00');r.key('+');r.step(1);assert.equal(r.get('componentStudy').dataset.zoom,'1.25');r.window.dispatch('pagehide',{persisted:false});
const s=fixture(false,'?view=still');assert.equal(s.get('componentStudy').dataset.state,'fallback');assert.equal(s.get('fallbackStill').hidden,false);

const report={checkpoint:'residential-tower-01',approval:'approved',instances:5,floors:8,balconies:16,windows:90,uniqueGeometryBatches:4,authoredSurfaceTriangles:triangles,checks:['identical shared geometry and material references','finite surface and stroke attributes','no textures','ground contact','non-intersecting tower placements','independent anchors','unknown assets and variants rejected','compiled/authored triangle parity','idempotent shared-resource disposal','inventory parity','actual camera orbit and zoom limits','rapid action reset','all three view modes','pointer cancellation','touch opt-in','on-demand idle','hidden-page pause','reduced-motion immediate controls','still fallback']};
await writeFile(new URL('../../../reports/component-kit/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
