import * as THREE from '../../assets/vendor/three/three.module.js';
import {STORY} from '../geomarketeer-story-data.js';
import {fitPose,surfacePoints,boundsPoints} from './neighborhood-stage.js';
import {fromReference} from './inventory.js';

export {STORY};
export const STORY_REVISION=1;
export const STORY_DURATION=850;
export const STORY_SHOTS=Object.freeze([
 {id:'idea',orbit:-6,targets:['cafe-lane-02','cafe-lane-03'],padding:1.12,emphasis:'none'},
 {id:'assumption',orbit:-3,targets:['cafe-lane-03'],context:['cafe-lane-02'],padding:1.06,emphasis:'candidate'},
 {id:'doubt',orbit:6,targets:['cafe-lane-03','metro-entrance-01','crossing-metro','parking-car-southeast-01','parking-car-southeast-02'],padding:1.12,emphasis:'connection'},
 {id:'context',orbit:0,targets:['neighborhood'],padding:1.12,emphasis:'questions'},
 {id:'response',orbit:0,targets:['neighborhood'],padding:1.12,emphasis:'candidate-and-questions'},
]);
export const storyStill=id=>`assets/portfolio/geomarketeer/component-kit/story-${id}-still.jpg?v=${STORY_REVISION}`;

export function createStoryShots(model){
 const assets=new Map(model.assets.map(a=>[a.record.id,a])),all=model.assets.flatMap(a=>boundsPoints(a.group));
 for(const s of model.surfaces)for(const[x,z]of s.points)all.push(new THREE.Vector3(x,s.top,z));
 const poses=STORY_SHOTS.map(spec=>{
  const points=spec.targets[0]==='neighborhood'?all:spec.targets.flatMap(id=>surfacePoints(assets.get(id).group));
  for(const id of spec.context||[]){const a=assets.get(id);points.push(...surfacePoints(a.group,p=>p.y<1.25&&p.z>a.record.position[2]+1.4));}
  return fitPose(points,spec.orbit,16/9,spec.padding);
 });
 // The final response deliberately holds the exact context camera.
 poses[4]={...poses[3],center:[...poses[3].center]};
 const candidate=assets.get('cafe-lane-03'),metro=assets.get('metro-entrance-01'),crossing=assets.get('crossing-metro');
 const ground=y=>p=>new THREE.Vector3(p[0],y,p[2]);
 const perimeter=(asset,w,d)=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>asset.group.localToWorld(new THREE.Vector3(x,.035,z)));
 const entry=metro.group.localToWorld(metro.anchors.entrance.clone()),candidateEntry=candidate.group.localToWorld(candidate.anchors.entrance.clone());
 // An illustrative connection follows the open plaza and the existing crossing.
 // It describes nearby access, not observed footfall or a predicted customer route.
 const route=[entry,...[[1174,575],[1181,658],[1140,714]].map(fromReference).map(ground(.035)),crossing.group.localToWorld(new THREE.Vector3(0,0,-1.95)),crossing.group.localToWorld(new THREE.Vector3(0,0,1.95)),...[[1082,849],[1024,878]].map(fromReference).map(ground(.035))];
 return {poses,candidateFootprint:perimeter(candidate,4.45,3.35),candidateEntry,metroFootprint:perimeter(metro,6.12,3.65),route};
}

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function storyOverlayMarkup(shots,camera,width=560){
 const project=p=>{const q=p.clone().project(camera);return[(q.x+1)*280,(1-q.y)*157.5];};
 const polygon=points=>points.map(p=>project(p).map(n=>n.toFixed(2)).join(',')).join(' ');
 const entry=project(shots.candidateEntry),edge=74*560/width,x=clamp(entry[0],edge,560-edge),y=clamp(entry[1]+19,28,303);
 const candidate=`<polyline class="story-footprint" points="${polygon(shots.candidateFootprint.slice(1))}"/><path class="story-leader" d="M${entry[0]} ${entry[1]} L${x} ${y-10}"/>`;
 const connection=`<polygon class="story-metro-ring" points="${polygon(shots.metroFootprint)}"/><polyline class="story-connection" points="${polygon(shots.route)}"/>`;
 return {candidate,connection,label:{x:x/560*100,y:y/315*100}};
}
