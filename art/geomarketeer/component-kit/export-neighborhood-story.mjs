import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {buildNeighborhood} from '../../../scripts/geomarketeer-kit/neighborhood-model.js';
import {STORY,STORY_SHOTS,STORY_REVISION,STORY_DURATION,createStoryShots,storyStill} from '../../../scripts/geomarketeer-kit/neighborhood-story-shots.js';
const model=buildNeighborhood(),shots=createStoryShots(model),folder=new URL('story/',import.meta.url);
await mkdir(folder,{recursive:true});
const frames=STORY.map((beat,i)=>({...beat,camera:shots.poses[i],shot:STORY_SHOTS[i],still:storyStill(beat.id)}));
await writeFile(new URL('exports.json',folder),JSON.stringify({revision:STORY_REVISION,status:'awaiting-story-review',viewport:{width:560,height:315},duration:STORY_DURATION,frames},null,2)+'\n');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const markup=frames.map((s,i)=>`<article id="${s.id}"><p class="step">${String(i+1).padStart(2,'0')} / ${escape(s.label)}</p><img src="../../../../${s.still}" alt="${escape(s.description)}" width="560" height="315"><h2>${escape(s.title)}</h2><p>${escape(s.body)}</p></article>`).join('\n');
await writeFile(new URL('index.html',folder),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sid’s neighborhood · Five story frames</title><style>body{margin:0;background:#fbfcff;color:#243456;font-family:Arial,Helvetica,sans-serif}main{max-width:560px;margin:48px auto;padding:0 16px}h1,h2{font-family:Georgia,serif;font-weight:400;letter-spacing:-.025em;line-height:1.2}h1{font-size:32px}h2{font-size:26px;margin:22px 0 12px}p{font-size:14px;line-height:1.7;color:#65728a}a{color:#3156b2;text-underline-offset:3px;display:inline-flex;align-items:center;min-height:44px}article{margin-top:44px;padding-bottom:36px;border-bottom:1px solid #e4e9f3}.step{font-size:10px;letter-spacing:.12em;text-transform:uppercase}img{display:block;width:100%;height:auto;background:white}footer{padding:24px 0}a:focus-visible{outline:2px solid #244dff;outline-offset:4px}</style></head><body><main><header><p class="step">GeoMarketeer · Story review</p><h1>Sid’s neighborhood</h1><p>Five frames from the 3D neighborhood. An illustrative scenario.</p><a href="../../../../geomarketeer-kit-neighborhood.html?mode=story">Open the interactive story ↗</a></header>${markup}<footer><a href="../../../../geomarketeer-kit-neighborhood.html">Explore the neighborhood ↗</a></footer></main></body></html>\n`);
// Browser-only verification surface. Production pages contain no fault controls.
let fixture=await readFile(new URL('../../../geomarketeer-kit-neighborhood.html',import.meta.url),'utf8');
fixture=fixture.replace('<head>','<head><base href="../../../../">').replace(/<script type="module" src="scripts\/geomarketeer-kit\/neighborhood-viewer.js[^\"]*"><\/script>/,'');
fixture=fixture.replace('</body>',`<button id="forceContextLoss" style="position:fixed;right:12px;bottom:12px;z-index:20;padding:12px;background:white;border:1px solid #a7b5d5;border-radius:4px;font:12px Arial">Test: lose WebGL context</button><script type="module">
import {initNeighborhoodViewer} from './scripts/geomarketeer-kit/neighborhood-controller.js';
import {createNeighborhoodStage} from './scripts/geomarketeer-kit/neighborhood-stage.js';
let blocked=new URLSearchParams(location.search).has('initFailure');
initNeighborhoodViewer({createStage:options=>{if(blocked){blocked=false;throw new Error('Deliberate initialization failure');}return createNeighborhoodStage(options);}});
document.getElementById('forceContextLoss').addEventListener('click',()=>{const canvas=document.querySelector('#neighborhoodViewport canvas');const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');gl?.getExtension('WEBGL_lose_context')?.loseContext();});
</script></body>`);
await writeFile(new URL('browser-fixture.html',folder),fixture);model.dispose();console.log('Exported five shot definitions, the script-free reader and the browser verification fixture.');
