// Reference review boxes only. Neighborhood positions and fence repeat counts
// are intentionally deferred until composition review. Metro railings belong to metro.
const poles={
    lamp:{
        housing:[[65,334,36],[383,554,58],[581,600,56],[670,562,61]],
        offices:[[918,387,63],[1083,386,62],[1053,476,67]],
        central:[[801,517,52],[1139,703,59],[889,795,56]],
        metro:[[1139,579,82],[1341,578,71,true],[1271,687,70],[1364,644,66]],
        perimeter:[[304,631,62],[193,701,66],[398,716,61],[892,905,57],[874,995,66]],
    },
    bollard:{
        housing:[[39,346,23],[96,383,25],[149,420,23],[229,420,31],[207,457,25],[256,430,23,true],[527,328,26],[92,515,29],[144,515,33],[481,565,30,true],[513,577,25],[608,499,25]],
        offices:[[906,301,17],[1065,401,18],[1180,459,31],[860,418,28],[899,397,39,true]],
        central:[[567,631,25],[585,645,27],[648,658,28,true],[729,723,25],[785,748,27],[805,764,27],[826,777,29],[940,638,26],[1004,601,26],[1080,588,27],[1081,681,26],[1014,720,25],[1033,745,24]],
        perimeter:[[121,832,29],[526,978,34],[766,998,34],[1127,945,26]],
    },
};
const status={variantId:'standard',reviewStatus:'approved',placementStatus:'unplaced'};
export const STREET_SOURCE_OBJECTS=Object.freeze([
    ...Object.entries(poles).flatMap(([assetId,districts])=>Object.entries(districts).flatMap(([districtId,points])=>points.map(([x,feet,height,partiallyOccluded=false],i)=>({id:`${assetId}-${districtId}-${String(i+1).padStart(2,'0')}`,assetId,districtId,reference:[x,feet],sourceBounds:[x-(assetId==='lamp'?9:6),feet-height,assetId==='lamp'?18:12,height+2],partiallyOccluded,sourceBoundsStatus:'provisional-review-box',...status})))),
    {id:'bench-housing-01',assetId:'bench',districtId:'housing',reference:[540,395],sourceBounds:[526,369,33,31],...status},
    ...[[531,489,438],[575,481,431],[586,492,439],[629,474,421],[692,451,403]].map(([x,feet,top],i)=>({id:`gatepost-housing-${String(i+1).padStart(2,'0')}`,assetId:'gatepost',districtId:'housing',reference:[x,feet],sourceBounds:[x-11,top,24,feet-top],...status})),
    ...[[539,442,33,39],[592,433,29,52],[637,416,49,51]].map((sourceBounds,i)=>({id:`fence-run-housing-${String(i+1).padStart(2,'0')}`,assetId:'fence-panel',districtId:'housing',sourceBounds,sourceKind:'continuous-run',repeatCount:null,repeatCountStatus:'Resolve whole-panel repetition during composition review',...status})),
].map(Object.freeze));
export const STREET_REFERENCE_NOTES=Object.freeze({
    inferredMasters:['bin'],bin:'No unambiguous source bin is visible. The requested bin master is an inferred kit component, with no invented source instance.',
    bounds:'Small pole caps and occluded bases use provisional review boxes; verify these boundaries during composition review.',
    fence:'Three visible housing fence runs map to the same panel. Whole-panel repeat counts remain unassigned; no per-instance scaling.',
    excluded:'The metro canopy, stair rails and perimeter railing remain part of the separate metro checkpoint.',
});
