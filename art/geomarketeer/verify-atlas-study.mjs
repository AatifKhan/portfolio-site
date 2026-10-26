import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const source=await readFile(new URL('../../scripts/geomarketeer-atlas-study.js',import.meta.url),'utf8');

// A small document fixture exercises navigation and media-preference changes
// without a browser automation dependency. Layout is verified in the browser.
function mount({reduced=false,narrow=false}={}) {
    let active=null,nextTimer=0;
    const timers=new Map(),elements=new Map(),media=new Map();
    class Element {
        constructor(id,attributes={}) {
            this.id=id;this.attributes=new Map(Object.entries(attributes));this.dataset={};this.listeners={};this.hidden=false;this.textContent='';this.innerHTML='';
            this.clientWidth=narrow?359:1296;this.clientHeight=narrow?304:545;this.tagName='DIV';
            const classes=new Set();this.classList={add(name){classes.add(name);},remove(name){classes.delete(name);},toggle(name,on){if(on)classes.add(name);else classes.delete(name);},contains(name){return classes.has(name);}};
            this.viewBox={baseVal:{width:1100,height:800}};
            this.style={values:new Map(),setProperty(name,value){this.values.set(name,value);}};
            for(const[name,value]of Object.entries(attributes))if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
            elements.set(id,this);
        }
        setAttribute(name,value){this.attributes.set(name,String(value));if(name==='viewBox'){const[x,y,width,height]=String(value).split(/\s+/).map(Number);this.viewBox.baseVal={x,y,width,height};}}
        getAttribute(name){return this.attributes.get(name)??null;}
        hasAttribute(name){return this.attributes.has(name);}
        toggleAttribute(name,on){if(on)this.setAttribute(name,'');else this.attributes.delete(name);}
        insertAdjacentHTML(_position,markup){this.innerHTML+=markup;}
        querySelector(selector){assert.equal(selector,'[data-open-cafe]');return elements.get('cafeHit');}
        addEventListener(type,callback){(this.listeners[type]??=[]).push(callback);}
        closest(selector){if(selector.includes('[data-')&&[...this.attributes.keys()].some(name=>name.startsWith('data-')))return this;if(selector.includes('button')&&this.tagName==='BUTTON')return this;return null;}
        focus(){active=this;}
        emit(type,event={}){for(const callback of this.listeners[type]||[])callback({target:this,preventDefault(){},...event});}
    }
    for(const id of['study','atlasArt','cafeArt','miniAtlas','atlasPanel','cafePanel','backAction','viewAction','viewStatus','studyTitle','introCopy','viewHeading','viewDescription','viewNumber','stage','atlasCamera','cafeCamera','cameraZoom','cameraAngle'])new Element(id);
    const hit=new Element('cafeHit',{'data-open-cafe':'',tabindex:'0'});
    const atlasNav=new Element('atlasNav',{'data-view-button':'atlas','aria-pressed':'true'});
    const cafeNav=new Element('cafeNav',{'data-view-button':'cafe','aria-pressed':'false'});
    const cameraNodes=[];
    for(const[action,id]of[['zoom-in','zoomIn'],['zoom-out','zoomOut'],['tilt-left','tiltLeft'],['tilt-right','tiltRight'],['reset','cameraReset']]){
        const element=new Element(id,{'data-camera-action':action});element.tagName='BUTTON';cameraNodes.push(element);
    }
    const back=elements.get('backAction');back.setAttribute('data-show-atlas','');back.hidden=true;
    elements.get('viewAction').setAttribute('data-show-cafe','');
    elements.get('study').dataset.view='atlas';
    const document={
        getElementById(id){assert(elements.has(id),`Unexpected node ${id}`);return elements.get(id);},
        querySelector(selector){assert.equal(selector,'.illustration-stage');return elements.get('stage');},
        querySelectorAll(selector){if(selector==='[data-camera-action]')return cameraNodes;assert.equal(selector,'[data-view-button]');return[atlasNav,cafeNav];},
        fonts:{ready:Promise.resolve()},listeners:{},
        addEventListener(type,callback){this.listeners[type]=callback;},
    };
    const context=vm.createContext({document,console,
        matchMedia(query){
            if(!media.has(query))media.set(query,{matches:query.includes('reduced')?reduced:narrow,listeners:[],addEventListener(_type,callback){this.listeners.push(callback);}});
            return media.get(query);
        },
        ResizeObserver:class{observe(){}},
        setTimeout(callback,delay){const id=++nextTimer;timers.set(id,{callback,delay});return id;},
        clearTimeout(id){timers.delete(id);},
    });
    vm.runInContext(source,context,{filename:'geomarketeer-atlas-study.js'});
    const click=id=>document.listeners.click({target:elements.get(id)});
    const flush=()=>{for(const[id,{callback}]of[...timers]){timers.delete(id);callback();}};
    return{elements,hit,click,flush,timers,media,get active(){return active;}};
}

const regular=mount();
const get=id=>regular.elements.get(id);
assert.equal(get('study').dataset.ready,'true');
const allMarkup=['atlasArt','cafeArt','miniAtlas'].map(id=>get(id).innerHTML).join('');
assert(!/<(?:image|foreignObject|canvas)\b/i.test(allMarkup),'The compositions must stay native SVG geometry.');
assert(!/\b(?:NaN|Infinity)\b/.test(allMarkup),'All SVG coordinates must be finite.');
const ids=[...allMarkup.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,'Inline SVG definitions must have unique IDs.');
const references=[...allMarkup.matchAll(/(?:href="#|url\(#)([^"\)]+)/g)].map(match=>match[1]);
for(const reference of references)assert(ids.includes(reference),`Unresolved SVG reference: ${reference}`);
const places=[...get('atlasArt').innerHTML.matchAll(/data-place="([^"]+)"/g)].map(match=>match[1]).sort();
assert.deepEqual(places,['cafe','home','homes','office','shop']);
assert.equal((get('atlasArt').innerHTML.match(/role="button"/g)||[]).length,1);

regular.hit.emit('keydown',{key:'Enter'});
assert.equal(get('study').dataset.view,'cafe');
assert.equal(get('study').dataset.transitioning,'true');
assert.equal(regular.active.id,'backAction');
assert(get('atlasPanel').hasAttribute('inert'));
assert.equal(get('atlasPanel').getAttribute('aria-hidden'),'true');
assert.equal(regular.hit.getAttribute('tabindex'),'-1');
regular.click('backAction');regular.click('cafeNav');regular.click('atlasNav');
assert.equal(regular.timers.size,1,'Interrupted transitions must cancel stale completion callbacks.');
regular.flush();
assert.equal(get('study').dataset.view,'atlas');
assert.equal(get('study').dataset.transitioning,'false');
assert.equal(get('atlasNav').getAttribute('aria-pressed'),'true');
assert.equal(get('cafeNav').getAttribute('aria-pressed'),'false');
assert.equal(regular.hit.getAttribute('tabindex'),'0');
assert(get('cafePanel').hasAttribute('inert'));
regular.hit.emit('keydown',{key:' '});regular.flush();
get('study').emit('keydown',{key:'Escape'});regular.flush();
assert.equal(get('study').dataset.view,'atlas');
assert.equal(regular.active,regular.hit);

for(let i=0;i<10;i++)regular.click('zoomIn');
assert.equal(get('cameraZoom').value,'120%');
assert.equal(get('zoomIn').disabled,true);
for(let i=0;i<10;i++)regular.click('tiltLeft');
assert.equal(get('cameraAngle').value,'-15°');
assert.equal(get('tiltLeft').disabled,true);
regular.click('cafeNav');regular.flush();
assert.equal(get('cameraZoom').value,'100%','Each view must have its own camera settings.');
regular.click('zoomOut');regular.click('tiltRight');
regular.click('atlasNav');regular.flush();
assert.equal(get('cameraZoom').value,'120%');
assert.equal(get('cameraAngle').value,'-15°');
get('stage').emit('keydown',{key:'ArrowRight'});
assert.notEqual(get('study').dataset.panX,'0');
regular.click('zoomOut');regular.click('zoomOut');
assert.equal(get('study').dataset.panX,'0','Zooming back to the overview must not strand the drawing off-center.');
regular.click('zoomIn');regular.click('zoomIn');
get('stage').emit('keydown',{key:'ArrowRight'});
get('stage').emit('keydown',{key:'0'});
assert.equal(get('cameraZoom').value,'100%');
assert.equal(get('cameraAngle').value,'0°');
assert.equal(get('study').dataset.panX,'0');
assert.equal(get('cameraReset').disabled,true);
for(let i=0;i<10;i++)regular.click('zoomOut');
assert.equal(get('cameraZoom').value,'80%');
assert.equal(get('zoomOut').disabled,true);
get('stage').emit('keydown',{key:'+'});
assert.equal(get('cameraZoom').value,'90%');
get('stage').emit('keydown',{key:']'});
assert.equal(get('cameraAngle').value,'5°');
regular.click('cameraReset');

const reduced=mount({reduced:true,narrow:true});
reduced.click('cafeHit');
assert.equal(reduced.elements.get('study').dataset.view,'cafe');
assert.equal(reduced.elements.get('study').dataset.transitioning,'false');
assert.equal(reduced.timers.size,0,'Reduced-motion navigation must complete immediately.');
reduced.click('zoomIn');reduced.click('zoomIn');
assert.equal(reduced.elements.get('cameraZoom').value,'120%');
assert.equal(reduced.timers.size,0,'Camera controls must not add animation timers.');
const preference=regular.media.get('(prefers-reduced-motion: reduce)');
regular.click('cafeNav');preference.matches=true;preference.listeners.forEach(callback=>callback());
assert.equal(get('study').dataset.transitioning,'false');
assert.equal(regular.timers.size,0);

const inventory={
    places,svgPrimitiveCount:(allMarkup.match(/<(?:path|polygon|polyline|rect|ellipse|circle|use)\b/g)||[]).length,
    uniqueDefinitionIds:ids.length,internalReferences:references.length,rasterElements:0,
    checks:['finite vector coordinates','five named buildings','no raster/canvas elements','unique SVG definitions','resolved SVG references','Enter/Space activation','focus and inactive-view isolation','last-request-wins transitions','Escape return','zoom/tilt limits','independent view cameras','keyboard pan and reset','reduced motion on load and preference change'],result:'passed',
};
const directory=new URL('../../reports/atlas-study/',import.meta.url);
await mkdir(directory,{recursive:true});
await writeFile(new URL('verification.json',directory),JSON.stringify(inventory,null,2)+'\n');
console.log(JSON.stringify(inventory,null,2));
