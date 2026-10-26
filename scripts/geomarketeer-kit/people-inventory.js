// Reference coordinates are source-image pixels, not neighborhood placements.
// Partially occluded café guests retain the same base; bounds are review boxes.
const districts={
    housing:[
        [63,370,30],[108,395,31,'w'],[122,403,30,'w'],[186,440,29],[233,462,29],[251,447,34],[251,477,29,'w'],
        [287,502,31],[318,519,34,'w'],[361,546,33],[427,548,34],[416,567,33,'w'],[451,570,30],[532,540,29],
        [543,510,30],[559,530,31],[574,508,31],[655,487,33],[687,476,33],[753,460,31],[796,443,32],
        [498,289,37],[550,333,32],[592,417,32],
    ],
    offices:[
        [875,295,34,'w'],[945,312,34],[975,332,35],[992,322,34],[1001,358,31,'w'],[1051,389,32],
        [1089,415,33,'w'],[1117,381,34],[1142,382,34],[1153,410,33],[1134,436,33,'w'],[1162,448,33],
        [1207,445,33],[1291,400,30,'w'],[1330,374,35],[1376,356,31,'w'],
    ],
    central:[
        [895,409,33],[920,429,32,'w'],[987,458,33],[984,484,38],[1035,477,28],[1036,498,34],[1068,494,32,'w'],
        [876,529,37],[915,526,37],[944,546,37,'w'],[969,525,38],[1074,548,43],[1093,558,34],[1107,587,37],
        [971,601,43],[555,622,34,'w'],[595,619,34],[647,682,39],[738,716,35,'w'],[754,740,36,'w'],[825,737,48,'w'],[854,706,38],
        [689,680,36,'c'],[714,692,34,'c'],[755,683,28,'c',true],[716,670,30,'c',true],
        [812,672,33,'c',true],[838,661,30,'c',true],[866,649,32,'c',true],[880,646,27,'c',true],[894,668,32,'c'],[907,661,33,'c'],
    ],
    metro:[
        [1130,616,38],[1151,630,38],[1177,650,37],[1215,670,40],[1213,586,35],[1230,575,34],
        [1283,577,36],[1255,615,36],[1296,635,40],[1319,623,36],[1296,689,40],[1310,702,42],
        [1337,675,37],[1363,699,37],[1395,665,41],
    ],
    'cafe-lane':[
        [258,892,38],[422,946,41],[459,967,44],[665,995,44],
        [177,852,30,'c'],[202,869,33,'c'],[232,875,33,'c'],[235,843,29,'c',true],
        [301,897,33,'c'],[320,910,33,'c'],[337,878,32,'c',true],[355,920,32,'c'],[384,922,36,'c'],[366,900,29,'c',true],
        [631,950,32,'c'],[651,952,31,'c'],[663,934,29,'c',true],[694,976,33,'c'],[716,982,35,'c'],[717,945,28,'c',true],
        [796,960,32,'c'],[811,966,33,'c'],[833,973,36,'c'],
    ],
    perimeter:[
        [168,531,36,'w'],[276,645,38],[313,684,38],[428,729,41],[50,800,37],[859,892,41],[924,978,47],
        [1107,981,44,'w'],[1207,863,43,'w'],[1292,905,42],[1329,939,42],[1194,916,33],
    ],
};
const poses={s:'standing',w:'walking',c:'seated'};
export const PEOPLE_SOURCE_OBJECTS=Object.freeze([
    ...Object.entries(districts).flatMap(([districtId,figures])=>figures.map(([x,feet,height,pose='s',occluded=false],i)=>({id:`person-${districtId}-${String(i+1).padStart(2,'0')}`,assetId:'person',variantId:poses[pose],districtId,sourceBounds:[x-(pose==='c'?13:11),feet-height,pose==='c'?26:22,height],referenceConfiguration:pose==='c'?'cafe-guest':'pedestrian',partiallyOccluded:occluded,reviewStatus:'approved',placementStatus:'unplaced'}))),
    ...[
        ['northwest','housing',[171,456,26,36],'road-scooter-northwest-01'],
        ['west','perimeter',[348,568,25,34],'road-scooter-west-01'],
        ['central','central',[519,553,24,34],'road-scooter-central-01'],
        ['south','central',[895,790,28,43],'road-scooter-south-01'],
    ].map(([id,districtId,sourceBounds,vehicleSourceId])=>({id:`person-rider-${id}`,assetId:'person',variantId:'riding-scooter',districtId,sourceBounds,referenceConfiguration:'scooter-rider',vehicleSourceId,partiallyOccluded:true,reviewStatus:'approved',placementStatus:'unplaced'})),
].map(Object.freeze));
