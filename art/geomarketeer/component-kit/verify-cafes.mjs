import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from '../../../assets/vendor/three/three.module.js';
import {createAssetLibrary} from '../../../scripts/geomarketeer-kit/library.js';
import {CAFE_BASE,CAFE_VARIANTS,buildCafe} from '../../../scripts/geomarketeer-kit/cafe.js';
import {createSeatingSet} from '../../../scripts/geomarketeer-kit/cafe-furniture.js';
import {CAMERA,KitDrawing} from '../../../scripts/geomarketeer-kit/style.js';
import {REFERENCE} from '../../../scripts/geomarketeer-kit/inventory.js';

const lib=createAssetLibrary(),metrics=[],allGeometry=new Set(),allMaterials=new Set();
const shellHashes=[];
let checkedChairs=0;
function verifySeating(set){
    const ground=set.getWorldPosition(new THREE.Vector3()).y;
    const table=set.getObjectByName(`${set.name}/table`),tableBounds=new THREE.Box3().setFromObject(table),center=tableBounds.getCenter(new THREE.Vector3());
    assert(Math.abs(tableBounds.min.y-ground)<.002,'Table feet meet the floor');
    for(const chair of set.children.filter(o=>/\/chair-\d+$/.test(o.name))){
        const origin=chair.getWorldPosition(new THREE.Vector3()),away=origin.clone().sub(center).setY(0).normalize();
        const seatBounds=new THREE.Box3().setFromObject(chair.getObjectByName(`${chair.name}/seat`));
        const planarDistance=Math.hypot(origin.x-center.x,origin.z-center.z);
        assert(planarDistance>.47+.23+.04,'Chair seat clears the tabletop');
        assert(Math.abs(new THREE.Box3().setFromObject(chair).min.y-ground)<.00001,'Chair feet meet the floor');
        const back=chair.getObjectByName(`${chair.name}/backrest`);let testedVertices=0;
        back.traverse(o=>{if(!o.isMesh||o.isLineSegments2)return;const positions=o.geometry.getAttribute('position');
            for(let i=0;i<positions.count;i++){
                const point=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);
                assert(point.sub(origin).dot(away)>.025,'Actual backrest vertices must be behind the seat, away from the table');testedVertices++;
            }
        });
        assert(testedVertices>100);assert(seatBounds.min.y>ground);checkedChairs++;
    }
}
function hashGeometry(group){const h=createHash('sha256');group.traverse(o=>{if(o.geometry)for(const attribute of Object.values(o.geometry.attributes)){const a=attribute.isInterleavedBufferAttribute?attribute.data.array:attribute.array;h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}});return h.digest('hex');}
assert.equal(CAFE_VARIANTS.length,5);assert.equal(new Set(CAFE_VARIANTS.map(s=>s.id)).size,5);
for(const spec of CAFE_VARIANTS){
    const asset=lib.createAsset({assetId:'cafe',variantId:spec.id}),copy=lib.createAsset({assetId:'cafe',variantId:spec.id,instanceId:'copy'}),authored=buildCafe(lib.materials,spec.id);
    assert.equal(asset.group.userData.approval,'approved');assert.equal(asset.group.userData.baseRevision,CAFE_BASE.revision);
    assert.deepEqual(asset.group.position.toArray(),[0,0,0]);assert.deepEqual(asset.group.scale.toArray(),[1,1,1]);
    assert(asset.bounds.min.y>=-1e-6,'No floating or below-grade furniture');
    const realBounds=new THREE.Box3().setFromObject(asset.group);assert(realBounds.min.distanceTo(asset.bounds.min)<1e-5);assert(realBounds.max.distanceTo(asset.bounds.max)<1e-5);
    const ours=[],theirs=[];asset.group.traverse(o=>{if(o.geometry)ours.push(o);});copy.group.traverse(o=>{if(o.geometry)theirs.push(o);});
    for(let i=0;i<ours.length;i++){assert.equal(ours[i].geometry,theirs[i].geometry);assert.equal(ours[i].material,theirs[i].material);}
    let triangles=0,glazing=0;
    asset.group.traverse(o=>{
        if(!o.geometry)return;allGeometry.add(o.geometry);allMaterials.add(o.material);
        for(const a of Object.values(o.geometry.attributes))for(let i=0;i<a.count;i++)for(let c=0;c<a.itemSize;c++)assert(Number.isFinite(a[['getX','getY','getZ','getW'][c]](i)));
        for(const name of['map','normalMap','alphaMap','emissiveMap'])assert(!o.material[name]);
        if(o.isMesh&&!o.isLineSegments2){triangles+=o.geometry.getAttribute('position').count/3;if(o.material===lib.materials.glazing){glazing++;assert(o.material.transparent&&!o.material.depthWrite);assert(o.material.opacity>0&&o.material.opacity<.3);}}
    });
    assert.equal(glazing,1,'Transparent glazing remains its own compiled batch');
    let expectedTriangles=0;const authoredGeometry=new Set();authored.group.traverse(o=>{if(o.geometry)authoredGeometry.add(o.geometry);if(o.isMesh&&!o.isLineSegments2)expectedTriangles+=o.geometry.getAttribute('position').count/3;});assert.equal(triangles,expectedTriangles);
    const parts=asset.group.userData.parts;
    assert.equal(parts.includes('cafe/shared-fitout'),spec.fitout==='cafe');assert.equal(parts.includes('cafe/shared-terrace-furniture'),spec.fitout==='cafe');
    assert.equal(parts.includes('cafe/optional-upper-floor'),spec.upper);
    assert.equal(parts.includes('cafe/shared-identity'),spec.fitout==='cafe');
    assert.equal(Boolean(asset.group.userData.reviewBounds.seating),spec.fitout==='cafe');
    const seating=[];authored.group.traverse(o=>{if(o.userData.component==='seating-set')seating.push(o);});
    assert.equal(seating.length,spec.tables+(spec.corner?1:0));
    assert.equal(seating.filter(s=>s.userData.pastry).length,spec.tables,'One pastry plate per terrace table');
    const doorway=new THREE.Box3(new THREE.Vector3(-(spec.width-.1)/6-.025,0,spec.depth/2+.15),new THREE.Vector3((spec.width-.1)/6+.025,1.85,spec.depth/2+3));
    for(const set of seating){
        verifySeating(set);
        if(set.name.includes('terrace'))assert(!new THREE.Box3().setFromObject(set).intersectsBox(doorway),'Seating leaves the full entrance approach clear');
    }
    for(let i=0;i<seating.length;i++)for(let j=i+1;j<seating.length;j++)assert(!new THREE.Box3().setFromObject(seating[i]).intersectsBox(new THREE.Box3().setFromObject(seating[j])),'Seating assemblies do not overlap');
    if(['base','upper-floor','blue-awning'].includes(spec.id))shellHashes.push(hashGeometry(authored.group.getObjectByName('cafe/shared-shell')));
    for(const geometry of authoredGeometry)geometry.dispose();
    metrics.push({id:spec.id,surfaceTrianglesIncludingGlass:triangles,batches:ours.length,storeys:asset.group.userData.storeys,terraceTables:spec.tables});
}
assert.equal(new Set(shellHashes).size,1,'Same-footprint variants preserve the exact shared ground-floor shell');
// Exercise other placements, then inspect world-space geometry rather than
// asserting the same angle formula used by the builder.
const rotated=createSeatingSet(lib.materials,{id:'regression/seating',x:3,z:-2,y:.12,chairOffsets:[[.76,0],[-.60,.47]]});
rotated.rotation.y=.37;rotated.updateMatrixWorld(true);verifySeating(rotated);rotated.traverse(o=>o.geometry?.dispose());
assert.throws(()=>lib.createAsset({assetId:'cafe',variantId:'unknown'}),/not available/);
const inventory=JSON.parse(await readFile(new URL('./inventory.json',import.meta.url),'utf8'));
assert.deepEqual(inventory.cafe.base,CAFE_BASE);assert.deepEqual(inventory.cafe.variants,CAFE_VARIANTS);
assert(inventory.instances.every(i=>i.assetId==='residential-tower'),'No cafés placed in neighborhood');assert.equal(inventory.cafe.placementStatus,'unplaced');
assert(inventory.cafe.sourceObjects.every(i=>i.placementStatus==='unplaced'&&i.reviewStatus==='approved'));
const tower=lib.createAsset({assetId:'residential-tower'});assert.equal(tower.group.userData.approval,'approved');
// Recorded before café changes; this fingerprint locks every tower vertex and stroke.
const expectedTower=await readFile(new URL('./approved-tower-geometry.sha256',import.meta.url),'utf8');assert.equal(hashGeometry(tower.group),expectedTower.trim());
let disposedGeometry=0,disposedMaterial=0;for(const g of allGeometry)g.addEventListener('dispose',()=>disposedGeometry++);for(const m of allMaterials)m.addEventListener('dispose',()=>disposedMaterial++);
lib.dispose();lib.dispose();assert.equal(disposedGeometry,allGeometry.size);assert.equal(disposedMaterial,allMaterials.size);

// Run the actual viewer against a lightweight DOM boundary and real geometry/camera.
const viewer=await readFile(new URL('../../../scripts/geomarketeer-kit/cafe-viewer.js',import.meta.url),'utf8');
function fixture({reduced=false,narrow=false,query=''}={}){
    let now=0,id=0,frames=new Map(),renders=[],rendererDisposed=false,rectangles=[];
    function element(tag='div'){return{tagName:typeof tag==='string'?tag.toUpperCase():'DIV',dataset:{},style:{},hidden:false,disabled:false,textContent:'',value:'',clientWidth:632,clientHeight:480,children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;},setAttribute(k,v){this[k]=v;},append(...v){this.children.push(...v);},prepend(...v){this.children.unshift(...v);},addEventListener(type,fn){this.listeners[type]=fn;},dispatch(type,event={}){this.listeners[type]?.(event);},setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};}
    const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
    const actions=['left','right','in','out','reset','reload'].map(action=>Object.assign(element('button'),{dataset:{action}}));
    const modes=['single','variants','scale'].map(mode=>Object.assign(element('button'),{dataset:{mode}}));
    const focuses=['whole','seating','storefront'].map(focus=>Object.assign(element('button'),{dataset:{focus}}));
    const media={...element(),matches:reduced};
    const document={...element(),hidden:false,body:element(),getElementById:get,createElement:element,createTextNode:s=>({textContent:s}),querySelector:s=>get(s),querySelectorAll:s=>s==='[data-action]'?actions:s==='[data-mode]'?modes:s==='button[data-focus]'?focuses:s==='#variantPicks button'?get('variantPicks').children:[...actions,...modes,...focuses,...get('variantPicks').children]};
    const window=element();
    class Renderer{constructor(){this.domElement=element('canvas');this.info={render:{calls:0,triangles:0},reset(){this.render.calls=0;}};}setPixelRatio(){}setSize(){}setScissorTest(){}setViewport(x,y,w,h){assert(w>0&&h>0);rectangles.push({x,y,w,h});}setScissor(){}clear(){}render(scene,camera){assert(Number.isFinite(camera.left));renders.push({id:scene.children[0].userData.variantId,camera:camera.clone()});this.info.render.calls++;}dispose(){rendererDisposed=true;}}
    vm.runInNewContext(viewer.replace(/^import .*;\n/gm,''),{THREE:{...THREE,WebGLRenderer:Renderer},createAssetLibrary,CAFE_BASE,CAFE_VARIANTS,CAMERA,KitDrawing,REFERENCE,document,window,matchMedia:q=>q.includes('reduced')?media:{...element(),matches:q.includes('max-width')?narrow:false},URLSearchParams,URL,location:{search:query,href:'http://localhost/review'+query,replace(){}},devicePixelRatio:1,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}disconnect(){}},console});
    const step=(count=120)=>{for(let i=0;i<count;i++){now+=16.667;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
    const click=(data,fromBoard=false)=>get('cafeStudy').dispatch('click',{target:{closest:()=>({dataset:data,closest:()=>fromBoard})}});
    const key=key=>get('cafeViewport').dispatch('keydown',{key,preventDefault(){}});
    return{get,step,click,key,document,window,media,actions,focuses,frames:()=>frames.size,renders:()=>renders,rectangles:()=>rectangles,disposed:()=>rendererDisposed};
}
const f=fixture();assert.equal(f.get('cafeStudy').dataset.state,'ready');
const overviewSpan=f.renders().at(-1).camera.top;
f.click({focus:'seating'});assert.equal(f.get('cafeStudy').dataset.focus,'seating');assert(f.renders().at(-1).camera.top<overviewSpan);
assert(f.get('cafeViewport').focused&&f.get('cafeViewport').scrolled,'Detail selection reveals the model on narrow screens');
f.click({focus:'storefront'});assert.equal(f.get('cafeStudy').dataset.focus,'storefront');
f.key('0');assert.equal(f.get('cafeStudy').dataset.focus,'whole');
f.click({variant:'blue-awning'});assert(f.focuses.find(b=>b.dataset.focus==='seating').disabled);
for(const spec of CAFE_VARIANTS){f.click({variant:spec.id});assert.equal(f.get('cafeStudy').dataset.variant,spec.id);assert.equal(f.renders().at(-1).id,spec.id);assert.equal(f.get('variantTitle').textContent,spec.label);assert.equal(f.get('sourceCropRect').x,spec.referenceCrop[0]);}
f.click({mode:'variants'});assert.equal(f.get('cafeStudy').dataset.mode,'variants');assert.equal(f.get('boardLabels').hidden,false);assert.deepEqual(f.renders().slice(-5).map(r=>r.id),CAFE_VARIANTS.map(s=>s.id));
const cameras=f.renders().slice(-5).map(r=>r.camera);assert(cameras.every(c=>c.top===cameras[0].top),'Comparison uses one projection scale');assert.equal(new Set(f.rectangles().slice(-5).map(r=>r.x)).size,3,'632px canvas still uses desktop grid when viewport is above CSS breakpoint');
f.click({variant:'corner'},true);assert(f.get('cafeViewport').focused&&f.get('cafeViewport').scrolled,'Board selection brings the chosen model into view');f.click({mode:'variants'});
for(let i=0;i<8;i++)f.click({action:'right'});f.step();assert.equal(f.get('cafeStudy').dataset.orbit,'15.00');
for(let i=0;i<20;i++)f.key('ArrowLeft');f.step();assert.equal(f.get('cafeStudy').dataset.orbit,'-15.00');
for(let i=0;i<12;i++)f.key('+');f.step();assert.equal(f.get('cafeStudy').dataset.zoom,'3.00');
f.click({action:'left'});f.step(1);f.click({variant:'blue-awning'});assert.equal(f.get('cafeStudy').dataset.orbit,'0.00');assert.equal(f.get('cafeStudy').dataset.zoom,'1.00');assert.equal(f.get('fitoutValue').textContent,'Vacant · no furniture');
f.click({mode:'scale'});assert.equal(f.get('cafeStudy').dataset.mode,'scale');f.click({action:'in'});f.step(1);f.key('0');f.step();assert.equal(f.frames(),0);
const pointer={button:0,isPrimary:true,pointerId:1,pointerType:'touch',clientX:500,target:{closest:()=>null}};
f.get('cafeViewport').dispatch('pointerdown',pointer);f.get('cafeViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step();assert.equal(f.get('cafeStudy').dataset.orbit,'0.00');
f.get('touchExplore').dispatch('click',{currentTarget:f.get('touchExplore')});f.get('cafeViewport').dispatch('pointerdown',pointer);f.get('cafeViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step(1);assert.equal(f.get('cafeStudy').dataset.orbit,'-15.00');f.get('cafeViewport').dispatch('pointercancel',{pointerId:1});f.key('0');f.step();
f.click({action:'in'});f.document.hidden=true;f.document.dispatch('visibilitychange');assert.equal(f.frames(),0);f.document.hidden=false;f.document.dispatch('visibilitychange');f.step();
f.window.dispatch('pagehide',{persisted:false});assert(f.disposed());
const r=fixture({reduced:true,narrow:true});r.click({mode:'variants'});assert.equal(new Set(r.rectangles().slice(-5).map(v=>v.x)).size,1);r.key('ArrowRight');r.step(1);assert.equal(r.get('cafeStudy').dataset.orbit,'3.00');r.window.dispatch('pagehide',{persisted:false});
const s=fixture({query:'?view=still&variant=blue-awning'});assert.equal(s.get('cafeStudy').dataset.state,'fallback');assert(s.get('fallbackStill').src.endsWith(`cafe-blue-awning-still.jpg?v=${CAFE_BASE.revision}`));
const report={checkpoint:'cafe-02',revision:CAFE_BASE.revision,status:'approved',variants:metrics,checkedChairs,neighborhoodCafeInstances:0,towerGeometryUnchanged:true,checks:['actual backrest geometry faces away from tables, including rotated arrangements','chair and table feet meet their supporting floor','seat-to-table clearance and unobstructed entrance approach','seating assemblies do not overlap','one pastry plate per terrace set','shared cup emblem only on occupied cafés','seating and storefront detail presets; reset restores whole café','finite geometry and ground contact','same-footprint ground-floor shell hashes match','transparent glazing survives compilation','compiled/authored triangle parity','cached variants share geometry and materials','vacant unit has no fitout or terrace furniture','variant upper-floor rules','inventory has no café placements','approved tower geometry fingerprint unchanged','shared-resource disposal once','all variant selectors and reference crops','same-scale five-view board','responsive board breakpoint alignment','board selection reveals and focuses detail','orbit and zoom limits','variant switch resets camera','scene-scale preview','touch opt-in and cancellation','idle scheduling and hidden-page pause','reduced-motion immediate update','per-variant still fallback']};
await writeFile(new URL('../../../reports/component-kit/cafes/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
