import * as THREE from '../../assets/vendor/three/three.module.js';
import {createSeatingSet} from './cafe-furniture.js';
import {PERSON_POSES} from './people.js';

// Context props belong to this isolated review, never to the person master.
export function createPeopleReview(library,poseId){
    const spec=PERSON_POSES.find(p=>p.id===poseId),group=new THREE.Group(),owned=new Set();group.name=`review-only/${poseId}`;
    const person=library.createAsset({assetId:'person',variantId:poseId,instanceId:`review-person/${poseId}`});group.add(person.group);
    let support=null;
    if(spec.support==='chair'){
        const set=createSeatingSet(library.materials,{id:'review-chair-source',x:0,z:0});
        support=set.getObjectByName('review-chair-source/chair-0');support.removeFromParent();support.position.set(0,0,0);support.rotation.y=-Math.PI/2;support.name='review-support/chair';
        const unused=new Set();set.traverse(o=>{if(o.geometry)unused.add(o.geometry);});for(const g of unused)g.dispose();
        support.traverse(o=>{if(o.geometry)owned.add(o.geometry);});group.add(support);
    }else if(spec.support){support=library.createAsset({assetId:spec.support,instanceId:`review-support/${spec.support}`}).group;group.add(support);}
    group.userData={reviewOnly:true,poseId};group.updateMatrixWorld(true);
    return{group,person,support,owned};
}
