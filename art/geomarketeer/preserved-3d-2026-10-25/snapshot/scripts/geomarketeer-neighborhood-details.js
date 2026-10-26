// Measured in the approved 1448 × 1086 image. Points describe visible image
// landmarks, not arbitrary world offsets. Keep this map with the illustration.
export const BENCHES = [
    {id:'bench-west',seat:[153,557],heading:-Math.PI/2,length:1.7},
    {id:'bench-middle',seat:[245,573],heading:Math.PI,length:1.7},
    {id:'bench-east',seat:[310,607],heading:Math.PI,length:1.7},
];
export const CAPSULE_TREES = [
    {id:'tree-park-west',foot:[98,597],centerY:501,width:56,height:116},
    {id:'tree-office-west',foot:[214,474],centerY:386,width:55,height:112},
    {id:'tree-office-east',foot:[585,495],centerY:429,width:49,height:95},
    {id:'tree-cafe-west',foot:[533,719],centerY:645,width:51,height:96},
    {id:'tree-cafe-east',foot:[934,751],centerY:673,width:58,height:100},
    {id:'tree-shop-back',foot:[815,248],centerY:153,width:55,height:116},
    {id:'tree-home-back',foot:[914,362],centerY:284,width:44,height:85},
    {id:'tree-apartment-east',foot:[1361,597],centerY:490,width:54,height:119},
    {id:'tree-apartment-front',foot:[1228,697],centerY:627,width:50,height:81},
];
export const CONIFERS = [
    {id:'conifer-park',foot:[159,531],tipY:414,width:62},
    {id:'conifer-office',foot:[524,528],tipY:418,width:63},
    {id:'conifer-shop',foot:[867,270],tipY:165,width:57},
    {id:'conifer-home',foot:[884,436],tipY:331,width:60},
    {id:'conifer-apartment',foot:[1032,596],tipY:491,width:58},
    {id:'conifer-cafe-east',foot:[881,660],tipY:552,width:55},
    {id:'conifer-cafe-west',foot:[457,742],tipY:653,width:46},
];
export const ROUND_TREES = [
    {id:'tree-office-round',foot:[458,571],centerY:518,width:69,height:71},
    {id:'tree-park-round',foot:[189,671],centerY:614,width:57,height:67},
];
// `rim` is the projected center of the planter's upper rim, rather than its
// back corner. This matters for matching the foliage and pavement relationship.
export const PLANTERS = [
    {id:'planter-office-west',rim:[262,486],w:1.15,d:.70,clouds:3},
    {id:'planter-office-door',rim:[365,529],w:1.05,d:.65,clouds:3},
    {id:'planter-office-round',rim:[425,551],w:1.15,d:.75,clouds:3},
    {id:'planter-park-front',rim:[254,657],w:1.95,d:1.05,clouds:4},
    {id:'planter-shop-hidden',rim:[599,260],w:.8,d:.55,clouds:2},
    {id:'planter-shop-east',rim:[833,287],w:1.15,d:.65,clouds:3},
    {id:'planter-home-west',rim:[934,437],w:1.50,d:.65,clouds:4},
    {id:'planter-home-front',rim:[1004,482],w:1.10,d:.65,clouds:3},
    {id:'planter-home-east',rim:[1043,480],w:1.35,d:.60,clouds:3},
    {id:'planter-apartment-west',rim:[1086,584],w:1.45,d:.65,clouds:4},
    {id:'planter-apartment-front',rim:[1161,650],w:1.35,d:.65,clouds:3},
    {id:'planter-apartment-east',rim:[1311,624],w:1.8,d:.70,clouds:4},
    {id:'planter-cafe-west',rim:[506,718],w:.90,d:.80,clouds:3,tall:true},
    {id:'planter-cafe-northwest',rim:[551,730],w:.65,d:.65,clouds:2,tall:true},
    {id:'planter-cafe-board',rim:[722,858],w:.65,d:.65,clouds:2,tall:true},
    {id:'planter-cafe-front',rim:[809,830],w:1.35,d:.70,clouds:3},
    {id:'planter-cafe-east',rim:[911,748],w:1.35,d:.70,clouds:3},
];
export const LAMPS = [
    {id:'lamp-park-front',foot:[131,648],capY:583},
    {id:'lamp-park-middle',foot:[205,557],capY:486},
    {id:'lamp-office-street',foot:[614,474],capY:352},
    {id:'lamp-cafe-west',foot:[496,728],capY:562},
    {id:'lamp-home-west',foot:[878,482],capY:424},
    {id:'lamp-apartment-front',foot:[1267,697],capY:624},
    {id:'lamp-apartment-east',foot:[1374,625],capY:577},
];
export const BOLLARDS = [
    {id:'bollard-shop',foot:[871,317],height:1.0},
    {id:'bollard-cafe-west',foot:[423,753],height:1.15},
    {id:'bollard-cafe-midwest',foot:[477,788],height:1.05},
    {id:'bollard-cafe-frontwest',foot:[548,840],height:1.0},
    {id:'bollard-cafe-front',foot:[623,880],height:1.0},
    {id:'bollard-cafe-board',foot:[734,918],height:1.0},
    {id:'bollard-cafe-east',foot:[954,761],height:1.2},
];
export const TABLES = [
    {id:'table-cafe-west',top:[556,775],rotation:Math.PI/2,guests:1},
    {id:'table-cafe-front',top:[633,828],rotation:Math.PI/2,guests:2},
    {id:'table-cafe-east',top:[853,784],rotation:0,guests:2},
];
export const FACADE_COUNTS = {
    offices:{front:{columns:3,rows:6},side:{columns:4,rows:6},frontDoorReplacesWindow:true},
    cafe:{front:{columns:2,rows:1},side:{columns:2,rows:1}},
    home:{front:{columns:2,rows:2},side:{columns:2,rows:2},frontDoorReplacesWindow:true},
    apartments:{front:{columns:3,rows:3},side:{columns:3,rows:3},frontDoorReplacesWindow:true,balconies:2},
    shop:{front:{columns:1,rows:1},side:{columns:3,rows:1}},
};
// Paint corners were measured from the source's white components, then kept
// as ordinary editable floor polygons. The generated source slightly skews them.
export const CROSSWALKS = [
    {id:'crosswalk-west',count:7,step:[-19.1,11.9],referenceIndex:2,corners:[[556,919],[602,951],[593,957],[545,924]]},
    {id:'crosswalk-east',count:8,step:[18.2,12.7],referenceIndex:3,corners:[[788,958],[841,922],[849,928],[791,968]]},
];
export const DRAINS = [
    {id:'drain-park',center:[409,647]},
    {id:'drain-home',center:[897,536]},
    {id:'drain-apartment',center:[1062,658]},
    {id:'drain-cafe-west',center:[410,784]},
    {id:'drain-cafe-east',center:[917,825]},
];
export const STANDING_PEOPLE = [
    {id:'person-office-entry',foot:[309,542]},
    {id:'person-park',foot:[383,609]},
    {id:'person-shop-west',foot:[658,339]},
    {id:'person-shop-east',foot:[739,365]},
    {id:'person-home',foot:[952,524]},
    {id:'person-apartment',foot:[1282,679]},
    {id:'person-cafe',foot:[766,875]},
];
export const CARS = [
    {id:'car-back',foot:[712,439],yaw:0,bbox:[663,382,100,68]},
    {id:'car-park',foot:[218,775],yaw:0,bbox:[161,710,109,88]},
    {id:'car-front',foot:[438,900],yaw:0,bbox:[380,833,121,98]},
    {id:'car-east',foot:[1139,806],yaw:-Math.PI/2,bbox:[1078,738,121,96]},
    {id:'car-cafe',foot:[1030,723],yaw:0,bbox:[971,637,104,87]},
];
