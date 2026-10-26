import * as THREE from '../../../assets/vendor/three/three.module.js';
import {buildNeighborhood} from '../../../scripts/geomarketeer-kit/neighborhood-model.js';
import {createNeighborhoodStage} from '../../../scripts/geomarketeer-kit/neighborhood-stage.js';
import {initNeighborhoodViewer} from '../../../scripts/geomarketeer-kit/neighborhood-controller.js';

export function fixture({reduced=false,phone=false,query='',contextFailure=false}={}){
 let now=0,id=0,frames=new Map(),renders=[],models=[],renderers=[],resizeCallback;
 const flags={fail:contextFailure},elements=new Map();
 function element(tag='div'){
  const classes=new Set();
  return {tagName:tag.toUpperCase(),dataset:{},style:{},hidden:false,disabled:false,checked:false,textContent:'',value:'',innerHTML:'',children:[],listeners:{},
   classList:{add(...values){values.forEach(v=>classes.add(v));},remove(...values){values.forEach(v=>classes.delete(v));},toggle(v,force){const on=force??!classes.has(v);if(on)classes.add(v);else classes.delete(v);},contains:v=>classes.has(v)},
   focus(){this.focused=true;},setAttribute(k,v){this[k]=v;},append(...children){children.forEach(c=>{c.parent=this;this.children.push(c);});},prepend(...children){children.forEach(c=>c.parent=this);this.children.unshift(...children);},remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);},
   addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]||[]).filter(f=>f!==fn);},dispatch(type,event={}){(this.listeners[type]||[]).forEach(f=>f(event));},
   setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){},animate(){this.animationCalls=(this.animationCalls||0)+1;return {cancel(){}};},
   get clientWidth(){return get('neighborhoodStudy').dataset.mode==='story'?(phone?288:560):(phone?342:1335);},
   get clientHeight(){return get('neighborhoodStudy').dataset.mode==='story'?this.clientWidth*9/16:phone?420:820;}
  };
 }
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 const actions=['left','right','in','out','reset','reload'].map(action=>Object.assign(element('button'),{dataset:{action}}));
 const modes=['story','explore'].map(mode=>Object.assign(get(mode==='story'?'modeStory':'modeExplore'),{dataset:{mode}}));
 const media={...element(),matches:reduced},document={...element(),hidden:false,body:element(),getElementById:get,createElement:element,querySelectorAll:s=>s==='[data-action]'?actions:s==='[data-mode]'?modes:s==='[data-district]'?get('districtPicks').children:[]},window=element();
 const location={search:query,href:'http://localhost/geomarketeer-kit-neighborhood.html'+query};
 class Renderer{
  constructor(){if(flags.fail)throw new Error('WebGL unavailable');this.domElement=element('canvas');this.disposals=0;this.info={render:{calls:179,triangles:2756984}};renderers.push(this);}
  setPixelRatio(){}setSize(w,h){this.width=w;this.height=h;}
  render(scene,camera){renders.push({camera:camera.clone(),mode:get('neighborhoodStudy').dataset.mode,beat:get('neighborhoodStudy').dataset.beat,time:now,scene});}
  dispose(){this.disposals++;}
 }
 const controller=initNeighborhoodViewer({document,window,location,history:{replaceState(a,b,url){location.href=url;location.search=new URL(url).search;}},matchMedia:q=>q.includes('reduced')?media:{matches:phone},clock:()=>now,requestFrame:fn=>(frames.set(++id,fn),id),cancelFrame:i=>frames.delete(i),ResizeObserverClass:class{constructor(fn){resizeCallback=fn;}observe(){}disconnect(){}},pixelRatio:1,createStage:options=>createNeighborhoodStage({...options,Renderer,buildModel:()=>{const m=buildNeighborhood();models.push(m);return m;}})});
 const step=(count=120)=>{for(let i=0;i<count;i++){now+=16.667;const fs=[...frames.values()];frames.clear();fs.forEach(fn=>fn(now));}};
 const click=data=>{
  const button=data.action?actions.find(b=>b.dataset.action===data.action):data.mode?modes.find(b=>b.dataset.mode===data.mode):data.story?get({back:'storyBack',next:'storyNext',replay:'storyReplay',skip:'storySkip'}[data.story]):get('districtPicks').children.find(b=>b.dataset.district===data.district);
  if(button)button.dataset={...button.dataset,...data};get('neighborhoodStudy').dispatch('click',{target:{closest:()=>button}});
 };
 const key=key=>get('neighborhoodViewport').dispatch('keydown',{key,preventDefault(){}});
 return {get,step,click,key,document,window,media,flags,actions,models,renderers,renders,location,resize:()=>resizeCallback(),frames:()=>frames.size,contextLost:()=>renderers.at(-1).domElement.dispatch('webglcontextlost',{preventDefault(){}}),dispose:controller.dispose};
}
