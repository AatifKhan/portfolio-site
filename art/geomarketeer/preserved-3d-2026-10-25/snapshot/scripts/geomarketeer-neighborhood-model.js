import * as THREE from '../assets/vendor/three/three.module.js';
import { Drawing as BaseDrawing, PALETTE, createIllustrationMaterials,
    table, chair, pot, staticFigure, outlinedPart } from './geomarketeer-block-model.js';
import { BENCHES, CAPSULE_TREES, CONIFERS, ROUND_TREES, PLANTERS, LAMPS, BOLLARDS, TABLES, FACADE_COUNTS, CROSSWALKS, DRAINS, STANDING_PEOPLE, CARS } from './geomarketeer-neighborhood-details.js';

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

// These ramps belong to this study. The original portfolio illustration keeps
// its own palette and rendering. All washes are editable vertex colours.
const PAINT=Object.freeze({
    leftLow:'#b9cbff',leftHigh:'#cbd9ff',rightLow:'#e0e9ff',rightHigh:'#f7f9ff',
    glassLeftLow:'#9bb8ff',glassLeftHigh:'#d7e4ff',glassRightLow:'#b8ceff',glassRightHigh:'#edf3ff',
    leafLow:'#c6d5ff',leafHigh:'#e9efff',roadLow:'#cfdbff',roadHigh:'#e1e9ff',
    coniferLow:'#adc4ff',coniferHigh:'#dce6ff',
    cafeLeftLow:'#d3dfff',cafeLeftHigh:'#e7eeff',
});
const paintColours=Object.fromEntries(Object.entries(PAINT).map(([key,value])=>[key,new THREE.Color(value)]));
class Drawing extends BaseDrawing {
    wash(start,tint) {
        if(!['paper','glass','leaf','conifer','road'].includes(tint))return this;
        let min=Infinity,max=-Infinity;
        for(let i=start;i<this.vertices.length;i+=3){min=Math.min(min,this.vertices[i+1]);max=Math.max(max,this.vertices[i+1]);}
        const height=Math.max(.01,max-min),tone=new THREE.Color();
        for(let i=start;i<this.vertices.length;i+=3){
            const y=this.vertices[i+1],nx=this.normals[i],ny=this.normals[i+1],nz=this.normals[i+2];
            const rise=(y-min)/height,right=Math.abs(nx)>Math.abs(nz);
            if(tint==='paper'){
                if(Math.abs(ny)>.5)continue;
                const cafeFront=this.place==='cafe'&&!right;
                tone.copy(paintColours[cafeFront?'cafeLeftLow':right?'rightLow':'leftLow']).lerp(paintColours[cafeFront?'cafeLeftHigh':right?'rightHigh':'leftHigh'],rise);
            }else if(tint==='glass'){
                tone.copy(paintColours[right?'glassRightLow':'glassLeftLow']).lerp(paintColours[right?'glassRightHigh':'glassLeftHigh'],rise);
            }else if(tint==='leaf'||tint==='conifer'){
                const light=THREE.MathUtils.clamp(.38+ny*.22+(nz-nx)*.16+rise*.17,0,1);
                tone.copy(paintColours[tint==='conifer'?'coniferLow':'leafLow']).lerp(paintColours[tint==='conifer'?'coniferHigh':'leafHigh'],light);
            }else{
                const depth=THREE.MathUtils.clamp((this.vertices[i]+this.vertices[i+2]+18)/50,0,1);
                tone.copy(paintColours.roadHigh).lerp(paintColours.roadLow,depth);
            }
            this.colors[i]=tone.r;this.colors[i+1]=tone.g;this.colors[i+2]=tone.b;
        }
        return this;
    }
    geometry(geometry,matrix,tint='paper',edges='detail',threshold=30){const start=this.vertices.length;super.geometry(geometry,matrix,tint,edges,threshold);return this.wash(start,tint);}
    quad(points,tint='paper',edge='detail'){const start=this.vertices.length;super.quad(points,tint,edge);return this.wash(start,tint);}
}

export const BUILDINGS=Object.freeze([
    {id:'offices',name:'Office block',roof:[429,45],w:5.7,d:6.6,h:9.85},
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
    (draw.windowCells ||= []).push({axis,side,u,y,w,h});
    facadeQuad(draw,axis,side,u,y,w,h,'glass','ink');
    const outward=side+0.055;
    // Filled blue reveals and broad, quiet reflections give the panes depth
    // without nesting a second outlined rectangle inside every window.
    facadeQuad(draw,axis,outward,u+.015,y+.025,Math.min(.085,w*.08),h-.05,'#91aff5',false);
    draw.quad([[u+w*.2,y+h*.19],[u+w*.42,y+h*.35],[u+w*.42,y+h*.94],[u+w*.2,y+h*.78]].map(([a,b])=>plane(axis,outward+.006,a,b)),axis==='front'?'#e4edff':'#f5f8ff',false);
    facadePath(draw,axis,outward,[[u+w*.5,y],[u+w*.5,y+h]],'detail');
    if(variant<0){
        if(variant===-2){
            facadeQuad(draw,axis,outward,u+w*.16,y+.05,w*.32,h*.2,'wall',false);
            facadePath(draw,axis,outward+.01,[[u+w*.16,y+.05],[u+w*.16,y+h*.2],[u+w*.34,y+h*.27],[u+w*.48,y+h*.2]],'hair');
        }
        return;
    }
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
function finishBuilding(draw) {const group=draw.finish();group.userData.windowCells=draw.windowCells||[];return group;}
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
    for(let row=0;row<FACADE_COUNTS.offices.front.rows;row++) {
        const y=1.0+row*1.43;
        for(let col=0;col<3;col++)if(row!==0||col!==1)window(draw,'front',z+d+.025,x+.55+col*1.67,y,1.04,1.05,(row+col)%3===0?-2:-1);
        for(let col=0;col<4;col++)window(draw,'side',x+w+.025,z+.44+col*1.49,y,1.0,1.05,(row+col)%3===1?-2:-1);
    }
    const entry=x+w*.37;
    facadeQuad(draw,'front',z+d+.03,entry,.04,1.6,2.2,'glass');
    facadePath(draw,'front',z+d+.05,[[entry+.8,.04],[entry+.8,2.24]],'detail');
    facadePath(draw,'front',z+d+.06,[[entry+.68,.8],[entry+.68,1.18]],'detail');
    draw.box(entry+.8,2.35,z+d+.34,1.9,.16,.85,'paper','ink');
    for(const xx of[entry-.08,entry+1.68])draw.box(xx,1.1,z+d+.63,.065,2.2,.07,'paper','detail');
    const unit=at(349,114,h),small=at(474,140,h);
    hvac(draw,unit.x,unit.z,h,1.6,1.8);hvac(draw,small.x,small.z,h,.95,1.35);
    const mast=at(355,106,h+.84);
    draw.box(mast.x,h+.84,mast.z,.32,.10,.25,'paper','detail');
    draw.path([[mast.x,h+.84,mast.z],[mast.x,h+3.14,mast.z]],'detail');
    for(const level of[.9,1.35,1.8])draw.path([[mast.x,h+.84+level,mast.z-.275],[mast.x,h+.84+level,mast.z+.275]],'detail');
    return finishBuilding(draw);
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
function displayPlant(draw,axis,side,u,y,scale=1) {
    const p=(xx,yy)=>plane(axis,side,u+xx*scale,y+yy*scale);
    draw.quad([p(-.13,0),p(.13,0),p(.16,.22),p(-.16,.22)],'paper','detail');
    draw.path([p(0,.22),p(0,1.05)],'detail');
    for(const[dx,dy,angle]of[[-.11,.43,-.65],[.11,.57,.65],[-.1,.72,-.55],[.08,.91,.35]])facadeEllipse(draw,axis,side+.008,u+dx*scale,y+dy*scale,.07*scale,.19*scale,'foliageDeep','hair',angle);
}
function shop(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/shop',materials,'shop');
    draw.box(x+w/2,(h-.2)/2,z+d/2,w,h-.2,d,'paper','ink');parapet(draw,x,z,w,d,h);
    window(draw,'front',z+d+.025,x+.25,.35,w-.5,h-.85,-1);
    displayPlant(draw,'front',z+d+.06,x+.9,.4,1.05);
    facadeQuad(draw,'side',x+w+.025,z+.18,.14,d-.36,h-.6,'glass');
    for(const u of[x+w*.34,x+w*.68])facadePath(draw,'side',x+w+.045,[[z+d*(u-x)/w,.14],[z+d*(u-x)/w,h-.46]],'detail');
    displayPlant(draw,'side',x+w+.06,z+.58,.18,.65);displayPlant(draw,'side',x+w+.06,z+d-.48,.18,.65);
    facadePath(draw,'side',x+w+.075,[[z+d*.53,.85],[z+d*.53,1.05]],'detail');
    draw.box(x+w+.29,.025,z+d*.53,.65,.03,.9,'wall','detail');
    stripedAwning(draw,'side',x+w+.025,z+.12,d-.24,h-.3,10);
    return finishBuilding(draw);
}
function home(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/home',materials,'home');
    draw.box(x+w/2,2.2,z+d/2,w,4.4,d,'paper','ink');
    for(let row=0;row<2;row++)for(let col=0;col<2;col++){
        if(row!==0||col!==1)window(draw,'front',z+d+.025,x+.36+col*1.7,.68+row*2.05,.72,1.12,-2);
        window(draw,'side',x+w+.025,z+.37+col*1.58,.68+row*2.05,.82,1.12,(row+col)%2?-2:0);
    }
    facadeQuad(draw,'front',z+d+.035,x+1.55,.03,.72,1.7,'glass');
    facadePath(draw,'front',z+d+.045,[[x+1.91,.03],[x+1.91,1.73]],'detail');
    facadeEllipse(draw,'front',z+d+.055,x+1.84,.88,.025,.04,'accent',false);
    draw.box(x+1.91,1.82,z+d+.22,1.1,.1,.6,'paper','detail');
    draw.box(x+1.91,.08,z+d+.38,1.1,.16,.65,'paper','detail');
    // Pitched front roof and a small rear roof terrace with its water tank.
    draw.quad([[x,h,z+1.15],[x+w,h,z+1.15],[x+w,4.4,z+d],[x,4.4,z+d]],'paper','ink');
    draw.box(x+w/2,h-.12,z+.57,w,.12,1.15,'paper','detail');
    for(const xx of[x,x+w])draw.path([[xx,h,z],[xx,h,z+1.15]],'detail');
    draw.path([[x,h,z],[x+w,h,z]],'ink');
    draw.box(x+.68,h+.1,z+.56,1.16,.2,1.02,'shade','detail');
    for(let i=0;i<7;i++)draw.path([[x+.15+i*.16,h+.02,z+1.08],[x+.15+i*.16,h+.23,z+1.08]],'hair');
    draw.cylinder(x+.68,h+.6,z+.56,.4,.8,'wall','detail');
    draw.cylinder(x+.68,h+1.03,z+.56,.42,.055,'paper','detail');
    draw.geometry(new THREE.SphereGeometry(.4,24,8,0,Math.PI*2,0,Math.PI/2),transform(x+.68,h+1.03,z+.56).multiply(new THREE.Matrix4().makeScale(1,.25,1)),'#ffffff',false);
    draw.cylinder(x+.68,h+1.18,z+.56,.06,.065,'paper','hair');
    draw.cylinder(x+2.7,h+.48,z+.3,.065,.95,'paper','detail');
    draw.cylinder(x+2.2,h+.35,z+.7,.23,.05,'paper','detail');
    for(const[dx,dz]of[[-.14,-.12],[.14,-.12],[0,.14]])draw.cylinder(x+2.2+dx,h+.17,z+.7+dz,.025,.32,'paper','detail');
    pot(draw,x+2.8,h,z+.85,.16);
    return finishBuilding(draw);
}
function apartments(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/apartments',materials,'apartments');
    draw.box(x+w/2,(h-.2)/2,z+d/2,w,h-.2,d,'paper','ink');parapet(draw,x,z,w,d,h);
    for(let row=0;row<3;row++){
        const y=.55+row*1.5;
        for(let col=0;col<3;col++)if(row!==0||col!==1)window(draw,'front',z+d+.025,x+.3+col*1.42,y,.8,1.08,(row+col)%3===0?-2:-1);
        for(let col=0;col<3;col++)window(draw,'side',x+w+.012,z+.34+col*1.46,y,.85,1.08,(row+col)%3===1?0:-2);
    }
    facadeQuad(draw,'front',z+d+.03,x+w/2-.42,.02,.84,1.62,'glass');
    draw.box(x+w/2,1.72,z+d+.22,1.0,.1,.6,'paper','detail');
    for(const y of[1.6,3.1]){
        const z0=z+1.58,z1=z+3.9,xx=x+w+.7;
        draw.box(x+w+.36,y,z+2.74,.74,.08,2.45,'paper','detail');
        draw.box(xx,y+.28,z+2.74,.065,.48,2.4,'wall','detail');
        draw.path([[xx,y+.05,z0],[xx,y+.63,z0],[xx,y+.63,z1],[xx,y+.05,z1]],'detail');
        for(let zz=z0+.2;zz<z1;zz+=.22)draw.path([[xx,y+.05,zz],[xx,y+.59,zz]],'hair');
        for(const zz of[z+1.9,z+2.7,z+3.45])pot(draw,x+w+.37,y+.06,zz,.14);
    }
    hvac(draw,x+1.4,z+1.4,h,1.05,.7);
    return finishBuilding(draw);
}

function cafe(materials,building) {
    const p=at(...building.roof,building.h),{w,d,h}=building,x=p.x,z=p.z;
    const draw=new Drawing('approved/cafe',materials,'cafe');
    const inside=new Drawing('approved/cafe-interior',materials,'cafe');
    draw.box(x+w/2,.12,z+d/2,w+.12,.18,d+.12,'paper','ink');
    draw.quad([[x+.08,.218,z+.08],[x+w-.08,.218,z+.08],[x+w-.08,.218,z+d-.08],[x+.08,.218,z+d-.08]],'#fff7e8',false);
    draw.box(x+w/2,3.05,z+d/2,w,.12,d,'wall',false);
    // Open storefronts, a solid upstairs shell, and glazed window reveals.
    draw.box(x+w/2,4.56,z+d/2,w,2.9,d,'paper','ink');
    for(const[col,u,width]of[[0,.35,1.85],[1,2.9,1.65]])window(draw,'front',z+d+.025,x+u,3.55,width,1.65,col);
    for(let col=0;col<2;col++)window(draw,'side',x+w+.025,z+.6+col*2.4,3.55,1.65,1.65,col+1);
    draw.box(x+w/2,1.55,z+.05,w,2.9,.1,'cream',false);
    draw.box(x+.05,1.55,z+d/2,.1,2.9,d,'cream',false);
    for(const xx of[x+.04,x+w*.32,x+w*.65,x+w-.04])draw.box(xx,1.56,z+d-.035,.09,2.85,.1,'paper','detail');
    for(const zz of[z+.04,z+d*.4,z+d*.73,z+d-.04])draw.box(x+w-.035,1.56,zz,.1,2.85,.09,'paper','detail');
    stripedAwning(draw,'front',z+d+.03,x-.02,w+.04,3.1,14);
    stripedAwning(draw,'side',x+w+.03,z-.02,d+.04,3.1,13);
    parapet(draw,x,z,w,d,h);
    const service=at(748,544,h);hvac(draw,service.x,service.z,h,1.2,1.3);
    // Counter equipment is close to the street-facing glass, visible at the approved elevation.
    inside.box(x+w-1.2,1.45,z+d/2,.055,2.6,d-.25,'cream',false);
    const machine=at(807,742,1.48),mx=machine.x-.8,mz=machine.z-.4;
    inside.box(mx-.12,.28,mz+.32,.9,.5,2.35,'wall','detail');
    inside.box(mx-.12,.57,mz+.32,1.0,.09,2.48,'paper','ink');
    for(let i=0;i<16;i++)inside.path([[mx+.345,.05,mz-.78+i*.145],[mx+.345,.52,mz-.78+i*.145]],'hair');
    inside.box(mx,.86,mz,.64,.52,1.3,'wall','detail');
    inside.box(mx,1.15,mz,.74,.07,1.42,'paper','detail');
    inside.box(mx+.09,.60,mz,.82,.06,1.46,'paper','detail');
    for(const zz of[mz-.35,mz+.35]){
        inside.geometry(new THREE.CylinderGeometry(.07,.07,.12,16),transform(mx+.37,.86,zz,0,0,Math.PI/2),'shade','detail');
        inside.path([[mx+.42,.81,zz],[mx+.55,.69,zz],[mx+.66,.69,zz]],'detail');
        inside.cylinder(mx+.55,.65,zz,.06,.09,'paper','detail');
    }
    for(const zz of[mz-.43,mz,mz+.43])inside.cylinder(mx,1.24,zz,.065,.12,'paper','detail');
    const bar=at(755,782,.65);bar.x-=.43;inside.box(bar.x,.65,bar.z,.8,1.05,.9,'wall','detail');
    inside.box(bar.x,1.21,bar.z,.92,.07,1.02,'paper','detail');
    for(let i=0;i<7;i++)inside.path([[bar.x+.405,.15,bar.z-.36+i*.12],[bar.x+.405,1.15,bar.z-.36+i*.12]],'hair');
    const barista=at(754,752,1.52);staticFigure(inside,barista.x-.15,.14,barista.z,Math.PI/2,false);
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
    for(const zz of[z+.7,z+2.0,z+3.3]){
        inside.path([[x+w-.2,2.98,zz],[x+w-.2,2.1,zz]],'detail');
        inside.geometry(new THREE.ConeGeometry(.14,.17,20),transform(x+w-.2,2.0,zz),'shade','detail');
    }
    facadePath(draw,'front',z+d+.055,[[x+w-.5,.92],[x+w-.5,1.19]],'detail');
    const group=finishBuilding(draw),interior=outlinedPart(inside,{...materials,silhouette:materials.interiorOutline});
    interior.traverse(object=>{if(object.material===materials.interiorOutline)object.userData.ownedMaterial=true;});
    group.add(interior);
    const pane=new THREE.BufferGeometry();
    const faces=[[[x+.08,.2,z+d+.012],[x+w-.08,.2,z+d+.012],[x+w-.08,3.0,z+d+.012],[x+.08,3.0,z+d+.012]],[[x+w+.012,.2,z+.08],[x+w+.012,.2,z+d-.08],[x+w+.012,3.0,z+d-.08],[x+w+.012,3.0,z+.08]]];
    pane.setAttribute('position',new THREE.Float32BufferAttribute(faces.flatMap(points=>[0,1,2,0,2,3].flatMap(i=>points[i])),3));
    const glazing=new THREE.MeshBasicMaterial({color:'#e4edff',opacity:.07,transparent:true,depthWrite:false,side:THREE.DoubleSide});
    const glass=new THREE.Mesh(pane,glazing);glass.name='approved/cafe-glazing';glass.userData.ownedMaterial=true;group.add(glass);
    return group;
}

function floorPolygon(draw,pixels,y,tint) {
    const shape=new THREE.Shape(),points=pixels.map(([px,py])=>{const p=at(px,py,y);return new THREE.Vector2(p.x,-p.z);});
    const corners=points.map((p,i)=>{
        const previous=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
        const distance=Math.min(.45,p.distanceTo(previous)*.3,p.distanceTo(next)*.3);
        return {p,before:p.clone().add(previous.clone().sub(p).normalize().multiplyScalar(distance)),after:p.clone().add(next.clone().sub(p).normalize().multiplyScalar(distance))};
    });
    shape.moveTo(corners[0].after.x,corners[0].after.y);
    for(let i=1;i<=corners.length;i++){const c=corners[i%corners.length];shape.lineTo(c.before.x,c.before.y);shape.quadraticCurveTo(c.p.x,c.p.y,c.after.x,c.after.y);}
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
    for(const spec of CROSSWALKS)for(let i=0;i<spec.count;i++){
        const pixels=spec.corners.map(([x,y])=>[x+(i-spec.referenceIndex)*spec.step[0],y+(i-spec.referenceIndex)*spec.step[1]]);
        draw.quad(pixels.map(([x,y])=>at(x,y,-.052).toArray()),'paper',false);
    }
    for(const[from,to]of[[[329,784],[413,737]],[[996,765],[1057,801]]]){
        const dx=to[0]-from[0],dy=to[1]-from[1],len=Math.hypot(dx,dy),nx=-dy/len*2.5,ny=dx/len*2.5;
        draw.quad([[from[0]+nx,from[1]+ny],[to[0]+nx,to[1]+ny],[to[0]-nx,to[1]-ny],[from[0]-nx,from[1]-ny]].map(([x,y])=>at(x,y,-.052).toArray()),'paper',false);
    }
    for(const spec of DRAINS){
        const p=at(...spec.center,.01);draw.box(p.x,.01,p.z,.65,.018,.34,'soil','detail');
        for(let i=0;i<5;i++)draw.box(p.x-.26+i*.13,.026,p.z,.027,.006,.26,'wall',false);
    }
    return draw.finish();
}

function leafGeometry(draw,point,direction,length,width,tint='foliageDeep') {
    const axis=new THREE.Vector3(...direction).normalize();
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
    const center=new THREE.Vector3(...point).addScaledVector(axis,length*.45);
    const geometry=new THREE.SphereGeometry(1,8,5);
    draw.geometry(geometry,new THREE.Matrix4().compose(center,rotation,new THREE.Vector3(width,length*.5,width*.27)),tint,false);
}
function floweringPlanter(props,foliage,flowers,spec) {
    const h=.55,p=at(...spec.rim,h),{w,d}=spec,x=p.x,z=p.z;
    props.box(x,h/2,z,w,h,d,'paper','detail');
    props.box(x,h+.015,z,w+.055,.055,d+.055,'paper',false);
    props.path([[x-w/2-.028,h+.045,z-d/2-.028],[x+w/2+.028,h+.045,z-d/2-.028],[x+w/2+.028,h+.045,z+d/2+.028],[x-w/2-.028,h+.045,z+d/2+.028]],'detail',true);
    props.box(x,h+.046,z,w-.1,.02,d-.1,'soil',false);
    // One smooth, opaque crown supplies the flower-bank silhouette. Separate
    // leaf marks carry its detail; no individual petal cages or extrusion ribs.
    const tall=spec.tall?1.45:1,front=z+d*.44,centerY=h+.3*tall;
    flowers.geometry(new THREE.SphereGeometry(1,24,12),transform(x,h+.17,z).multiply(new THREE.Matrix4().makeScale(w*.45,.18*tall,d*.4)),'#9fbacd',false);
    const count=spec.clouds*2+1,blobs=[{x:0,y:-.055,z:0,rx:w*.41,ry:.13*tall,rz:d*.32}];
    for(let i=0;i<count;i++)blobs.push({x:-w*.34+w*.68*i/(count-1),y:.015+.035*Math.sin(i*2.1),z:Math.sin(i*2.4)*d*.12,rx:w/count*.56,ry:(.19+.025*Math.cos(i*1.7))*tall,rz:d*.34});
    const density=(xx,yy,zz)=>blobs.reduce((sum,b)=>sum+Math.exp(-3*((xx-b.x)**2/b.rx**2+(yy-b.y)**2/b.ry**2+(zz-b.z)**2/b.rz**2)),0);
    const crown=new THREE.SphereGeometry(1,48,18),positions=crown.attributes.position;
    for(let i=0;i<positions.count;i++){
        const dx=positions.getX(i),dy=positions.getY(i),dz=positions.getZ(i);
        let low=0,high=Math.max(w,d,1)*1.5;
        for(let j=0;j<18;j++){const r=(low+high)/2;if(density(dx*r,dy*r,dz*r)>.105)low=r;else high=r;}
        const r=(low+high)/2;positions.setXYZ(i,dx*r,dy*r,dz*r);
    }
    crown.computeVertexNormals();foliage.geometry(crown,transform(x,centerY,z),'flower',false);
    for(let i=0;i<spec.clouds+1;i++){
        const xx=-w*.31+w*.62*i/spec.clouds,n=new THREE.Vector3(.45,.75,.45).normalize();
        let low=0,high=1;
        for(let j=0;j<16;j++){const r=(low+high)/2;if(density(xx+n.x*r,n.y*r,n.z*r)>.105)low=r;else high=r;}
        const r=(low+high)/2+.027;
        flowers.geometry(new THREE.OctahedronGeometry(.038+(i%2)*.008,0),transform(x+xx+n.x*r,centerY+n.y*r,z+n.z*r),'#7e9edb',false);
    }
    for(let i=0;i<spec.clouds+2;i++){
        const xx=x-w*.33+w*.66*i/(spec.clouds+1),side=i%2?1:-1,base=[xx,h+.06,front+.036];
        leafGeometry(flowers,base,[side*.25,1,.01],.4*tall,.065,'#94b0ca');
        leafGeometry(flowers,base,[side*.6,.8,.01],.23*tall,.055,'#b5cce2');
    }
    return p;
}

function parkBench(draw,spec) {
    const verticalScale=.72,p0=at(...spec.seat,.55*verticalScale),m=transform(p0.x,0,p0.z,0,spec.heading).multiply(new THREE.Matrix4().makeScale(1,verticalScale,1)),length=spec.length;
    const p=(xx,y,zz)=>new THREE.Vector3(xx,y,zz).applyMatrix4(m).toArray();
    // Separate real slats share one outer contour and one line per gap. Drawing
    // every box edge here made a tiny bench look like a stack of wire frames.
    for(let i=0;i<4;i++)draw.geometry(new THREE.BoxGeometry(length,.065,.11),m.clone().multiply(transform(0,.55,-.225+i*.15)),'paper',false);
    for(let i=0;i<3;i++)draw.geometry(new THREE.BoxGeometry(length,.12,.065),m.clone().multiply(transform(0,.65+i*.15,.28)),'paper',false);
    draw.path([p(-length/2,.584,-.28),p(length/2,.584,-.28),p(length/2,.584,.28),p(-length/2,.584,.28)],'detail',true);
    for(const zz of[-.15,0,.15])draw.path([p(-length/2,.584,zz),p(length/2,.584,zz)],'detail');
    draw.path([p(-length/2,.59,.238),p(length/2,.59,.238),p(length/2,1.01,.238),p(-length/2,1.01,.238)],'detail',true);
    for(const yy of[.725,.875])draw.path([p(-length/2,yy,.238),p(length/2,yy,.238)],'detail');
    for(const xx of[-length*.39,length*.39]){
        for(const[zz,height]of[[-.24,.56],[.28,1.02]]){
            draw.geometry(new THREE.BoxGeometry(.085,height,.085),m.clone().multiply(transform(xx,height/2,zz)),'#99b7f9',false);
            draw.path([p(xx-.043,0,zz-.05),p(xx+.043,0,zz-.05),p(xx+.043,height,zz-.05),p(xx-.043,height,zz-.05)],'detail',true);
        }
        draw.path([p(xx,.46,-.24),p(xx,.46,.28)],'detail');
    }
    return p0;
}

function surfacePatch(draw,p,r,length,center,sy,yOffset,height,width) {
    const radius=width/2,straight=Math.max(0,height-2*radius),vertices=[];
    const point=(row,column)=>{
        const yy=-height/2+height*row/16,cap=Math.max(0,Math.abs(yy)-straight/2);
        const half=Math.sqrt(Math.max(0,radius*radius-cap*cap));
        const side=r*.4+(column/6*2-1)*half,y=yy+yOffset,dy=Math.max(0,Math.abs(y/sy)-length/2);
        const depth=Math.sqrt(Math.max(.001,r*r-dy*dy-side*side))+.018;
        return[p.x+(side+depth)*Math.SQRT1_2,center+y,p.z+(depth-side)*Math.SQRT1_2];
    };
    for(let row=0;row<16;row++)for(let col=0;col<6;col++){
        const a=point(row,col),b=point(row,col+1),c=point(row+1,col+1),d=point(row+1,col);
        vertices.push(...a,...b,...c,...a,...c,...d);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    draw.geometry(geometry,new THREE.Matrix4(),'#ffffff',false);
}

function capsuleTree(foliage,highlights,trunks,spec) {
    const p=at(...spec.foot),r=spec.width/2/PIXELS_PER_UNIT;
    const length=(spec.height-spec.width)/REFERENCE.unit,center=(spec.foot[1]-spec.centerY)/REFERENCE.unit;
    foliage.geometry(new THREE.CapsuleGeometry(r,Math.max(.01,length),8,24),transform(p.x,center,p.z),'leaf',false);
    trunks.cylinder(p.x,center/2,p.z,.065,center,'trunk',false);
    const scale=r/.71;
    surfacePatch(highlights,p,r,length,center,1,length*.27+.12,.95*scale,.26*scale);
    surfacePatch(highlights,p,r,length,center,1,-length*.25-.1,.52*scale,.26*scale);
    return p;
}
function conifer(foliage,props,trunks,spec) {
    const p=at(...spec.foot),height=(spec.foot[1]-spec.tipY)/REFERENCE.unit,r=spec.width/2/PIXELS_PER_UNIT;
    trunks.cylinder(p.x,height*.26,p.z,.073,height*.52,'trunk',false);
    for(const[base,h,ratio]of[[.43,.38,1],[.59,.34,.79],[.77,.23,.6]]){
        const radius=r*ratio,tall=height*h,y=height*base;
        const profile=[[0,-.018],[radius*.98,-.018],[radius,0],[radius*.75,tall*.25],[radius*.5,tall*.5],[radius*.25,tall*.75],[0,tall]];
        const geometry=new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),32);
        foliage.geometry(geometry,transform(p.x,y,p.z),'conifer',false);
        // The closed tier already supplies its brim silhouette. Another full
        // ring doubled that boundary and made the canopy look like wire loops.
    }
    return p;
}
function roundTree(foliage,highlights,trunks,spec) {
    const p=at(...spec.foot),r=spec.width/2/PIXELS_PER_UNIT,center=(spec.foot[1]-spec.centerY)/REFERENCE.unit;
    const ratio=spec.height/spec.width,sy=Math.sqrt((ratio*ratio-1/3)/(2/3));
    const matrix=transform(p.x,center,p.z).multiply(new THREE.Matrix4().makeScale(1,sy,1));
    foliage.geometry(new THREE.SphereGeometry(r,24,16),matrix,'leaf',false);
    trunks.cylinder(p.x,center/2,p.z,.065,center,'trunk',false);
    surfacePatch(highlights,p,r,0,center,sy,r*.35,r*.34,r*.28);
    surfacePatch(highlights,p,r,0,center,sy,-r*.36,r*.29,r*.26);
    return p;
}
function referencePerson(draw,x,y,z,heading=0,seated=false) {
    const start=draw.vertices.length;staticFigure(draw,x,y,z,heading,seated);
    const scale=1.12;
    for(let i=start;i<draw.vertices.length;i+=3){draw.vertices[i]=x+(draw.vertices[i]-x)*scale;draw.vertices[i+1]=y+(draw.vertices[i+1]-y)*scale;draw.vertices[i+2]=z+(draw.vertices[i+2]-z)*scale;}
}
function cafeTable(draw,figures,spec) {
    const top=1.03,p=at(...spec.top,top),x=p.x,z=p.z;
    draw.cylinder(x,top-.035,z,.61,.07,'paper','ink');
    draw.cylinder(x,.48,z,.05,.96,'wall','detail');
    for(const angle of[0,Math.PI*2/3,Math.PI*4/3])draw.path([[x,.25,z],[x+Math.cos(angle)*.4,0,z+Math.sin(angle)*.4]],'detail');
    for(let i=0;i<3;i++){
        const angle=spec.rotation+(i===0?Math.PI/2:i===1?-Math.PI/2:Math.PI);
        const xx=x+Math.sin(angle)*.78,zz=z+Math.cos(angle)*.78;
        chair(draw,xx,zz,angle,0);
        // Resolved chair-back slats replace the former single loose arc.
        const m=transform(xx,0,zz,0,angle);
        for(const h of[.68,.79])draw.path([[-.2,h,.2],[.2,h,.2]].map(v=>new THREE.Vector3(...v).applyMatrix4(m).toArray()),'detail');
        if(i<spec.guests)referencePerson(figures,xx,.05,zz,angle,true);
    }
    return p;
}

function hatchback(materials,name) {
    const draw=new Drawing(name,materials,'cars');
    const profile=[[-.88,.24],[-.88,.7],[-.68,.97],[.25,.97],[.56,.6],[.86,.52],[.89,.43],[.89,.24]];
    const shape=new THREE.Shape(profile.map(([x,y])=>new THREE.Vector2(x,y)));
    draw.geometry(new THREE.ExtrudeGeometry(shape,{depth:.88,bevelEnabled:false}),transform(0,0,-.44),'paper','ink');
    for(const z of[-.447,.447]){
        draw.quad([[-.77,.61,z],[-.61,.91,z],[-.22,.91,z],[-.22,.59,z]],'glass','detail');
        draw.quad([[-.15,.59,z],[-.15,.91,z],[.20,.91,z],[.48,.59,z]],'glass','detail');
        draw.path([[-.185,.24,z],[-.185,.58,z]],'detail');
        draw.path([[.12,.5,z],[.27,.5,z]],'hair');
    }
    draw.quad([[.29,.94,-.39],[.53,.63,-.39],[.53,.63,.39],[.29,.94,.39]],'glass','detail');
    draw.quad([[-.85,.7,-.37],[-.65,.94,-.37],[-.65,.94,.37],[-.85,.7,.37]],'glass','detail');
    for(const x of[-.58,.58])for(const z of[-.47,.47]){
        draw.geometry(new THREE.CylinderGeometry(.17,.17,.1,24),transform(x,.22,z,Math.PI/2),'accent','detail');
        draw.geometry(new THREE.CylinderGeometry(.095,.095,.105,20),transform(x,.22,z+(z>0?.012:-.012),Math.PI/2),'paper','detail');
    }
    draw.box(.902,.3,0,.03,.075,.77,'paper','detail');
    for(const z of[-.29,.29])draw.box(.905,.45,z,.035,.12,.18,'paper','detail');
    draw.path([[.925,.4,-.15],[.925,.4,.15]],'detail');
    draw.path([[.925,.35,-.15],[.925,.35,.15]],'hair');
    draw.box(.925,.29,0,.018,.06,.23,'glass','hair');
    return draw.finish();
}

export function createApprovedNeighborhood() {
    const materials=createIllustrationMaterials({...PALETTE,ink:'#285aff',detail:'#4775eb',hair:'#adc4ef',profile:'#7e9fe5',accent:'#315bff',wall:'#c7d7ff',shade:'#8cabff',leaf:'#dce6ff',road:'#d6e1ff',glass:'#b9cfff',soil:'#96b2cc',foliageDeep:'#9bb9cd',flower:'#f8fbff',cream:'#fff3d9',trunk:'#87a6f1'});
    materials.palette.conifer='#d1ddff';
    const plantingOutline=materials.silhouette.clone();
    plantingOutline.uniforms.ink.value.set('#4d7bdb');
    materials.interiorOutline=materials.silhouette.clone();
    materials.interiorOutline.uniforms.ink.value.set('#7c9fe5');
    const scene=new THREE.Group();scene.name='approved-corner/neighborhood';
    const anchors={},bounds={},features={};
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
    const benches=new Drawing('approved/park-benches',materials,'garden');
    const foliage=new Drawing('approved/planting',materials);
    const shrubs=new Drawing('approved/shrub-crowns',materials);
    const trunks=new Drawing('approved/tree-trunks',materials);
    const flowers=new Drawing('approved/flower-centers',materials,'flowers');
    const highlights=new Drawing('approved/tree-highlights',materials);
    const figures=new Drawing('approved/people',materials);
    const add=(spec,kind,p)=>features[spec.id]={kind,point:p.toArray()};
    for(const spec of CAPSULE_TREES)add(spec,'capsule-tree',capsuleTree(foliage,highlights,trunks,spec));
    for(const spec of CONIFERS)add(spec,'conifer',conifer(foliage,props,trunks,spec));
    for(const spec of ROUND_TREES)add(spec,'round-tree',roundTree(foliage,highlights,trunks,spec));
    for(const spec of BENCHES)add(spec,'bench',parkBench(benches,spec));
    for(const spec of TABLES)add(spec,'table',cafeTable(props,figures,spec));
    for(const spec of PLANTERS)add(spec,'planter',floweringPlanter(props,shrubs,flowers,spec));
    for(const[px,py]of[[694,826],[871,720]]){
        const p=at(px,py,.25);pot(props,p.x,0,p.z,.25);
        for(let i=0;i<9;i++){const angle=i*2.4;leafGeometry(foliage,[p.x,.32,p.z],[Math.cos(angle)*.35,1,Math.sin(angle)*.35],.65+i%3*.14,.07);}
    }
    for(const spec of LAMPS){
        const p=at(...spec.foot),height=(spec.foot[1]-spec.capY)/32;
        trunks.cylinder(p.x,height/2,p.z,.043,height,'paper',false);
        props.cylinder(p.x,height,p.z,.18,.075,'paper','detail');props.ring(p.x,height+.04,p.z,.15,'detail');
        props.cylinder(p.x,.045,p.z,.10,.09,'paper','detail');add(spec,'lamp',p);
    }
    for(const spec of BOLLARDS){
        const p=at(...spec.foot);trunks.cylinder(p.x,spec.height/2,p.z,.052,spec.height,'paper',false);
        props.cylinder(p.x,spec.height,p.z,.065,.065,'paper','detail');props.cylinder(p.x,.045,p.z,.09,.09,'paper','detail');add(spec,'bollard',p);
    }
    const bin=at(357,644);trunks.cylinder(bin.x,.31,bin.z,.2,.62,'wall',false);props.ring(bin.x,.63,bin.z,.19,'detail');
    const board=at(683,892);
    props.quad([[board.x-.325,.12,board.z+.2],[board.x+.325,.12,board.z+.2],[board.x+.325,1.15,board.z],[board.x-.325,1.15,board.z]],'shade','detail');
    props.path([[board.x-.24,0,board.z+.25],[board.x-.24,1.08,board.z],[board.x-.24,0,board.z-.24]],'detail');
    props.path([[board.x+.24,0,board.z+.25],[board.x+.24,1.08,board.z],[board.x+.24,0,board.z-.24]],'detail');
    for(const spec of STANDING_PEOPLE){const p=at(...spec.foot);referencePerson(figures,p.x,0,p.z,0,false);add(spec,'person',p);}
    const shrubGroup=outlinedPart(shrubs,{...materials,silhouette:plantingOutline});
    shrubGroup.traverse(object=>{if(object.material===plantingOutline)object.userData.ownedMaterial=true;});
    scene.add(props.finish(),benches.finish(),outlinedPart(foliage,materials),shrubGroup,outlinedPart(trunks,materials),flowers.finish(),highlights.finish(),outlinedPart(figures,materials));
    materials.line('detail','garden').userData.widthFactor=1.3;
    const cars=[];
    for(const[index,spec]of CARS.entries()){
        const car=hatchback(materials,`approved/car-${index+1}`),p=at(...spec.foot);car.scale.setScalar(1.5);car.position.set(p.x,-.1,p.z);car.rotation.y=spec.yaw;scene.add(car);cars.push(car);add(spec,'car',p);
    }
    const lineMaterials=new Map();
    scene.traverse(object=>{if(object.isLineSegments2)lineMaterials.set(object.material,object.name.split('/').at(-1));});
    const baseResize=materials.resize.bind(materials);
    materials.resize=(w,h,span,zoom=1)=>{
        baseResize(w,h,span,zoom);
        const scale=h/span*zoom/PIXELS_PER_UNIT;
        for(const[material,weight]of lineMaterials){
            material.linewidth=Math.max(({ink:.6,detail:.3,hair:.18,profile:.2}[weight]||.3),({ink:2.25,detail:1.35,hair:.6,profile:.8}[weight]||1)*scale*(material.userData.widthFactor||1));
            material.opacity=weight==='hair'?.75*THREE.MathUtils.smoothstep(scale,.25,.8):weight==='profile'?THREE.MathUtils.smoothstep(scale,.4,.8):1;
            material.visible=material.opacity>.002;
        }
        materials.silhouette.uniforms.width.value=2.0/PIXELS_PER_UNIT;
        plantingOutline.uniforms.width.value=1.65/PIXELS_PER_UNIT;
        materials.interiorOutline.uniforms.width.value=.85/PIXELS_PER_UNIT;
    };
    scene.updateMatrixWorld(true);
    return{scene,anchors,bounds,cars,materials,features,
        dispose(){const geometries=new Set(),owned=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.userData.ownedMaterial)owned.add(o.material);});for(const g of geometries)g.dispose();for(const m of owned)m.dispose();materials.dispose();}
    };
}
