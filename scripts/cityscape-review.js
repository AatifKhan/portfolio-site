import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const $ = id => document.getElementById(id);
const frame = $('sceneFrame');
const canvas = $('reviewCanvas');
const status = $('sceneStatus');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 959px)');
const stillRequested = new URLSearchParams(location.search).get('view') === 'still';
const base = 'assets/portfolio/geomarketeer/review-2/';
const assetFile = name => base+name+'?v=review2-c';
document.querySelectorAll(`img[src^="${base}"]`).forEach(img=>{
  img.src=assetFile(img.getAttribute('src').slice(base.length).split('?')[0]);
});
const controls = ['rotateLeft','rotateRight','reset','zoomIn','zoomOut','traffic','explore'];
const views = {
  hero: { target: [0,0,0], span:59, title:'The corner<br>looks promising.', kicker:'01 / THE NEIGHBOURHOOD', body:'A busy road. Homes around the corner. A café waiting for its first customer.', question:'What would you want to know before signing the lease?', label:null },
  synagogue: { target:[.7,1.4,-.5], span:17, title:'A familiar<br>landmark.', kicker:'02 / OHEL DAVID SYNAGOGUE', body:'Red brick, a tall clock tower, and a pocket of green. The neighbourhood has a centre of gravity.', question:'The landmark helps us stay oriented as the story moves around the city.', label:'Ohel David Synagogue', anchor:'anchor_synagogue' },
  cafe: { target:[16,1.1,-7.5], span:17, title:'A café.<br>A possibility.', kicker:'03 / THE CAFÉ FRONTAGE', body:'The striped awning catches your eye. The main road brings movement right past the door.', question:'Passing by is the beginning of a question. Would people stop?', label:'The first café candidate', anchor:'anchor_cafe_primary' },
  homes: { target:[-9,1.5,10], span:19, title:'People make<br>a neighbourhood.', kicker:'04 / THE NEARBY HOMES', body:'Balconies, water tanks, shaded pavements. The everyday details that make this little world feel lived in.', question:'Later, this is where we’ll reveal the people behind the location.', label:'Nearby homes', anchor:'anchor_homes' },
  alternative: { target:[-8,1.1,8.7], span:17, title:'A quieter<br>possibility.', kicker:'05 / THE SECOND STOREFRONT', body:'A smaller street. Homes close by. Another place to investigate before choosing a location.', question:'Quieter does not automatically mean better—or worse. The surrounding context matters.', label:'The second café candidate', anchor:'anchor_cafe_alternative' },
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const limit=THREE.MathUtils.degToRad(14);
let selected='hero', yaw=0, targetYaw=0, zoom=1, currentZoom=1;
let paused=reduce.matches, exploring=false, visible=false, loaded=false, disposed=false;
let renderer, camera, scene, model, metadata, observer, textureLoader, raf=0, last=0, sampleStart=0;
let viewTarget=new THREE.Vector3(...views.hero.target), currentTarget=viewTarget.clone(), span=59;
let traffic=[]; const times=[]; const pointers=new Map(); let drag=null, pinch=null;
let assetVersion=narrow.matches?'mobile':'desktop';
const temp=new THREE.Vector3();
function updateGestureNote(){
  document.querySelector('.gesture-note').textContent=loaded
    ? (narrow.matches?'Tap Explore city to rotate or pinch. Swipe to scroll.':'Drag gently to rotate. Scroll to move down the page.')
    : 'Choose a place below to inspect the city.';
}
narrow.addEventListener('change',updateGestureNote);
updateGestureNote();

function disable(value) { controls.forEach(id=>$(id).disabled=value); }
disable(true);

function fallback(message) {
  loaded=false;
  $('cityPoster').src=assetFile((selected==='synagogue'?'detail':selected)+'.webp');
  frame.classList.remove('is-ready');
  $('sceneLabel').hidden=true;
  status.textContent=message;
  updateGestureNote();
  disable(true);
  cancelAnimationFrame(raf); raf=0;
}

function setView(key) {
  selected=key;
  const v=views[key];
  $('viewIndex').textContent=v.kicker;
  $('viewTitle').innerHTML=v.title;
  $('viewBody').textContent=v.body;
  $('viewQuestion').textContent=v.question;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));
  viewTarget.set(...v.target); targetYaw=0; zoom=1;
  if(!loaded) $('cityPoster').src=assetFile((key==='synagogue'?'detail':key)+'.webp');
  if(reduce.matches) { currentTarget.copy(viewTarget); yaw=0; currentZoom=1; span=v.span; }
  updateZoom(); wake();
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

function updateZoom() {
  $('zoomLevel').value=Math.round(zoom*100)+'%';
  $('zoomIn').disabled=!loaded || zoom>=1.25;
  $('zoomOut').disabled=!loaded || zoom<=1;
}
function adjustZoom(amount){zoom=clamp(zoom+amount,1,1.25);updateZoom();wake();}
$('rotateLeft').addEventListener('click',()=>{targetYaw=-limit;wake();});
$('rotateRight').addEventListener('click',()=>{targetYaw=limit;wake();});
$('reset').addEventListener('click',()=>{targetYaw=0;zoom=1;updateZoom();wake();});
$('zoomIn').addEventListener('click',()=>adjustZoom(.05));
$('zoomOut').addEventListener('click',()=>adjustZoom(-.05));
$('traffic').addEventListener('click',()=>{paused=!paused;updatePause();wake();});
function updatePause(){ $('traffic').textContent=paused?'Play traffic':'Pause traffic';$('traffic').setAttribute('aria-pressed',String(paused)); }
$('explore').addEventListener('click',()=>{
  exploring=!exploring;
  frame.classList.toggle('is-exploring',exploring);
  $('explore').textContent=exploring?'Exit exploration':'Explore city';
  $('explore').setAttribute('aria-pressed',String(exploring));
  pointers.clear();drag=null;pinch=null;
});
canvas.addEventListener('keydown',event=>{
  if(!loaded)return;
  const k=event.key;
  if(['ArrowLeft','ArrowRight','+','=','-','r','R'].includes(k))event.preventDefault();
  if(k==='ArrowLeft')targetYaw=clamp(targetYaw-.04,-limit,limit);
  if(k==='ArrowRight')targetYaw=clamp(targetYaw+.04,-limit,limit);
  if(k==='+'||k==='=')adjustZoom(.05);
  if(k==='-')adjustZoom(-.05);
  if(k.toLowerCase()==='r'){targetYaw=0;zoom=1;updateZoom();}
  wake();
});
function distance(){const p=[...pointers.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):null;}
canvas.addEventListener('pointerdown',e=>{
  if(!loaded || (e.pointerType==='touch'&&!exploring))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
  drag={x:e.clientX,yaw:targetYaw};pinch=distance();
});
canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const d=distance();
  if(d&&pinch){adjustZoom((d-pinch)*.002);pinch=d;}
  else if(drag)targetYaw=clamp(drag.yaw+(e.clientX-drag.x)*.002,-limit,limit);
  wake();
});
function release(e){pointers.delete(e.pointerId);drag=null;pinch=null;}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
// No wheel handler: ordinary scrolling, including over the model, stays native.

function resize(){
  if(!renderer)return;
  const {width,height}=frame.getBoundingClientRect();
  if(!width||!height)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio,narrow.matches?1.25:1.5));
  renderer.setSize(width,height,false);
  $('viewportMetrics').textContent=`${innerWidth} × ${innerHeight} CSS px · DPR ${renderer.getPixelRatio()} · ${assetVersion} asset`;
  wake();
}

function positionCamera(){
  const aspect=canvas.clientWidth/canvas.clientHeight;
  // span is horizontal; keep the entire island in frame on tall phones too.
  const width=Math.max(span,span*aspect*.76)/currentZoom;
  camera.left=-width/2;camera.right=width/2;camera.top=width/aspect/2;camera.bottom=-camera.top;
  camera.updateProjectionMatrix();
  const dx=8*Math.cos(yaw)+60*Math.sin(yaw), dz=60*Math.cos(yaw)-8*Math.sin(yaw);
  camera.position.copy(currentTarget).add(new THREE.Vector3(dx,52,dz));
  camera.lookAt(currentTarget);
}
function positionLabel(){
  const v=views[selected];
  const anchor=v.anchor&&model.getObjectByName(v.anchor);
  const el=$('sceneLabel');
  if(!anchor){el.hidden=true;return;}
  anchor.getWorldPosition(temp);temp.project(camera);
  const x=(temp.x+1)*.5*canvas.clientWidth,y=(1-temp.y)*.5*canvas.clientHeight;
  el.hidden=temp.z< -1 || temp.z>1 || x<25 || x>canvas.clientWidth-25 || y<25 || y>canvas.clientHeight-25;
  el.textContent=v.label;el.style.left=clamp(x-el.offsetWidth/2,10,canvas.clientWidth-el.offsetWidth-10)+'px';el.style.top=(y-38)+'px';
}
function routePoint(distance) {
  const points=metadata.route.points;
  for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
    if(distance<=length || i===points.length-1) {
      const f=clamp(distance/length,0,1);
      return {x:a[0]+dx*f,y:a[1]+dy*f,tx:dx/length,ty:dy/length};
    }
    distance-=length;
  }
}
function tick(now){
  raf=0;
  if(!loaded||!visible||document.hidden||disposed)return;
  if(last && now-last < 1000/(narrow.matches?30:60)-1){raf=requestAnimationFrame(tick);return;}
  const elapsed=last?now-last:16.7,dt=Math.min(elapsed/1000,.05);last=now;
  const ease=reduce.matches?1:1-Math.exp(-dt*7);
  yaw=THREE.MathUtils.lerp(yaw,targetYaw,ease);currentZoom=THREE.MathUtils.lerp(currentZoom,zoom,ease);
  currentTarget.lerp(viewTarget,ease);span=THREE.MathUtils.lerp(span,views[selected].span,ease);
  positionCamera();
  if(!paused){
    for(const t of traffic){
      const length=metadata.route.length;
      t.distance=(t.distance+t.direction*dt*.55+length)%length;
      const p=routePoint(t.distance),offset=metadata.route.laneOffset*t.direction;
      t.obj.position.x=p.x-p.ty*offset;t.obj.position.z=-(p.y+p.tx*offset);
      t.obj.rotation.y=(t.direction===1?Math.PI/2:-Math.PI/2)+Math.atan2(p.ty,p.tx);
      // Re-entry happens at the two model boundaries, never in the centre of town.
      const edge=Math.min(t.distance,length-t.distance);
      t.obj.visible=edge>.18;t.obj.scale.setScalar(clamp(edge/.6,0,1));
    }
  }
  renderer.render(scene,camera);positionLabel();
  if(elapsed>0)times.push(elapsed);
  if(times.length>300)times.shift();
  $('viewMetrics').textContent=`${selected} · ${(yaw*180/Math.PI).toFixed(1)}° · ${Math.round(currentZoom*100)}%`;
  if(now-sampleStart>1000){
    sampleStart=now;
    $('triangles').textContent=renderer.info.render.triangles.toLocaleString();
    $('drawCalls').textContent=renderer.info.render.calls.toLocaleString();
    const ordered=[...times].sort((a,b)=>a-b);
    if(ordered.length>30)$('frameTime').textContent=`${ordered[Math.floor(ordered.length*.5)].toFixed(1)} ms / ${ordered[Math.floor(ordered.length*.95)].toFixed(1)} ms (${ordered.length} frames)`;
  }
  const unsettled=Math.abs(yaw-targetYaw)>.0001 || Math.abs(currentZoom-zoom)>.0001 || currentTarget.distanceTo(viewTarget)>.001 || Math.abs(span-views[selected].span)>.001;
  if(!paused||unsettled)raf=requestAnimationFrame(tick);
}
function wake(){if(loaded&&visible&&!document.hidden&&!raf&&!disposed){last=0;raf=requestAnimationFrame(tick);}}

async function load(){
  if(loaded||renderer||disposed)return;
    if(reduce.matches||stillRequested){fallback(stillRequested?'Still-image preview':'Still view · reduced motion');return;}
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.NoToneMapping;
    renderer.toneMappingExposure=1;
    renderer.setClearColor(0xefeada,1);
    scene=new THREE.Scene();
    camera=new THREE.OrthographicCamera(-16,16,12,-12,.1,150);
    textureLoader=new KTX2Loader().setTranscoderPath('assets/vendor/three/addons/libs/basis/').detectSupport(renderer);
    const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);loader.setKTX2Loader(textureLoader);
    const file=`pune-${assetVersion}.glb`;
    const [gltf,meta,report]=await Promise.all([
      loader.loadAsync(assetFile(file),e=>{if(e.total)status.textContent=`Loading city · ${Math.round(e.loaded/e.total*100)}%`;}),
      fetch(assetFile('scene.json')).then(r=>{if(!r.ok)throw Error('Scene metadata unavailable');return r.json();}),
      fetch(assetFile('asset-report.json')).then(r=>r.ok?r.json():null).catch(()=>null)
    ]);
    if(disposed)return;
    model=gltf.scene;metadata=meta;scene.add(model);
    traffic=meta.traffic.map(t=>({...t,obj:model.getObjectByName(t.name),distance:t.start})).filter(t=>t.obj);
    if(report)$('assetBytes').textContent=(report[assetVersion].bytes/1000000).toFixed(2)+' MB · '+assetVersion;
    loaded=true;disable(false);updatePause();updateZoom();updateGestureNote();resize();positionCamera();
    renderer.render(scene,camera);
    frame.classList.add('is-ready');status.textContent='Live 3D · drag to explore';
    wake();
  }catch(error){console.error('City review load failed:',error);fallback('The 3D view is unavailable. The rendered views are below.');renderer?.dispose();renderer=null;}
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('3D paused. Reload to restore the interactive view.');});
document.addEventListener('visibilitychange',()=>{times.length=0;last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
reduce.addEventListener('change',()=>{if(reduce.matches){paused=true;updatePause();fallback('Still view · reduced motion');}else if(model){loaded=true;disable(false);updateZoom();frame.classList.add('is-ready');status.textContent='Live 3D · drag to explore';wake();}else load();});
observer=new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  if(visible){load();wake();}else{cancelAnimationFrame(raf);raf=0;times.length=0;last=0;}
},{rootMargin:'100px'});observer.observe(frame);
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(frame);
window.addEventListener('pagehide',event=>{
  cancelAnimationFrame(raf);raf=0;
  if(event.persisted)return;
  disposed=true;observer.disconnect();resizeObserver.disconnect();
  model?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture){v.source?.data?.close?.();v.dispose();}m.dispose();}}});
  textureLoader?.dispose();renderer?.dispose();
});
window.addEventListener('pageshow',()=>wake());
