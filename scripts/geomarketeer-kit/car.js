import * as THREE from '../../assets/vendor/three/three.module.js';
import { KitDrawing } from './style.js';

export const CAR_BASE=Object.freeze({id:'hatchback',variantId:'standard',revision:1,length:2.22,bodyWidth:1.04,height:1.075,wheelRadius:.205,wheelbase:1.4,track:1.02,wheelThickness:.12,archRadius:.25,groundClearance:.17,forwardAxis:'+X',referenceCrop:[438,630,85,68]});
export const CAR_ANGLES=Object.freeze([
    {id:'reference',number:'01',label:'Reference angle',subtitle:'Front three-quarter',yaw:Math.PI/4,pitch:Math.PI/6},
    {id:'rear',number:'02',label:'Rear three-quarter',subtitle:'Hatch, rear glass & lamps',yaw:-Math.PI/4,pitch:Math.PI/6},
    {id:'front',number:'03',label:'Front view',subtitle:'Windshield, lights & bumper',yaw:Math.PI/2,pitch:0},
    {id:'side',number:'04',label:'Side view',subtitle:'Doors, arches & wheelbase',yaw:0,pitch:0},
].map(Object.freeze));
export const CAR_REVIEW_COPIES=Object.freeze([
    {id:'review-car-01',position:[-2,0,-1],rotation:0},
    {id:'review-car-02',position:[1.2,0,-.9],rotation:Math.PI/2},
    {id:'review-car-03',position:[0,0,1.45],rotation:Math.PI},
].map(spec=>Object.freeze({...spec,assetId:'hatchback',variantId:'standard',scale:1,reviewOnly:true})));
export const CAR_SOURCE_OBJECTS=Object.freeze([
    ['road-car-northwest-01','housing',[79,409,62,47]],['road-car-west-01','housing',[236,501,69,57]],
    ['road-car-west-02','perimeter',[314,600,69,59]],['road-car-foreground-01','cafe-lane',[442,634,77,61]],
    ['road-car-central-01','central',[702,466,68,54]],['road-car-office-01','offices',[946,351,62,57]],
    ['road-car-east-01','offices',[1294,379,70,55]],['road-car-east-02','offices',[1379,341,59,49]],
    ['parking-car-central-01','central',[958,625,77,65]],['parking-car-central-02','central',[904,668,78,64]],
    ['road-car-foreground-02','cafe-lane',[696,742,80,65]],['parking-car-southeast-01','perimeter',[1091,834,80,72]],
    ['parking-car-southeast-02','perimeter',[1042,879,81,62]],
].map(([id,districtId,sourceBounds])=>Object.freeze({id,districtId,sourceBounds,assetId:'hatchback',variantId:'standard',reviewStatus:'approved',placementStatus:'unplaced'})));

const transform=(x=0,y=0,z=0,rx=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,0)),new THREE.Vector3(1,1,1));
const widthAt=y=>.5-(y-.635)*(.075/.42);
function polygon(draw,points,tint,weight='detail'){
    const shape=THREE.ShapeUtils.triangulateShape(points.map(p=>new THREE.Vector2(p[0],p[1])),[]);
    // Used for polygons on side planes parameterized by x/y.
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(shape.flatMap(tri=>tri.flatMap(i=>points[i])),3));geometry.computeVertexNormals();draw.geometry(geometry,new THREE.Matrix4(),tint,false);
    if(weight)draw.path(points,weight,true);
}
function sidePane(draw,shape,side,tint='glass',weight='detail',offset=.007){polygon(draw,shape.map(([x,y])=>[x,y,side*(widthAt(y)+offset)]),tint,weight);}

function body(materials){
    const draw=new KitDrawing('car/body',materials,'cars'),shape=new THREE.Shape();
    shape.moveTo(-1.04,.17);shape.quadraticCurveTo(-1.11,.17,-1.11,.27);shape.lineTo(-1.11,.53);shape.quadraticCurveTo(-1.11,.63,-1.015,.635);
    shape.lineTo(.59,.635);shape.lineTo(.99,.57);shape.quadraticCurveTo(1.11,.55,1.11,.46);shape.lineTo(1.11,.26);shape.quadraticCurveTo(1.11,.17,1.035,.17);
    const r=CAR_BASE.archRadius,y=CAR_BASE.wheelRadius,theta=Math.asin((.17-y)/r);
    for(const x of[.7,-.7]){shape.lineTo(x+Math.cos(theta)*r,.17);shape.absarc(x,y,r,theta,Math.PI-theta,false);}
    shape.lineTo(-1.04,.17);
    // A rounded side profile with actual wheel cutouts, rather than wheels
    // overlaid on an unbroken rectangular body. Curved profile corners soften the ends.
    draw.geometry(new THREE.ExtrudeGeometry(shape,{depth:1.04,steps:1,bevelEnabled:false,curveSegments:12}),transform(0,0,-.52),'paper','ink',35);
    draw.path([[.99,.573,-.521],[.99,.573,.521]],'ink');
    const group=draw.finish();group.userData.wheelArchRadius=r;return group;
}
function cabin(materials){
    const draw=new KitDrawing('car/cabin',materials,'cars'),glass=new KitDrawing('car/glazing',materials,'cars');
    const sections=[[-.99,.635],[-.97,.77],[-.78,1.025],[-.69,1.055],[.12,1.055],[.22,1.025],[.59,.67],[.62,.635]];
    for(let i=0;i<sections.length-1;i++){
        const[a,ay]=sections[i],[b,by]=sections[i+1];
        for(const side of[-1,1])draw.quad([[a,.632,side*.5],[b,.632,side*.5],[b,by,side*widthAt(by)],[a,ay,side*widthAt(ay)]],side>0?'#c9daff':'#e2ecff',false);
        for(let j=0;j<8;j++){
            const u=-1+j/4,v=u+.25,camber=(y,t)=>y>1.02?.020*(1-t*t):0;
            draw.quad([[a,ay+camber(ay,u),u*widthAt(ay)],[b,by+camber(by,u),u*widthAt(by)],[b,by+camber(by,v),v*widthAt(by)],[a,ay+camber(ay,v),v*widthAt(ay)]],'paper',false);
        }
    }
    for(const side of[-1,1]){
        draw.path(sections.map(([x,y])=>[x,y,side*(widthAt(y)+.002)]),'ink');
        sidePane(glass,[[-.926,.690],[-.756,.987],[-.622,.987],[-.622,.690]],side);
        sidePane(glass,[[-.582,.690],[-.582,.993],[-.282,.993],[-.282,.690]],side);
        sidePane(glass,[[-.236,.690],[-.236,.993],[.158,.993],[.509,.690]],side);
        sidePane(glass,[[-.535,.721],[-.505,.721],[-.464,.966],[-.494,.966]],side,'#d5e5ff',false,.010);
        sidePane(glass,[[-.145,.721],[-.101,.721],[-.015,.968],[-.059,.968]],side,'#dbe8ff',false,.010);
    }
    // Sample the same cambered roof surface for both windscreens. Offsetting
    // a guessed flat pane would bury it in the rounded cabin at some angles.
    const roofPoint=(x,u,offset=.012)=>{
        const index=sections.findIndex((v,i)=>i<sections.length-1&&x>=v[0]&&x<=sections[i+1][0]);
        const [a,ay]=sections[index],[b,by]=sections[index+1],t=(x-a)/(b-a);
        const y=ay+(by-ay)*t,camberA=ay>1.02?.020*(1-u*u):0,camberB=by>1.02?.020*(1-u*u):0;
        return[x,y+camberA*(1-t)+camberB*t+offset,u*(widthAt(ay)*(1-t)+widthAt(by)*t)];
    };
    for(const x of[-.78,.22])draw.path(Array.from({length:17},(_,i)=>roofPoint(x,-1+i/8,.003)),'ink');
    const windscreen=(from,to)=>{
        const us=[-.86,-.75,-.5,-.25,0,.25,.5,.75,.86];
        for(let i=0;i<us.length-1;i++)glass.quad([roofPoint(from,us[i]),roofPoint(to,us[i]),roofPoint(to,us[i+1]),roofPoint(from,us[i+1])],'#a5c3ff',false);
        glass.path([...us.map(u=>roofPoint(from,u)),...us.toReversed().map(u=>roofPoint(to,u))],'detail',true);
        glass.quad([roofPoint(from+.016,-.65,.015),roofPoint(to-.016,-.65,.015),roofPoint(to-.016,-.54,.015),roofPoint(from+.016,-.54,.015)],'#cfdefb',false);
    };
    // Filled glazing matches the source, whose car interiors are not visible.
    windscreen(.251,.560);windscreen(-.954,-.802);
    glass.path([roofPoint(-.929,-.25,.018),roofPoint(-.883,.20,.018)],'hair');
    glass.path([roofPoint(.563,-.55,.018),roofPoint(.563,-.05,.018)],'hair');
    const group=draw.finish();group.add(glass.finish());return group;
}
function wheel(materials){
    const draw=new KitDrawing('car/wheel-master',materials,'cars'),r=CAR_BASE.wheelRadius;
    draw.geometry(new THREE.CylinderGeometry(r,r,.12,48),transform(0,0,0,Math.PI/2),'accent',false);
    draw.geometry(new THREE.CylinderGeometry(.098,.098,.125,32),transform(0,0,0,Math.PI/2),'#f6f9ff',false);
    for(const side of[-1,1]){
        const ring=(radius,z,weight)=>draw.path(Array.from({length:48},(_,i)=>[Math.cos(i/48*Math.PI*2)*radius,Math.sin(i/48*Math.PI*2)*radius,z]),weight,true);
        ring(r,side*.061,'detail');ring(.098,side*.064,'hair');
        draw.geometry(new THREE.CylinderGeometry(.026,.026,.006,16),transform(0,0,side*.066,Math.PI/2),'#aac7ff',false);
    }
    return draw.finish();
}
function details(materials){
    const draw=new KitDrawing('car/details',materials,'cars');
    for(const side of[-1,1]){
        const z=side*.526;
        draw.path([[-.259,.672,z],[-.259,.232,z],[.438,.232,z]],'hair');
        draw.path([[-.932,.636,z],[-.948,.490,z]],'hair');
        draw.path([[.533,.636,z],[.469,.455,z]],'hair');
        for(const x of[-.76,-.13]){draw.box(x,.584,z,.105,.026,.018,'#c4d7ff',false);draw.path([[x-.05,.599,z+side*.012],[x+.05,.599,z+side*.012]],'detail');}
        const stalk=new THREE.Vector3(.435,.668,side*.545),geo=new THREE.CylinderGeometry(.012,.012,.13,8);geo.rotateX(Math.PI/2);
        draw.geometry(geo,transform(stalk.x,stalk.y,stalk.z),'paper',false);
        const mirror=new THREE.SphereGeometry(1,20,12);mirror.scale(.083,.044,.052);draw.geometry(mirror,transform(.435,.690,side*.607),'paper',false);
        draw.path(Array.from({length:24},(_,i)=>[.435+Math.cos(i/24*Math.PI*2)*.073,.690+Math.sin(i/24*Math.PI*2)*.038,side*.637]),'detail',true);
    }
    for(const x of[-1.119,1.119]){
        draw.box(x,.245,0,.032,.072,.91,'#e7efff','detail');
        draw.box(x+(x>0?.019:-.019),.25,0,.008,.049,.22,'#f8fbff','hair');
    }
    for(const z of[-.353,.353]){
        draw.box(1.113,.451,z,.030,.115,.175,'#f8fbff','detail');
        draw.box(-1.114,.500,z,.025,.140,.085,'#9dbdff','detail');
        draw.box(-1.129,.472,z,.007,.035,.067,'#edf4ff',false);
    }
    draw.box(1.117,.442,0,.025,.078,.38,'#80a5f5','detail');
    draw.path([[1.133,.416,-.18],[1.133,.416,.18]],'hair');
    draw.path([[-1.124,.586,-.27],[-1.124,.316,-.27],[-1.124,.316,.27],[-1.124,.586,.27]],'hair');
    draw.path([[-1.132,.541,-.07],[-1.132,.541,.07]],'detail');
    return draw.finish();
}
export function buildCar(materials,variantId='standard'){
    if(variantId!=='standard')throw new Error(`Unknown hatchback variant: ${variantId}`);
    const group=new THREE.Group();group.name='hatchback/standard';group.add(body(materials),cabin(materials),details(materials));
    const master=wheel(materials);
    for(const x of[-.7,.7])for(const z of[-.51,.51]){const copy=master.clone(true);copy.name=`car/wheel-${x>0?'front':'rear'}-${z>0?'right':'left'}`;copy.position.set(x,.205,z);copy.userData={component:'wheel',radius:.205};group.add(copy);}
    group.userData={assetId:'hatchback',family:'cars',variantId,revision:CAR_BASE.revision,approval:'approved',static:true,forwardAxis:'+X',sharedModules:['rounded-body','cabin','glazing','wheel','lights','mirrors','bumpers'],wheelCount:4};
    group.updateMatrixWorld(true);
    return {group,bounds:new THREE.Box3().setFromObject(group),anchors:{ground:new THREE.Vector3(),front:new THREE.Vector3(1.14,.245,0),rear:new THREE.Vector3(-1.14,.245,0),frontAxle:new THREE.Vector3(.7,.205,0),rearAxle:new THREE.Vector3(-.7,.205,0)},spec:CAR_BASE};
}
