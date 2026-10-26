import * as THREE from '../../assets/vendor/three/three.module.js';
// Review-only connection example. It never writes neighborhood placements.
export function createFenceReview(library){
    const group=new THREE.Group();group.name='review-only/fence-assembly';const parts=[];
    let previous=library.createAsset({assetId:'gatepost',instanceId:'review-post-0'});group.add(previous.group);parts.push(previous);
    for(let i=0;i<3;i++){
        const panel=library.createAsset({assetId:'fence-panel',instanceId:`review-panel-${i}`});panel.group.position.copy(previous.group.position).add(previous.anchors.rightUpper).sub(panel.anchors.leftUpper);group.add(panel.group);parts.push(panel);
        const post=library.createAsset({assetId:'gatepost',instanceId:`review-post-${i+1}`});post.group.position.copy(panel.group.position).add(panel.anchors.rightUpper).sub(post.anchors.leftUpper);group.add(post.group);parts.push(post);previous=post;
    }
    group.updateMatrixWorld(true);const center=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());for(const part of parts)part.group.position.x-=center.x;group.updateMatrixWorld(true);group.userData.reviewOnly=true;
    return{group,bounds:new THREE.Box3().setFromObject(group),parts};
}
