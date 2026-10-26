import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as THREE from '../../../assets/vendor/three/three.module.js';
import {createAssetLibrary} from '../../../scripts/geomarketeer-kit/library.js';
import {PERSON_BASE,PERSON_POSES,buildPerson,personRig} from '../../../scripts/geomarketeer-kit/people.js';
import {PEOPLE_SOURCE_OBJECTS} from '../../../scripts/geomarketeer-kit/people-inventory.js';
import {createPeopleReview} from '../../../scripts/geomarketeer-kit/people-review.js';
import {CAFE_VARIANTS} from '../../../scripts/geomarketeer-kit/cafe.js';
import {OFFICE_VARIANTS} from '../../../scripts/geomarketeer-kit/office.js';
import {SMALL_VARIANTS} from '../../../scripts/geomarketeer-kit/small-building.js';
import {CAMERA,KitDrawing} from '../../../scripts/geomarketeer-kit/style.js';
import {REFERENCE} from '../../../scripts/geomarketeer-kit/inventory.js';
function hashGeometry(group){const h=createHash('sha256');group.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes)){const d=a.isInterleavedBufferAttribute?a.data.array:a.array;h.update(Buffer.from(d.buffer,d.byteOffset,d.byteLength));}});return h.digest('hex');}


const lib=createAssetLibrary(),summary=[],geometries=new Set(),materials=new Set();
const surfaces=group=>{const meshes=[];group.traverse(o=>{if(o.isMesh&&!o.isLineSegments2&&o.material!==lib.materials.silhouette)meshes.push(o);});return meshes;};
for(const spec of PERSON_POSES){
    const a=lib.createAsset({assetId:'person',variantId:spec.id}),b=lib.createAsset({assetId:'person',variantId:spec.id,instanceId:'copy'}),raw=buildPerson(lib.materials,spec.id),rig=personRig(spec.id),review=createPeopleReview(lib,spec.id);
    assert.equal(a.group.userData.approval,'approved');assert.equal(a.group.userData.static,true);assert.deepEqual(a.group.userData.proportions,PERSON_BASE);assert.deepEqual(a.group.scale.toArray(),[1,1,1]);
    for(const s of rig.segments)assert(Math.abs(new THREE.Vector3(...rig.joints[s.from]).distanceTo(new THREE.Vector3(...rig.joints[s.to]))-s.length)<1e-9,`${spec.id}: no stretched limb bones`);
    const ours=[],theirs=[];a.group.traverse(o=>{if(o.geometry)ours.push(o);});b.group.traverse(o=>{if(o.geometry)theirs.push(o);});assert.equal(ours.length,2,'Organic fill and silhouette batches');
    let triangles=0;for(const[i,o]of ours.entries()){assert.equal(o.geometry,theirs[i].geometry);assert.equal(o.material,theirs[i].material);geometries.add(o.geometry);materials.add(o.material);for(const attribute of Object.values(o.geometry.attributes))for(let n=0;n<attribute.count;n++)for(let c=0;c<attribute.itemSize;c++)assert(Number.isFinite(attribute[['getX','getY','getZ','getW'][c]](n)));triangles+=o.geometry.getAttribute('position').count/3;}
    const bounds=new THREE.Box3().setFromObject(a.group);assert(bounds.min.distanceTo(a.bounds.min)<1e-5);assert(bounds.max.distanceTo(a.bounds.max)<1e-5);
    const head=new THREE.Box3().setFromObject(raw.group.getObjectByName('person/head'));for(const[i,k]of['x','y','z'].entries())assert(Math.abs((head.max[k]-head.min[k])-PERSON_BASE.headRadii[i]*2)<1e-6,'Identical head dimensions');
    for(const side of['left','right']){
        if(spec.id==='standing'||spec.id==='walking'){
            const shoulder=new THREE.Vector3(...rig.joints[side+'Shoulder']),wrist=new THREE.Vector3(...rig.joints[side+'Wrist']),axis=wrist.clone().sub(shoulder),lengthSq=axis.lengthSq();
            const arm=surfaces(raw.group.getObjectByName(`person/${side}-arm`))[0],vertices=arm.geometry.getAttribute('position');let sum=0,count=0;
            for(let i=0;i<vertices.count;i++){const vertex=new THREE.Vector3().fromBufferAttribute(vertices,i),t=vertex.clone().sub(shoulder).dot(axis)/lengthSq;if(t>.35&&t<.65){sum+=vertex.x-(shoulder.x+axis.x*t);count++;}}
            assert(count>0&&sum/count<-.015,`${spec.id} ${side}: actual arm surface bends toward the back, not forward`);
            if(spec.id==='walking')assert((wrist.x-shoulder.x)*(rig.joints[side+'Ankle'][0]-rig.joints[side+'Hip'][0])<0,'Walking arm swing opposes the same-side leg');
        }
        const foot=raw.group.getObjectByName(`person/${side}-foot`),footBox=new THREE.Box3().setFromObject(foot),contact=a.anchors[side+'Foot'];assert(Math.abs(footBox.min.y-contact.y)<1e-6,'Actual shoe sole meets its contact anchor');
        if(!spec.support||spec.support==='chair')assert(Math.abs(footBox.min.y)<1e-6,'Standing, walking and seated shoes meet grade');
        else{review.group.updateMatrixWorld(true);const hits=new THREE.Raycaster(contact.clone().add(new THREE.Vector3(0,.001,0)),new THREE.Vector3(0,-1,0),0,.03).intersectObjects(surfaces(review.support),false);assert(hits.length>0,`${spec.id} ${side}: physical foot support`);assert(Math.abs(hits[0].point.y-contact.y)<.002);}
        // Sweep normals face outwards; an inside-out limb would render as solid ink.
        const leg=surfaces(raw.group.getObjectByName(`person/${side}-leg`))[0],pos=leg.geometry.getAttribute('position');let volume=0;for(let i=0;i<pos.count;i+=3){const x=new THREE.Vector3().fromBufferAttribute(pos,i),y=new THREE.Vector3().fromBufferAttribute(pos,i+1),z=new THREE.Vector3().fromBufferAttribute(pos,i+2);volume+=x.dot(y.cross(z))/6;}assert(volume>0,'Outward limb winding');
    }
    if(spec.support){
        const seat=a.anchors.seat;const hits=new THREE.Raycaster(seat.clone().add(new THREE.Vector3(0,.001,0)),new THREE.Vector3(0,-1,0),0,.02).intersectObjects(surfaces(review.support),false);assert(hits.length>0,`${spec.id}: seat contact`);assert(Math.abs(hits[0].point.y-seat.y)<.001);
        if(spec.support!=='chair'){
            const prop=lib.createAsset({assetId:spec.support});for(const side of['left','right'])assert(a.anchors[side+'Hand'].distanceTo(prop.anchors[side+'Grip'])<1e-8,'Hands meet approved grip anchors');
            // Allow the final 0.05-unit wrist/grip contact zone; all other arm and leg surfaces must clear the vehicle.
            let samples=0;for(const side of['left','right'])for(const limb of['arm','leg'])for(const mesh of surfaces(raw.group.getObjectByName(`person/${side}-${limb}`))){const pos=mesh.geometry.getAttribute('position');for(let i=0;i<pos.count;i+=3)for(let edge=0;edge<3;edge++){const start=new THREE.Vector3().fromBufferAttribute(pos,i+edge),end=new THREE.Vector3().fromBufferAttribute(pos,i+(edge+1)%3),d=end.clone().sub(start),length=d.length();if(length<1e-6)continue;const hits=new THREE.Raycaster(start,d.normalize(),.00001,length-.00001).intersectObjects(surfaces(review.support),false);const wrist=new THREE.Vector3(...rig.joints[side+'Wrist']);assert(hits.every(hit=>limb==='arm'&&hit.point.distanceTo(wrist)<.05),`${spec.id}: ${side} ${limb} intersects vehicle at ${start.toArray()}`);samples++;}}
            assert(samples>1000);
        }
    }
    const own=new Set();raw.group.traverse(o=>{if(o.geometry)own.add(o.geometry);});for(const g of own)g.dispose();for(const g of review.owned)g.dispose();
    b.bounds.max.y+=10;b.anchors.leftHand.x+=10;assert.notEqual(b.bounds.max.y,a.bounds.max.y);assert.notEqual(b.anchors.leftHand.x,a.anchors.leftHand.x);
    assert(!a.group.userData.parts.some(p=>p.startsWith('scooter/')||p.startsWith('bicycle/')||p.includes('chair')),'Person asset contains no support geometry');
    summary.push({id:spec.id,batches:ours.length,surfaceTriangles:triangles/2,limbBones:rig.segments.length,support:spec.support,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}});
}
assert.throws(()=>lib.createAsset({assetId:'person',variantId:'unknown'}),/not available/);assert.throws(()=>personRig('unknown'),/Unknown person pose/);
for(const[assetId,specs,file]of[['cafe',CAFE_VARIANTS,'approved-cafe-geometry.json'],['office',OFFICE_VARIANTS,'approved-office-geometry.json'],['small-building',SMALL_VARIANTS,'approved-small-building-geometry.json'],['hatchback',[{id:'standard'}],'approved-car-geometry.json']]){const snapshot=JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));for(const spec of specs)assert.equal(hashGeometry(lib.createAsset({assetId,variantId:spec.id}).group),snapshot.hashes[spec.id]);}
const wheels=JSON.parse(await readFile(new URL('approved-two-wheeler-geometry.json',import.meta.url),'utf8'));for(const id of['scooter','bicycle']){const a=lib.createAsset({assetId:id});assert.equal(a.group.userData.approval,'approved');assert.equal(hashGeometry(a.group),wheels.hashes[id]);}
assert.equal(hashGeometry(lib.createAsset({assetId:'residential-tower'}).group),(await readFile(new URL('approved-tower-geometry.sha256',import.meta.url),'utf8')).trim());
const inventory=JSON.parse(await readFile(new URL('./inventory.json',import.meta.url),'utf8'));
assert.deepEqual(inventory.people.base,PERSON_BASE);assert.deepEqual(inventory.people.poses,PERSON_POSES);assert.deepEqual(inventory.people.sourceObjects,PEOPLE_SOURCE_OBJECTS);
assert.equal(new Set(PEOPLE_SOURCE_OBJECTS.map(o=>o.id)).size,PEOPLE_SOURCE_OBJECTS.length);assert(PEOPLE_SOURCE_OBJECTS.every(o=>PERSON_POSES.some(p=>p.id===o.variantId)&&o.reviewStatus==='approved'&&o.placementStatus==='unplaced'&&!('position' in o)));assert(inventory.instances.every(o=>o.assetId==='residential-tower'));
for(const o of PEOPLE_SOURCE_OBJECTS){const[x,y,w,h]=o.sourceBounds;assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=REFERENCE.width&&y+h<=REFERENCE.height);if(o.vehicleSourceId)assert(inventory.twoWheelers.sourceObjects.some(v=>v.id===o.vehicleSourceId));}
let disposedGeometry=0,disposedMaterial=0;for(const g of geometries)g.addEventListener('dispose',()=>disposedGeometry++);for(const m of materials)m.addEventListener('dispose',()=>disposedMaterial++);lib.dispose();lib.dispose();assert.equal(disposedGeometry,geometries.size);assert.equal(disposedMaterial,materials.size);
// The same real viewer is exercised with a stub DOM/renderer boundary.
const viewer=await readFile(new URL('../../../scripts/geomarketeer-kit/people-viewer.js',import.meta.url),'utf8');
function fixture({reduced=false,narrow=false,medium=false,query=''}={}){
    let now=0,id=0,frames=new Map(),renders=[],rendererDisposed=false,rectangles=[];
    function element(tag='div'){return{tagName:typeof tag==='string'?tag.toUpperCase():'DIV',dataset:{},style:{},hidden:false,disabled:false,textContent:'',value:'',clientWidth:632,clientHeight:480,children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;},setAttribute(k,v){this[k]=v;},append(...v){this.children.push(...v);},prepend(...v){this.children.unshift(...v);},addEventListener(type,fn){this.listeners[type]=fn;},dispatch(type,event={}){this.listeners[type]?.(event);},setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};}
    const elements=new Map(),get=id=>{if(!elements.has(id)){const value=element();if(id==='peopleViewport')value.clientHeight=narrow?1400:740;elements.set(id,value);}return elements.get(id);};
    const actions=['left','right','in','out','reset','reload'].map(action=>Object.assign(element('button'),{dataset:{action}}));
    const modes=['single','variants','scale'].map(mode=>Object.assign(element('button'),{dataset:{mode}}));
    const focuses=['whole','openings','roof'].map(focus=>Object.assign(element('button'),{dataset:{focus}}));
    const media={...element(),matches:reduced};
    const document={...element(),hidden:false,body:element(),getElementById:get,createElement:element,createTextNode:s=>({textContent:s}),querySelector:s=>get(s),querySelectorAll:s=>s==='[data-action]'?actions:s==='[data-mode]'?modes:s==='button[data-focus]'?focuses:s==='#masterPicks button'?get('masterPicks').children:s==='button[data-angle]'?['reference','side','rear'].map(angle=>Object.assign(element('button'),{dataset:{angle}})):s==='#variantPicks button'?get('variantPicks').children:[...actions,...modes,...focuses,...get('masterPicks').children,...get('variantPicks').children]};
    const window=element();
    class Renderer{constructor(){this.domElement=element('canvas');this.info={render:{calls:0,triangles:0},reset(){this.render.calls=0;}};}setPixelRatio(){}setSize(){}setScissorTest(){}setViewport(x,y,w,h){assert(w>0&&h>0);rectangles.push({x,y,w,h});}setScissor(){}clear(){}render(scene,camera){assert(Number.isFinite(camera.left));renders.push({id:scene.children[0].name,camera:camera.clone(),count:scene.children.filter(o=>o.userData.assetId==='person').length});if(camera.zoom===1){const bounds=new THREE.Box3();scene.traverseVisible(o=>{if(o.geometry){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001,'Model fits at supported camera angles');}}this.info.render.calls++;}dispose(){rendererDisposed=true;}}
    vm.runInNewContext(viewer.replace(/^import .*;\n/gm,''),{THREE:{...THREE,WebGLRenderer:Renderer},createAssetLibrary,PERSON_BASE,PERSON_POSES,createPeopleReview,CAMERA,KitDrawing,REFERENCE,document,window,matchMedia:q=>q.includes('reduced')?media:{...element(),matches:q.includes('650px')?narrow:q.includes('1100px')?medium||narrow:false},URLSearchParams,URL,location:{search:query,href:'http://localhost/review'+query,replace(){}},devicePixelRatio:1,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}disconnect(){}},console});
    const step=(count=120)=>{for(let i=0;i<count;i++){now+=16.667;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
    const click=(data,fromBoard=false)=>get('peopleStudy').dispatch('click',{target:{closest:()=>({id:data.id,dataset:data,closest:()=>fromBoard})}});
    const key=key=>get('peopleViewport').dispatch('keydown',{key,preventDefault(){}});
    return{get,step,click,key,document,window,media,actions,focuses,frames:()=>frames.size,renders:()=>renders,rectangles:()=>rectangles,disposed:()=>rendererDisposed};
}



const f=fixture();assert.equal(f.get('peopleStudy').dataset.state,'ready');
for(const pose of PERSON_POSES){f.click({variant:pose.id});assert.equal(f.get('peopleStudy').dataset.variant,pose.id);for(const angle of['reference','side','rear']){f.click({angle});for(let i=0;i<6;i++)f.key('ArrowLeft');f.step();assert.equal(f.get('peopleStudy').dataset.orbit,'-15.00');for(let i=0;i<12;i++)f.key('ArrowRight');f.step();assert.equal(f.get('peopleStudy').dataset.orbit,'15.00');f.key('0');f.step();}f.click({id:'supportToggle'});assert.equal(f.get('peopleStudy').dataset.support,'false');f.click({id:'supportToggle'});assert.equal(f.get('peopleStudy').dataset.support,'true');}
f.click({mode:'variants'});assert.deepEqual(f.renders().slice(-5).map(r=>r.id),PERSON_POSES.map(s=>`review-only/${s.id}`));const cameras=f.renders().slice(-5).map(r=>r.camera);assert(cameras.every(c=>c.top===cameras[0].top));
f.click({variant:'riding-bicycle'},true);assert(f.get('peopleViewport').focused&&f.get('peopleViewport').scrolled);for(let i=0;i<12;i++)f.key('+');f.step();assert.equal(f.get('peopleStudy').dataset.zoom,'3.00');f.key('0');f.step();assert.equal(f.get('peopleStudy').dataset.zoom,'1.00');f.click({mode:'scale'});f.step();assert.equal(f.frames(),0);
const pointer={button:0,isPrimary:true,pointerId:1,pointerType:'touch',clientX:500,target:{closest:()=>null}};f.get('peopleViewport').dispatch('pointerdown',pointer);f.get('peopleViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step();assert.equal(f.get('peopleStudy').dataset.orbit,'0.00');f.get('touchExplore').dispatch('click',{currentTarget:f.get('touchExplore')});f.get('peopleViewport').dispatch('pointerdown',pointer);f.get('peopleViewport').dispatch('pointermove',{pointerId:1,clientX:800});f.step(1);assert.equal(f.get('peopleStudy').dataset.orbit,'-15.00');f.get('peopleViewport').dispatch('pointercancel',{pointerId:1});f.key('0');f.step();
f.click({action:'in'});f.document.hidden=true;f.document.dispatch('visibilitychange');assert.equal(f.frames(),0);f.document.hidden=false;f.document.dispatch('visibilitychange');f.step();f.window.dispatch('pagehide',{persisted:false});assert(f.disposed());
const r=fixture({reduced:true,narrow:true,query:'?variant=seated&mode=variants'});assert.equal(r.get('peopleStudy').dataset.variant,'seated');r.key('ArrowRight');r.step(1);assert.equal(r.get('peopleStudy').dataset.orbit,'3.00');assert.equal(new Set(r.rectangles().slice(-5).map(v=>v.x)).size,1);r.window.dispatch('pagehide',{persisted:false});
for(const pose of PERSON_POSES){const s=fixture({query:`?view=still&variant=${pose.id}&angle=rear&support=off`});assert.equal(s.get('peopleStudy').dataset.state,'fallback');assert.equal(s.get('peopleStudy').dataset.angle,'reference');assert.equal(s.get('peopleStudy').dataset.support,'true');assert(s.get('fallbackStill').src.endsWith(`person-${pose.id}-still.jpg?v=${PERSON_BASE.revision}`));}
const report={checkpoint:'people-07',revision:PERSON_BASE.revision,status:'approved',masters:1,categories:4,sourceFigures:PEOPLE_SOURCE_OBJECTS.length,poseFits:summary,neighborhoodPeopleInstances:0,approvedFamiliesUnchanged:true,checks:['Standing and walking arm surfaces bend behind the shoulder–wrist chord; walking arms oppose the same-side legs','Fixed limb bone lengths in every pose; identical head dimensions and no instance scaling','Finite geometry, actual bounds, outward limb winding','Actual shoe soles meet ground, pedals or floorboard','Seat anchors meet the actual chair or vehicle saddle','Hands meet approved grip anchors','Triangle-edge checks: riding limbs clear vehicles outside the intended wrist/grip contact zone','Chair and vehicles remain separate review props','Repeated pose instances share compiled geometry and material references','Independent anchors and bounds; shared disposal occurs once','All previously approved geometry fingerprints unchanged','Real viewer fixture: all five pose fits, reference/side/rear cameras and both orbit limits','Equal projection scale across pose board; one-column phone board','Keyboard controls, 100–300 percent zoom, reset, context visibility','On-demand rendering, reduced motion, hidden-page pause','Touch opt-in and pointer cancellation','Pose-specific fallback with explicit reference camera and context','Stable source IDs with valid pose IDs, source bounds and rider links; no scene placements']};
await writeFile(new URL('../../../reports/component-kit/people/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
