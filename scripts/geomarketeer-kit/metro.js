import * as THREE from '../../assets/vendor/three/three.module.js';
import {KitDrawing} from './style.js';

export const METRO=Object.freeze({id:'metro-entrance',revision:1,variantId:'standard',width:3.4,length:5.9,clearWidth:2.94,upperStart:-2.8,stairStart:-1.5,steps:8,rise:.14,tread:.30,lowerEnd:2.8,depth:1.12,curbHeight:.14,guardHeight:1.05,canopyHeight:2.24,canopyStart:-2.87,canopyEnd:-1.01,signCenter:[-1.10,2.98,-1.67],signRadius:.37});
export const METRO_PARTS=Object.freeze([
    {id:'structure',label:'Stairs & landings',subtitle:'Eight steps · two landings',description:'Eight repeated treads connect the covered upper landing to the lower landing. The ground anchor stays at the upper entrance; the well extends below it.',referenceCrop:[1187,554,186,101]},
    {id:'guards',label:'Perimeter railing',subtitle:'Posts · pickets · open approach',description:'Shared vertical posts and pickets enclose the open well. The full-width approach under the canopy stays clear.',referenceCrop:[1245,498,166,142]},
    {id:'handrails',label:'Stair handrails',subtitle:'Two continuous rails',description:'Two continuous rails follow the stair pitch, with short level returns at each landing. Supports connect to the stair side walls.',referenceCrop:[1224,555,138,86]},
    {id:'canopy',label:'Canopy & glazing',subtitle:'Shared frame · clear panes',description:'Four slim columns support a shallow rectangular frame and six transparent roof panes. Side glazing leaves the entrance open.',referenceCrop:[1151,490,127,130]},
    {id:'sign',label:'Metro sign',subtitle:'A geometric M on both faces',description:'A cobalt circular sign carries a geometric white M on both faces. Its mast shares the canopy corner.',referenceCrop:[1240,464,43,92]},
].map((s,i)=>Object.freeze({...s,number:String(i+1).padStart(2,'0')})));
export const METRO_FOCUS=Object.freeze([
    {id:'whole',label:'Whole entrance',bounds:null,referenceCrop:[1149,464,260,196]},
    {id:'stairs',label:'Stairs & handrails',bounds:[[-1.65,-1.23,-1.58],[1.25,1.12,1.58]],referenceCrop:[1187,554,186,101]},
    {id:'canopy',label:'Canopy detail',bounds:[[-2.97,1.88,-1.83],[-.94,2.34,1.83]],referenceCrop:[1151,490,127,88]},
    {id:'sign',label:'Sign detail',bounds:[[-1.54,2.38,-1.82],[-.66,3.39,-1.51]],referenceCrop:[1240,464,43,68]},
]);
export const METRO_SOURCE_OBJECTS=Object.freeze([{id:'metro-entrance-01',assetId:'metro-entrance',variantId:'standard',districtId:'metro',sourceBounds:[1149,464,260,196],reference:[1279,619],reviewStatus:'approved',placementStatus:'unplaced'}]);
const V=p=>new THREE.Vector3(...p);
const move=(x,y,z,ry=0)=>new THREE.Matrix4().compose(V([x,y,z]),new THREE.Quaternion().setFromAxisAngle(V([0,1,0]),ry),V([1,1,1]));
function rail(draw,a,b,r=.027,tint='accent'){const start=V(a),delta=V(b).sub(start),m=new THREE.Matrix4().compose(start.addScaledVector(delta,.5),new THREE.Quaternion().setFromUnitVectors(V([0,1,0]),delta.clone().normalize()),V([1,1,1]));draw.geometry(new THREE.CylinderGeometry(r,r,delta.length(),12),m,tint,false);draw.path([a,b],'detail');}
export function metroFloorAt(x){if(x<METRO.stairStart)return 0;const end=METRO.stairStart+METRO.steps*METRO.tread;if(x>=end)return-METRO.depth;return-(Math.floor((x-METRO.stairStart)/METRO.tread+1e-8)+1)*METRO.rise;}
function structure(materials){const group=new THREE.Group();group.name='metro/structure';
    const floor=new KitDrawing('metro/landings',materials,'metro');floor.box(-2.15,-.07,0,1.3,.14,2.94,'paper',false);floor.box(1.85,-1.19,0,1.9,.14,2.94,'paper',false);
    for(const[x,y,width]of[[-2.15,0,1.3],[1.85,-1.12,1.9]])floor.path([[x-width/2,y,-1.47],[x+width/2,y,-1.47],[x+width/2,y,1.47],[x-width/2,y,1.47]],'profile',true);
    group.add(floor.finish());
    for(let i=0;i<METRO.steps;i++){
        const d=new KitDrawing(`metro/step-${String(i+1).padStart(2,'0')}`,materials,'metro'),x=METRO.stairStart+i*METRO.tread,y=-(i+1)*METRO.rise;
        // A real tread slab and front riser; enclosed sidewalls hide their ends.
        d.box(x+METRO.tread/2,y-.07,0,METRO.tread,.14,2.94,'paper',false);
        d.path([[x+.002,y+.002,-1.47],[x+.002,y+.002,1.47]],'detail');d.path([[x+.002,y+METRO.rise+.002,-1.47],[x+.002,y+METRO.rise+.002,1.47]],'hair');group.add(d.finish());
    }
    for(const side of[-1,1]){const wall=new KitDrawing(`metro/wall-${side<0?'far':'near'}`,materials,'metro');wall.box(0,-.56,side*1.54,5.9,1.4,.14,'paper','profile');wall.box(0,.11,side*1.62,5.9,.06,.30,'paper','detail');group.add(wall.finish());}
    const end=new KitDrawing('metro/end-wall',materials,'metro');end.box(2.88,-.56,0,.16,1.4,3.22,'paper','profile');end.box(2.88,.11,0,.22,.06,3.40,'paper','detail');group.add(end.finish());
    return group;}
function guardRun(materials,name,a,b){const d=new KitDrawing(name,materials,'metro'),start=V(a),delta=V(b).sub(start),length=delta.length(),point=t=>start.clone().addScaledVector(delta,t);
    for(const y of[.23,1.05]){const p=point(0),q=point(1);p.y=q.y=y;rail(d,p.toArray(),q.toArray(),.024);}
    const count=Math.round(length/.115);for(let i=1;i<count;i++){const p=point(i/count);d.box(p.x,.64,p.z,.018,.82,.018,'accent',false);}
    const bays=Math.ceil(length/1.45);for(let i=0;i<=bays;i++){const p=point(i/bays);d.box(p.x,.59,p.z,.065,1.18,.065,'paper','detail');d.box(p.x,.15,p.z,.10,.04,.10,'wall','profile');}
    return d.finish();}
function guards(materials){const g=new THREE.Group();g.name='metro/guards';g.add(guardRun(materials,'metro/guard-far',[-2.73,0,-1.67],[2.87,0,-1.67]),guardRun(materials,'metro/guard-near',[-2.73,0,1.67],[2.87,0,1.67]),guardRun(materials,'metro/guard-end',[2.87,0,-1.67],[2.87,0,1.67]));return g;}
export function metroHandrailY(x){return .84-(x-METRO.stairStart)/METRO.tread*METRO.rise;}
function handrails(materials){const g=new THREE.Group();g.name='metro/handrails';for(const side of[-1,1]){const d=new KitDrawing(`metro/stair-rail-${side<0?'far':'near'}`,materials,'metro'),z=side*1.36,end=METRO.stairStart+METRO.steps*METRO.tread;
    rail(d,[-1.87,.84,z],[METRO.stairStart,.84,z]);rail(d,[METRO.stairStart,.84,z],[end,-.28,z]);rail(d,[end,-.28,z],[1.27,-.28,z]);
    for(const x of[-1.75,-1.05,-.15,.75,1.14]){const top=x<METRO.stairStart?.84:x>end?-.28:metroHandrailY(x);rail(d,[x,metroFloorAt(x),z],[x,top,z],.018);rail(d,[x,top-.14,z],[x,top-.14,side*1.48],.012,'wall');}
    g.add(d.finish());}return g;}
function canopy(materials){const g=new THREE.Group();g.name='metro/canopy';const d=new KitDrawing('metro/canopy-frame',materials,'metro'),glass=new KitDrawing('metro/canopy-glazing',materials,'metro');
    for(const x of[-2.72,-1.12])for(const z of[-1.62,1.62]){d.box(x,1.13,z,.075,2.26,.075,'paper','detail');d.box(x,.07,z,.13,.14,.13,'wall','profile');}
    for(const x of[-2.87,-1.01])d.box(x,2.24,0,.065,.09,3.54,'paper','ink');for(const z of[-1.77,1.77])d.box(-1.94,2.24,z,1.925,.09,.065,'paper','ink');
    for(let i=1;i<6;i++)d.box(-1.94,2.24,-1.77+i*.59,1.86,.045,.035,'wall','profile');
    for(let i=0;i<6;i++){const z=-1.7375+i*.59;glass.box(-1.94,2.255,z+.2775,1.795,.012,.555,'glass',false);}
    // Windbreaks sit only on the sides: no pane or rail crosses the approach.
    for(const z of[-1.62,1.62]){d.box(-1.92,.22,z,1.60,.035,.04,'wall','profile');d.box(-1.92,2.02,z,1.60,.035,.04,'wall','profile');for(const x of[-2.187,-1.653])d.box(x,1.12,z,.026,1.8,.035,'wall','profile');for(let i=0;i<3;i++)glass.box(-2.453+i*.533,1.12,z,.50,1.765,.012,'glass',false);}
    const panes=glass.finish();panes.traverse(o=>{if(o.isMesh)o.material=materials.glazing;});g.add(d.finish(),panes);return g;}
function sign(materials){const d=new KitDrawing('metro/sign',materials,'metro'),[x,y,z]=METRO.signCenter;d.box(x,1.335,z,.065,2.67,.065,'paper','detail');
    const turn=new THREE.Matrix4().makeRotationX(Math.PI/2);turn.setPosition(x,y,z);d.geometry(new THREE.CylinderGeometry(.37,.37,.055,64),turn,'accent',false);
    for(const side of[-1,1]){const zz=z+side*.0285;d.path(Array.from({length:64},(_,i)=>[x+Math.cos(i/64*Math.PI*2)*.37,y+Math.sin(i/64*Math.PI*2)*.37,zz]),'detail',true);
        // Geometry-only M, identical on both faces; no font or raster texture dependency.
        const shape=new THREE.Shape();const p=[[-.18,-.22],[-.18,.22],[-.115,.22],[0,-.055],[.115,.22],[.18,.22],[.18,-.22],[.12,-.22],[.12,.08],[.025,-.15],[-.025,-.15],[-.12,.08],[-.12,-.22]];shape.moveTo(...p[0]);for(const v of p.slice(1))shape.lineTo(...v);shape.closePath();const geo=new THREE.ShapeGeometry(shape);d.geometry(geo,move(x,y,zz),'#ffffff',false);
    }return d.finish();}
export function buildMetro(materials,variantId='standard'){
    if(variantId!=='standard')throw new Error(`Unknown metro variant: ${variantId}`);
    // A slight stroke bias keeps fine tread and frame edges stable against their faces.
    for(const weight of ['ink','detail','hair','profile']){const line=materials.line(weight,'metro');line.polygonOffset=true;line.polygonOffsetFactor=-1;line.polygonOffsetUnits=-1;}
    const group=new THREE.Group();group.name='metro-entrance/standard';group.add(structure(materials),guards(materials),handrails(materials),canopy(materials),sign(materials));
    group.userData={assetId:'metro-entrance',variantId,family:'metro',revision:METRO.revision,approval:'approved',placementStatus:'unplaced',static:true,steps:METRO.steps,clearWidth:METRO.clearWidth,groundCutout:[[-2.8,-1.47],[2.8,1.47]],partIds:METRO_PARTS.map(p=>p.id)};group.updateMatrixWorld(true);
    return{group,bounds:new THREE.Box3().setFromObject(group),anchors:{ground:new THREE.Vector3(),entrance:V([-2.8,0,0]),firstStep:V([-1.5,0,0]),lowerLanding:V([1.85,-1.12,0]),sign:V(METRO.signCenter),canopy:V([-1.94,2.24,0])}};
}
