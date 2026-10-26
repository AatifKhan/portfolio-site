import * as THREE from '../../assets/vendor/three/three.module.js';
import {KitDrawing} from './style.js';

export const PERSON_BASE=Object.freeze({id:'person',revision:2,upperLeg:.375,lowerLeg:.365,upperArm:.235,forearm:.225,hipHalfWidth:.105,shoulderHalfWidth:.125,torsoHeight:.42,headRadii:Object.freeze([.076,.108,.071]),footLength:.18,footWidth:.075,ankleHeight:.055,forwardAxis:'+X'});
export const PERSON_POSES=Object.freeze([
    {id:'standing',number:'01',label:'Standing',category:'standing',subtitle:'Relaxed, balanced stance',referenceCrop:[960,553,24,53],referenceLabel:'Standing figure beside the central parking',support:null,description:'The base person: rounded head, simple shirt, relaxed arms and two grounded feet.'},
    {id:'walking',number:'02',label:'Walking',category:'walking',subtitle:'A static mid-stride pose',referenceCrop:[935,504,21,49],referenceLabel:'Walking figure on the central pavement',support:null,description:'The same proportions with a clear stride, opposite arm swing and a slight forward lean. This is a static pose.'},
    {id:'seated',number:'03',label:'Seated',category:'seated',subtitle:'Fitted to the approved café chair',referenceCrop:[214,832,29,49],referenceLabel:'Seated café guest in the foreground row',support:'chair',description:'Hips meet the café seat, both feet meet the ground, and relaxed hands rest above the thighs. The chair is a separate approved component.'},
    {id:'riding-scooter',number:'04',label:'Riding · scooter',category:'riding',subtitle:'Seat, grips & floorboard contact',referenceCrop:[895,790,28,43],referenceLabel:'Scooter rider on the southern road',support:'scooter',description:'A forward lean brings both hands to the grips. Hips rest on the saddle and feet sit on the floorboard. The scooter keeps its approved dimensions.'},
    {id:'riding-bicycle',number:'05',label:'Riding · bicycle',category:'riding',subtitle:'Seat, grips & pedal contact',referenceCrop:[1175,878,30,43],referenceLabel:'Person beside the lower-right bicycle; riding fit inferred',support:'bicycle',description:'The same body leans farther forward to reach the bicycle’s grips. Feet meet the opposing pedals and hips meet the saddle. This fitted pose interprets the reference’s simplified people.'},
].map(Object.freeze));

const V=p=>new THREE.Vector3(...p),Y=new THREE.Vector3(0,1,0);
function solveJoint(a,b,l1,l2,pole){
    const axis=b.clone().sub(a),d=axis.length();
    if(d>l1+l2+1e-8||d<Math.abs(l1-l2)-1e-8)throw new Error(`Unreachable person joint: ${d}`);
    axis.normalize();const along=(d*d+l1*l1-l2*l2)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
    const bend=pole.clone().sub(a);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
    return a.clone().addScaledVector(axis,along).addScaledVector(bend,height);
}
export function personRig(poseId){
    const spec=PERSON_POSES.find(p=>p.id===poseId);if(!spec)throw new Error(`Unknown person pose: ${poseId}`);
    const configs={standing:{hip:[0,.790,0],lean:0},walking:{hip:[0,.740,0],lean:.045},seated:{hip:[-.025,.5425,0],lean:.025},'riding-scooter':{hip:[-.34,.7375,0],lean:.38},'riding-bicycle':{hip:[-.28,.926,0],lean:.65}};
    const c=configs[poseId],hip=V(c.hip),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-c.lean),local=p=>V(p).applyQuaternion(q).add(hip);
    const joints={hip:hip.toArray(),neck:local([0,.448,0]).toArray(),head:local([0,.565,0]).toArray()},segments=[];
    for(const side of[-1,1]){
        const name=side<0?'left':'right',hipJoint=hip.clone().add(V([0,0,side*PERSON_BASE.hipHalfWidth])),shoulder=local([0,.36,side*PERSON_BASE.shoulderHalfWidth]);
        let ankle,wrist,legPole,armPole;
        if(poseId==='standing'){ankle=V([.018,.055,side*.085]);wrist=V([.015,.715,side*.177]);legPole=V([1,.5,side*.10]);}
        if(poseId==='walking'){ankle=V([side<0?.27:-.25,.055,side*.095]);wrist=V([side<0?-.15:.14,.68,side*.17]);legPole=V([1,.5,side*.10]);}
        if(poseId==='seated'){ankle=V([.31,.055,side*.105]);wrist=V([.23,.605,side*.135]);legPole=V([1,.65,side*.10]);armPole=V([.06,.73,side*.25]);}
        if(poseId==='riding-scooter'){ankle=V([.04,.339,side*.115]);wrist=V([.17,.85,side*.25]);legPole=V([.7,.85,side*.15]);armPole=V([-.10,1.02,side*.40]);}
        if(poseId==='riding-bicycle'){ankle=V([-.08+side*.105-.035,.31+side*.065+.0125+.055,side*.18]);wrist=V([.27,.914,side*.20]);legPole=V([.8,.95,side*.22]);armPole=V([.05,1.10,side*.32]);}
        // For hanging/swinging arms, the elbow points behind the shoulder–wrist
        // line. Derive that bend from the torso's forward axis (+X), preserving
        // wrist targets and the opposite arm/leg swing while avoiding reversed elbows.
        if(poseId==='standing'||poseId==='walking')armPole=shoulder.clone().lerp(wrist,.5).addScaledVector(V([1,0,0]).applyQuaternion(q),-1);
        const knee=solveJoint(hipJoint,ankle,PERSON_BASE.upperLeg,PERSON_BASE.lowerLeg,legPole),elbow=solveJoint(shoulder,wrist,PERSON_BASE.upperArm,PERSON_BASE.forearm,armPole);
        for(const[key,p]of Object.entries({hip:hipJoint,knee,ankle,shoulder,elbow,wrist}))joints[`${name}${key[0].toUpperCase()+key.slice(1)}`]=p.toArray();
        for(const[a,b,length]of[['Hip','Knee',PERSON_BASE.upperLeg],['Knee','Ankle',PERSON_BASE.lowerLeg],['Shoulder','Elbow',PERSON_BASE.upperArm],['Elbow','Wrist',PERSON_BASE.forearm]])segments.push({from:name+a,to:name+b,length});
    }
    return{spec,hip,lean:c.lean,torsoQuaternion:q,joints,segments};
}
// A continuous tapered sweep bends through each joint without exposed ball joints.
function limbGeometry(points,radii){
    const curve=new THREE.CatmullRomCurve3(points.map(V)),steps=28,sides=12,frames=curve.computeFrenetFrames(steps,false),positions=[],normals=[],indices=[];
    for(let i=0;i<=steps;i++){
        const t=i/steps,p=curve.getPointAt(t),u=t*2,k=Math.min(1,Math.floor(u)),mix=u-k;
        let r=THREE.MathUtils.lerp(radii[k],radii[k+1],mix);
        const cap=Math.min(t/.05,(1-t)/.05,1);r*=Math.sin(Math.max(0,cap)*Math.PI/2);
        for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,n=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));positions.push(...p.clone().addScaledVector(n,r).toArray());normals.push(...n.toArray());}
    }
    for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function organic(draw){const group=draw.finish();for(const mesh of [...group.children])if(mesh.isMesh&&!mesh.isLineSegments2){mesh.material=draw.materials.organicFill;const hull=new THREE.Mesh(mesh.geometry,draw.materials.silhouette);hull.name=mesh.name+'/silhouette';group.add(hull);}return group;}
function ellipsoid(materials,id,center,radii,tint='paper'){
    const draw=new KitDrawing(id,materials,'people'),geo=new THREE.SphereGeometry(1,24,16);geo.scale(...radii);draw.geometry(geo,new THREE.Matrix4().makeTranslation(...center),tint,false);return organic(draw);
}
function torso(materials,rig){
    const draw=new KitDrawing('person/torso',materials,'people');
    const profile=[[-.02,.001],[-.02,.9],[0,1],[.10,.92],[.28,1.04],[.35,1.11],[.395,.72],[.42,.35],[.42,.001]];
    const geo=new THREE.LatheGeometry(profile.map(([y,r])=>new THREE.Vector2(r,y)),28);geo.scale(.069,1,.115);
    draw.geometry(geo,new THREE.Matrix4().compose(rig.hip,rig.torsoQuaternion,new THREE.Vector3(1,1,1)),'paper',false);
    return organic(draw);
}
function foot(materials,id,ankle){
    const draw=new KitDrawing(id,materials,'people');
    const x0=.035-PERSON_BASE.footLength/2+.008,x1=.035+PERSON_BASE.footLength/2-.008,z=PERSON_BASE.footWidth/2-.008,r=.023,shape=new THREE.Shape();
    shape.moveTo(x0+r,-z);shape.lineTo(x1-r,-z);shape.quadraticCurveTo(x1,-z,x1,-z+r);shape.lineTo(x1,z-r);shape.quadraticCurveTo(x1,z,x1-r,z);shape.lineTo(x0+r,z);shape.quadraticCurveTo(x0,z,x0,z-r);shape.lineTo(x0,-z+r);shape.quadraticCurveTo(x0,-z,x0+r,-z);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:3,curveSegments:6});
    const matrix=new THREE.Matrix4().makeRotationX(-Math.PI/2);matrix.setPosition(ankle[0],ankle[1]-.047,ankle[2]);draw.geometry(geo,matrix,'paper',false);
    const group=organic(draw);group.userData.contact=[ankle[0]+.035,ankle[1]-.055,ankle[2]];return group;
}
export function buildPerson(materials,poseId='standing'){
    const rig=personRig(poseId),group=new THREE.Group();group.name=`person/${poseId}`;
    group.add(torso(materials,rig),ellipsoid(materials,'person/pelvis',rig.hip.toArray(),[.073,.045,.108]));
    const neck=new KitDrawing('person/neck',materials,'people');neck.geometry(new THREE.CapsuleGeometry(.028,.025,4,16),new THREE.Matrix4().compose(V(rig.joints.neck),rig.torsoQuaternion,new THREE.Vector3(1,1,1)),'paper',false);group.add(organic(neck));
    group.add(ellipsoid(materials,'person/head',rig.joints.head,PERSON_BASE.headRadii));
    for(const name of['left','right']){
        const leg=new KitDrawing(`person/${name}-leg`,materials,'people'),arm=new KitDrawing(`person/${name}-arm`,materials,'people');
        const j=rig.joints;leg.geometry(limbGeometry([j[name+'Hip'],j[name+'Knee'],j[name+'Ankle']],[.044,.035,.026]),new THREE.Matrix4(),'paper',false);
        // Extend into the hip/shoulder volume and hand so the end caps remain hidden.
        arm.geometry(limbGeometry([j[name+'Shoulder'],j[name+'Elbow'],j[name+'Wrist']],[.034,.028,.023]),new THREE.Matrix4(),'paper',false);
        group.add(organic(leg),organic(arm),foot(materials,`person/${name}-foot`,j[name+'Ankle']));
        const hand=V(j[name+'Wrist']);if(!poseId.startsWith('riding'))hand.y-=.018;
        group.add(ellipsoid(materials,`person/${name}-hand`,hand.toArray(),[.027,.037,.026]));
    }
    group.userData={assetId:'person',family:'people',variantId:poseId,revision:PERSON_BASE.revision,approval:'approved',static:true,forwardAxis:'+X',joints:rig.joints,segments:rig.segments,proportions:PERSON_BASE,support:rig.spec.support};
    group.updateMatrixWorld(true);const j=rig.joints;
    return{group,bounds:new THREE.Box3().setFromObject(group),anchors:{ground:new THREE.Vector3(),seat:new THREE.Vector3(rig.hip.x,rig.hip.y-.045,rig.hip.z),leftHand:V(j.leftWrist),rightHand:V(j.rightWrist),leftFoot:V(j.leftAnkle).add(V([.035,-.055,0])),rightFoot:V(j.rightAnkle).add(V([.035,-.055,0]))},spec:rig.spec};
}
