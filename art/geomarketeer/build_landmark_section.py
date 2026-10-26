"""Detailed landmark test within the approved blockout. Review 2 stays untouched.
Run with Blender --background --python art/geomarketeer/build_landmark_section.py.
Reference image is the visual authority; concealed geometry remains inferred.
"""
import bpy, bmesh, math, json, random
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'assets/portfolio/geomarketeer/reference-blockout'
OUT=ROOT/'assets/portfolio/geomarketeer/landmark-section';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(BASE/'reference-blockout.blend'))
data=json.loads((BASE/'inventory.json').read_text());q=data['perspective']['parameters'];W,H=1672,941
a,e,dist,f,cx,cy=q
r=np.array([math.cos(a),math.sin(a),0]);u=np.array([-math.sin(a)*math.sin(e),math.cos(a)*math.sin(e),math.cos(e)]);n=np.array([math.sin(a)*math.cos(e),-math.cos(a)*math.cos(e),math.sin(e)])
def unproject(p,z=0):
    x=(p[0]-cx)/f;y=(cy-p[1])/f;A=np.array([r+x*n,u+y*n])
    xy=np.linalg.solve(A[:,:2],np.array([x*dist,y*dist])-A[:,2]*z)
    return Vector((float(xy[0]),float(xy[1]),z))
def project(p):
    p=np.array(p);den=dist-p@n
    return (cx+f*(p@r)/den,cy-f*(p@u)/den)
def inferred_height(top,foot_y):
    lo,hi=0,15
    for _ in range(45):
        z=(lo+hi)/2;p=unproject(top,z);p.z=0
        if project(p)[1]<foot_y:lo=z
        else:hi=z
    return (lo+hi)/2

DETAIL_IDS=('L01','L02','L03','G01','M01','M02','M03','M04','M05','N16','W24','S13','S14','S15','S16','S17','S18','S19','S20','S21','S22','S23','E01','E02','E03','E04','E05','E06')
for ob in list(bpy.data.objects):
    if ob.name.startswith(DETAIL_IDS):bpy.data.objects.remove(ob,do_unlink=True)
created=[]
def mat(name,hex):
    def lin(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
    rgb=tuple(lin(int(hex[i:i+2],16)/255) for i in (0,2,4))
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*rgb,1);bs.inputs['Roughness'].default_value=.88
    return m
P={k:mat(k,v) for k,v in {'brick':'CB7955','brickSide':'C1714D','trim':'DEA47A','roof':'A18D80','roofSeam':'998579','glass':'536F88','glassLight':'7199AD','recess':'29373E','wall':'CF876B','cap':'E0AD89','grass':'93A355','path':'D5C4A2','paving':'C8B997','asphalt':'484B4C','trunk':'796145','leaf1':'50782E','leaf2':'75913C','leaf3':'A1B34F','leaf4':'3B6632','white':'F0D8B4','cream':'E6D4B8','peach':'D9A27E','terracotta':'C96F48','blue':'557E93','blueDark':'355A70','charcoal':'2D3235','warmLight':'E8A24D','planter':'A65B3C','flower':'D75B45','roadWhite':'F3EEE1','roadYellow':'F1B93B','autoYellow':'E9AE25','autoBlack':'262B2D','carCoral':'D85D3F','carWhite':'E8E6DF','skin':'B87555','shirtRed':'C94D3C','shirtBlue':'3C6C86'}.items()}
def mesh(name,verts,faces,material,bevel=0):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);me.materials.append(material);created.append(ob)
    if bevel:
        mod=ob.modifiers.new('Masonry edge','BEVEL');mod.width=bevel;mod.segments=1
    return ob
def orient(ob,normal):
    bm=bmesh.new();bm.from_mesh(ob.data)
    for face in bm.faces:
        if face.normal.dot(Vector(normal))<0:face.normal_flip()
    bm.to_mesh(ob.data);bm.free();return ob
def prism(name,pts,z0,z1,material,bevel=0):
    k=len(pts);v=[(p[0],p[1],z) for z in [z0,z1] for p in pts]
    return mesh(name,v,[tuple(reversed(range(k))),tuple(range(k,2*k))]+[(i,(i+1)%k,(i+1)%k+k,i+k) for i in range(k)],material,bevel)
def beam(name,p1,p2,width,material):
    p1,p2=Vector(p1),Vector(p2);v=p2-p1
    if v.length<.001:return
    bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=width,depth=v.length,location=(p1+p2)/2)
    ob=bpy.context.object;ob.name=name;ob.rotation_euler=v.to_track_quat('Z','Y').to_euler();ob.data.materials.append(material);created.append(ob);return ob
def wall(name,p1,p2,height,width,material):
    p1,p2=Vector(p1),Vector(p2);v=p2-p1;v.z=0;v.normalize();side=Vector((-v.y,v.x,0))*width/2
    return prism(name,[p1+side,p2+side,p2-side,p1-side],0,height,material,.012)
def arch(name,center,tangent,normal,width,height,z,material,trim=True):
    c=Vector(center);c.z=z;t=Vector(tangent).normalized();normal=Vector(normal).normalized()
    shape=[(-.5,0),(.5,0),(.5,.65),(.37,.84),(0,1),(-.37,.84),(-.5,.65)]
    def ring(w,h,off):return [c+t*(x*w)+Vector((0,0,y*h))+normal*off for x,y in shape]
    if trim:
        outer=ring(width+.13,height+.07,.04);inner=ring(width,height,.045)
        orient(mesh(name+' stone surround',outer+inner,[(i,(i+1)%7,(i+1)%7+7,i+7) for i in range(7)],P['trim']),normal)
    orient(mesh(name+' inset glazing',ring(width,height,.025),[tuple(range(7))],material),normal)
    if material==P['glass']:
        beam(name+' mullion',c+normal*.055,c+normal*.055+Vector((0,0,height*.84)),.018,P['trim'])

def panel(name,center,tangent,normal,width,height,z,material,offset=.035):
    c=Vector(center);c.z=z;t=Vector(tangent).normalized();n=Vector(normal).normalized();up=Vector((0,0,1))
    pts=[c-t*width/2,c+t*width/2,c+t*width/2+up*height,c-t*width/2+up*height]
    return orient(mesh(name,[p+n*offset for p in pts],[(0,1,2,3)],material),n)

def traced_roof(item):
    _id,label,x,y,w,d,skew,slope,drop,floors,form,confidence=item
    return [[x,y],[x+w,y+slope],[x+w+skew,y+slope+d],[x+skew,y+d]]

raw_roofs={item[0]:item for item in json.loads((ROOT/'art/geomarketeer/reference-blockout.json').read_text())['roofs']}
inventory={item['id']:item for item in data['buildings']}

def flat_building(id,name,facade,accent,window=P['glass']):
    pixels=traced_roof(raw_roofs[id]);height=inventory[id]['height'];top=[unproject(p,height) for p in pixels]
    center=sum(top,Vector())/4
    body=prism(name,top,.08,height,facade,.025);body['reference_id']=id
    # Raised slabs, parapets, roof cores and occasional hipped roofs make the skyline layered.
    form=raw_roofs[id][10]
    style=sum(ord(char) for char in id)%4
    if form=='hip':
        ridgeA=(top[0]+top[3])/2+Vector((0,0,.60));ridgeB=(top[1]+top[2])/2+Vector((0,0,.60));midR=(ridgeA+ridgeB)/2
        ridgeA=midR+(ridgeA-midR)*.60;ridgeB=midR+(ridgeB-midR)*.60
        orient(mesh(name+' hipped roof',[*top,ridgeA,ridgeB],[(0,1,5,4),(3,4,5,2),(0,4,3),(1,2,5)],P['roof']),(0,0,1))
    else:
        prism(name+' roof slab',top,height,height+.10,accent,.012)
        for i in range(4):
            p1,p2=top[i],top[(i+1)%4];p1=p1.copy();p2=p2.copy();p1.z=p2.z=height+.24
            beam(name+' parapet',p1,p2,.065,accent)
        core_center=center+Vector((0,0,height+.18));side=(top[1]-top[0]).normalized();normal=Vector((-side.y,side.x,0));core_center+=side*(style-1.5)*.10
        sx=.28+.05*(style%2);sy=.18+.05*((style+1)%2)
        pts=[core_center+side*sx+normal*sy,core_center-side*sx+normal*sy,core_center-side*sx-normal*sy,core_center+side*sx-normal*sy]
        prism(name+' rooftop core',pts,height+.10,height+.56,accent,.02)
    # Decorate the two visibly exposed edges from the traced roof envelope.
    for edge_index in [1,2]:
        p1,p2=top[edge_index],top[(edge_index+1)%4];t=(p2-p1).normalized();n=Vector((t.y,-t.x,0))
        if n.dot((p1+p2)/2-center)<0:n=-n
        floors=max(2,raw_roofs[id][9]);count=min(4,max(2,2+style if (p2-p1).length>2.1 else 2))
        for floor in range(floors):
            z=.48+floor*(height-.65)/floors
            winW=.28 if count>3 else .34;winH=.42+.06*((style+floor)%2)
            for col in range(count):
                c=p1.lerp(p2,(col+1)/(count+1))
                panel(name+' window surround',c,t,n,winW+.12,winH+.10,z-.04,accent,.032)
                panel(name+' blue window',c,t,n,winW,winH,z,window,.045)
        if edge_index==2 and not id.startswith('M') and style in [1,3]:
            balcony_floors=range(1,floors) if style==3 else [max(1,floors//2)]
            for floor in balcony_floors:
                c=p1.lerp(p2,.5);z=.42+floor*(height-.45)/floors
                balcony=[c-t*.56+n*.04,c+t*.56+n*.04,c+t*.56+n*.34,c-t*.56+n*.34]
                prism(name+' balcony',balcony,z,z+.07,P['cream'],.012)
                for q in balcony:q.z=z+.28
                for j in range(4):beam(name+' balcony rail',balcony[j],balcony[(j+1)%4],.018,P['blueDark'])
        if edge_index==2 and style==0 and not id.startswith('M'):
            c=p1.lerp(p2,.5);awning=[c-t*.48+n*.03,c+t*.48+n*.03,c+t*.48+n*.34,c-t*.48+n*.34]
            prism(name+' ground canopy',awning,.72,.80,P['terracotta'],.012)
    return top,height,center

def pixel_polygon(name,pixels,z,material):
    pts=[unproject(p,z) for p in pixels]
    return orient(mesh(name,pts,[tuple(range(len(pts)))],material),(0,0,1))

def heading_from_pixels(a,b):
    p1=unproject(a,0);p2=unproject(b,0);v=p2-p1;v.z=0;return v.normalized()

def vehicle(name,pixel,direction,kind,material):
    c=unproject(pixel,.07);d=Vector(direction).normalized();s=Vector((-d.y,d.x,0));length=1.00 if kind=='car' else .82;width=.46
    base=[c-d*length/2-s*width/2,c+d*length/2-s*width/2,c+d*length/2+s*width/2,c-d*length/2+s*width/2]
    prism(name+' lower body',base,.07,.27,material,.035)
    if kind=='auto':
        cabin=[c-d*.17-s*.17,c+d*.25-s*.17,c+d*.25+s*.17,c-d*.17+s*.17]
        prism(name+' black cabin',cabin,.24,.57,P['autoBlack'],.025)
        panel(name+' windscreen',c+d*.255,d,s,.26,.20,.31,P['glass'])
    elif kind=='scooter':
        beam(name+' frame',c-d*.22+Vector((0,0,.18)),c+d*.20+Vector((0,0,.22)),.045,material)
        beam(name+' rider',c+Vector((0,0,.18)),c+Vector((0,0,.58)),.075,P['shirtRed'])
    else:
        cabin=[c-d*.20-s*.15,c+d*.18-s*.15,c+d*.18+s*.15,c-d*.20+s*.15]
        prism(name+' glazed cabin',cabin,.25,.48,P['glass'],.025)
    for off in [-length*.30,length*.30]:
        for side in [-1,1]:
            wheel=c+d*off+s*width*.48+Vector((0,0,.12));beam(name+' wheel',wheel-s*.025,wheel+s*.025,.07,P['charcoal'])

def pedestrian(name,pixel,shirt):
    c=unproject(pixel,.03);beam(name+' body',c+Vector((0,0,.08)),c+Vector((0,0,.45)),.055,shirt)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.075,location=c+Vector((0,0,.56)))
    ob=bpy.context.object;ob.name=name+' head';ob.data.materials.append(P['skin']);created.append(ob)

# Long nave: roof corners explicitly measured against the selected reference crop.
eave=inferred_height((871,441),489);rise=1.55
A=unproject((788,412),eave);B=unproject((871,441),eave)
RA=unproject((806,376),eave+rise);RB=unproject((892,402),eave+rise)
C=RB*2-B;D=RA*2-A;C.z=eave;D.z=eave
nave=prism('L01 authored nave',[A,B,C,D],.16,eave,P['brick'],.025);nave['reference_id']='L01'
orient(mesh('Nave roof',[A,B,C,D,RA,RB],[(0,1,5,4),(3,4,5,2)],P['roof']),(0,0,1))
orient(mesh('Nave west brick gable',[A,D,RA],[(0,1,2)],P['brick']),A-B)
orient(mesh('Nave east brick gable',[B,C,RB],[(0,1,2)],P['brick']),B-A)
for p1,p2 in [(A,RA),(RA,D),(B,RB),(RB,C),(RA,RB),(A,B),(C,D)]:beam('Roof stone edge',p1,p2,.035,P['trim'] if (p1!=RA or p2!=RB) else P['roofSeam'])
for i in range(1,13):
    t=i/13
    beam('Slate course front',A.lerp(RA,t)+Vector((0,0,.008)),B.lerp(RB,t)+Vector((0,0,.008)),.004,P['roofSeam']).visible_shadow=False
    beam('Slate course rear',D.lerp(RA,t)+Vector((0,0,.008)),C.lerp(RB,t)+Vector((0,0,.008)),.004,P['roofSeam']).visible_shadow=False
front=(B-A).normalized();out=Vector((front.y,-front.x,0));mid=(A+B+C+D)/4
if out.dot((A+B)/2-mid)<0:out=-out
for t in [.14,.48,.82]:arch('Nave lancet',A.lerp(B,t),front,out,.40,1.45,.55,P['glass'])
for t in [0,.34,.68,1]:
    p=A.lerp(B,t)+out*.07
    wall('Nave projecting buttress',p-front*.08,p+front*.08,eave+.06,.20,P['brickSide'])
    beam('Buttress cap',p-front*.105+Vector((0,0,eave+.10)),p+front*.105+Vector((0,0,eave+.10)),.055,P['trim'])
for p1,p2 in [(A,B),(B,C),(C,D),(D,A)]:
    pp1=p1.copy();pp2=p2.copy();pp1.z=pp2.z=.26;beam('Nave footing',pp1,pp2,.07,P['trim'])
end=(C-B).normalized();endOut=Vector((end.y,-end.x,0))
if endOut.dot((B+C)/2-mid)<0:endOut=-endOut
arch('East gable lancet',B.lerp(C,.4),end,endOut,.48,1.65,.5,P['glass'])

# Projecting entrance porch, built from the front wall rather than floating artwork.
pc=A.lerp(B,.43);pc.z=0;pa=pc-front*.48;pb=pc+front*.48;pd=pa+out*.72;pe=pb+out*.72
porchHeight=1.6
porch=prism('L03 projecting entrance porch',[pa,pb,pe,pd],.08,porchHeight,P['brickSide'],.015);porch['reference_id']='L03'
pridge=pc+Vector((0,0,2.5));fridge=pridge+out*.78
verts=[pa+Vector((0,0,porchHeight)),pb+Vector((0,0,porchHeight)),pe+Vector((0,0,porchHeight)),pd+Vector((0,0,porchHeight)),pridge,fridge]
orient(mesh('Porch slate roof',verts,[(0,3,5,4),(1,4,5,2)],P['roof']),(0,0,1))
orient(mesh('Porch brick gable',verts,[(2,5,3)],P['brick']),out)
beam('Porch gable trim',verts[3],verts[5],.04,P['trim']);beam('Porch gable trim',verts[5],verts[2],.04,P['trim'])
arch('Entry door',(pd+pe)/2,front,out,.55,1.36,.10,P['recess'])

# Slender tower: lower shaft, paired belfry openings, pyramidal cap and pinnacles.
towerH=inferred_height((904,365),476)
towerPixels=[(885,355),(904,365),(923,354),(904,345)]
tp=[unproject(p,towerH) for p in towerPixels];tc=sum(tp,Vector())/4
tower=prism('L02 authored tower',tp,.10,towerH,P['brickSide'],.02);tower['reference_id']='L02'
for z in [.28,towerH*.57,towerH*.78,towerH-.08]:
    enlarged=[tc+(p-tc)*1.07 for p in tp]
    prism('Tower string course',enlarged,z,z+.065,P['trim'],.008)
for i in range(4):
    p1,p2=tp[i],tp[(i+1)%4];t=(p2-p1).normalized();normal=Vector((t.y,-t.x,0))
    if normal.dot((p1+p2)/2-tc)<0:normal=-normal
    for v in [.32,.68]:arch('Belfry paired arch',p1.lerp(p2,v),t,normal,.18,.83,towerH-1.20,P['recess'])
    arch('Tower lower lancet',p1.lerp(p2,.5),t,normal,.25,1.4,.55,P['glass'])
for p in tp:
    low=p.copy();low.z=.18;high=p.copy();high.z=towerH+.24
    beam('Tower corner pier',low,high,.045,P['trim'])
    tip=high+Vector((0,0,.32));beam('Corner pinnacle',high,tip,.05,P['brick'])
apex=unproject((904,332),towerH+1.13)
mesh('Tower pyramidal roof',[*tp,apex],[(i,(i+1)%4,4) for i in range(4)],P['brick'])
beam('Tower finial',apex,apex+Vector((0,0,.20)),.022,P['trim'])

# Walled garden. Top-line observations are lifted to wall height before back-projection.
wallPixels=[(767,474),(797,513),(926,535),(944,471),(954,424)]
wallPoints=[unproject(p,.70) for p in wallPixels]
backPoints=[unproject((948,395),.70),unproject((786,357),.70),unproject((752,393),.70)]
boundary=wallPoints+backPoints
prism('G01 lawn',boundary,0,.04,P['grass'])
for j in range(len(boundary)):
    p1,p2=boundary[j],boundary[(j+1)%len(boundary)]
    wall('Garden boundary wall',p1,p2,.70,.12,P['wall'])
    p1=p1.copy();p2=p2.copy();p1.z=p2.z=.73;beam('Garden wall coping',p1,p2,.075,P['cap'])
    for t in [0,.5]:
        p=p1.lerp(p2,t);low=p.copy();low.z=.04;hi=p.copy();hi.z=.88;beam('Boundary pier',low,hi,.105,P['wall'])

# Authored canopy locations; no random scatter across the road or landmark sightline.
random.seed(21)
trees=[(775,390,2.6,.62),(785,373,2.3,.55),(765,417,2.4,.64),(780,448,2.0,.57),
       (788,480,1.8,.63),(812,493,1.8,.66),(841,497,1.7,.56),(866,500,1.8,.62),(899,498,1.8,.65),
       (923,489,2.6,.66),(933,458,2.3,.64),(944,410,2.4,.70),(922,389,2.0,.55),(841,383,1.6,.50)]
for index,(px,py,height,radius) in enumerate(trees):
    center=unproject((px,py),height);base=center.copy();base.z=.05;beam('Garden tree trunk',base,center,.07,P['trunk'])
    for j,(dx,dy,dz,scale) in enumerate([(0,0,.28,.80),(-.44,.1,0,.69),(.43,.05,.08,.72),(.1,-.43,-.16,.70),(-.1,.41,-.13,.67)]):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=radius*scale,location=center+Vector((dx,dy,dz)))
        ob=bpy.context.object;ob.name='Layered garden canopy';ob.scale=(1,random.uniform(.85,1.05),random.uniform(.95,1.18));ob.data.materials.append(P['leaf'+str(1+(index+j//3)%4)]);created.append(ob)

# Review 1 context: the main-road café, the quieter alternative, one finished residence,
# crossings and balanced traffic. Road geometry remains the approved traced blockout.
cafeTop,cafeH,cafeCenter=flat_building('M05','M05 authored main-road cafe',P['peach'],P['cream'])
prism('Cafe blue roof cap',cafeTop,cafeH+.13,cafeH+.29,P['blue'],.025)
p1,p2=cafeTop[2],cafeTop[3];ct=(p2-p1).normalized();cn=Vector((ct.y,-ct.x,0))
if cn.dot((p1+p2)/2-cafeCenter)<0:cn=-cn
for col in range(4):
    c=p1.lerp(p2,(col+.55)/4.1)
    panel('Cafe warm interior',c,ct,cn,.50,.83,.22,P['warmLight'],.028)
    panel('Cafe shopfront glazing',c,ct,cn,.55,.95,.18,P['glass'],.042)
    # Alternating slats make the canopy readable without a texture.
    awning=[c-ct*.34+cn*.03,c+ct*.34+cn*.03,c+ct*.34+cn*.50,c-ct*.34+cn*.50]
    prism('Cafe blue canopy',awning,1.04,1.13,P['blue'] if col%2==0 else P['cream'],.01)
# One strong roofline and projecting shade make the storefront legible at story scale.
canopy=[p1+ct*.02+cn*.10,p2-ct*.02+cn*.10,p2-ct*.02+cn*.70,p1+ct*.02+cn*.70]
prism('Cafe continuous blue awning',canopy,1.17,1.26,P['blueDark'],.018)
panel('Cafe fascia',p1.lerp(p2,.5),ct,cn,(p2-p1).length*.88,.30,1.28,P['cream'],.055)
for t in [.18,.43,.68,.87]:
    c=p1.lerp(p2,t)+cn*.78
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.18,depth=.05,location=c+Vector((0,0,.40)))
    ob=bpy.context.object;ob.name='Cafe terrace table';ob.data.materials.append(P['terracotta']);created.append(ob)
    beam('Cafe terrace pedestal',c+Vector((0,0,.05)),c+Vector((0,0,.38)),.035,P['charcoal'])
    # The reference's café terrace reads through small umbrellas and dense planters.
    if t in [.18,.68]:
        beam('Cafe parasol mast',c+Vector((0,0,.08)),c+Vector((0,0,1.05)),.025,P['charcoal'])
        bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=.42,radius2=.05,depth=.18,location=c+Vector((0,0,1.02)))
        ob=bpy.context.object;ob.name='Cafe cream parasol';ob.data.materials.append(P['cream']);created.append(ob)
for t in [.05,.31,.57,.82,.96]:
    c=p1.lerp(p2,t)+cn*.61
    box=[c-ct*.14-cn*.09,c+ct*.14-cn*.09,c+ct*.14+cn*.09,c-ct*.14+cn*.09]
    prism('Cafe terracotta planter',box,.06,.27,P['planter'],.02)
    for side in [-.07,.07]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.15,location=c+ct*side+Vector((0,0,.34)))
        ob=bpy.context.object;ob.name='Cafe flowering shrub';ob.scale=(1.0,.85,.8);ob.data.materials.append(P['leaf2'] if t!=.57 else P['flower']);created.append(ob)
for i,(px,py) in enumerate([(1285,350),(1310,360),(1335,370),(1360,380),(1382,390)]):
    c=unproject((px,py),.24)
    for j,(dx,dy) in enumerate([(0,0),(-.14,.05),(.14,.02)]):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.19-(j*.02),location=c+Vector((dx,dy,j*.04)))
        ob=bpy.context.object;ob.name='Cafe garden shrub';ob.scale=(1.1,.9,.8);ob.data.materials.append(P['leaf'+str(1+(i+j)%4)]);created.append(ob)

# The reference's commercial edge is a composed complex, not a row of generic towers.
# Model the four traced mall masses with large blue-glass bays, deep frames and rooftop services.
def mall_building(id,index):
    pixels=traced_roof(raw_roofs[id]);height=inventory[id]['height'];top=[unproject(p,height) for p in pixels];center=sum(top,Vector())/4
    body=prism(id+' bespoke mall volume',top,.08,height,P['cream'],.035);body['reference_id']=id
    prism(id+' bright roof slab',top,height,height+.14,P['white'],.018)
    for i in range(4):
        p1,p2=top[i],top[(i+1)%4];p1=p1.copy();p2=p2.copy();p1.z=p2.z=height+.27
        beam(id+' roof parapet',p1,p2,.075,P['white'])
    # Two visible elevations receive individually scaled curtain-wall bays.
    for edge_index in [1,2]:
        p1,p2=top[edge_index],top[(edge_index+1)%4];t=(p2-p1).normalized();n=Vector((t.y,-t.x,0))
        if n.dot((p1+p2)/2-center)<0:n=-n
        length=(p2-p1).length;bay_count=max(2,min(4,round(length/1.25)))
        for bay in range(bay_count):
            c=p1.lerp(p2,(bay+.5)/bay_count)
            width=length/bay_count*.72
            panel(id+' curtain wall frame',c,t,n,width+.16,height*.62,.62,P['white'],.038)
            panel(id+' blue curtain wall',c,t,n,width,height*.58,.70,P['glassLight'],.052)
            for floor in range(1,5):
                z=.70+height*.58*floor/5
                beam(id+' curtain transom',c-t*width/2+n*.060+Vector((0,0,z)),c+t*width/2+n*.060+Vector((0,0,z)),.020,P['blueDark'])
        if edge_index==2:
            entrance=p1.lerp(p2,.5)
            panel(id+' warm entrance',entrance,t,n,min(1.25,length*.34),.90,.12,P['warmLight'],.064)
            shade=[entrance-t*.72+n*.04,entrance+t*.72+n*.04,entrance+t*.72+n*.58,entrance-t*.72+n*.58]
            prism(id+' entrance canopy',shade,1.03,1.15,P['blueDark'],.018)
    # Visible rooftop service rhythm is important in the miniature reference.
    side=(top[1]-top[0]).normalized();normal=Vector((-side.y,side.x,0))
    for j in range(2 if id!='M04' else 1):
        c=center+side*(j-.5)*.55+normal*((index%2)-.5)*.32+Vector((0,0,height+.14))
        sx=.30+.05*(index%2);sy=.23+.04*(j%2)
        pts=[c+side*sx+normal*sy,c-side*sx+normal*sy,c-side*sx-normal*sy,c+side*sx-normal*sy]
        prism(id+' rooftop HVAC',pts,height+.14,height+.48,P['cream'],.025)
    return top,height,center

for mall_index,mall_id in enumerate(['M01','M02','M03','M04']):mall_building(mall_id,mall_index)

# Paved mall forecourt and a compact planted apron fill the empty white gap behind the café.
pixel_polygon('Mall parking court',[(1088,224),(1248,262),(1234,350),(1068,309)],.055,P['paving'])
pixel_polygon('Cafe planted apron',[(1188,337),(1343,378),(1331,410),(1177,369)],.058,P['grass'])
pixel_polygon('East apartment garden plots',[(1005,442),(1378,548),(1340,654),(976,554)],.044,P['grass'])
pixel_polygon('South apartment garden plots',[(774,548),(1135,582),(1248,700),(770,720)],.043,P['grass'])
for i,x in enumerate([1105,1130,1155,1180,1205,1230]):
    pixel_polygon('Parking bay stripe '+str(i+1),[(x,250+(x-1105)*.22),(x+2,250+(x-1105)*.22),(x-8,302+(x-1105)*.22),(x-10,302+(x-1105)*.22)],.066,P['roadWhite'])
parkHeading=heading_from_pixels((1150,245),(1140,300))
for i,(pixel,material) in enumerate([((1112,270),P['carWhite']),((1140,277),P['charcoal']),((1168,284),P['carWhite']),((1196,291),P['carCoral']),((1224,298),P['carWhite'])]):
    vehicle('Mall parked car '+str(i+1),pixel,parkHeading,'car',material)

apartmentTop,apartmentH,apartmentCenter=flat_building('S14','S14 authored balcony residence',P['cream'],P['peach'])

# Complete every visible building inside the Review 1 crop. These reuse one authored
# language while varying colour and scale; landmark/cafés keep their individual treatment.
context_ids=['N16','W24','S15','S16','S17','S18','S19','S20','S21','S22','S23','E01','E02','E03','E04','E05','E06']
for index,id in enumerate(context_ids):
    if id.startswith('M'):
        facade,accent=P['cream'],P['white']
    elif id.startswith('E'):
        facade,accent=(P['cream'],P['peach']) if index%2 else (P['white'],P['cream'])
    else:
        facade,accent=(P['cream'],P['terracotta']) if index%3 else (P['peach'],P['cream'])
    contextTop,contextH,contextCenter=flat_building(id,id+' authored context building',facade,accent)
    if id in ['S15','S16','E02','E03','E04']:
        garden=[contextCenter+(p-contextCenter)*.56 for p in contextTop]
        for p in garden:p.z=contextH+.135
        prism(id+' rooftop garden',garden,contextH+.13,contextH+.20,P['grass'],.012)
        edge=(garden[1]-garden[0]).normalized();side=Vector((-edge.y,edge.x,0))
        pergolaCenter=contextCenter+Vector((0,0,contextH+.22))
        for off in [-.28,0,.28]:beam(id+' roof pergola',pergolaCenter+side*off-edge*.42,pergolaCenter+side*off+edge*.42,.025,P['terracotta'])
    if id in ['S17','S20','E01','E05']:
        c=contextCenter+Vector((0,0,contextH+.36))
        bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.24,depth=.45,location=c)
        ob=bpy.context.object;ob.name=id+' rooftop water tank';ob.data.materials.append(P['cream']);created.append(ob)

quietPixels=traced_roof(raw_roofs['S13']);quietH=inventory['S13']['height'];quietTop=[unproject(p,quietH) for p in quietPixels];quietCenter=sum(quietTop,Vector())/4
quiet=prism('S13 authored quieter cafe',quietTop,.08,quietH,P['terracotta'],.02);quiet['reference_id']='S13'
ridgeA=(quietTop[0]+quietTop[3])/2+Vector((0,0,.55));ridgeB=(quietTop[1]+quietTop[2])/2+Vector((0,0,.55));midR=(ridgeA+ridgeB)/2
ridgeA=midR+(ridgeA-midR)*.65;ridgeB=midR+(ridgeB-midR)*.65
orient(mesh('Quiet cafe hipped roof',[*quietTop,ridgeA,ridgeB],[(0,1,5,4),(3,4,5,2),(0,4,3),(1,2,5)],P['roof']),(0,0,1))
qp1,qp2=quietTop[2],quietTop[3];qt=(qp2-qp1).normalized();qn=Vector((qt.y,-qt.x,0))
if qn.dot((qp1+qp2)/2-quietCenter)<0:qn=-qn
for col in range(3):panel('Quiet cafe storefront',qp1.lerp(qp2,(col+1)/4),qt,qn,.44,.72,.16,P['glass'])
qawn=[qp1+qt*.08+qn*.03,qp2-qt*.08+qn*.03,qp2-qt*.08+qn*.42,qp1+qt*.08+qn*.42]
prism('Quiet cafe terracotta awning',qawn,.83,.92,P['terracotta'],.012)

# Dark authored road surfaces, pavements and crossings replace the pale blockout treatment.
pixel_polygon('Authored dark main road',data['roads'][0]['points'],.052,P['asphalt'])
pixel_polygon('Authored west landmark street',data['roads'][1]['points'],.053,P['asphalt'])
pixel_polygon('Authored east landmark street',data['roads'][2]['points'],.054,P['asphalt'])
# Sidewalk and crossing markings are lifted just above those traced road surfaces.
pixel_polygon('Main cafe pavement',[(1092,365),(1328,430),(1318,452),(1084,391)],.055,P['path'])
pixel_polygon('South link pavement',[(770,548),(950,558),(952,570),(776,565)],.057,P['path'])
for i in range(7):
    x=976+i*6
    pixel_polygon('North junction zebra',[(x,352+i*1.5),(x+3,353+i*1.5),(x+3,386+i*1.5),(x,385+i*1.5)],.070,P['roadWhite'])
for i in range(8):
    y=394+i*6
    pixel_polygon('East junction zebra',[(990,y),(1018,y+7),(1016,y+10),(988,y+3)],.071,P['roadWhite'])
for i in range(10):
    x=1060+i*32
    pixel_polygon('Main road centre dash',[(x,409+(x-1060)*.285),(x+13,413+(x-1060)*.285),(x+12,416+(x-1060)*.285),(x-1,412+(x-1060)*.285)],.069,P['roadWhite'])

mainForward=heading_from_pixels((1050,375),(1380,472));mainBack=-mainForward
traffic=[((1055,389),mainForward,'auto',P['autoYellow']),((1112,404),mainForward,'scooter',P['shirtRed']),((1174,423),mainForward,'car',P['carWhite']),((1238,442),mainForward,'scooter',P['shirtBlue']),((1302,460),mainForward,'car',P['carCoral']),((1375,482),mainForward,'auto',P['autoYellow']),
         ((1405,484),mainBack,'car',P['carWhite']),((1342,466),mainBack,'scooter',P['shirtRed']),((1278,447),mainBack,'auto',P['autoYellow']),((1210,428),mainBack,'car',P['carWhite']),((1142,408),mainBack,'scooter',P['shirtBlue']),((1072,388),mainBack,'auto',P['autoYellow'])]
for i,(pixel,direction,kind,material) in enumerate(traffic):vehicle('Balanced traffic '+str(i+1),pixel,direction,kind,material)

for i,(pixel,shirt) in enumerate([((1108,355),P['shirtRed']),((1140,365),P['shirtBlue']),((1160,374),P['shirtBlue']),((1192,386),P['shirtRed']),((1228,398),P['shirtBlue']),((1260,410),P['shirtRed']),((1300,421),P['shirtBlue']),((1332,432),P['shirtRed']),((1028,385),P['shirtRed']),((990,406),P['shirtBlue']),((964,421),P['shirtBlue']),((774,565),P['shirtRed'])]):
    pedestrian('Street pedestrian '+str(i+1),pixel,shirt)

def street_tree(name,pixel,height,radius):
    c=unproject(pixel,height);base=c.copy();base.z=.04;beam(name+' trunk',base,c,.06,P['trunk'])
    for j,(dx,dy,dz) in enumerate([(0,0,.20),(-.34,.03,.02),(.33,.06,.04),(.05,-.31,-.07),(-.18,.27,-.04),(.22,.24,-.08)]):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=radius*(.78 if j else 1),location=c+Vector((dx,dy,dz)))
        ob=bpy.context.object;ob.name=name+' canopy';ob.scale=(1+(.08 if j%2 else 0),.88+(j%3)*.08,.88+(j%2)*.12);ob.data.materials.append(P['leaf'+str(1+j%4)]);created.append(ob)
tree_pixels=[(1068,300),(1098,310),(1130,320),(1162,330),(1200,340),(1240,351),(1280,365),(1320,380),(1360,394),(1114,360),(1162,373),(1310,413),(1044,407),(966,446),(770,540),(1005,492),(1030,470),(1060,505),(1095,500),(1128,518),(1160,524),(1180,505),(1215,540),(1245,550),(1270,518),(1300,564),(1332,580),(1360,594),(1040,550),(1075,575),(1110,580),(1150,595),(1190,604),(1230,618),(1275,630),(850,588),(905,590),(744,610),(818,665),(945,684),
             (710,570),(752,628),(792,612),(840,630),(890,625),(970,642),(1018,675),(1060,692),(1125,680),(1175,665),(1232,644),(1282,615),(1320,588),(1165,560),(1210,548),(1300,548),(1340,556),(850,705),(905,718),(982,720)]
for i,pixel in enumerate(tree_pixels):street_tree('Street tree '+str(i+1),pixel,1.45+(i%4)*.14,.40+(i%3)*.045)

def palm(name,pixel,height):
    crown=unproject(pixel,height);base=crown.copy();base.z=.04;beam(name+' trunk',base,crown,.045,P['trunk'])
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.18,location=crown+Vector((0,0,.04)))
    heart=bpy.context.object;heart.name=name+' crown';heart.scale=(1,1,.72);heart.data.materials.append(P['leaf1']);created.append(heart)
    for j in range(10):
        angle=j*math.pi/5;direction=Vector((math.cos(angle),math.sin(angle),0));perp=Vector((-direction.y,direction.x,0))
        base=crown+Vector((0,0,.12));middle=crown+direction*.34+Vector((0,0,.03));tip=crown+direction*.72+Vector((0,0,-.18-(j%2)*.05))
        verts=[base-perp*.035,base+perp*.035,middle+perp*.075,middle-perp*.075,tip]
        orient(mesh(name+' broad frond '+str(j),verts,[(0,1,2,3),(3,2,4)],P['leaf2' if j%2 else 'leaf1']),(0,0,1))
for i,pixel in enumerate([(1085,285),(1120,300),(1160,315),(1202,329),(1245,344),(1138,354),(1192,372),(1264,397),(1344,425),(1170,568),(1288,596),(1010,674),(875,650)]):palm('Street palm '+str(i+1),pixel,1.75+(i%2)*.18)

# Bake an atlas: corner-only vertex lighting undersamples broad masonry/roof faces.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(1,.92,.80,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
light=bpy.data.objects.get('Large softbox');light.data.energy=4000;light.data.size=18
sun_data=bpy.data.lights.new('Warm reference daylight','SUN');sun_data.energy=1.65;sun_data.angle=.22;sun_data.color=(1,.94,.84)
sun=bpy.data.objects.new('Warm reference daylight',sun_data);bpy.context.collection.objects.link(sun);sun.rotation_euler=(.4,-.45,-.35)
scene.camera=bpy.data.objects['Diagnostic perspective fit'];scene.view_settings.view_transform='Standard'
scene['scope']='Detailed synagogue section; remainder is intentionally grey. Approved blockout retained separately.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'landmark-source.blend'))
for ob in bpy.context.selected_objects:ob.select_set(False)
for ob in created:
    ob.select_set(True)
    bpy.context.view_layer.objects.active=ob
    for mod in list(ob.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.context.view_layer.objects.active=created[0];bpy.ops.object.join();section=bpy.context.object;section.name='Authored synagogue and grounds'
if not section.data.uv_layers:section.data.uv_layers.new(name='LightAtlas')
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.004);bpy.ops.object.mode_set(mode='OBJECT')
atlas=bpy.data.images.new('Landmark baked light',width=2048,height=2048)
for slot in section.material_slots:
    node=slot.material.node_tree.nodes.new('ShaderNodeTexImage');node.image=atlas;slot.material.node_tree.nodes.active=node
scene.render.bake.target='IMAGE_TEXTURES';scene.render.bake.margin=4;scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.use_pass_color=True
bpy.ops.object.bake(type='DIFFUSE')
atlas.filepath_raw=str(OUT/'landmark-light.png');atlas.file_format='PNG';atlas.save();atlas.pack()
m=bpy.data.materials.new('Baked landmark illumination');m.use_nodes=True;nodes=m.node_tree.nodes;nodes.clear()
outnode=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');tex=nodes.new('ShaderNodeTexImage');tex.image=atlas
m.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);m.node_tree.links.new(em.outputs[0],outnode.inputs['Surface'])
section.data.materials.clear();section.data.materials.append(m)
for p in section.data.polygons:p.material_index=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'landmark-baked.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'landmark.glb'),export_format='GLB',export_extras=True,export_cameras=False,export_vertex_color='ACTIVE')
scene.render.filepath=str(OUT/'hero.png');bpy.ops.render.render(write_still=True)
# Same camera, cropped view: source comparison can use exactly the same pixel rectangle.
scene.render.use_border=True;scene.render.use_crop_to_border=True
scene.render.border_min_x=700/W;scene.render.border_max_x=1040/W;scene.render.border_min_y=1-575/H;scene.render.border_max_y=1-315/H
scene.render.resolution_percentage=200;scene.render.filepath=str(OUT/'detail.png');bpy.ops.render.render(write_still=True)
# Larger Review 1 crop includes the landmark, main-road cafe, quieter alternative,
# authored residence, crossings, pedestrians and opposing traffic flows.
scene.render.border_min_x=620/W;scene.render.border_max_x=1400/W;scene.render.border_min_y=1-750/H;scene.render.border_max_y=1-250/H
scene.render.resolution_percentage=120;scene.render.filepath=str(OUT/'review1-section.png');bpy.ops.render.render(write_still=True)
(OUT/'section.json').write_text(json.dumps({'sourceCrop':[700,315,340,260],'reviewCrop':[620,250,780,500],'naveEaveHeight':eave,'towerHeight':towerH,'triangles':sum(len(p.vertices)-2 for p in section.data.polygons),'scope':'Review 1 representative section. Height and hidden geometry inferred; visual match requires review.'},indent=2))
print('LANDMARK_READY',flush=True)
