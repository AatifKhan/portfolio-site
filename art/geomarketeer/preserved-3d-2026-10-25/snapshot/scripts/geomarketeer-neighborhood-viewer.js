import * as THREE from '../assets/vendor/three/three.module.js';
import { createApprovedNeighborhood, REFERENCE, PIXELS_PER_UNIT } from './geomarketeer-neighborhood-model.js';

const root=document.getElementById('neighborhoodStudy');
const viewport=document.getElementById('neighborhoodViewport');
const compare=document.getElementById('compareToggle');
const orbitOutput=document.getElementById('orbitOutput');
const zoomOutput=document.getElementById('zoomOutput');
const status=document.getElementById('sceneStatus');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const state={orbit:0,zoom:1},target={...state};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
let renderer,camera,model,scene,frame=0,lastTime=0,drag=null,ready=false;

function render(){
    if(!ready)return;
    const width=viewport.clientWidth,height=viewport.clientHeight,aspect=width/height;
    const span=Math.max(REFERENCE.height,REFERENCE.width/aspect)/PIXELS_PER_UNIT;
    const fit=1+Math.abs(state.orbit)/15*.035;
    camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
    camera.zoom=state.zoom/fit;
    const y=(REFERENCE.originY-REFERENCE.height/2)/REFERENCE.unit;
    const yaw=REFERENCE.yaw+state.orbit*Math.PI/180;
    camera.position.set(Math.sin(yaw)*Math.cos(REFERENCE.pitch)*85,y+Math.sin(REFERENCE.pitch)*85,Math.cos(yaw)*Math.cos(REFERENCE.pitch)*85);
    camera.lookAt(0,y,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    model.materials.resize(width,height,span,camera.zoom);
    renderer.render(scene,camera);
    orbitOutput.value=`${Math.round(state.orbit)}°`;zoomOutput.value=`${Math.round(state.zoom*100)}%`;
    root.dataset.orbit=String(Math.round(state.orbit));root.dataset.zoom=String(Math.round(state.zoom*100));
    root.dataset.drawCalls=String(renderer.info.render.calls);root.dataset.triangles=String(renderer.info.render.triangles);
    for(const[name,disabled]of[['left',state.orbit<=-14.99],['right',state.orbit>=14.99],['out',state.zoom<=.805],['in',state.zoom>=1.195]])root.querySelector(`[data-action="${name}"]`).disabled=disabled;
}
function tick(now){
    frame=0;if(!ready||document.hidden)return;
    const dt=Math.min(.05,Math.max(.001,(now-lastTime)/1000));lastTime=now;
    const amount=reduce.matches||drag?1:1-Math.exp(-dt*9);
    let moving=false;
    for(const key of['orbit','zoom']){
        if(Math.abs(target[key]-state[key])>.0001){state[key]+=(target[key]-state[key])*amount;moving=true;}
        else state[key]=target[key];
    }
    render();if(moving)frame=requestAnimationFrame(tick);
}
function wake(){if(!ready||frame||document.hidden)return;lastTime=performance.now();frame=requestAnimationFrame(tick);}
function resize(){if(!ready||!viewport.clientWidth||!viewport.clientHeight)return;renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);render();wake();}
function action(name){
    if(name==='reload'){location.reload();return;}
    if(!ready)return;
    if(name==='left')target.orbit=clamp(target.orbit-3,-15,15);
    if(name==='right')target.orbit=clamp(target.orbit+3,-15,15);
    if(name==='in')target.zoom=clamp(target.zoom+.1,.8,1.2);
    if(name==='out')target.zoom=clamp(target.zoom-.1,.8,1.2);
    if(name==='reset')Object.assign(target,{orbit:0,zoom:1});
    status.textContent=`${Math.round(target.orbit)} degrees orbit, ${Math.round(target.zoom*100)} percent zoom.`;wake();
}
root.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)action(button.dataset.action);});
compare.addEventListener('change',()=>{
    document.getElementById('referencePanel').hidden=!compare.checked;
    document.getElementById('comparison').classList.toggle('is-comparing',compare.checked);
    requestAnimationFrame(resize);
});
viewport.addEventListener('keydown',event=>{
    const keys={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out','0':'reset',Home:'reset'};
    if(!keys[event.key]||event.ctrlKey||event.metaKey)return;event.preventDefault();action(keys[event.key]);
});
viewport.addEventListener('pointerdown',event=>{
    if(!ready||event.button!==0||event.isPrimary===false)return;
    drag={id:event.pointerId,x:event.clientX,orbit:state.orbit,moved:false};Object.assign(target,state);
});
viewport.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(!drag.moved&&Math.abs(event.clientX-drag.x)<4)return;
    if(!drag.moved){drag.moved=true;viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');}
    state.orbit=target.orbit=clamp(drag.orbit-(event.clientX-drag.x)*.075,-15,15);wake();
});
function release(event){if(!drag||event.pointerId!==drag.id)return;drag=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);wake();}
for(const event of['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(event,release);
viewport.addEventListener('pointerleave',event=>{if(drag&&!drag.moved)release(event);});
viewport.addEventListener('wheel',event=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();target.zoom=clamp(target.zoom-event.deltaY*.002,.8,1.2);wake();},{passive:false});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
reduce.addEventListener('change',()=>{if(reduce.matches)Object.assign(state,target);wake();});

try{
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#ffffff');
    renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Live three-dimensional recreation of the approved five-building Corner Café neighborhood.');
    viewport.append(renderer.domElement);
    model=createApprovedNeighborhood();scene=new THREE.Scene();scene.background=new THREE.Color('white');scene.add(model.scene);
    camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,300);
    ready=true;root.dataset.state='ready';root.dataset.renderer='three-webgl';root.dataset.textures='0';
    document.getElementById('sceneLoading').hidden=true;resize();
    new ResizeObserver(resize).observe(viewport);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;document.getElementById('sceneError').hidden=false;root.dataset.state='error';});
    window.addEventListener('pagehide',event=>{cancelAnimationFrame(frame);frame=0;if(!event.persisted){model.dispose();renderer.dispose();}});
    window.addEventListener('pageshow',event=>{if(event.persisted)resize();});
}catch(error){console.error(error);document.getElementById('sceneLoading').hidden=true;document.getElementById('sceneError').hidden=false;root.dataset.state='error';}
