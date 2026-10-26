// Two authored SVG compositions. Projection below places vector paths; it does
// not use a canvas, image texture, scene renderer, or external drawing library.
const round = value => Math.round(value * 100) / 100;
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const node = (name, attributes = {}, children = '') => `<${name} ${Object.entries(attributes).map(([key,value])=>`${key}="${escape(value)}"`).join(' ')}>${children}</${name}>`;
const group = (children, attributes = {}) => node('g', attributes, children);
const pointList = points => points.map(point=>point.map(round).join(',')).join(' ');
const polygon = (points, cls='white', attributes={}) => node('polygon',{points:pointList(points),class:cls,...attributes});
const path = (d, cls='detail', attributes={}) => node('path',{d,class:cls,...attributes});
const line = (points, cls='detail', attributes={}) => node('polyline',{points:pointList(points),class:cls,...attributes});
const rect = (x,y,width,height,cls='white',radius=0,attributes={}) => node('rect',{x:round(x),y:round(y),width:round(width),height:round(height),rx:radius,class:cls,...attributes});
const ellipse = (cx,cy,rx,ry,cls='white',attributes={}) => node('ellipse',{cx:round(cx),cy:round(cy),rx:round(rx),ry:round(ry),class:cls,...attributes});
const text = (x,y,content,cls='map-label',attributes={}) => node('text',{x:round(x),y:round(y),class:cls,...attributes},escape(content));
const use = (id,x,y,scale=1,rotation=0,attributes={}) => node('use',{href:`#${id}`,transform:`translate(${round(x)} ${round(y)}) rotate(${rotation}) scale(${scale})`,...attributes});

const PLACES = Object.freeze({
    office: { x:2.4, z:2, w:5.3, d:4.6, name:'Offices' },
    shop: { x:10, z:2.2, w:2.8, d:2.4, name:'Local shop' },
    home: { x:16.3, z:1.8, w:3.2, d:4.6, name:'A home' },
    homes: { x:16.1, z:11.1, w:4.3, d:5.1, name:'Courtyard homes' },
    cafe: { x:7, z:11.1, w:5.4, d:4.4, name:'Corner Café' },
});
const mapPoint = (x,z) => [150+x*35,50+z*35];
const mapRect = (x,z,w,d,cls='white',radius=4,attributes={}) => rect(...mapPoint(x,z),w*35,d*35,cls,radius,attributes);
const mapLine = (points,cls='detail',attributes={}) => line(points.map(([x,z])=>mapPoint(x,z)),cls,attributes);

function atlasDefinitions(prefix) {
    const tree = path('M-4-19C0-23 7-21 10-17C16-19 21-14 19-9C25-5 23 2 19 5C21 11 17 17 11 16C8 22 1 23-3 18C-10 22-15 18-15 12C-22 11-24 4-19 0C-24-6-20-13-14-13C-13-19-8-22-4-19Z','fill')
        + path('M-9-7Q-3-14 4-8M6-3Q13-6 14 1M-8 4Q-3 0 1 5M-1 12Q5 8 10 10','detail')
        + path('M-2-3L2 3L0 13M2 3L9-1','micro');
    const car = rect(-7,-16,14,32,'white',4)+rect(-5,-7,10,12,'fill',2)
        +path('M-4-12H4M-4 10H4M-8-10V-4M8-10V-4M-8 6V11M8 6V11','detail');
    const bench = rect(-16,-4,32,8,'white',1)+path('M-15-1H15M-15 2H15M-11-6V6M11-6V6','detail');
    const person = ellipse(0,2,4.4,6,'fill')+ellipse(0,-2,3,3,'white')+path('M-5 6L-6 10M5 6L6 9','detail');
    const table = ellipse(0,0,8,8,'white')+ellipse(-13,0,4,4,'fill')+ellipse(13,0,4,4,'fill')+ellipse(0,0,2,2,'warm no-stroke');
    return node('defs',{},[
        node('g',{id:`${prefix}-tree`},tree),node('g',{id:`${prefix}-car`},car),
        node('g',{id:`${prefix}-bench`},bench),node('g',{id:`${prefix}-person`},person),
        node('g',{id:`${prefix}-table`},table),
    ].join(''));
}

function atlasDrawing(prefix='atlas', interactive=true) {
    const bits=[atlasDefinitions(prefix)];
    bits.push(mapRect(-.35,-.6,22.7,20.0,'road',30));
    // Four blocks share a north-up street network. The café's east and south
    // frontages are also the frontages visible in the isometric composition.
    for(const [x,z,w,d] of [[1.3,1.15,11.6,6.15],[15.2,1.15,5.7,6.15],[1.3,9.75,11.6,7.35],[15.2,9.75,5.7,7.35]]) {
        bits.push(mapRect(x,z,w,d,'pavement',13));
    }
    // Lane marks use explicit stroke attributes so they remain visible over fill.
    for(let x=1.7;x<21.5;x+=1.25) for(const z of[.2,8.52,18.25]) bits.push(mapLine([[x,z],[x+.48,z]],'',{stroke:'#fff','stroke-width':1.8}));
    for(let z=1.6;z<18;z+=1.3) for(const x of[.35,14.05]) bits.push(mapLine([[x,z],[x,z+.5]],'',{stroke:'#fff','stroke-width':1.8}));
    for(let i=0;i<6;i++) {
        bits.push(mapRect(12.96+i*.34,7.73,.16,1.48,'white no-stroke',0));
        bits.push(mapRect(12.96+i*.34,17.48,.16,1.48,'white no-stroke',0));
        bits.push(mapRect(13.25,9.06+i*.34,1.6,.16,'white no-stroke',0));
        bits.push(mapRect(13.25,15.14+i*.34,1.6,.16,'white no-stroke',0));
    }
    // Office forecourt, roof lights, and services.
    const officeStart=bits.length;
    const office=PLACES.office;
    bits.push(mapRect(office.x-.13,office.z-.13,office.w+.26,office.d+.26,'white no-stroke',3));
    bits.push(mapRect(office.x,office.z,office.w,office.d,'fill',2));
    bits.push(mapRect(office.x+.23,office.z+.23,office.w-.46,office.d-.46,'white profile',0));
    bits.push(mapRect(3.05,2.65,1.25,.85,'fill',1),mapRect(5.2,2.65,1.6,.85,'shade detail',1));
    for(let i=0;i<4;i++)bits.push(mapLine([[5.37+i*.33,2.78],[5.37+i*.33,3.37]],'micro'));
    bits.push(mapRect(3.0,4.65,3.85,.8,'glass detail',1));
    for(let i=1;i<5;i++)bits.push(mapLine([[3+i*.77,4.65],[3+i*.77,5.45]],'detail'));
    bits.push(mapRect(4.2,6.6,1.8,.32,'shade detail',1));
    bits.push(text(...mapPoint(5.05,6.12),'Offices','map-label',{'text-anchor':'middle'}));
    bits.push(group(bits.splice(officeStart).join(''),{'data-place':'office'}));
    // A little grocery, with striped awning and a planted entrance.
    const shopStart=bits.length;
    const shop=PLACES.shop;
    bits.push(mapRect(shop.x,shop.z,shop.w,shop.d,'white',2));
    bits.push(mapRect(shop.x+.18,shop.z+.18,shop.w-.36,shop.d-.36,'fill profile',1));
    bits.push(mapRect(10.7,2.65,1.35,.55,'glass detail',1));
    bits.push(mapRect(10,4.6,2.8,.48,'white',1));
    for(let i=0;i<7;i++)bits.push(mapRect(10+i*.4,4.6,.2,.48,'fill no-stroke',0));
    bits.push(text(...mapPoint(11.4,5.62),'Local shop','map-label',{'text-anchor':'middle'}));
    bits.push(group(bits.splice(shopStart).join(''),{'data-place':'shop'}));
    // The two residential forms are intentionally different.
    const homeStart=bits.length;
    const home=PLACES.home;
    bits.push(mapRect(home.x,home.z,home.w,home.d,'white',2));
    bits.push(mapRect(home.x+.1,home.z+.1,home.w-.2,home.d-.2,'fill detail',0));
    bits.push(mapLine([[17.9,1.93],[17.9,6.27]],'detail'));
    bits.push(mapLine([[16.4,2.55],[17.9,1.93],[19.4,2.55]],'micro'));
    bits.push(mapRect(16.7,2.7,.85,1.12,'shade detail',1),mapRect(18.25,2.7,.85,1.12,'glass detail',1));
    bits.push(mapRect(17.25,6.4,1.25,.35,'white detail',1));
    bits.push(text(...mapPoint(17.9,5.58),'Home','map-label',{'text-anchor':'middle'}));
    bits.push(group(bits.splice(homeStart).join(''),{'data-place':'home'}));
    const homesStart=bits.length;
    const homes=PLACES.homes;
    const a=mapPoint(homes.x,homes.z),w=homes.w*35,d=homes.d*35;
    bits.push(path(`M${a[0]} ${a[1]}h${w}v${d}h-${w}v-${d*.35}h${w*.4}v-${d*.34}h-${w*.4}Z`,'fill'));
    bits.push(mapRect(16.3,13.0,1.35,1.4,'white detail',1));
    bits.push(mapRect(18.6,11.6,1.15,.65,'glass detail',1));
    bits.push(mapRect(18.55,15.2,1.15,.5,'white detail',1));
    for(let i=0;i<4;i++)bits.push(mapLine([[18.65+i*.27,15.22],[18.65+i*.27,15.68]],'micro'));
    bits.push(text(...mapPoint(18.8,14.05),'Homes','map-label',{'text-anchor':'middle'}));
    bits.push(group(bits.splice(homesStart).join(''),{'data-place':'homes'}));
    // Paving is localized to the garden and café frontage.
    for(let x=6.8;x<12.9;x+=.6)bits.push(mapLine([[x,15.9],[x,16.8]],'micro'));
    for(let z=10.2;z<16.8;z+=.6)bits.push(mapLine([[12.55,z],[12.86,z]],'micro'));
    bits.push(mapRect(2.05,10.5,3.5,5.55,'white detail',12));
    bits.push(mapRect(2.35,10.8,2.9,1.0,'fill no-stroke',12));
    bits.push(mapRect(2.35,14.65,2.9,1.0,'fill no-stroke',12));
    for(const[x,z,rotation]of[[2.9,12.5,90],[4.7,12.5,90],[3.8,14.0,0]])bits.push(use(`${prefix}-bench`,...mapPoint(x,z),.9,rotation));
    bits.push(text(...mapPoint(3.8,16.68),'Pocket garden','map-label',{'text-anchor':'middle'}));
    // The same footprint, roof equipment, and two street-facing awnings appear
    // in the close-up. The amber selection belongs only to this one café.
    const cafe=PLACES.cafe;
    const cafeBits=[];
    cafeBits.push(mapRect(cafe.x-.14,cafe.z-.14,cafe.w+.28,cafe.d+.28,'warm-soft',4));
    cafeBits.push(mapRect(cafe.x,cafe.z,cafe.w,cafe.d,'cafe-roof',3));
    cafeBits.push(mapRect(cafe.x+.18,cafe.z+.18,cafe.w-.36,cafe.d-.36,'warm-soft profile',1));
    cafeBits.push(mapRect(7.8,11.9,1.12,.75,'white detail',1));
    cafeBits.push(ellipse(...mapPoint(8.12,12.28),6,6,'fill detail'),ellipse(...mapPoint(8.6,12.28),6,6,'fill detail'));
    cafeBits.push(mapRect(7,15.5,5.4,.48,'white warm-line',1));
    for(let i=0;i<14;i++)cafeBits.push(mapRect(7+i*5.4/14,15.5,5.4/28,.48,'warm no-stroke',0));
    cafeBits.push(mapRect(12.4,11.1,.48,4.4,'white warm-line',1));
    for(let i=0;i<11;i++)cafeBits.push(mapRect(12.4,11.1+i*.4,.48,.2,'warm no-stroke',0));
    const label=mapPoint(9.7,13.1);
    cafeBits.push(text(label[0],label[1],'Corner','plan-sign',{'text-anchor':'middle'}),text(label[0],label[1]+23,'Café','plan-sign',{'text-anchor':'middle'}));
    for(const[x,z]of[[7.8,16.5],[9.7,16.5],[12.8,14.5]])cafeBits.push(use(`${prefix}-table`,...mapPoint(x,z),.85));
    if(interactive){
        cafeBits.push(mapRect(6.75,10.85,6.45,6.15,'focus-ring',8));
        cafeBits.push(mapRect(6.75,10.85,6.45,6.15,'no-stroke',8,{fill:'transparent'}));
    }
    bits.push(group(cafeBits.join(''),interactive?{class:'cafe-hit',role:'button',tabindex:'0','aria-label':'Explore Corner Café. Open the detailed street-corner illustration.','data-open-cafe':'','data-place':'cafe','aria-controls':'cafePanel'}:{class:'cafe-location','data-place':'cafe'}));
    // Trees and people connect the five architecture types without filling gaps.
    for(const[x,z,scale]of[[1.95,2.2,.8],[1.95,5.8,.85],[8.6,6.5,.75],[10.6,6.4,.7],[12.3,6.4,.7],[15.75,2.0,.65],[20.35,2.1,.8],[20.3,6.4,.85],[2.9,11.2,.75],[4.6,11.2,.7],[2.9,15.2,.72],[4.7,15.2,.75],[6.2,14.5,.8],[6.25,10.5,.7],[20.35,11.15,.78],[20.35,15.95,.8],[16.75,13.7,.57]])bits.push(use(`${prefix}-tree`,...mapPoint(x,z),scale));
    for(const[x,z,rotation]of[[14.05,4.25,0],[5.6,8.5,90],[18.5,18.25,90]])bits.push(use(`${prefix}-car`,...mapPoint(x,z),1,rotation));
    for(const[x,z,rotation]of[[7.9,7.0,70],[10.2,5.5,20],[6.4,16.3,100],[11.2,16.5,-40],[15.6,14,20]])bits.push(use(`${prefix}-person`,...mapPoint(x,z),1,rotation));
    bits.push(text(...mapPoint(7.8,18.37),'M A R K E T   L A N E','street-name',{'text-anchor':'middle'}));
    const street=mapPoint(14.15,13.2);
    bits.push(text(...street,'L I N D E N   S T R E E T','street-name',{transform:`rotate(-90 ${street[0]} ${street[1]})`,'text-anchor':'middle'}));
    bits.push(group(path('M0 24V-9M-4-2L0-10L4-2','detail')+text(0,-18,'N','map-label',{'text-anchor':'middle'}),{transform:'translate(977 80)'}));
    bits.push(text(150,768,'A neighborhood, imagined.','label-note'));
    return group(bits.join(''),{class:'drawing atlas-drawing'});
}

// Isometric vector drafting, in the café's own coordinate system. Positive x
// points southeast; positive z points southwest; north remains toward the back.
const UNIT=58;
const iso=(x,z,y=0)=>[540+(x-z)*Math.sqrt(3)/2*UNIT,320+(x+z)*UNIT/2-y*UNIT];
const isoLine=(points,cls='detail',attributes={})=>line(points.map(([x,z,y=0])=>iso(x,z,y)),cls,attributes);
const isoPoly=(points,cls='white',attributes={})=>polygon(points.map(([x,z,y=0])=>iso(x,z,y)),cls,attributes);
const horizontal=(x,z,y,w,d,cls='white')=>isoPoly([[x,z,y],[x+w,z,y],[x+w,z+d,y],[x,z+d,y]],cls);
function box(x,z,y,w,d,h,cls='white',outline=true) {
    const stroke=outline?'':' no-stroke';
    return isoPoly([[x,z+d,y],[x+w,z+d,y],[x+w,z+d,y+h],[x,z+d,y+h]],`${cls}${stroke}`)
        +isoPoly([[x+w,z,y],[x+w,z+d,y],[x+w,z+d,y+h],[x+w,z,y+h]],`shade${stroke}`)
        +horizontal(x,z,y+h,w,d,`${cls}${stroke}`);
}
const planePoint=(axis,side,u,y)=>axis==='front'?iso(u,side,y):iso(side,u,y);
const faceQuad=(axis,side,u,y,w,h)=>[planePoint(axis,side,u,y),planePoint(axis,side,u+w,y),planePoint(axis,side,u+w,y+h),planePoint(axis,side,u,y+h)];
function facePath(axis,side,u,y,w,h,cls='white',attrs={}) {return polygon(faceQuad(axis,side,u,y,w,h),cls,attrs);}
function faceLine(axis,side,points,cls='detail') {return line(points.map(([u,y])=>planePoint(axis,side,u,y)),cls);}

function isoCircle(x,z,y,r,cls='white',attributes={}) {
    return polygon(Array.from({length:40},(_,i)=>iso(x+Math.cos(i/40*Math.PI*2)*r,z+Math.sin(i/40*Math.PI*2)*r,y)),cls,attributes);
}
function isoCylinder(x,z,y,r,h,cls='white') {
    const front=Array.from({length:21},(_,i)=>{const a=i/20*Math.PI;return iso(x+Math.cos(a)*r,z+Math.sin(a)*r,y);});
    const back=front.map(([px,py])=>[px,py-h*UNIT]).toReversed();
    return polygon([...front,...back],`${cls} detail`)+isoCircle(x,z,y+h,r,cls);
}

function isoPot(x,z,y=0,r=.2,flower=false) {
    let art=isoCylinder(x,z,y,r,r*1.5,'white');
    art+=isoCircle(x,z,y+r*1.5,r*.88,'shade detail');
    for(let i=0;i<7;i++){
        const a=i*2.4,h=r*(2.3+i%3*.4),p=iso(x,z,y+r*1.4),q=iso(x+Math.cos(a)*r*.8,z+Math.sin(a)*r*.8,y+h);
        art+=path(`M${p}Q${round((p[0]+q[0])/2+4)} ${round(q[1]-2)} ${q}`,'detail');
        if(flower)art+=ellipse(...q,2.2,1.8,i%3?'white detail':'warm no-stroke');
        else art+=path(`M${q}q${i%2?5:-5}-6 ${i%2?6:-6}-1q-1 4 ${i%2?-6:6} 1Z`,'fill detail');
    }
    return art;
}

function isoChair(x,z,heading=0) {
    const p=(u,v,y)=>iso(x+u*Math.cos(heading)-v*Math.sin(heading),z+u*Math.sin(heading)+v*Math.cos(heading),y);
    let art='';
    for(const u of[-.14,.14])for(const v of[-.13,.13])art+=line([p(u*1.12,v*1.12,.04),p(u,v,.46)],'detail');
    art+=isoCircle(x,z,.49,.21,'white detail');
    const back=Array.from({length:13},(_,i)=>{const a=Math.PI*.08+i/12*Math.PI*.84;return p(Math.cos(a)*.23,Math.sin(a)*.23,.87);});
    art+=line([p(-.2,.14,.46),...back.toReversed(),p(.2,.14,.46)],'detail');
    art+=line([p(-.19,.16,.65),p(.19,.16,.65)],'micro');
    return art;
}
function isoTable(x,z) {
    let art=isoLine([[x,z,.78],[x,z,.1]],'detail');
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2;art+=isoLine([[x,z,.18],[x+Math.cos(a)*.24,z+Math.sin(a)*.24,.03]],'detail');}
    art+=isoCylinder(x,z,.78,.42,.055,'white');
    art+=isoCircle(x+.1,z,.855,.068,'white detail');
    art+=isoCylinder(x+.1,z,.855,.042,.08,'white');
    art+=isoCircle(x-.16,z+.09,.845,.09,'fill detail');
    return art;
}

function isoBench(x,z,heading=0) {
    const p=(u,v,y)=>[x+u*Math.cos(heading)-v*Math.sin(heading),z+u*Math.sin(heading)+v*Math.cos(heading),y];
    let art='';
    for(const u of[-.65,.65]){
        art+=isoLine([p(u,-.2,.02),p(u,-.2,.53),p(u,.2,.53),p(u,.2,.02)],'detail');
        art+=isoLine([p(u,.2,.53),p(u,.22,1.03)],'detail');
    }
    for(let i=0;i<4;i++)art+=isoPoly([p(-.85,-.2+i*.11,.56),p(.85,-.2+i*.11,.56),p(.85,-.13+i*.11,.56),p(-.85,-.13+i*.11,.56)],'white detail');
    for(let i=0;i<3;i++)art+=isoLine([p(-.85,.23,.77+i*.12),p(.85,.23,.77+i*.12)],'detail');
    return art;
}

function isoTree(x,z,height=2.7,radius=30,variant=0) {
    const base=iso(x,z,.02),top=iso(x,z,height);
    let art=horizontal(x-.25,z-.25,.01,.5,.5,'white detail');
    art+=path(`M${base[0]-2} ${base[1]}L${top[0]-1} ${top[1]+14}L${top[0]+3} ${top[1]+14}L${base[0]+2} ${base[1]}Z`,'white detail');
    const cx=top[0],cy=top[1]-radius*.18;
    const count=18;
    const points=Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2,r=radius*(1+.08*Math.sin(i*2.7+variant));return[cx+Math.cos(a)*r,cy+Math.sin(a)*r*1.15];});
    let d=`M${points[0]}`;
    for(let i=0;i<count;i++){
        const a=points[i],b=points[(i+1)%count],angle=(i+.5)/count*Math.PI*2;
        const control=[cx+Math.cos(angle)*radius*1.17,cy+Math.sin(angle)*radius*1.3];
        d+=`Q${round(control[0])} ${round(control[1])} ${round(b[0])} ${round(b[1])}`;
    }
    art+=path(d+'Z','fill');
    art+=path(`M${cx} ${cy+radius*.78}v-${radius*.55}m0 ${radius*.15}l-${radius*.28}-${radius*.26}m${radius*.28} ${radius*.1}l${radius*.26}-${radius*.25}`,'detail');
    for(let i=0;i<13;i++){
        const a=i*2.4+variant,r=radius*(.22+(i%3)*.23),xx=cx+Math.cos(a)*r,yy=cy+Math.sin(a)*r*.96;
        art+=path(`M${round(xx-3)} ${round(yy)}q3-5 6-1m-3 3q4-2 6 1`,'micro');
    }
    return art;
}

function isoPerson(x,z,{seated=false,facing=1,bag=false,shirt='fill'}={}) {
    const [px,py]=iso(x,z,0),s=facing;
    let art='';
    if(seated){
        art+=path(`M${px-3*s} ${py-27}l${11*s} 8l${-2*s} 17m${-10*s}-24l${10*s} 8v16`,'white detail');
        art+=path(`M${px-5} ${py-42}q-4 8-1 17l11 1q4-9 0-18Z`,`${shirt} detail`);
        art+=path(`M${px-5} ${py-38}l${-3*s} 11l${12*s} 2m${3*s}-13l${3*s} 8l${8*s}-2`,'detail');
        art+=ellipse(px,py-48,5,6.5,'white detail');
        art+=path(`M${px-5} ${py-49}q3-8 9-3`,'detail');
    } else {
        art+=path(`M${px-4} ${py-27}l-5 24l-4 2m17-26l6 23l4 1`,'detail');
        art+=path(`M${px-6} ${py-51}q6-4 12 0l3 22q-8 5-17 0Z`,`${shirt} detail`);
        art+=path(`M${px-6} ${py-49}l-5 15l-2 5m19-20l5 13l2 6`,'detail');
        art+=ellipse(px,py-58,5.3,6.4,'white detail');
        art+=path(`M${px-5} ${py-59}q2-8 9-3`,'detail');
        if(bag)art+=path(`M${px+9} ${py-37}q5-3 8 0l-1 10h-8Zm1-1v-4q3-4 5 0v4`,'white detail');
    }
    return group(art,{'aria-hidden':'true'});
}

function windowScene(prefix,axis,side,start,bottom,width,height,index) {
    const id=`${prefix}-window-${axis}-${index}`;
    const quad=faceQuad(axis,side,start,bottom,width,height);
    const u=start+width/2;
    const x=axis==='front'?u:side-.38;
    const z=axis==='front'?side-.38:u;
    let art=polygon(quad,'glass no-stroke');
    let inside='';
    if(index%3===0) {
        inside+=isoPot(x,z,2.55,.17);
        inside+=faceLine(axis,side,[[start+.07,3.16],[start+width-.07,3.16]],'micro');
    }else{
        inside+=group(isoTable(x,z)+isoChair(x-.44,z,Math.PI/2),{transform:`translate(0 ${-2.5*UNIT})`});
        if(index%3===2)inside+=group(isoPerson(x-.43,z,{seated:true,facing:1}),{transform:`translate(0 ${-2.5*UNIT})`});
    }
    art+=node('defs',{},node('clipPath',{id},polygon(quad)));
    art+=group(inside,{'clip-path':`url(#${id})`});
    art+=polygon(quad,'detail');
    art+=faceLine(axis,side,[[u,bottom],[u,bottom+height]],'detail');
    art+=faceLine(axis,side,[[start+.08,bottom+height-.18],[start+width-.08,bottom+height-.18]],'micro');
    art+=faceLine(axis,side,[[start+.1,bottom+height*.63],[start+width*.44,bottom+height*.88]],'micro');
    return art;
}

function cafeAwning(axis,side,length) {
    const p=(u,y,depth)=>axis==='front'?[u,side+depth,y]:[side+depth,u,y];
    const parts=[];
    const count=axis==='front'?14:11;
    const depth=.48;
    for(let i=0;i<count;i++) {
        const a=i/count*length,b=(i+1)/count*length;
        parts.push(isoPoly([p(a,2.52,0),p(b,2.52,0),p(b,2.1,depth),p(a,2.1,depth)],i%2?'warm-soft':'white no-stroke'));
        if(i%2)parts.push(isoPoly([p(a,2.52,0),p(b,2.52,0),p(b,2.1,depth),p(a,2.1,depth)],'warm no-stroke'));
        const edge=Array.from({length:9},(_,j)=>p(a+(b-a)*j/8,2.1-Math.sin(j/8*Math.PI)*.09,depth));
        parts.push(isoLine(edge,'detail'));
        if(i>0)parts.push(isoLine([p(a,2.52,0),p(a,2.1,depth)],'detail'));
    }
    parts.push(isoLine([p(0,2.52,0),p(length,2.52,0)],'detail'));
    parts.push(isoLine([p(0,2.52,0),p(0,2.1,depth)],'detail'),isoLine([p(length,2.52,0),p(length,2.1,depth)],'detail'));
    return group(parts.join(''),{class:'cafe-awnings'});
}

function isoPlanter(x,z,w=1.2,d=.35) {
    let art=box(x,z,.02,w,d,.3,'white');
    art+=horizontal(x+.05,z+.05,.32,w-.1,d-.1,'shade no-stroke');
    for(let i=0;i<7;i++) {
        const xx=x+.12+(w-.24)*i/6,zz=z+d/2+(i%2?.055:-.055),yy=.36+(i%3)*.045;
        const p=iso(xx,zz,yy);
        art+=ellipse(...p,4+(i%2),3.5,'fill detail');
        art+=path(`M${p[0]-2} ${p[1]}q2-4 5-1`,'micro');
    }
    return art;
}

function cafeBuilding() {
    const W=PLACES.cafe.w,D=PLACES.cafe.d;
    const art=[];
    art.push(horizontal(-.13,-.13,.05,W+.26,D+.26,'white'));
    art.push(facePath('front',D,0,.15,W,4.35,'white no-stroke'));
    art.push(facePath('side',W,0,.15,D,4.35,'fill no-stroke'));
    // The storefront is composed as a transparent architectural illustration:
    // equipment and furnishings sit in named, clipped, editable vector groups.
    const frontGlass=faceQuad('front',D+.01,.12,.3,W-.24,2.02);
    const sideGlass=faceQuad('side',W+.01,.12,.3,D-.24,2.02);
    art.push(polygon(frontGlass,'glass no-stroke'),polygon(sideGlass,'glass no-stroke'));
    art.push(node('defs',{},node('clipPath',{id:'cafe-front-interior'},polygon(frontGlass))+node('clipPath',{id:'cafe-side-interior'},polygon(sideGlass))));
    let front='';
    front+=box(.36,3.99,.15,2.15,.4,.6,'white');
    front+=horizontal(.28,3.95,.79,2.3,.46,'white');
    front+=box(.55,4.05,.83,1.2,.28,.22,'glass');
    for(let i=0;i<4;i++)front+=isoCylinder(.7+i*.27,4.23,.84,.08,.045,'warm');
    front+=box(2.7,3.99,.15,1.05,.4,.6,'fill');
    front+=horizontal(2.62,3.95,.79,1.21,.46,'white');
    front+=box(2.8,4.15,.83,.85,.25,.34,'shade');
    front+=horizontal(2.76,4.12,1.19,.93,.3,'white');
    for(const x of[2.97,3.23,3.47]) {
        front+=isoCylinder(x,4.28,1.2,.052,.09,'white');
        front+=isoLine([[x,4.4,1.03],[x,4.42,.86],[x+.1,4.42,.86]],'detail');
    }
    front+=isoPerson(3.84,4.15,{shirt:'white'});
    for(const x of[.8,2.2,3.65]) {
        const a=iso(x,4.12,2.31),b=iso(x,4.12,1.94);
        front+=line([a,b],'detail')+ellipse(b[0],b[1]+3,7,4,'white detail');
    }
    front+=isoPot(.16,4.05,.15,.19);
    art.push(group(front,{id:'cafe-counter-and-equipment','clip-path':'url(#cafe-front-interior)'}));
    let side=isoPot(5.0,.45,.15,.21);
    side+=isoTable(4.94,1.55)+isoChair(4.8,1.0,0)+isoChair(4.8,2.1,Math.PI);
    for(const y of[.5,.85,1.2]){
        side+=box(5.08,2.5,y,.25,1.12,.035,'white');
        for(let i=0;i<4;i++)side+=isoCylinder(5.24,2.65+i*.25,y+.04,.044,.14,'fill');
    }
    side+=isoPerson(4.84,1.0,{seated:true,facing:-1});
    art.push(group(side,{id:'cafe-shelves-and-seating','clip-path':'url(#cafe-side-interior)'}));
    // One contour per mullion, instead of outlining all four sides of each post.
    for(const x of[.12,1.34,2.64,3.94,5.28])art.push(faceLine('front',D+.015,[[x,.3],[x,2.32]],'detail'));
    for(const z of[.12,1.18,2.24,3.3,4.28])art.push(faceLine('side',W+.015,[[z,.3],[z,2.32]],'detail'));
    art.push(faceLine('front',D+.02,[[.12,.32],[W-.12,.32]],'detail'));
    art.push(faceLine('side',W+.02,[[.12,.32],[D-.12,.32]],'detail'));
    // A slightly open entrance, with a warm handle and a quiet threshold.
    const door=[[4.03,D+.035,.2],[4.96,D+.23,.2],[4.96,D+.23,2.26],[4.03,D+.035,2.26]];
    art.push(isoPoly(door,'glass detail',{opacity:'.8'}));
    art.push(isoLine([[4.77,D+.205,.94],[4.77,D+.205,1.26]],'warm-line'));
    art.push(horizontal(4.0,D+.04,.06,1.06,.39,'white detail'));
    // Upstairs lounge: individual windows are deliberately spaced and populated.
    art.push(facePath('front',D,0,2.52,W,1.94,'white no-stroke'));
    art.push(facePath('side',W,0,2.52,D,1.94,'fill no-stroke'));
    for(let i=0;i<4;i++)art.push(windowScene('cafe','front',D+.025,.29+i*1.3,2.83,.91,1.2,i));
    for(let i=0;i<4;i++)art.push(windowScene('cafe','side',W+.025,.2+i*1.07,2.83,.76,1.2,i+4));
    art.push(isoLine([[0,D,.18],[0,D,4.48]],''),isoLine([[W,D,.18],[W,D,4.48]],''),isoLine([[W,0,.18],[W,0,4.48]],''));
    art.push(facePath('front',D+.03,0,2.5,W,.28,'white no-stroke'));
    art.push(facePath('side',W+.03,0,2.5,D,.28,'white no-stroke'));
    const frontSign=iso(W/2,D+.04,2.61),sideSign=iso(W+.04,D/2,2.61);
    art.push(text(0,0,'CORNER CAFÉ','cafe-sign',{transform:`matrix(.866 .5 0 1 ${frontSign[0]} ${frontSign[1]})`,'text-anchor':'middle'}));
    art.push(text(0,0,'CORNER CAFÉ','cafe-sign',{transform:`matrix(.866 -.5 0 1 ${sideSign[0]} ${sideSign[1]})`,'text-anchor':'middle'}));
    art.push(cafeAwning('front',D+.06,W),cafeAwning('side',W+.06,D));
    // A single roof contour remains legible from a distance. Its inner profile
    // appears only when the view is large enough to separate it from the edge.
    art.push(facePath('front',D+.1,-.1,4.43,W+.2,.2,'white no-stroke'));
    art.push(facePath('side',W+.1,-.1,4.43,D+.2,.2,'shade no-stroke'));
    art.push(horizontal(-.1,-.1,4.64,W+.2,D+.2,'white'));
    art.push(horizontal(.05,.05,4.64,W-.1,D-.1,'profile'));
    art.push(box(.8,.8,4.65,1.12,.75,.44,'fill'));
    art.push(isoCircle(1.12,1.17,5.1,.16,'white detail'),isoCircle(1.59,1.17,5.1,.16,'white detail'));
    for(let i=0;i<4;i++)art.push(faceLine('front',1.56,[[.92,4.73+i*.075],[1.82,4.73+i*.075]],'micro'));
    return group(art.join(''),{id:'cafe-architecture','data-place':'cafe'});
}

function cafeDrawing() {
    const art=[];
    // The three streets match the atlas, in the same local coordinate system.
    art.push(horizontal(-6,-3.65,-.02,15,2.1,'road'));
    art.push(horizontal(6.0,-3.65,-.02,2.1,12,'road'));
    art.push(horizontal(-6,6.1,-.02,14.1,2.1,'road'));
    for(let x=-5.7;x<8;x+=1.35)for(const z of[-2.58,7.15])art.push(isoLine([[x,z,0],[x+.52,z,0]],'',{stroke:'#fff','stroke-width':1.5}));
    for(let z=-3;z<7;z+=1.35)art.push(isoLine([[7.05,z,0],[7.05,z+.52,0]],'',{stroke:'#fff','stroke-width':1.5}));
    const pavement=[[-5.15,-1.35,.02],[5.72,-1.35,.02],[6.08,-.98,.02],[6.08,5.72,.02],[5.7,6.08,.02],[-4.78,6.08,.02],[-5.15,5.72,.02]];
    art.push(isoPoly(pavement,'white detail'));
    for(let i=0;i<7;i++)art.push(horizontal(.1+i*.3,6.25,0,.16,1.8,'white no-stroke'));
    for(let i=0;i<7;i++)art.push(horizontal(6.2,2.3+i*.3,0,1.7,.16,'white no-stroke'));
    for(let x=-.45;x<5.8;x+=.5)art.push(isoLine([[x,4.55,.025],[x,5.95,.025]],'micro'));
    for(let z=4.75;z<6.0;z+=.5)art.push(isoLine([[-.5,z,.025],[5.75,z,.025]],'micro'));
    for(let z=-.8;z<4.5;z+=.5)art.push(isoLine([[5.5,z,.025],[5.95,z,.025]],'micro'));
    // A pocket garden remains to the west in both views.
    art.push(horizontal(-4.95,-.6,.035,3.5,5.55,'pavement'));
    art.push(isoPlanter(-4.7,-.25,2.8,.45));
    art.push(isoBench(-3.85,1.4,Math.PI/2),isoBench(-2.1,1.4,Math.PI/2));
    art.push(isoTree(-4.25,-.08,2.0,43,2));
    art.push(isoPot(-1.1,-.55,.05,.25));
    // A rack and a parked bicycle are drafted from tubes and circular rims.
    for(let i=0;i<3;i++)art.push(isoLine([[-.75+i*.4,-.9,.03],[-.75+i*.4,-.9,.72],[-.75+i*.4,-.5,.72],[-.75+i*.4,-.5,.03]],'detail'));
    const bike=iso(-.1,-.55,.37);
    art.push(group(ellipse(-17,0,12,14,'detail')+ellipse(20,0,12,14,'detail')+path('M-17 0L-7-24L3 0H-17L15-23L20 0M-7-24H15L12-31H19M-7-24L-10-31H-16','detail')+path('M-17 0L-17-13M20 0L20-13','micro'),{transform:`translate(${bike[0]} ${bike[1]}) skewY(12)`}));
    art.push(cafeBuilding());
    // Furnish the terrace in depth order, retaining generous space to walk.
    art.push(isoChair(.25,5.35,Math.PI/2),isoChair(1.25,5.35,-Math.PI/2));
    art.push(isoPerson(.25,5.35,{seated:true,facing:1,shirt:'white'}));
    art.push(isoTable(.75,5.35));
    art.push(isoChair(2.55,5.45,Math.PI/2),isoChair(3.55,5.45,-Math.PI/2),isoTable(3.05,5.45));
    art.push(isoChair(5.75,1.75,0),isoChair(5.75,2.75,Math.PI),isoTable(5.75,2.25));
    art.push(isoPot(-.35,4.8,.03,.22,true),isoPot(2.0,5.5,.03,.21,true));
    art.push(isoPlanter(5.65,.1,.3,1.0));
    // A café board, with actual engraved rules rather than unreadable body copy.
    art.push(facePath('front',5.8,3.96,.14,.44,.85,'white detail'));
    art.push(faceLine('front',5.81,[[4.04,.75],[4.32,.75],[4.32,.73]],'warm-line'));
    for(let i=0;i<3;i++)art.push(faceLine('front',5.815,[[4.04,.59-i*.1],[4.32,.59-i*.1]],'micro'));
    art.push(isoLine([[3.96,5.95,0],[3.96,5.8,1.0],[3.96,5.42,0]],'detail'));
    art.push(isoPlanter(4.65,5.55,.95,.35));
    art.push(isoPerson(4.95,5.7,{bag:true}));
    art.push(isoBench(-3.45,4.0,0),isoTree(-4.35,4.8,2.0,45,4));
    art.push(isoTree(-1.65,4.25,2.0,37,7));
    art.push(isoPerson(-.9,5.75,{bag:false,shirt:'white'}));
    // Slender lighting and street furniture never need two parallel outlines.
    for(const[x,z]of[[-1.1,6.0],[5.9,4.8]]) {
        const p=iso(x,z,0),q=iso(x,z,2.15);
        art.push(line([p,q],'detail'),ellipse(q[0],q[1],5,2.2,'white detail'),isoCircle(x,z,.03,.11,'white detail'));
    }
    for(const x of[.0,2.35])art.push(isoCylinder(x,5.9,.01,.045,.62,'white'));
    // Geographic cues are quiet enough to stay secondary to the illustration.
    const garden=iso(-3.2,5.35,.01);
    art.push(text(garden[0]-12,garden[1]+22,'Pocket garden','label-note',{'text-anchor':'middle'}));
    const road=iso(.9,7.6,0);
    art.push(text(0,0,'MARKET LANE','street-name',{transform:`matrix(.866 .5 0 1 ${road[0]} ${road[1]})`,'text-anchor':'middle'}));
    return group(art.join(''),{class:'drawing cafe-drawing'});
}

const study=document.getElementById('study');
const atlas=document.getElementById('atlasArt');
const cafe=document.getElementById('cafeArt');
const mini=document.getElementById('miniAtlas');
atlas.insertAdjacentHTML('beforeend',group(atlasDrawing(),{id:'atlasCamera',class:'art-camera'}));
cafe.insertAdjacentHTML('beforeend',group(cafeDrawing(),{id:'cafeCamera',class:'art-camera'}));
mini.insertAdjacentHTML('beforeend',atlasDrawing('mini',false));

const atlasPanel=document.getElementById('atlasPanel');
const cafePanel=document.getElementById('cafePanel');
const hit=atlas.querySelector('[data-open-cafe]');
const back=document.getElementById('backAction');
const action=document.getElementById('viewAction');
const status=document.getElementById('viewStatus');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const narrow=matchMedia('(max-width: 600px)');
const views={
    atlas:{title:'Get to know the neighborhood.',intro:'The streets, the spaces, the everyday places. <br>Choose the corner café to step a little closer.',heading:'The bigger picture',body:'Offices, homes, a pocket garden. And a café on the corner.',number:'01'},
    cafe:{title:'Meet the corner café.',intro:'A striped awning. A table in the sun. <br>The same neighborhood, a little more personal.',heading:'A place with character',body:'Corner Café, where Market Lane meets Linden Street.',number:'02'},
};
let current='atlas',completionTimer=0,transitionVersion=0;
const stage=document.querySelector('.illustration-stage');
const cameras={atlas:{zoom:1,angle:0,x:0,y:0},cafe:{zoom:1,angle:0,x:0,y:0}};
const cameraElements={atlas:document.getElementById('atlasCamera'),cafe:document.getElementById('cafeCamera')};
const cameraButtons=Object.fromEntries([...document.querySelectorAll('[data-camera-action]')].map(button=>[button.dataset.cameraAction,button]));
const zoomOutput=document.getElementById('cameraZoom');
const angleOutput=document.getElementById('cameraAngle');
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
let drag=null,suppressClickUntil=0;

function updateCameraControls() {
    const camera=cameras[current];
    zoomOutput.value=`${Math.round(camera.zoom*100)}%`;
    angleOutput.value=`${Math.round(camera.angle)}°`;
    cameraButtons['zoom-out'].disabled=camera.zoom<=.8001;
    cameraButtons['zoom-in'].disabled=camera.zoom>=1.1999;
    cameraButtons['tilt-left'].disabled=camera.angle<=-14.999;
    cameraButtons['tilt-right'].disabled=camera.angle>=14.999;
    cameraButtons.reset.disabled=Math.abs(camera.zoom-1)+Math.abs(camera.angle)+Math.abs(camera.x)+Math.abs(camera.y)<.001;
    stage.classList.toggle('is-zoomed',camera.zoom>1.001);
    study.dataset.zoom=String(Math.round(camera.zoom*100));
    study.dataset.angle=String(round(camera.angle));
    study.dataset.panX=String(round(camera.x));
    study.dataset.panY=String(round(camera.y));
}

function renderCamera(view) {
    const art=view==='atlas'?atlas:cafe,camera=cameras[view],box=art.viewBox.baseVal;
    cameraElements[view].style.setProperty('--camera-transform',`translate(${camera.x*box.width}px, ${camera.y*box.height}px) rotate(${camera.angle}deg) scale(${camera.zoom})`);
    const scale=Math.min(art.clientWidth/box.width,art.clientHeight/box.height)*camera.zoom;
    art.style.setProperty('--micro-opacity',String(clamp((scale-.2)*1.1,.12,.85)));
    art.style.setProperty('--profile-opacity',String(clamp((scale-.52)*2.1,0,.8)));
    if(view===current)updateCameraControls();
}

function changeCamera(action,{announce=true}={}) {
    stopPan();
    const camera=cameras[current];
    if(action==='zoom-in')camera.zoom=round(clamp(camera.zoom+.1,.8,1.2));
    else if(action==='zoom-out')camera.zoom=round(clamp(camera.zoom-.1,.8,1.2));
    else if(action==='tilt-left')camera.angle=round(clamp(camera.angle-5,-15,15));
    else if(action==='tilt-right')camera.angle=round(clamp(camera.angle+5,-15,15));
    else if(action==='reset')Object.assign(camera,{zoom:1,angle:0,x:0,y:0});
    else return;
    if(camera.zoom<=1){camera.x=0;camera.y=0;}
    renderCamera(current);
    if(announce)status.textContent=`${Math.round(camera.zoom*100)} percent zoom, ${Math.round(camera.angle)} degrees tilt.${camera.zoom>1?' Drag the drawing to move it.':''}`;
}

function stopPan(event) {
    if(!drag||(event&&event.pointerId!==drag.id))return;
    const previous=drag;drag=null;
    stage.classList.remove('is-panning');
    if(stage.hasPointerCapture(previous.id))stage.releasePointerCapture(previous.id);
    if(previous.moved)suppressClickUntil=performance.now()+350;
}

function finishTransition(version,focusTarget) {
    if(version!==transitionVersion)return;
    clearTimeout(completionTimer);
    study.dataset.transitioning='false';
    status.textContent=current==='cafe'?'Corner Café close-up. Use Back to neighborhood to return.':'Neighborhood overview. Corner Café is available to explore.';
    if(focusTarget)focusTarget.focus({preventScroll:true});
}

function showView(view,{focus=true}={}) {
    if(!views[view]||view===current)return;
    stopPan();
    current=view;
    const version=++transitionVersion;
    clearTimeout(completionTimer);
    const detail=view==='cafe',copy=views[view];
    study.dataset.view=view;
    study.dataset.transitioning=String(!reduce.matches);
    atlasPanel.setAttribute('aria-hidden',String(detail));
    cafePanel.setAttribute('aria-hidden',String(!detail));
    atlasPanel.toggleAttribute('inert',detail);
    cafePanel.toggleAttribute('inert',!detail);
    hit.setAttribute('tabindex',detail?'-1':'0');
    action.hidden=detail;back.hidden=!detail;
    document.getElementById('studyTitle').textContent=copy.title;
    document.getElementById('introCopy').innerHTML=copy.intro;
    document.getElementById('viewHeading').textContent=copy.heading;
    document.getElementById('viewDescription').textContent=copy.body;
    document.getElementById('viewNumber').textContent=copy.number;
    document.querySelectorAll('[data-view-button]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.viewButton===view)));
    updateCameraControls();
    // Move focus before the outgoing view becomes inaccessible. CSS transitions
    // continue from their current values when the requested view is interrupted.
    const focusTarget=focus?(detail?back:hit):null;
    focusTarget?.focus({preventScroll:true});
    if(reduce.matches)finishTransition(version,null);
    else completionTimer=setTimeout(()=>finishTransition(version,null),520);
}

document.addEventListener('click',event=>{
    const target=event.target.closest('[data-show-cafe], [data-show-atlas], [data-view-button], [data-open-cafe], [data-camera-action]');
    if(!target)return;
    if(target.dataset.cameraAction){if(!target.disabled)changeCamera(target.dataset.cameraAction);return;}
    const view=target.hasAttribute('data-show-atlas')?'atlas':target.dataset.viewButton||'cafe';
    showView(view,{focus:!target.hasAttribute('data-view-button')});
});
hit.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();showView('cafe');}
});
study.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&current==='cafe'){event.preventDefault();showView('atlas');}
});
stage.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('button, a, input, textarea'))return;
    const actions={'+':'zoom-in','=':'zoom-in','-':'zoom-out','[':'tilt-left',']':'tilt-right','0':'reset','Home':'reset'};
    if(actions[event.key]){event.preventDefault();changeCamera(actions[event.key]);return;}
    const camera=cameras[current],step=event.shiftKey ? .05 : .025;
    if(camera.zoom<=1||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='ArrowLeft')camera.x=clamp(camera.x+step,-.16,.16);
    if(event.key==='ArrowRight')camera.x=clamp(camera.x-step,-.16,.16);
    if(event.key==='ArrowUp')camera.y=clamp(camera.y+step,-.16,.16);
    if(event.key==='ArrowDown')camera.y=clamp(camera.y-step,-.16,.16);
    renderCamera(current);
});

stage.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.isPrimary===false||cameras[current].zoom<=1.001||event.target.closest('button'))return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false,camera:null};
});
stage.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<4)return;
    const camera=cameras[current],art=current==='atlas'?atlas:cafe,box=art.viewBox.baseVal;
    if(!drag.moved){
        // Grabbing an easing view starts at the currently displayed transform.
        const transform=getComputedStyle(cameraElements[current]).transform;
        if(transform!=='none'){
            const m=new DOMMatrixReadOnly(transform);
            camera.zoom=clamp(Math.hypot(m.a,m.b),.8,1.2);
            camera.angle=clamp(Math.atan2(m.b,m.a)*180/Math.PI,-15,15);
            camera.x=clamp(m.e/box.width,-.16,.16);camera.y=clamp(m.f/box.height,-.16,.16);
        }
        drag.moved=true;drag.camera={...camera};
        stage.classList.add('is-panning');stage.setPointerCapture(event.pointerId);
    }
    const scale=Math.min(art.clientWidth/box.width,art.clientHeight/box.height);
    camera.x=clamp(drag.camera.x+(event.clientX-drag.x)/scale/box.width,-.16,.16);
    camera.y=clamp(drag.camera.y+(event.clientY-drag.y)/scale/box.height,-.16,.16);
    renderCamera(current);event.preventDefault();
});
for(const type of['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,stopPan);
stage.addEventListener('pointerleave',()=>{if(drag&&!drag.moved)stopPan();});
stage.addEventListener('click',event=>{
    if(performance.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();}
},true);
stage.addEventListener('wheel',event=>{
    if(!event.ctrlKey&&!event.metaKey)return;
    event.preventDefault();stopPan();
    cameras[current].zoom=round(clamp(cameras[current].zoom-event.deltaY*.0015,.8,1.2));
    if(cameras[current].zoom<=1){cameras[current].x=0;cameras[current].y=0;}
    renderCamera(current);
},{passive:false});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPan();});
reduce.addEventListener('change',()=>{
    if(reduce.matches)finishTransition(transitionVersion,null);
});

function fitArtwork() {
    // The phone composition keeps the complete café and garden, without the
    // empty outer margins useful for the wider desktop composition.
    atlas.setAttribute('viewBox',narrow.matches?'100 10 900 745':'65 5 980 775');
    cafe.setAttribute('viewBox',narrow.matches?'-35 15 1075 735':'25 5 1030 750');
    renderCamera('atlas');renderCamera('cafe');
}
new ResizeObserver(fitArtwork).observe(document.querySelector('.illustration-stage'));
narrow.addEventListener('change',fitArtwork);
Promise.resolve(document.fonts?.ready).then(fitArtwork);
fitArtwork();
study.dataset.ready='true';
