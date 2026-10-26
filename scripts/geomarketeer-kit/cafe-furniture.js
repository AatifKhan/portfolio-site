import * as THREE from '../../assets/vendor/three/three.module.js';
import { KitDrawing } from './style.js';

const identity=new THREE.Matrix4();
const translate=(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z);

// Small physical rods have silhouettes at every supported viewing angle.
export function tube(draw,points,radius=.012,tint='detail',segments=12){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    draw.geometry(new THREE.TubeGeometry(curve,segments,radius,6,false),identity,tint,false);
}

export function cup(draw,x,y,z,scale=1,saucer=true){
    const transform=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion(),new THREE.Vector3(scale,scale,scale));
    if(saucer)draw.geometry(new THREE.CylinderGeometry(.107,.097,.012,20),transform.clone().multiply(translate(0,.006,0)),'paper','hair');
    const bottom=saucer?.012:0;
    const profile=[[.040,bottom],[.049,bottom+.012],[.061,bottom+.091],[.053,bottom+.091],[.043,bottom+.020]];
    draw.geometry(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),20),transform,'paper',false);
    draw.geometry(new THREE.CylinderGeometry(.052,.052,.003,20),transform.clone().multiply(translate(0,bottom+.079,0)),'#c5b7a4',false);
    draw.ring(x,y+(bottom+.091)*scale,z,.057*scale,'hair',20);
    draw.geometry(new THREE.TorusGeometry(.031,.009,6,14),transform.clone().multiply(translate(.069,bottom+.053,0)),'detail',false);
}

export function pastryPlate(draw,x,y,z){
    draw.cylinder(x,y+.009,z,.137,.018,'paper','hair');
    // A small crescent and two folds are readable without adding a texture.
    const points=Array.from({length:9},(_,i)=>{const a=.18*Math.PI+i/8*.64*Math.PI;return[x+Math.cos(a)*.09,y+.046,z+Math.sin(a)*.055-.035];});
    tube(draw,points,.032,'#f6dfb8',12);
    for(const dx of[-.026,.026])draw.path([[x+dx,y+.055,z-.018],[x+dx*.85,y+.078,z+.015]],'hair');
}

// Same normalized mark on glass and menu board. p maps emblem coordinates
// onto the physical plane, including the inclined menu-board face.
export function cupEmblem(draw,p,size=1){
    const path=points=>draw.path(points.map(([x,y])=>p(x*size,y*size)),'detail');
    path([[-.19,.12],[-.16,-.08],[-.10,-.13],[.10,-.13],[.16,-.08],[.19,.12],[-.19,.12]]);
    path([[.19,.08],[.28,.08],[.30,.01],[.26,-.06],[.17,-.06]]);
    path([[-.24,-.19],[.24,-.19]]);
    path([[-.06,.20],[-.09,.27],[-.04,.34]]);
    path([[.07,.20],[.04,.27],[.09,.34]]);
}

function chair(materials,id,x,z,tableX=0,tableZ=0){
    const group=new THREE.Group();group.name=id;group.position.set(x,0,z);
    // Local +Z is the back; local -Z is the seated person's gaze.
    const heading=Math.atan2(tableX-x,z-tableZ);group.rotation.y=-heading;
    const seat=new KitDrawing(`${id}/seat`,materials,'cafe');
    seat.geometry(new THREE.CylinderGeometry(.23,.225,.055,24),translate(0,.47,0),'paper','detail');
    seat.ring(0,.498,0,.197,'hair',24);group.add(seat.finish());
    const legs=new KitDrawing(`${id}/legs`,materials,'cafe');
    for(const xx of[-.16,.16])for(const zz of[-.15,.15]){
        tube(legs,[[xx*1.15,.014,zz*1.2],[xx,.45,zz]],.014,'detail',1);
        legs.geometry(new THREE.CylinderGeometry(.018,.018,.018,8),translate(xx*1.15,.009,zz*1.2),'detail',false);
    }
    // Stretchers connect to the legs beneath the seat.
    for(const xx of[-.168,.168])tube(legs,[[xx,.28,-.16],[xx,.28,.16]],.009,'profile',1);
    group.add(legs.finish());
    const back=new KitDrawing(`${id}/backrest`,materials,'cafe');
    tube(back,[[-.16,.45,.15],[-.21,.72,.14],[-.22,.86,.13],[-.15,.90,.20],[0,.915,.235],[.15,.90,.20],[.22,.86,.13],[.21,.72,.14],[.16,.45,.15]],.014,'detail',28);
    tube(back,[[-.22,.69,.13],[0,.69,.23],[.22,.69,.13]],.011,'detail',12);
    group.add(back.finish());return group;
}

export function createSeatingSet(materials,{id,x,z,y=0,pastry=true,chairOffsets=[[0,-.76],[0,.76]]}){
    const group=new THREE.Group();group.name=id;group.position.set(x,y,z);
    group.userData={component:'seating-set',pastry,chairCount:chairOffsets.length};
    const table=new KitDrawing(`${id}/table`,materials,'cafe');
    table.cylinder(0,.84,0,.47,.065,'paper','ink');
    table.cylinder(0,.438,0,.043,.74,'paper','detail');
    table.cylinder(0,.085,0,.085,.10,'paper','hair');
    for(let i=0;i<3;i++){
        const a=i/3*Math.PI*2;
        tube(table,[[0,.12,0],[Math.cos(a)*.30,.018,Math.sin(a)*.30]],.018,'detail',1);
    }
    group.add(table.finish());
    const service=new KitDrawing(`${id}/table-service`,materials,'cafe');
    cup(service,.14,.8725,-.13);cup(service,-.17,.8725,.11);
    if(pastry)pastryPlate(service,.15,.8725,.17);
    group.add(service.finish());
    for(const[index,[cx,cz]]of chairOffsets.entries())group.add(chair(materials,`${id}/chair-${index}`,cx,cz));
    return group;
}
