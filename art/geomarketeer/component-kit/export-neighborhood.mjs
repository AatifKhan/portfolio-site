import {writeFile} from 'node:fs/promises';
import {buildNeighborhood} from '../../../scripts/geomarketeer-kit/neighborhood-model.js';
import {VIEWPOINTS,projectPoint} from '../../../scripts/geomarketeer-kit/neighborhood-manifest.js';
import {SURFACE_REGIONS} from '../../../scripts/geomarketeer-kit/neighborhood-ground.js';
const model=buildNeighborhood();
const surfaces=model.surfaces.map(s=>({...s,assetId:s.id==='road-network'?'road':'pavement',variantId:'layout-polygon',componentStatus:'approved',reviewStatus:'awaiting-composition-review',placementStatus:'placed',reference:projectPoint([s.points[0][0],0,s.points[0][1]]),sourcePolygon:SURFACE_REGIONS.find(r=>r.id===s.id)?.points}));
const inventory={...model.manifest,viewpoints:VIEWPOINTS,surfaces,summary:{componentInstances:model.assets.length,layoutSurfaces:surfaces.length,byAsset:model.assets.reduce((result,a)=>(result[a.record.assetId]=(result[a.record.assetId]||0)+1,result),{}),pedestrianFitAdjustments:model.manifest.instances.filter(r=>r.sourcePosition).length},componentParts:model.assets.map(a=>({instanceId:a.record.id,parts:a.group.userData.parts||[],idRule:'instanceId / authored part path',bounds:{min:a.bounds.min.toArray(),max:a.bounds.max.toArray()}}))};
await writeFile(new URL('neighborhood-manifest.json',import.meta.url),JSON.stringify(inventory,null,2)+'\n');model.dispose();console.log(JSON.stringify(inventory.summary,null,2));
