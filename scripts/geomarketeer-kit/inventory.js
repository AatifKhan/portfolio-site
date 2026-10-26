// The current attachment is pixel-identical to this preserved image. All source
// coordinates refer to its 1536 × 1024 pixels, not the older five-building study.
export const REFERENCE=Object.freeze({
    image:'art/geomarketeer/detailed-blue-illustration-v2/illustration.png',width:1536,height:1024,
    pixelHash:'ed9810cea9ea1dfcd7141fda1dddcdc04e1705ea511122021c98379de7c55217',
    masterCrop:[310,150,180,294],housingCrop:[162,5,675,438],
    origin:[400,395],pixelsPerUnit:30.9,
});

export const FAMILIES=Object.freeze([
    {id:'residential',name:'Residential towers',status:'approved',masters:['residential-tower'],parts:['shell','floor','window','balcony','entrance','parapet','rooftop enclosure'],variations:'Placement and orientation only; all five towers have identical dimensions.'},
    {id:'cafes',name:'Cafés & storefronts',status:'approved',masters:['cafe-shell','storefront','awning'],parts:['glazing','door','roof','optional upper floor'],variations:'Declared width, upper-floor, awning and corner-glazing variants.'},
    {id:'furniture',name:'Café furniture',status:'approved',masters:['table','chair','cup','menu-board','counter','display'],parts:[],variations:'Seating arrangements assembled from the same furniture.'},
    {id:'offices',name:'Office buildings',status:'approved',masters:['office-shell','window-band','office-entry'],parts:['parapet','rooftop enclosure'],variations:'Declared width, height and entry variants.'},
    {id:'small-buildings',name:'Small buildings',status:'approved',masters:['low-rise-shell','annex'],parts:['door','window','flat roof'],variations:'Gatehouse, utility, home and annex configurations.'},
    {id:'cars',name:'Cars',status:'approved',masters:['hatchback'],parts:['body','cabin','glazing','wheels','lights','mirrors','bumpers'],variations:'One static hatchback; placement and heading only.'},
    {id:'two-wheelers',name:'Two-wheelers',status:'approved',masters:['scooter','bicycle'],parts:['body','frame','wheels','seat','handlebars'],variations:'One parked scooter and one parked bicycle; placement and heading only. Riders use the separate person master.'},
    {id:'people',name:'People',status:'approved',masters:['person'],parts:['head','torso','arms','legs','feet'],variations:'Standing, walking pose, seated and riding; static in this version.'},
    {id:'planting',name:'Trees & planting',status:'approved',masters:['capsule-tree','conifer','pot','low-planter'],parts:['trunk','crown','highlight'],variations:'Small, fixed size variants; preserve sparse planting.'},
    {id:'street',name:'Street furniture',status:'approved',masters:['lamp','bollard','bench','bin','fence-panel','gatepost'],parts:[],variations:'Identical repeated props; fences built from shared panels.'},
    {id:'metro',name:'Metro entrance',status:'approved',masters:['metro-entrance'],parts:['stairwell','steps','landing','handrail','railing','canopy','M sign'],variations:'One landmark assembly.'},
    {id:'ground',name:'Ground & courtyard',status:'approved',masters:['road','pavement','kerb','crossing','lane-marking','parking-bay','courtyard'],parts:['paving grid','lane markings'],variations:'Layout-specific surfaces with shared materials and marking modules.'},
]);

export const DISTRICTS=Object.freeze([
    {id:'housing',label:'Housing society',bounds:[168,8,660,522]},
    {id:'offices',label:'Office district',bounds:[895,110,420,300]},
    {id:'central',label:'Central café & parking',bounds:[663,506,497,310]},
    {id:'metro',label:'Metro plaza',bounds:[1151,474,274,220]},
    {id:'cafe-lane',label:'Foreground café lane',bounds:[179,672,676,342]},
    {id:'perimeter',label:'Perimeter buildings',bounds:[24,507,1459,459]},
]);

export function fromReference([px,py]) {
    const difference=(px-REFERENCE.origin[0])/(REFERENCE.pixelsPerUnit/Math.sqrt(2));
    const sum=(py-REFERENCE.origin[1])/(REFERENCE.pixelsPerUnit*.5/Math.sqrt(2));
    return [(sum+difference)/2,0,(sum-difference)/2];
}

export const TOWER_INSTANCES=Object.freeze([
    {id:'housing-tower-01',label:'Foreground master',reference:[400,395],sourceBounds:[320,160,159,277]},
    {id:'housing-tower-02',label:'West tower',reference:[267,315],sourceBounds:[173,86,176,271]},
    {id:'housing-tower-03',label:'Rear west tower',reference:[423,213],sourceBounds:[346,10,143,246]},
    {id:'housing-tower-04',label:'Rear east tower',reference:[584,267],sourceBounds:[509,30,145,279]},
    {id:'housing-tower-05',label:'East tower',reference:[752,372],sourceBounds:[672,127,154,290]},
].map(spec=>Object.freeze({...spec,assetId:'residential-tower',variantId:'standard',districtId:'housing',position:fromReference(spec.reference),rotation:0,scale:1,status:'approved'})));
