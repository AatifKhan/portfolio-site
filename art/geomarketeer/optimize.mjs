import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRTextureBasisu } from '@gltf-transform/extensions';
import { dedup, prune, weld, meshopt, simplify } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, copyFile, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile);

const root = resolve(import.meta.dirname, '../..');
const dir = resolve(root, 'assets/portfolio/geomarketeer/review-2');
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder,
});
const report = {};
const intermediate=resolve(root,'art/geomarketeer/intermediate');
await mkdir(intermediate,{recursive:true});
for (const quality of ['desktop', 'mobile']) {
  const doc = await io.read(resolve(dir, quality==='mobile'?'pune-mobile-raw.glb':'pune-raw.glb'));
  // All authored materials are unlit: facet lighting is already in the bake.
  // Removing unused normals lets coincident foliage vertices weld without
  // changing their visible shading, and unlocks meaningful mobile reduction.
  for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
    primitive.setAttribute('NORMAL', null);
    primitive.setAttribute('TANGENT', null);
  }
  await doc.transform(dedup(), weld(), prune({keepLeaves:true}));
  if (quality === 'mobile') await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: .45, error: .01, lockBorder: false }));
  let i=0;
  for(const tex of doc.getRoot().listTextures()){
    const input=resolve(intermediate,`${quality}-${i}.png`),output=resolve(intermediate,`${quality}-${i}.ktx2`);
    const max=quality==='mobile'?(tex.getName().includes('Architecture')?1536:768):(tex.getName().includes('Architecture')?2560:1024);
    await sharp(tex.getImage()).resize({width:max,height:max,fit:'inside',withoutEnlargement:true}).png().toFile(input);
    await exec(process.env.TOKTX||'toktx',['--t2','--encode','uastc','--uastc_quality','2','--uastc_rdo_l',quality==='mobile'?'1':'.75','--zcmp','18','--genmipmap','--assign_oetf','srgb','--assign_primaries','bt709','--threads','4',output,input]);
    tex.setImage(new Uint8Array(await readFile(output))).setMimeType('image/ktx2');i++;
  }
  doc.createExtension(KHRTextureBasisu).setRequired(true);
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  const dest = resolve(dir, `pune-${quality}.glb`);
  await io.write(dest, doc);
  report[quality] = { bytes: (await stat(dest)).size };
}
for (const name of ['hero', 'left', 'right', 'detail', 'cafe', 'homes', 'alternative']) {
  await sharp(resolve(dir,`${name}.png`)).resize({ width: name === 'hero' ? 1600 : 1200 }).webp({ quality:90 }).toFile(resolve(dir,`${name}.webp`));
}
// Local, pinned runtime and decoders. Works under a GitHub Pages subdirectory.
const vendor=resolve(root,'assets/vendor/three');
await mkdir(resolve(vendor,'addons/loaders'),{recursive:true});
await mkdir(resolve(vendor,'addons/utils'),{recursive:true});
await mkdir(resolve(vendor,'addons/libs'),{recursive:true});
await mkdir(resolve(vendor,'addons/libs/basis'),{recursive:true});
const files=[['build/three.module.js','three.module.js'],['examples/jsm/loaders/GLTFLoader.js','addons/loaders/GLTFLoader.js'],['examples/jsm/utils/BufferGeometryUtils.js','addons/utils/BufferGeometryUtils.js'],['examples/jsm/libs/meshopt_decoder.module.js','addons/libs/meshopt_decoder.module.js'],['LICENSE','LICENSE'],...['loaders/KTX2Loader.js','utils/WorkerPool.js','libs/ktx-parse.module.js','libs/zstddec.module.js','libs/basis/basis_transcoder.js','libs/basis/basis_transcoder.wasm'].map(p=>['examples/jsm/'+p,'addons/'+p])];
for (const [src,dst] of files) await copyFile(resolve(root,'node_modules/three',src),resolve(vendor,dst));
await copyFile(resolve(root,'node_modules/three/examples/jsm/libs/basis/README.md'),resolve(vendor,'addons/libs/basis/README.md'));
await writeFile(resolve(dir,'asset-report.json'),JSON.stringify(report,null,2));
console.log(report);
