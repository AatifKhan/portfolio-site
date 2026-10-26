import * as THREE from '../../assets/vendor/three/three.module.js';
import {KitDrawing} from './style.js';
import {GROUND} from './ground.js';
import {fromReference} from './inventory.js';
export const SURFACE_REGIONS=Object.freeze([
 {id:'paving-housing',districtId:'housing',points:[[12,329],[413,117],[511,173],[716,167],[824,232],[944,389],[933,410],[436,594]]},
 {id:'paving-offices',districtId:'offices',points:[[827,242],[1036,121],[1438,326],[1180,474]]},
 {id:'paving-central-metro',districtId:'central',points:[[529,623],[981,445],[1163,529],[1210,506],[1308,529],[1510,640],[1345,730],[1204,651],[1152,713],[952,831]]},
 {id:'paving-west',districtId:'perimeter',points:[[7,477],[73,455],[278,574],[248,599],[377,673],[279,726],[23,602]]},
 {id:'paving-home-west',districtId:'perimeter',points:[[5,715],[92,649],[245,734],[166,802]]},
 {id:'paving-cafe-lane',districtId:'cafe-lane',points:[[14,805],[156,708],[201,725],[270,687],[1038,964],[746,1032],[496,999]]},
 {id:'paving-home-east',districtId:'perimeter',points:[[1139,854],[1257,782],[1390,790],[1523,847],[1316,964]]},
]);
const outline=[[5,329],[413,112],[510,169],[715,162],[824,228],[1036,115],[1441,326],[1467,373],[1216,501],[1517,639],[1395,718],[1529,848],[1316,970],[1207,945],[1101,1010],[949,930],[747,1026],[493,993],[10,801],[45,748],[7,708],[72,633],[18,602],[31,520],[2,479],[98,426]];
function soften(points,r=.16){return points.flatMap((p,i)=>{const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length],a=Math.min(r,Math.hypot(prev[0]-p[0],prev[1]-p[1])*.2),b=Math.min(r,Math.hypot(next[0]-p[0],next[1]-p[1])*.2),v=new THREE.Vector2(prev[0]-p[0],prev[1]-p[1]).normalize().multiplyScalar(a).add(new THREE.Vector2(...p)),w=new THREE.Vector2(next[0]-p[0],next[1]-p[1]).normalize().multiplyScalar(b).add(new THREE.Vector2(...p));return Array.from({length:5},(_,j)=>{const t=j/4;return[(1-t)**2*v.x+2*(1-t)*t*p[0]+t*t*w.x,(1-t)**2*v.y+2*(1-t)*t*p[1]+t*t*w.y];});});}
const world=points=>points.map(p=>{const v=fromReference(p);return[v[0],v[2]];});
function shape(points,holes=[]){const s=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));holes.forEach(h=>s.holes.push(new THREE.Path(h.map(([x,z])=>new THREE.Vector2(x,-z)))));return s;}
export function insidePolygon(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function lineIntervals(p,vertical,polygon){const axis=vertical?0:1,other=1-axis,points=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if((a[axis]<=p&&b[axis]>p)||(b[axis]<=p&&a[axis]>p))points.push(a[other]+(p-a[axis])*(b[other]-a[other])/(b[axis]-a[axis]));}return points.sort((a,b)=>a-b);}
export function buildNeighborhoodGround(materials,manifest){
 const group=new THREE.Group();group.name='neighborhood/ground';const [mx,,mz]=manifest.metroCutout.center,hole=GROUND.metroHole,metroHole=[[mx+hole[0][0],mz+hole[0][1]],[mx+hole[1][0],mz+hole[0][1]],[mx+hole[1][0],mz+hole[1][1]],[mx+hole[0][0],mz+hole[1][1]]];
 const parkingHole=world([[879,718],[1017,596],[1162,675],[1013,780]]);
 const surfaces=[];
 function slab(id,points,top,tint,holes=[],grid=false){const d=new KitDrawing(id,materials,'neighborhood-ground');const matrix=new THREE.Matrix4().makeRotationX(-Math.PI/2);matrix.setPosition(0,GROUND.baseY,0);d.geometry(new THREE.ExtrudeGeometry(shape(points,holes),{depth:top-GROUND.baseY,bevelEnabled:false,steps:1}),matrix,tint,false);d.path(points.map(([x,z])=>[x,top+.001,z]),'profile',true);
  if(grid){for(const vertical of[true,false]){const values=points.map(p=>p[vertical?0:1]),min=Math.min(...values),max=Math.max(...values);for(let p=Math.ceil(min/GROUND.grid)*GROUND.grid;p<max;p+=GROUND.grid){const intersections=lineIntervals(p,vertical,points),excludes=holes.flatMap(h=>lineIntervals(p,vertical,h));for(let i=0;i<intersections.length;i+=2){let segments=[[intersections[i]+.025,intersections[i+1]-.025]];for(let k=0;k<excludes.length;k+=2)segments=segments.flatMap(([a,b])=>excludes[k+1]<a||excludes[k]>b?[[a,b]]:[[a,Math.min(b,excludes[k]-.006)],[Math.max(a,excludes[k+1]+.006),b]]);for(const[a,b]of segments){if(!(b>a))continue;const x=vertical?p:(a+b)/2,z=vertical?(a+b)/2:p,dx=vertical?.004:(b-a)/2,dz=vertical?(b-a)/2:.004;d.quad([[x-dx,.002,z-dz],[x+dx,.002,z-dz],[x+dx,.002,z+dz],[x-dx,.002,z+dz]],'#e1eaff',false);}}}}}
  const g=d.finish();g.userData={surfaceId:id,top,source:'shared-ground-style',placementStatus:'placed'};group.add(g);surfaces.push({id,points,holes,top});
 }
 slab('road-network',soften(world(outline)),GROUND.roadY,'#c6d7ff',[metroHole]);
 for(const spec of SURFACE_REGIONS)slab(spec.id,soften(world(spec.points)),0,'paper',spec.id==='paving-central-metro'?[metroHole,parkingHole]:[],true);
 group.updateMatrixWorld(true);return{group,surfaces};
}
