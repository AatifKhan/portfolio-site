import * as THREE from '../../assets/vendor/three/three.module.js';
import {LineSegments2} from '../../assets/vendor/three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from '../../assets/vendor/three/addons/lines/LineSegmentsGeometry.js';
import {createAssetLibrary} from './library.js';
import {compileStaticAsset} from './compile.js';
import {createSeatingSet} from './cafe-furniture.js';
import {createNeighborhoodManifest} from './neighborhood-manifest.js';
import {buildNeighborhoodGround,insidePolygon} from './neighborhood-ground.js';
import {GROUND} from './ground.js';
import {metroFloorAt} from './metro.js';
import {fitPedestrians} from './neighborhood-fit.js';

export function buildNeighborhood(){
 const library=createAssetLibrary(),manifest=createNeighborhoodManifest(library),ground=buildNeighborhoodGround(library.materials,manifest),authored=new THREE.Group(),assets=[],ownedGeometry=new Set(),ownedMaterials=new Set();authored.name='neighborhood/authored';authored.add(ground.group);ground.group.traverse(o=>{if(o.geometry)ownedGeometry.add(o.geometry);});
 const rawFurniture=createSeatingSet(library.materials,{id:'cafe-seating-set/standard',x:0,z:0}),furniture=compileStaticAsset({group:rawFurniture,bounds:new THREE.Box3().setFromObject(rawFurniture),anchors:{}},library.materials);furniture.group.traverse(o=>{if(o.geometry)ownedGeometry.add(o.geometry);});
 const groundHeight=(x,z)=>{let y=GROUND.roadY;for(const s of ground.surfaces){if(s.top===0&&insidePolygon(x,z,s.points)&&!s.holes.some(h=>insidePolygon(x,z,h)))y=0;}const c=manifest.instances.find(i=>i.assetId==='courtyard');if(c&&Math.hypot(x-c.position[0],z-c.position[2])<2.12)y=.025;return y;};
 const metro=manifest.instances.find(i=>i.assetId==='metro-entrance');
 manifest.omittedMarkings=[];
 manifest.instances=manifest.instances.filter(r=>{if(r.assetId!=='lane-marking')return true;const onRoad=[-.325,0,.325].every(t=>groundHeight(r.position[0]+Math.cos(r.rotation)*t,r.position[2]-Math.sin(r.rotation)*t)<0);if(!onRoad)manifest.omittedMarkings.push({...r,placementStatus:'omitted',reason:'Dash would enter the pavement.'});return onRoad;});
 fitPedestrians(manifest,groundHeight);
 for(const record of manifest.instances){
  if(!record.supportId&&['person','capsule-tree','conifer','pot','low-planter','lamp','bollard','bench'].includes(record.assetId)){
   const x=record.position[0],z=record.position[2],lx=x-metro.position[0],lz=z-metro.position[2];record.position[1]=record.assetId==='person'&&lx>-2.8&&lx<2.8&&Math.abs(lz)<1.26?metroFloorAt(lx):groundHeight(x,z);
  }
  const asset=record.assetId==='cafe-seating-set'?{group:furniture.group.clone(true),bounds:furniture.bounds.clone(),anchors:{}}:library.createAsset({...record,instanceId:record.id});
  const group=asset.group;group.name=record.id;group.position.fromArray(record.position);group.rotation.y=record.rotation;if(record.layoutDimensions?.crossingDepth)group.scale.z=record.layoutDimensions.crossingDepth/3.8;group.userData={...group.userData,instanceId:record.id,placementStatus:'placed',reviewStatus:record.reviewStatus};authored.add(group);assets.push({record,...asset});
 }
 authored.updateMatrixWorld(true);
 const batches=new THREE.Group();batches.name='neighborhood/rendered';const meshGroups=new Map(),lineGroups=new Map(),p=new THREE.Vector3(),clonedMaterials=new Map();
 authored.traverse(o=>{
  if(!o.geometry)return;
  let parent=o;while(parent.parent&&parent.parent!==authored)parent=parent.parent;const id=parent.name;
  if(o.isLineSegments2){let batch=lineGroups.get(o.material);if(!batch){batch={points:[],ids:new Set()};lineGroups.set(o.material,batch);}batch.ids.add(id);const a=o.geometry.getAttribute('instanceStart'),b=o.geometry.getAttribute('instanceEnd');for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);batch.points.push(...p.toArray());p.fromBufferAttribute(b,i).applyMatrix4(o.matrixWorld);batch.points.push(...p.toArray());}}
  else if(o.isMesh){
   if(o.material.transparent){const m=new THREE.Mesh(o.geometry,o.material);m.name=id+'/glazing';m.matrix.copy(o.matrixWorld);m.matrixAutoUpdate=false;m.userData.instanceIds=[id];batches.add(m);return;}
   const key=o.geometry.uuid+o.material.uuid;if(!meshGroups.has(key))meshGroups.set(key,{geometry:o.geometry,material:o.material,matrices:[],ids:[]});const batch=meshGroups.get(key);batch.matrices.push(o.matrixWorld.clone());batch.ids.push(id);
  }
 });
 for(const batch of meshGroups.values()){
  let material=batch.material;if(material===library.materials.silhouette){if(!clonedMaterials.has(material)){const copy=material.clone();copy.vertexShader='uniform float width; void main(){ vec4 p=vec4(position+normal*width,1.0);\n#ifdef USE_INSTANCING\n p=instanceMatrix*p;\n#endif\n gl_Position=projectionMatrix*modelViewMatrix*p; }';copy.uniforms=material.uniforms;clonedMaterials.set(material,copy);ownedMaterials.add(copy);}material=clonedMaterials.get(material);}
  const mesh=new THREE.InstancedMesh(batch.geometry,material,batch.matrices.length);batch.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.name='instances/'+batch.ids[0];mesh.userData.instanceIds=batch.ids;batches.add(mesh);
 }
 for(const[material,batch]of lineGroups){const geometry=new LineSegmentsGeometry().setPositions(batch.points),line=new LineSegments2(geometry,material);line.name='shared-outlines';line.userData.instanceIds=[...batch.ids];ownedGeometry.add(geometry);batches.add(line);}
 batches.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(batches);let disposed=false;
 return{group:batches,authored,manifest,assets,surfaces:ground.surfaces,bounds,materials:library.materials,groundHeight,dispose(){if(disposed)return;disposed=true;for(const o of batches.children)if(o.isInstancedMesh)o.dispose();ownedGeometry.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());library.dispose();}};
}
