import * as THREE from '../../assets/vendor/three/three.module.js';
import { createAssetLibrary } from './library.js';
import {GROUND,GROUND_VARIANTS} from './ground.js';
import {createGroundReview} from './ground-review.js';
import { CAMERA } from './style.js';
import { REFERENCE } from './inventory.js';

const root=document.getElementById('groundStudy'),viewport=document.getElementById('groundViewport'),reference=document.getElementById('referenceArt');
const status=document.getElementById('sceneStatus'),labels=document.getElementById('boardLabels'),params=new URLSearchParams(location.search);
const media=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
const state={focus:params.get('focus')==='detail'?'detail':'whole',mode:['single','variants','street','parking','metro','scale'].includes(params.get('mode'))?params.get('mode'):'variants',variant:GROUND_VARIANTS.some(s=>s.id===params.get('variant'))?params.get('variant'):'road-straight',angle:['top','low','rear'].includes(params.get('angle'))?params.get('angle'):'reference',orbit:0,zoom:1};
const target={orbit:0,zoom:1},scenes=new Map();
const actions=[...document.querySelectorAll('[data-action]')],modeButtons=[...document.querySelectorAll('[data-mode]')].filter(e=>e.tagName==='BUTTON');
let library,renderer,camera,observer,ready=false,frame=0,last=0,drag=null,touch=false;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const variant=()=>GROUND_VARIANTS.find(s=>s.id===state.variant);
const ANGLES={reference:{yaw:CAMERA.yaw,pitch:CAMERA.pitch},top:{yaw:0,pitch:Math.PI/2-.001},low:{yaw:CAMERA.yaw,pitch:Math.PI/18},rear:{yaw:CAMERA.yaw+Math.PI,pitch:CAMERA.pitch}};
const selectedAngle=()=>ANGLES[state.angle];

for(const spec of GROUND_VARIANTS){
    const button=document.createElement('button');button.type='button';button.dataset.variant=spec.id;button.setAttribute('aria-pressed',String(spec.id===state.variant));
    const number=document.createElement('span');number.textContent=spec.number;button.append(number,document.createTextNode(spec.label));document.getElementById('variantPicks').append(button);
    const cell=document.createElement('div');cell.className='board-cell';
    const choose=document.createElement('button');choose.type='button';choose.dataset.variant=spec.id;choose.textContent=`${spec.number}  ${spec.label}`;
    const description=document.createElement('small');description.textContent=spec.subtitle;choose.append(description);cell.append(choose);labels.append(cell);
}
document.body.dataset.coarse=String(coarse.matches);

function makeScene(){
    library=createAssetLibrary();camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,250);
    for(const spec of GROUND_VARIANTS){const entry=createGroundReview(library,'single',spec),scene=new THREE.Scene();scene.background=new THREE.Color('white');scene.add(entry.group);scenes.set(spec.id,{scene,bounds:entry.bounds});}
    for(const kind of ['street','parking','metro']){const entry=createGroundReview(library,kind),scene=new THREE.Scene();scene.background=new THREE.Color('white');scene.add(entry.group);scenes.set(kind,{scene,bounds:entry.bounds});}
}
function detailBounds(spec){
    let a,b;
    if(spec.id==='pavement-ramp'){a=[-1.65,-.19,-1.15];b=[1.65,.05,.1];}
    else if(spec.id==='pavement-metro'){a=[-3.05,-.2,-1.65];b=[3.05,.05,1.65];}
    else if(spec.assetId==='courtyard'){a=[1.6,-.06,-.65];b=[2.5,.10,.65];}
    else if(spec.assetId==='kerb'){a=[-.42,-.15,-.10];b=[.42,.05,.10];}
    else if(spec.assetId==='road'){a=[-1.5,-.2,1.9];b=[1.5,-.08,2.4];}
    else {a=[-1.4,-.19,-1.15];b=[1.4,.05,1.15];}
    return new THREE.Box3(new THREE.Vector3(...a),new THREE.Vector3(...b));
}
function framing(entry,aspect){
    const box=entry.bounds,center=box.getCenter(new THREE.Vector3());let ex=0,ey=0;
    for(const angle of[-15,0,15]){
        const yaw=selectedAngle().yaw+angle*Math.PI/180,right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),up=new THREE.Vector3(-Math.sin(yaw)*Math.sin(selectedAngle().pitch),Math.cos(selectedAngle().pitch),-Math.cos(yaw)*Math.sin(selectedAngle().pitch));
        for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).sub(center);ex=Math.max(ex,Math.abs(p.dot(right)));ey=Math.max(ey,Math.abs(p.dot(up)));}
    }
    return{center,span:Math.max(ey*2,ex*2/aspect)*1.06};
}
function draw(entry,rect,spanOverride){
    const{width:w,height:h,x,y}=rect,{center,span}=framing(entry,w/h),vertical=spanOverride||span,yaw=selectedAngle().yaw+state.orbit*Math.PI/180;
    camera.left=-vertical*w/h/2;camera.right=vertical*w/h/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.zoom=state.zoom;
    camera.position.copy(center).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(selectedAngle().pitch)*85,Math.sin(selectedAngle().pitch)*85,Math.cos(yaw)*Math.cos(selectedAngle().pitch)*85));camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    renderer.setViewport(x,y,w,h);renderer.setScissor(x,y,w,h);library.materials.resize(w,h,vertical,state.zoom);renderer.render(entry.scene,camera);
}
function render(){
    if(!ready||!viewport.clientWidth||!viewport.clientHeight)return;
    const w=viewport.clientWidth,h=viewport.clientHeight;renderer.info.reset();renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clear();renderer.setScissorTest(true);
    if(state.mode==='variants'){
        const narrow=matchMedia('(max-width: 650px)').matches,cols=narrow?2:3,rows=Math.ceil(GROUND_VARIANTS.length/cols),cw=w/cols,ch=h/rows,contentHeight=ch-62;
        for(const[index,spec]of GROUND_VARIANTS.entries())draw(scenes.get(spec.id),{x:(index%cols)*cw,y:h-(Math.floor(index/cols)+1)*ch+62,width:cw,height:contentHeight});
    }else{
        const ratio=Math.min(reference.clientWidth/REFERENCE.width,reference.clientHeight/REFERENCE.height),assembly=['street','parking','metro'].includes(state.mode);
        const original=scenes.get(assembly?state.mode:state.variant),entry=state.mode==='single'&&state.focus==='detail'?{...original,bounds:detailBounds(variant())}:original;
        draw(entry,{x:0,y:0,width:w,height:h},state.mode==='scale'?h/(ratio*REFERENCE.pixelsPerUnit):undefined);
    }
    renderer.setScissorTest(false);
    Object.assign(root.dataset,{state:'ready',mode:state.mode,variant:state.variant,angle:state.angle,focus:state.focus,orbit:state.orbit.toFixed(2),zoom:state.zoom.toFixed(2),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles)});
    document.getElementById('orbitOutput').value=`${Math.round(state.orbit)}°`;document.getElementById('zoomOutput').value=`${Math.round(state.zoom*100)}%`;
    for(const button of actions){const a=button.dataset.action;button.disabled=(a==='left'&&target.orbit<=-15)||(a==='right'&&target.orbit>=15)||(a==='out'&&target.zoom<=1)||(a==='in'&&target.zoom>=3);}
}
function resize(){if(!ready||!viewport.clientWidth||!viewport.clientHeight)return;renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);render();}
function tick(now){frame=0;if(!ready||document.hidden)return;const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;const t=media.matches||drag?1:1-Math.exp(-dt*12);let moving=false;for(const key of['orbit','zoom']){if(Math.abs(target[key]-state[key])>.001){state[key]+=(target[key]-state[key])*t;moving=true;}else state[key]=target[key];}render();if(moving)frame=requestAnimationFrame(tick);}
function wake(){if(!ready||frame||document.hidden)return;last=performance.now();frame=requestAnimationFrame(tick);}
function updateView(){
    const spec=variant(),all=state.mode==='variants',assembly=['street','parking','metro'].includes(state.mode);
    Object.assign(target,{orbit:0,zoom:1});Object.assign(state,target);Object.assign(root.dataset,{mode:state.mode,variant:spec.id,angle:state.angle,focus:state.focus});
    for(const button of document.querySelectorAll('button[data-angle]'))button.setAttribute('aria-pressed',String(button.dataset.angle===state.angle));
    for(const button of document.querySelectorAll('button[data-focus]')){button.setAttribute('aria-pressed',String(button.dataset.focus===state.focus));button.disabled=state.mode!=='single';}
    for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode));
    for(const button of document.querySelectorAll('#variantPicks button'))button.setAttribute('aria-pressed',String(!all&&!assembly&&button.dataset.variant===state.variant));
    const names={street:'Crossing fit',parking:'Parking fit',metro:'Metro fit'};
    const crops={street:[412,547,221,199],parking:[860,586,296,203],metro:[1140,470,296,238]};
    const crop=state.mode==='scale'?[0,0,REFERENCE.width,REFERENCE.height]:assembly?crops[state.mode]:spec.crop;
    reference.setAttribute('viewBox',crop.join(' '));for(const[index,name]of['x','y','width','height'].entries())document.getElementById('sourceCropRect').setAttribute(name,crop[index]);
    reference.setAttribute('aria-label',`Reference for ${assembly?names[state.mode]:spec.label}`);
    labels.hidden=!all;document.getElementById('liveCaption').textContent=all?'Ground & courtyard kit':assembly?names[state.mode]:spec.label;
    document.getElementById('referenceCaption').textContent=assembly?names[state.mode]:spec.label;
    document.getElementById('referenceNote').textContent='Your reference · shared surfaces and markings';
    document.getElementById('modeNote').textContent=all?'Each component framed for inspection; select one to compare.':assembly?'Isolated fit check · no neighborhood placement':state.mode==='scale'?'Readability at the illustration’s scale.':state.focus==='detail'?'Inspect the surface and edge detail.':'Compare the component with its source crop.';
    document.getElementById('liveNote').textContent=all?'Select a component for its reference and close-up':assembly?'Approved context components · review arrangement only':'Drag to turn · All ground components remain unplaced';
    document.getElementById('variantNumber').textContent=assembly?'11 / Fit check':`${spec.number} / Ground & courtyard`;
    document.getElementById('variantTitle').textContent=all?'The surfaces between everything.':assembly?names[state.mode]:spec.label;
    const descriptions={street:'The same road, crossing and lane dash meet two mirrored lowered pavement edges. The crossing stays clear of centerline markings.',parking:'Four identical bay markings use one spacing. Three approved hatchback copies show the clearance and ground contact; the fourth bay stays empty.',metro:'The approved ground component shares the pavement’s grade. A real opening preserves the stairs and lower landing; paving lines stop at its edge.'};
    document.getElementById('variantDescription').textContent=all?'Eleven configurations share seven component masters, one pavement grid and one grade system. Small markings include a road backdrop for readability.':assembly?descriptions[state.mode]:spec.description;
    document.getElementById('baseValue').textContent=all?'Seven masters · eleven configurations':assembly?'Shared components, fitted together':spec.assetId;
    document.getElementById('sizeValue').textContent=all?'Individual inspection scale':assembly?'Original component dimensions':spec.size;
    status.textContent='Ground view reset.';resize();
}

function action(name){
    if(name==='reload'){const url=new URL(location.href);url.searchParams.delete('view');location.replace(url.href);return;}if(!ready)return;
    if(name==='left')target.orbit=clamp(target.orbit-3,-15,15);if(name==='right')target.orbit=clamp(target.orbit+3,-15,15);
    if(name==='in')target.zoom=clamp(target.zoom+.25,1,3);if(name==='out')target.zoom=clamp(target.zoom-.25,1,3);if(name==='reset'){state.focus='whole';updateView();return;}
    status.textContent=`${target.orbit} degrees orbit. ${Math.round(target.zoom*100)} percent zoom.`;wake();
}
function fail(error){
    if(error)console.error(error);ready=false;cancelAnimationFrame(frame);frame=0;state.mode='single';state.angle='reference';state.focus='whole';updateView();root.dataset.state='fallback';
    if(renderer)renderer.domElement.hidden=true;
    const still=document.getElementById('fallbackStill');still.src=`assets/portfolio/geomarketeer/component-kit/ground-${state.variant}-still.jpg?v=${GROUND.revision}`;still.hidden=false;
    document.getElementById('sceneLoading').hidden=true;document.getElementById('sceneError').hidden=false;
    for(const button of document.querySelectorAll('main button'))button.disabled=button.dataset.action!=='reload';
    document.querySelector('.live-label').textContent='STILL PREVIEW';document.getElementById('liveCaption').textContent=variant().label+' · saved preview';
    viewport.setAttribute('aria-label','Saved ground component preview. Interactive controls are unavailable.');document.getElementById('liveNote').textContent='Saved rendering at the reference angle';status.textContent='Showing the saved ground component preview.';
}
root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.action)action(button.dataset.action);if(!ready)return;
    if(button.dataset.variant){
        const fromBoard=button.closest?.('#boardLabels');
        state.variant=button.dataset.variant;state.mode='single';state.focus='whole';updateView();
        if(fromBoard){viewport.focus({preventScroll:true});viewport.scrollIntoView({block:'center',behavior:'auto'});}
    }else if(button.dataset.mode){state.mode=button.dataset.mode;state.focus='whole';updateView();}
    else if(button.dataset.angle){state.angle=button.dataset.angle;updateView();}
    else if(button.dataset.focus&&state.mode==='single'){state.focus=button.dataset.focus;updateView();}
});
document.getElementById('touchExplore').addEventListener('click',event=>{if(!ready)return;touch=!touch;viewport.classList.toggle('touch-explore',touch);event.currentTarget.setAttribute('aria-pressed',String(touch));event.currentTarget.textContent=touch?'Finish touch exploration':'Explore by touch';});
viewport.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey)return;const name={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out','0':'reset',Home:'reset'}[event.key];if(name){event.preventDefault();action(name);}});
viewport.addEventListener('pointerdown',event=>{if(!ready||event.target.closest('button')||event.button!==0||!event.isPrimary||(event.pointerType==='touch'&&!touch))return;drag={id:event.pointerId,x:event.clientX,orbit:state.orbit,moved:false};Object.assign(target,{orbit:state.orbit,zoom:state.zoom});});
viewport.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;if(!drag.moved&&Math.abs(event.clientX-drag.x)<4)return;if(!drag.moved){viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');drag.moved=true;}state.orbit=target.orbit=clamp(drag.orbit-(event.clientX-drag.x)*.10,-15,15);wake();});
function release(event){if(!drag||event.pointerId!==drag.id)return;drag=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);wake();}
for(const name of['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,release);viewport.addEventListener('pointerleave',event=>{if(drag&&!drag.moved)release(event);});
viewport.addEventListener('wheel',event=>{if(!ready||(!event.ctrlKey&&!event.metaKey))return;event.preventDefault();target.zoom=clamp(target.zoom-event.deltaY*.002,1,3);wake();},{passive:false});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});media.addEventListener('change',()=>{if(media.matches){Object.assign(state,target);render();}wake();});
window.addEventListener('pagehide',event=>{cancelAnimationFrame(frame);frame=0;if(!event.persisted){ready=false;observer?.disconnect();library?.dispose();renderer?.dispose();}});window.addEventListener('pageshow',event=>{if(event.persisted)resize();});

try{
    updateView();
    if(params.get('view')==='still')fail();
    else{
        renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=false;renderer.info.autoReset=false;
        renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive blue-outline ground component');viewport.prepend(renderer.domElement);
        makeScene();ready=true;updateView();document.getElementById('sceneLoading').hidden=true;resize();observer=new ResizeObserver(resize);observer.observe(viewport);
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    }
}catch(error){fail(error);}
