import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {stat,writeFile,readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const dir=resolve(root,'assets/portfolio/geomarketeer/review-2');
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const results={};
const metadata=JSON.parse(await readFile(resolve(dir,'scene.json'),'utf8'));
const previous=JSON.parse(await readFile(resolve(root,'assets/portfolio/geomarketeer/review-1/scene.json'),'utf8'));
assert.deepEqual(metadata.route,previous.route,'Approved main-road geometry or lane offsets changed');
assert.deepEqual(metadata.anchors,previous.anchors,'Approved landmark/story locations changed');
for(const name of ['hero','left','right','detail','cafe','homes','alternative']) {
 assert((await stat(resolve(dir,name+'.webp'))).size>1000,`Missing fallback view: ${name}`);
}
for(const kind of ['desktop','mobile']){
 const file=resolve(dir,`pune-${kind}.glb`),doc=await io.read(file),r=doc.getRoot();
 const bytes=(await stat(file)).size;
 const nodes=r.listNodes();
 for(const anchor of ['synagogue','cafe_primary','homes','offices','cafe_alternative'])assert(nodes.some(n=>n.getName()==='anchor_'+anchor),`Missing anchor: ${anchor}`);
 let triangles=0,drawCalls=0;
 for(const node of nodes){for(const p of node.getMesh()?.listPrimitives()||[]){triangles+=(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3;drawCalls++;}}
 assert(bytes<=(kind==='desktop'?8:4)*1000000,'Asset byte budget exceeded');
 assert(triangles<=(kind==='desktop'?350000:150000),'Triangle budget exceeded');
 assert(drawCalls<=(kind==='desktop'?120:80),'Draw-call budget exceeded');
 assert(r.listExtensionsUsed().some(e=>e.extensionName==='EXT_meshopt_compression'),'Meshopt missing');
 assert(r.listExtensionsUsed().some(e=>e.extensionName==='KHR_texture_basisu'),'KTX2 missing');
 assert(r.listTextures().every(t=>t.getMimeType()==='image/ktx2'),'Unexpected uncompressed texture');
 assert(nodes.filter(n=>n.getName().startsWith('Traffic_')).length===metadata.vehicleCount,'Vehicle count differs from authored scene');
 assert(metadata.traffic.filter(t=>t.direction===1).length===metadata.traffic.filter(t=>t.direction===-1).length,'Unbalanced traffic');
 results[kind]={bytes,triangles,drawCalls,anchors:5,textures:r.listTextures().length,preferredDownloadTargetMet:bytes<=(kind==='desktop'?6:3)*1000000};
}
await mkdir(resolve(root,'reports/geomarketeer-review-2'),{recursive:true});
await writeFile(resolve(root,'reports/geomarketeer-review-2/asset-verification.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
