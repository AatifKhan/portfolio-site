import * as THREE from '../../assets/vendor/three/three.module.js';
import {KitDrawing} from './style.js';

export const PLANTING_REVISION=1;
export const PLANTING_MASTERS=Object.freeze([
    {id:'capsule-tree',label:'Capsule tree',parts:['trunk','foot','capsule crown','two surface highlights']},
    {id:'conifer',label:'Conifer',parts:['trunk','foot','three overlapping crown tiers']},
    {id:'pot',label:'Square pot',parts:['tapered tub','rim','soil','flowering mound']},
    {id:'low-planter',label:'Low planter',parts:['tapered trough','rim','soil','repeated flowering mound']},
]);
export const PLANTING_VARIANTS=Object.freeze([
    {id:'capsule-standard',assetId:'capsule-tree',variantId:'standard',label:'Capsule · standard',category:'Trees',height:2.65,radius:.46,crownHeight:1.95,depthRatio:.82,referenceCrop:[473,376,39,80],referenceLabel:'Housing entrance · capsule tree',description:'The reference’s tall capsule crown, a slim trunk and two white highlights. The highlights follow the crown surface as the view turns.'},
    {id:'capsule-small',assetId:'capsule-tree',variantId:'small',label:'Capsule · small',category:'Trees',height:2.25,radius:.39,crownHeight:1.65,depthRatio:.82,referenceCrop:[89,217,36,80],referenceLabel:'West pavement · smaller capsule',description:'A fixed smaller version of the same capsule tree, with the same trunk, crown profile and paired highlights.'},
    {id:'conifer-standard',assetId:'conifer',variantId:'standard',label:'Conifer · standard',category:'Trees',height:2.35,radius:.57,referenceCrop:[622,320,48,83],referenceLabel:'Courtyard · three-tier conifer',description:'Three softly flared tiers overlap around one slender trunk. Rounded rims keep the simple blue contour readable from every side.'},
    {id:'conifer-small',assetId:'conifer',variantId:'small',label:'Conifer · small',category:'Trees',height:1.95,radius:.47,referenceCrop:[134,183,40,80],referenceLabel:'West corner · smaller conifer',description:'The same three-tier construction at a second fixed size. Its compact crown leaves the surrounding pavement open.'},
    {id:'pot-standard',assetId:'pot',variantId:'standard',label:'Square pot · standard',category:'Containers',width:.56,depth:.56,height:.38,clusters:1,referenceCrop:[755,946,38,46],referenceLabel:'Café frontage · square flower tub',description:'A small tapered square tub with a thick rim, recessed blue soil and one restrained flowering mound. A few pale blossoms echo the source.'},
    {id:'pot-small',assetId:'pot',variantId:'small',label:'Square pot · small',category:'Containers',width:.43,depth:.43,height:.30,clusters:1,referenceCrop:[541,915,34,34],referenceLabel:'Café lane · compact flower tub',description:'A compact fixed size of the same square pot, with a smaller mound and the same rim and flower treatment.'},
    {id:'planter-standard',assetId:'low-planter',variantId:'standard',label:'Low planter · standard',category:'Containers',width:1.65,depth:.51,height:.34,clusters:3,referenceCrop:[995,606,81,70],referenceLabel:'Central parking · three flowering mounds',description:'The long low container beside the parking area: one continuous rim and three repetitions of the shared flowering mound.'},
    {id:'planter-short',assetId:'low-planter',variantId:'short',label:'Low planter · short',category:'Containers',width:1.08,depth:.51,height:.34,clusters:2,referenceCrop:[995,606,81,70],referenceLabel:'Declared shorter variation · same planter system',description:'A declared shorter variation with two mounds. The wall thickness, depth and height stay the same as the reference planter.'},
].map((s,i)=>Object.freeze({...s,number:String(i+1).padStart(2,'0'),subtitle:s.category==='Trees'?`${s.height.toFixed(2)} units tall`:`${s.width.toFixed(2)} × ${s.depth.toFixed(2)} unit container`})));
const I=new THREE.Matrix4();
const matrix=(x,y,z,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion(),new THREE.Vector3(sx,sy,sz));
function organic(draw){const group=draw.finish();for(const mesh of [...group.children])if(mesh.isMesh&&!mesh.isLineSegments2){mesh.material=draw.materials.organicFill;const hull=new THREE.Mesh(mesh.geometry,draw.materials.silhouette);hull.name=mesh.name+'/silhouette';group.add(hull);}return group;}
function ellipsoid(draw,position,radii,tint='wall'){draw.geometry(new THREE.SphereGeometry(1,20,12),matrix(...position,...radii),tint,false);}
function trunk(materials,spec){const d=new KitDrawing(`${spec.assetId}/trunk`,materials,'planting'),h=spec.assetId==='capsule-tree'?spec.height-spec.crownHeight+.12:spec.height*.33;
    d.cylinder(0,.025,0,.092,.05,'accent',false);d.ring(0,.051,0,.092,'detail',32);d.cylinder(0,h/2,0,.048,h,'glass',false);return organic(d);}
export function capsuleRadius(spec,y){const bottom=spec.height-spec.crownHeight,r=spec.radius,cy=THREE.MathUtils.clamp(y,bottom+r,spec.height-r);return Math.sqrt(Math.max(0,r*r-(y-cy)**2));}
function capsule(materials,spec){const group=new THREE.Group();group.name='capsule-tree/crown-assembly';const d=new KitDrawing('capsule-tree/crown',materials,'planting');
    d.geometry(new THREE.CapsuleGeometry(spec.radius,spec.crownHeight-2*spec.radius,12,32),matrix(0,spec.height-spec.crownHeight/2,0,1,1,spec.depthRatio),'wall',false);group.add(organic(d));
    // Thin patches conform to the capsule, rather than floating flat cards.
    const highlights=new KitDrawing('capsule-tree/highlights',materials,'planting');
    for(const[dy,ry,rx]of[[.58,.13,.065],[.96,.19,.082]]){const cy=spec.height-dy*spec.height/2.65,points=[],indices=[],rings=5,sectors=32;
        for(let i=0;i<=rings;i++)for(let j=0;j<=sectors;j++){const t=j/sectors*Math.PI*2,q=i/rings,y=cy+Math.sin(t)*ry*q*spec.height/2.65,theta=1.18+Math.cos(t)*rx*q/spec.radius,r=capsuleRadius(spec,y)+.006;points.push(Math.sin(theta)*r,y,Math.cos(theta)*r*spec.depthRatio);}
        for(let i=0;i<rings;i++)for(let j=0;j<sectors;j++){const a=i*(sectors+1)+j,b=a+sectors+1;indices.push(a,a+1,b,b,a+1,b+1);}
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();highlights.geometry(geo,I,'#ffffff',false);
    }group.add(highlights.finish());return group;}
function conifer(materials,spec){const group=new THREE.Group();group.name='conifer/crown-assembly';const factor=spec.height/2.35;
    for(const[index,[bottom,top,radius]]of[[.60,1.53,.57],[1.13,1.98,.46],[1.65,2.35,.34]].entries()){
        const h=(top-bottom)*factor,r=radius/ .57*spec.radius,b=bottom*factor;
        const profile=[[0,0],[r*.86,0],[r*.98,.018*factor],[r,.045*factor],[r*.96,.085*factor],[r*.76,h*.34],[r*.48,h*.65],[r*.19,h*.88],[r*.035,h*.986],[0,h]].map(([x,y])=>new THREE.Vector2(x,b+y));
        const d=new KitDrawing(`conifer/tier-${index+1}`,materials,'planting');d.geometry(new THREE.LatheGeometry(profile,40),I,'glass',false);group.add(organic(d));
    }return group;}
function container(materials,spec){const d=new KitDrawing(`${spec.assetId}/container`,materials,'planting'),w=spec.width,h=spec.height,z=spec.depth,t=.035,b=.045;
    const loop=(width,depth,y)=>[[-width/2,y,-depth/2],[width/2,y,-depth/2],[width/2,y,depth/2],[-width/2,y,depth/2]];
    const lower=loop(w-.045,z-.045,0),outer=loop(w,z,h),inner=loop(w-2*t,z-2*t,h),floor=loop(w-2*t,z-2*t,b);
    for(let i=0;i<4;i++){const j=(i+1)%4;d.quad([lower[i],lower[j],outer[j],outer[i]],i%2?'#e5edff':'#c7d8ff',false);d.quad([outer[i],outer[j],inner[j],inner[i]],'#ffffff',false);d.quad([inner[i],inner[j],floor[j],floor[i]],'shade',false);d.path([lower[i],outer[i]],'detail');}
    d.quad([...lower].reverse(),'shade',false);d.quad(floor,'shade',false);d.path(outer,'ink',true);d.path(inner,'hair',true);d.path(lower,'detail',true);d.box(0,h-.07,0,w-2*t,.025,z-2*t,'#9dbbec',false);
    return d.finish();}
function mound(materials,name,x,spec){const group=new THREE.Group();group.name=name;const r=(spec.depth-.10)/2,cy=spec.height+.045,ry=r*.85;
    const d=new KitDrawing(`${name}/foliage`,materials,'planting'),g=new THREE.SphereGeometry(1,32,18),pos=g.getAttribute('position');
    for(let i=0;i<pos.count;i++){const p=new THREE.Vector3().fromBufferAttribute(pos,i),phi=Math.atan2(p.z,p.x),lobe=1+.07*Math.cos(phi*7)*Math.sin(Math.acos(THREE.MathUtils.clamp(p.y,-1,1)))**2;pos.setXYZ(i,x+p.x*r*lobe,cy+p.y*ry,p.z*r*lobe);}g.computeVertexNormals();d.geometry(g,I,'#bdd2f5',false);group.add(organic(d));
    const flowers=new KitDrawing(`${name}/blossoms`,materials,'planting');
    for(const[dx,dz]of[[-.25,.5],[.58,.40],[.5,-.30],[-.35,-.35],[.0,.0]]){
        const vertical=Math.sqrt(1-dx*dx-dz*dz),normal=new THREE.Vector3(dx/r,vertical/ry,dz/r).normalize();
        const center=new THREE.Vector3(x+dx*r,cy+ry*vertical,dz*r).addScaledVector(normal,.009);
        const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),normal),outline=[],vertices=[];
        // A single five-lobed outline per blossom avoids outlines around overlapping petals.
        for(let j=0;j<60;j++){const a=j*Math.PI*2/60,size=r*.29*(.83+.17*Math.cos(a*5));outline.push(new THREE.Vector3(Math.cos(a)*size,0,Math.sin(a)*size).applyQuaternion(rotation).add(center));}
        for(let j=0;j<60;j++)vertices.push(...center.toArray(),...outline[(j+1)%60].toArray(),...outline[j].toArray());
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();flowers.geometry(geo,I,'#ffffff',false);flowers.path(outline.map(p=>p.toArray()),'hair',true);
        const eye=center.clone().addScaledVector(normal,.007);ellipsoid(flowers,eye.toArray(),[r*.045,.009,r*.045],'accent');
    }group.add(flowers.finish());return group;}
export function buildPlanting(materials,assetId,variantId='standard'){
    const spec=PLANTING_VARIANTS.find(s=>s.assetId===assetId&&s.variantId===variantId);if(!spec)throw new Error(`Unknown planting component: ${assetId}/${variantId}`);
    const group=new THREE.Group();group.name=`${assetId}/${variantId}`;
    if(spec.category==='Trees'){group.add(trunk(materials,spec),assetId==='capsule-tree'?capsule(materials,spec):conifer(materials,spec));}
    else{group.add(container(materials,spec));for(let i=0;i<spec.clusters;i++){const x=(i-(spec.clusters-1)/2)*(spec.width-.12)/spec.clusters;group.add(mound(materials,`${assetId}/mound-${i+1}`,x,spec));}}
    group.userData={assetId,family:'planting',variantId,revision:PLANTING_REVISION,approval:'approved',placementStatus:'unplaced',sizeId:spec.id,static:true};group.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(group),anchors={ground:new THREE.Vector3(),center:bounds.getCenter(new THREE.Vector3()),top:new THREE.Vector3(0,bounds.max.y,0)};
    if(spec.category==='Containers'){anchors.rim=new THREE.Vector3(0,spec.height,0);anchors.soil=new THREE.Vector3(0,spec.height-.0575,0);}
    return{group,bounds,anchors,spec};
}
