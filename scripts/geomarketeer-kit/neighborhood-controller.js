import {createNeighborhoodStage,interpolatePose} from './neighborhood-stage.js';
import {VIEWPOINTS} from './neighborhood-manifest.js';
import {REFERENCE} from './inventory.js';
import {STORY,STORY_DURATION,STORY_SHOTS,createStoryShots,storyOverlayMarkup,storyStill} from './neighborhood-story-shots.js';

// A single controller owns navigation and demand rendering in both modes.
export function initNeighborhoodViewer({document=globalThis.document,window=globalThis.window,location=globalThis.location,history=globalThis.history,matchMedia=globalThis.matchMedia,clock=()=>performance.now(),requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,ResizeObserverClass=ResizeObserver,createStage=createNeighborhoodStage,pixelRatio=globalThis.devicePixelRatio||1}={}){
 const get=id=>document.getElementById(id),root=get('neighborhoodStudy'),viewport=get('neighborhoodViewport'),params=new URLSearchParams(location.search);
 const media=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
 const state={mode:params.get('mode')==='story'?'story':'explore',beat:Math.max(0,STORY.findIndex(s=>s.id===params.get('beat'))),view:VIEWPOINTS.some(v=>v.id===params.get('district'))?params.get('district'):'overview',orbit:0,zoom:1,compare:params.get('compare')==='1'};
 const target={orbit:0,zoom:1},actions=[...document.querySelectorAll('[data-action]')];
 let stage,shots,observer,frame=0,last=0,pose,tween,ready=false,drag=null,touch=false,dead=false,pausedAt=null,copyAnimation;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const story=()=>state.mode==='story';
 for(const view of VIEWPOINTS){const b=document.createElement('button');b.type='button';b.dataset.district=view.id;b.textContent=view.label;get('districtPicks').append(b);}
 document.body.dataset.coarse=String(coarse.matches);
 function syncURL(){const u=new URL(location.href);if(story()){u.searchParams.set('mode','story');u.searchParams.set('beat',STORY[state.beat].id);u.searchParams.delete('district');u.searchParams.delete('compare');}else{u.searchParams.delete('mode');u.searchParams.delete('beat');if(state.view==='overview')u.searchParams.delete('district');else u.searchParams.set('district',state.view);if(state.compare)u.searchParams.set('compare','1');else u.searchParams.delete('compare');}history?.replaceState(null,'',u.href);}
 function overlays(){
  if(!ready||!story())return;
  const content=storyOverlayMarkup(shots,stage.camera,viewport.clientWidth);
  get('candidateOutline').innerHTML=content.candidate;get('connectionOutline').innerHTML=content.connection;
  get('candidateLabel').style.left=content.label.x+'%';get('candidateLabel').style.top=content.label.y+'%';
 }
 function render(){
  if(!ready||dead||!pose||document.hidden)return;
  stage.render(pose);overlays();
  Object.assign(root.dataset,{state:'ready',orbit:pose.orbit.toFixed(2),zoom:pose.zoom.toFixed(2),drawCalls:String(stage.renderer.info.render.calls),triangles:String(stage.renderer.info.render.triangles)});
  if(!story()){
   const v=VIEWPOINTS.find(v=>v.id===state.view),[x,y,w,h]=v.crop,vh=pose.span/pose.zoom*REFERENCE.pixelsPerUnit,vw=vh*stage.aspect;
   get('referenceArt').setAttribute('viewBox',`${x+w/2-vw/2} ${y+h/2-vh/2} ${vw} ${vh}`);
   get('referenceNote').textContent=pose.orbit===0?'Matching reference camera':'Source illustration · original camera';
   get('orbitOutput').value=`${Math.round(pose.orbit)}°`;get('zoomOutput').value=`${Math.round(pose.zoom*100)}%`;
  }
  for(const b of actions){const a=b.dataset.action;b.disabled=story()&&a!=='reload'||(a==='left'&&target.orbit<=-15)||(a==='right'&&target.orbit>=15)||(a==='out'&&target.zoom<=1)||(a==='in'&&target.zoom>=3);}
 }
 function stop(){cancelFrame(frame);frame=0;tween=null;root.dataset.motion='idle';}
 function tick(now){
  frame=0;if(!ready||dead||document.hidden)return;
  let moving=false;
  if(story()&&tween){const t=media.matches?1:clamp((now-tween.started)/STORY_DURATION,0,1);pose=interpolatePose(tween.from,tween.to,t);moving=t<1;if(!moving){pose=tween.to;tween=null;}}
  else if(!story()){
   const dt=Math.min(.05,Math.max(.001,(now-last)/1000)),t=media.matches||drag?1:1-Math.exp(-dt*12);
   for(const k of['orbit','zoom']){if(Math.abs(target[k]-state[k])>.001){state[k]+=(target[k]-state[k])*t;moving=true;}else state[k]=target[k];}
   pose=stage.explorePose(state.view,state.orbit,state.zoom);
  }
  last=now;root.dataset.motion=moving?'moving':'idle';render();if(moving)frame=requestFrame(tick);
 }
 function wake(){if(!ready||frame||document.hidden||dead)return;last=clock();frame=requestFrame(tick);}
 function updateStill(){
  get('fallbackStill').src=story()?storyStill(STORY[state.beat].id):`assets/portfolio/geomarketeer/component-kit/neighborhood-${state.view}-still.jpg?v=1`;
  get('fallbackStill').alt=story()?STORY[state.beat].description:'Saved '+VIEWPOINTS.find(v=>v.id===state.view).label.toLowerCase()+' preview';
 }
 function interfaceState(){
  const isStory=story(),beat=STORY[state.beat];
  Object.assign(root.dataset,{mode:state.mode,beat:beat.id,district:state.view,compare:String(!isStory&&state.compare),emphasis:STORY_SHOTS[state.beat].emphasis});
  for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));
  for(const b of document.querySelectorAll('[data-district]')){b.setAttribute('aria-pressed',String(b.dataset.district===state.view));b.disabled=!ready||isStory;}
  get('referencePanel').hidden=isStory||!state.compare;get('compareToggle').checked=state.compare;get('compareToggle').disabled=!ready||isStory;
  get('storyContent').hidden=!isStory;get('storyNavigation').hidden=!isStory;get('storyExtras').hidden=!isStory;
  get('storyStep').textContent=`${String(state.beat+1).padStart(2,'0')} / ${beat.label}`;
  get('storyTitle').textContent=beat.title;get('storyBody').textContent=beat.body;get('storyCount').textContent=`${String(state.beat+1).padStart(2,'0')} / 05`;
  get('storyBack').disabled=state.beat===0;get('storyNext').textContent=state.beat===4?'Explore the neighborhood':'Next';
  get('storyNext').setAttribute('aria-label',state.beat===4?'Explore the neighborhood':`Next: ${STORY[state.beat+1].label}`);get('storyReplay').hidden=state.beat!==4;
  get('viewerTitle').textContent=isStory?'Sid’s neighborhood':'The neighborhood, together.';
  get('viewerDescription').textContent=isStory?'Sid’s story, in five steps.':'One approved kit. Five identical towers. A whole neighborhood to explore.';
  get('checkpointLabel').textContent=isStory?'13 / The neighborhood story':'12 / Neighborhood assembly';
  get('reviewLabel').textContent=isStory?'Story review':'Composition review';
  get('liveCaption').textContent=isStory?beat.label:VIEWPOINTS.find(v=>v.id===state.view).label;
  get('liveNote').textContent=isStory?'An illustrative scenario.':'Drag to turn · Choose a district for a closer look.';
  get('liveLabel').textContent=ready?'LIVE 3D':'SAVED PREVIEW';
  viewport.tabIndex=isStory?-1:0;viewport.setAttribute('aria-label',isStory?beat.description:'Interactive neighborhood. Left and right arrows turn, plus and minus zoom, zero resets the overview.');
  if(stage)stage.renderer.domElement.setAttribute('aria-label',isStory?beat.description:'Interactive blue-outline neighborhood assembled from approved components');
  get('storyOverlays').hidden=!ready||!isStory;
  get('candidateLayer').classList.toggle('is-active',isStory&&[1,4].includes(state.beat));
  get('connectionLayer').classList.toggle('is-active',isStory&&state.beat===2);
  get('storyQuestions').classList.toggle('is-active',isStory&&state.beat>=3);get('storyQuestions').classList.toggle('is-quiet',state.beat===4);
  if(!ready){if(root.dataset.state==='fallback')updateStill();for(const b of actions)b.disabled=b.dataset.action!=='reload';}
 }
 function resize(){if(!ready)return;if(story()){if(!tween)pose=shots.poses[state.beat];}else pose=stage.explorePose(state.view,state.orbit,state.zoom);render();}
 function selectBeat(index,{instant=false,announce=true}={}){
  const next=clamp(index,0,4),changed=next!==state.beat;
  // Retarget from the in-flight position, not the previous shot's endpoint.
  if(tween&&ready)pose=interpolatePose(tween.from,tween.to,clamp((clock()-tween.started)/STORY_DURATION,0,1));
  stop();state.beat=next;interfaceState();syncURL();
  if(ready){const destination=shots.poses[next];if(!instant&&!media.matches&&pose&&JSON.stringify(pose)!==JSON.stringify(destination)){tween={from:pose,to:destination,started:clock()};root.dataset.motion='moving';wake();}else{pose=destination;render();}}
  copyAnimation?.cancel();if(changed&&!instant&&!media.matches&&get('storyContent').animate)copyAnimation=get('storyContent').animate([{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
  if(announce)get('sceneStatus').textContent=`Step ${next+1} of 5. ${STORY[next].title} ${STORY[next].body}`;
 }
 function setMode(mode){
  if(mode===state.mode)return;stop();copyAnimation?.cancel();drag=null;touch=false;viewport.classList.remove('touch-explore','is-dragging');get('touchExplore').setAttribute('aria-pressed','false');get('touchExplore').textContent='Explore by touch';
  state.mode=mode;state.compare=false;state.view='overview';state.orbit=target.orbit=0;state.zoom=target.zoom=1;interfaceState();syncURL();
  if(ready){pose=story()?shots.poses[state.beat]:stage.explorePose();render();}get(story()?'modeStory':'modeExplore').focus({preventScroll:true});get('sceneStatus').textContent=story()?`Story resumed. Step ${state.beat+1} of 5.`:'Explore the whole neighborhood.';
 }
 function resetExplore(){stop();state.orbit=target.orbit=0;state.zoom=target.zoom=1;interfaceState();syncURL();resize();}
 function fail(){
  stop();ready=false;state.compare=false;root.dataset.state='fallback';if(stage)stage.renderer.domElement.hidden=true;
  get('fallbackStill').hidden=false;get('sceneLoading').hidden=true;get('sceneError').hidden=false;get('sceneStatus').textContent='Showing the saved 3D preview. Story navigation remains available.';interfaceState();
 }
 function boot(){
  stop();ready=false;root.dataset.state='loading';get('sceneLoading').hidden=false;get('sceneError').hidden=true;get('fallbackStill').hidden=true;
  stage?.dispose();stage=null;
  try{
   stage=createStage({viewport,onLost:fail,pixelRatio});shots=createStoryShots(stage.model);ready=true;
   root.dataset.sceneSerial=String(Number(root.dataset.sceneSerial||0)+1);get('instanceCount').textContent=String(stage.model.manifest.instances.length);
   interfaceState();pose=story()?shots.poses[state.beat]:stage.explorePose(state.view,state.orbit,state.zoom);render();get('sceneLoading').hidden=true;
  }catch(error){root.dataset.failure=error.message;stage?.dispose();stage=null;fail();}
 }
 function action(name){
  if(name==='reload'){const u=new URL(location.href);u.searchParams.delete('view');history?.replaceState(null,'',u.href);boot();return;}
  if(!ready||story())return;
  if(name==='left')target.orbit=clamp(target.orbit-3,-15,15);if(name==='right')target.orbit=clamp(target.orbit+3,-15,15);
  if(name==='in')target.zoom=clamp(target.zoom+.25,1,3);if(name==='out')target.zoom=clamp(target.zoom-.25,1,3);
  if(name==='reset'){state.view='overview';resetExplore();return;}
  get('sceneStatus').textContent=`${target.orbit} degrees orbit. ${Math.round(target.zoom*100)} percent zoom.`;wake();
 }
 root.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.mode)setMode(b.dataset.mode);
  if(b.dataset.action)action(b.dataset.action);
  if(b.dataset.story){const a=b.dataset.story;if(a==='back')selectBeat(state.beat-1);if(a==='next'){if(state.beat===4)setMode('explore');else selectBeat(state.beat+1);}if(a==='skip')setMode('explore');if(a==='replay')selectBeat(0);}
  if(ready&&!story()&&b.dataset.district){state.view=b.dataset.district;resetExplore();viewport.focus({preventScroll:true});}
 });
 get('compareToggle').addEventListener('change',e=>{if(story()||!ready)return;state.compare=e.currentTarget.checked;resetExplore();});
 get('touchExplore').addEventListener('click',e=>{if(story()||!ready)return;touch=!touch;viewport.classList.toggle('touch-explore',touch);e.currentTarget.setAttribute('aria-pressed',String(touch));e.currentTarget.textContent=touch?'Finish touch exploration':'Explore by touch';});
 viewport.addEventListener('keydown',e=>{if(story()||e.ctrlKey||e.metaKey||e.altKey)return;const a={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out','0':'reset',Home:'reset'}[e.key];if(a){e.preventDefault();action(a);}});
 viewport.addEventListener('pointerdown',e=>{if(story()||!ready||e.button!==0||!e.isPrimary||(e.pointerType==='touch'&&!touch))return;drag={id:e.pointerId,x:e.clientX,orbit:state.orbit,moved:false};Object.assign(target,{orbit:state.orbit,zoom:state.zoom});});
 viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(!drag.moved&&Math.abs(e.clientX-drag.x)<4)return;if(!drag.moved){viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');drag.moved=true;}state.orbit=target.orbit=clamp(drag.orbit-(e.clientX-drag.x)*.1,-15,15);wake();});
 const release=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);wake();};
 for(const type of['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,release);viewport.addEventListener('pointerleave',e=>{if(drag&&!drag.moved)release(e);});
 viewport.addEventListener('wheel',e=>{if(story()||!ready||(!e.ctrlKey&&!e.metaKey))return;e.preventDefault();target.zoom=clamp(target.zoom-e.deltaY*.002,1,3);wake();},{passive:false});
 const pause=()=>{cancelFrame(frame);frame=0;if(pausedAt===null)pausedAt=clock();};
 const resume=()=>{if(pausedAt!==null&&tween)tween.started+=clock()-pausedAt;pausedAt=null;resize();if(tween||!story())wake();};
 document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
 media.addEventListener('change',()=>{copyAnimation?.cancel();if(media.matches){stop();if(ready){if(story())pose=shots.poses[state.beat];else{Object.assign(state,target);pose=stage.explorePose(state.view,state.orbit,state.zoom);}render();}}});
 const dispose=()=>{if(dead)return;dead=true;stop();copyAnimation?.cancel();observer?.disconnect();stage?.dispose();};
 window.addEventListener('pagehide',e=>e.persisted?pause():dispose());window.addEventListener('pageshow',e=>{if(e.persisted)resume();});
 interfaceState();if(params.get('view')==='still')fail();else boot();
 observer=new ResizeObserverClass(resize);observer.observe(viewport);
 return {dispose};
}
