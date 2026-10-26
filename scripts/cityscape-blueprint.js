import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
const $=id=>document.getElementById(id), base='assets/portfolio/geomarketeer/reference-blockout/';
const asset=name=>base+name+'?v=blockout3';
let data,mode='blueprint',selected=null,zone='all',yaw=0,renderer,scene,cam,loaded=false,loading,currentFocus='overview';
let greyRoot,detailRoot,detailLoading;
const detailAsset=name=>'assets/portfolio/geomarketeer/landmark-section/'+name+'?v=golden3';
const focusViews={
  overview:{label:'synagogue–café junction',crop:[650,270,780,380]},
  landmark:{label:'Ohel David Synagogue',crop:[700,300,390,330]},
  cafe:{label:'main-road café',crop:[1040,270,430,300]},
  street:{label:'two-way traffic and crossing',crop:[930,325,570,255]}
};
const ctx=$('annotations').getContext('2d');
const colors={N:'#245782',W:'#245782',S:'#245782',E:'#245782',L:'#962f26',M:'#673d87'};
const inZone=b=>zone==='all'||b.zone===zone;
function draw(){
  ctx.clearRect(0,0,1672,941);
  if(!data)return;
  function polygon(points,color,width,dash=[]){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  if(mode==='blueprint')for(const road of data.roads)polygon(road.points,'#007f88',2,road.confidence==='low'?[8,5]:[]);
  for(const b of data.buildings.filter(inZone)){
    if(mode!=='blueprint'&&b.id!==selected)continue;
    polygon(b.roofPixels,b.id===selected?'#b23c21':b.confidence==='low'?'#b57510':colors[b.zone],b.id===selected?5:2,b.confidence==='low'?[5,4]:[]);
    if($('labels').checked||b.id===selected){
      const [x,y]=b.center;ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle=b.id===selected?'#b23c21':colors[b.zone];ctx.fillRect(x-22,y-12,44,24);ctx.fillStyle='#fff';ctx.fillText(b.id,x,y);
    }
  }
}
function rows(){
  $('rows').replaceChildren();
  for(const b of data.buildings.filter(inZone)){
    const tr=document.createElement('tr');tr.classList.toggle('selected',b.id===selected);
    const id=document.createElement('td'),button=document.createElement('button');button.id='building-'+b.id;button.textContent=b.id;button.setAttribute('aria-label',`${b.id}: ${b.label}`);button.setAttribute('aria-pressed',String(selected===b.id));
    button.addEventListener('click',()=>{selected=selected===b.id?null:b.id;$('selection').textContent=selected?`${b.id} — ${b.label}. ${b.confidence} trace confidence; ${b.storeysInferred} inferred storeys. Roof form: ${b.form}.`:'Select a building ID to inspect its traced roof.';rows();draw();$('building-'+b.id).focus({preventScroll:true});});
    id.append(button);tr.append(id);for(const value of [b.label,b.form,b.storeysInferred,b.confidence]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('rows').append(tr);
  }
}
function updateCamera(){
  if(!loaded)return;
  const perspective=mode==='detail'||$('camera').value==='perspective',q=data[perspective?'perspective':'orthographic'].parameters;
  const [az,elev,dist,f,cx,cy]=q,aspect=1672/941;
  if(perspective){cam=new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(2*Math.atan(941/(2*f))),aspect,.1,3000);cam.projectionMatrix.elements[8]=1-2*cx/1672;cam.projectionMatrix.elements[9]=2*cy/941-1;cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();}
  else {const s=f/dist;cam=new THREE.OrthographicCamera(-cx/s,(1672-cx)/s,cy/s,(cy-941)/s,.1,3000);}
  if(mode==='detail'){
    // Each focus uses an exact crop of the calibrated source projection.
    const [left,top,width,height]=focusViews[currentFocus].crop;
    cam.projectionMatrix.elements[0]=2*f/width;cam.projectionMatrix.elements[5]=2*f/height;
    cam.projectionMatrix.elements[8]=1-2*(cx-left)/width;cam.projectionMatrix.elements[9]=2*(cy-top)/height-1;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  const a=az+THREE.MathUtils.degToRad(yaw);
  cam.position.set(Math.sin(a)*Math.cos(elev)*dist,Math.sin(elev)*dist,Math.cos(a)*Math.cos(elev)*dist);cam.lookAt(0,0,0);
  render();
}
function setReferenceReveal(value){
  const reveal=Number(value);$('compare').value=String(reveal);$('compareValue').textContent=reveal+'%';
  $('reference').style.clipPath=mode==='detail'?`inset(0 ${100-reveal}% 0 0)`:'none';
  $('reference').style.opacity=mode==='overlay'?$('opacity').value/100:1;
}
function setFocus(name){
  if(!focusViews[name])return;currentFocus=name;yaw=0;$('angle').textContent='0°';setReferenceReveal(0);
  const {label,crop}=focusViews[name],aspect=crop[2]/crop[3];
  document.querySelector('.stage').style.setProperty('--focus-aspect',String(aspect));
  $('reference').src=detailAsset(`reference-focus-${name}.png`);$('reference').alt=`Approved reference crop of the ${label}.`;
  $('still').src=detailAsset(`focus-${name}.png`);
  for(const button of document.querySelectorAll('[data-focus]'))button.setAttribute('aria-pressed',String(button.dataset.focus===name));
  $('status').textContent=`Close view: ${label}. Drag “Approved reference reveal” to compare the same crop.`;
  updateCamera();resize();
}
function render(){if(!renderer||!cam)return;renderer.render(scene,cam);}
function resize(){if(!renderer)return;const r=$('model').getBoundingClientRect();if(r.width&&r.height){renderer.setSize(r.width,r.height,false);render();}}
async function loadModel(){
  if(loaded)return;if(loading)return loading;
  loading=(async()=>{
    try{
      renderer=new THREE.WebGLRenderer({canvas:$('model'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
      scene=new THREE.Scene();scene.background=new THREE.Color('#e8e9e6');scene.add(new THREE.HemisphereLight(0xffffff,0x727a74,2.5));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-20,45,20);scene.add(light);
      const gltf=await new GLTFLoader().loadAsync(asset('reference-blockout.glb'));greyRoot=gltf.scene;scene.add(greyRoot);loaded=true;updateCamera();resize();$('still').hidden=true;$('status').textContent='Live grey model · roof envelopes traced; heights and hidden geometry inferred.';
    }catch(error){$('model').hidden=true;$('still').hidden=false;$('status').textContent='3D unavailable. Showing the Blender still; reference and inventory remain available.';for(const id of ['left','right','reset','camera'])$(id).disabled=true;console.error('Blockout load failed',error);}
  })();return loading;
}
async function showDetail(){
  await loadModel();if(!loaded)return;
  if(!detailRoot){
    $('status').textContent='Loading the authored synagogue section…';
    if(!detailLoading){
      const ktx=new KTX2Loader().setTranscoderPath('assets/vendor/three/addons/libs/basis/').detectSupport(renderer);
      detailLoading=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx).loadAsync(detailAsset('landmark-viewer.glb')).then(g=>{detailRoot=g.scene;scene.add(detailRoot);}).finally(()=>ktx.dispose());
    }
    try{await detailLoading;}catch(error){$('model').hidden=true;$('still').src=detailAsset('detail.png');$('still').hidden=false;$('status').textContent='Detailed 3D unavailable. Showing the Blender still.';console.error(error);return;}
  }
  detailRoot.visible=mode==='detail';greyRoot.visible=mode!=='detail';
  if(mode==='detail'){setFocus(currentFocus);}
}
function setMode(value){
  mode=value;yaw=0;$('angle').textContent='0°';
  for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));
  const live=mode==='model'||mode==='overlay'||mode==='detail';$('reference').hidden=mode==='model';
  document.querySelector('.stage').classList.toggle('detail-view',mode==='detail');
  $('model').setAttribute('aria-label',mode==='detail'?'Detailed Review 1 city section. Use the rotation buttons below to inspect alternate angles.':'Grey Blender city model. Use the rotation buttons below to inspect alternate angles.');
  if(mode==='detail'){setFocus(currentFocus);}else{$('reference').src='assets/portfolio/geomarketeer/pune-approved-reference.png';$('reference').alt='Approved Pune miniature: curved main road, central synagogue, mall on the right and dense residential blocks.';$('still').src=asset('grey-'+$('camera').value+'.png');setReferenceReveal(100);}
  if(detailRoot)detailRoot.visible=mode==='detail';if(greyRoot)greyRoot.visible=mode!=='detail';
  $('annotations').hidden=!(mode==='blueprint'||mode==='overlay');$('model').hidden=!live;$('still').hidden=!live||loaded;
  $('opacityControl').hidden=mode!=='overlay';$('cameraControl').hidden=!live||mode==='detail';$('focusControls').hidden=mode!=='detail';$('compareControl').hidden=mode!=='detail';$('rotation').hidden=mode!=='model'&&mode!=='detail';$('labelsControl').hidden=mode!=='blueprint';
  if(mode==='detail')showDetail();else if(live){loadModel();updateCamera();resize();}else $('status').textContent=mode==='reference'?'Approved reference · unchanged source image.':'Observed roof envelopes and road edges · heights and concealed geometry remain inferred.';
  draw();
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelectorAll('[data-focus]').forEach(b=>b.addEventListener('click',()=>setFocus(b.dataset.focus)));
$('zone').addEventListener('change',()=>{zone=$('zone').value;selected=null;rows();draw();});$('labels').addEventListener('change',draw);
$('opacity').addEventListener('input',()=>{$('reference').style.opacity=$('opacity').value/100;$('opacityValue').textContent=$('opacity').value+'%';});
$('compare').addEventListener('input',()=>setReferenceReveal($('compare').value));
$('camera').addEventListener('change',()=>{$('still').src=asset('grey-'+$('camera').value+'.png');updateCamera();});
for(const [id,value] of [['left',-14],['right',14],['reset',0]])$(id).addEventListener('click',()=>{yaw=value;$('angle').textContent=yaw+'°';if(mode==='detail')setReferenceReveal(0);updateCamera();});
new ResizeObserver(resize).observe($('model'));
$('model').addEventListener('webglcontextlost',e=>{e.preventDefault();loaded=false;$('model').hidden=true;$('still').hidden=false;$('status').textContent='Graphics context lost. Showing the matching Blender still.';for(const id of ['left','right','reset','camera'])$(id).disabled=true;});
try{
  const response=await fetch(asset('inventory.json'));if(!response.ok)throw Error('Inventory unavailable');data=await response.json();
  for(const [id,label] of data.zones){const opt=document.createElement('option');opt.value=id;opt.textContent=label;$('zone').append(opt);}
  $('counts').textContent=`${data.buildings.length} building masses, ${data.roads.length} road sections and ${data.grounds.length} open grounds. Each building has a stable ID shared by the reference, inventory and Blender file.`;
  $('fit').textContent=`A rectangular calibration hypothesis gives ${data.perspective.rmsCornerPixels.toFixed(1)} px RMS residual in perspective and ${data.orthographic.rmsCornerPixels.toFixed(1)} px in orthographic. These are diagnostic residuals, not scene-accuracy scores. Toggle cameras in the overlay to compare.`;
  rows();setMode(new URLSearchParams(location.search).get('view')==='detail'?'detail':'blueprint');
}catch(error){$('status').textContent='Could not load the inventory. The approved reference is still available. Reload to retry.';console.error(error);}
