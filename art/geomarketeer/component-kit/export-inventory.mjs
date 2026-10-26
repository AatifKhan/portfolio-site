import {writeFile} from 'node:fs/promises';
import {REFERENCE,FAMILIES,DISTRICTS,TOWER_INSTANCES} from '../../../scripts/geomarketeer-kit/inventory.js';
import {CAFE_BASE,CAFE_VARIANTS} from '../../../scripts/geomarketeer-kit/cafe.js';
import {OFFICE_BASE,OFFICE_VARIANTS} from '../../../scripts/geomarketeer-kit/office.js';
import {SMALL_BASE,SMALL_VARIANTS,SMALL_SOURCE_OBJECTS} from '../../../scripts/geomarketeer-kit/small-building.js';
import {CAR_BASE,CAR_SOURCE_OBJECTS} from '../../../scripts/geomarketeer-kit/car.js';
import {TWO_WHEELER_REVISION,TWO_WHEELER_MASTERS,TWO_WHEELER_SOURCE_OBJECTS} from '../../../scripts/geomarketeer-kit/two-wheelers.js';
import {PERSON_BASE,PERSON_POSES} from '../../../scripts/geomarketeer-kit/people.js';
import {PEOPLE_SOURCE_OBJECTS} from '../../../scripts/geomarketeer-kit/people-inventory.js';
import {PLANTING_REVISION,PLANTING_MASTERS,PLANTING_VARIANTS} from '../../../scripts/geomarketeer-kit/planting.js';
import {PLANTING_SOURCE_OBJECTS} from '../../../scripts/geomarketeer-kit/planting-inventory.js';
import {STREET_REVISION,STREET_MASTERS} from '../../../scripts/geomarketeer-kit/street.js';
import {STREET_SOURCE_OBJECTS,STREET_REFERENCE_NOTES} from '../../../scripts/geomarketeer-kit/street-inventory.js';
import {METRO,METRO_PARTS,METRO_SOURCE_OBJECTS} from '../../../scripts/geomarketeer-kit/metro.js';
import {GROUND,GROUND_VARIANTS} from '../../../scripts/geomarketeer-kit/ground.js';
import {GROUND_SOURCE_OBJECTS,GROUND_REFERENCE_NOTES} from '../../../scripts/geomarketeer-kit/ground-inventory.js';
const inventory={checkpoint:'neighborhood-12',status:'awaiting-composition-review',assembledScene:{viewer:'geomarketeer-kit-neighborhood.html',manifest:'art/geomarketeer/component-kit/neighborhood-manifest.json',revision:1},reference:REFERENCE,families:FAMILIES,districts:DISTRICTS,instances:TOWER_INSTANCES,
    approvals:[{family:'residential',revision:1,status:'approved',evidence:'User: “The tower looks good. Let’s move on to the café component.”'},
        {family:'cafes',revision:2,status:'approved',includes:['furniture'],evidence:'User: “The cafés look good now. Let’s move on to the office buildings.”'},
        {family:'offices',revision:1,status:'approved',evidence:'User: “The offices look good. Let’s move on to the small buildings.”'},
        {family:'small-buildings',revision:1,status:'approved',evidence:'User: “The small buildings look good. Let’s move on to the cars.”'},
        {family:'cars',revision:1,status:'approved',evidence:'User: “The car looks good. Let’s move on to scooters and bicycles.”'},
        {family:'two-wheelers',revision:1,status:'approved',evidence:'User: “The scooters and bicycles look good. Let’s move on to people.”'},
        {family:'people',revision:2,status:'approved',evidence:'User: “The people look good now. Let’s move on to trees and planting.”'},
        {family:'planting',revision:1,status:'approved',evidence:'User: “The trees and planting look good. Let’s move on to street furniture.”'},
        {family:'street',revision:1,status:'approved',evidence:'User requested the next component: “Go ahead with the metro entrance mnow”.'},
        {family:'metro',revision:1,status:'approved',evidence:'User asked what follows metro and accepted the proposed ground/courtyard checkpoint: “Go ahead then.”'},{family:'ground',revision:1,status:'approved',evidence:'User accepted the proposed neighborhood assembly after the ground checkpoint: “Go ahead”.'}],
    cafe:{base:CAFE_BASE,variants:CAFE_VARIANTS,placementStatus:'unplaced',sourceObjects:CAFE_VARIANTS.map(spec=>({id:spec.sourceId,assetId:'cafe',variantId:spec.id,sourceBounds:spec.referenceCrop,reviewStatus:'approved',placementStatus:'unplaced'}))},
    office:{base:OFFICE_BASE,variants:OFFICE_VARIANTS,placementStatus:'unplaced',sourceObjects:OFFICE_VARIANTS.map(spec=>({id:spec.sourceId,assetId:'office',variantId:spec.id,districtId:'offices',sourceBounds:spec.referenceCrop,reviewStatus:'approved',placementStatus:'unplaced'}))},
    smallBuildings:{base:SMALL_BASE,variants:SMALL_VARIANTS,sourceObjects:SMALL_SOURCE_OBJECTS,placementStatus:'unplaced'},
    car:{base:CAR_BASE,variants:[{id:'standard',masterId:'hatchback',revision:CAR_BASE.revision}],sourceObjects:CAR_SOURCE_OBJECTS,placementStatus:'unplaced'},
    twoWheelers:{revision:TWO_WHEELER_REVISION,masters:TWO_WHEELER_MASTERS,sourceObjects:TWO_WHEELER_SOURCE_OBJECTS,placementStatus:'unplaced',configuration:'parked',occupants:'Approved separate person poses'},
    people:{base:PERSON_BASE,poses:PERSON_POSES,sourceObjects:PEOPLE_SOURCE_OBJECTS,placementStatus:'unplaced',sourceBoundsStatus:'Review boxes; partially occluded guest boundaries remain provisional until composition review',inferredPoseFits:['riding-bicycle']},
    planting:{revision:PLANTING_REVISION,masters:PLANTING_MASTERS,variants:PLANTING_VARIANTS,sourceObjects:PLANTING_SOURCE_OBJECTS,placementStatus:'unplaced',inferredVariants:['planter-short']},
    street:{revision:STREET_REVISION,masters:STREET_MASTERS,sourceObjects:STREET_SOURCE_OBJECTS,referenceNotes:STREET_REFERENCE_NOTES,placementStatus:'unplaced'},
    metro:{base:METRO,parts:METRO_PARTS,sourceObjects:METRO_SOURCE_OBJECTS,placementStatus:'unplaced',groundCutout:[[-2.8,-1.47],[2.8,1.47]],inference:'Stair depth, tread count and concealed structure are coherent interpretations of the single reference.'},
    ground:{base:GROUND,variants:GROUND_VARIANTS,sourceObjects:GROUND_SOURCE_OBJECTS,referenceNotes:GROUND_REFERENCE_NOTES,placementStatus:'unplaced'},
    scope:'All twelve component families approved. Source records remain isolated component-study records; final placed instances and layout dimensions are in neighborhood-manifest.json. Assembled composition awaits review; portfolio integration remains a later phase.'};
await writeFile(new URL('./inventory.json',import.meta.url),JSON.stringify(inventory,null,2)+'\n');
console.log(`Exported twelve approved families and assembled-scene manifest link.`);
