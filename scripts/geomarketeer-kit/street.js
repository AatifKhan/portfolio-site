import * as THREE from '../../assets/vendor/three/three.module.js';
import {KitDrawing} from './style.js';

export const STREET_REVISION=1;
export const FENCE=Object.freeze({span:1.65,depth:.05,bottom:.24,top:1.35,pickets:13,postWidth:.34,postHeight:1.72});
export const STREET_MASTERS=Object.freeze([
    {id:'lamp',label:'Lamp',height:2.35,detailBounds:[[-.18,1.97,-.18],[.18,2.36,.18]],subtitle:'Lantern head · stepped base',referenceCrop:[658,495,26,74],referenceLabel:'Central crossing · lantern-topped lamp',description:'A slim pole with a stepped foot, tapered glazed lantern and shallow pyramidal cap. One unchanged master for every lamp.'},
    {id:'bollard',label:'Bollard',height:.78,detailBounds:[[-.085,.59,-.085],[.085,.79,.085]],subtitle:'Rounded cap · circular foot',referenceCrop:[574,613,23,37],referenceLabel:'Central pavement · rounded bollard',description:'A short slender post, rounded cap and compact circular base. The pale shaft and cobalt contour echo the small repeated pavement posts.'},
    {id:'bench',label:'Bench',height:.46,detailBounds:[[.4,0,-.26],[.74,.47,.26]],subtitle:'Five slats · open seat',referenceCrop:[526,369,33,31],referenceLabel:'Housing courtyard · low slatted bench',description:'A low backless bench with five real seat slats, two under-seat supports and four connected feet. The open construction follows the courtyard reference.'},
    {id:'bin',label:'Bin',height:.84,detailBounds:[[-.255,.65,-.255],[.255,.85,.255]],subtitle:'Inferred · recessed opening',referenceCrop:[862,728,52,77],referenceLabel:'Street context · bin shape inferred',inferred:true,description:'A simple cylindrical bin with a recessed top opening, thin rim and removable lid seam. This is an inferred kit component: the reference does not show a clearly identifiable bin.'},
    {id:'fence-panel',label:'Fence panel',height:1.3775,detailBounds:[[.49,1.15,-.06],[.84,1.39,.06]],subtitle:'13 pickets · shared end anchors',referenceCrop:[630,411,54,62],referenceLabel:'Housing boundary · repeated metal panel',description:'A repeatable panel with thirteen pickets, top and bottom rails, and fixed end anchors. The fence assembly preview connects three copies to four gateposts.'},
    {id:'gatepost',label:'Gatepost',height:1.72,detailBounds:[[-.20,1.09,-.20],[.20,1.73,.20]],subtitle:'Square pier · inset plaque',referenceCrop:[613,416,31,63],referenceLabel:'Housing entrance · square pier',description:'A square pier with a thin cap, pale inset plaque and two pairs of panel attachment points. The same post closes every panel joint.'},
].map((s,i)=>Object.freeze({...s,number:String(i+1).padStart(2,'0'),assetId:s.id,variantId:'standard',category:'Street furniture'})));
const I=new THREE.Matrix4();
const matrix=(x,y,z,ry=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry),new THREE.Vector3(1,1,1));
function organic(draw){const group=draw.finish();for(const mesh of [...group.children])if(mesh.isMesh&&!mesh.isLineSegments2){mesh.material=draw.materials.organicFill;const hull=new THREE.Mesh(mesh.geometry,draw.materials.silhouette);hull.name=mesh.name+'/silhouette';group.add(hull);}return group;}
function lathe(materials,name,points,tint='paper'){const d=new KitDrawing(name,materials,'street');d.geometry(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),32),I,tint,false);return organic(d);}
function rod(draw,a,b,r,tint='wall'){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.sub(p),m=new THREE.Matrix4().compose(p.clone().addScaledVector(delta,.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize()),new THREE.Vector3(1,1,1));draw.geometry(new THREE.CylinderGeometry(r,r,delta.length(),12),m,tint,false);}
function lamp(materials){const g=new THREE.Group();g.name='lamp/assembly';
    g.add(lathe(materials,'lamp/pole',[[0,0],[.10,0],[.10,.035],[.072,.055],[.062,.075],[.057,.26],[.038,.31],[.031,.34],[.031,2.04],[0,2.04]]));
    const frame=new KitDrawing('lamp/lantern-frame',materials,'street'),glass=new KitDrawing('lamp/glazing',materials,'street'),roof=new KitDrawing('lamp/roof',materials,'street');
    frame.box(0,2.025,0,.17,.045,.17,'paper','detail');frame.box(0,2.252,0,.28,.025,.28,'paper','detail');
    const bottom=[[-.066,2.045,-.066],[.066,2.045,-.066],[.066,2.045,.066],[-.066,2.045,.066]],top=bottom.map(([x,,z])=>[Math.sign(x)*.123,2.24,Math.sign(z)*.123]);
    for(let i=0;i<4;i++){rod(frame,bottom[i],top[i],.011,'accent');const j=(i+1)%4;glass.quad([bottom[i],bottom[j],top[j],top[i]],'glass',false);}
    const bulb=new KitDrawing('lamp/diffuser',materials,'street');bulb.geometry(new THREE.SphereGeometry(.04,16,10),matrix(0,2.137,0),'#ffffff',false);g.add(bulb.finish());
    const corners=[[-.153,2.2645,-.153],[.153,2.2645,-.153],[.153,2.2645,.153],[-.153,2.2645,.153]],vertices=[];
    for(let i=0;i<4;i++){const j=(i+1)%4;vertices.push(...corners[i],0,2.35,0,...corners[j]);roof.path([corners[i],[0,2.35,0]],'detail');}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();roof.geometry(geo,I,'paper',false);roof.path(corners,'ink',true);
    const glazing=glass.finish();glazing.traverse(o=>{if(o.isMesh)o.material=materials.glazing;});g.add(frame.finish(),roof.finish(),glazing);return g;}
function bollard(materials){const g=new THREE.Group();g.name='bollard/assembly';g.add(lathe(materials,'bollard/body',[[0,0],[.082,0],[.082,.035],[.06,.057],[.037,.075],[.037,.665],[.052,.68],[.052,.71],[0,.71]]));const d=new KitDrawing('bollard/cap',materials,'street');d.geometry(new THREE.SphereGeometry(.059,24,16),matrix(0,.721,0),'paper',false);g.add(organic(d));return g;}
function bench(materials){const g=new THREE.Group();g.name='bench/assembly';const seat=new KitDrawing('bench/seat',materials,'street'),frame=new KitDrawing('bench/frame',materials,'street');
    for(let i=0;i<5;i++){const z=-.20+i*.10;seat.box(0,.4325,z,1.46,.055,.078,'paper',false);seat.path([[-.73,.46,z-.039],[.73,.46,z-.039],[.73,.46,z+.039],[-.73,.46,z+.039]],'detail',true);}
    for(const x of[-.56,.56]){frame.box(x,.378,0,.075,.055,.49,'wall','profile');frame.box(x,.265,0,.045,.045,.43,'wall','profile');for(const z of[-.18,.18]){rod(frame,[x,.025,z*1.18],[x,.415,z],.027,'glass');frame.box(x,.014,z*1.18,.09,.028,.08,'wall','profile');}}
    frame.box(0,.265,0,1.16,.045,.045,'wall','profile');g.add(seat.finish(),organic(frame));return g;}
function bin(materials){const g=new THREE.Group();g.name='bin/assembly';
    // Closed outer wall and inner cavity; the dark insert is recessed below the opening.
    g.add(lathe(materials,'bin/body',[[0,0],[.21,0],[.23,.045],[.23,.70],[.207,.72],[.19,.70],[.19,.055],[0,.055]],'wall'));
    g.add(lathe(materials,'bin/lid',[[.135,.76],[.215,.76],[.249,.78],[.249,.81],[.23,.84],[.135,.84],[.125,.825],[.125,.775],[.135,.76]],'paper'));
    g.add(lathe(materials,'bin/neck',[[.19,.70],[.213,.72],[.213,.785],[.13,.785],[.13,.71],[.19,.70]],'#8ca9df'));
    const d=new KitDrawing('bin/details',materials,'street');d.cylinder(0,.725,0,.188,.012,'#7497db',false);d.ring(0,.84,0,.136,'detail');d.ring(0,.78,0,.249,'profile');
    // A restrained service seam on the rear, not an invented graphic identity.
    d.path([[-.09,.16,-.214],[-.09,.62,-.214],[.09,.62,-.214],[.09,.16,-.214]],'hair',true);g.add(d.finish());return g;}
function fence(materials){const g=new THREE.Group();g.name='fence-panel/assembly';const rails=new KitDrawing('fence-panel/rails',materials,'street'),bars=new KitDrawing('fence-panel/pickets',materials,'street');
    for(const y of[FENCE.bottom,FENCE.top])rails.box(0,y,0,FENCE.span,.055,FENCE.depth,'wall','detail');
    for(let i=0;i<FENCE.pickets;i++){const x=-.75+i*.125;bars.box(x,(FENCE.top+FENCE.bottom)/2,0,.023,FENCE.top-FENCE.bottom,.023,'accent',false);}
    for(const x of[-FENCE.span/2+.02,FENCE.span/2-.02])rails.box(x,(FENCE.top+FENCE.bottom)/2,0,.04,FENCE.top-FENCE.bottom+.055,.045,'wall','profile');g.add(rails.finish(),bars.finish());return g;}
function gatepost(materials){const d=new KitDrawing('gatepost/pier',materials,'street');d.box(0,.82,0,FENCE.postWidth,1.64,FENCE.postWidth,'paper','ink');d.box(0,1.68,0,.39,.08,.39,'paper','detail');
    // Flush inset on the outward face, matching the small pale rectangle in the reference.
    d.box(0,1.26,.171,.072,.25,.012,'glass','profile');
    for(const x of[-.17,.17])for(const y of[FENCE.bottom,FENCE.top])d.box(x,y,0,.016,.09,.075,'wall','hair');return d.finish();}
export function buildStreet(materials,assetId,variantId='standard'){
    const spec=STREET_MASTERS.find(s=>s.assetId===assetId);if(!spec||variantId!=='standard')throw new Error(`Unknown street component: ${assetId}/${variantId}`);
    const group=new THREE.Group();group.name=`${assetId}/standard`;group.add(({lamp,bollard,bench,bin,'fence-panel':fence,gatepost})[assetId](materials));
    group.userData={assetId,family:'street',variantId,revision:STREET_REVISION,approval:'approved',placementStatus:'unplaced',static:true,inferred:!!spec.inferred};group.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(group),anchors={ground:new THREE.Vector3(),center:bounds.getCenter(new THREE.Vector3()),top:new THREE.Vector3(0,bounds.max.y,0)};
    if(assetId==='bench')anchors.seat=new THREE.Vector3(0,.46,0);
    if(assetId==='lamp')anchors.light=new THREE.Vector3(0,2.137,0);
    if(assetId==='fence-panel'||assetId==='gatepost'){const x=assetId==='fence-panel'?FENCE.span/2:FENCE.postWidth/2;for(const[side,sign]of[['left',-1],['right',1]])for(const[name,y]of[['Lower',FENCE.bottom],['Upper',FENCE.top]])anchors[side+name]=new THREE.Vector3(sign*x,y,0);}
    return{group,bounds,anchors,spec};
}
