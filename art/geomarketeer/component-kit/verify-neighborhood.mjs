import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from '../../../assets/vendor/three/three.module.js';
import {createAssetLibrary} from '../../../scripts/geomarketeer-kit/library.js';
import {buildNeighborhood} from '../../../scripts/geomarketeer-kit/neighborhood-model.js';
import {insidePolygon} from '../../../scripts/geomarketeer-kit/neighborhood-ground.js';
import {TOWER} from '../../../scripts/geomarketeer-kit/tower.js';
import {CAFE_VARIANTS} from '../../../scripts/geomarketeer-kit/cafe.js';
import {OFFICE_VARIANTS} from '../../../scripts/geomarketeer-kit/office.js';
import {SMALL_VARIANTS} from '../../../scripts/geomarketeer-kit/small-building.js';
import {PERSON_POSES} from '../../../scripts/geomarketeer-kit/people.js';
import {PLANTING_VARIANTS} from '../../../scripts/geomarketeer-kit/planting.js';
import {GROUND_VARIANTS} from '../../../scripts/geomarketeer-kit/ground.js';
import {metroFloorAt} from '../../../scripts/geomarketeer-kit/metro.js';
const read=name=>readFile(new URL(name,import.meta.url),'utf8'),near=(a,b,t=.003)=>assert(Math.abs(a-b)<t,`${a} != ${b}`);
const hash=group=>{const h=createHash('sha256');group.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes)){const d=a.isInterleavedBufferAttribute?a.data.array:a.array;h.update(Buffer.from(d.buffer,d.byteOffset,d.byteLength));}});return h.digest('hex');};
const library=createAssetLibrary();let fingerprints=0;
for(const[assetId,specs,file]of[['cafe',CAFE_VARIANTS,'cafe'],['office',OFFICE_VARIANTS,'office'],['small-building',SMALL_VARIANTS,'small-building'],['hatchback',[{id:'standard'}],'car'],['person',PERSON_POSES,'people'],['metro-entrance',[{id:'standard'}],'metro']]){const snapshot=JSON.parse(await read(`approved-${file}-geometry.json`));for(const s of specs){assert.equal(hash(library.createAsset({assetId,variantId:s.id}).group),snapshot.hashes[s.id]);fingerprints++;}}
for(const file of['two-wheeler','street']){const snapshot=JSON.parse(await read(`approved-${file}-geometry.json`));for(const[assetId,h]of Object.entries(snapshot.hashes)){assert.equal(hash(library.createAsset({assetId}).group),h);fingerprints++;}}
for(const[file,specs]of[['planting',PLANTING_VARIANTS],['ground',GROUND_VARIANTS]]){const snapshot=JSON.parse(await read(`approved-${file}-geometry.json`));for(const s of specs){assert.equal(hash(library.createAsset(s).group),snapshot.hashes[s.id]);fingerprints++;}}
assert.equal(hash(library.createAsset({assetId:'residential-tower'}).group),(await read('approved-tower-geometry.sha256')).trim());fingerprints++;library.dispose();
const m=buildNeighborhood(),records=m.manifest.instances,geometries=new Set(),materials=new Set();
assert.equal(new Set(records.map(r=>r.id)).size,records.length);assert.equal(records.filter(r=>r.assetId==='person').length,126);assert.equal(records.filter(r=>r.assetId==='hatchback').length,13);assert.equal(records.filter(r=>r.assetId==='cafe').length,5);assert(records.every(r=>r.reviewStatus==='awaiting-composition-review'&&r.componentStatus==='approved'&&r.reference?.length===2&&!r.fitWarning));
const towers=m.assets.filter(a=>a.record.assetId==='residential-tower');assert.equal(towers.length,5);const geometryList=g=>{const out=[];g.traverse(o=>{if(o.geometry)out.push(o.geometry);});return out;};for(const a of towers){assert.deepEqual(a.group.scale.toArray(),[1,1,1]);assert.deepEqual(geometryList(a.group),geometryList(towers[0].group));assert.equal(a.record.variantId,'standard');}
for(const g of[m.authored,m.group])g.traverse(o=>{if(o.geometry){geometries.add(o.geometry);assert(o.matrixWorld.elements.every(Number.isFinite));for(const a of Object.values(o.geometry.attributes)){const values=a.isInterleavedBufferAttribute?a.data.array:a.array;assert(values.every(Number.isFinite),o.name);}}if(o.material)materials.add(o.material);});
assert(!m.bounds.isEmpty());assert(m.bounds.min.toArray().concat(m.bounds.max.toArray()).every(Number.isFinite));assert(m.group.children.length<180,'Batching keeps draw objects bounded');
const authoredMeshes=[];m.authored.traverse(o=>{if(o.isMesh&&!o.isLineSegments2)authoredMeshes.push(o);});
for(const batch of m.group.children.filter(o=>o.isInstancedMesh)){assert.equal(batch.count,batch.userData.instanceIds.length);for(let i=0;i<batch.count;i++){const matrix=new THREE.Matrix4();batch.getMatrixAt(i,matrix);assert(authoredMeshes.some(o=>o.geometry===batch.geometry&&o.matrixWorld.elements.every((n,j)=>Math.abs(n-matrix.elements[j])<.00001)),'Every render instance matches an authored transform');}}
const silhouette=m.group.children.find(o=>o.material?.isShaderMaterial&&o.isInstancedMesh);assert(silhouette.material.vertexShader.includes('instanceMatrix'));assert.equal(silhouette.material.uniforms,m.materials.silhouette.uniforms);
const groundMeshes=[];m.authored.children[0].traverse(o=>{if(o.isMesh&&!o.isLineSegments2)groundMeshes.push(o);});
function ray(meshes,x,z){return new THREE.Raycaster(new THREE.Vector3(x,4,z),new THREE.Vector3(0,-1,0),0,12).intersectObjects(meshes,false);}
for(const s of m.surfaces)for(const hole of s.holes){for(const[x,z]of hole)assert(insidePolygon(x,z,s.points),s.id+' hole must be contained');}
const metro=m.assets.find(a=>a.record.assetId==='metro-entrance'),[mx,,mz]=metro.record.position;
for(const x of[-1.35,-.75,-.15,.45,1.85])for(const z of[-1.1,0,1.1]){assert.equal(ray(groundMeshes,mx+x,mz+z).length,0,'No ground or grid covers metro well');}
const metroMeshes=[];metro.group.traverse(o=>{if(o.isMesh&&!o.isLineSegments2&&!o.material.transparent)metroMeshes.push(o);});near(ray(metroMeshes,mx+1.85,mz)[0].point.y,-1.12);
for(const a of m.assets){const r=a.record;
 const spec=({'residential-tower':[TOWER],cafe:CAFE_VARIANTS,office:OFFICE_VARIANTS,'small-building':SMALL_VARIANTS}[r.assetId]||[]).find(s=>s.id===r.variantId||s===TOWER);
 if(spec)for(const x of[-spec.width/2,spec.width/2])for(const z of[-spec.depth/2,spec.depth/2])assert(m.groundHeight(x+r.position[0],z+r.position[2])>=0,r.id+' footprint on pavement');
 if(['hatchback','crossing','parking-bay','lane-marking'].includes(r.assetId)){const w=r.assetId==='hatchback'?1.05:a.bounds.max.x-.001,d=r.assetId==='hatchback'?.53:a.bounds.max.z-.001;for(const x of[-w,0,w])for(const z of[-d,0,d]){const p=new THREE.Vector3(x,0,z).applyMatrix4(a.group.matrixWorld);near(m.groundHeight(p.x,p.z),-.12);}}
 if(r.assetId==='hatchback')near(new THREE.Box3().setFromObject(a.group).min.y,-.12);
 if(r.assetId==='person'){
  if(!r.supportId){near(r.position[1],m.groundHeight(r.position[0],r.position[2]));for(const b of m.assets.filter(b=>['cafe','office','small-building','residential-tower'].includes(b.record.assetId))){const s=({'residential-tower':[TOWER],cafe:CAFE_VARIANTS,office:OFFICE_VARIANTS,'small-building':SMALL_VARIANTS}[b.record.assetId]).find(s=>s.id===b.record.variantId||s===TOWER);assert(Math.abs(r.position[0]-b.record.position[0])>=s.width/2+.239||Math.abs(r.position[2]-b.record.position[2])>=s.depth/2+.239,r.id+' outside architecture');}}
  else if(r.supportId.endsWith('/floor')){near(r.position[1],metroFloorAt(r.position[0]-mx));near(a.group.localToWorld(a.anchors.leftFoot.clone()).y,r.position[1]);}
  else if(r.variantId==='seated'){const chair=m.manifest.embedded.find(c=>c.id===r.supportId);assert(chair);near(Math.hypot(r.position[0]-chair.position[0],r.position[2]-chair.position[2]),0);near(Math.cos(r.rotation-(chair.rotation+Math.PI/2)),1);near(a.group.localToWorld(a.anchors.seat.clone()).y,chair.position[1]+.4975);}
  else {const v=m.assets.find(v=>v.record.id===r.supportId);assert(v);assert.deepEqual(r.position,v.record.position);near(r.rotation,v.record.rotation);for(const[human,vehicle]of[['seat','seat'],['leftHand','leftGrip'],['rightHand','rightGrip']]){if(v.anchors[vehicle])assert(a.group.localToWorld(a.anchors[human].clone()).distanceTo(v.group.localToWorld(v.anchors[vehicle].clone()))<.08);}}
 }
}
for(const chair of m.manifest.embedded.filter(r=>r.masterId==='chair'&&r.position[1]===0))for(const x of[-.22,.22])for(const z of[-.22,.22])near(m.groundHeight(chair.position[0]+x,chair.position[2]+z),0);
const panels=m.assets.filter(a=>a.record.assetId==='fence-panel'),posts=m.assets.filter(a=>a.record.assetId==='gatepost');for(const panel of panels)for(const end of[-.825,.825]){const p=panel.group.localToWorld(new THREE.Vector3(end,.84,0));assert(posts.some(a=>Math.abs(p.distanceTo(a.group.localToWorld(new THREE.Vector3(0,.84,0)))-.17)<.003),'Panel meets post face');}
let dg=0,dm=0,di=0;geometries.forEach(g=>g.addEventListener('dispose',()=>dg++));materials.forEach(g=>g.addEventListener('dispose',()=>dm++));const instanced=m.group.children.filter(o=>o.isInstancedMesh);instanced.forEach(g=>g.addEventListener('dispose',()=>di++));m.dispose();m.dispose();assert.equal(dg,geometries.size);assert.equal(dm,materials.size);assert.equal(di,instanced.length);
const exportData=JSON.parse(await read('neighborhood-manifest.json'));assert.deepEqual(exportData.instances,JSON.parse(JSON.stringify(records)));assert.equal(exportData.surfaces.length,8);
const report={checkpoint:'neighborhood-12',status:'awaiting-composition-review',tests:'pass',instances:records.length,people:126,towers:5,approvedGeometryFingerprints:fingerprints,renderObjects:m.group.children.length,sharedGeometryResources:geometries.size,pedestrianFitAdjustments:records.filter(r=>r.sourcePosition).length,checks:['Unique stable IDs, source locations and declared variants','All approved component geometry unchanged; identical shared towers','Finite buffers and matrices; optimized instances match authored transforms','All architecture corners on pavement; cars, bays and crossings on road','Metro hole and grid are clear over stairs and lower landing','People clear of architecture; seated and riding anchors aligned','Fence rails meet shared posts','Resources and instancing buffers dispose exactly once','Exported manifest matches actual assembled scene']};
await writeFile(new URL('../../../reports/component-kit/neighborhood/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
