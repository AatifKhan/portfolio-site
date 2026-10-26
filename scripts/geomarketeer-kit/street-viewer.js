import * as THREE from '../../assets/vendor/three/three.module.js';
import { createAssetLibrary } from './library.js';
import {STREET_REVISION, STREET_MASTERS} from './street.js';
import {createFenceReview} from './street-review.js';
import { CAMERA, KitDrawing } from './style.js';
import { REFERENCE } from './inventory.js';

const root=document.getElementById('streetStudy'),viewport=document.getElementById('streetViewport'),reference=document.getElementById('referenceArt');
const status=document.getElementById('sceneStatus'),labels=document.getElementById('boardLabels'),params=new URLSearchParams(location.search);
const media=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
const state={focus:params.get('focus')==='detail'?'detail':'whole',mode:['single','variants','copies','assembly','scale'].includes(params.get('mode'))?params.get('mode'):'single',variant:STREET_MASTERS.some(s=>s.id===params.get('variant'))?params.get('variant'):'lamp',angle:['front','side','rear'].includes(params.get('angle'))?params.get('angle'):'reference',orbit:0,zoom:1};
if(state.mode==='assembly')state.variant='fence-panel';
const target={orbit:0,zoom:1},scenes=new Map(),pads=new Set();
const actions=[...document.querySelectorAll('[data-action]')],modeButtons=[...document.querySelectorAll('[data-mode]')].filter(e=>e.tagName==='BUTTON');
let library,renderer,camera,observer,ready=false,frame=0,last=0,drag=null,touch=false;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const variant=()=>STREET_MASTERS.find(s=>s.id===state.variant);
const ANGLES={reference:{yaw:CAMERA.yaw,pitch:CAMERA.pitch},front:{yaw:0,pitch:0},side:{yaw:Math.PI/2,pitch:0},rear:{yaw:CAMERA.yaw+Math.PI,pitch:CAMERA.pitch}};
const selectedAngle=()=>ANGLES[state.angle];

for(const spec of STREET_MASTERS){
    const button=document.createElement('button');button.type='button';button.dataset.variant=spec.id;button.setAttribute('aria-pressed',String(spec.id===state.variant));
    const number=document.createElement('span');number.textContent=spec.number;button.append(number,document.createTextNode(spec.label));document.getElementById('variantPicks').append(button);
    const cell=document.createElement('div');cell.className='board-cell';
    const choose=document.createElement('button');choose.type='button';choose.dataset.variant=spec.id;choose.textContent=`${spec.number}  ${spec.label}`;
    const description=document.createElement('small');description.textContent=spec.subtitle;choose.append(description);cell.append(choose);labels.append(cell);
}
document.body.dataset.coarse=String(coarse.matches);

function makeScene(){
    library=createAssetLibrary();camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,250);
    for(const spec of STREET_MASTERS)for(const copies of[false,true]){
        const scene=new THREE.Scene();scene.background=new THREE.Color('white');
        const group=new THREE.Group();group.name=`review-only/${spec.id}${copies?'/copies':''}`;
        const master=library.createAsset({assetId:spec.assetId,variantId:spec.variantId});
        const width=master.bounds.max.x-master.bounds.min.x,spacing=Math.max(width*1.75,.8);
        for(let i=0;i<(copies?3:1);i++){
            const asset=i===0?master:library.createAsset({assetId:spec.assetId,variantId:spec.variantId,instanceId:`review-copy/${spec.id}/${i}`});
            asset.group.position.x=copies?(i-1)*spacing:0;group.add(asset.group);
            const draw=new KitDrawing(`review-pad/${spec.id}/${i}`,library.materials,'street-pad');
            const depth=master.bounds.max.z-master.bounds.min.z;
            draw.rounded(asset.group.position.x+.04,-.009,.03,width+.12,.004,depth+.1,Math.min(width,depth)*.45,'shadow',false);
            const pad=draw.finish();pad.traverse(o=>{if(o.geometry)pads.add(o.geometry);});group.add(pad);
        }
        scene.add(group);scene.updateMatrixWorld(true);scenes.set(`${copies?'copies/':''}${spec.id}`,{scene,bounds:new THREE.Box3().setFromObject(scene)});
    }
    const assembly=createFenceReview(library),scene=new THREE.Scene();scene.background=new THREE.Color('white');scene.add(assembly.group);
    const draw=new KitDrawing('review-pad/fence-assembly',library.materials,'street-pad'),size=assembly.bounds.getSize(new THREE.Vector3());draw.rounded(0,-.009,.03,size.x+.12,.004,size.z+.12,.08,'shadow',false);const pad=draw.finish();pad.traverse(o=>{if(o.geometry)pads.add(o.geometry);});scene.add(pad);scene.updateMatrixWorld(true);scenes.set('assembly',{scene,bounds:new THREE.Box3().setFromObject(scene)});
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
        const narrow=matchMedia('(max-width: 650px)').matches,cols=narrow?2:3,rows=STREET_MASTERS.length/cols,cw=w/cols,ch=h/rows,contentHeight=ch-62;
        for(const[index,spec]of STREET_MASTERS.entries()){
            const categorySpan=Math.max(...STREET_MASTERS.map(s=>framing(scenes.get(s.id),cw/contentHeight).span));
            draw(scenes.get(spec.id),{x:index%cols*cw,y:h-(Math.floor(index/cols)+1)*ch+62,width:cw,height:contentHeight},categorySpan);
        }
    }else{
        const ratio=Math.min(reference.clientWidth/REFERENCE.width,reference.clientHeight/REFERENCE.height);
        const original=scenes.get(state.mode==='assembly'?'assembly':`${state.mode==='copies'?'copies/':''}${state.variant}`),entry=state.mode==='single'&&state.focus==='detail'?{...original,bounds:new THREE.Box3(...variant().detailBounds.map(p=>new THREE.Vector3(...p)))}:original;
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
    const spec=variant(),all=state.mode==='variants',copies=state.mode==='copies',assembly=state.mode==='assembly';Object.assign(target,{orbit:0,zoom:1});Object.assign(state,target);Object.assign(root.dataset,{mode:state.mode,variant:spec.id,angle:state.angle,focus:state.focus});
    for(const button of document.querySelectorAll('button[data-angle]'))button.setAttribute('aria-pressed',String(button.dataset.angle===state.angle));
    for(const button of document.querySelectorAll('button[data-focus]')){button.setAttribute('aria-pressed',String(button.dataset.focus===state.focus));button.disabled=state.mode!=='single';}
    for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode));
    for(const button of document.querySelectorAll('#variantPicks button'))button.setAttribute('aria-pressed',String(!all&&button.dataset.variant===state.variant));
    const crop=state.mode==='scale'?[0,0,REFERENCE.width,REFERENCE.height]:spec.referenceCrop;
    reference.setAttribute('viewBox',crop.join(' '));for(const[index,name]of['x','y','width','height'].entries())document.getElementById('sourceCropRect').setAttribute(name,crop[index]);
    reference.setAttribute('aria-label',`Illustration reference for ${spec.label}`);
    labels.hidden=!all;document.getElementById('liveCaption').textContent=all?'Street furniture':assembly?'Three panels · four posts':copies?`${spec.label} · three copies`:state.mode==='single'&&state.focus==='detail'?`${spec.label} · detail`:spec.label;
    document.getElementById('referenceCaption').textContent=spec.referenceLabel;document.getElementById('referenceNote').textContent=spec.inferred?'Street context only · bin design inferred':'Your reference · repeated street details';
    document.getElementById('modeNote').textContent=all?'One shared scale across all six components.':state.mode==='scale'?'Readability at the full illustration’s scale.':assembly?'Repeated panels joined at the shared post anchors.':copies?'Three instances of the same shared geometry.':spec.subtitle;
    document.getElementById('liveNote').textContent=all?'Select any component to inspect its reference and geometry':'Drag to turn · This component remains unplaced';
    document.getElementById('variantNumber').textContent=all?'Six reusable masters':assembly?'Review assembly':`${spec.number} / ${spec.category}`;
    document.getElementById('variantTitle').textContent=all?'The details along every street.':assembly?'A fence that fits together.':spec.label;
    document.getElementById('variantDescription').textContent=all?'Lamps, bollards, benches, bins, fence panels and gateposts. One standard master for each component, with shared geometry across every copy. All remain unplaced for review.':assembly?'Three identical panels connect to four identical gateposts using the same attachment points. This is an isolated construction preview; it adds no neighborhood placements.':spec.description;
    document.getElementById('baseValue').textContent=all?'Six shared masters':assembly?'Panel + post':spec.label;document.getElementById('sizeValue').textContent=all?'One standard per component':assembly?'Three panels · four posts':spec.subtitle;
    status.textContent=`${all?'All components':spec.label}. View reset.`;resize();
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
    const still=document.getElementById('fallbackStill');still.src=`assets/portfolio/geomarketeer/component-kit/street-${state.variant}-still.jpg?v=${STREET_REVISION}`;still.hidden=false;
    document.getElementById('sceneLoading').hidden=true;document.getElementById('sceneError').hidden=false;
    for(const button of document.querySelectorAll('main button'))button.disabled=button.dataset.action!=='reload';
    document.querySelector('.live-label').textContent='STILL PREVIEW';document.getElementById('liveCaption').textContent=`${variant().label} · saved preview`;
    viewport.setAttribute('aria-label','Saved street preview. Interactive controls are unavailable.');document.getElementById('liveNote').textContent='Saved rendering at the reference angle';status.textContent='Showing the saved street preview.';
}
root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.action)action(button.dataset.action);if(!ready)return;
    if(button.dataset.variant){
        const fromBoard=button.closest?.('#boardLabels');
        state.variant=button.dataset.variant;state.mode='single';state.focus='whole';updateView();
        if(fromBoard){viewport.focus({preventScroll:true});viewport.scrollIntoView({block:'center',behavior:'auto'});}
    }else if(button.dataset.mode){state.mode=button.dataset.mode;state.focus='whole';if(state.mode==='assembly')state.variant='fence-panel';updateView();}
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
window.addEventListener('pagehide',event=>{cancelAnimationFrame(frame);frame=0;if(!event.persisted){ready=false;observer?.disconnect();for(const geometry of pads)geometry.dispose();library?.dispose();renderer?.dispose();}});window.addEventListener('pageshow',event=>{if(event.persisted)resize();});

try{
    updateView();
    if(params.get('view')==='still')fail();
    else{
        renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=false;renderer.info.autoReset=false;
        renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive blue-outline street furniture');viewport.prepend(renderer.domElement);
        makeScene();ready=true;updateView();document.getElementById('sceneLoading').hidden=true;resize();observer=new ResizeObserver(resize);observer.observe(viewport);
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    }
}catch(error){fail(error);}
