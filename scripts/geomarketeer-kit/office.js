import * as THREE from '../../assets/vendor/three/three.module.js';
import { KitDrawing } from './style.js';

export const OFFICE_BASE=Object.freeze({id:'office',revision:1,baseHeight:.08,windowPitch:.49,windowHeight:.59,windowSill:.30,wallThickness:.10,parapetHeight:.15,canopyDepth:.42});
export const OFFICE_VARIANTS=Object.freeze([
    {id:'base',number:'01',label:'Base office',subtitle:'Four storeys · paired side windows',width:3.6,depth:3.2,floors:4,groundHeight:1.18,floorHeight:1.10,sideWindows:'paired',entryFace:'front',entryWidth:2.18,entryCenter:-.22,roofService:'small',vent:false,referenceCrop:[946,106,171,228],sourceId:'office-central-01',referenceLabel:'Central office building',difference:'The shared base: ribbon windows on the street façade, paired windows on the sides, a glazed entrance and a small rooftop enclosure.'},
    {id:'wide',number:'02',label:'Wide office',subtitle:'Broader footprint · continuous bands',width:4.3,depth:4.8,floors:4,groundHeight:1.24,floorHeight:1.18,sideWindows:'band',entryFace:'front',entryWidth:2.20,entryCenter:-.55,roofService:'large',vent:true,referenceCrop:[1106,137,211,277],sourceId:'office-east-01',referenceLabel:'Eastern office building',difference:'A wider, deeper and slightly taller version with continuous window bands, an offset entrance, and a larger rooftop enclosure with a vent.'},
    {id:'low-wing',number:'03',label:'Low office wing',subtitle:'Three storeys · compact footprint',width:2.8,depth:3.1,floors:3,groundHeight:1.18,floorHeight:1.10,sideWindows:'band',entryFace:'right',entryWidth:1.16,entryCenter:0,roofService:'none',vent:false,referenceCrop:[892,114,105,180],sourceId:'office-west-wing-01',referenceLabel:'Partly hidden rear office wing',difference:'The lower rear wing uses the same window bays and parapet. Its visible street façade keeps uninterrupted bands. An entrance on the obscured side and the other hidden details are inferred from the shared system.'},
].map(spec=>Object.freeze(spec)));

function windowBay(materials){
    const draw=new KitDrawing('office/window-bay',materials,'office'),w=OFFICE_BASE.windowPitch,h=OFFICE_BASE.windowHeight;
    draw.box(0,h/2,.015,w,h,.035,'#9dbfff',false);
    draw.quad([[-w/2+.023,.023,.035],[w/2-.023,.023,.035],[w/2-.023,h-.023,.035],[-w/2+.023,h-.023,.035]],'#a6c6ff',false);
    draw.quad([[-w*.32,.035,.038],[-w*.20,.035,.038],[-w*.08,h-.035,.038],[-w*.20,h-.035,.038]],'#dfeaff',false);
    draw.box(-w/2+.008,h/2,.044,.016,h,.020,'#7198f0',false);
    draw.box(w/2-.008,h/2,.044,.016,h,.020,'#7198f0',false);
    draw.path([[-w/2,0,.056],[w/2,0,.056],[w/2,h,.056],[-w/2,h,.056]],'detail',true);
    return draw.finish();
}

function windowRow(master,{width,paired=false,ground=false,entryWidth=0,entryCenter=0}){
    const group=new THREE.Group();group.name='office/window-row';
    const pitch=OFFICE_BASE.windowPitch,centers=[];
    if(paired){
        const pairCenter=width*.27;
        for(const c of[-pairCenter,pairCenter])for(const s of[-.5,.5])centers.push(c+s*pitch);
    }else{
        const count=Math.floor((width-.22)/pitch);
        for(let i=0;i<count;i++)centers.push((i-(count-1)/2)*pitch);
    }
    for(const [i,x]of centers.entries()){
        if(ground&&x+pitch/2>entryCenter-entryWidth/2-.055&&x-pitch/2<entryCenter+entryWidth/2+.055)continue;
        const cell=master.clone(true);cell.name=`office/window-bay-${i}`;cell.position.x=x;group.add(cell);
    }
    return group;
}

function roof(materials,spec,height){
    const {width:w,depth:d}=spec,h=OFFICE_BASE.parapetHeight;
    const draw=new KitDrawing('office/shared-roof',materials,'office');
    draw.box(0,height+.015,0,w+.10,.07,d+.10,'paper','ink');
    for(const z of[-d/2,d/2])draw.box(0,height+h/2+.03,z,w+.10,h,.065,'paper',false);
    for(const x of[-w/2,w/2])draw.box(x,height+h/2+.03,0,.065,h,d,'paper',false);
    const y=height+h+.03;
    draw.path([[-w/2-.05,y,-d/2-.05],[w/2+.05,y,-d/2-.05],[w/2+.05,y,d/2+.05],[-w/2-.05,y,d/2+.05]],'ink',true);
    draw.path([[-w/2+.045,y,-d/2+.045],[w/2-.045,y,-d/2+.045],[w/2-.045,y,d/2-.045],[-w/2+.045,y,d/2-.045]],'detail',true);
    const group=draw.finish();
    if(spec.roofService!=='none'){
        const large=spec.roofService==='large',rw=large?1.52:1.04,rd=large?1.02:.85,rh=large?.68:.52,rx=-.20,rz=-.20,base=height+.05;
        const service=new KitDrawing('office/rooftop-enclosure',materials,'office');
        service.box(rx,base+rh/2,rz,rw,rh,rd,'paper','detail');
        service.box(rx,base+rh+.018,rz,rw+.035,.035,rd+.035,'paper','detail');
        // The right face keeps the source's paired blue service windows.
        const side=rx+rw/2+.008,low=base+.10,high=base+rh-.09;
        for(const z of[rz-rd*.22,rz+rd*.18]){
            service.quad([[side,low,z-.12],[side,low,z+.12],[side,high,z+.12],[side,high,z-.12]],'#a2c0ff','detail');
            service.path([[side+.003,low+.025,z-.07],[side+.003,high-.025,z-.07]],'hair');
        }
        if(large){
            service.box(rx+rw*.26,base+.225,rz+rd/2+.012,.24,.45,.024,'#bed3ff','detail');
            service.path([[rx+rw*.29,base+.19,rz+rd/2+.029],[rx+rw*.29,base+.26,rz+rd/2+.029]],'hair');
        }
        group.add(service.finish());
    }
    if(spec.vent){
        const vent=new KitDrawing('office/roof-vent',materials,'office'),x=w*.29,z=-d*.27;
        vent.box(x,height+.10,z,.16,.10,.16,'paper','hair');
        vent.cylinder(x,height+.40,z,.055,.50,'paper','detail');
        vent.geometry(new THREE.ConeGeometry(.080,.075,8),new THREE.Matrix4().makeTranslation(x,height+.6875,z),'paper','detail');
        group.add(vent.finish());
    }
    return group;
}

function entrance(materials,spec){
    const {depth:d,entryWidth:w,entryCenter:x,groundHeight:gh}=spec,b=OFFICE_BASE.baseHeight,top=gh-.11,z=d/2;
    const draw=new KitDrawing('office/shared-entry',materials,'office'),glass=new KitDrawing('office/entry-glazing',materials,'office');
    // Actual recessed lobby: the shell is cut around this opening.
    draw.box(x,b/2,z+.09,w+.15,b,.33,'paper','detail');
    draw.box(x,b+.018,z-.22,w,.035,.48,'#fff4e2',false);
    draw.box(x,(top+b)/2,z-.45,w,top-b,.035,'#fff0d8',false);
    for(const side of[-1,1])draw.box(x+side*(w/2-.015),(top+b)/2,z-.22,.03,top-b,.46,'paper','hair');
    const doorW=Math.min(1.06,w*.68),doorTop=top-.035;
    for(const u of[-w/2,-doorW/2,0,doorW/2,w/2])draw.box(x+u,(doorTop+b)/2,z-.018,.027,doorTop-b,.065,'paper',Math.abs(u)===w/2?'detail':'hair');
    draw.box(x,doorTop+.014,z-.018,w,.028,.065,'paper','hair');
    for(const[a,c]of[[-w/2+.02,-doorW/2-.02],[-doorW/2+.02,-.02],[.02,doorW/2-.02],[doorW/2+.02,w/2-.02]]){
        if(c<=a)continue;
        glass.quad([[x+a,b+.025,z-.01],[x+c,b+.025,z-.01],[x+c,doorTop-.02,z-.01],[x+a,doorTop-.02,z-.01]],'#c6ddff',false);
        draw.quad([[x+a+.015,b+.10,z+.002],[x+a+.035,b+.10,z+.002],[x+a+.10,doorTop-.08,z+.002],[x+a+.08,doorTop-.08,z+.002]],'#eff5ff',false);
    }
    for(const u of[-.065,.065]){
        draw.box(x+u,b+.44,z+.037,.014,.18,.018,'#7198f0',false);
        for(const yy of[b+.36,b+.52])draw.box(x+u,yy,z+.022,.014,.014,.035,'#7198f0',false);
    }
    const canopyW=w+.30,cy=gh-.045;
    draw.box(x,cy,z+.16,canopyW,.075,OFFICE_BASE.canopyDepth,'paper','ink');
    draw.box(x,cy-.052,z+.16,canopyW-.09,.028,OFFICE_BASE.canopyDepth-.05,'shade',false);
    for(const side of[-1,1]){
        const px=x+side*(w/2+.065);
        draw.box(px,(cy-.04)/2,z+.27,.055,cy-.04,.055,'paper','detail');
        draw.box(px,.025,z+.27,.09,.05,.09,'paper','hair');
    }
    const group=draw.finish(),glazing=glass.finish();glazing.traverse(o=>{if(o.isMesh&&!o.isLineSegments2)o.material=materials.glazing;});group.add(glazing);
    group.userData.clearDoorWidth=doorW;
    return group;
}

export function buildOffice(materials,variantId='base'){
    const spec=OFFICE_VARIANTS.find(s=>s.id===variantId);
    if(!spec)throw new Error(`Unknown office variant: ${variantId}`);
    if(!materials.glazing)throw new Error('Office assets require the library glazing material.');
    const {width:w,depth:d,floors,groundHeight:gh,floorHeight:fh,entryWidth:ew,entryCenter:ex}=spec;
    const height=gh+(floors-1)*fh,group=new THREE.Group();group.name=`office/${spec.id}`;
    const shell=new KitDrawing('office/shared-shell',materials,'office');
    shell.box(0,(height+gh)/2,0,w,height-gh,d,'paper',false);
    shell.box(0,.025,0,w+.05,.05,d+.05,'paper','detail');
    for(const x of[-w/2,w/2])for(const z of[-d/2,d/2])shell.path([[x,0,z],[x,height,z]],'ink');
    group.add(shell.finish());
    const master=windowBay(materials);let bays=0;
    for(const[side,width,x,z,rotation]of[['front',w,0,d/2+.004,0],['right',d,w/2+.004,0,Math.PI/2],['back',w,0,-d/2-.004,Math.PI],['left',d,-w/2-.004,0,-Math.PI/2]]){
        const facade=new THREE.Group();facade.name=`office/facade-${side}`;facade.position.set(x,0,z);facade.rotation.y=rotation;
        const groundWall=new KitDrawing(`office/ground-${side}`,materials,'office');
        if(side===spec.entryFace){
            const left=ex-ew/2,right=ex+ew/2;
            groundWall.box((-width/2+left)/2,gh/2,-.05,left+width/2,gh,.10,'paper',false);
            groundWall.box((right+width/2)/2,gh/2,-.05,width/2-right,gh,.10,'paper',false);
            groundWall.box(ex,gh-.055,-.05,ew,.11,.10,'paper',false);
        }else groundWall.box(0,gh/2,-.05,width,gh,.10,'paper',false);
        const wall=groundWall.finish();wall.position.z=-.004;facade.add(wall);
        const paired=(side==='right'||side==='left')&&spec.sideWindows==='paired';
        const upper=windowRow(master,{width,paired});
        for(let floor=0;floor<floors;floor++){
            const row=floor===0&&side===spec.entryFace?windowRow(master,{width,ground:true,entryWidth:ew,entryCenter:ex}):upper.clone(true);
            row.name=`office/${side}/floor-${floor+1}`;
            row.position.y=(floor===0?0:gh+(floor-1)*fh)+OFFICE_BASE.windowSill;
            bays+=row.children.length;facade.add(row);
        }
        group.add(facade);
    }
    const entry=entrance(materials,spec.entryFace==='right'?{...spec,depth:w}:spec);
    if(spec.entryFace==='right')entry.rotation.y=Math.PI/2;
    group.add(entry,roof(materials,spec,height));
    group.userData={assetId:'office',family:'offices',variantId:spec.id,revision:OFFICE_BASE.revision,baseRevision:OFFICE_BASE.revision,approval:'approved',floors,bays,width:w,depth:d,height,entryFace:spec.entryFace,sideWindows:spec.sideWindows,roofService:spec.roofService,sharedModules:['shell','window-bay','window-row','entry','canopy','parapet','rooftop-enclosure']};
    group.updateMatrixWorld(true);
    const serialize=box=>({min:box.min.toArray(),max:box.max.toArray()});
    group.userData.reviewBounds={entrance:serialize(new THREE.Box3().setFromObject(group.getObjectByName('office/shared-entry'))),facade:serialize(new THREE.Box3(new THREE.Vector3(-w/2,0,d/2-.05),new THREE.Vector3(w/2,height,d/2+.42)))};
    return{group,bounds:new THREE.Box3().setFromObject(group),anchors:{ground:new THREE.Vector3(),entrance:spec.entryFace==='right'?new THREE.Vector3(w/2+.42,.08,-ex):new THREE.Vector3(ex,.08,d/2+.42),roof:new THREE.Vector3(0,height+.05,0)},spec};
}
