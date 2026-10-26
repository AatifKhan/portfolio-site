import * as THREE from '../../assets/vendor/three/three.module.js';
import { KitDrawing } from './style.js';
import { awning as cafeAwning } from './cafe.js';

export const SMALL_BASE=Object.freeze({id:'small-building',revision:1,wallThickness:.08,plinthHeight:.06,windowBay:.29,windowHeight:.54,doorLeafWidth:.42,doorHeight:1.10,parapetHeight:.11});
export const SMALL_VARIANTS=Object.freeze([
    {id:'base',number:'01',label:'Base small home',subtitle:'One storey · flat parapet roof',width:2.5,depth:2.5,height:1.45,roof:'parapet',configuration:'home',roofBox:false,annex:false,referenceCrop:[32,637,143,142],referenceLabel:'Southwestern small home',difference:'The shared starting point: a low rectangular shell, framed windows, a single door and a flat parapet roof. The entrance sits in the area obscured by the reference tree.'},
    {id:'gatehouse',number:'02',label:'Gatehouse',subtitle:'Service glazing · striped awning',width:1.75,depth:1.60,height:1.30,roof:'parapet',configuration:'gatehouse',roofBox:false,annex:false,referenceCrop:[440,469,87,91],referenceLabel:'Booth beside the society gate',difference:'The same shell with a glazed service face, counter ledge and the café family’s shared striped awning. The unseen rear access uses the standard single door.'},
    {id:'utility-hut',number:'03',label:'Utility hut',subtitle:'Minimal shell · plain flat roof',width:1.45,depth:1.40,height:1.00,roof:'plain',configuration:'hut',roofBox:false,annex:false,referenceCrop:[84,285,78,78],referenceLabel:'Northwestern utility hut',difference:'The smallest shell: a plain roof and one visible paired window. A short rear access door is inferred using the shared door system.'},
    {id:'stacked-home',number:'04',label:'Compact home',subtitle:'Stacked side windows · plain roof',width:1.80,depth:1.65,height:1.60,roof:'plain',configuration:'stacked',roofBox:false,annex:false,referenceCrop:[164,314,86,96],referenceLabel:'Compact building west of the towers',difference:'A taller compact configuration with the reference’s two rows of small side windows and a double entrance. The drawing does not establish an internal floor plan.'},
    {id:'compact-store',number:'05',label:'Compact store',subtitle:'Double service doors · parapet roof',width:1.85,depth:1.80,height:1.25,roof:'parapet',configuration:'store',roofBox:false,annex:false,referenceCrop:[259,380,91,98],referenceLabel:'Service building inside the society',difference:'A compact storage or utility configuration with double service doors. The partly hidden side stays simple; dimensions and openings are declared rather than scaled per instance.'},
    {id:'frontage-unit',number:'06',label:'Frontage unit',subtitle:'Glazed double entry · side window',width:1.80,depth:1.70,height:1.30,roof:'parapet',configuration:'frontage',roofBox:false,annex:false,referenceCrop:[304,420,94,98],referenceLabel:'Small unit along the society frontage',difference:'The compact shell with a warm glazed double entrance and paired side window, matching the small frontage building. No café signage or furniture is added.'},
    {id:'utility-block',number:'07',label:'Utility block',subtitle:'Wider shell · two glazed door sets',width:3.65,depth:3.90,height:1.65,roof:'parapet',configuration:'block',roofBox:false,annex:false,referenceCrop:[19,502,191,150],referenceLabel:'Larger western low-rise building',difference:'A wider configuration of the same shell, with two separate glazed door sets and two side windows. Its utility use is an interpretation of the unlabeled reference.'},
    {id:'home-annex',number:'08',label:'Home + annex',subtitle:'Rooftop box · attached utility shell',width:3.70,depth:3.40,height:1.90,roof:'parapet',configuration:'roof-home',roofBox:true,annex:{width:1.80,depth:1.60,height:1.05,offsetZ:.85},referenceCrop:[1259,704,188,222],referenceLabel:'Eastern small home and annex',difference:'The larger home adds a rooftop enclosure and an attached, smaller version of the utility shell. The annex has its own source ID and a shared internal connection; hidden access details are inferred.'},
].map(spec=>Object.freeze({...spec,annex:spec.annex?Object.freeze(spec.annex):false})));

export const SMALL_SOURCE_OBJECTS=Object.freeze([
    {id:'perimeter-home-west-01',variantId:'base',districtId:'perimeter',sourceBounds:[38,643,132,129]},
    {id:'housing-gatehouse-01',variantId:'gatehouse',districtId:'housing',sourceBounds:[445,474,79,80]},
    {id:'housing-utility-northwest-01',variantId:'utility-hut',districtId:'housing',sourceBounds:[90,291,67,68]},
    {id:'housing-compact-home-01',variantId:'stacked-home',districtId:'housing',sourceBounds:[170,319,75,85]},
    {id:'housing-compact-store-01',variantId:'compact-store',districtId:'housing',sourceBounds:[266,386,80,87]},
    {id:'housing-frontage-unit-01',variantId:'frontage-unit',districtId:'housing',sourceBounds:[310,426,82,83]},
    {id:'perimeter-utility-west-01',variantId:'utility-block',districtId:'perimeter',sourceBounds:[26,508,177,139]},
    {id:'perimeter-home-east-01',variantId:'home-annex',partId:'main',districtId:'perimeter',sourceBounds:[1266,711,168,176]},
    {id:'perimeter-home-east-annex-01',variantId:'home-annex',partId:'annex',districtId:'perimeter',sourceBounds:[1352,830,88,92]},
].map(spec=>Object.freeze({...spec,assetId:'small-building',reviewStatus:'approved',placementStatus:'unplaced'})));

const windowOpening=(x,y,columns=2,height=SMALL_BASE.windowHeight,clear=false)=>({type:'window',x,y,width:columns*SMALL_BASE.windowBay,height,columns,clear});
const doorOpening=(x,kind='single',height=SMALL_BASE.doorHeight)=>({type:'door',x,y:SMALL_BASE.plinthHeight,width:SMALL_BASE.doorLeafWidth*(kind==='single'||kind==='short'?1:2),height,kind});

function layout(spec,annex=false){
    const {width:w,depth:d,height:h,configuration:c}=spec;
    const faces={front:[],right:[],back:[],left:[]};
    if(annex){faces.right=[windowOpening(0,.30,1,.46)];faces.left=[{type:'connection',x:0,y:.06,width:.42,height:.80}];return faces;}
    if(c==='home'){
        faces.front=[windowOpening(-w*.26,.56),doorOpening(w*.25)];faces.right=[windowOpening(0,.56,3)];
    }else if(c==='gatehouse'){
        faces.front=[windowOpening(0,.43,2,.60,true)];faces.right=[windowOpening(0,.38,4,.64,true)];faces.back=[doorOpening(0)];
    }else if(c==='hut'){
        faces.right=[windowOpening(0,.30,2,.45)];faces.back=[doorOpening(0,'short',.80)];return faces;
    }else if(c==='stacked'){
        faces.front=[doorOpening(0,'double')];faces.right=[windowOpening(0,.30,3,.32),windowOpening(0,1.00,3,.32)];
    }else if(c==='store'){
        faces.front=[doorOpening(0,'double')];
    }else if(c==='frontage'){
        faces.front=[doorOpening(0,'glazed')];faces.right=[windowOpening(0,.45,2,.60)];
    }else if(c==='block'){
        faces.front=[doorOpening(-w*.27,'glazed'),doorOpening(w*.22,'glazed')];faces.right=[windowOpening(-d*.26,.63,3,.65),windowOpening(d*.26,.63,2,.65)];
    }else if(c==='roof-home'){
        faces.front=[windowOpening(-w*.26,.73,2,.66),windowOpening(w*.26,.73,2,.66)];
        faces.right=[windowOpening(-d*.27,1.17,2,.59),windowOpening(d*.27,1.17,2,.59),{type:'connection',x:-spec.annex.offsetZ,y:.06,width:.42,height:.80}];
        faces.back=[doorOpening(0),windowOpening(-w*.29,.73,2,.66)];
    }
    // Occluded faces reuse the declared modules, with no new ornament.
    if(c!=='gatehouse'&&c!=='store'&&!faces.back.length)faces.back=[windowOpening(0,Math.min(.62,h-.70))];
    if(c==='home'||c==='roof-home')faces.left=[windowOpening(0,.65)];
    return faces;
}

function makeWindow(materials,opening){
    const {width:w,height:h,columns,clear}=opening,key=`window-${columns}-${h}-${clear?'clear':'blue'}`;
    const draw=new KitDrawing(`small/${key}`,materials,'small-buildings'),glass=new KitDrawing(`small/${key}/glass`,materials,'small-buildings');
    const pane=clear?glass:draw;
    pane.quad([[-w/2,.015,.016],[w/2,.015,.016],[w/2,h-.015,.016],[-w/2,h-.015,.016]],'#afcbff',false);
    for(let i=0;i<=columns;i++)draw.box(-w/2+i*w/columns,h/2,.022,.022,h,.065,'paper',false);
    draw.box(0,h+.008,.022,w+.035,.026,.065,'paper',false);
    draw.box(0,-.015,.040,w+.065,.040,.13,'paper','hair');
    draw.path([[-w/2-.011,0,.060],[-w/2-.011,h+.022,.060],[w/2+.011,h+.022,.060],[w/2+.011,0,.060]],'detail');
    for(let i=0;i<columns;i++){
        const x=-w/2+i*w/columns;
        draw.quad([[x+.04,.045,.023],[x+.075,.045,.023],[x+.12,h-.04,.023],[x+.085,h-.04,.023]],'#e6efff',false);
        if(i)draw.path([[x,.02,.058],[x,h-.02,.058]],'hair');
    }
    const group=draw.finish();group.userData.moduleKey=key;
    if(clear){const glazing=glass.finish();glazing.traverse(o=>{if(o.isMesh&&!o.isLineSegments2)o.material=materials.glazing;});group.add(glazing);}
    return group;
}

function makeDoor(materials,opening){
    const {width:w,height:h,kind}=opening,key=`door-${kind}-${h}`,draw=new KitDrawing(`small/${key}`,materials,'small-buildings');
    const leaves=kind==='single'||kind==='short'?1:2,leaf=w/leaves;
    draw.box(0,-.025,.07,w+.10,.05,.22,'paper','detail');
    for(const x of[-w/2,w/2])draw.box(x,h/2,.018,.028,h,.07,'paper','detail');
    draw.box(0,h+.008,.018,w,.028,.07,'paper','detail');
    for(let i=0;i<leaves;i++){
        const center=-w/2+leaf*(i+.5);
        draw.box(center,h/2,-.008,leaf-.03,h-.035,.025,kind==='glazed'?'#fff0d8':'#aec9ff',false);
        draw.path([[center-leaf/2+.02,.02,.011],[center-leaf/2+.02,h-.02,.011],[center+leaf/2-.02,h-.02,.011],[center+leaf/2-.02,.02,.011]],'hair');
        draw.path([[center-leaf*.40,h*.30,.013],[center+leaf*.40,h*.30,.013]],'hair');
        if(kind==='glazed')draw.quad([[center-leaf*.33,h*.36,.014],[center-leaf*.20,h*.36,.014],[center-leaf*.12,h*.91,.014],[center-leaf*.25,h*.91,.014]],'#edf4ff',false);
        const hx=center+(i===0?1:-1)*leaf*.27;
        draw.path([[hx,h*.43,.044],[hx,h*.56,.044]],'detail');
    }
    if(leaves===2)draw.box(0,h/2,.020,.018,h,.045,'paper','hair');
    const group=draw.finish();group.userData.moduleKey=key;return group;
}

// Build a wall around its actual apertures. Grid edges remain internal, so the
// illustration only outlines the silhouette and authored opening frames.
function wall(draw,width,height,openings){
    const xs=[...new Set([-width/2,width/2,...openings.flatMap(o=>[o.x-o.width/2,o.x+o.width/2])])].sort((a,b)=>a-b);
    const ys=[...new Set([SMALL_BASE.plinthHeight,height,...openings.flatMap(o=>[o.y,o.y+o.height])])].sort((a,b)=>a-b);
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
        const x=(xs[i]+xs[i+1])/2,y=(ys[j]+ys[j+1])/2;
        if(openings.some(o=>x>o.x-o.width/2&&x<o.x+o.width/2&&y>o.y&&y<o.y+o.height))continue;
        draw.box(x,y,-SMALL_BASE.wallThickness/2,xs[i+1]-xs[i],ys[j+1]-ys[j],SMALL_BASE.wallThickness,'paper',false);
    }
}

function makeRoof(materials,spec,prefix){
    const {width:w,depth:d,height:h}=spec,draw=new KitDrawing(`${prefix}/roof`,materials,'small-buildings');
    if(spec.roof==='plain')draw.box(0,h+.018,0,w,.036,d,'paper','ink');
    else{
        draw.box(0,h+.015,0,w+.07,.045,d+.07,'paper','ink');
        const ph=SMALL_BASE.parapetHeight;
        for(const z of[-d/2,d/2])draw.box(0,h+ph/2+.03,z,w+.07,ph,.055,'paper',false);
        for(const x of[-w/2,w/2])draw.box(x,h+ph/2+.03,0,.055,ph,d,'paper',false);
        for(const[margin,weight]of[[.035,'ink'],[-.045,'detail']])draw.path([[-w/2-margin,h+ph+.03,-d/2-margin],[w/2+margin,h+ph+.03,-d/2-margin],[w/2+margin,h+ph+.03,d/2+margin],[-w/2-margin,h+ph+.03,d/2+margin]],weight,true);
    }
    const group=draw.finish();
    if(spec.roofBox){
        const box=new KitDrawing(`${prefix}/rooftop-box`,materials,'small-buildings'),x=-.10,z=-.14,b=h+.038;
        box.box(x,b+.225,z,.82,.45,.74,'paper','detail');
        box.box(x,b+.465,z,.85,.030,.77,'paper','detail');
        for(const face of['front','right']){
            const pane=new KitDrawing(`${prefix}/roof-window-${face}`,materials,'small-buildings');
            pane.box(0,.23,.014,.27,.27,.028,'#95baff','detail');
            const p=pane.finish();p.position.set(face==='right'?x+.411:x,b,face==='front'?z+.371:z);if(face==='right')p.rotation.y=Math.PI/2;group.add(p);
        }
        group.add(box.finish());
    }
    return group;
}

function makeShell(materials,spec,prefix,modules,{annex=false}={}){
    const {width:w,depth:d,height:h}=spec,group=new THREE.Group(),faces=layout(spec,annex);group.name=prefix;
    const base=new KitDrawing(`${prefix}/base`,materials,'small-buildings');
    base.box(0,.03,0,w,.06,d,'paper','detail');
    for(const x of[-w/2,w/2])for(const z of[-d/2,d/2])base.path([[x,0,z],[x,h,z]],'ink');
    group.add(base.finish());
    for(const[side,width,x,z,angle]of[['front',w,0,d/2,0],['right',d,w/2,0,Math.PI/2],['back',w,0,-d/2,Math.PI],['left',d,-w/2,0,-Math.PI/2]]){
        const facade=new THREE.Group();facade.name=`${prefix}/facade-${side}`;facade.position.set(x,0,z);facade.rotation.y=angle;
        const openings=faces[side],draw=new KitDrawing(`${prefix}/wall-${side}`,materials,'small-buildings');
        // Front/back walls own the corners; inset side ends to avoid coplanar
        // end caps flickering through the exterior surface at close range.
        const wallWidth=width-(['right','left'].includes(side)?2*SMALL_BASE.wallThickness:0);
        wall(draw,wallWidth,h,openings);facade.add(draw.finish());
        for(const[i,opening]of openings.entries()){
            if(opening.type==='connection')continue;
            const key=opening.type==='window'?`window-${opening.columns}-${opening.height}-${opening.clear?'clear':'blue'}`:`door-${opening.kind}-${opening.height}`;
            if(!modules.has(key))modules.set(key,opening.type==='window'?makeWindow(materials,opening):makeDoor(materials,opening));
            const part=modules.get(key).clone(true);part.name=`${prefix}/${side}/${opening.type}-${i}`;part.position.set(opening.x,opening.y,0);facade.add(part);
        }
        facade.userData.openings=openings;facade.userData.width=width;group.add(facade);
    }
    group.add(makeRoof(materials,spec,prefix));
    if(spec.configuration==='gatehouse'){
        const counter=new KitDrawing(`${prefix}/service-counter`,materials,'small-buildings');
        counter.box(w/2-.17,.37,0,.46,.065,1.25,'paper','detail');
        counter.box(w/2-.20,.18,0,.26,.30,1.18,'#fff0d8',false);
        counter.box(-w/2+.07,.64,0,.025,1.13,d-.12,'#fff4e3',false);
        group.add(counter.finish());
        const shade=new KitDrawing(`${prefix}/shared-cafe-awning`,materials,'small-buildings');cafeAwning(shade,d+.04,w/2+.025,h-.005,'striped');
        const awning=shade.finish();awning.rotation.y=Math.PI/2;group.add(awning);
    }
    group.userData={component:'small-shell',width:w,depth:d,height:h,annex};return group;
}

export function buildSmallBuilding(materials,variantId='base'){
    const spec=SMALL_VARIANTS.find(s=>s.id===variantId);if(!spec)throw new Error(`Unknown small-building variant: ${variantId}`);
    if(!materials.glazing)throw new Error('Small buildings require library glazing materials.');
    const group=new THREE.Group();group.name=`small-building/${variantId}`;const modules=new Map();
    const main=makeShell(materials,spec,'small/main',modules);group.add(main);
    if(spec.annex){
        const annex=makeShell(materials,{...spec.annex,roof:'plain',roofBox:false,configuration:'annex'},'small/annex',modules,{annex:true});
        annex.position.set((spec.width+spec.annex.width)/2,0,spec.annex.offsetZ);group.add(annex);
    }
    group.userData={assetId:'small-building',family:'small-buildings',variantId,revision:SMALL_BASE.revision,approval:'approved',width:spec.width,depth:spec.depth,height:spec.height,configuration:spec.configuration,roof:spec.roof,annex:Boolean(spec.annex),roofBox:spec.roofBox,sharedModules:['shell','window-bay','door-leaf','roof','parapet','rooftop-box',...(spec.configuration==='gatehouse'?['cafe-awning','service-counter']:[])]};
    group.updateMatrixWorld(true);
    const serialize=box=>({min:box.min.toArray(),max:box.max.toArray()});
    const visibleOpenings=new THREE.Box3();
    for(const side of['front','right'])for(const part of main.getObjectByName(`small/main/facade-${side}`).children)if(part.userData.moduleKey)visibleOpenings.union(new THREE.Box3().setFromObject(part));
    group.userData.reviewBounds={openings:serialize(visibleOpenings.expandByScalar(.16)),roof:serialize(new THREE.Box3().setFromObject(main.getObjectByName('small/main/roof')).expandByScalar(.10))};
    return{group,bounds:new THREE.Box3().setFromObject(group),anchors:{ground:new THREE.Vector3(),roof:new THREE.Vector3(0,spec.height+.04,0),front:new THREE.Vector3(0,.06,spec.depth/2+.15),...(spec.annex?{annex:new THREE.Vector3((spec.width+spec.annex.width)/2,0,spec.annex.offsetZ)}:{})},spec};
}
