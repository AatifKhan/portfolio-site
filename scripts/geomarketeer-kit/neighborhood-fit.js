import {TOWER} from './tower.js';
import {CAFE_VARIANTS} from './cafe.js';
import {OFFICE_VARIANTS} from './office.js';
import {SMALL_VARIANTS} from './small-building.js';
import {metroFloorAt,METRO} from './metro.js';
export function fitPedestrians(manifest,groundHeight){
 const buildings=manifest.instances.filter(r=>['residential-tower','cafe','office','small-building'].includes(r.assetId)).map(r=>({r,s:({cafe:CAFE_VARIANTS,office:OFFICE_VARIANTS,'small-building':SMALL_VARIANTS}[r.assetId]||[TOWER]).find(s=>s.id===r.variantId)||TOWER}));
 const solid=manifest.instances.filter(r=>['hatchback','scooter','bicycle','capsule-tree','conifer','lamp','bollard','gatepost','bench','fence-panel'].includes(r.assetId));
 const furniture=manifest.embedded.filter(r=>r.position&&['chair','table'].includes(r.masterId));
 const occupied=manifest.instances.filter(r=>r.assetId==='person'&&r.supportId&&!r.supportId.includes('rider')).map(r=>r.position);
 const metro=manifest.instances.find(r=>r.assetId==='metro-entrance'),crossings=manifest.instances.filter(r=>r.assetId==='crossing');
 function blocked(x,z){for(const{r,s}of buildings)if(Math.abs(x-r.position[0])<s.width/2+.24&&Math.abs(z-r.position[2])<s.depth/2+.24)return true;
  for(const r of solid){const dx=x-r.position[0],dz=z-r.position[2],c=Math.cos(r.rotation),s=Math.sin(r.rotation),lx=dx*c-dz*s,lz=dx*s+dz*c;if(r.assetId==='hatchback'){if(Math.abs(lx)<1.37&&Math.abs(lz)<.82)return true;}else if(r.assetId==='fence-panel'){if(Math.abs(lx)<.95&&Math.abs(lz)<.28)return true;}else if(r.assetId==='bench'){if(Math.abs(lx)<1&&Math.abs(lz)<.5)return true;}else if(Math.hypot(dx,dz)<(['capsule-tree','conifer'].includes(r.assetId)?.52:['scooter','bicycle'].includes(r.assetId)?.60:.30))return true;}
  if(furniture.some(r=>Math.hypot(x-r.position[0],z-r.position[2])<(r.masterId==='table'?.65:.43)))return true;
  const mx=x-metro.position[0],mz=z-metro.position[2];if(mx>-2.9&&mx<3.2&&Math.abs(mz)<1.95)return true;
  return occupied.some(p=>Math.hypot(p[0]-x,p[2]-z)<.38);
 }
 for(const r of manifest.instances.filter(r=>r.assetId==='person'&&!r.supportId)){
  const before=[...r.position],lx=r.position[0]-metro.position[0],lz=r.position[2]-metro.position[2];
  if(lx>-2.70&&lx<2.7&&Math.abs(lz)<1.24){
   r.position[2]=metro.position[2]+Math.max(-1.10,Math.min(1.10,lz));if(lx>METRO.stairStart&&lx<METRO.stairStart+8*.3)r.position[0]=metro.position[0]+METRO.stairStart+(Math.floor((lx-METRO.stairStart)/.3)+.5)*.3;
   if(r.variantId==='walking'){r.sourcePose='walking';r.variantId='standing';}r.position[1]=metroFloorAt(r.position[0]-metro.position[0]);r.supportId=metro.id+'/floor';r.placementNote='Feet fitted to actual metro landing or tread.';occupied.push(r.position);continue;
  }
  const canStand=(x,z)=>{const y=groundHeight(x,z);const crossing=r.variantId==='walking'&&crossings.some(c=>{const dx=x-c.position[0],dz=z-c.position[2];return Math.abs(dx*Math.cos(c.rotation)-dz*Math.sin(c.rotation))<1.1&&Math.abs(dx*Math.sin(c.rotation)+dz*Math.cos(c.rotation))<1.8;});return(y>=0||crossing)&&!blocked(x,z);};
  if(!canStand(r.position[0],r.position[2])){let found=false;for(const radius of[.25,.45,.7,1,1.35,1.7,2.1,2.6,3.2,4]){for(let i=0;i<48;i++){const angle=i/48*Math.PI*2,x=before[0]+Math.cos(angle)*radius,z=before[2]+Math.sin(angle)*radius;if(canStand(x,z)){r.position[0]=x;r.position[2]=z;found=true;break;}}if(found)break;}if(!found)r.fitWarning='No clear nearby pedestrian position';else{r.sourcePosition=before;r.placementNote='Small source-position adjustment for pavement, furniture or building clearance.';}}
  r.position[1]=groundHeight(r.position[0],r.position[2]);occupied.push(r.position);
 }
}
