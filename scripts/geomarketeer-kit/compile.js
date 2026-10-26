import * as THREE from '../../assets/vendor/three/three.module.js';
import { KitDrawing } from './style.js';

// Author with named, repeated subcomponents; compile a shared rendering master.
// This collapses draw calls, not the source definition or the placement registry.
export function compileStaticAsset(asset,materials,options={}) {
    // Keep named metro assemblies available for component and cutaway review.
    // Existing assets retain the original single-batch compilation path.
    if(options.preserveHierarchy&&asset.group.children.some(child=>child.isGroup)){
        const group=new THREE.Group();group.name=asset.group.name;group.userData={...asset.group.userData,compiled:true,parts:[]};
        for(const child of [...asset.group.children]){
            const result=compileStaticAsset({group:child,bounds:asset.bounds,anchors:{}},materials,options);
            group.add(result.group);group.userData.parts.push(child.name,...(result.group.userData.parts||[]));
        }
        return {...asset,group};
    }
    const drawing=new KitDrawing(asset.group.name,materials,options.place||asset.group.userData.family||'tower');
    const separateSurfaces=new Map();
    const p=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3(),oldGeometry=new Set(),parts=[];
    asset.group.updateMatrixWorld(true);
    asset.group.traverse(object=>{
        parts.push(object.name);
        if(!object.geometry)return;
        const geometry=object.geometry;oldGeometry.add(geometry);
        if(object.isLineSegments2){
            const weight=object.name.split('/').at(-1),start=geometry.getAttribute('instanceStart'),end=geometry.getAttribute('instanceEnd');
            if(!drawing.strokes[weight])throw new Error(`Unknown stroke weight: ${weight}`);
            for(let i=0;i<start.count;i++){
                p.fromBufferAttribute(start,i).applyMatrix4(object.matrixWorld);drawing.strokes[weight].push(p.x,p.y,p.z);
                p.fromBufferAttribute(end,i).applyMatrix4(object.matrixWorld);drawing.strokes[weight].push(p.x,p.y,p.z);
            }
        }else if(object.isMesh){
            let destination=drawing;
            if(object.material!==materials.faces){
                if(!separateSurfaces.has(object.material))separateSurfaces.set(object.material,new KitDrawing(`${asset.group.name}/glazing`,materials,asset.group.userData.family));
                destination=separateSurfaces.get(object.material);
            }
            const position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),colour=geometry.getAttribute('color');
            normalMatrix.getNormalMatrix(object.matrixWorld);
            for(let i=0;i<position.count;i++){
                p.fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld);destination.vertices.push(p.x,p.y,p.z);
                n.fromBufferAttribute(normal,i).applyMatrix3(normalMatrix).normalize();destination.normals.push(n.x,n.y,n.z);
                destination.colors.push(colour.getX(i),colour.getY(i),colour.getZ(i));
            }
        }
    });
    const group=drawing.finish();group.userData={...asset.group.userData,parts,compiled:true};
    for(const[material,batch]of separateSurfaces){const surfaces=batch.finish();surfaces.traverse(object=>{if(object.isMesh)object.material=material;});group.add(surfaces);}
    for(const geometry of oldGeometry)geometry.dispose();
    return {...asset,group};
}
