import * as THREE from '../../assets/vendor/three/three.module.js';
import {REFERENCE,fromReference,TOWER_INSTANCES} from './inventory.js';
import {CAFE_VARIANTS,buildCafe} from './cafe.js';
import {OFFICE_VARIANTS} from './office.js';
import {SMALL_VARIANTS,SMALL_SOURCE_OBJECTS} from './small-building.js';
import {CAR_SOURCE_OBJECTS} from './car.js';
import {TWO_WHEELER_SOURCE_OBJECTS} from './two-wheelers.js';
import {PLANTING_SOURCE_OBJECTS} from './planting-inventory.js';
import {STREET_SOURCE_OBJECTS} from './street-inventory.js';
import {PEOPLE_SOURCE_OBJECTS} from './people-inventory.js';
import {GROUND} from './ground.js';
import {createSeatingSet} from './cafe-furniture.js';

export const NEIGHBORHOOD_REVISION=1;
export const VIEWPOINTS=Object.freeze([
 {id:'overview',label:'Whole neighborhood',crop:[0,-55,1536,1090]},
 {id:'housing',label:'Housing society',crop:[0,-55,965,655]},
 {id:'offices',label:'Office district',crop:[815,80,640,440]},
 {id:'central',label:'Café & parking',crop:[510,400,670,435]},
 {id:'metro',label:'Metro plaza',crop:[1080,435,445,320]},
 {id:'cafe-lane',label:'Café lane',crop:[150,650,900,375]},
 {id:'west',label:'Western homes',crop:[0,410,450,420]},
 {id:'perimeter',label:'Eastern home',crop:[1115,710,420,285]},
]);
export function projectPoint(p){const[x,y,z]=p;return[REFERENCE.origin[0]+(x-z)*REFERENCE.pixelsPerUnit/Math.sqrt(2),REFERENCE.origin[1]+(x+z)*REFERENCE.pixelsPerUnit*.5/Math.sqrt(2)-y*REFERENCE.pixelsPerUnit*Math.sqrt(3)/2];}
function projectedBounds(group,rotation=0){const box=new THREE.Box2(),p=new THREE.Vector3(),matrix=new THREE.Matrix4().makeRotationY(rotation);group.updateMatrixWorld(true);group.traverse(o=>{if(!o.isMesh||o.isLineSegments2)return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).applyMatrix4(matrix);const q=projectPoint(p.toArray());box.expandByPoint(new THREE.Vector2(q[0]-REFERENCE.origin[0],q[1]-REFERENCE.origin[1]));}});return box;}
function releaseRaw(group){const gs=new Set();group.traverse(o=>{if(o.geometry)gs.add(o.geometry);});gs.forEach(g=>g.dispose());}
export function createNeighborhoodManifest(library){
 const instances=[],seats=[],embedded=[];
 const add=(spec,position,rotation=0,extra={})=>{const record={id:spec.id,assetId:spec.assetId,variantId:spec.variantId||'standard',districtId:spec.districtId,sourceBounds:spec.sourceBounds,reference:spec.reference||(spec.sourceBounds?[spec.sourceBounds[0]+spec.sourceBounds[2]/2,spec.sourceBounds[1]+spec.sourceBounds[3]]:projectPoint(position)),position:position.map(v=>+v.toFixed(6)),rotation,scale:1,componentStatus:'approved',reviewStatus:'awaiting-composition-review',placementStatus:'placed',...extra};instances.push(record);return record;};
 const at=(spec,ref,rotation=0,y=0,extra={})=>{const p=fromReference(ref);p[1]=y;return add({...spec,reference:ref},p,rotation,extra);};
 const byCrop=(spec,crop,rotation=0,y=0)=>{const a=library.createAsset(spec),b=projectedBounds(a.group,rotation),c=b.getCenter(new THREE.Vector2());return at(spec,[crop[0]+crop[2]/2-c.x,crop[1]+crop[3]/2-c.y+y*REFERENCE.pixelsPerUnit*Math.sqrt(3)/2],rotation,y,{placementMethod:'source-silhouette-center'});};
 for(const s of TOWER_INSTANCES)add(s,s.position,s.rotation);
 for(const s of OFFICE_VARIANTS)byCrop({id:s.sourceId,assetId:'office',variantId:s.id,districtId:'offices',sourceBounds:s.referenceCrop},s.referenceCrop);
 for(const s of SMALL_VARIANTS){const source=SMALL_SOURCE_OBJECTS.find(o=>o.variantId===s.id);byCrop({...source,sourceBounds:s.referenceCrop},s.referenceCrop);if(s.annex)embedded.push({id:'perimeter-home-east-annex-01',parentId:source.id,masterId:'annex',sourceBounds:[1352,830,88,92]});}
 for(const s of CAFE_VARIANTS){const record=byCrop({id:s.sourceId,assetId:'cafe',variantId:s.id,districtId:s.id==='corner'?'central':'cafe-lane',sourceBounds:s.referenceCrop},s.referenceCrop);const raw=buildCafe(library.materials,s.id);raw.group.position.fromArray(record.position);raw.group.rotation.y=record.rotation;raw.group.updateMatrixWorld(true);raw.group.traverse(o=>{if(/\/chair-[01]$/.test(o.name)){const p=o.getWorldPosition(new THREE.Vector3()),q=o.getWorldQuaternion(new THREE.Quaternion()),e=new THREE.Euler().setFromQuaternion(q);const id=record.id+'/'+o.name;seats.push({id,parentId:record.id,districtId:record.districtId,position:p.toArray(),rotation:e.y+Math.PI/2});embedded.push({id,parentId:record.id,masterId:'chair',position:p.toArray(),rotation:e.y});}if(/\/table$/.test(o.name))embedded.push({id:record.id+'/'+o.name,parentId:record.id,masterId:'table',position:o.getWorldPosition(new THREE.Vector3()).toArray()});});releaseRaw(raw.group);}
 // Two freestanding terrace sets visible beyond the storefronts reuse the approved furniture.
 for(const[id,ref]of[['terrace-extra-west',[374,916]],['terrace-extra-east',[818,957]]]){const r=at({id,assetId:'cafe-seating-set',variantId:'standard',districtId:'cafe-lane'},ref);embedded.push({id:id+'/table',parentId:id,masterId:'table',position:r.position});for(const s of[-1,1]){const seat={id:`${id}/chair-${s<0?0:1}`,parentId:id,districtId:'cafe-lane',position:[r.position[0],0,r.position[2]+s*.76],rotation:s<0?-Math.PI/2:Math.PI/2};seats.push(seat);embedded.push({...seat,masterId:'chair',rotation:seat.rotation-Math.PI/2});}}
 for(const s of PLANTING_SOURCE_OBJECTS)at(s,s.reference,s.assetId==='low-planter'?Math.PI/2:0);
 for(const s of STREET_SOURCE_OBJECTS.filter(s=>!['gatepost','fence-panel'].includes(s.assetId)))at(s,s.reference,0,s.assetId==='bench'?.025:0);
 const fenceStart=fromReference([531,489]),end=fromReference([692,451]),direction=new THREE.Vector3(end[0]-fenceStart[0],0,end[2]-fenceStart[2]).normalize(),heading=Math.atan2(-direction.z,direction.x),postAt=[0,1.99,2.65,4.64,6.63];
 postAt.forEach((t,i)=>{const p=new THREE.Vector3(...fenceStart).addScaledVector(direction,t);add({id:`gatepost-housing-${String(i+1).padStart(2,'0')}`,assetId:'gatepost',districtId:'housing',reference:projectPoint(p.toArray())},p.toArray(),heading);});
 [[0,1],[2,3],[3,4]].forEach(([a,b],i)=>{const t=(postAt[a]+postAt[b])/2,p=new THREE.Vector3(...fenceStart).addScaledVector(direction,t);add({id:`fence-run-housing-${String(i+1).padStart(2,'0')}/panel-01`,assetId:'fence-panel',districtId:'housing',reference:projectPoint(p.toArray())},p.toArray(),heading,{sourceId:`fence-run-housing-${String(i+1).padStart(2,'0')}`,repeatIndex:0});});
 const cars=new Map();for(const s of CAR_SOURCE_OBJECTS){const rotation=/central-01|east-/.test(s.id)&&!s.id.startsWith('parking')?Math.PI/2:0;const r=byCrop(s,s.sourceBounds,rotation,GROUND.roadY);cars.set(s.id,r);if(s.id.startsWith('parking'))add({id:s.id+'/bay',assetId:'parking-bay',districtId:s.districtId,reference:r.reference},[...r.position.slice(0,1),0,r.position[2]],Math.PI/2,{sourceId:s.id});}
 const vehicles=new Map();for(const s of TWO_WHEELER_SOURCE_OBJECTS){const rotation=s.id==='road-scooter-central-01'?Math.PI/2:0;vehicles.set(s.id,byCrop(s,s.sourceBounds,rotation,GROUND.roadY));}
 const metro=byCrop({id:'metro-entrance-01',assetId:'metro-entrance',variantId:'standard',districtId:'metro',sourceBounds:[1149,464,260,196]},[1149,464,260,196]);
 at({id:'courtyard-housing',assetId:'courtyard',districtId:'housing',sourceBounds:[480,334,157,81]},[558,374]);
 const available=[...seats];
 for(const s of PEOPLE_SOURCE_OBJECTS){
  if(s.vehicleSourceId){const vehicle=vehicles.get(s.vehicleSourceId);add(s,vehicle.position,vehicle.rotation,{supportId:vehicle.id});continue;}
  const [x,y,w,h]=s.sourceBounds,ref=[x+w/2,y+h],p=fromReference(ref);
  if(s.variantId==='seated'){
   const candidates=available.filter(a=>a.districtId===s.districtId).sort((a,b)=>Math.hypot(a.position[0]-p[0],a.position[2]-p[2])-Math.hypot(b.position[0]-p[0],b.position[2]-p[2]));
   if(candidates.length){const seat=candidates[0];available.splice(available.indexOf(seat),1);add(s,seat.position,seat.rotation,{supportId:seat.id,reference:ref});continue;}
   at({...s,variantId:'standing'},ref,Math.PI/2,0,{sourcePose:'seated',placementNote:'Occluded guest shown standing where no approved chair exists.'});continue;
  }
  // Metro stair occupants are placed against the real floor in the model pass.
  at(s,ref,s.variantId==='walking'?(instances.length%2?Math.PI/2:Math.PI):0);
 }
 const crossings=[['north',[961.74,423.445],Math.PI/2,2.6],['offices',[1111.925,471.538],0,3],['west',[487,630],Math.PI/2,3.8],['cafe',[558,707],0,3.8],['south',[790,814],0,3.8],['metro',[1092,801],Math.PI/2,3.8]];
 for(const[id,ref,rotation,depth]of crossings)at({id:'crossing-'+id,assetId:'crossing',districtId:id==='north'||id==='offices'?'offices':'central'},ref,rotation,0,{layoutDimensions:{crossingDepth:depth},placementNote:'Shared eight-bar marking; layout-specific bar length fits the road width.'});
 const lanes=[[[78,409],[948,911]],[[481,614],[955,417]],[[837,270],[1160,455]],[[1186,476],[1418,363]],[[958,905],[1190,787]]];
 lanes.forEach(([a,b],run)=>{const pa=fromReference(a),pb=fromReference(b),dx=pb[0]-pa[0],dz=pb[2]-pa[2],length=Math.hypot(dx,dz),rotation=Math.atan2(-dz,dx);for(let t=.7,i=0;t<length-.4;t+=1.3,i++){const p=[pa[0]+dx*t/length,0,pa[2]+dz*t/length];if(instances.some(o=>o.assetId==='crossing'&&Math.hypot(o.position[0]-p[0],o.position[2]-p[2])<2.5))continue;add({id:`lane-run-${run+1}/dash-${String(i+1).padStart(2,'0')}`,assetId:'lane-marking',districtId:'ground'},p,rotation);}});
 return{revision:NEIGHBORHOOD_REVISION,status:'awaiting-composition-review',reference:REFERENCE,instances,embedded,metroCutout:{center:metro.position,rotation:metro.rotation,local:GROUND.metroHole},notes:['All architecture and props retain master scale; five towers share one master.','Crossing lengths are declared ground-layout dimensions; stripe widths, count and spacing stay unchanged.','Two freestanding terrace sets reuse approved café furniture.','Source positions are inferred from the illustration; fit corrections are recorded per instance.','Ground polygons are specific to this layout.']};
}
