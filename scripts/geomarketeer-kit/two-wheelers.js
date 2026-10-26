import * as THREE from '../../assets/vendor/three/three.module.js';
import { KitDrawing } from './style.js';

export const TWO_WHEELER_REVISION=1;
export const TWO_WHEELER_MASTERS=Object.freeze([
    {id:'scooter',label:'Scooter',variantId:'standard',revision:1,wheelRadius:.185,wheelbase:.97,axles:[-.47,.50],referenceCrop:[990,888,50,48],referenceLabel:'Parked scooter in the lower-right parking bays',description:'A compact step-through body, rounded leg shield, short saddle and small matching wheels. Mirrors, lamps and a center stand complete the parked master.'},
    {id:'bicycle',label:'Bicycle',variantId:'standard',revision:1,wheelRadius:.29,wheelbase:1.04,axles:[-.52,.52],referenceCrop:[1087,646,47,61],referenceLabel:'Bicycle beside the central parking area',description:'An open diamond frame with two matching spoked wheels, fork, saddle, swept handlebars, pedals and a simple chain drive. A kickstand supports the parked master.'},
].map(spec=>Object.freeze({...spec,axles:Object.freeze(spec.axles)})));
export const TWO_WHEELER_ANGLES=Object.freeze([
    {id:'reference',number:'01',label:'Reference angle',subtitle:'Front three-quarter',yaw:Math.PI/4,pitch:Math.PI/6},
    {id:'rear',number:'02',label:'Rear three-quarter',subtitle:'Seat, rear wheel & stand',yaw:-Math.PI/4,pitch:Math.PI/6},
    {id:'front',number:'03',label:'Front view',subtitle:'Handlebars, fork & wheel alignment',yaw:Math.PI/2,pitch:0},
    {id:'side',number:'04',label:'Side view',subtitle:'Silhouette & wheelbase',yaw:0,pitch:0},
].map(Object.freeze));
export const TWO_WHEELER_REVIEW_COPIES=Object.freeze([
    {id:'copy-01',position:[-1.35,0,-.75],rotation:0},
    {id:'copy-02',position:[.85,0,-.65],rotation:Math.PI/2},
    {id:'copy-03',position:[0,0,1.05],rotation:Math.PI},
].map(spec=>Object.freeze({...spec,variantId:'standard',scale:1,reviewOnly:true})));
export const TWO_WHEELER_SOURCE_OBJECTS=Object.freeze([
    ['road-scooter-northwest-01','scooter','housing',[162,453,42,50],'rider-visible'],
    ['road-scooter-west-01','scooter','perimeter',[341,568,38,44],'rider-visible'],
    ['road-scooter-central-01','scooter','central',[515,554,40,38],'rider-visible'],
    ['road-scooter-south-01','scooter','central',[887,785,47,61],'rider-visible'],
    ['parking-scooter-central-01','scooter','central',[944,731,28,42],'parked'],
    ['parking-scooter-central-02','scooter','central',[965,725,26,41],'parked'],
    ['parking-scooter-central-03','scooter','central',[982,712,44,40],'parked'],
    ['parking-scooter-central-04','scooter','central',[1028,675,44,51],'parked'],
    ['parking-scooter-southeast-01','scooter','perimeter',[992,889,46,45],'parked'],
    ['parking-scooter-southeast-02','scooter','perimeter',[1022,918,37,43],'parked'],
    ['parking-bicycle-central-01','bicycle','central',[1064,657,39,58],'parked'],
    ['parking-bicycle-central-02','bicycle','central',[1087,646,47,61],'parked'],
    ['parking-bicycle-southeast-01','bicycle','perimeter',[1165,879,47,61],'person-adjacent'],
].map(([id,assetId,districtId,sourceBounds,referenceConfiguration])=>Object.freeze({id,assetId,districtId,sourceBounds,referenceConfiguration,variantId:'standard',reviewStatus:'approved',placementStatus:'unplaced'})));

const identity=new THREE.Matrix4();
const transform=(x=0,y=0,z=0,rx=0,rz=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(1,1,1));
function tube(draw,a,b,r=.014,tint='accent',segments=12){
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),axis=to.clone().sub(from),m=new THREE.Matrix4().compose(from.add(to).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.clone().normalize()),new THREE.Vector3(1,1,1));
    draw.geometry(new THREE.CylinderGeometry(r,r,axis.length(),segments),m,tint,false);
}
function ellipsoid(draw,center,size,tint='paper'){
    const geo=new THREE.SphereGeometry(1,24,12);geo.scale(...size);draw.geometry(geo,transform(...center),tint,false);
}
function ring(draw,x,y,z,r,weight='detail',segments=48){draw.path(Array.from({length:segments},(_,i)=>[x+Math.cos(i/segments*2*Math.PI)*r,y+Math.sin(i/segments*2*Math.PI)*r,z]),weight,true);}
function cylinderZ(draw,x,y,z,r,depth,tint='paper',edge=false){draw.geometry(new THREE.CylinderGeometry(r,r,depth,32),transform(x,y,z,Math.PI/2),tint,edge);}
function cylinderX(draw,x,y,z,r,depth,tint='paper',edge='detail'){draw.geometry(new THREE.CylinderGeometry(r,r,depth,24),transform(x,y,z,0,Math.PI/2),tint,edge);}
function curve(draw,points,weight='hair'){draw.path(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))).getPoints(20).map(p=>p.toArray()),weight);}

function wheel(materials,kind){
    const scooter=kind==='scooter',spec=TWO_WHEELER_MASTERS.find(s=>s.id===kind),r=spec.wheelRadius,draw=new KitDrawing(`${kind}/wheel-master`,materials,'two-wheelers');
    const tireTube=scooter?.032:.020;draw.geometry(new THREE.TorusGeometry(r-tireTube,tireTube,12,64),identity,'accent',false);
    if(scooter){
        cylinderZ(draw,0,0,0,.128,.073,'#b7d0ff');cylinderZ(draw,0,0,0,.058,.088,'#f5f9ff');
        for(const side of[-1,1]){ring(draw,0,0,side*.038,.128,'detail');ring(draw,0,0,side*.046,.058,'hair');}
    }else{
        draw.geometry(new THREE.TorusGeometry(.250,.008,8,48),identity,'#f2f6ff',false);
        for(const side of[-1,1])ring(draw,0,0,side*.009,.250,'hair');
        for(let i=0;i<8;i++){const a=i*Math.PI/4;draw.path([[Math.cos(a)*.025,Math.sin(a)*.025,i%2?.028:-.028],[Math.cos(a)*.25,Math.sin(a)*.25,0]],'hair');}
        cylinderZ(draw,0,0,0,.028,.110,'#dce8ff','detail');
    }
    const group=draw.finish();group.userData={component:'wheel',radius:r,spokes:scooter?0:8};return group;
}
function addWheels(group,materials,spec){
    const master=wheel(materials,spec.id);
    for(const[x,i]of spec.axles.map((x,i)=>[x,i])){const copy=master.clone(true);copy.name=`${spec.id}/wheel-${i?'front':'rear'}`;copy.position.set(x,spec.wheelRadius,0);group.add(copy);}
}
function mudguard(materials){
    const draw=new KitDrawing('scooter/front-mudguard',materials,'two-wheelers'),r=.216,thickness=.018,half=.078,angles=Array.from({length:25},(_,i)=>(18+i*144/24)*Math.PI/180),p=(a,rad,z)=>[.50+Math.cos(a)*rad,.185+Math.sin(a)*rad,z];
    for(let i=0;i<angles.length-1;i++){
        const a=angles[i],b=angles[i+1];draw.quad([p(a,r+thickness,-half),p(b,r+thickness,-half),p(b,r+thickness,half),p(a,r+thickness,half)],'paper',false);
        draw.quad([p(a,r,half),p(b,r,half),p(b,r,-half),p(a,r,-half)],'#d0e1ff',false);
        for(const z of[-half,half])draw.quad([p(a,r,z),p(b,r,z),p(b,r+thickness,z),p(a,r+thickness,z)],'#d0e1ff',false);
    }
    for(const z of[-half,half])draw.path(angles.map(a=>p(a,r+thickness,z)),'ink');
    for(const a of[angles[0],angles.at(-1)])draw.quad([p(a,r,-half),p(a,r+thickness,-half),p(a,r+thickness,half),p(a,r,half)],'paper','detail');
    return draw.finish();
}
function scooterBody(materials){
    const group=new THREE.Group();group.name='scooter/body';
    const draw=new KitDrawing('scooter/rear-shell',materials,'two-wheelers'),shape=new THREE.Shape();
    shape.moveTo(-.73,.22);shape.lineTo(-.73,.43);shape.quadraticCurveTo(-.73,.59,-.60,.61);shape.lineTo(-.18,.61);shape.quadraticCurveTo(-.09,.61,-.08,.49);shape.lineTo(-.14,.26);shape.lineTo(-.26,.22);
    const theta=Math.asin((.22-.185)/.215);shape.absarc(-.47,.185,.215,theta,Math.PI-theta,false);shape.lineTo(-.73,.22);
    draw.geometry(new THREE.ExtrudeGeometry(shape,{depth:.34,bevelEnabled:false,curveSegments:12}),transform(0,0,-.17),'paper','ink');group.add(draw.finish());
    const deck=new KitDrawing('scooter/floorboard',materials,'two-wheelers');deck.rounded(.04,.247,0,.74,.056,.34,.07,'paper','detail');deck.rounded(.015,.279,0,.44,.010,.24,.055,'#c5d9ff',false);group.add(deck.finish());
    // Leg shield is a curved sheet with real thickness and a clear step-through.
    const shield=new KitDrawing('scooter/leg-shield',materials,'two-wheelers');
    const sections=[[.355,.275,.12],[.385,.39,.15],[.315,.56,.19],[.235,.73,.165],[.23,.79,.125]];
    const front=(row,u)=>[row[0]+.055*(1-u*u),row[1],row[2]*u];
    for(let i=0;i<sections.length-1;i++)for(let j=0;j<12;j++){
        const u=-1+j/6,v=u+1/6,a=front(sections[i],u),b=front(sections[i+1],u),c=front(sections[i+1],v),d=front(sections[i],v);
        shield.quad([a,b,c,d],'paper',false);shield.quad([d,c,b,a].map(p=>[p[0]-.025,p[1],p[2]]),'#d0e0ff',false);
    }
    for(const side of[-1,1]){
        const points=sections.map(row=>front(row,side));shield.path(points,'ink');
        for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];shield.quad([a,b,[b[0]-.025,b[1],b[2]],[a[0]-.025,a[1],a[2]]],'paper',false);}
    }
    for(const row of[sections[0],sections.at(-1)]){const ps=Array.from({length:13},(_,i)=>front(row,-1+i/6));shield.path(ps,'ink');for(let i=0;i<ps.length-1;i++)shield.quad([ps[i],ps[i+1],[ps[i+1][0]-.025,ps[i+1][1],ps[i+1][2]],[ps[i][0]-.025,ps[i][1],ps[i][2]]],'paper',false);}
    shield.path([[.432,.40,0],[.365,.56,0],[.29,.73,0]],'hair');group.add(shield.finish());
    const seat=new KitDrawing('scooter/seat',materials,'two-wheelers');seat.rounded(-.385,.614,0,.42,.018,.25,.07,'#c2d7ff',false);seat.rounded(-.385,.655,0,.53,.075,.31,.09,'#d0e0ff','ink');group.add(seat.finish());
    const trim=new KitDrawing('scooter/rear-details',materials,'two-wheelers');
    curve(trim,[[-.60,.694,-.13],[-.72,.704,-.13],[-.735,.704,0],[-.72,.704,.13],[-.60,.694,.13]],'detail');
    for(const side of[-1,1]){trim.path([[-.65,.48,side*.174],[-.53,.54,side*.174],[-.24,.54,side*.174]],'hair');for(let i=0;i<3;i++)trim.path([[-.25+i*.025,.44,side*.175],[-.23+i*.025,.49,side*.175]],'hair');}
    cylinderX(trim,-.738,.48,0,.042,.020,'#b3cdff');trim.box(-.739,.37,0,.016,.055,.10,'paper','hair');
    tube(trim,[-.56,.26,-.16],[-.28,.26,-.18],.035,'#c3d8ff');group.add(trim.finish());return group;
}
function scooterControls(materials){
    const draw=new KitDrawing('scooter/steering',materials,'two-wheelers');
    for(const side of[-1,1])tube(draw,[.255,.69,side*.064],[.50,.185,side*.064],.014,'#a9c5ff');
    tube(draw,[.255,.69,-.064],[.255,.69,.064],.018,'#bcd2ff');
    tube(draw,[.255,.69,0],[.26,.76,0],.021,'paper');
    tube(draw,[.26,.76,0],[.235,.85,0],.034,'paper');
    ellipsoid(draw,[.27,.835,0],[.10,.066,.12]);cylinderX(draw,.361,.835,0,.052,.015,'#f7fbff');
    for(const side of[-1,1]){
        tube(draw,[.25,.85,0],[.19,.85,side*.20],.015,'#dce7ff');tube(draw,[.19,.85,side*.20],[.16,.85,side*.285],.022);
        tube(draw,[.23,.823,side*.17],[.21,.823,side*.26],.006,'#557efa');
        tube(draw,[.205,.865,side*.205],[.15,1.015,side*.285],.008,'#557efa');
        ellipsoid(draw,[.15,1.039,side*.287],[.017,.034,.042]);
        draw.path(Array.from({length:24},(_,i)=>[.132,1.039+Math.sin(i/24*Math.PI*2)*.029,side*.287+Math.cos(i/24*Math.PI*2)*.037]),'detail',true);
    }
    const group=draw.finish();group.userData.connections={frontAxle:[.50,.185,0],handlebars:[.235,.85,0]};return group;
}
function scooterStand(materials){
    const draw=new KitDrawing('scooter/center-stand',materials,'two-wheelers');tube(draw,[-.14,.23,-.11],[-.14,.23,.11],.012,'#8eaef1');
    for(const z of[-.14,.14]){tube(draw,[-.14,.23,z*.7],[-.22,.012,z],.012,'#8eaef1');draw.box(-.22,.006,z,.065,.012,.035,'#acc7fb',false);}
    return draw.finish();
}

const BIKE_POINTS=Object.freeze({rear:[-.52,.29,0],crank:[-.08,.31,0],seat:[-.25,.76,0],headTop:[.39,.79,0],headBottom:[.44,.62,0],front:[.52,.29,0]});
function bicycleFrame(materials){
    const draw=new KitDrawing('bicycle/frame',materials,'two-wheelers'),p=BIKE_POINTS;
    for(const[a,b,r]of[[p.crank,p.seat,.018],[p.seat,p.headTop,.018],[p.crank,p.headBottom,.019],[p.headTop,p.headBottom,.023]])tube(draw,a,b,r,'#4771f5');
    for(const side of[-1,1]){
        const rear=[-.52,.29,side*.054],crank=[-.08,.31,side*.035];tube(draw,rear,crank,.011,'#4771f5');tube(draw,rear,[-.25,.74,side*.012],.011,'#4771f5');
        tube(draw,[.44,.62,side*.044],[.52,.29,side*.054],.013,'#4771f5');
    }
    for(const point of[p.crank,p.seat,p.headTop,p.headBottom])ellipsoid(draw,point,[.024,.024,.024],'#4771f5');
    tube(draw,[.44,.62,-.06],[.44,.62,.06],.017,'#4771f5');
    const group=draw.finish();group.userData.frameNodes=BIKE_POINTS;return group;
}
function bicycleFitout(materials){
    const group=new THREE.Group();group.name='bicycle/fitout';
    const seat=new KitDrawing('bicycle/saddle',materials,'two-wheelers');tube(seat,[-.25,.76,0],[-.285,.850,0],.012,'#9cbcf7');
    const shape=new THREE.Shape();shape.moveTo(-.39,-.075);shape.quadraticCurveTo(-.43,-.075,-.43,0);shape.quadraticCurveTo(-.43,.075,-.39,.075);shape.quadraticCurveTo(-.27,.09,-.17,.028);shape.lineTo(-.11,.026);shape.quadraticCurveTo(-.085,0,-.11,-.026);shape.lineTo(-.17,-.028);shape.quadraticCurveTo(-.27,-.09,-.39,-.075);
    seat.geometry(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false,curveSegments:8}),transform(0,.846,0,-Math.PI/2),'paper','detail');group.add(seat.finish());
    const bars=new KitDrawing('bicycle/handlebars',materials,'two-wheelers');tube(bars,[.39,.79,0],[.37,.865,0],.014,'#91b2f8');tube(bars,[.37,.865,0],[.315,.914,0],.014,'#91b2f8');
    for(const side of[-1,1]){tube(bars,[.315,.914,0],[.29,.914,side*.15],.013,'#4771f5');tube(bars,[.29,.914,side*.15],[.255,.914,side*.235],.019,'#4771f5');tube(bars,[.324,.895,side*.135],[.317,.88,side*.215],.006,'#4771f5');}
    cylinderX(bars,.36,.875,0,.025,.038,'#f7fbff');
    curve(bars,[[.32,.89,.15],[.43,.83,.13],[.465,.72,.085],[.46,.585,.045]],'hair');
    group.add(bars.finish());return group;
}
function bicycleDrive(materials){
    const draw=new KitDrawing('bicycle/drivetrain',materials,'two-wheelers'),cx=-.08,cy=.31;
    cylinderZ(draw,cx,cy,0,.023,.24,'#adc9f9');
    draw.geometry(new THREE.TorusGeometry(.088,.007,8,40),transform(cx,cy,.085),'#5b80f2',false);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;tube(draw,[cx,cy,.085],[cx+Math.cos(a)*.084,cy+Math.sin(a)*.084,.085],.005,'#7399ef',8);}
    cylinderZ(draw,-.52,.29,.075,.040,.016,'#bed3ff','hair');
    // Outer tangents and wrap arcs keep the chain seated on both sprockets.
    const rear=new THREE.Vector2(-.52,.29),front=new THREE.Vector2(cx,cy),u=rear.clone().sub(front).normalize(),c=(.088-.040)/rear.distanceTo(front),q=Math.sqrt(1-c*c),perp=new THREE.Vector2(-u.y,u.x);
    const normals=[u.clone().multiplyScalar(c).addScaledVector(perp,q),u.clone().multiplyScalar(c).addScaledVector(perp,-q)].sort((a,b)=>b.y-a.y),upper=Math.atan2(normals[0].y,normals[0].x),lower=Math.atan2(normals[1].y,normals[1].x)+Math.PI*2;
    const chain=[];chain.push([cx+normals[0].x*.088,cy+normals[0].y*.088,.098]);
    for(let i=0;i<=18;i++){const a=upper+(lower-upper)*i/18;chain.push([rear.x+Math.cos(a)*.04,rear.y+Math.sin(a)*.04,.098]);}
    for(let i=0;i<=18;i++){const a=lower+(upper+Math.PI*2-lower)*i/18;chain.push([cx+Math.cos(a)*.088,cy+Math.sin(a)*.088,.098]);}draw.path(chain,'hair',true);
    for(const side of[-1,1]){const px=cx+side*.105,py=cy+side*.065;tube(draw,[cx,cy,side*.11],[px,py,side*.11],.010,'#8faef2');tube(draw,[px,py,side*.11],[px,py,side*.17],.008,'#8faef2');draw.box(px,py,side*.18,.085,.025,.075,'paper','detail');}
    const group=draw.finish();group.userData.chainCenters={front:[cx,cy,.098],rear:[-.52,.29,.098]};return group;
}
function bicycleStand(materials){
    const draw=new KitDrawing('bicycle/kickstand',materials,'two-wheelers');tube(draw,[-.16,.32,-.035],[-.28,.010,-.24],.009,'#7fa3e8');draw.box(-.28,.005,-.24,.052,.010,.028,'#a9c3ef',false);return draw.finish();
}
export function buildTwoWheeler(materials,assetId,variantId='standard'){
    const spec=TWO_WHEELER_MASTERS.find(s=>s.id===assetId);if(!spec||variantId!=='standard')throw new Error(`Unknown two-wheeler: ${assetId}/${variantId}`);
    const group=new THREE.Group();group.name=`${assetId}/standard`;
    if(assetId==='scooter')group.add(scooterBody(materials),scooterControls(materials),mudguard(materials),scooterStand(materials));
    else group.add(bicycleFrame(materials),bicycleFitout(materials),bicycleDrive(materials),bicycleStand(materials));
    addWheels(group,materials,spec);
    group.userData={assetId,family:'two-wheelers',variantId,revision:TWO_WHEELER_REVISION,approval:'approved',static:true,configuration:'parked',forwardAxis:'+X',wheelCount:2,spokesPerWheel:assetId==='bicycle'?8:0};
    group.updateMatrixWorld(true);
    return{group,bounds:new THREE.Box3().setFromObject(group),anchors:{ground:new THREE.Vector3(),frontAxle:new THREE.Vector3(spec.axles[1],spec.wheelRadius,0),rearAxle:new THREE.Vector3(spec.axles[0],spec.wheelRadius,0),seat:new THREE.Vector3(...(assetId==='scooter'?[-.34,.693,0]:[-.28,.881,0])),leftGrip:new THREE.Vector3(...(assetId==='scooter'?[.17,.85,-.25]:[.27,.914,-.20])),rightGrip:new THREE.Vector3(...(assetId==='scooter'?[.17,.85,.25]:[.27,.914,.20]))},spec};
}
