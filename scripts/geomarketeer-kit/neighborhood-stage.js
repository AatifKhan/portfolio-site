import * as THREE from '../../assets/vendor/three/three.module.js';
import {buildNeighborhood} from './neighborhood-model.js';
import {VIEWPOINTS} from './neighborhood-manifest.js';
import {REFERENCE,fromReference} from './inventory.js';
import {CAMERA} from './style.js';

export function basis(orbit=0){
 const yaw=CAMERA.yaw+orbit*Math.PI/180;
 return {right:new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),up:new THREE.Vector3(-Math.sin(yaw)*Math.sin(CAMERA.pitch),Math.cos(CAMERA.pitch),-Math.cos(yaw)*Math.sin(CAMERA.pitch)),forward:new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw))};
}
export function boundsPoints(group){
 const b=new THREE.Box3().setFromObject(group),points=[];
 for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z])points.push(new THREE.Vector3(x,y,z));
 return points;
}
export function surfacePoints(group,filter=()=>true){
 const points=[];group.updateMatrixWorld(true);
 group.traverse(o=>{if(!o.isMesh||o.isLineSegments2)return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(filter(p))points.push(p);}});
 return points;
}
export function fitPose(points,orbit=0,aspect=16/9,padding=1.08){
 const {right,up,forward}=basis(orbit),box=new THREE.Box2();
 for(const p of points)box.expandByPoint(new THREE.Vector2(p.dot(right),p.dot(up)));
 const c=box.getCenter(new THREE.Vector2()),size=box.getSize(new THREE.Vector2());
 return {center:right.multiplyScalar(c.x).add(forward.multiplyScalar(-c.y/Math.sin(CAMERA.pitch))).toArray(),span:Math.max(size.y,size.x/aspect)*padding,orbit,zoom:1};
}
export function applyPose(camera,pose,aspect){
 const center=new THREE.Vector3(...pose.center),yaw=CAMERA.yaw+pose.orbit*Math.PI/180;
 camera.left=-pose.span*aspect/2;camera.right=pose.span*aspect/2;camera.top=pose.span/2;camera.bottom=-pose.span/2;camera.zoom=pose.zoom;
 camera.position.copy(center).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(CAMERA.pitch)*120,Math.sin(CAMERA.pitch)*120,Math.cos(yaw)*Math.cos(CAMERA.pitch)*120));
 camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld();return camera;
}
export function interpolatePose(a,b,t){
 const ease=t*t*(3-2*t),mix=(x,y)=>x+(y-x)*ease;
 return {center:a.center.map((n,i)=>mix(n,b.center[i])),span:mix(a.span,b.span),orbit:mix(a.orbit,b.orbit),zoom:mix(a.zoom,b.zoom)};
}
export function createNeighborhoodStage({viewport,onLost=()=>{},Renderer=THREE.WebGLRenderer,buildModel=buildNeighborhood,pixelRatio=1}){
 let renderer,model,disposed=false,lastWidth=0,lastHeight=0;
 try{
  renderer=new Renderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(pixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  model=buildModel();
 }catch(error){model?.dispose();renderer?.dispose();throw error;}
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,400);
 scene.background=new THREE.Color('white');scene.add(model.group);
 const fitPoints=model.assets.flatMap(a=>boundsPoints(a.group));
 for(const s of model.surfaces)for(const[x,z]of s.points)fitPoints.push(new THREE.Vector3(x,s.top,z));
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','The GeoMarketeer neighborhood');
 viewport.prepend(renderer.domElement);
 const lost=e=>{e.preventDefault();onLost();};renderer.domElement.addEventListener('webglcontextlost',lost);
 return {model,camera,renderer,fitPoints,
  get aspect(){return viewport.clientWidth/viewport.clientHeight;},
  explorePose(view='overview',orbit=0,zoom=1){
   const v=VIEWPOINTS.find(v=>v.id===view),[x,y,w,h]=v.crop,center=new THREE.Vector3(...fromReference([x+w/2,y+h/2])),aspect=this.aspect;
   let span=Math.max(h,w/aspect)/REFERENCE.pixelsPerUnit;
   if(view==='overview')for(const angle of[-15,0,15]){const {right,up}=basis(angle);for(const p of fitPoints){const delta=p.clone().sub(center);span=Math.max(span,2*Math.abs(delta.dot(up)),2*Math.abs(delta.dot(right))/aspect);}}
   return {center:center.toArray(),span:span*1.025,orbit,zoom};
  },
  render(pose){
   if(disposed||!viewport.clientWidth||!viewport.clientHeight)return;
   const width=viewport.clientWidth,height=viewport.clientHeight;
   if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height,false);lastWidth=width;lastHeight=height;}
   applyPose(camera,pose,width/height);model.materials.resize(width,height,pose.span,pose.zoom);renderer.render(scene,camera);
  },
  dispose(){if(disposed)return;disposed=true;renderer.domElement.removeEventListener('webglcontextlost',lost);model.dispose();renderer.dispose();renderer.domElement.remove();}
 };
}
