import * as THREE from '../../assets/vendor/three/three.module.js';
import { createAssetLibrary } from './library.js';
import { CAMERA, KitDrawing } from './style.js';
import { REFERENCE, FAMILIES, TOWER_INSTANCES } from './inventory.js';

const root=document.getElementById('componentStudy'),viewport=document.getElementById('kitViewport');
const reference=document.getElementById('referenceArt'),status=document.getElementById('sceneStatus');
const buttons=[...document.querySelectorAll('[data-action]')],modes=[...document.querySelectorAll('[data-view]')];
const media=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
const params=new URLSearchParams(location.search);
const state={orbit:0,zoom:1,mode:['master','repeat','scale'].includes(params.get('mode'))?params.get('mode'):'master'};
const target={orbit:0,zoom:1};
let library,renderer,camera,scene,solo,repeated,frame=0,lastTime=0,ready=false,drag=null,touch=false,observer;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const ownedGeometries=new Set();

// Review status is maintained in source; viewing a component never approves it.
for(const family of FAMILIES){
    const row=document.createElement('div');row.className='family-row';
    const name=document.createElement('strong');name.textContent=family.name;name.style.fontWeight='400';
    const label=document.createElement('span');label.textContent=family.status==='approved'?'Approved':family.status==='awaiting-review'?'In review':'Planned';row.append(name,label);
    document.getElementById('familyList').append(row);
}
for(const[no,spec]of TOWER_INSTANCES.entries()){
    const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');
    const[x,y,w,h]=spec.sourceBounds;
    const rect=document.createElementNS(ns,'rect');for(const[k,v]of Object.entries({x,y,width:w,height:h,rx:8,fill:'#244dff','fill-opacity':'.025',stroke:'#244dff','stroke-width':2,'stroke-dasharray':'7 5'}))rect.setAttribute(k,v);
    const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',x+14);circle.setAttribute('cy',y+16);circle.setAttribute('r',16);circle.setAttribute('fill','#244dff');
    const text=document.createElementNS(ns,'text');text.setAttribute('x',x+14);text.setAttribute('y',y+22);text.setAttribute('text-anchor','middle');text.setAttribute('fill','white');text.setAttribute('font-size','18');text.textContent=String(no+1);g.append(rect,circle,text);document.getElementById('instanceMarkers').append(g);
}
document.body.dataset.coarse=String(coarse.matches);

function pad(name,x,z){
    const draw=new KitDrawing(name,library.materials,'ground');
    draw.quad([[x-1.85,-.04,z-2.05],[x+2.4,-.04,z-2.05],[x+3.1,-.04,z+2.75],[x-1.15,-.04,z+2.75]],'shadow',false);
    draw.box(x,-.035,z,3.8,.045,4.5,'#f9fbff',false);
    const group=draw.finish();group.traverse(object=>{if(object.geometry)ownedGeometries.add(object.geometry);});return group;
}

function makeScene(){
    library=createAssetLibrary();scene=new THREE.Scene();scene.background=new THREE.Color('white');
    solo=new THREE.Group();solo.name='master-preview';
    solo.add(library.createAsset({assetId:'residential-tower',instanceId:'master-preview-tower'}).group,pad('master-pad',0,0));
    repeated=new THREE.Group();repeated.name='five-copy-preview';
    for(const spec of TOWER_INSTANCES){const asset=library.createAsset({assetId:spec.assetId,variantId:spec.variantId,instanceId:spec.id});asset.group.position.fromArray(spec.position);asset.group.rotation.y=spec.rotation;repeated.add(asset.group,pad(`${spec.id}/pad`,spec.position[0],spec.position[2]));}
    scene.add(solo,repeated);camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,250);
}

function cameraFrame(){
    const group=state.mode==='repeat'?repeated:solo;
    group.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(group),center=box.getCenter(new THREE.Vector3());
    const w=viewport.clientWidth,h=viewport.clientHeight,aspect=w/h;
    // Fit both orbit endpoints up front, so turning never changes the framing.
    let extentX=0,extentY=0;
    for(const angle of[-15,0,15]){
        const yaw=CAMERA.yaw+angle*Math.PI/180;
        const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
        const up=new THREE.Vector3(-Math.sin(yaw)*Math.sin(CAMERA.pitch),Math.cos(CAMERA.pitch),-Math.cos(yaw)*Math.sin(CAMERA.pitch));
        for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){
            const p=new THREE.Vector3(x,y,z).sub(center);extentX=Math.max(extentX,Math.abs(p.dot(right)));extentY=Math.max(extentY,Math.abs(p.dot(up)));
        }
    }
    let span=Math.max(extentY*2,extentX*2/aspect)*(state.mode==='repeat'?1.10:1.0);
    if(state.mode==='scale'){
        const sourceScale=Math.min(reference.clientWidth/REFERENCE.width,reference.clientHeight/REFERENCE.height);
        span=h/(sourceScale*REFERENCE.pixelsPerUnit);
    }
    return {span,center,w,h,aspect};
}
function render(){
    if(!ready||!viewport.clientWidth||!viewport.clientHeight)return;
    solo.visible=state.mode!=='repeat';repeated.visible=state.mode==='repeat';
    const{span,center,w,h,aspect}=cameraFrame(),yaw=CAMERA.yaw+state.orbit*Math.PI/180;
    camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.zoom=state.zoom;
    camera.position.copy(center).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(CAMERA.pitch)*85,Math.sin(CAMERA.pitch)*85,Math.cos(yaw)*Math.cos(CAMERA.pitch)*85));
    camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld();library.materials.resize(w,h,span,state.zoom);renderer.render(scene,camera);
    root.dataset.orbit=state.orbit.toFixed(2);root.dataset.zoom=state.zoom.toFixed(2);root.dataset.mode=state.mode;
    root.dataset.drawCalls=renderer.info.render.calls;root.dataset.triangles=renderer.info.render.triangles;
    document.getElementById('orbitOutput').value=`${Math.round(state.orbit)}°`;document.getElementById('zoomOutput').value=`${Math.round(state.zoom*100)}%`;
    for(const button of buttons){const a=button.dataset.action;button.disabled=(a==='left'&&target.orbit<=-15)||(a==='right'&&target.orbit>=15)||(a==='out'&&target.zoom<=1)||(a==='in'&&target.zoom>=3);}
}
function tick(now){
    frame=0;if(!ready||document.hidden)return;
    const dt=Math.min(.05,Math.max(.001,(now-lastTime)/1000));lastTime=now;
    const blend=media.matches||drag?1:1-Math.exp(-dt*12);let moving=false;
    for(const key of['orbit','zoom']){if(Math.abs(state[key]-target[key])>.001){state[key]+=(target[key]-state[key])*blend;moving=true;}else state[key]=target[key];}
    render();if(moving)frame=requestAnimationFrame(tick);
}
function wake(){if(!ready||frame||document.hidden)return;lastTime=performance.now();frame=requestAnimationFrame(tick);}
function resize(){if(!ready)return;renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);render();}
function setMode(mode){
    state.mode=mode;Object.assign(target,{orbit:0,zoom:1});Object.assign(state,target);
    for(const button of modes)button.setAttribute('aria-pressed',String(button.dataset.view===mode));
    const crop=mode==='repeat'?REFERENCE.housingCrop:mode==='scale'?[0,0,REFERENCE.width,REFERENCE.height]:REFERENCE.masterCrop;
    reference.setAttribute('viewBox',crop.join(' '));
    for(const [index,name]of ['x','y','width','height'].entries())document.getElementById('sourceCropRect').setAttribute(name,crop[index]);
    reference.setAttribute('aria-label',mode==='master'?'Reference crop of the foreground residential tower':mode==='repeat'?'The five towers in the reference illustration':'Full neighborhood reference showing intended component scale');
    document.getElementById('liveCaption').textContent={master:'3D master',repeat:'Five shared instances',scale:'At neighborhood scale'}[mode];
    document.getElementById('referenceCaption').textContent={master:'Foreground residential tower',repeat:'Housing society in the reference',scale:'Full neighborhood'}[mode];
    document.getElementById('modeNote').textContent={master:'Same floor, windows and balconies, repeated.',repeat:'One master. Five identical buildings. No per-copy changes.',scale:'A readability check at the full illustration’s scale.'}[mode];
    document.getElementById('liveNote').textContent=mode==='repeat'?'Mapped tower positions · Heights standardized to the same master':mode==='scale'?'Same pixels per world unit as the full image at this width':'Drag to turn · Real geometry, shared across all five copies';
    status.textContent=`${document.getElementById('liveCaption').textContent}. View reset.`;
    render();
}
function action(name){
    if(name==='reload'){
        const url=new URL(location.href);url.searchParams.delete('view');location.replace(url.href);return;
    }
    if(!ready)return;
    if(name==='left')target.orbit=clamp(target.orbit-3,-15,15);
    if(name==='right')target.orbit=clamp(target.orbit+3,-15,15);
    if(name==='in')target.zoom=clamp(target.zoom+.25,1,3);
    if(name==='out')target.zoom=clamp(target.zoom-.25,1,3);
    if(name==='reset')Object.assign(target,{orbit:0,zoom:1});
    status.textContent=`${target.orbit} degrees orbit. ${Math.round(target.zoom*100)} percent zoom.`;wake();
}
function fail(error){
    if(error)console.error(error);ready=false;cancelAnimationFrame(frame);frame=0;root.dataset.state='fallback';
    setMode('master');root.dataset.mode='master';
    if(renderer)renderer.domElement.hidden=true;
    document.getElementById('sceneLoading').hidden=true;document.getElementById('fallbackStill').hidden=false;document.getElementById('sceneError').hidden=false;
    for(const button of [...buttons,...modes])button.disabled=button.dataset.action!=='reload';
    document.getElementById('touchExplore').disabled=true;document.querySelector('.live-label').textContent='STILL PREVIEW';
    document.getElementById('liveCaption').textContent='Saved master preview';
    document.getElementById('liveNote').textContent='Saved render of this tower version · Interactive controls are unavailable';
    viewport.setAttribute('aria-label','Saved tower preview. Interactive controls are unavailable.');
    status.textContent='Interactive 3D is unavailable. Showing the saved master tower.';
}
root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.view&&ready)setMode(button.dataset.view);if(button.dataset.action)action(button.dataset.action);});
document.getElementById('touchExplore').addEventListener('click',event=>{touch=!touch;viewport.classList.toggle('touch-explore',touch);event.currentTarget.setAttribute('aria-pressed',String(touch));event.currentTarget.textContent=touch?'Finish touch exploration':'Explore by touch';});
viewport.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey)return;const name={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out','0':'reset',Home:'reset'}[event.key];if(name){event.preventDefault();action(name);}});
viewport.addEventListener('pointerdown',event=>{if(!ready||event.button!==0||!event.isPrimary||(event.pointerType==='touch'&&!touch))return;drag={id:event.pointerId,x:event.clientX,orbit:state.orbit,moved:false};Object.assign(target,{orbit:state.orbit,zoom:state.zoom});});
viewport.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;if(!drag.moved&&Math.abs(event.clientX-drag.x)<4)return;if(!drag.moved){viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');drag.moved=true;}state.orbit=target.orbit=clamp(drag.orbit-(event.clientX-drag.x)*.10,-15,15);wake();});
function release(event){if(!drag||event.pointerId!==drag.id)return;drag=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);wake();}
for(const name of['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,release);
viewport.addEventListener('pointerleave',event=>{if(drag&&!drag.moved)release(event);});
viewport.addEventListener('wheel',event=>{if(!ready||(!event.ctrlKey&&!event.metaKey))return;event.preventDefault();target.zoom=clamp(target.zoom-event.deltaY*.002,1,3);wake();},{passive:false});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
media.addEventListener('change',()=>{if(media.matches){Object.assign(state,target);render();}wake();});
window.addEventListener('pagehide',event=>{cancelAnimationFrame(frame);frame=0;if(!event.persisted){ready=false;observer?.disconnect();for(const geometry of ownedGeometries)geometry.dispose();library?.dispose();renderer?.dispose();}});
window.addEventListener('pageshow',event=>{if(event.persisted)resize();});

try{
    setMode(state.mode);
    if(params.get('view')==='still'){fail();}
    else{
        renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
        renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
        renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Live blue-outline 3D apartment tower');viewport.append(renderer.domElement);
        makeScene();ready=true;root.dataset.state='ready';document.getElementById('sceneLoading').hidden=true;
        resize();observer=new ResizeObserver(resize);observer.observe(viewport);
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    }
}catch(error){fail(error);}
