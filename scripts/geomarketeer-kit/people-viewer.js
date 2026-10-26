import * as THREE from '../../assets/vendor/three/three.module.js';
import { createAssetLibrary } from './library.js';
import { PERSON_BASE, PERSON_POSES } from './people.js';
import {createPeopleReview} from './people-review.js';
import { CAMERA, KitDrawing } from './style.js';
import { REFERENCE } from './inventory.js';

const root=document.getElementById('peopleStudy'),viewport=document.getElementById('peopleViewport'),reference=document.getElementById('referenceArt');
const status=document.getElementById('sceneStatus'),labels=document.getElementById('boardLabels'),params=new URLSearchParams(location.search);
const media=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
const state={mode:['single','variants','scale'].includes(params.get('mode'))?params.get('mode'):'single',variant:PERSON_POSES.some(s=>s.id===params.get('variant'))?params.get('variant'):'standing',angle:['side','rear'].includes(params.get('angle'))?params.get('angle'):'reference',support:params.get('support')!=='off',orbit:0,zoom:1};
const target={orbit:0,zoom:1},scenes=new Map(),pads=new Set();
const actions=[...document.querySelectorAll('[data-action]')],modeButtons=[...document.querySelectorAll('[data-mode]')].filter(e=>e.tagName==='BUTTON');
let library,renderer,camera,observer,ready=false,frame=0,last=0,drag=null,touch=false;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const variant=()=>PERSON_POSES.find(s=>s.id===state.variant);
const ANGLES={reference:{yaw:CAMERA.yaw,pitch:CAMERA.pitch},side:{yaw:0,pitch:0},rear:{yaw:-Math.PI/4,pitch:Math.PI/6}};
const selectedAngle=()=>ANGLES[state.angle];

for(const spec of PERSON_POSES){
    const button=document.createElement('button');button.type='button';button.dataset.variant=spec.id;button.setAttribute('aria-pressed',String(spec.id===state.variant));
    const number=document.createElement('span');number.textContent=spec.number;button.append(number,document.createTextNode(spec.label));document.getElementById('variantPicks').append(button);
    const cell=document.createElement('div');cell.className='board-cell';
    const choose=document.createElement('button');choose.type='button';choose.dataset.variant=spec.id;choose.textContent=`${spec.number}  ${spec.label}`;
    const description=document.createElement('small');description.textContent=spec.subtitle;choose.append(description);cell.append(choose);labels.append(cell);
}
document.body.dataset.coarse=String(coarse.matches);

function makeScene(){
    library=createAssetLibrary();camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,250);
    for(const spec of PERSON_POSES){
        const review=createPeopleReview(library,spec.id),scene=new THREE.Scene();scene.background=new THREE.Color('white');scene.add(review.group);
        for(const geometry of review.owned)pads.add(geometry);
        const bounds=new THREE.Box3().setFromObject(review.group),min=bounds.min,max=bounds.max;
        const draw=new KitDrawing(`review-pad/${spec.id}`,library.materials,'people-pad');
        draw.rounded((min.x+max.x)/2+.08,-.009,(min.z+max.z)/2+.03,max.x-min.x+.16,.004,max.z-min.z+.14,.15,'shadow',false);
        const pad=draw.finish();pad.traverse(o=>{if(o.geometry)pads.add(o.geometry);});scene.add(pad);
        scene.updateMatrixWorld(true);scenes.set(spec.id,{scene,bounds:new THREE.Box3().setFromObject(scene),personBounds:review.person.bounds,review,pad});
    }
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
        const narrow=matchMedia('(max-width: 650px)').matches,cols=narrow?1:3,rows=Math.ceil(PERSON_POSES.length/cols),cw=w/cols,ch=h/rows,contentHeight=ch-62;
        const commonSpan=Math.max(...[...scenes.values()].map(entry=>framing(entry,cw/contentHeight).span));
        for(const[index,spec]of PERSON_POSES.entries())draw(scenes.get(spec.id),{x:narrow?0:(index<3?index:index-3+.5)*cw,y:h-(Math.floor(index/cols)+1)*ch+62,width:cw,height:contentHeight},commonSpan);
    }else{
        const ratio=Math.min(reference.clientWidth/REFERENCE.width,reference.clientHeight/REFERENCE.height);
        const entry=scenes.get(state.variant),bounds=state.support||!entry.review.support?entry.bounds:entry.personBounds;
        draw({...entry,bounds},{x:0,y:0,width:w,height:h},state.mode==='scale'?h/(ratio*REFERENCE.pixelsPerUnit):undefined);
    }
    renderer.setScissorTest(false);
    Object.assign(root.dataset,{state:'ready',mode:state.mode,variant:state.variant,angle:state.angle,support:String(state.support),orbit:state.orbit.toFixed(2),zoom:state.zoom.toFixed(2),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles)});
    document.getElementById('orbitOutput').value=`${Math.round(state.orbit)}°`;document.getElementById('zoomOutput').value=`${Math.round(state.zoom*100)}%`;
    for(const button of actions){const a=button.dataset.action;button.disabled=(a==='left'&&target.orbit<=-15)||(a==='right'&&target.orbit>=15)||(a==='out'&&target.zoom<=1)||(a==='in'&&target.zoom>=3);}
}
function resize(){if(!ready||!viewport.clientWidth||!viewport.clientHeight)return;renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);render();}
function tick(now){frame=0;if(!ready||document.hidden)return;const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;const t=media.matches||drag?1:1-Math.exp(-dt*12);let moving=false;for(const key of['orbit','zoom']){if(Math.abs(target[key]-state[key])>.001){state[key]+=(target[key]-state[key])*t;moving=true;}else state[key]=target[key];}render();if(moving)frame=requestAnimationFrame(tick);}
function wake(){if(!ready||frame||document.hidden)return;last=performance.now();frame=requestAnimationFrame(tick);}
function updateView(){
    const spec=variant(),all=state.mode==='variants';Object.assign(target,{orbit:0,zoom:1});Object.assign(state,target);Object.assign(root.dataset,{mode:state.mode,variant:spec.id,angle:state.angle,support:String(state.support)});
    for(const entry of scenes.values()){if(entry.review.support)entry.review.support.visible=state.support;entry.pad.visible=state.support||!entry.review.support;}
    for(const button of document.querySelectorAll('button[data-angle]'))button.setAttribute('aria-pressed',String(button.dataset.angle===state.angle));
    const supportButton=document.getElementById('supportToggle');supportButton.setAttribute('aria-pressed',String(state.support));supportButton.disabled=!all&&!spec.support;supportButton.textContent=state.support?'Chair & vehicles visible':'Show chair & vehicles';
    for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode));
    for(const button of document.querySelectorAll('#variantPicks button'))button.setAttribute('aria-pressed',String(!all&&button.dataset.variant===state.variant));
    const crop=state.mode==='scale'?[0,0,REFERENCE.width,REFERENCE.height]:spec.referenceCrop;
    reference.setAttribute('viewBox',crop.join(' '));for(const[index,name]of['x','y','width','height'].entries())document.getElementById('sourceCropRect').setAttribute(name,crop[index]);
    reference.setAttribute('aria-label',`Illustration reference for ${spec.label}`);
    labels.hidden=!all;document.getElementById('liveCaption').textContent=all?'Four poses · two riding fits':spec.label;
    document.getElementById('referenceCaption').textContent=spec.referenceLabel;
    document.getElementById('modeNote').textContent=all?'One set of proportions across every pose.':state.mode==='scale'?'Readability at the full illustration’s scale.':spec.subtitle;
    document.getElementById('liveNote').textContent=all?'Same camera scale · Select a pose to inspect':'Drag to turn · Approved pose · remains unplaced';
    document.getElementById('variantNumber').textContent=all?'One reusable person':`${spec.number} / ${spec.category}`;
    document.getElementById('variantTitle').textContent=all?'A shared base. Every pose.':spec.label;
    document.getElementById('variantDescription').textContent=all?'Standing, walking, seated and riding use the same head, torso and limb proportions. Riding includes separate fits for the approved scooter and bicycle.':spec.description;
    document.getElementById('baseValue').textContent='One person master';document.getElementById('poseValue').textContent=all?'Four poses · two riding fits':spec.label;
    status.textContent=`${all?'All poses':spec.label}. View reset.`;resize();
}
function action(name){
    if(name==='reload'){const url=new URL(location.href);url.searchParams.delete('view');location.replace(url.href);return;}if(!ready)return;
    if(name==='left')target.orbit=clamp(target.orbit-3,-15,15);if(name==='right')target.orbit=clamp(target.orbit+3,-15,15);
    if(name==='in')target.zoom=clamp(target.zoom+.25,1,3);if(name==='out')target.zoom=clamp(target.zoom-.25,1,3);if(name==='reset'){updateView();return;}
    status.textContent=`${target.orbit} degrees orbit. ${Math.round(target.zoom*100)} percent zoom.`;wake();
}
function fail(error){
    if(error)console.error(error);ready=false;cancelAnimationFrame(frame);frame=0;state.mode='single';state.angle='reference';state.support=true;updateView();root.dataset.state='fallback';
    if(renderer)renderer.domElement.hidden=true;
    const still=document.getElementById('fallbackStill');still.src=`assets/portfolio/geomarketeer/component-kit/person-${state.variant}-still.jpg?v=${PERSON_BASE.revision}`;still.hidden=false;
    document.getElementById('sceneLoading').hidden=true;document.getElementById('sceneError').hidden=false;
    for(const button of document.querySelectorAll('main button'))button.disabled=button.dataset.action!=='reload';
    document.querySelector('.live-label').textContent='STILL PREVIEW';document.getElementById('liveCaption').textContent=`${variant().label} · saved preview`;
    viewport.setAttribute('aria-label','Saved person preview. Interactive controls are unavailable.');document.getElementById('liveNote').textContent='Saved rendering with its review support';status.textContent='Showing the saved person preview.';
}
root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.action)action(button.dataset.action);if(!ready)return;
    if(button.dataset.variant){
        const fromBoard=button.closest?.('#boardLabels');
        state.variant=button.dataset.variant;state.mode='single';updateView();
        if(fromBoard){viewport.focus({preventScroll:true});viewport.scrollIntoView({block:'center',behavior:'auto'});}
    }else if(button.dataset.mode){state.mode=button.dataset.mode;updateView();}
    else if(button.dataset.angle){state.angle=button.dataset.angle;updateView();}
    else if(button.id==='supportToggle'){state.support=!state.support;updateView();}
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
        renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive blue-outline person poses');viewport.prepend(renderer.domElement);
        makeScene();ready=true;updateView();document.getElementById('sceneLoading').hidden=true;resize();observer=new ResizeObserver(resize);observer.observe(viewport);
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    }
}catch(error){fail(error);}
