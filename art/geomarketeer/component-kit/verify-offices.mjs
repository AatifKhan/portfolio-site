import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from '../../../assets/vendor/three/three.module.js';
import {createAssetLibrary} from '../../../scripts/geomarketeer-kit/library.js';
import {OFFICE_BASE,OFFICE_VARIANTS,buildOffice} from '../../../scripts/geomarketeer-kit/office.js';
import {CAFE_VARIANTS} from '../../../scripts/geomarketeer-kit/cafe.js';
import {CAMERA,KitDrawing} from '../../../scripts/geomarketeer-kit/style.js';
import {REFERENCE} from '../../../scripts/geomarketeer-kit/inventory.js';

function hashGeometry(group){const h=createHash('sha256');group.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes)){const data=a.isInterleavedBufferAttribute?a.data.array:a.array;h.update(Buffer.from(data.buffer,data.byteOffset,data.byteLength));}});return h.digest('hex');}
const lib=createAssetLibrary(),geometries=new Set(),materials=new Set(),metrics=[],moduleHashes=new Set();
assert.equal(OFFICE_VARIANTS.length,3);assert.equal(new Set(OFFICE_VARIANTS.map(s=>s.id)).size,3);
for(const spec of OFFICE_VARIANTS){
    const asset=lib.createAsset({assetId:'office',variantId:spec.id}),copy=lib.createAsset({assetId:'office',variantId:spec.id,instanceId:'copy'}),authored=buildOffice(lib.materials,spec.id);
    assert.equal(asset.group.userData.approval,'approved');assert.equal(asset.group.userData.revision,OFFICE_BASE.revision);
    assert.deepEqual(asset.group.position.toArray(),[0,0,0]);assert.deepEqual(asset.group.scale.toArray(),[1,1,1]);
    assert(Math.abs(asset.bounds.min.y)<1e-6,'Ground contact');
    const actual=new THREE.Box3().setFromObject(asset.group);assert(actual.min.distanceTo(asset.bounds.min)<1e-5);assert(actual.max.distanceTo(asset.bounds.max)<1e-5);
    const ours=[],theirs=[];asset.group.traverse(o=>{if(o.geometry)ours.push(o);});copy.group.traverse(o=>{if(o.geometry)theirs.push(o);});
    assert.equal(ours.length,5,'One filled surface, three stroke weights, one transparent glazing batch');
    let triangles=0,glazing=0;
    for(let i=0;i<ours.length;i++){
        const o=ours[i];assert.equal(o.geometry,theirs[i].geometry);assert.equal(o.material,theirs[i].material);geometries.add(o.geometry);materials.add(o.material);
        for(const a of Object.values(o.geometry.attributes))for(let n=0;n<a.count;n++)for(let c=0;c<a.itemSize;c++)assert(Number.isFinite(a[['getX','getY','getZ','getW'][c]](n)));
        for(const key of['map','normalMap','alphaMap','emissiveMap'])assert(!o.material[key]);
        if(o.isMesh&&!o.isLineSegments2){triangles+=o.geometry.getAttribute('position').count/3;if(o.material===lib.materials.glazing){glazing++;assert(o.material.transparent&&!o.material.depthWrite);}}
    }
    assert.equal(glazing,1);
    const height=spec.groundHeight+(spec.floors-1)*spec.floorHeight;assert.equal(asset.group.userData.height,height);
    let authoredTriangles=0,bays=0;const owned=new Set();
    authored.group.traverse(o=>{if(o.geometry)owned.add(o.geometry);if(o.isMesh&&!o.isLineSegments2)authoredTriangles+=o.geometry.getAttribute('position').count/3;});
    assert.equal(triangles,authoredTriangles,'Compilation keeps all faces');
    for(const side of['front','right','back','left']){
        const facade=authored.group.getObjectByName(`office/facade-${side}`);const rows=facade.children.filter(o=>o.name.includes('/floor-'));assert.equal(rows.length,spec.floors);
        for(const [floor,row]of rows.entries()){
            assert.equal(row.position.y,(floor===0?0:spec.groundHeight+(floor-1)*spec.floorHeight)+OFFICE_BASE.windowSill);
            const width=side==='front'||side==='back'?spec.width:spec.depth;
            for(const bay of row.children){
                bays++;moduleHashes.add(hashGeometry(bay));
                assert(Math.abs(bay.position.x)+OFFICE_BASE.windowPitch/2<width/2,'Window stays inside its façade');
                if(side===spec.entryFace&&floor===0)assert(bay.position.x+OFFICE_BASE.windowPitch/2<=spec.entryCenter-spec.entryWidth/2-.055||bay.position.x-OFFICE_BASE.windowPitch/2>=spec.entryCenter+spec.entryWidth/2+.055,'Window does not cross the entrance opening');
            }
            if((side==='right'||side==='left')&&spec.sideWindows==='paired')assert.equal(row.children.length,4);
        }
    }
    assert.equal(bays,asset.group.userData.bays);
    const entry=authored.group.getObjectByName('office/shared-entry'),entryBox=new THREE.Box3().setFromObject(entry);
    assert(Math.abs(entryBox.min.y)<1e-6,'Canopy supports meet grade');assert(entry.userData.clearDoorWidth>=.75);
    const entryRay=new THREE.Raycaster(authored.anchors.entrance.clone().setY(.5),spec.entryFace==='right'?new THREE.Vector3(-1,0,0):new THREE.Vector3(0,0,-1));
    assert.equal(entryRay.intersectObject(authored.group.getObjectByName(`office/ground-${spec.entryFace}`),true).length,0,'The lobby is a real wall opening');
    if(spec.id==='low-wing')assert.equal(authored.group.getObjectByName('office/front/floor-1').children.length,authored.group.getObjectByName('office/front/floor-2').children.length,'Reference-visible wing front keeps uninterrupted bands');
    assert.equal(Boolean(authored.group.getObjectByName('office/rooftop-enclosure')),spec.roofService!=='none');
    assert.equal(Boolean(authored.group.getObjectByName('office/roof-vent')),spec.vent);
    for(const bounds of Object.values(asset.group.userData.reviewBounds))assert(bounds.min.every(Number.isFinite)&&bounds.max.every(Number.isFinite));
    copy.anchors.entrance.x+=10;assert.notEqual(copy.anchors.entrance.x,asset.anchors.entrance.x);
    for(const geometry of owned)geometry.dispose();
    metrics.push({id:spec.id,floors:spec.floors,footprint:[spec.width,spec.depth],height,bays,surfaceTrianglesIncludingGlass:triangles,batches:ours.length});
}
assert.equal(moduleHashes.size,1,'Every bay on all three variants has exactly the same module geometry');
assert.throws(()=>lib.createAsset({assetId:'office',variantId:'missing'}),/not available/);
assert.throws(()=>buildOffice(lib.materials,'missing'),/Unknown office/);
const inventory=JSON.parse(await readFile(new URL('./inventory.json',import.meta.url),'utf8'));
assert.deepEqual(inventory.office.base,OFFICE_BASE);assert.deepEqual(inventory.office.variants,OFFICE_VARIANTS);
assert(inventory.instances.every(i=>i.assetId==='residential-tower'));assert.equal(inventory.office.placementStatus,'unplaced');
assert(inventory.office.sourceObjects.every(i=>i.placementStatus==='unplaced'&&i.reviewStatus==='approved'));
assert(inventory.cafe.sourceObjects.every(i=>i.reviewStatus==='approved'&&i.placementStatus==='unplaced'));
const cafeSnapshot=JSON.parse(await readFile(new URL('./approved-cafe-geometry.json',import.meta.url),'utf8'));
for(const spec of CAFE_VARIANTS){const cafe=lib.createAsset({assetId:'cafe',variantId:spec.id});assert.equal(cafe.group.userData.approval,'approved');assert.equal(hashGeometry(cafe.group),cafeSnapshot.hashes[spec.id]);}
assert.equal(hashGeometry(lib.createAsset({assetId:'residential-tower'}).group),(await readFile(new URL('./approved-tower-geometry.sha256',import.meta.url),'utf8')).trim());
let disposedGeometry=0,disposedMaterial=0;for(const g of geometries)g.addEventListener('dispose',()=>disposedGeometry++);for(const m of materials)m.addEventListener('dispose',()=>disposedMaterial++);
lib.dispose();lib.dispose();assert.equal(disposedGeometry,geometries.size);assert.equal(disposedMaterial,materials.size);

// The same real viewer is exercised with a stub DOM/renderer boundary.
const viewer=await readFile(new URL('../../../scripts/geomarketeer-kit/office-viewer.js',import.meta.url),'utf8');
function fixture({reduced=false,narrow=false,query=''}={}){
    let now=0,id=0,frames=new Map(),renders=[],rendererDisposed=false,rectangles=[];
    function element(tag='div'){return{tagName:typeof tag==='string'?tag.toUpperCase():'DIV',dataset:{},style:{},hidden:false,disabled:false,textContent:'',value:'',clientWidth:632,clientHeight:480,children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;},setAttribute(k,v){this[k]=v;},append(...v){this.children.push(...v);},prepend(...v){this.children.unshift(...v);},addEventListener(type,fn){this.listeners[type]=fn;},dispatch(type,event={}){this.listeners[type]?.(event);},setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};}
    const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
    const actions=['left','right','in','out','reset','reload'].map(action=>Object.assign(element('button'),{dataset:{action}}));
    const modes=['single','variants','scale'].map(mode=>Object.assign(element('button'),{dataset:{mode}}));
    const focuses=['whole','entrance','facade'].map(focus=>Object.assign(element('button'),{dataset:{focus}}));
    const media={...element(),matches:reduced};
    const document={...element(),hidden:false,body:element(),getElementById:get,createElement:element,createTextNode:s=>({textContent:s}),querySelector:s=>get(s),querySelectorAll:s=>s==='[data-action]'?actions:s==='[data-mode]'?modes:s==='button[data-focus]'?focuses:s==='#variantPicks button'?get('variantPicks').children:[...actions,...modes,...focuses,...get('variantPicks').children]};
    const window=element();
    class Renderer{constructor(){this.domElement=element('canvas');this.info={render:{calls:0,triangles:0},reset(){this.render.calls=0;}};}setPixelRatio(){}setSize(){}setScissorTest(){}setViewport(x,y,w,h){assert(w>0&&h>0);rectangles.push({x,y,w,h});}setScissor(){}clear(){}render(scene,camera){assert(Number.isFinite(camera.left));renders.push({id:scene.children[0].userData.variantId,camera:camera.clone()});this.info.render.calls++;}dispose(){rendererDisposed=true;}}
    vm.runInNewContext(viewer.replace(/^import .*;\n/gm,''),{THREE:{...THREE,WebGLRenderer:Renderer},createAssetLibrary,OFFICE_BASE,OFFICE_VARIANTS,CAMERA,KitDrawing,REFERENCE,document,window,matchMedia:q=>q.includes('reduced')?media:{...element(),matches:q.includes('max-width')?narrow:false},URLSearchParams,URL,location:{search:query,href:'http://localhost/review'+query,replace(){}},devicePixelRatio:1,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}disconnect(){}},console});
    const step=(count=120)=>{for(let i=0;i<count;i++){now+=16.667;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
    const click=(data,fromBoard=false)=>get('officeStudy').dispatch('click',{target:{closest:()=>({dataset:data,closest:()=>fromBoard})}});
    const key=key=>get('officeViewport').dispatch('keydown',{key,preventDefault(){}});
    return{get,step,click,key,document,window,media,actions,focuses,frames:()=>frames.size,renders:()=>renders,rectangles:()=>rectangles,disposed:()=>rendererDisposed};
}

const f=fixture();assert.equal(f.get('officeStudy').dataset.state,'ready');
const initialSpan=f.renders().at(-1).camera.top;
for(const focus of['entrance','facade']){f.click({focus});assert.equal(f.get('officeStudy').dataset.focus,focus);assert(f.renders().at(-1).camera.top<initialSpan);assert(f.get('officeViewport').focused&&f.get('officeViewport').scrolled);}
f.key('0');assert.equal(f.get('officeStudy').dataset.focus,'whole');
for(const spec of OFFICE_VARIANTS){f.click({variant:spec.id});assert.equal(f.get('officeStudy').dataset.variant,spec.id);assert.equal(f.renders().at(-1).id,spec.id);assert.equal(f.get('sourceCropRect').x,spec.referenceCrop[0]);assert.equal(f.get('referenceCaption').textContent,spec.referenceLabel);}
f.click({mode:'variants'});assert.deepEqual(f.renders().slice(-3).map(r=>r.id),OFFICE_VARIANTS.map(s=>s.id));
const cameras=f.renders().slice(-3).map(r=>r.camera);assert(cameras.every(c=>c.top===cameras[0].top));assert.equal(new Set(f.rectangles().slice(-3).map(r=>r.x)).size,3);
f.click({variant:'wide'},true);assert(f.get('officeViewport').focused&&f.get('officeViewport').scrolled);
for(let i=0;i<8;i++)f.click({action:'right'});f.step();assert.equal(f.get('officeStudy').dataset.orbit,'15.00');assert(f.actions.find(b=>b.dataset.action==='right').disabled);
for(let i=0;i<20;i++)f.key('ArrowLeft');f.step();assert.equal(f.get('officeStudy').dataset.orbit,'-15.00');
for(let i=0;i<12;i++)f.key('+');f.step();assert.equal(f.get('officeStudy').dataset.zoom,'3.00');
f.click({action:'left'});f.step(1);f.click({variant:'low-wing'});assert.equal(f.get('officeStudy').dataset.orbit,'0.00');assert.equal(f.get('officeStudy').dataset.zoom,'1.00');
f.click({mode:'scale'});assert.equal(f.get('officeStudy').dataset.mode,'scale');f.key('0');f.step();assert.equal(f.frames(),0);
const pointer={button:0,isPrimary:true,pointerId:1,pointerType:'touch',clientX:500,target:{closest:()=>null}};
f.get('officeViewport').dispatch('pointerdown',pointer);f.get('officeViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step();assert.equal(f.get('officeStudy').dataset.orbit,'0.00');
f.get('touchExplore').dispatch('click',{currentTarget:f.get('touchExplore')});f.get('officeViewport').dispatch('pointerdown',pointer);f.get('officeViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step(1);assert.equal(f.get('officeStudy').dataset.orbit,'-15.00');f.get('officeViewport').dispatch('pointercancel',{pointerId:1});f.key('0');f.step();
f.click({action:'in'});f.document.hidden=true;f.document.dispatch('visibilitychange');assert.equal(f.frames(),0);f.document.hidden=false;f.document.dispatch('visibilitychange');f.step();
f.window.dispatch('pagehide',{persisted:false});assert(f.disposed());
const r=fixture({reduced:true,narrow:true,query:'?focus=entrance'});assert.equal(r.get('officeStudy').dataset.focus,'entrance');r.key('ArrowRight');r.step(1);assert.equal(r.get('officeStudy').dataset.orbit,'3.00');r.click({mode:'variants'});assert.equal(new Set(r.rectangles().slice(-3).map(v=>v.x)).size,1);r.window.dispatch('pagehide',{persisted:false});
const s=fixture({query:'?view=still&variant=wide'});assert.equal(s.get('officeStudy').dataset.state,'fallback');assert(s.get('fallbackStill').src.endsWith(`office-wide-still.jpg?v=${OFFICE_BASE.revision}`));
const report={checkpoint:'office-03',revision:1,status:'approved',variants:metrics,neighborhoodOfficeInstances:0,approvedTowerAndCafesUnchanged:true,checks:['one byte-identical window bay across all variants','declared floor counts, elevations, footprints and roof configurations','no windows crossing the entry opening or façade edges','finite surface and stroke buffers; no textures','grounded building and canopy supports','transparent entry glazing survives compilation','authored/compiled triangle parity','shared geometry and materials per variant; independent anchors','shared-resource disposal once','inventory parity and no office placements','approved tower and all five café geometry fingerprints unchanged','reference crops and variant labels','entrance and façade detail framing','same-scale three-view board','desktop and phone board breakpoints','detail and board selection focus and scroll','orbit limits and zoom caps','variant changes and reset','scene-scale preview','touch opt-in and pointer cancellation','idle scheduling and hidden-page pause','reduced-motion immediate update','per-variant still fallback']};
await writeFile(new URL('../../../reports/component-kit/offices/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
