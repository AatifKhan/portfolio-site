import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from '../../../assets/vendor/three/three.module.js';
import {createAssetLibrary} from '../../../scripts/geomarketeer-kit/library.js';
import {TWO_WHEELER_REVISION,TWO_WHEELER_MASTERS,TWO_WHEELER_ANGLES,TWO_WHEELER_REVIEW_COPIES,TWO_WHEELER_SOURCE_OBJECTS,buildTwoWheeler} from '../../../scripts/geomarketeer-kit/two-wheelers.js';
import {CAFE_VARIANTS} from '../../../scripts/geomarketeer-kit/cafe.js';
import {OFFICE_VARIANTS} from '../../../scripts/geomarketeer-kit/office.js';
import {SMALL_VARIANTS} from '../../../scripts/geomarketeer-kit/small-building.js';
import {CAMERA,KitDrawing} from '../../../scripts/geomarketeer-kit/style.js';
import {REFERENCE} from '../../../scripts/geomarketeer-kit/inventory.js';
function hashGeometry(group){const h=createHash('sha256');group.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes)){const d=a.isInterleavedBufferAttribute?a.data.array:a.array;h.update(Buffer.from(d.buffer,d.byteOffset,d.byteLength));}});return h.digest('hex');}

const lib=createAssetLibrary(),summary=[],geometries=new Set(),materials=new Set(),owned=new Set();
const surfaces=group=>{const meshes=[];group.traverse(o=>{if(o.isMesh&&!o.isLineSegments2)meshes.push(o);});return meshes;};
const hit=(group,origin,dir,far=2)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...dir).normalize(),0,far).intersectObjects(surfaces(group),false);
for(const spec of TWO_WHEELER_MASTERS){
    const asset=lib.createAsset({assetId:spec.id}),copy=lib.createAsset({assetId:spec.id,instanceId:'copy'}),authored=buildTwoWheeler(lib.materials,spec.id);
    assert.equal(asset.group.userData.approval,'approved');assert.equal(asset.group.userData.revision,TWO_WHEELER_REVISION);assert.equal(asset.group.userData.static,true);assert.equal(asset.group.userData.configuration,'parked');
    assert.deepEqual(asset.group.position.toArray(),[0,0,0]);assert.deepEqual(asset.group.scale.toArray(),[1,1,1]);
    const ours=[],theirs=[];asset.group.traverse(o=>{if(o.geometry)ours.push(o);});copy.group.traverse(o=>{if(o.geometry)theirs.push(o);});
    let triangles=0;for(const[i,o]of ours.entries()){
        assert.equal(o.geometry,theirs[i].geometry);assert.equal(o.material,theirs[i].material);geometries.add(o.geometry);materials.add(o.material);
        for(const a of Object.values(o.geometry.attributes))for(let n=0;n<a.count;n++)for(let c=0;c<a.itemSize;c++)assert(Number.isFinite(a[['getX','getY','getZ','getW'][c]](n)));
        if(o.isMesh&&!o.isLineSegments2)triangles+=o.geometry.getAttribute('position').count/3;
    }
    const box=new THREE.Box3().setFromObject(asset.group);assert(box.min.distanceTo(asset.bounds.min)<1e-5);assert(box.max.distanceTo(asset.bounds.max)<1e-5);assert(Math.abs(box.min.y)<1e-6);
    const wheels=authored.group.children.filter(o=>o.userData.component==='wheel');assert.equal(wheels.length,2);assert.equal(new Set(wheels.map(hashGeometry)).size,1);
    const buffers=wheels.map(w=>{const all=[];w.traverse(o=>{if(o.geometry)all.push(o.geometry)});return all;});for(const[i,g]of buffers[0].entries())assert.equal(g,buffers[1][i]);
    for(const[i,w]of wheels.entries()){const b=new THREE.Box3().setFromObject(w);assert(Math.abs(b.min.y)<1e-6,'Actual tires meet grade');assert(Math.abs(b.max.y-spec.wheelRadius*2)<1e-6);assert.equal(w.position.x,spec.axles[i]);}
    assert(Math.abs(wheels[1].position.x-wheels[0].position.x-spec.wheelbase)<1e-9);
    assert.deepEqual(asset.anchors.frontAxle.toArray(),[spec.axles[1],spec.wheelRadius,0]);assert.deepEqual(asset.anchors.rearAxle.toArray(),[spec.axles[0],spec.wheelRadius,0]);
    let clearArchSamples=0,openWheelSamples=0;
    if(spec.id==='scooter'){
        const shell=authored.group.getObjectByName('scooter/rear-shell');
        for(let i=0;i<=16;i++){const a=i/16*Math.PI,r=spec.wheelRadius+.018;assert.equal(hit(shell,[-.47+Math.cos(a)*r,.185+Math.sin(a)*r,1],[0,0,-1]).length,0,'Rear body clears tire arch');clearArchSamples++;}
        const guard=authored.group.getObjectByName('scooter/front-mudguard');
        for(let i=0;i<=12;i++){const a=(20+i*140/12)*Math.PI/180;assert.equal(hit(guard,[.5+Math.cos(a)*.204,.185+Math.sin(a)*.204,1],[0,0,-1]).length,0,'Front mudguard clears tire');clearArchSamples++;}
        const deck=authored.group.getObjectByName('scooter/floorboard'),shield=authored.group.getObjectByName('scooter/leg-shield');
        for(const z of[-.09,0,.09]){const lower=hit(shield,[.6,.27501,z],[-1,0,0],.4);assert(lower.length>0);const x=lower[0].point.x-.013;const support=hit(deck,[x,.32,z],[0,-1,0],.1);assert(support.length>0,'Deck meets the actual lower leg shield');assert(Math.abs(support[0].point.y-.275)<1e-5);}
        // Rays starting on the shield's front surface must not hit the fork ahead of it.
        const steering=authored.group.getObjectByName('scooter/steering');
        for(const z of[-.064,.064])for(const y of[.45,.50,.55,.60,.65,.69,.72]){const face=hit(shield,[.7,y,z],[-1,0,0],.6)[0];assert(face);assert.equal(hit(steering,face.point.clone().add(new THREE.Vector3(.0001,0,0)).toArray(),[1,0,0],.10).length,0,'Fork remains behind front shield');}
        const seat=authored.group.getObjectByName('scooter/seat'),bodyBox=new THREE.Box3().setFromObject(shell);assert(new THREE.Box3().setFromObject(seat).min.y<bodyBox.max.y,'Seat mount meets shell');
    }else{
        // A ray midway between spokes should pass through each open wheel.
        for(const w of wheels)for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4;assert.equal(hit(w,[w.position.x+Math.cos(a)*.18,.29+Math.sin(a)*.18,1],[0,0,-1]).length,0,'No filled disk inside bicycle wheel');openWheelSamples++;}
        const frame=authored.group.getObjectByName('bicycle/frame');
        for(const x of[-.52,.52])for(const z of[-.054,.054])assert(hit(frame,[x,.29,z-.025],[0,0,1],.05).length>0,'Fork/stays connect to actual wheel axle');
        for(const p of Object.values(frame.userData.frameNodes))assert(hit(frame,[p[0],p[1],-.08],[0,0,1],.16).length>0,'Frame junction is connected');
        const drive=authored.group.getObjectByName('bicycle/drivetrain'),b=new THREE.Box3().setFromObject(drive);assert(b.min.y>.20,'Cranks and pedals clear grade');
        assert(hit(authored.group.getObjectByName('bicycle/saddle'),[-.28,1,0],[0,-1,0],.3).length>0,'Seat anchor has a surface');
    }
    const stand=authored.group.getObjectByName(spec.id==='scooter'?'scooter/center-stand':'bicycle/kickstand');assert(Math.abs(new THREE.Box3().setFromObject(stand).min.y)<1e-6,'Stand foot meets grade');
    const previewBounds=[];for(const placement of TWO_WHEELER_REVIEW_COPIES){assert(placement.reviewOnly&&placement.scale===1);const a=lib.createAsset({assetId:spec.id,instanceId:placement.id});assert.equal(hashGeometry(a.group),hashGeometry(asset.group));a.group.position.set(...placement.position);a.group.rotation.y=placement.rotation;a.group.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(a.group);for(const prev of previewBounds)assert(!b.intersectsBox(prev),'Review copies do not overlap');previewBounds.push(b);assert(Math.abs(b.min.y)<1e-6);}
    let authoredTriangles=0;authored.group.traverse(o=>{if(o.geometry)owned.add(o.geometry);if(o.isMesh&&!o.isLineSegments2)authoredTriangles+=o.geometry.getAttribute('position').count/3;});assert.equal(triangles,authoredTriangles);
    copy.bounds.max.y+=20;copy.anchors.frontAxle.x+=20;assert.notEqual(copy.bounds.max.y,asset.bounds.max.y);assert.notEqual(copy.anchors.frontAxle.x,asset.anchors.frontAxle.x);
    assert.throws(()=>lib.createAsset({assetId:spec.id,variantId:'missing'}),/not available/);assert.throws(()=>buildTwoWheeler(lib.materials,spec.id,'missing'),/Unknown two-wheeler/);
    summary.push({id:spec.id,revision:TWO_WHEELER_REVISION,surfaceTriangles:triangles,geometryBatches:ours.length,wheelCount:wheels.length,clearArchSamples,openWheelSamples,bounds:{min:box.min.toArray(),max:box.max.toArray()}});
}
assert.throws(()=>buildTwoWheeler(lib.materials,'motorcycle'),/Unknown two-wheeler/);
const inventory=JSON.parse(await readFile(new URL('./inventory.json',import.meta.url),'utf8'));
assert.deepEqual(inventory.twoWheelers.masters,TWO_WHEELER_MASTERS);assert.deepEqual(inventory.twoWheelers.sourceObjects,TWO_WHEELER_SOURCE_OBJECTS);assert.equal(TWO_WHEELER_SOURCE_OBJECTS.length,13);assert.equal(new Set(TWO_WHEELER_SOURCE_OBJECTS.map(o=>o.id)).size,13);assert.equal(TWO_WHEELER_SOURCE_OBJECTS.filter(o=>o.assetId==='scooter').length,10);assert(TWO_WHEELER_SOURCE_OBJECTS.every(o=>o.variantId==='standard'&&o.placementStatus==='unplaced'&&o.reviewStatus==='approved'));assert(inventory.instances.every(o=>o.assetId==='residential-tower'));assert(inventory.car.sourceObjects.every(o=>o.reviewStatus==='approved'&&o.placementStatus==='unplaced'));
for(const[assetId,specs,file]of[['cafe',CAFE_VARIANTS,'approved-cafe-geometry.json'],['office',OFFICE_VARIANTS,'approved-office-geometry.json'],['small-building',SMALL_VARIANTS,'approved-small-building-geometry.json'],['hatchback',[{id:'standard'}],'approved-car-geometry.json']]){const snapshot=JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));for(const spec of specs){const a=lib.createAsset({assetId,variantId:spec.id});assert.equal(a.group.userData.approval,'approved');assert.equal(hashGeometry(a.group),snapshot.hashes[spec.id]);}}
assert.equal(hashGeometry(lib.createAsset({assetId:'residential-tower'}).group),(await readFile(new URL('approved-tower-geometry.sha256',import.meta.url),'utf8')).trim());
for(const g of owned)g.dispose();let disposedGeometry=0,disposedMaterial=0;for(const g of geometries)g.addEventListener('dispose',()=>disposedGeometry++);for(const m of materials)m.addEventListener('dispose',()=>disposedMaterial++);lib.dispose();lib.dispose();assert.equal(disposedGeometry,geometries.size);assert.equal(disposedMaterial,materials.size);
// The same real viewer is exercised with a stub DOM/renderer boundary.
const viewer=await readFile(new URL('../../../scripts/geomarketeer-kit/two-wheeler-viewer.js',import.meta.url),'utf8');
function fixture({reduced=false,narrow=false,medium=false,query=''}={}){
    let now=0,id=0,frames=new Map(),renders=[],rendererDisposed=false,rectangles=[];
    function element(tag='div'){return{tagName:typeof tag==='string'?tag.toUpperCase():'DIV',dataset:{},style:{},hidden:false,disabled:false,textContent:'',value:'',clientWidth:632,clientHeight:480,children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;},setAttribute(k,v){this[k]=v;},append(...v){this.children.push(...v);},prepend(...v){this.children.unshift(...v);},addEventListener(type,fn){this.listeners[type]=fn;},dispatch(type,event={}){this.listeners[type]?.(event);},setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};}
    const elements=new Map(),get=id=>{if(!elements.has(id)){const value=element();if(id==='twoWheelerViewport')value.clientHeight=narrow?1400:740;elements.set(id,value);}return elements.get(id);};
    const actions=['left','right','in','out','reset','reload'].map(action=>Object.assign(element('button'),{dataset:{action}}));
    const modes=['single','angles','copies','scale'].map(mode=>Object.assign(element('button'),{dataset:{mode}}));
    const focuses=['whole','openings','roof'].map(focus=>Object.assign(element('button'),{dataset:{focus}}));
    const media={...element(),matches:reduced};
    const document={...element(),hidden:false,body:element(),getElementById:get,createElement:element,createTextNode:s=>({textContent:s}),querySelector:s=>get(s),querySelectorAll:s=>s==='[data-action]'?actions:s==='[data-mode]'?modes:s==='button[data-focus]'?focuses:s==='#masterPicks button'?get('masterPicks').children:s==='#anglePicks button'?get('anglePicks').children:[...actions,...modes,...focuses,...get('masterPicks').children,...get('anglePicks').children]};
    const window=element();
    class Renderer{constructor(){this.domElement=element('canvas');this.info={render:{calls:0,triangles:0},reset(){this.render.calls=0;}};}setPixelRatio(){}setSize(){}setScissorTest(){}setViewport(x,y,w,h){assert(w>0&&h>0);rectangles.push({x,y,w,h});}setScissor(){}clear(){}render(scene,camera){assert(Number.isFinite(camera.left));renders.push({id:scene.children[0].name,camera:camera.clone(),count:scene.children.filter(o=>['scooter','bicycle'].includes(o.userData.assetId)).length});if(camera.zoom===1){const bounds=new THREE.Box3().setFromObject(scene);for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001,'Model fits at supported camera angles');}}this.info.render.calls++;}dispose(){rendererDisposed=true;}}
    vm.runInNewContext(viewer.replace(/^import .*;\n/gm,''),{THREE:{...THREE,WebGLRenderer:Renderer},createAssetLibrary,TWO_WHEELER_REVISION,TWO_WHEELER_MASTERS,TWO_WHEELER_ANGLES,TWO_WHEELER_REVIEW_COPIES,CAMERA,KitDrawing,REFERENCE,document,window,matchMedia:q=>q.includes('reduced')?media:{...element(),matches:q.includes('650px')?narrow:q.includes('1100px')?medium||narrow:false},URLSearchParams,URL,location:{search:query,href:'http://localhost/review'+query,replace(){}},devicePixelRatio:1,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}disconnect(){}},console});
    const step=(count=120)=>{for(let i=0;i<count;i++){now+=16.667;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
    const click=(data,fromBoard=false)=>get('twoWheelerStudy').dispatch('click',{target:{closest:()=>({dataset:data,closest:()=>fromBoard})}});
    const key=key=>get('twoWheelerViewport').dispatch('keydown',{key,preventDefault(){}});
    return{get,step,click,key,document,window,media,actions,focuses,frames:()=>frames.size,renders:()=>renders,rectangles:()=>rectangles,disposed:()=>rendererDisposed};
}


const f=fixture();assert.equal(f.get('twoWheelerStudy').dataset.state,'ready');assert.equal(f.get('twoWheelerStudy').dataset.angle,'reference');
for(const master of TWO_WHEELER_MASTERS){
    f.click({master:master.id});assert.equal(f.get('twoWheelerStudy').dataset.master,master.id);
    for(const spec of TWO_WHEELER_ANGLES){f.click({angle:spec.id});assert.equal(f.get('twoWheelerStudy').dataset.angle,spec.id);assert.equal(f.renders().at(-1).id,`review-angle/${master.id}/${spec.id}`);assert.equal(f.get('sourceCropRect').x,master.referenceCrop[0]);
        for(let i=0;i<5;i++)f.key('ArrowLeft');f.step();assert.equal(f.get('twoWheelerStudy').dataset.orbit,'-15.00');for(let i=0;i<10;i++)f.key('ArrowRight');f.step();assert.equal(f.get('twoWheelerStudy').dataset.orbit,'15.00');f.key('0');f.step();
    }
    f.click({mode:'angles'});assert.deepEqual(f.renders().slice(-4).map(r=>r.id),TWO_WHEELER_ANGLES.map(s=>`review-angle/${master.id}/${s.id}`));const cameras=f.renders().slice(-4).map(r=>r.camera);assert(cameras.every(c=>c.top===cameras[0].top));assert.equal(new Set(f.rectangles().slice(-4).map(r=>r.x)).size,2);
    f.click({angle:'rear'},true);assert(f.get('twoWheelerViewport').focused&&f.get('twoWheelerViewport').scrolled);
    for(let i=0;i<12;i++)f.key('+');f.step();assert.equal(f.get('twoWheelerStudy').dataset.zoom,'3.00');
    f.click({mode:'copies'});assert.equal(f.renders().at(-1).count,3);assert.equal(f.get('twoWheelerStudy').dataset.zoom,'1.00');
    f.click({mode:'scale'});f.key('0');f.step();assert.equal(f.frames(),0);
}
f.click({mode:'angles'});f.click({master:'scooter'});assert.equal(f.get('twoWheelerStudy').dataset.mode,'angles');
const pointer={button:0,isPrimary:true,pointerId:1,pointerType:'touch',clientX:500,target:{closest:()=>null}};f.get('twoWheelerViewport').dispatch('pointerdown',pointer);f.get('twoWheelerViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step();assert.equal(f.get('twoWheelerStudy').dataset.orbit,'0.00');f.get('touchExplore').dispatch('click',{currentTarget:f.get('touchExplore')});f.get('twoWheelerViewport').dispatch('pointerdown',pointer);f.get('twoWheelerViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step(1);assert.equal(f.get('twoWheelerStudy').dataset.orbit,'-15.00');f.get('twoWheelerViewport').dispatch('pointercancel',{pointerId:1});f.key('0');f.step();
f.click({action:'in'});f.document.hidden=true;f.document.dispatch('visibilitychange');assert.equal(f.frames(),0);f.document.hidden=false;f.document.dispatch('visibilitychange');f.step();f.window.dispatch('pagehide',{persisted:false});assert(f.disposed());
const r=fixture({reduced:true,narrow:true,query:'?angle=side&master=bicycle'});assert.equal(r.get('twoWheelerStudy').dataset.angle,'side');assert.equal(r.get('twoWheelerStudy').dataset.master,'bicycle');r.key('ArrowRight');r.step(1);assert.equal(r.get('twoWheelerStudy').dataset.orbit,'3.00');r.click({mode:'angles'});assert.equal(new Set(r.rectangles().slice(-4).map(v=>v.x)).size,1);r.window.dispatch('pagehide',{persisted:false});
for(const master of TWO_WHEELER_MASTERS)for(const angle of TWO_WHEELER_ANGLES){const s=fixture({query:`?view=still&master=${master.id}&angle=${angle.id}`});assert.equal(s.get('twoWheelerStudy').dataset.state,'fallback');assert(s.get('fallbackStill').src.endsWith(`${master.id}-${angle.id}-still.jpg?v=${TWO_WHEELER_REVISION}`));}
const report={checkpoint:'two-wheelers-06',revision:TWO_WHEELER_REVISION,status:'approved',masters:summary,sourceScooters:10,sourceBicycles:3,reviewCopiesPerMaster:3,neighborhoodTwoWheelerInstances:0,approvedFamiliesUnchanged:true,checks:['shared compiled geometry and materials for every copy','two byte-identical wheels per master with shared authoring buffers','actual tire and stand bounds meet grade','scooter rear arch and front mudguard clear actual tires','floorboard contacts actual lower leg-shield surface','fork geometry remains behind front shield','seat mount meets rear shell','open bicycle wheels have no hidden filled disks','frame, fork and stays reach the actual axles','bicycle cranks and pedals clear grade','finite buffers, bounds, local origins and placement anchors','authored/compiled triangle parity','independent bounds and anchors, idempotent shared disposal','review copies have physical clearance and no neighborhood positions','thirteen stable source IDs with configuration and unplaced status','all approved family geometry fingerprints unchanged, including hatchback','four equal-scale orthographic views per master, framing at both orbit limits','master switching preserves preview mode','three-copy and scene-scale previews','desktop and phone board layouts','keyboard controls, ±15 degree orbit, 100–300 percent zoom and reset','explicit touch opt-in and cancellation','idle rendering, hidden-page pause and reduced motion','eight master/angle-specific fallback paths']};
await writeFile(new URL('../../../reports/component-kit/two-wheelers/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
