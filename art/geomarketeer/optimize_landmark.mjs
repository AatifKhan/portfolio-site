import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRMaterialsUnlit,KHRTextureBasisu} from '@gltf-transform/extensions';
import {dedup,weld,prune,meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import sharp from 'sharp';
const dir=resolve(import.meta.dirname,'../../assets/portfolio/geomarketeer/landmark-section');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(resolve(dir,'landmark.glb'));
const unlit=doc.createExtension(KHRMaterialsUnlit);
for(const mat of doc.getRoot().listMaterials())if(mat.getName()==='Baked landmark illumination'){
  const tex=mat.getEmissiveTexture();if(!tex)throw Error('Missing baked atlas');
  mat.setBaseColorTexture(tex).setBaseColorFactor([1,1,1,1]).setEmissiveTexture(null).setEmissiveFactor([0,0,0]);
  mat.setExtension('KHR_materials_unlit',unlit.createUnlit());
}
for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(p.getMaterial()?.getExtension('KHR_materials_unlit')){p.setAttribute('NORMAL',null);p.setAttribute('TANGENT',null);}
await doc.transform(dedup(),weld(),prune({keepLeaves:true}));
const toktx=process.env.TOKTX||'/private/tmp/geomarketeer-ktx-tools/KTX-Software-4.4.2-Darwin-arm64-tools.pkg/Payload/usr/local/bin/toktx';
for(const [i,tex] of doc.getRoot().listTextures().entries()){
  const input=resolve(dir,`atlas-${i}.png`),output=resolve(dir,`atlas-${i}.ktx2`);
  await sharp(tex.getImage()).png().toFile(input);
  await promisify(execFile)(toktx,['--t2','--encode','uastc','--uastc_quality','2','--uastc_rdo_l','.75','--zcmp','18','--genmipmap','--assign_oetf','srgb','--assign_primaries','bt709','--threads','4',output,input]);
  tex.setImage(new Uint8Array(await readFile(output))).setMimeType('image/ktx2');
}
doc.createExtension(KHRTextureBasisu).setRequired(true);
await doc.transform(meshopt({encoder:MeshoptEncoder,level:'high'}));
await io.write(resolve(dir,'landmark-viewer.glb'),doc);
let triangles=0,primitives=0;
for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
  primitives++;const indices=primitive.getIndices(),position=primitive.getAttribute('POSITION');triangles+=(indices?.getCount()||position?.getCount()||0)/3;
}
const report={bytes:(await stat(resolve(dir,'landmark-viewer.glb'))).size,triangles:Math.round(triangles),meshes:doc.getRoot().listMeshes().length,primitives,textures:doc.getRoot().listTextures().length,materials:doc.getRoot().listMaterials().length,bakedMaterialUnlit:true,meshopt:true,ktx2:true};
await writeFile(resolve(dir,'asset-report.json'),JSON.stringify(report,null,2));
const [a,b]=await Promise.all([sharp(resolve(dir,'reference-detail.png')).resize(680,520).toBuffer(),sharp(resolve(dir,'detail.png')).resize(680,520).toBuffer()]);
await sharp({create:{width:1360,height:520,channels:3,background:'#fff'}}).composite([{input:a,left:0,top:0},{input:b,left:680,top:0}]).png().toFile(resolve(dir,'comparison.png'));
const source=resolve(dir,'../pune-approved-reference.png');
const focuses={
  overview:{left:650,top:270,width:780,height:380},
  landmark:{left:700,top:300,width:390,height:330},
  cafe:{left:1040,top:270,width:430,height:300},
  street:{left:930,top:325,width:570,height:255}
};
for(const [name,crop] of Object.entries(focuses)){
  await Promise.all([
    sharp(source).extract(crop).png().toFile(resolve(dir,`reference-focus-${name}.png`)),
    sharp(resolve(dir,'hero.png')).extract(crop).png().toFile(resolve(dir,`focus-${name}.png`))
  ]);
}
for(const name of ['overview','cafe']){
  const crop=focuses[name],sourceFocus=await sharp(resolve(dir,`reference-focus-${name}.png`)).toBuffer(),buildFocus=await sharp(resolve(dir,`focus-${name}.png`)).toBuffer();
  await sharp({create:{width:crop.width*2,height:crop.height,channels:3,background:'#fff'}}).composite([{input:sourceFocus,left:0,top:0},{input:buildFocus,left:crop.width,top:0}]).png().toFile(resolve(dir,`golden-${name}-comparison.png`));
}
await sharp(source).extract({left:620,top:250,width:780,height:500}).resize(936,600).png().toFile(resolve(dir,'reference-review1.png'));
const [reviewSource,reviewBuild]=await Promise.all([sharp(resolve(dir,'reference-review1.png')).toBuffer(),sharp(resolve(dir,'review1-section.png')).resize(936,600).toBuffer()]);
await sharp({create:{width:1872,height:600,channels:3,background:'#fff'}}).composite([{input:reviewSource,left:0,top:0},{input:reviewBuild,left:936,top:0}]).png().toFile(resolve(dir,'review1-comparison.png'));
console.log(report);
