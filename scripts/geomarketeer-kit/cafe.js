import * as THREE from '../../assets/vendor/three/three.module.js';
import { KitDrawing } from './style.js';
import { createSeatingSet, tube, cup, cupEmblem, pastryPlate } from './cafe-furniture.js';

export const CAFE_BASE=Object.freeze({id:'cafe',revision:2,groundHeight:2.30,floorHeight:.12,upperHeight:1.35,awningDepth:.48,awningDrop:.25,wallThickness:.10,frameWidth:.045});
export const CAFE_VARIANTS=Object.freeze([
    {id:'base',label:'Base café',number:'01',subtitle:'Single storey · striped awning',width:4.2,depth:3.1,upper:false,awning:'striped',corner:false,fitout:'cafe',roofService:false,tables:2,referenceCrop:[594,772,228,242],sourceId:'cafe-lane-04',difference:'The shared starting point: a flat roof, three-bay storefront and striped awning.'},
    {id:'upper-floor',label:'Upstairs café',number:'02',subtitle:'Same footprint · upper floor',width:4.2,depth:3.1,upper:true,awning:'striped',corner:false,fitout:'cafe',roofService:false,tables:2,referenceCrop:[177,671,156,221],sourceId:'cafe-lane-01',difference:'The base café with one upper floor. Ground-floor proportions, entry and furniture stay the same.'},
    {id:'compact',label:'Compact café',number:'03',subtitle:'Narrower frontage · upper floor',width:3.0,depth:2.8,upper:true,awning:'striped',corner:false,fitout:'cafe',roofService:true,tables:1,referenceCrop:[280,724,153,218],sourceId:'cafe-lane-02',difference:'A narrower frontage and shallower footprint, using the same storefront, windows and awning modules.'},
    {id:'blue-awning',label:'Blue-awning unit',number:'04',subtitle:'Solid blue awning · vacant',width:4.2,depth:3.1,upper:true,awning:'solid',corner:false,fitout:'vacant',roofService:false,tables:0,referenceCrop:[414,729,181,229],sourceId:'cafe-lane-03',difference:'The same upstairs shell with a solid-blue awning and an empty interior, preserving Sid’s candidate unit.'},
    {id:'corner',label:'Corner café',number:'05',subtitle:'Wider footprint · corner glazing',width:5.1,depth:4.0,upper:false,awning:'striped',corner:true,fitout:'cafe',roofService:true,tables:3,referenceCrop:[661,509,253,246],sourceId:'central-cafe-01',difference:'A wider base with glazing around the corner, rooftop enclosure and an extra seating set.'},
].map(spec=>Object.freeze(spec)));

export function awning(draw,width,z,y,style){
    const {awningDepth:d,awningDrop:drop}=CAFE_BASE,n=Math.ceil(width/.42);
    draw.box(0,y-.015,z,width,.08,.075,'paper','detail');
    const profile=t=>y-drop*t-.025*Math.sin(Math.PI*t),thickness=.018;
    for(let i=0;i<n;i++){
        const a=-width/2+i*width/n,b=-width/2+(i+1)*width/n,tint=style==='solid'||i%2===0?'#3867f5':'#ffffff';
        for(let j=0;j<6;j++){
            const u=j/6,v=(j+1)/6;
            draw.quad([[a,profile(u),z+d*u],[b,profile(u),z+d*u],[b,profile(v),z+d*v],[a,profile(v),z+d*v]],tint,false);
            draw.quad([[a,profile(u)-thickness,z+d*u],[a,profile(v)-thickness,z+d*v],[b,profile(v)-thickness,z+d*v],[b,profile(u)-thickness,z+d*u]],tint,false);
            for(const x of[i===0?a:null,i===n-1?b:null].filter(x=>x!==null))draw.quad([[x,profile(u),z+d*u],[x,profile(v),z+d*v],[x,profile(v)-thickness,z+d*v],[x,profile(u)-thickness,z+d*u]],tint,false);
        }
        for(let j=0;j<8;j++){
            const u=a+(b-a)*j/8,v=a+(b-a)*(j+1)/8;
            const lo=t=>y-drop-.075-Math.sin(t*Math.PI)*.04;
            draw.quad([[u,y-drop,z+d],[v,y-drop,z+d],[v,lo((j+1)/8),z+d],[u,lo(j/8),z+d]],tint,false);
            draw.quad([[u,y-drop,z+d-thickness],[u,lo(j/8),z+d-thickness],[v,lo((j+1)/8),z+d-thickness],[v,y-drop,z+d-thickness]],tint,false);
            draw.quad([[u,lo(j/8),z+d],[v,lo((j+1)/8),z+d],[v,lo((j+1)/8),z+d-thickness],[u,lo(j/8),z+d-thickness]],tint,false);
        }
        draw.path(Array.from({length:9},(_,j)=>[a+(b-a)*j/8,y-drop-.075-Math.sin(j/8*Math.PI)*.04,z+d]),'detail');
    }
    for(const x of[-width/2,width/2])draw.path(Array.from({length:7},(_,i)=>[x,profile(i/6),z+d*i/6]),'detail');
    draw.path([[-width/2,y-drop,z+d],[width/2,y-drop,z+d]],'detail');
    for(const x of[-width/2+.13,width/2-.13]){
        draw.box(x,y-.24,z-.01,.045,.45,.045,'paper','hair');
        tube(draw,[[x,y-.45,z],[x,y-drop-.055,z+d-.07],[x,y-.035,z]],.012,'profile',2);
    }
}

function smallWindow(draw,axis,side,u,y,w=.48,h=.56){
    const p=(a,b,offset=0)=>axis==='front'?[a,b,side+offset]:[side+offset,b,a];
    const frame=(a,b,ww,hh,depth=.055)=>axis==='front'?draw.box(a,b,side+.018,ww,hh,depth,'paper',false):draw.box(side+.018,b,a,depth,hh,ww,'paper',false);
    draw.quad([p(u-w/2,y),p(u+w/2,y),p(u+w/2,y+h),p(u-w/2,y+h)],'#a9c8ff','hair');
    draw.quad([p(u-w*.30,y+.04,.003),p(u-w*.10,y+.04,.003),p(u+w*.04,y+h-.04,.003),p(u-w*.16,y+h-.04,.003)],'#eff5ff',false);
    draw.path([p(u,y),p(u,y+h)],'hair');
    for(const x of[u-w/2-.015,u+w/2+.015])frame(x,y+h/2,.03,h+.06);
    frame(u,y+h+.015,w,.03);frame(u,y-.035,w+.09,.07,.12);
    draw.path([p(u-w/2-.03,y-.07,.048),p(u-w/2-.03,y+h+.03,.048),p(u+w/2+.03,y+h+.03,.048),p(u+w/2+.03,y-.07,.048)],'detail');
    draw.path([p(u-w/2-.045,y,.08),p(u+w/2+.045,y,.08)],'hair');
}

function storefront(draw,glass,axis,side,width,bays=3){
    const low=.15,high=2.10,p=(u,y,depth=0)=>axis==='front'?[u,y,side+depth]:[side+depth,y,u];
    const box=(u,y,w,h,d,tint='paper',edge='detail')=>axis==='front'?draw.box(u,y,side,w,h,d,tint,edge):draw.box(side,y,u,d,h,w,tint,edge);
    for(let i=0;i<=bays;i++)box(-width/2+width*i/bays,(low+high)/2,.055,high-low,.16);
    box(0,high+.03,width+.07,.10,.18);box(0,low,width,.045,.16);
    if(axis==='front'){
        const center=-width/2+width*1.5/bays;
        draw.box(center,.135,side+.07,width/bays-.06,.03,.24,'paper','detail');
    }
    for(let i=0;i<bays;i++){
        const a=-width/2+width*i/bays+.03,b=-width/2+width*(i+1)/bays-.03;
        glass.quad([p(a,low+.02,.015),p(b,low+.02,.015),p(b,high-.03,.015),p(a,high-.03,.015)],'#c6ddff',false);
        // A restrained reflection streak leaves the physical interior readable.
        draw.quad([p(a+.08,.42,.026),p(a+.115,.42,.026),p(a+.22,1.70,.026),p(a+.185,1.70,.026)],'#e7f1ff',false);
        if(axis==='front'&&i===1){
            const center=(a+b)/2;
            box(center,(low+high)/2,.026,high-low,.09,'paper','hair');
            for(const u of[center-.09,center+.09])tube(draw,[p(u,.89,.04),p(u,.91,.10),p(u,1.15,.10),p(u,1.17,.04)],.010,'detail',8);
            draw.path([p(a,high-.21,.04),p(b,high-.21,.04)],'hair');
            draw.path([p(a,low+.18,.035),p(b,low+.18,.035)],'hair');
        }
    }
}

function roof(draw,spec,y){
    const w=spec.width,d=spec.depth;
    draw.box(0,y,0,w+.16,.16,d+.16,'paper','ink');
    for(const z of[-d/2,d/2])draw.box(0,y+.15,z,w+.14,.21,.07,'paper',false);
    for(const x of[-w/2,w/2])draw.box(x,y+.15,0,.07,.21,d,'paper',false);
    draw.path([[-w/2-.07,y+.255,-d/2-.07],[w/2+.07,y+.255,-d/2-.07],[w/2+.07,y+.255,d/2+.07],[-w/2-.07,y+.255,d/2+.07]],'ink',true);
    draw.path([[-w/2+.07,y+.255,-d/2+.07],[w/2-.07,y+.255,-d/2+.07],[w/2-.07,y+.255,d/2-.07],[-w/2+.07,y+.255,d/2-.07]],'detail',true);
    if(spec.roofService){
        const size=spec.corner?.86:.28,height=spec.corner?.52:.40;
        draw.box(-.20,y+.10+height/2,-.30,size,height,size*.88,'paper','detail');
        if(spec.corner){
            smallWindow(draw,'front',-.30+size*.44+.006,-.28,y+.19,.20,.26);
            smallWindow(draw,'side',-.20+size/2+.006,-.24,y+.19,.20,.26);
        }
        if(!spec.corner)draw.box(-.20,y+.12+height,-.30,size+.06,.035,size*.88+.06,'paper','detail');
    }
}

function menuBoard(draw,x,z){
    const face=(u,y,offset=.004)=>[x+u,y,z+(.77-y)/.68*.13+offset];
    draw.quad([face(-.18,.09,0),face(.18,.09,0),face(.18,.77,0),face(-.18,.77,0)],'#e2eaff','detail');
    draw.quad([[x-.18,.09,z-.15],[x-.18,.77,z],[x+.18,.77,z],[x+.18,.09,z-.15]],'paper','hair');
    for(const side of[-1,1])tube(draw,[[x+side*.17,.010,z+.15],[x+side*.17,.78,z],[x+side*.17,.010,z-.16]],.010,'detail',2);
    cupEmblem(draw,(u,v)=>face(u,.57+v),.38);
    for(const y of[.39,.31,.23])draw.path([face(-.105,y),face(.10,y)],'hair');
}

function furnishing(draw,glass,spec){
    const w=spec.width,d=spec.depth;
    const cx=-(w-.10)/3,z=d/2-.36,cw=(w-.10)/3-.18;
    draw.box(cx,.52,z,cw,.78,.46,'#fff0d7','detail');
    draw.box(cx,.94,z,cw+.08,.065,.55,'paper','detail');
    draw.path([[cx-cw/2+.06,.23,z+.236],[cx+cw/2-.06,.23,z+.236]],'hair');
    draw.path([[cx,.24,z+.236],[cx,.84,z+.236]],'hair');
    // Machine housing, recessed control panel, group heads and drip tray.
    draw.rounded(cx-.05,1.16,z-.02,.55,.31,.30,.035,'paper','detail');
    draw.box(cx-.05,1.18,z+.134,.46,.16,.008,'shade','hair');
    draw.box(cx-.05,1.33,z-.02,.59,.035,.33,'paper','hair');
    draw.box(cx-.05,.995,z+.16,.53,.035,.20,'paper','hair');
    for(const x of[cx-.19,cx+.08]){
        draw.cylinder(x,1.075,z+.16,.038,.08,'metal',false);
        tube(draw,[[x,1.07,z+.16],[x,1.07,z+.26]],.011,'detail',1);
        cup(draw,x,1.348,z-.025,.68,false);
    }
    for(const x of[cx-.19,cx-.09,cx+.01])draw.box(x,1.23,z+.143,.025,.025,.009,'accent',false);
    tube(draw,[[cx+.21,1.14,z+.13],[cx+.25,1.07,z+.19],[cx+.25,1.01,z+.19]],.010,'detail',5);
    draw.cylinder(cx+.32,1.025,z+.12,.035,.10,'paper','hair');
    // Cup shelf and two brackets; all cups sit on its top surface.
    const shelfY=1.30;
    draw.box(-w*.19,shelfY,-d/2+.20,w*.49,.045,.25,'paper','detail');
    for(const x of[-w*.38,-w*.04])tube(draw,[[x,shelfY-.15,-d/2+.11],[x,shelfY-.03,-d/2+.29]],.009,'profile',1);
    for(let i=0;i<4;i++)cup(draw,-w*.38+i*.20,shelfY+.0225,-d/2+.20,.75,false);
    // Two pastries under a true transparent, sloping glass display hood.
    const bx=(w-.10)/3,bw=Math.min(.85,(w-.10)/3-.13),bz=d/2-.36;
    draw.box(bx,.52,bz,bw-.07,.78,.45,'#fff0d7','detail');
    draw.box(bx,.94,bz,bw,.05,.53,'paper','detail');
    draw.box(bx,1.31,bz-.055,bw,.035,.40,'paper','detail');
    const left=bx-bw/2,right=bx+bw/2,front=bz+.255,back=bz-.255;
    glass.quad([[left,.968,front],[right,.968,front],[right,1.2925,front-.11],[left,1.2925,front-.11]],'#c6ddff',false);
    for(const x of[left,right]){
        glass.quad([[x,.968,front],[x,.968,back],[x,1.2925,back],[x,1.2925,front-.11]],'#c6ddff',false);
        draw.path([[x,.968,front],[x,1.2925,front-.11],[x,1.2925,back],[x,.968,back]],'hair');
    }
    pastryPlate(draw,bx-.16,.965,bz);pastryPlate(draw,bx+.16,.965,bz);
    for(const x of[-w*.28,w*.28]){
        tube(draw,[[x,2.17,d/2-.56],[x,1.76,d/2-.56]],.006,'profile',1);
        draw.geometry(new THREE.ConeGeometry(.13,.12,16),new THREE.Matrix4().makeTranslation(x,1.70,d/2-.56),'paper','detail',45);
        draw.cylinder(x,1.642,d/2-.56,.115,.008,'#fff1d6',false);
    }
}

export function buildCafe(materials,variantId='base'){
    const spec=CAFE_VARIANTS.find(spec=>spec.id===variantId);
    if(!spec)throw new Error(`Unknown café variant: ${variantId}`);
    if(!materials.glazing)throw new Error('Café assets require the library glazing material.');
    const {width:w,depth:d}=spec,{groundHeight:h,floorHeight:f,upperHeight:upper}=CAFE_BASE;
    const group=new THREE.Group();group.name=`cafe/${spec.id}`;
    const shell=new KitDrawing('cafe/shared-shell',materials,'cafe'),glass=new KitDrawing('cafe/glazing',materials,'cafe');
    shell.box(0,f/2,0,w+.08,f,d+.08,'paper','detail');
    shell.quad([[-w/2+.06,f+.004,-d/2+.06],[w/2-.06,f+.004,-d/2+.06],[w/2-.06,f+.004,d/2-.06],[-w/2+.06,f+.004,d/2-.06]],'#fff7e8',false);
    shell.box(-w/2+.05,h/2,0,.10,h,d,'paper','ink');
    shell.box(0,h/2,-d/2+.05,w,h,.10,'paper','ink');
    // Pale interior wall avoids dark room cavities at the fixed illustration angle.
    shell.quad([[-w/2+.08,f,-d/2+.108],[w/2-.08,f,-d/2+.108],[w/2-.08,h,-d/2+.108],[-w/2+.08,h,-d/2+.108]],'#fff1d6',false);
    if(spec.corner){storefront(shell,glass,'side',w/2-.025,d-.08,3);}
    else{
        shell.box(w/2-.05,h/2,0,.10,h,d,'paper','ink');
        for(const z of[-d*.23,d*.23])smallWindow(shell,'side',w/2+.008,z,.89,.56,.74);
    }
    storefront(shell,glass,'front',d/2-.015,w-.10);
    shell.box(0,h-.12,0,w,.24,d,'paper',false);
    group.add(shell.finish());
    const shade=new KitDrawing('cafe/shared-awning',materials,'cafe');awning(shade,w+.04,d/2+.05,h-.005,spec.awning);group.add(shade.finish());
    if(spec.upper){
        const upstairs=new KitDrawing('cafe/optional-upper-floor',materials,'cafe');
        upstairs.box(0,h+upper/2,0,w,upper,d,'paper','ink');
        for(const x of[-w*.31,0,w*.31])smallWindow(upstairs,'front',d/2+.012,x,h+.38,.45,.60);
        for(const z of[-d*.25,d*.25])smallWindow(upstairs,'side',w/2+.012,z,h+.38,.45,.60);
        group.add(upstairs.finish());
    }
    const top=new KitDrawing('cafe/shared-roof',materials,'cafe');roof(top,spec,h+(spec.upper?upper:0));group.add(top.finish());
    if(spec.fitout==='cafe'){
        const interior=new KitDrawing('cafe/shared-fitout',materials,'cafe');furnishing(interior,glass,spec);group.add(interior.finish());
        const identity=new KitDrawing('cafe/shared-identity',materials,'cafe');
        cupEmblem(identity,(x,y)=>[(w-.10)*.40+x,1.18+y,d/2+.016],.50);group.add(identity.finish());
        const furniture=new THREE.Group();furniture.name='cafe/shared-terrace-furniture';
        const sets=spec.tables===1?[[-w*.34,d/2+1.22]]:[[-w*.32,d/2+1.22],[w*.32,d/2+1.22]];
        if(spec.tables===3)sets.push([w/2+1.10,-d*.08]);
        for(const[index,[x,z]]of sets.entries())furniture.add(createSeatingSet(materials,{id:`cafe/terrace-set-${index}`,x,z}));
        const board=new KitDrawing('cafe/shared-menu-board',materials,'cafe');menuBoard(board,w/2+.47,d/2+.76);furniture.add(board.finish());group.add(furniture);
        if(spec.corner)group.add(createSeatingSet(materials,{id:'cafe/interior-set-0',x:w*.28,z:-d*.17,y:f,pastry:false}));
    }
    const glazing=glass.finish();glazing.traverse(object=>{if(object.isMesh&&!object.isLineSegments2)object.material=materials.glazing;});group.add(glazing);
    group.userData={assetId:'cafe',family:'cafe',variantId:spec.id,revision:CAFE_BASE.revision,approval:'approved',baseRevision:CAFE_BASE.revision,width:w,depth:d,storeys:spec.upper?2:1,awning:spec.awning,cornerGlazing:spec.corner,fitout:spec.fitout,terraceTables:spec.tables,sharedModules:['shell','storefront','awning','roof','window','seating-set','table','chair','cup','pastry-plate','cup-emblem','menu-board','counter']};
    group.updateMatrixWorld(true);
    const storefrontBounds=new THREE.Box3(new THREE.Vector3(-w/2,.10,d/2-.80),new THREE.Vector3(w/2,h,d/2+CAFE_BASE.awningDepth+.05));
    const seating=group.getObjectByName('cafe/terrace-set-0');
    const serialize=box=>({min:box.min.toArray(),max:box.max.toArray()});
    group.userData.reviewBounds={storefront:serialize(storefrontBounds),...(seating?{seating:serialize(new THREE.Box3().setFromObject(seating))}:{})};
    return{group,bounds:new THREE.Box3().setFromObject(group),anchors:{ground:new THREE.Vector3(),entrance:new THREE.Vector3(0,f,d/2+.2),roof:new THREE.Vector3(0,h+(spec.upper?upper:0),0)},spec};
}
