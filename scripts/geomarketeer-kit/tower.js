import * as THREE from '../../assets/vendor/three/three.module.js';
import { KitDrawing } from './style.js';

export const TOWER = Object.freeze({
    id:'residential-tower', variant:'standard', revision:1, width:3, depth:3.65,
    floors:8, floorHeight:.92, baseHeight:.14, wallHeight:7.50,
    parapetHeight:.18, roofWidth:1.08, roofDepth:1.14, roofHeight:.82,
});

function window(draw, u, y, width = .29, height = .56) {
    draw.box(u, y + height / 2, .012, width, height, .025, '#8cb0ff', 'detail');
    draw.quad([[u-width/2+.025,y+.025,.029],[u+width/2-.02,y+.025,.029],[u+width/2-.02,y+height-.02,.029],[u-width/2+.025,y+height-.02,.029]], '#adc8ff', false);
    draw.quad([[u-width*.30,y+.05,.031],[u-width*.13,y+.05,.031],[u+width*.08,y+height-.06,.031],[u-width*.08,y+height-.06,.031]], '#f5f8ff', false);
    draw.path([[u,y+.02,.034],[u,y+height-.02,.034]], 'hair');
    draw.box(u,y-.012,.035,width+.045,.025,.07,'paper',false);
}

function makeBalcony(materials) {
    const draw = new KitDrawing('tower/balcony', materials, 'tower');
    const w=.86, d=.36, rail=.29;
    draw.box(0,.025,d/2,w,.05,d,'paper','detail');
    // Doors stay behind the railing. All rails and posts have actual volume.
    window(draw,0,.09,.46,.61);
    for (const x of [-w/2+.025,w/2-.025]) {
        draw.box(x,rail/2+.05,d-.025,.026,rail,.026,'shade',false);
        draw.box(x,rail+.045,d/2,.026,.026,d,'paper','detail');
    }
    draw.box(0,rail+.045,d-.025,w,.026,.026,'paper','detail');
    draw.box(0,.115,d-.025,w,.115,.025,'#bed2ff','detail');
    for(const x of[-w/2+.025,w/2-.025])draw.box(x,.115,d/2,.025,.115,d,'#d5e2ff','detail');
    draw.box(0,.105,d-.025,w,.025,.025,'shade','hair');
    for(let i=0;i<7;i++)draw.box(-w/2+.055+i*(w-.11)/6,.20,d-.025,.022,.23,.022,'#6992ff',false);
    for(const x of[-w/2+.025,w/2-.025])for(const z of[.10,.22])draw.box(x,.20,z,.022,.23,.022,'#6992ff',false);
    return draw.finish();
}

function makeFloor(materials, {ground=false, balcony=false, width=3,front=false}={}) {
    const draw = new KitDrawing(`tower/${ground?'ground':'upper'}-facade`,materials,'tower');
    let windows=0;
    for (const u of [-width*.32,0,width*.32]) {
        if (balcony && u > 0) continue;
        if (front && !ground && u===0) continue;
        if (ground && u===0) {
            draw.box(0,.39,.025,.39,.76,.05,'shade','detail');
            draw.quad([[-.16,.04,.055],[.16,.04,.055],[.16,.72,.055],[-.16,.72,.055]],'#c8dcff',false);
            draw.path([[0,.04,.06],[0,.73,.06]],'detail');
            draw.path([[.06,.32,.065],[.06,.42,.065]],'hair');
            draw.box(0,.8,.15,.58,.055,.32,'paper','detail');
            draw.box(0,-.09,.15,.58,.10,.34,'paper','detail');
        } else {window(draw,u,.22);windows++;}
    }
    const group=draw.finish();group.userData.windows=windows;
    return group;
}

function makeRoof(materials) {
    const {width:w,depth:d,wallHeight:y,parapetHeight:h,roofWidth:rw,roofDepth:rd,roofHeight:rh}=TOWER;
    const draw=new KitDrawing('tower/roof',materials,'tower');
    draw.box(0,y+.015,0,w+.10,.055,d+.10,'paper','ink');
    for(const z of[-d/2,d/2])draw.box(0,y+h/2,z,w+.10,h,.075,'paper',false);
    for(const x of[-w/2,w/2])draw.box(x,y+h/2,0,.075,h,d,'paper',false);
    draw.path([[-w/2-.05,y+h,-d/2-.05],[w/2+.05,y+h,-d/2-.05],[w/2+.05,y+h,d/2+.05],[-w/2-.05,y+h,d/2+.05]],'ink',true);
    draw.path([[-w/2+.055,y+h,-d/2+.055],[w/2-.055,y+h,-d/2+.055],[w/2-.055,y+h,d/2-.055],[-w/2+.055,y+h,d/2-.055]],'detail',true);
    draw.box(-.08,y+rh/2+.035,-.16,rw,rh,rd,'paper','ink');
    // One inset access door and one narrow window on the shared rooftop enclosure.
    const front=new KitDrawing('tower/rooftop-front',materials,'tower');
    window(front,-.20,y+.12,.23,.48);
    const frontGroup=front.finish();frontGroup.position.z=-.16+rd/2+.002;
    const side=new KitDrawing('tower/rooftop-side',materials,'tower');
    window(side,.12,y+.18,.24,.36);
    const sideGroup=side.finish();sideGroup.rotation.y=Math.PI/2;sideGroup.position.x=-.08+rw/2+.002;sideGroup.position.z=-.16;
    const group=draw.finish();group.add(frontGroup,sideGroup);return group;
}

export function buildTower(materials) {
    const {width:w,depth:d,wallHeight:h,floors,floorHeight,baseHeight}=TOWER;
    const group=new THREE.Group();group.name='residential-tower/standard';
    const shell=new KitDrawing('tower/shell',materials,'tower');
    shell.box(0,h/2,0,w,h,d,'paper','ink');
    shell.box(0,.045,0,w+.08,.09,d+.08,'paper','detail');
    group.add(shell.finish());
    const balcony=makeBalcony(materials);
    let windows=0;
    for(const [side,width,rotation,x,z,withBalcony] of [
        ['front',w,0,0,d/2+.005,true],
        ['right',d,Math.PI/2,w/2+.005,0,true],
        ['back',w,Math.PI,0,-d/2-.005,false],
        ['left',d,-Math.PI/2,-w/2-.005,0,false],
    ]) {
        const facade=new THREE.Group();facade.name=`tower/facade-${side}`;
        facade.position.set(x,baseHeight,z);facade.rotation.y=rotation;
        const upper=makeFloor(materials,{width,balcony:withBalcony,front:side==='front'});
        const ground=makeFloor(materials,{ground:side==='front',width,balcony:withBalcony,front:side==='front'});
        for(let floor=0;floor<floors;floor++) {
            const level=new THREE.Group();level.name=`tower/${side}/floor-${floor+1}`;level.position.y=floor*floorHeight;
            const face=(floor===0?ground:upper).clone(true);level.add(face);windows+=face.userData.windows;
            if(withBalcony){const b=balcony.clone(true);b.position.x=width*.32;b.name=`tower/${side}/balcony-${floor+1}`;level.add(b);windows++;}
            facade.add(level);
        }
        group.add(facade);
    }
    group.add(makeRoof(materials));
    group.userData={assetId:TOWER.id,variantId:TOWER.variant,revision:TOWER.revision,floors,balconies:floors*2,windows:windows+2,approval:'approved'};
    group.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(group);
    return {group,bounds,anchors:{ground:new THREE.Vector3(),entrance:new THREE.Vector3(0,0,d/2+.3),roof:new THREE.Vector3(0,h,0)}};
}
