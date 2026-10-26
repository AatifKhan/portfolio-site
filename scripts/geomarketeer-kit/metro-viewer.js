import * as THREE from '../../assets/vendor/three/three.module.js';
import { createAssetLibrary } from './library.js';
import {METRO, METRO_PARTS, METRO_FOCUS} from './metro.js';
import { CAMERA, KitDrawing } from './style.js';
import { REFERENCE } from './inventory.js';

const root=document.getElementById('metroStudy'),viewport=document.getElementById('metroViewport'),reference=document.getElementById('referenceArt');
const status=document.getElementById('sceneStatus'),labels=document.getElementById('boardLabels'),params=new URLSearchParams(location.search);
const media=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
const state={focus:METRO_FOCUS.some(f=>f.id===params.get('focus'))?params.get('focus'):'whole',mode:['single','variants','part','cutaway','scale'].includes(params.get('mode'))?params.get('mode'):'single',variant:METRO_PARTS.some(s=>s.id===params.get('variant'))?params.get('variant'):'structure',angle:['front','side','rear'].includes(params.get('angle'))?params.get('angle'):'reference',orbit:0,zoom:1};
const target={orbit:0,zoom:1},scenes=new Map(),pads=new Set();
const actions=[...document.querySelectorAll('[data-action]')],modeButtons=[...document.querySelectorAll('[data-mode]')].filter(e=>e.tagName==='BUTTON');
let library,renderer,camera,observer,ready=false,frame=0,last=0,drag=null,touch=false;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const variant=()=>METRO_PARTS.find(s=>s.id===state.variant);
const ANGLES={reference:{yaw:CAMERA.yaw,pitch:CAMERA.pitch},front:{yaw:0,pitch:0},side:{yaw:Math.PI/2,pitch:0},rear:{yaw:CAMERA.yaw+Math.PI,pitch:CAMERA.pitch}};
const selectedAngle=()=>ANGLES[state.angle];

for(const spec of METRO_PARTS){
    const button=document.createElement('button');button.type='button';button.dataset.variant=spec.id;button.setAttribute('aria-pressed',String(spec.id===state.variant));
    const number=document.createElement('span');number.textContent=spec.number;button.append(number,document.createTextNode(spec.label));document.getElementById('variantPicks').append(button);
    const cell=document.createElement('div');cell.className='board-cell';
    const choose=document.createElement('button');choose.type='button';choose.dataset.variant=spec.id;choose.textContent=`${spec.number}  ${spec.label}`;
    const description=document.createElement('small');description.textContent=spec.subtitle;choose.append(description);cell.append(choose);labels.append(cell);
}
document.body.dataset.coarse=String(coarse.matches);

function makeScene(){
    library=createAssetLibrary();camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,250);
    for(const mode of['single','cutaway']){
        const asset=library.createAsset({assetId:'metro-entrance',instanceId:`review-only/${mode}`}),scene=new THREE.Scene();scene.background=new THREE.Color('white');
        if(mode==='cutaway')for(const name of['metro/canopy','metro/wall-near','metro/end-wall','metro/guard-near','metro/guard-end'])asset.group.getObjectByName(name).visible=false;
        scene.add(asset.group);
        if(mode==='single'){
            // Review-only ground mask has a real opening. It never fills the stairwell.
            const shape=new THREE.Shape();shape.moveTo(-60,-60);shape.lineTo(60,-60);shape.lineTo(60,60);shape.lineTo(-60,60);shape.closePath();
            const hole=new THREE.Path();hole.moveTo(-2.8,-1.47);hole.lineTo(-2.8,1.47);hole.lineTo(2.8,1.47);hole.lineTo(2.8,-1.47);hole.closePath();shape.holes.push(hole);
            const draw=new KitDrawing('review-ground-mask',library.materials,'metro-review');draw.geometry(new THREE.ShapeGeometry(shape),new THREE.Matrix4().makeRotationX(-Math.PI/2),'#ffffff',false);const ground=draw.finish();ground.traverse(o=>{if(o.geometry)pads.add(o.geometry);});scene.add(ground);
        }
        scene.updateMatrixWorld(true);scenes.set(mode,{scene,bounds:asset.bounds});
    }
    for(const spec of METRO_PARTS){
        const asset=library.createAsset({assetId:'metro-entrance'}),group=asset.group.getObjectByName(`metro/${spec.id}`);group.removeFromParent();group.name=`review-only/${spec.id}`;
        const scene=new THREE.Scene();scene.background=new THREE.Color('white');scene.add(group);scene.updateMatrixWorld(true);scenes.set(spec.id,{scene,bounds:new THREE.Box3().setFromObject(group)});
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
        const narrow=matchMedia('(max-width: 650px)').matches,cols=narrow?1:3,rows=Math.ceil(METRO_PARTS.length/cols),cw=w/cols,ch=h/rows,contentHeight=ch-62;
        const commonSpan=Math.max(...METRO_PARTS.map(s=>framing(scenes.get(s.id),cw/contentHeight).span));
        for(const[index,spec]of METRO_PARTS.entries())draw(scenes.get(spec.id),{x:narrow?0:(index<3?index:index-3+.5)*cw,y:h-(Math.floor(index/cols)+1)*ch+62,width:cw,height:contentHeight},commonSpan);
    }else{
        const ratio=Math.min(reference.clientWidth/REFERENCE.width,reference.clientHeight/REFERENCE.height),focus=METRO_FOCUS.find(f=>f.id===state.focus);
        const original=scenes.get(state.mode==='part'?state.variant:state.mode==='cutaway'?'cutaway':'single'),entry=['single','cutaway'].includes(state.mode)&&focus.bounds?{...original,bounds:new THREE.Box3(...focus.bounds.map(p=>new THREE.Vector3(...p)))}:original;
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
    if(state.mode==='cutaway'&&state.focus==='canopy')state.focus='whole';
    const spec=variant(),all=state.mode==='variants',part=state.mode==='part',cut=state.mode==='cutaway',focus=METRO_FOCUS.find(f=>f.id===state.focus);Object.assign(target,{orbit:0,zoom:1});Object.assign(state,target);Object.assign(root.dataset,{mode:state.mode,variant:spec.id,angle:state.angle,focus:state.focus});
    for(const button of document.querySelectorAll('button[data-angle]'))button.setAttribute('aria-pressed',String(button.dataset.angle===state.angle));
    for(const button of document.querySelectorAll('button[data-focus]')){button.setAttribute('aria-pressed',String(button.dataset.focus===state.focus));button.disabled=!['single','cutaway'].includes(state.mode)||(cut&&button.dataset.focus==='canopy');}
    for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode));
    for(const button of document.querySelectorAll('#variantPicks button'))button.setAttribute('aria-pressed',String(part&&button.dataset.variant===state.variant));
    const crop=state.mode==='scale'?[0,0,REFERENCE.width,REFERENCE.height]:part?spec.referenceCrop:focus.referenceCrop;
    reference.setAttribute('viewBox',crop.join(' '));for(const[index,name]of['x','y','width','height'].entries())document.getElementById('sourceCropRect').setAttribute(name,crop[index]);
    reference.setAttribute('aria-label',part?`Reference for ${spec.label}`:'Metro entrance in the neighborhood illustration');
    labels.hidden=!all;document.getElementById('liveCaption').textContent=all?'Five reusable assemblies':part?spec.label:cut?'Stairwell cutaway':focus.id==='whole'?'Metro entrance':focus.label;
    document.getElementById('referenceCaption').textContent=part?spec.label:'Metro plaza · reference';document.getElementById('referenceNote').textContent='Your reference · a single metro landmark';
    document.getElementById('modeNote').textContent=all?'One shared scale across the five assemblies.':cut?'Canopy and near walls hidden for stair inspection.':state.mode==='scale'?'Readability at the full illustration’s scale.':part?'Isolated assembly · shared with the complete entrance':'One entrance · inspect the assembly and its details';
    document.getElementById('liveNote').textContent=all?'Select an assembly to inspect it':cut?'Inspection cutaway · full geometry is preserved':'Drag to turn · The entrance remains unplaced';
    document.getElementById('variantNumber').textContent=part?`${spec.number} / Metro assembly`:'10 / Metro entrance';
    document.getElementById('variantTitle').textContent=part?spec.label:all?'The parts of one landmark.':cut?'Follow the descent.':'A clear entrance to the metro.';
    document.getElementById('variantDescription').textContent=part?spec.description:cut?'The canopy and near retaining walls are hidden here to expose the eight steps, lower landing and two continuous handrails. This view changes visibility only.':'A covered upper landing opens onto a real stairwell. Repeated treads, guardrail sections, canopy panes and a geometric M sign share the neighborhood’s cobalt and pale-blue style.';
    document.getElementById('baseValue').textContent='One reusable entrance';document.getElementById('sizeValue').textContent='Eight steps · two landings';status.textContent='Metro view reset.';resize();
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
    const still=document.getElementById('fallbackStill');still.src=`assets/portfolio/geomarketeer/component-kit/metro-entrance-still.jpg?v=${METRO.revision}`;still.hidden=false;
    document.getElementById('sceneLoading').hidden=true;document.getElementById('sceneError').hidden=false;
    for(const button of document.querySelectorAll('main button'))button.disabled=button.dataset.action!=='reload';
    document.querySelector('.live-label').textContent='STILL PREVIEW';document.getElementById('liveCaption').textContent='Metro entrance · saved preview';
    viewport.setAttribute('aria-label','Saved metro entrance preview. Interactive controls are unavailable.');document.getElementById('liveNote').textContent='Saved rendering at the reference angle';status.textContent='Showing the saved metro entrance preview.';
}
root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.action)action(button.dataset.action);if(!ready)return;
    if(button.dataset.variant){
        const fromBoard=button.closest?.('#boardLabels');
        state.variant=button.dataset.variant;state.mode='part';state.focus='whole';updateView();
        if(fromBoard){viewport.focus({preventScroll:true});viewport.scrollIntoView({block:'center',behavior:'auto'});}
    }else if(button.dataset.mode){state.mode=button.dataset.mode;state.focus='whole';updateView();}
    else if(button.dataset.angle){state.angle=button.dataset.angle;updateView();}
    else if(button.dataset.focus&&['single','cutaway'].includes(state.mode)&&!(state.mode==='cutaway'&&button.dataset.focus==='canopy')){state.focus=button.dataset.focus;updateView();}
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
        renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive blue-outline metro entrance');viewport.prepend(renderer.domElement);
        makeScene();ready=true;updateView();document.getElementById('sceneLoading').hidden=true;resize();observer=new ResizeObserver(resize);observer.observe(viewport);
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    }
}catch(error){fail(error);}
