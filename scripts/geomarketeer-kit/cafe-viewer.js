import * as THREE from '../../assets/vendor/three/three.module.js';
import { createAssetLibrary } from './library.js';
import { CAFE_BASE, CAFE_VARIANTS } from './cafe.js';
import { CAMERA, KitDrawing } from './style.js';
import { REFERENCE } from './inventory.js';

const root=document.getElementById('cafeStudy'),viewport=document.getElementById('cafeViewport'),reference=document.getElementById('referenceArt');
const status=document.getElementById('sceneStatus'),labels=document.getElementById('boardLabels'),params=new URLSearchParams(location.search);
const media=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
const state={mode:['single','variants','scale'].includes(params.get('mode'))?params.get('mode'):'single',variant:CAFE_VARIANTS.some(s=>s.id===params.get('variant'))?params.get('variant'):'base',focus:['seating','storefront'].includes(params.get('focus'))?params.get('focus'):'whole',orbit:0,zoom:1};
const target={orbit:0,zoom:1},scenes=new Map(),pads=new Set();
const actions=[...document.querySelectorAll('[data-action]')],modeButtons=[...document.querySelectorAll('[data-mode]')].filter(e=>e.tagName==='BUTTON');
let library,renderer,camera,observer,ready=false,frame=0,last=0,drag=null,touch=false;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const variant=()=>CAFE_VARIANTS.find(s=>s.id===state.variant);
const focusLabels={whole:'Whole café',seating:'Seating detail',storefront:'Storefront detail'};

for(const spec of CAFE_VARIANTS){
    const button=document.createElement('button');button.type='button';button.dataset.variant=spec.id;button.setAttribute('aria-pressed',String(spec.id===state.variant));
    const number=document.createElement('span');number.textContent=spec.number;button.append(number,document.createTextNode(spec.label));document.getElementById('variantPicks').append(button);
    const cell=document.createElement('div');cell.className='board-cell';
    const choose=document.createElement('button');choose.type='button';choose.dataset.variant=spec.id;choose.textContent=`${spec.number}  ${spec.label}`;
    const description=document.createElement('small');description.textContent=spec.subtitle;choose.append(description);cell.append(choose);labels.append(cell);
}
const key=document.createElement('div');key.className='board-cell board-key';key.innerHTML='<p><strong>Built from one base.</strong>Same camera. Same scale.<br>Shared doors, windows, roof details and furniture.<br><br>Select a café to look closer.</p>';labels.append(key);
document.body.dataset.coarse=String(coarse.matches);

function makeScene(){
    library=createAssetLibrary();camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,250);
    for(const spec of CAFE_VARIANTS){
        const asset=library.createAsset({assetId:'cafe',variantId:spec.id,instanceId:`review-only/${spec.id}`}),scene=new THREE.Scene();scene.background=new THREE.Color('white');scene.add(asset.group);
        const min=asset.bounds.min,max=asset.bounds.max,x0=min.x-.25,x1=max.x+.25,z0=min.z-.20,z1=max.z+.20;
        const draw=new KitDrawing(`review-pad/${spec.id}`,library.materials,'cafe-pad');
        draw.quad([[x0,-.04,z0],[x1+.55,-.04,z0+.10],[x1+.55,-.04,z1+.45],[x0+.25,-.04,z1+.45]],'shadow',false);
        draw.quad([[x0,-.025,z0],[x1,-.025,z0],[x1,-.025,z1],[x0,-.025,z1]],'#fcfdff',false);
        const pad=draw.finish();pad.traverse(o=>{if(o.geometry)pads.add(o.geometry);});scene.add(pad);scene.updateMatrixWorld(true);
        const details=Object.fromEntries(Object.entries(asset.group.userData.reviewBounds).map(([key,value])=>[key,new THREE.Box3(new THREE.Vector3(...value.min),new THREE.Vector3(...value.max))]));
        scenes.set(spec.id,{scene,bounds:new THREE.Box3().setFromObject(scene),details});
    }
}

function framing(entry,aspect){
    const box=entry.bounds,center=box.getCenter(new THREE.Vector3());let ex=0,ey=0;
    for(const angle of[-15,0,15]){
        const yaw=CAMERA.yaw+angle*Math.PI/180,right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),up=new THREE.Vector3(-Math.sin(yaw)*Math.sin(CAMERA.pitch),Math.cos(CAMERA.pitch),-Math.cos(yaw)*Math.sin(CAMERA.pitch));
        for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).sub(center);ex=Math.max(ex,Math.abs(p.dot(right)));ey=Math.max(ey,Math.abs(p.dot(up)));}
    }
    return{center,span:Math.max(ey*2,ex*2/aspect)*1.06};
}
function draw(entry,rect,spanOverride){
    const{width:w,height:h,x,y}=rect,{center,span}=framing(entry,w/h),vertical=spanOverride||span,yaw=CAMERA.yaw+state.orbit*Math.PI/180;
    camera.left=-vertical*w/h/2;camera.right=vertical*w/h/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.zoom=state.zoom;
    camera.position.copy(center).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(CAMERA.pitch)*85,Math.sin(CAMERA.pitch)*85,Math.cos(yaw)*Math.cos(CAMERA.pitch)*85));camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    renderer.setViewport(x,y,w,h);renderer.setScissor(x,y,w,h);library.materials.resize(w,h,vertical,state.zoom);renderer.render(entry.scene,camera);
}
function render(){
    if(!ready||!viewport.clientWidth||!viewport.clientHeight)return;
    const w=viewport.clientWidth,h=viewport.clientHeight;renderer.info.reset();renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clear();renderer.setScissorTest(true);
    if(state.mode==='variants'){
        const narrow=matchMedia('(max-width: 650px)').matches,cols=narrow?1:3,rows=narrow?5:2,cw=w/cols,ch=h/rows,contentHeight=ch-62;
        const commonSpan=Math.max(...[...scenes.values()].map(entry=>framing(entry,cw/contentHeight).span));
        for(const[index,spec]of CAFE_VARIANTS.entries())draw(scenes.get(spec.id),{x:(index%cols)*cw,y:h-(Math.floor(index/cols)+1)*ch+62,width:cw,height:contentHeight},commonSpan);
    }else{
        const ratio=Math.min(reference.clientWidth/REFERENCE.width,reference.clientHeight/REFERENCE.height);
        const entry=scenes.get(state.variant),bounds=state.mode==='single'&&entry.details[state.focus]||entry.bounds;
        draw({...entry,bounds},{x:0,y:0,width:w,height:h},state.mode==='scale'?h/(ratio*REFERENCE.pixelsPerUnit):undefined);
    }
    renderer.setScissorTest(false);
    Object.assign(root.dataset,{state:'ready',mode:state.mode,variant:state.variant,focus:state.focus,orbit:state.orbit.toFixed(2),zoom:state.zoom.toFixed(2),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles)});
    document.getElementById('orbitOutput').value=`${Math.round(state.orbit)}°`;document.getElementById('zoomOutput').value=`${Math.round(state.zoom*100)}%`;
    for(const button of actions){const a=button.dataset.action;button.disabled=(a==='left'&&target.orbit<=-15)||(a==='right'&&target.orbit>=15)||(a==='out'&&target.zoom<=1)||(a==='in'&&target.zoom>=3);}
}
function resize(){if(!ready||!viewport.clientWidth||!viewport.clientHeight)return;renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);render();}
function tick(now){frame=0;if(!ready||document.hidden)return;const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;const t=media.matches||drag?1:1-Math.exp(-dt*12);let moving=false;for(const key of['orbit','zoom']){if(Math.abs(target[key]-state[key])>.001){state[key]+=(target[key]-state[key])*t;moving=true;}else state[key]=target[key];}render();if(moving)frame=requestAnimationFrame(tick);}
function wake(){if(!ready||frame||document.hidden)return;last=performance.now();frame=requestAnimationFrame(tick);}
function updateView(){
    const spec=variant(),all=state.mode==='variants';Object.assign(target,{orbit:0,zoom:1});Object.assign(state,target);root.dataset.mode=state.mode;root.dataset.variant=spec.id;
    if(state.mode!=='single'||spec.fitout==='vacant'&&state.focus==='seating')state.focus='whole';
    document.getElementById('detailPicks').hidden=state.mode!=='single';
    for(const button of document.querySelectorAll('button[data-focus]')){
        button.disabled=button.dataset.focus==='seating'&&spec.fitout==='vacant';
        button.setAttribute('aria-pressed',String(button.dataset.focus===state.focus));
    }
    for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode));
    for(const button of document.querySelectorAll('#variantPicks button'))button.setAttribute('aria-pressed',String(!all&&button.dataset.variant===state.variant));
    const crop=state.mode==='scale'?[0,0,REFERENCE.width,REFERENCE.height]:spec.referenceCrop;
    reference.setAttribute('viewBox',crop.join(' '));for(const[index,name]of['x','y','width','height'].entries())document.getElementById('sourceCropRect').setAttribute(name,crop[index]);
    reference.setAttribute('aria-label',`Approved illustration reference for ${spec.label}`);
    labels.hidden=!all;document.getElementById('liveCaption').textContent=all?'Five variations · same scale':`${spec.label}${state.focus==='whole'?'':` · ${focusLabels[state.focus]}`}`;
    document.getElementById('referenceCaption').textContent=spec.id==='corner'?'Central café':spec.id==='base'?'Foreground single-storey café':'Foreground café lane';
    document.getElementById('modeNote').textContent=all?'Compare the family before any neighborhood placement.':state.mode==='scale'?'A readability check at the full illustration’s scale.':spec.id==='base'?'The base café is our starting point.':spec.subtitle;
    document.getElementById('liveNote').textContent=all?'Shared camera and scale · Select a label to inspect a café':'Drag to turn · This component remains unplaced';
    document.getElementById('variantNumber').textContent=all?'Shared foundation':`${spec.number} / ${spec.id==='base'?'Base component':'Variation'}`;
    document.getElementById('variantTitle').textContent=all?'Five versions. One family.':spec.label;
    document.getElementById('variantDescription').textContent=all?'Only the declared footprint, upper floor, awning, glazing and fit-out change. Every version uses the same component builder.':spec.difference;
    document.getElementById('storeysValue').textContent=all?'One or two':spec.upper?'Two':'One';
    document.getElementById('awningValue').textContent=all?'Striped or solid blue':spec.awning==='solid'?'Solid blue':'Blue & white stripes';
    document.getElementById('glazingValue').textContent=all?'Front or corner':spec.corner?'Front & corner glazing':'Front storefront';
    document.getElementById('fitoutValue').textContent=all?'Café or vacant':spec.fitout==='vacant'?'Vacant · no furniture':`${spec.tables} terrace ${spec.tables===1?'table':'tables'} & counter`;
    status.textContent=`${all?'All five variations':spec.label}. ${focusLabels[state.focus]}. View reset.`;resize();
}
function action(name){
    if(name==='reload'){const url=new URL(location.href);url.searchParams.delete('view');location.replace(url.href);return;}if(!ready)return;
    if(name==='left')target.orbit=clamp(target.orbit-3,-15,15);if(name==='right')target.orbit=clamp(target.orbit+3,-15,15);
    if(name==='in')target.zoom=clamp(target.zoom+.25,1,3);if(name==='out')target.zoom=clamp(target.zoom-.25,1,3);if(name==='reset'){state.focus='whole';updateView();return;}
    status.textContent=`${target.orbit} degrees orbit. ${Math.round(target.zoom*100)} percent zoom.`;wake();
}
function fail(error){
    if(error)console.error(error);ready=false;cancelAnimationFrame(frame);frame=0;state.mode='single';state.focus='whole';updateView();root.dataset.state='fallback';
    if(renderer)renderer.domElement.hidden=true;
    const still=document.getElementById('fallbackStill');still.src=`assets/portfolio/geomarketeer/component-kit/cafe-${state.variant}-still.jpg?v=${CAFE_BASE.revision}`;still.hidden=false;
    document.getElementById('sceneLoading').hidden=true;document.getElementById('sceneError').hidden=false;
    for(const button of document.querySelectorAll('main button'))button.disabled=button.dataset.action!=='reload';
    document.querySelector('.live-label').textContent='STILL PREVIEW';document.getElementById('liveCaption').textContent=`${variant().label} · saved preview`;
    viewport.setAttribute('aria-label','Saved café preview. Interactive controls are unavailable.');document.getElementById('liveNote').textContent='Saved rendering of this variation';status.textContent='Showing the saved café preview.';
}
root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.action)action(button.dataset.action);if(!ready)return;
    if(button.dataset.variant){
        const fromBoard=button.closest?.('#boardLabels');
        state.variant=button.dataset.variant;state.mode='single';state.focus='whole';updateView();
        if(fromBoard){viewport.focus({preventScroll:true});viewport.scrollIntoView({block:'center',behavior:'auto'});}
    }else if(button.dataset.mode){state.mode=button.dataset.mode;state.focus='whole';updateView();}
    else if(button.dataset.focus){state.focus=button.dataset.focus;updateView();viewport.focus({preventScroll:true});viewport.scrollIntoView({block:'center',behavior:'auto'});}
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
        renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive blue-outline café component family');viewport.prepend(renderer.domElement);
        makeScene();ready=true;document.getElementById('sceneLoading').hidden=true;resize();observer=new ResizeObserver(resize);observer.observe(viewport);
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
    }
}catch(error){fail(error);}
