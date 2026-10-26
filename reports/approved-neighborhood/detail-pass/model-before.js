import * as THREE from '../assets/vendor/three/three.module.js';
import { Drawing, PALETTE, createIllustrationMaterials,
    createIllustratedCar, table, chair, pot, staticFigure, outlinedPart } from './geomarketeer-block-model.js';

export const REFERENCE = Object.freeze({ width:1448, height:1086, unit:32, originX:724, originY:654,
    pitch:Math.atan(1/Math.sqrt(2)), yaw:Math.PI/4,
    image:'assets/portfolio/geomarketeer/cafe-corner/cafe-corner-approved-v2.png' });
export const PIXELS_PER_UNIT=REFERENCE.unit*Math.sqrt(3/2);

// Calibrated image landmarks are converted into actual world coordinates.
// At the approved orthographic camera this inverse projects to the same pixel.
export function fromReference(px,py,y=0) {
    const difference=(px-REFERENCE.originX)/(REFERENCE.unit*Math.sqrt(3)/2);
    const sum=(py-REFERENCE.originY+y*REFERENCE.unit)/(REFERENCE.unit/2);
    return new THREE.Vector3((sum+difference)/2,y,(sum-difference)/2);
}
const at=(px,py,y=0)=>fromReference(px,py,y);
const transform=(x,y,z,rx=0,ry=0,rz=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1));

export const BUILDINGS=Object.freeze([
    {id:'offices',name:'Office block',roof:[429,45],w:5.7,d:6.6,h:10.4},
    {id:'shop',name:'Local shop',roof:[714,146],w:3.3,d:3.6,h:2.8},
    {id:'home',name:'Terrace home',roof:[1011,230],w:3.4,d:3.3,h:5.1},
    {id:'apartments',name:'Apartments',roof:[1200,343],w:4.5,d:4.7,h:5.4},
    {id:'cafe',name:'Corner Café',roof:[707,463],w:5.3,d:5.0,h:6.2},
]);

function plane(axis,side,u,y) {return axis==='front'?[u,y,side]:[side,y,u];}
function facadeQuad(draw,axis,side,u,y,w,h,tint='glass',edge='detail') {
    return draw.quad([plane(axis,side,u,y),plane(axis,side,u+w,y),plane(axis,side,u+w,y+h),plane(axis,side,u,y+h)],tint,edge);
}
function facadePath(draw,axis,side,points,weight='hair') {return draw.path(points.map(([u,y])=>plane(axis,side,u,y)),weight);}
function facadeEllipse(draw,axis,side,u,y,rx,ry,tint='paper',edge='detail',angle=0) {
    const points=Array.from({length:16},(_,i)=>{
        const t=i/16*Math.PI*2,xx=Math.cos(t)*rx,yy=Math.sin(t)*ry;
        return plane(axis,side,u+xx*Math.cos(angle)-yy*Math.sin(angle),y+xx*Math.sin(angle)+yy*Math.cos(angle));
    });
    const center=plane(axis,side,u,y);
    for(let i=0;i<points.length;i++)draw.quad([center,points[i],points[(i+1)%points.length],center],tint,false);
    if(edge)draw.path(points,edge,true);
}
function facadeDisc(draw,axis,side,u,y,r,tint='paper') {facadeEllipse(draw,axis,side,u,y,r,r,tint,'detail');}

function window(draw,axis,side,u,y,w,h,variant=0) {
    facadeQuad(draw,axis,side,u,y,w,h,'glass');
    const outward=side+0.055;
    facadePath(draw,axis,outward,[[u+w*.5,y],[u+w*.5,y+h]],'detail');
    facadePath(draw,axis,outward,[[u+w*.1,y+h*.58],[u+w*.35,y+h*.87]],'hair');
    if(variant<0)return;
    const a=u+w*.74,b=y+.09;
    // Shallow geometry inside the glazing gives the small windows a lived-in scale.
    const stem=(cx,cy,scale=1)=>{
        scale*=Math.max(1,Math.min(1.5,h/1.05));
        const p=(xx,yy)=>plane(axis,outward+.012,cx+xx*scale,cy+yy*scale);
        draw.quad([p(-.12,0),p(.12,0),p(.15,.21),p(-.15,.21)],'paper','detail');
        draw.path([p(0,.21),p(0,.9)],'detail');
        for(const[dx,dy,angle]of[[-.09,.39,-.65],[.09,.53,.65],[-.09,.67,-.65],[.06,.79,.3]]){
            facadeEllipse(draw,axis,outward+.02,cx+dx*scale,cy+dy*scale,.065*scale,.17*scale,'leaf','detail',angle);
        }
    };
    if(w>=1.4&&h>=1.3){
        const life=Math.min(1.5,h/1.3),base=y+.1;
        stem(u+w*.17,base,.75);
        if(variant%3===0){stem(u+w*.5,base,.95);stem(u+w*.8,base,.65);}
        else{
            const cx=u+w*.51,head=base+.85*life;
            facadeEllipse(draw,axis,outward+.03,cx,head,.12*life,.15*life,'paper','detail');
            draw.quad([plane(axis,outward+.03,cx-.16*life,base+.14),plane(axis,outward+.03,cx+.16*life,base+.14),plane(axis,outward+.03,cx+.12*life,head-.18*life),plane(axis,outward+.03,cx-.12*life,head-.18*life)],'paper','detail');
            facadePath(draw,axis,outward+.04,[[cx-.12*life,head-.2*life],[cx-.22*life,base+.4*life],[cx+.1*life,base+.36*life]],'detail');
            facadeQuad(draw,axis,outward+.05,cx+.03*life,base+.4*life,.14*life,.14*life,'paper','detail');
            stem(u+w*.84,base,.72);
        }
        return;
    }
    if(variant%3===0){
        stem(a,b);stem(u+w*.25,b,.65);
    }else if(variant%3===1){
        const life=Math.max(1,Math.min(1.5,h/1.05));
        facadeDisc(draw,axis,outward,a,b+.66*life,.13*life);
        facadeQuad(draw,axis,outward,a-.17*life,b,.34*life,.48*life,'paper','detail');
        facadePath(draw,axis,outward+.01,[[a-.14,b+.33],[a-.25,b+.17],[a+.15,b+.13]],'detail');
        stem(u+w*.22,b,.65);
    }else{
        facadeQuad(draw,axis,outward,u+.08,b+.12,w*.38,.09,'paper','detail');
        facadePath(draw,axis,outward+.01,[[u+.14,b+.12],[u+.14,b+.02],[u+.31,b+.02],[u+.31,b+.12]],'detail');
        stem(a,b,.8);
    }

}
function parapet(draw,x,z,w,d,y) {
    for(const zz of[z,z+d])draw.box(x+w/2,y-.1,zz,w+.14,.2,.14,'paper',false);
    for(const xx of[x,x+w])draw.box(xx,y-.1,z+d/2,.14,.2,d,'paper',false);
    draw.box(x+w/2,y-.21,z+d/2,w-.14,.035,d-.14,'paper',false);
    draw.path([[x-.07,y,z-.07],[x+w+.07,y,z-.07],[x+w+.07,y,z+d+.07],[x-.07,y,z+d+.07]],'ink',true);
    draw.path([[x+.08,y,z+.08],[x+w-.08,y,z+.08],[x+w-.08,y,z+d-.08],[x+.08,y,z+d-.08]],'profile',true);
}
function hvac(draw,x,z,y,w=1,d=.7) {
    draw.box(x+w/2,y+.4,z+d/2,w,.8,d,'wall','detail');
    draw.box(x+w/2,y+.82,z+d/2,w+.07,.05,d+.07,'paper','detail');
    for(let i=0;i<5;i++){facadePath(draw,'front',z+d+.025,[[x+.1,y+.12+i*.12],[x+w-.1,y+.12+i*.12]],'hair');facadePath(draw,'side',x+w+.025,[[z+.12,y+.12+i*.12],[z+d-.12,y+.12+i*.12]],'detail');}
}

function office(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/offices',materials,'offices');
    draw.box(x+w/2,(h-.25)/2,z+d/2,w,h-.25,d,'paper','ink');
    parapet(draw,x,z,w,d,h);
    for(let row=0;row<6;row++) {
        const y=1.55+row*1.48;
        for(let col=0;col<4;col++)window(draw,'front',z+d+.012,x+.32+col*1.33,y,.89,.96,(row+col)%3===0?row+col:-1);
        for(let col=0;col<4;col++)window(draw,'side',x+w+.012,z+.44+col*1.49,y,1.0,.96,(row+col)%3===1?row+col+1:-1);
    }
    const entry=x+w*.38;
    facadeQuad(draw,'front',z+d+.02,entry,.04,1.25,1.3,'glass');
    facadePath(draw,'front',z+d+.04,[[entry+.625,.04],[entry+.625,1.34]],'detail');
    draw.box(entry+.625,1.47,z+d+.34,1.55,.12,.8,'paper','ink');
    for(const xx of[entry-.08,entry+1.33])draw.path([[xx,.02,z+d+.64],[xx,1.46,z+d+.64]],'detail');
    const unit=at(349,114,h),small=at(474,140,h);
    hvac(draw,unit.x,unit.z,h,1.6,1.8);hvac(draw,small.x,small.z,h,.95,1.35);
    draw.path([[unit.x+.75,h+.56,unit.z+.9],[unit.x+.75,h+2.55,unit.z+.9]],'detail');
    for(let i=0;i<3;i++)draw.path([[unit.x+.55,h+1.35+i*.3,unit.z+.9],[unit.x+.95,h+1.55+i*.3,unit.z+.9]],'detail');
    return draw.finish();
}
function stripedAwning(draw,axis,side,start,length,y,segments=10) {
    const p=(a,b,c)=>axis==='front'?[a,b,side+c]:[side+c,b,a];
    for(let i=0;i<segments;i++){
        const a=start+length*i/segments,b=start+length*(i+1)/segments;
        draw.quad([p(a,y,0),p(b,y,0),p(b,y-.44,.7),p(a,y-.44,.7)],i%2?'shade':'paper',false);
        draw.path([p(a,y,0),p(a,y-.44,.7)],'detail');
        draw.path(Array.from({length:9},(_,j)=>p(a+(b-a)*j/8,y-.44-Math.sin(j/8*Math.PI)*.09,.7)),'detail');
    }
    draw.path([p(start,y,0),p(start+length,y,0)],'ink');
}
function shop(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/shop',materials,'shop');
    draw.box(x+w/2,(h-.2)/2,z+d/2,w,h-.2,d,'paper','ink');parapet(draw,x,z,w,d,h);
    window(draw,'front',z+d+.025,x+.25,.35,w-.5,h-.85,0);
    facadeQuad(draw,'side',x+w+.025,z+.18,.14,d-.36,h-.6,'glass');
    for(const u of[x+w*.34,x+w*.68])facadePath(draw,'side',x+w+.045,[[z+d*(u-x)/w,.14],[z+d*(u-x)/w,h-.46]],'detail');
    stripedAwning(draw,'side',x+w+.025,z+.12,d-.24,h-.3,10);
    return draw.finish();
}
function home(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/home',materials,'home');
    draw.box(x+w/2,2.2,z+d/2,w,4.4,d,'paper','ink');
    for(let row=0;row<3;row++)for(let col=0;col<2;col++){
        window(draw,'front',z+d+.012,x+.36+col*1.7,.4+row*1.28,.65,.8,row+col);
        window(draw,'side',x+w+.012,z+.37+col*1.58,.4+row*1.28,.72,.8,row+col+1);
    }
    facadeQuad(draw,'front',z+d+.025,x+1.34,.03,.7,1.35,'glass');
    draw.box(x+1.69,1.5,z+d+.22,.9,.08,.55,'paper','detail');
    // Pitched front roof and a small rear roof terrace with its water tank.
    draw.quad([[x,h,z+1.15],[x+w,h,z+1.15],[x+w,4.4,z+d],[x,4.4,z+d]],'paper','ink');
    draw.box(x+w/2,h-.12,z+.57,w,.12,1.15,'paper','detail');
    for(const xx of[x,x+w])draw.path([[xx,h,z],[xx,h,z+1.15]],'detail');
    draw.path([[x,h,z],[x+w,h,z]],'ink');
    draw.cylinder(x+.68,h+.43,z+.56,.4,.8,'wall','detail');
    draw.cylinder(x+.68,h+.86,z+.56,.42,.055,'paper','detail');
    draw.cylinder(x+.68,h+.92,z+.56,.075,.08,'paper','hair');
    draw.cylinder(x+2.7,h+.48,z+.3,.065,.95,'paper','detail');
    draw.cylinder(x+2.2,h+.35,z+.7,.23,.05,'paper','detail');
    pot(draw,x+2.8,h,z+.85,.16);
    return draw.finish();
}
function apartments(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/apartments',materials,'apartments');
    draw.box(x+w/2,(h-.2)/2,z+d/2,w,h-.2,d,'paper','ink');parapet(draw,x,z,w,d,h);
    for(let row=0;row<4;row++){
        const y=.35+row*1.25;
        for(let col=0;col<3;col++)window(draw,'front',z+d+.012,x+.3+col*1.42,y,.72,.77,row+col);
        for(let col=0;col<3;col++)window(draw,'side',x+w+.012,z+.34+col*1.46,y,.75,.77,row+col+1);
    }
    facadeQuad(draw,'front',z+d+.03,x+w/2-.38,.02,.76,1.2,'glass');
    draw.box(x+w/2,1.28,z+d+.22,1.0,.1,.6,'paper','detail');
    for(const y of[1.6,3.1]){
        const z0=z+1.58,z1=z+3.9,xx=x+w+.7;
        draw.box(x+w+.36,y,z+2.74,.74,.08,2.45,'paper','detail');
        draw.path([[xx,y+.05,z0],[xx,y+.63,z0],[xx,y+.63,z1],[xx,y+.05,z1]],'detail');
        for(let zz=z0+.2;zz<z1;zz+=.22)draw.path([[xx,y+.05,zz],[xx,y+.59,zz]],'hair');
        pot(draw,x+w+.37,y+.06,z+1.9,.13);pot(draw,x+w+.37,y+.06,z+3.45,.14);
    }
    hvac(draw,x+1.4,z+1.4,h,1.05,.7);
    return draw.finish();
}

function cafe(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/cafe',materials,'cafe');
    const inside=new Drawing('approved/cafe-interior',materials,'cafe');
    draw.box(x+w/2,.12,z+d/2,w+.12,.18,d+.12,'paper','ink');
    draw.box(x+w/2,3.05,z+d/2,w,.12,d,'wall',false);
    // Open storefronts, a solid upstairs shell, and glazed window reveals.
    draw.box(x+w/2,4.56,z+d/2,w,2.9,d,'paper','ink');
    for(let col=0;col<3;col++)window(draw,'front',z+d+.025,x+.17+col*1.72,3.45,1.48,1.48,col);
    for(let col=0;col<2;col++)window(draw,'side',x+w+.025,z+.25+col*2.45,3.45,1.98,1.48,col+1);
    draw.box(x+w/2,1.55,z+.05,w,2.9,.1,'wall',false);
    draw.box(x+.05,1.55,z+d/2,.1,2.9,d,'wall',false);
    for(const xx of[x+.04,x+w*.32,x+w*.65,x+w-.04])draw.box(xx,1.56,z+d-.035,.09,2.85,.1,'paper','detail');
    for(const zz of[z+.04,z+d*.4,z+d*.73,z+d-.04])draw.box(x+w-.035,1.56,zz,.1,2.85,.09,'paper','detail');
    stripedAwning(draw,'front',z+d+.03,x-.02,w+.04,3.1,14);
    stripedAwning(draw,'side',x+w+.03,z-.02,d+.04,3.1,13);
    parapet(draw,x,z,w,d,h);
    const service=at(748,544,h);hvac(draw,service.x,service.z,h,1.2,1.3);
    // Counter equipment is close to the street-facing glass, visible at the approved elevation.
    inside.box(x+w-.4,.6,z+1.7,.65,.85,2.55,'wall','detail');
    inside.box(x+w-.4,1.07,z+1.7,.75,.08,2.68,'paper','ink');
    inside.box(x+w-.4,1.43,z+.95,.5,.6,.85,'shade','detail');
    inside.box(x+w-.4,1.76,z+.95,.6,.06,.94,'paper','detail');
    for(let i=0;i<3;i++)inside.cylinder(x+w-.4,1.85,z+.7+i*.23,.065,.12,'paper','detail');
    for(let i=0;i<8;i++)inside.path([[x+w-.065,.2,z+.5+i*.3],[x+w-.065,1.0,z+.5+i*.3]],'hair');
    staticFigure(inside,x+w-.7,.15,z+2.6,Math.PI/2,false);
    for(const xx of[x+.8,x+2.35,x+3.9]){
        inside.path([[xx,2.98,z+d-.5],[xx,2.47,z+d-.5]],'detail');
        inside.geometry(new THREE.ConeGeometry(.14,.17,20),transform(xx,2.38,z+d-.5),'shade','detail');
    }
    table(inside,x+1.25,z+d-.8,.1);chair(inside,x+.7,z+d-.8,Math.PI/2,.1);
    pot(inside,x+.3,.12,z+d-.4,.23);
    table(inside,x+2.6,z+d-.7,.08);chair(inside,x+2.15,z+d-.7,Math.PI/2,.08);
    staticFigure(inside,x+2.15,.08,z+d-.7,Math.PI/2,true);
    // Street display: shallow glazed case, cake stands and a serving counter.
    inside.box(x+4.0,.65,z+d-.45,1.15,.95,.6,'wall','detail');
    inside.box(x+4.0,1.15,z+d-.45,1.24,.08,.67,'paper','detail');
    for(const xx of[x+3.46,x+4.54])inside.path([[xx,1.18,z+d-.11],[xx,1.72,z+d-.11],[xx,1.72,z+d-.73],[xx,1.18,z+d-.73]],'detail');
    inside.box(x+4.0,1.72,z+d-.45,1.22,.035,.65,'glass','detail');
    for(const xx of[x+3.65,x+4.0,x+4.35]){
        inside.cylinder(xx,1.24,z+d-.4,.12,.06,'paper','detail');
        inside.cylinder(xx,1.45,z+d-.4,.085,.13,'shade','detail');
    }
    pot(inside,x+w-.25,.1,z+d-.4,.22);
    for(const zz of[z+.7,z+2.0]){
        inside.path([[x+w-.2,2.98,zz],[x+w-.2,2.1,zz]],'detail');
        inside.geometry(new THREE.ConeGeometry(.14,.17,20),transform(x+w-.2,2.0,zz),'shade','detail');
    }
    const group=draw.finish();group.add(outlinedPart(inside,materials));
    return group;
}

function floorPolygon(draw,pixels,y,tint) {
    const shape=new THREE.Shape();
    pixels.forEach(([px,py],index)=>{const p=at(px,py,y);if(index===0)shape.moveTo(p.x,-p.z);else shape.lineTo(p.x,-p.z);});
    shape.closePath();
    draw.geometry(new THREE.ShapeGeometry(shape),transform(0,y,0,-Math.PI/2),tint,false);
}
function island(draw,x0,z0,x1,z1) {
    draw.rounded((x0+x1)/2,-.035,(z0+z1)/2,x1-x0,.07,z1-z0,.45,'paper',false);
    const r=.45,points=[];
    for(const[x,z,a0]of[[x1-r,z1-r,0],[x0+r,z1-r,Math.PI/2],[x0+r,z0+r,Math.PI],[x1-r,z0+r,Math.PI*1.5]])
        for(let i=0;i<=6;i++){const a=a0+i/6*Math.PI/2;points.push([x+Math.cos(a)*r,.008,z+Math.sin(a)*r]);}
    draw.path(points,'detail',true);
}
function ground(materials) {
    const draw=new Drawing('approved/streets-and-parcels',materials);
    floorPolygon(draw,[[23,641],[699,256],[1426,636],[1434,665],[751,1078],[703,1078],[22,674]],-.07,'road');
    island(draw,-14.4,-4.3,-6.5,11.0);
    island(draw,-14.1,-13.6,-8.8,-7.4);
    island(draw,-3.7,-14.1,9.6,-7.1);
    island(draw,-2.2,-1.2,8.6,8.8);
    // Local paving stops at parcel boundaries, keeping the roads quiet.
    for(const[x0,z0,x1,z1]of[[-14.2,3.4,-6.7,10.8],[-1.9,-.9,8.3,8.5],[-3.4,-13.8,9.3,-7.3],[-13.9,-13.4,-9,-7.6]]){
        for(let x=x0;x<x1;x+=.64)draw.path([[x,.012,z0],[x,.012,z1]],'hair');
        for(let z=z0;z<z1;z+=.64)draw.path([[x0,.012,z],[x1,.012,z]],'hair');
    }
    // White center marks follow each of the two directions of the street grid.
    for(const[x,z,length,axis]of[[-5.0,-13.0,26,'z'],[-11.0,13.0,22,'x'],[-4.8,-5.6,22,'x']]){
        for(let s=0;s<length;s+=1.35){
            const xx=x+(axis==='x'?s:0),zz=z+(axis==='z'?s:0);
            draw.box(xx,-.058,zz,axis==='x'?.8:.1,.007,axis==='z'?.8:.1,'paper',false);
        }
    }
    for(const[px,py,axis]of[[518,949,'x'],[862,961,'z'],[846,470,'x']]){
        const p=at(px,py,-.055);
        for(let i=0;i<7;i++)draw.box(p.x+(axis==='x'?i*.4:0),-.055,p.z+(axis==='z'?i*.4:0),axis==='x'?.23:3.2,.008,axis==='z'?.23:3.2,'paper',false);
    }
    for(const[px,py]of[[409,657],[896,542],[1062,660],[410,787],[916,823]]){
        const p=at(px,py,.01);draw.box(p.x,.01,p.z,.65,.018,.34,'curb','detail');
        for(let i=0;i<5;i++)draw.path([[p.x-.26+i*.13,.025,p.z-.13],[p.x-.26+i*.13,.025,p.z+.13]],'hair');
    }
    return draw.finish();
}

function flowerBox(draw,foliage,x,z,w=1.2,d=.4) {
    draw.box(x+w/2,.19,z+d/2,w,.38,d,'paper','detail');
    draw.box(x+w/2,.4,z+d/2,w+.06,.05,d+.06,'paper','detail');
    for(let i=0;i<9;i++){
        const xx=x+.12+(w-.24)*(i%5)/4,zz=z+d*.3+(i%2)*d*.4,yy=.52+(i%3)*.06;
        foliage.geometry(new THREE.SphereGeometry(.12,8,6),transform(xx,yy,zz),'leaf',false);
    }
}
function parkBench(draw,x,z,heading=0) {
    const m=transform(x,0,z,0,heading);
    const p=(xx,y,zz)=>new THREE.Vector3(xx,y,zz).applyMatrix4(m).toArray();
    for(let i=0;i<3;i++)draw.geometry(new THREE.BoxGeometry(2.0,.04,.1),m.clone().multiply(transform(0,.49,-.18+i*.15)),'paper','detail');
    for(let i=0;i<3;i++)draw.geometry(new THREE.BoxGeometry(2.0,.13,.06),m.clone().multiply(transform(0,.82+i*.21,.23)),'paper','detail');
    for(const xx of[-.8,.8]){
        draw.path([p(xx,0,-.15),p(xx,.47,-.15),p(xx,.47,.18),p(xx,0,.18)],'detail');
        draw.path([p(xx,.47,.2),p(xx,1.32,.23)],'detail');
    }
}

function capsuleTree(foliage,highlights,props,config) {
    const[px,footY,centerPixelY,pixelHeight,pixelWidth]=config,p=at(px,footY);
    const radius=pixelWidth/2/PIXELS_PER_UNIT;
    const length=(pixelHeight-pixelWidth)/REFERENCE.unit;
    const center=(footY-centerPixelY)/REFERENCE.unit;
    foliage.geometry(new THREE.CapsuleGeometry(radius,Math.max(.01,length),8,24),transform(p.x,center,p.z),'leaf',false);
    props.cylinder(p.x,center/2,p.z,.055,center,'accent',false);
    const q=new THREE.Vector3(Math.SQRT1_2,0,-Math.SQRT1_2),n=new THREE.Vector3(Math.SQRT1_2,0,Math.SQRT1_2);
    // White highlight patches follow the capsule surface; they are geometry,
    // not a billboard or a baked image of the approved illustration.
    function highlight(yOffset,height,width){
        const r=width/2,straight=Math.max(0,height-2*r),points=[];
        for(let i=0;i<=12;i++){const a=i/12*Math.PI;points.push([Math.cos(a)*r,straight/2+Math.sin(a)*r]);}
        for(let i=0;i<=12;i++){const a=Math.PI+i/12*Math.PI;points.push([Math.cos(a)*r,-straight/2+Math.sin(a)*r]);}
        const vertices=points.map(([u,v])=>{
            const sideways=u+radius*.35,yy=v+yOffset;
            const dy=Math.max(0,Math.abs(yy)-length/2);
            const depth=Math.sqrt(Math.max(.001,radius*radius-dy*dy-sideways*sideways))+.012;
            return[p.x+q.x*sideways+n.x*depth,center+yy,p.z+q.z*sideways+n.z*depth];
        });
        const mid=vertices.reduce((a,b)=>a.map((v,i)=>v+b[i]/vertices.length),[0,0,0]);
        for(let i=0;i<vertices.length;i++)highlights.quad([mid,vertices[i],vertices[(i+1)%vertices.length],mid],'paper',false);
    }
    highlight(length*.27,.74,.18);highlight(-length*.23,.29,.18);
}
function conifer(foliage,props,px,py,height=2.9) {
    const p=at(px,py),s=height/2.9;
    props.cylinder(p.x,.46*s,p.z,.05,.92*s,'accent',false);
    for(let i=0;i<3;i++){
        const radius=(.65-i*.17)*s,y=(1.0+i*.63)*s;
        foliage.geometry(new THREE.ConeGeometry(radius,.96*s,28),transform(p.x,y,p.z),'leaf',false);
        props.ring(p.x,y-.48*s,p.z,radius,'detail');
    }
}

export function createApprovedNeighborhood() {
    const materials=createIllustrationMaterials({...PALETTE,ink:'#164aff',detail:'#2857ff',hair:'#8eafff',profile:'#537fff',accent:'#315bff',wall:'#dbe5ff',shade:'#83a6ff',leaf:'#e1e8ff',road:'#d6dfff',glass:'#c9d9ff'});
    materials.paperShading={x:[.55,.7],z:[.7,.84]};
    const scene=new THREE.Group();scene.name='approved-corner/neighborhood';
    const anchors={},bounds={};
    scene.add(ground(materials));
    for(const building of BUILDINGS){
        let object;
        object=({offices:office,shop,home,apartments,cafe})[building.id](materials,building);
        scene.add(object);
        const p=at(...building.roof,building.h);
        anchors[building.id]=new THREE.Vector3(p.x+building.w/2,building.h/2,p.z+building.d/2);
        bounds[building.id]={x:p.x,z:p.z,w:building.w,d:building.d,h:building.h};
    }
    const props=new Drawing('approved/street-furniture',materials);
    const foliage=new Drawing('approved/planting',materials);
    const highlights=new Drawing('approved/tree-highlights',materials);
    const figures=new Drawing('approved/people',materials);
    for(const config of[[98,600,498,112,55],[214,501,386,112,55],[589,505,428,93,53],[540,733,664,92,52],[919,784,704,114,56],[814,285,152,113,54],[920,389,283,89,50],[1359,607,492,123,58],[1225,698,626,89,49]])capsuleTree(foliage,highlights,props,config);
    for(const config of[[151,556,2.8],[534,505,2.5],[868,269,2.9],[884,446,2.9],[1037,606,2.8],[878,684,2.9],[456,750,2.7]])conifer(foliage,props,...config);
    for(const[px,py,r]of[[452,588,.78],[190,671,.72]]){
        const p=at(px,py);props.cylinder(p.x,1.15,p.z,.055,2.3,'accent',false);
        foliage.geometry(new THREE.SphereGeometry(r,24,16),transform(p.x,2.3,p.z),'leaf',false);
        for(const cy of[.33,-.13]){
            const pts=Array.from({length:20},(_,i)=>{
                const a=i/20*Math.PI*2,side=r*.4+Math.cos(a)*r*.115,yy=cy+Math.sin(a)*r*.17;
                const depth=Math.sqrt(Math.max(.001,r*r-side*side-yy*yy))+.012;
                return[p.x+(side+depth)*Math.SQRT1_2,2.3+yy,p.z+(depth-side)*Math.SQRT1_2];
            });
            const mid=pts.reduce((a,b)=>a.map((v,i)=>v+b[i]/pts.length),[0,0,0]);
            for(let i=0;i<pts.length;i++)highlights.quad([mid,pts[i],pts[(i+1)%pts.length],mid],'paper',false);
        }
    }
    for(const[px,py,heading]of[[150,575,0],[242,582,0],[310,608,0],[244,638,0]]){
        const p=at(px,py,.49);parkBench(props,p.x,p.z,heading+Math.PI);
    }
    for(const[px,py,heading,guest]of[[553,770,Math.PI/2,true],[631,829,Math.PI/2,true],[852,784,0,false]]){
        const p=at(px,py,.8725);table(props,p.x,p.z,0);
        if(heading){chair(props,p.x-.53,p.z,Math.PI/2,0);chair(props,p.x+.53,p.z,-Math.PI/2,0);if(guest)staticFigure(figures,p.x-.53,0,p.z,Math.PI/2,true);}
        else{chair(props,p.x,p.z-.53,0,0);chair(props,p.x,p.z+.53,Math.PI,0);}
    }
    for(const[px,py,w,d]of[[239,493,1.2,.4],[362,537,1.1,.4],[414,564,1.2,.4],[244,665,1.6,.5],[832,287,1.05,.4],[898,435,1.1,.4],[947,488,1.2,.4],[1111,592,1.1,.4],[1145,657,1.2,.4],[1308,630,1.35,.4],[501,729,.7,.6],[812,849,1.2,.4],[732,867,.7,.6],[955,754,1.2,.4]]){
        const p=at(px,py,.2);flowerBox(props,foliage,p.x,p.z,w,d);
    }
    for(const[px,py]of[[669,825],[877,719],[549,788]]){const p=at(px,py);pot(props,p.x,0,p.z,.25);}
    for(const[px,py]of[[132,642],[205,539],[606,539],[877,426],[1371,656],[1264,679],[732,917],[423,760],[951,821]]){
        const p=at(px,py);props.cylinder(p.x,1.25,p.z,.045,2.5,'paper',false);props.path([[p.x,.06,p.z],[p.x,2.5,p.z]],'detail');props.cylinder(p.x,2.54,p.z,.18,.07,'paper','detail');props.cylinder(p.x,.08,p.z,.09,.13,'paper','detail');
    }
    for(const[px,py]of[[421,788],[493,867],[731,924],[952,814]]){const p=at(px,py);props.cylinder(p.x,.35,p.z,.06,.7,'paper','detail');props.path([[p.x,.07,p.z],[p.x,.7,p.z]],'detail');}
    const bin=at(357,644);props.cylinder(bin.x,.3,bin.z,.18,.6,'wall','detail');props.path([[bin.x+.18,.04,bin.z],[bin.x+.18,.55,bin.z]],'detail');
    const board=at(683,892);
    props.box(board.x,.55,board.z,.5,1.0,.07,'wall','detail');
    props.path([[board.x-.24,0,board.z+.25],[board.x-.24,1.08,board.z],[board.x-.24,0,board.z-.24]],'detail');
    props.path([[board.x+.24,0,board.z+.25],[board.x+.24,1.08,board.z],[board.x+.24,0,board.z-.24]],'detail');
    for(const[px,py,heading]of[[309,546,0],[383,609,0],[657,339,0],[737,365,0],[950,526,0],[1282,678,0],[770,866,0]]){const p=at(px,py);staticFigure(figures,p.x,0,p.z,heading,false);}
    scene.add(props.finish(),outlinedPart(foliage,materials),highlights.finish(),outlinedPart(figures,materials));
    const cars=[];
    for(const[index,[px,py,yaw]]of[[712,439,0],[218,775,0],[438,900,0],[1139,806,-Math.PI/2],[1030,723,0]].entries()){
        const car=createIllustratedCar(materials,`approved/car-${index+1}`),p=at(px,py);car.scale.setScalar(1.65);car.position.set(p.x,-.1,p.z);car.rotation.y=yaw;scene.add(car);cars.push(car);
    }
    const lineMaterials=new Map();
    scene.traverse(object=>{if(object.isLineSegments2)lineMaterials.set(object.material,object.name.split('/').at(-1));});
    const baseResize=materials.resize.bind(materials);
    materials.resize=(w,h,span,zoom=1)=>{
        baseResize(w,h,span,zoom);
        const scale=h/span*zoom/PIXELS_PER_UNIT;
        for(const[material,weight]of lineMaterials){material.linewidth=Math.max(.5,({ink:2.2,detail:1.65,hair:.9,profile:1.2}[weight]||1)*scale);material.opacity=weight==='hair'?.75:1;material.visible=true;}
        materials.silhouette.uniforms.width.value=1.1/PIXELS_PER_UNIT;
    };
    scene.updateMatrixWorld(true);
    return{scene,anchors,bounds,cars,materials,
        dispose(){const geometries=new Set(),owned=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.userData.ownedMaterial)owned.add(o.material);});for(const g of geometries)g.dispose();for(const m of owned)m.dispose();materials.dispose();}
    };
}
