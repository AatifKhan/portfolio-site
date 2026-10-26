import * as THREE from '../../assets/vendor/three/three.module.js';
import {GROUND} from './ground.js';
// These arrangements are review fixtures. None appears in the scene manifest.
export function createGroundReview(library,kind,spec){
 const group=new THREE.Group(),parts=[];group.name='review-only/'+kind+(spec?'/'+spec.id:'');
 const add=(assetId,variantId,position=[0,0,0],rotation=0)=>{const a=library.createAsset({assetId,variantId,instanceId:`${group.name}/${assetId}/${parts.length}`});a.group.position.set(...position);a.group.rotation.y=rotation;group.add(a.group);parts.push(a);return a;};
 if(kind==='street'){
  add('road','straight');add('pavement','ramp',[0,0,3.4]);add('pavement','ramp',[0,0,-3.4],Math.PI);add('crossing','standard');for(const x of[-3.2,-2.1,2.1,3.2])add('lane-marking','standard',[x,0,0]);
 }else if(kind==='parking'){
  add('road','straight');for(let i=0;i<4;i++){const x=(i-1.5)*GROUND.bayWidth;add('parking-bay','standard',[x,0,-.25]);if(i!==2)add('hatchback','standard',[x,GROUND.roadY,-.25],-Math.PI/2);}
 }else if(kind==='metro'){
  add('pavement','metro');add('metro-entrance','standard');
 }else{
  if(['crossing','lane-marking','parking-bay'].includes(spec.assetId))add('road','straight');
  if(spec.assetId==='courtyard')add('pavement','plaza');
  if(spec.assetId==='kerb'){for(let i=0;i<5;i++)add('kerb','standard',[(i-2)*.8,0,0]);}
  else if(spec.assetId==='lane-marking'){for(let i=0;i<5;i++)add(spec.assetId,spec.variantId,[(i-2)*1.2,0,0]);}
  else add(spec.assetId,spec.variantId);
 }
 group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group);
 // A little depth in a flat surface's bounds keeps orthographic framing useful.
 return{group,bounds,parts};
}
