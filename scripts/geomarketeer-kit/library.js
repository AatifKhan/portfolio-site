import { buildTower } from './tower.js';
import { createKitMaterials } from './style.js';
import { compileStaticAsset } from './compile.js';
import * as THREE from '../../assets/vendor/three/three.module.js';
import { buildCafe, CAFE_VARIANTS } from './cafe.js';
import { buildOffice, OFFICE_VARIANTS } from './office.js';
import { buildSmallBuilding, SMALL_VARIANTS } from './small-building.js';
import { buildCar } from './car.js';
import { buildTwoWheeler } from './two-wheelers.js';
import { buildPerson, PERSON_POSES } from './people.js';
import {buildPlanting, PLANTING_VARIANTS} from './planting.js';
import {buildStreet,STREET_MASTERS} from './street.js';
import {buildMetro} from './metro.js';
import {buildGround,GROUND_VARIANTS} from './ground.js';

export function createAssetLibrary() {
    const materials=createKitMaterials(),cache=new Map();
    materials.glazing=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
    const resize=materials.resize.bind(materials);
    materials.resize=(width,height,span,zoom=1)=>{resize(width,height,span,zoom);materials.silhouette.uniforms.width.value=span/height/zoom*1.15;};
    let disposed=false;
    return {
        materials,
        createAsset({assetId,variantId='standard',instanceId=assetId}) {
            if(disposed)throw new Error('This asset library has been disposed.');
            const builder=assetId==='residential-tower'&&variantId==='standard'?()=>buildTower(materials):assetId==='cafe'&&CAFE_VARIANTS.some(spec=>spec.id===variantId)?()=>buildCafe(materials,variantId):assetId==='office'&&OFFICE_VARIANTS.some(spec=>spec.id===variantId)?()=>buildOffice(materials,variantId):assetId==='small-building'&&SMALL_VARIANTS.some(spec=>spec.id===variantId)?()=>buildSmallBuilding(materials,variantId):assetId==='hatchback'&&variantId==='standard'?()=>buildCar(materials,variantId):null;
            const personBuilder=assetId==='person'&&PERSON_POSES.some(p=>p.id===variantId)?()=>buildPerson(materials,variantId):null;
            const plantingBuilder=PLANTING_VARIANTS.some(s=>s.assetId===assetId&&s.variantId===variantId)?()=>buildPlanting(materials,assetId,variantId):null;
            const streetBuilder=STREET_MASTERS.some(s=>s.assetId===assetId)&&variantId==='standard'?()=>buildStreet(materials,assetId,variantId):null;
            const metroBuilder=assetId==='metro-entrance'&&variantId==='standard'?()=>buildMetro(materials,variantId):null;
            const groundBuilder=GROUND_VARIANTS.some(s=>s.assetId===assetId&&s.variantId===variantId)?()=>buildGround(materials,assetId,variantId):null;
            const available=groundBuilder||builder||personBuilder||plantingBuilder||streetBuilder||metroBuilder||(['scooter','bicycle'].includes(assetId)&&variantId==='standard'?()=>buildTwoWheeler(materials,assetId,variantId):null);
            if(!available)throw new Error(`Asset is not available at this checkpoint: ${assetId}/${variantId}`);
            const key=`${assetId}/${variantId}`;
            if(!cache.has(key))cache.set(key,compileStaticAsset(available(),materials,{preserveHierarchy:assetId==='metro-entrance',place:assetId==='metro-entrance'?'metro':undefined}));
            const master=cache.get(key),group=master.group.clone(true);
            group.name=instanceId;group.userData.instanceId=instanceId;
            return {group,bounds:master.bounds.clone(),anchors:Object.fromEntries(Object.entries(master.anchors).map(([key,value])=>[key,value.clone()]))};
        },
        dispose() {
            if(disposed)return;disposed=true;
            const geometries=new Set();
            for(const asset of cache.values())asset.group.traverse(object=>{if(object.geometry)geometries.add(object.geometry);});
            for(const geometry of geometries)geometry.dispose();
            materials.dispose();materials.glazing.dispose();cache.clear();
        },
    };
}
