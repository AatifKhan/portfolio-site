import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from '../../../assets/vendor/three/three.module.js';
import {createAssetLibrary} from '../../../scripts/geomarketeer-kit/library.js';
import {SMALL_BASE,SMALL_VARIANTS,SMALL_SOURCE_OBJECTS,buildSmallBuilding} from '../../../scripts/geomarketeer-kit/small-building.js';
import {CAFE_VARIANTS,awning} from '../../../scripts/geomarketeer-kit/cafe.js';
import {OFFICE_VARIANTS} from '../../../scripts/geomarketeer-kit/office.js';
import {CAMERA,KitDrawing} from '../../../scripts/geomarketeer-kit/style.js';
import {REFERENCE} from '../../../scripts/geomarketeer-kit/inventory.js';
function hashGeometry(group){const h=createHash('sha256');group.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes)){const data=a.isInterleavedBufferAttribute?a.data.array:a.array;h.update(Buffer.from(data.buffer,data.byteOffset,data.byteLength));}});return h.digest('hex');}
const lib=createAssetLibrary(),geometries=new Set(),materials=new Set(),metrics=[],moduleHashes=new Map();
assert.equal(SMALL_VARIANTS.length,8);assert.equal(new Set(SMALL_VARIANTS.map(s=>s.id)).size,8);
assert.equal(SMALL_SOURCE_OBJECTS.length,9);assert.equal(new Set(SMALL_SOURCE_OBJECTS.map(s=>s.id)).size,9);
for(const spec of SMALL_VARIANTS){
    const asset=lib.createAsset({assetId:'small-building',variantId:spec.id}),copy=lib.createAsset({assetId:'small-building',variantId:spec.id,instanceId:'copy'}),authored=buildSmallBuilding(lib.materials,spec.id);
    assert.equal(asset.group.userData.approval,'approved');assert.equal(asset.group.userData.revision,SMALL_BASE.revision);
    assert.deepEqual(asset.group.position.toArray(),[0,0,0]);assert.deepEqual(asset.group.scale.toArray(),[1,1,1]);
    assert(Math.abs(asset.bounds.min.y)<1e-6,'Ground contact');
    const actual=new THREE.Box3().setFromObject(asset.group);assert(actual.min.distanceTo(asset.bounds.min)<1e-5);assert(actual.max.distanceTo(asset.bounds.max)<1e-5);
    const ours=[],theirs=[];asset.group.traverse(o=>{if(o.geometry)ours.push(o);});copy.group.traverse(o=>{if(o.geometry)theirs.push(o);});
    assert.equal(ours.length,spec.id==='gatehouse'?5:4,'Filled surfaces, three stroke weights, and service glazing where needed');
    let triangles=0,glazing=0;
    for(let i=0;i<ours.length;i++){
        const o=ours[i];assert.equal(o.geometry,theirs[i].geometry);assert.equal(o.material,theirs[i].material);geometries.add(o.geometry);materials.add(o.material);
        for(const a of Object.values(o.geometry.attributes))for(let n=0;n<a.count;n++)for(let c=0;c<a.itemSize;c++)assert(Number.isFinite(a[['getX','getY','getZ','getW'][c]](n)));
        if(o.isMesh&&!o.isLineSegments2){triangles+=o.geometry.getAttribute('position').count/3;if(o.material===lib.materials.glazing){glazing++;assert(o.material.transparent&&!o.material.depthWrite);}}
    }
    assert.equal(glazing,spec.id==='gatehouse'?1:0);
    let authoredTriangles=0,openingCount=0;const owned=new Set();
    authored.group.traverse(o=>{if(o.geometry)owned.add(o.geometry);if(o.isMesh&&!o.isLineSegments2)authoredTriangles+=o.geometry.getAttribute('position').count/3;});
    assert.equal(triangles,authoredTriangles,'Compilation keeps all faces');
    for(const shell of authored.group.children){
        const {width,depth,height}=shell.userData;assert(width>0&&depth>0&&height>0);
        const shellBox=new THREE.Box3().setFromObject(shell);assert(Math.abs(shellBox.min.y)<1e-6);
        const walls=['front','right','back','left'].map(side=>new THREE.Box3().setFromObject(shell.getObjectByName(`${shell.name}/wall-${side}`)));
        for(const[i,wallBox]of walls.entries()){
            assert(Math.abs(wallBox.min.y-SMALL_BASE.plinthHeight)<1e-6,'Walls start above the plinth');
            for(const other of walls.slice(i+1)){
                const overlap=wallBox.clone().intersect(other).getSize(new THREE.Vector3());
                assert(overlap.x*overlap.y*overlap.z<1e-7,'Wall corner solids meet without overlapping end caps');
            }
        }
        for(const side of['front','right','back','left']){
            const facade=shell.getObjectByName(`${shell.name}/facade-${side}`),openings=facade.userData.openings,faceWidth=facade.userData.width;
            for(const[i,o]of openings.entries()){
                openingCount++;
                assert(o.y>=.06-1e-6&&o.y+o.height<height,'Opening within wall height');
                assert(Math.abs(o.x)+o.width/2<faceWidth/2,'Opening within façade width');
                for(const other of openings.slice(i+1)){const overlapX=Math.min(o.x+o.width/2,other.x+other.width/2)-Math.max(o.x-o.width/2,other.x-other.width/2),overlapY=Math.min(o.y+o.height,other.y+other.height)-Math.max(o.y,other.y);assert(overlapX<=0||overlapY<=0,'Openings do not overlap');}
                // Test resulting wall triangles, not only placement data. Clear apertures
                // are sampled inside each opening from the exterior of its local face.
                for(const dx of[-.2,.2])for(const dy of[.25,.75]){
                    const origin=facade.localToWorld(new THREE.Vector3(o.x+dx*o.width,o.y+dy*o.height,.25)),direction=new THREE.Vector3(0,0,-1).transformDirection(facade.matrixWorld);
                    const ray=new THREE.Raycaster(origin,direction,0,.6);
                    assert.equal(ray.intersectObject(facade.getObjectByName(`${shell.name}/wall-${side}`),true).length,0,'No wall triangles across a declared opening');
                }
            }
            for(const part of facade.children){if(!part.userData.moduleKey)continue;const key=part.userData.moduleKey,hash=hashGeometry(part);if(moduleHashes.has(key))assert.equal(hash,moduleHashes.get(key),`Identical geometry for ${key}`);else moduleHashes.set(key,hash);}
        }
    }
    assert.equal(Boolean(authored.group.getObjectByName('small/main/rooftop-box')),spec.roofBox);
    assert.equal(Boolean(authored.group.getObjectByName('small/annex')),Boolean(spec.annex));
    if(spec.annex){
        const annex=authored.group.getObjectByName('small/annex');assert.equal(annex.position.x-spec.annex.width/2,spec.width/2,'Annex structural footprint touches main wall without overlap');
        const mainFace=authored.group.getObjectByName('small/main/facade-right'),annexFace=annex.getObjectByName('small/annex/facade-left');
        const portal=f=>{const o=f.userData.openings.find(o=>o.type==='connection');return f.localToWorld(new THREE.Vector3(o.x,o.y+o.height/2,0));};
        assert(portal(mainFace).distanceTo(portal(annexFace))<1e-6,'Actual shared connection aligns');
        for(const o of mainFace.userData.openings.filter(o=>o.type==='window'))assert(o.y>spec.annex.height+.036,'Annex roof stays below main side glazing');
    }
    if(spec.id==='gatehouse'){
        const draw=new KitDrawing('awning-proof',lib.materials,'small-buildings');awning(draw,spec.depth+.04,spec.width/2+.025,spec.height-.005,'striped');
        const expected=draw.finish();assert.equal(hashGeometry(expected),hashGeometry(authored.group.getObjectByName('small/main/shared-cafe-awning')),'Gatehouse reuses actual approved café awning generator');expected.traverse(o=>{if(o.geometry)o.geometry.dispose();});
    }
    for(const bounds of Object.values(asset.group.userData.reviewBounds))assert(bounds.min.every(Number.isFinite)&&bounds.max.every(Number.isFinite));
    copy.anchors.front.x+=10;copy.bounds.max.y+=10;assert.notEqual(copy.anchors.front.x,asset.anchors.front.x);assert.notEqual(copy.bounds.max.y,asset.bounds.max.y);
    for(const geometry of owned)geometry.dispose();
    metrics.push({id:spec.id,footprint:[spec.width,spec.depth],wallHeight:spec.height,roof:spec.roof,roofBox:spec.roofBox,annex:Boolean(spec.annex),openings:openingCount,surfaceTrianglesIncludingGlass:triangles,batches:ours.length});
}
assert(moduleHashes.size>1);
assert.throws(()=>lib.createAsset({assetId:'small-building',variantId:'missing'}),/not available/);
assert.throws(()=>buildSmallBuilding(lib.materials,'missing'),/Unknown small-building/);
const inventory=JSON.parse(await readFile(new URL('./inventory.json',import.meta.url),'utf8'));
assert.deepEqual(inventory.smallBuildings.base,SMALL_BASE);assert.deepEqual(inventory.smallBuildings.variants,SMALL_VARIANTS);assert.deepEqual(inventory.smallBuildings.sourceObjects,SMALL_SOURCE_OBJECTS);
assert(inventory.instances.every(i=>i.assetId==='residential-tower'));assert.equal(inventory.smallBuildings.placementStatus,'unplaced');
assert(inventory.smallBuildings.sourceObjects.every(i=>i.placementStatus==='unplaced'&&i.reviewStatus==='approved'&&SMALL_VARIANTS.some(v=>v.id===i.variantId)));
assert(inventory.cafe.sourceObjects.every(i=>i.reviewStatus==='approved'&&i.placementStatus==='unplaced'));
assert(inventory.office.sourceObjects.every(i=>i.reviewStatus==='approved'&&i.placementStatus==='unplaced'));
const cafeSnapshot=JSON.parse(await readFile(new URL('./approved-cafe-geometry.json',import.meta.url),'utf8'));
const officeSnapshot=JSON.parse(await readFile(new URL('./approved-office-geometry.json',import.meta.url),'utf8'));
for(const [assetId,specs,snapshot]of[['cafe',CAFE_VARIANTS,cafeSnapshot],['office',OFFICE_VARIANTS,officeSnapshot]])for(const spec of specs){const asset=lib.createAsset({assetId,variantId:spec.id});assert.equal(asset.group.userData.approval,'approved');assert.equal(hashGeometry(asset.group),snapshot.hashes[spec.id],`Approved ${assetId}/${spec.id} unchanged`);}
assert.equal(hashGeometry(lib.createAsset({assetId:'residential-tower'}).group),(await readFile(new URL('./approved-tower-geometry.sha256',import.meta.url),'utf8')).trim());
let disposedGeometry=0,disposedMaterial=0;for(const g of geometries)g.addEventListener('dispose',()=>disposedGeometry++);for(const m of materials)m.addEventListener('dispose',()=>disposedMaterial++);
lib.dispose();lib.dispose();assert.equal(disposedGeometry,geometries.size);assert.equal(disposedMaterial,materials.size);assert.throws(()=>lib.createAsset({assetId:'small-building',variantId:'base'}),/disposed/);
// The same real viewer is exercised with a stub DOM/renderer boundary.
const viewer=await readFile(new URL('../../../scripts/geomarketeer-kit/small-building-viewer.js',import.meta.url),'utf8');
function fixture({reduced=false,narrow=false,medium=false,query=''}={}){
    let now=0,id=0,frames=new Map(),renders=[],rendererDisposed=false,rectangles=[];
    function element(tag='div'){return{tagName:typeof tag==='string'?tag.toUpperCase():'DIV',dataset:{},style:{},hidden:false,disabled:false,textContent:'',value:'',clientWidth:632,clientHeight:480,children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;},setAttribute(k,v){this[k]=v;},append(...v){this.children.push(...v);},prepend(...v){this.children.unshift(...v);},addEventListener(type,fn){this.listeners[type]=fn;},dispatch(type,event={}){this.listeners[type]?.(event);},setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};}
    const elements=new Map(),get=id=>{if(!elements.has(id)){const value=element();if(id==='smallBuildingViewport')value.clientHeight=narrow?2720:medium?1080:720;elements.set(id,value);}return elements.get(id);};
    const actions=['left','right','in','out','reset','reload'].map(action=>Object.assign(element('button'),{dataset:{action}}));
    const modes=['single','variants','scale'].map(mode=>Object.assign(element('button'),{dataset:{mode}}));
    const focuses=['whole','openings','roof'].map(focus=>Object.assign(element('button'),{dataset:{focus}}));
    const media={...element(),matches:reduced};
    const document={...element(),hidden:false,body:element(),getElementById:get,createElement:element,createTextNode:s=>({textContent:s}),querySelector:s=>get(s),querySelectorAll:s=>s==='[data-action]'?actions:s==='[data-mode]'?modes:s==='button[data-focus]'?focuses:s==='#variantPicks button'?get('variantPicks').children:[...actions,...modes,...focuses,...get('variantPicks').children]};
    const window=element();
    class Renderer{constructor(){this.domElement=element('canvas');this.info={render:{calls:0,triangles:0},reset(){this.render.calls=0;}};}setPixelRatio(){}setSize(){}setScissorTest(){}setViewport(x,y,w,h){assert(w>0&&h>0);rectangles.push({x,y,w,h});}setScissor(){}clear(){}render(scene,camera){assert(Number.isFinite(camera.left));renders.push({id:scene.children[0].userData.variantId,camera:camera.clone()});this.info.render.calls++;}dispose(){rendererDisposed=true;}}
    vm.runInNewContext(viewer.replace(/^import .*;\n/gm,''),{THREE:{...THREE,WebGLRenderer:Renderer},createAssetLibrary,SMALL_BASE,SMALL_VARIANTS,CAMERA,KitDrawing,REFERENCE,document,window,matchMedia:q=>q.includes('reduced')?media:{...element(),matches:q.includes('650px')?narrow:q.includes('1100px')?medium||narrow:false},URLSearchParams,URL,location:{search:query,href:'http://localhost/review'+query,replace(){}},devicePixelRatio:1,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}disconnect(){}},console});
    const step=(count=120)=>{for(let i=0;i<count;i++){now+=16.667;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
    const click=(data,fromBoard=false)=>get('smallBuildingStudy').dispatch('click',{target:{closest:()=>({dataset:data,closest:()=>fromBoard})}});
    const key=key=>get('smallBuildingViewport').dispatch('keydown',{key,preventDefault(){}});
    return{get,step,click,key,document,window,media,actions,focuses,frames:()=>frames.size,renders:()=>renders,rectangles:()=>rectangles,disposed:()=>rendererDisposed};
}

const f=fixture();assert.equal(f.get('smallBuildingStudy').dataset.state,'ready');
const initialSpan=f.renders().at(-1).camera.top;
for(const focus of['openings','roof']){f.click({focus});assert.equal(f.get('smallBuildingStudy').dataset.focus,focus);assert(f.renders().at(-1).camera.top<initialSpan);assert(f.get('smallBuildingViewport').focused&&f.get('smallBuildingViewport').scrolled);}
f.key('0');assert.equal(f.get('smallBuildingStudy').dataset.focus,'whole');
for(const spec of SMALL_VARIANTS){f.click({variant:spec.id});assert.equal(f.get('smallBuildingStudy').dataset.variant,spec.id);assert.equal(f.renders().at(-1).id,spec.id);assert.equal(f.get('sourceCropRect').x,spec.referenceCrop[0]);assert.equal(f.get('referenceCaption').textContent,spec.referenceLabel);}
f.click({mode:'variants'});assert.deepEqual(f.renders().slice(-8).map(r=>r.id),SMALL_VARIANTS.map(s=>s.id));
const cameras=f.renders().slice(-8).map(r=>r.camera);assert(cameras.every(c=>c.top===cameras[0].top));assert.equal(new Set(f.rectangles().slice(-8).map(r=>r.x)).size,4);
f.click({variant:'home-annex'},true);assert(f.get('smallBuildingViewport').focused&&f.get('smallBuildingViewport').scrolled);
for(let i=0;i<8;i++)f.click({action:'right'});f.step();assert.equal(f.get('smallBuildingStudy').dataset.orbit,'15.00');assert(f.actions.find(b=>b.dataset.action==='right').disabled);
for(let i=0;i<20;i++)f.key('ArrowLeft');f.step();assert.equal(f.get('smallBuildingStudy').dataset.orbit,'-15.00');
for(let i=0;i<12;i++)f.key('+');f.step();assert.equal(f.get('smallBuildingStudy').dataset.zoom,'3.00');
f.click({action:'left'});f.step(1);f.click({variant:'utility-hut'});assert.equal(f.get('smallBuildingStudy').dataset.orbit,'0.00');assert.equal(f.get('smallBuildingStudy').dataset.zoom,'1.00');
f.click({mode:'scale'});assert.equal(f.get('smallBuildingStudy').dataset.mode,'scale');f.key('0');f.step();assert.equal(f.frames(),0);
const pointer={button:0,isPrimary:true,pointerId:1,pointerType:'touch',clientX:500,target:{closest:()=>null}};
f.get('smallBuildingViewport').dispatch('pointerdown',pointer);f.get('smallBuildingViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step();assert.equal(f.get('smallBuildingStudy').dataset.orbit,'0.00');
f.get('touchExplore').dispatch('click',{currentTarget:f.get('touchExplore')});f.get('smallBuildingViewport').dispatch('pointerdown',pointer);f.get('smallBuildingViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step(1);assert.equal(f.get('smallBuildingStudy').dataset.orbit,'-15.00');f.get('smallBuildingViewport').dispatch('pointercancel',{pointerId:1});f.key('0');f.step();
f.click({action:'in'});f.document.hidden=true;f.document.dispatch('visibilitychange');assert.equal(f.frames(),0);f.document.hidden=false;f.document.dispatch('visibilitychange');f.step();
f.window.dispatch('pagehide',{persisted:false});assert(f.disposed());
const r=fixture({reduced:true,narrow:true,query:'?focus=openings'});assert.equal(r.get('smallBuildingStudy').dataset.focus,'openings');r.key('ArrowRight');r.step(1);assert.equal(r.get('smallBuildingStudy').dataset.orbit,'3.00');r.click({mode:'variants'});assert.equal(new Set(r.rectangles().slice(-8).map(v=>v.x)).size,1);r.window.dispatch('pagehide',{persisted:false});
const s=fixture({query:'?view=still&variant=home-annex'});assert.equal(s.get('smallBuildingStudy').dataset.state,'fallback');assert(s.get('fallbackStill').src.endsWith(`small-building-home-annex-still.jpg?v=${SMALL_BASE.revision}`));

const tablet=fixture({medium:true,query:'?mode=variants'});assert.equal(new Set(tablet.rectangles().slice(-8).map(r=>r.x)).size,3);tablet.window.dispatch('pagehide',{persisted:false});
const report={checkpoint:'small-buildings-04',revision:SMALL_BASE.revision,status:'approved',variants:metrics,sourceStructures:9,sharedOpeningModuleTypes:moduleHashes.size,neighborhoodSmallBuildingInstances:0,approvedFamiliesUnchanged:true,checks:['eight declared configurations, nine stable source IDs','finite surface and stroke buffers, correct bounds and ground contact','no overlapping openings or apertures outside walls','ray checks of actual wall apertures','identical geometry for each shared window/door module','home annex contact without footprint overlap; aligned internal portal; windows above annex roof','gatehouse uses approved café awning generator','separate transparent service glazing','authored/compiled triangle parity','shared geometry and materials per variant; independent bounds and anchors','shared-resource disposal once','inventory parity and no placements','approved tower, five cafés and three offices geometry fingerprints unchanged','reference crops and labels','doors/windows and roof detail framing','same-scale eight-view board','desktop, tablet and phone board breakpoints','detail and board selection focus and scroll','orbit limits and zoom caps','variant changes and reset','scene-scale preview','touch opt-in and pointer cancellation','idle scheduling and hidden-page pause','reduced-motion immediate update','per-variant still fallback']};
await writeFile(new URL('../../../reports/component-kit/small-buildings/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
