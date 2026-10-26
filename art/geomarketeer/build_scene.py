"""Review 1: authored Pune diorama. Run with Blender's background Python.

Geometry, palette and placements are deterministic. Source dimensions are metres;
Blender Z is up, glTF/Three Y is up. This is an illustrative reconstruction.
"""
import bpy
import math
import random
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/portfolio/geomarketeer/review-2'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(41)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.materials):
    bpy.data.materials.remove(block)

def linear(c):
    return c / 12.92 if c < .04045 else ((c + .055) / 1.055) ** 2.4

def mat(name, hexcolor, rough=.85):
    rgb = tuple(linear(int(hexcolor[i:i+2], 16) / 255) for i in (0,2,4))
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb,1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*rgb,1)
    bs.inputs['Roughness'].default_value = rough
    return m

P = {k:mat(k,v) for k,v in {
    'ivory':'EEE2CB','white':'F7F0DF','sand':'CCB18C','stone':'BDA17D',
    'ochre':'DCC093','peach':'E5C4AF','cream':'EBDBC4','roof':'C98C69',
    'roofDark':'8D8178','red':'AD6041','brick':'B66C4A','brickLight':'C07E59',
    'trim':'E4BE97','shadow':'4C534A','glass':'8CAEBB','glassDark':'668C9A',
    'road':'595D61','line':'F2EDDA','pavement':'D9CCB2','ground':'C9BB91',
    'lawn':'A2AD69','grass':'8A9A50','trunk':'76613D','leaf1':'4E782C',
    'leaf2':'739643','leaf3':'8FA84F','leaf4':'3D703D','leaf5':'A8B865',
    'yellow':'DDB731','black':'303B37','rubber':'2F3430','metal':'6A766C',
    'teal':'466F6A','awning':'6A8D79','coral':'B96848','blue':'52778B',
    'terrace':'C0B39B','soil':'B5A17A','redCar':'A3533F','shirt':'B9C8BC'
}.items()}
STATIC = []
GROUND = []
PAINT = []
TEMPLATES = []
MODE = STATIC
FOOTPRINTS=[]

def mesh(name, verts, faces, material):
    d = bpy.data.meshes.new(name)
    d.from_pydata(verts, [], faces)
    d.materials.append(material)
    d.update()
    o = bpy.data.objects.new(name,d)
    bpy.context.collection.objects.link(o)
    MODE.append(o)
    return o

def box(name,x,y,z,w,d,h,m,bevel=0):
    verts=[(a*w/2,b*d/2,c*h/2) for a,b,c in
           [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    o=mesh(name,verts,[(0,3,2,1),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],m)
    o.location=(x,y,z)
    if bevel:
        mod=o.modifiers.new('Soft masonry edges','BEVEL')
        mod.width=bevel; mod.segments=1
    return o

def cylinder(name,x,y,z,r,h,m,n=10,rt=None):
    rt=r if rt is None else rt
    vs=[(x+rr*math.cos(2*math.pi*i/n),y+rr*math.sin(2*math.pi*i/n),zz)
        for rr,zz in [(r,z-h/2),(rt,z+h/2)] for i in range(n)]
    fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,vs,fs,m)

def beam(name,a,b,r,m):
    mid=(Vector(a)+Vector(b))/2
    o=cylinder(name,0,0,0,r,(Vector(b)-Vector(a)).length,m,6)
    o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler()
    o.location=mid
    return o

def poly(name,points,z,m):
    return mesh(name,[(x,y,z) for x,y in points],[tuple(range(len(points)))],m)

def strip(name,points,width,z,m):
    vs=[]
    for i,p in enumerate(points):
        v=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        v.normalize(); norm=Vector((-v.y,v.x))
        vs.extend([(p[0]+norm.x*width/2,p[1]+norm.y*width/2,z),(p[0]-norm.x*width/2,p[1]-norm.y*width/2,z)])
    return mesh(name,vs,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(points)-1)],m)

def join(obs,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs:
        o.select_set(True)
        bpy.context.view_layer.objects.active=o
        for mod in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active=obs[0]
    bpy.ops.object.join()
    ob=bpy.context.object; ob.name=name
    return ob

def sign(text,x,y,z,size,m):
    c=bpy.data.curves.new('Lettering','FONT'); c.body=text; c.size=size
    c.align_x='CENTER'; c.extrude=.001; c.resolution_u=2
    o=bpy.data.objects.new('Sign '+text,c); bpy.context.collection.objects.link(o)
    o.location=(x,y,z); o.rotation_euler=(math.pi/2,0,0); c.materials.append(m)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH'); MODE.append(bpy.context.object)

# Reference-registered full neighbourhood composition, not verified map data.
exec(compile(Path(__file__).with_name('layout_ground.py').read_text(),'layout_ground.py','exec'))

# Synagogue: nave, pitched roof, articulated Gothic tower and lancet windows.
MODE=STATIC
box('Synagogue plinth',-.45,.3,.19,3.6,4.9,.26,P['trim'],.045)
box('Synagogue nave',-.65,.45,1.5,2.85,4.35,2.7,P['red'],.025)
for x in [-2.13,.83]: box('Nave stone footing',x,.45,.4,.12,4.45,.34,P['trim'])

def roof(x,y,z,w,d,rise,material=None):
    material=material or P['roofDark']
    mesh('Pitched slate roof',[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x,y-d/2,z+rise),
        (x-w/2,y+d/2,z),(x+w/2,y+d/2,z),(x,y+d/2,z+rise)],
        [(2,5,3,0),(1,4,5,2),(1,2,0),(5,4,3)],material)
    for t in range(1,7):
        a=t/7
        for side in [-1,1]:
            xx=x+side*w*.5*a; zz=z+rise*(1-a)
            beam('Roof tile course',(xx,y-d/2,zz+.003),(xx,y+d/2,zz+.003),.005,material)
    beam('Roof ridge',(x,y-d/2-.02,z+rise),(x,y+d/2+.02,z+rise),.045,P['stone'])
roof(-.65,.45,2.86,3.18,4.7,.91)
for yy in [-1.73,2.63]:
    mesh('Nave brick gable',[(-2.075,yy,2.82),(.775,yy,2.82),(-.65,yy,3.67)],[(0,1,2)],P['red'])
    for side in [-1,1]:
        beam('Nave gable trim',(-.65,yy,3.67),(-.65+side*1.43,yy,2.83),.035,P['trim'])

def arch(x,y,z,w,h,material,axis='front'):
    # Pointed lancet silhouette; plane mounted on facade.
    pts=[(-w/2,0),(w/2,0),(w/2,h*.64),(w*.36,h*.83),(0,h),(-w*.36,h*.83),(-w/2,h*.64)]
    vs=[(x+u,y,z+v) if axis=='front' else (x,y+u,z+v) for u,v in pts]
    # The nave's left elevation faces -X. Baking does not automatically flip
    # back-facing window planes the way a two-sided beauty render can.
    face=tuple(reversed(range(7))) if axis=='side' and x<0 else tuple(range(7))
    return mesh('Gothic lancet',vs,[face],material)

for y in [-1.0,.15,1.3,2.35]:
    for x in [-2.09,.79]:
        face=-.012 if x<0 else .012
        arch(x+face,y,.72,.59,1.55,P['trim'],'side')
        arch(x+face*2,y,.80,.40,1.35,P['glassDark'],'side')
        box('Lancet mullion',x+face*3,y,1.43,.025,.035,1.25,P['trim'])
    for x in [-2.18,.88]:
        box('Nave buttress',x,y+.43,1.18,.22,.22,2.1,P['brick'],.012)
        box('Buttress cap',x,y+.43,2.28,.26,.26,.12,P['trim'])
arch(-.75,-1.73,.45,.83,1.72,P['trim'])
arch(-.75,-1.741,.48,.65,1.51,P['shadow'])
box('Double door centre',-.75,-1.75,1.03,.035,.025,1.1,P['trim'])

tx,ty=1.0,-1.25
box('Clock tower',tx,ty,2.95,1.1,1.27,5.65,P['brick'],.025)
for z in [.45,2.55,3.72,4.9,5.55]:
    box('Tower string course',tx,ty,z,1.17,1.34,.075,P['brickLight'],.012)
for xx in [tx-.52,tx+.52]:
    for yy in [ty-.6,ty+.6]:
        box('Tower corner pier',xx,yy,3,.14,.14,5.8,P['brickLight'],.01)
        cylinder('Pinnacle pedestal',xx,yy,6.02,.1,.48,P['trim'],4)
        cylinder('Pointed pinnacle',xx,yy,6.48,.13,.53,P['brick'],4,0)
for x in [tx-.23,tx+.23]:
    arch(x,ty-.65,4.1,.30,.65,P['trim'])
    arch(x,ty-.66,4.15,.19,.51,P['shadow'])
    arch(x,ty-.65,1.0,.30,1.1,P['trim'])
    arch(x,ty-.66,1.08,.19,.91,P['shadow'])
for y in [ty-.25,ty+.25]:
    arch(tx+.561,y,4.1,.3,.65,P['trim'],'side')
    arch(tx+.571,y,4.15,.19,.51,P['shadow'],'side')
# Circular clock face oriented toward camera.
clock=cylinder('Clock limestone rim',0,0,0,.29,.035,P['trim'],32)
clock.rotation_euler.x=math.pi/2; clock.location=(tx,ty-.661,3.25)
clock=cylinder('Clock dial',0,0,0,.235,.04,P['ivory'],32)
clock.rotation_euler.x=math.pi/2; clock.location=(tx,ty-.68,3.25)
for i in range(12):
    a=i*math.tau/12
    o=box('Clock hour',tx+math.sin(a)*.194,ty-.709,3.25+math.cos(a)*.194,.018,.012,.044,P['shadow']); o.rotation_euler.y=a
beam('Clock hour hand',(tx,ty-.719,3.25),(tx-.09,ty-.719,3.31),.012,P['shadow'])
beam('Clock minute hand',(tx,ty-.719,3.25),(tx+.035,ty-.719,3.41),.009,P['shadow'])
box('Tower parapet',tx,ty,5.77,1.18,1.34,.18,P['brick'],.02)
roof(tx,ty,5.91,.9,1.07,.36)
# Gabled entrance porch and steps: readable depth, rather than a door painted on a box.
box('Nave porch',-.75,-1.94,.95,1.17,.57,1.5,P['brick'],.015)
roof(-.75,-1.97,1.72,1.35,.78,.49)
arch(-.75,-2.24,.28,.63,1.28,P['trim'])
arch(-.75,-2.25,.30,.49,1.09,P['shadow'])
for i in range(3):box('Nave entrance step',-.75,-2.33-i*.14,.20-i*.045,1.3,.22,.10,P['trim'],.008)
for y in [-3.8,3.65]:
    for x in [-3.6+i*.45 for i in range(16)]:
        if y<0 and -.35<x<2: continue
        box('Garden wall',x,y,.33,.46,.19,.52,P['stone'],.015)
        box('Wall coping',x,y,.61,.48,.24,.07,P['ivory'])
        for j in range(3): cylinder('Iron railing',x-.15+j*.15,y,.86,.014,.48,P['shadow'],4)
for x in [-3.65,3.45]:
    box('Side boundary wall',x,-.05,.31,.17,7.4,.5,P['stone'],.02)
for x in [-.38,1.99]:
    box('Gate pier',x,-3.8,.63,.3,.3,1.15,P['brick'],.02)
    box('Gate cap',x,-3.8,1.24,.38,.38,.12,P['trim'],.02)

# Turn the nave's long, windowed elevation toward the approved hero view.
# The campus boundary and gate retain their relationship to the surrounding roads.
from mathutils import Matrix
turn=Matrix.Translation((.9,.3,0)) @ Matrix.Rotation(math.pi/2,4,'Z')
architecture_prefixes=('Synagogue','Nave','Gothic','Lancet','Buttress','Double door','Clock','Tower','Pinnacle','Pointed pinnacle','Pitched slate','Roof tile','Roof ridge')
bpy.context.view_layer.update()
for ob in STATIC:
    if ob.name.startswith(architecture_prefixes):
        ob.matrix_world=turn @ ob.matrix_world
exec(compile(Path(__file__).with_name('landmark_facades.py').read_text(),'landmark_facades.py','exec'))

def window(x,y,z,w=.43,h=.58):
    box('Window recess',x,y,z,w+.12,.045,h+.12,P['stone'])
    box('Window glazing',x,y-.029,z,w,.025,h,P['glassDark'])
    box('Window lintel',x,y-.045,z+h/2+.055,w+.20,.13,.075,P['white'],.008)
    box('Window sill',x,y-.085,z-h/2-.035,w+.18,.22,.07,P['ivory'],.008)
    box('Window mullion',x,y-.05,z,.035,.03,h,P['ivory'])
    box('Window transom',x,y-.05,z+.06,w,.03,.027,P['ivory'])

def building(name,x,y,w,d,floors,color,balcony=True,pitched=False,style=0):
    FOOTPRINTS.append((x,y,w/2+.35,d/2+.35))
    h=floors*.91+.25
    box(name,x,y,h/2,w,d,h,P[color],.035)
    box('Foundation',x,y,.12,w+.10,d+.12,.24,P['stone'],.015)
    front=y-d/2
    for fl in range(floors):
        z=.65+fl*.91
        cols=max(2,round(w/(1.15 if style in [2,5,8] else .85)))
        for i in range(cols):
            xx=x-w/2+(i+.5)*w/cols
            window(xx,front-.015,z,min(.66,w/cols*.60),.54)
        # Side elevation includes windows rather than blank boxes.
        for sy in [y-d*.27,y+d*.27]:
            box('Side window trim',x+w/2+.013,sy,z,.04,.55,.65,P['ivory'])
            box('Side window glass',x+w/2+.04,sy,z,.025,.43,.52,P['glass'])
        if balcony and fl>0:
            # Three distinct frontage types: inset solid balconies, paired balconies,
            # and a light metal veranda. Avoid identical dark rail grids on every plot.
            if style in [1,5,9]:
                for side in [-1,1]:
                    bx=x+side*w*.26;bw=w*.37
                    box('Paired balcony slab',bx,front-.20,z-.37,bw,.46,.10,P['white'],.025)
                    box('Paired balcony parapet',bx,front-.42,z-.16,bw,.09,.36,P[color],.02)
                    for sx in [-1,1]:box('Balcony return',bx+sx*bw*.47,front-.2,z-.16,.065,.45,.36,P[color],.01)
            elif style in [2,4,8,10]:
                box('Solid balcony slab',x,front-.23,z-.37,w*.87,.52,.1,P['white'],.02)
                box('Solid balcony parapet',x,front-.47,z-.15,w*.87,.10,.39,P[color],.025)
                box('Balcony coping',x,front-.48,z+.055,w*.91,.14,.05,P['white'],.01)
                for sx in [-1,1]:box('Balcony end',x+sx*w*.42,front-.23,z-.15,.09,.5,.39,P[color],.01)
            else:
                box('Veranda slab',x,front-.25,z-.37,w*.89,.54,.10,P['white'],.015)
                box('Veranda rail top',x,front-.49,z-.01,w*.85,.045,.045,P['metal'])
                for j in range(int(w*4)):
                    xx=x-w*.40+j*.25
                    box('Veranda baluster',xx,front-.49,z-.17,.025,.025,.32,P['metal'])
    box('Roof cornice',x,y,h+.035,w+.17,d+.17,.16,P['white'],.022)
    box('Flat roof',x,y,h+.14,w-.12,d-.12,.09,P['terrace'])
    for yy in [y-d/2,y+d/2]: box('Roof parapet',x,yy,h+.29,w+.07,.12,.35,P[color],.012)
    for xx in [x-w/2,x+w/2]: box('Roof parapet',xx,y,h+.29,.12,d,.35,P[color],.012)
    if pitched:
        roof(x,y,h+.30,w+.3,d+.3,.66,P['roof'])
    else:
        box('Stairwell',x-w*.25,y+d*.17,h+.44,w*.30,d*.32,.61,P[color],.02)
        box('Stairwell cap',x-w*.25,y+d*.17,h+.77,w*.33,d*.35,.08,P['white'],.01)
        if style%3!=1:
            cylinder('Water tank',x+w*.23,y+d*.20,h+.43,.22,.5,P['shadow'],12)
            cylinder('Tank lid',x+w*.23,y+d*.20,h+.70,.24,.045,P['black'],12)
    if balcony:
        for xx in [x-w*.3,x+w*.3]:
            cylinder('Balcony terracotta pot',xx,front-.38,h-.58,.085,.16,P['roof'],8,.11)
            cylinder('Balcony plant',xx,front-.38,h-.42,.11,.22,P['leaf4'],7,.04)
    beam('Drainpipe',(x-w/2+.08,front-.07,.2),(x-w/2+.08,front-.07,h),.028,P['stone'])
    box('Air conditioner',x+w/2+.12,y-d*.28,1.4,.28,.47,.27,P['ivory'],.02)
    for i in range(5): box('AC grille',x+w/2+.265,y-d*.28,1.30+i*.04,.01,.36,.014,P['metal'])
    return h

exec(compile(Path(__file__).with_name('layout_buildings.py').read_text(),'layout_buildings.py','exec'))

# Trees use clusters of faceted crowns with varied scale, hue and branching.
def crown(x,y,z,r,idx,detail=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=detail,radius=r,location=(x,y,z))
    o=bpy.context.object; o.name='Sculpted foliage'; o.scale=(1,random.uniform(.86,1.12),random.uniform(.86,1.18))
    # Small nonuniform sculpting keeps the rounded faceting from reading as spheres.
    for v in o.data.vertices:v.co*=random.uniform(.94,1.06)
    o.data.materials.append(P['leaf'+str(idx)]); MODE.append(o)

def tree(x,y,s=1):
    start=len(STATIC)
    shape=random.randrange(3)
    cylinder('Tree trunk',x,y,.68*s,.085*s,1.35*s,P['trunk'],7,.045*s)
    base_hue=random.choice([1,2,2,3,4])
    for i in range(5):
        a=i*2.4+shape*.5; rr=(.43 if i else 0)*s*(1.2 if shape==1 else .9)
        xx=x+math.cos(a)*rr; yy=y+math.sin(a)*rr
        height=(1.38+random.random()*.30+(i==0)*(.35 if shape==2 else .1))*s
        crown(xx,yy,height,(.46+random.random()*.18)*s,base_hue if i%3 else min(5,base_hue+1))
    for a in [0,2.2,4.4]: beam('Tree branch',(x,y,.65*s),(x+math.cos(a)*.35*s,y+math.sin(a)*.35*s,1.4*s),.035*s,P['trunk'])
    assembled=join(STATIC[start:],'Clustered canopy tree')
    STATIC[start:]=[assembled]

tree_positions=[(-3,2.7),(-3,.7),(-3,-1.5),(3.3,2.9),(3.5,.4),(3,-2.6),(-2.7,-3.1)]
for x,y in tree_positions: tree(x,y,random.uniform(.75,1))

def palm(x,y,s):
    beam('Palm trunk',(x,y,.1),(x+.13,y,2.45*s),.065,P['trunk'])
    for i in range(8):
        a=i*math.tau/8
        points=[]
        for j in range(5):
            t=j/4; r=t*1.05*s
            points.append((x+.13+math.cos(a)*r,y+math.sin(a)*r,2.45*s+.4*math.sin(t*math.pi)-.26*t))
        vs=[]
        for j,(xx,yy,z) in enumerate(points):
            width=.13*math.sin(j/4*math.pi)
            vs.extend([(xx-math.sin(a)*width,yy+math.cos(a)*width,z),(xx+math.sin(a)*width,yy-math.cos(a)*width,z)])
        mesh('Palm frond',vs,[(j*2,j*2+1,j*2+3,j*2+2) for j in range(4)],P['leaf4'] if i%2 else P['leaf2'])
exec(compile(Path(__file__).with_name('layout_planting.py').read_text(),'layout_planting.py','exec'))

# Benches, lamps, pavement detail and small residents.
for x,y in [(-3.0,-2.2),(2.8,1.3),(-6,3.2)]:
    for i in range(3): box('Bench timber',x,y+i*.075,.43,.70,.055,.07,P['roofDark'],.01)
    for xx in [x-.25,x+.25]: box('Bench foot',xx,y+.08,.23,.06,.2,.40,P['metal'])
for distance in range(2,int(route_length)-1,4):
    p,t=sample_path(main,distance);x,y=p+Vector((t.y,-t.x))*1.48
    cylinder('Street lamp post',x,y,1.3,.027,2.6,P['metal'],8)
    beam('Lamp arm',(x,y,2.59),(x,y+.38,2.68),.025,P['metal'])
    box('Lamp head',x,y+.42,2.67,.13,.26,.07,P['ivory'],.02)

def person(x,y,a=0):
    color=random.choice([P['shirt'],P['white'],P['teal'],P['coral']])
    cylinder('Person torso',x,y,.38,.06,.22,color,7,.08)
    cylinder('Person head',x,y,.55,.049,.10,P['sand'],8)
    for dx in [-.035,.035]: beam('Person leg',(x+dx,y,.27),(x+dx,y+.02,.07),.021,P['shadow'])
for distance in [i*1.7+.8 for i in range(int(route_length/1.7))]:
    p,t=sample_path(main,distance)
    side=random.choice([-1,1]);p+=Vector((-t.y,t.x))*1.48*side
    person(p.x,p.y)

# Vehicles: separate objects so traffic can move without rebaking the city.
def vehicle(kind,x,y,heading):
    global MODE
    parts=[]; MODE=parts
    body=P['yellow'] if kind=='auto' else random.choice([P['ivory'],P['ivory'],P['redCar'],P['coral']]) if kind=='car' else P['redCar']
    w=.37 if kind=='scooter' else .58
    length=.66 if kind=='scooter' else .95
    box(kind+' body',0,0,.23,w,length,.27,body,.045)
    if kind=='auto':
        box('Auto canopy',0,.14,.64,.57,.59,.10,P['black'],.035)
        box('Auto back',0,.39,.45,.53,.10,.33,P['black'],.015)
        for xx in [-.25,.25]: beam('Auto roof support',(xx,-.12,.35),(xx,-.12,.65),.016,P['metal'])
        box('Auto windscreen',0,-.19,.48,.45,.025,.25,P['glassDark'])
        box('Auto nose',0,-.43,.30,.4,.14,.22,P['yellow'],.025)
    elif kind=='car':
        box('Car cabin',0,.04,.48,.50,.52,.26,P['glassDark'],.055)
        box('Car roof',0,.06,.62,.44,.39,.05,body,.025)
        for xx in [-.26,.26]: box('Car window pillar',xx,.03,.48,.025,.035,.23,body)
        for xx in [-.2,.2]: box('Headlamp',xx,-.475,.26,.12,.012,.055,P['white'])
    else:
        box('Scooter seat',0,.12,.44,.23,.30,.08,P['black'],.025)
        cylinder('Rider torso',0,.05,.65,.08,.3,P['teal'],8)
        cylinder('Helmet',0,.05,.87,.075,.13,P['black'],8)
        beam('Handlebars',(-.17,-.2,.52),(.17,-.2,.52),.016,P['metal'])
    for xx,yy in ([(-w/2,.26),(w/2,.26),(0,-.3)] if kind=='auto' else [(xx,yy) for xx in [-w/2,w/2] for yy in [-.29,.29]]):
        wheel=cylinder('Tyre',0,0,0,.115,.07,P['rubber'],10); wheel.rotation_euler.y=math.pi/2; wheel.location=(xx,yy,.14)
    o=join(parts,'Traffic_'+kind); o.location=(x,y,0); o.rotation_euler.z=heading
    TEMPLATES.append(o); MODE=STATIC
    return o

traffic=[]
for direction in [1,-1]:
    for i in range(14):
        distance=(i+.35+(0 if direction==1 else .3))*route_length/14
        p,t=sample_path(main,distance);p+=Vector((-t.y,t.x))*direction*.58
        o=vehicle(['auto','car','scooter','car'][i%4],p.x,p.y,(math.pi/2 if direction==1 else -math.pi/2)+math.atan2(t.y,t.x))
        traffic.append((o,direction,distance))
for x,y in [(11.7,9+i*.94) for i in range(7)]+[(22,8+i*1.1) for i in range(5)]:vehicle('car',x,y,math.pi/2)
for x,y in [(-4.8,2),(-4.2,-9),(5.6,1),(11.7,-14),(-16,-6)]:vehicle('auto',x,y,0)

# Explicit scene anchors; no screen-pixel coordinates in the viewer.
anchors={'synagogue':(1,.5,2.8),'cafe_primary':(16,6,1.1),'homes':(-9,-9.5,2.8),
         'offices':(17,12,4.8),'cafe_alternative':(-7.8,-8.8,1.1)}
for name,loc in anchors.items():
    o=bpy.data.objects.new('anchor_'+name,None); bpy.context.collection.objects.link(o); o.location=loc

print('ASSEMBLY COMPLETE',len(STATIC),'static parts',flush=True)
city=join(STATIC,'Pune_Architecture')
exec(compile(Path(__file__).with_name('clear_forecourt.py').read_text(),'clear_forecourt.py','exec'))
# Fine road paint uses vertex colour, not tiny UV islands that turn black after
# atlas downsampling. Its geometry and traffic alignment remain unchanged.
PAINT=[o for o in GROUND if o.name.startswith(('Road centre dash','Zebra crossing','Main yellow edge line','Parking bay line'))]
GROUND=[o for o in GROUND if o not in PAINT]
paint=join(PAINT,'Pune_RoadPaint')
ground=join(GROUND,'Pune_Ground')
# Layered road/grass surfaces receive shadows from the city but must not cast
# contact shadows on their almost-coplanar neighbours at junctions.
ground.visible_shadow=False
paint.visible_shadow=False

# Static light is baked to atlases; vehicles use baked vertex colours.
# Both material types export unlit, preserving the approved light in the viewer.
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.88,.88,.83,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.8
light=bpy.data.lights.new('Warm afternoon sun','AREA'); light.energy=2300; light.shape='DISK'; light.size=9
lo=bpy.data.objects.new('Warm afternoon sun',light); bpy.context.collection.objects.link(lo); lo.location=(-9,-8,18)
lo.rotation_euler=(Vector((0,0,0))-lo.location).to_track_quat('-Z','Y').to_euler()
light.color=(1,.88,.69)
sun=bpy.data.lights.new('Sun','SUN'); sun.energy=1.8; sun.angle=.17; sun.color=(1,.92,.80)
so=bpy.data.objects.new('Sun',sun); bpy.context.collection.objects.link(so); so.rotation_euler=(.4,-.45,-.35)

def bake_vertices(obj):
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    a=obj.data.color_attributes.new(name='BakedLight',type='FLOAT_COLOR',domain='CORNER')
    obj.data.color_attributes.active_color=a
    scene.render.bake.target='VERTEX_COLORS'
    scene.render.bake.use_pass_direct=True; scene.render.bake.use_pass_indirect=True; scene.render.bake.use_pass_color=True
    bpy.ops.object.bake(type='DIFFUSE')
    m=bpy.data.materials.new(obj.name+'_Baked'); m.use_nodes=True
    n=m.node_tree.nodes; n.clear()
    output=n.new('ShaderNodeOutputMaterial'); color=n.new('ShaderNodeVertexColor'); color.layer_name='BakedLight'
    m.node_tree.links.new(color.outputs['Color'],output.inputs['Surface'])
    obj.data.materials.clear(); obj.data.materials.append(m)
    for p in obj.data.polygons: p.material_index=0

def flat_vertices(obj):
    a=obj.data.color_attributes.new(name='BakedLight',type='FLOAT_COLOR',domain='CORNER')
    obj.data.color_attributes.active_color=a
    for face in obj.data.polygons:
        color=obj.data.materials[face.material_index].diffuse_color
        for loop in face.loop_indices:a.data[loop].color=(*[min(1,c*1.15) for c in color[:3]],1)
    m=bpy.data.materials.new(obj.name+'_Unlit');m.use_nodes=True
    n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');v=n.new('ShaderNodeVertexColor');v.layer_name='BakedLight'
    m.node_tree.links.new(v.outputs['Color'],out.inputs['Surface'])
    obj.data.materials.clear();obj.data.materials.append(m)
    for face in obj.data.polygons:face.material_index=0

def bake_ground(obj, size=2048):
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.00035 if size>2048 else .0006)
    bpy.ops.object.mode_set(mode='OBJECT')
    img=bpy.data.images.new(obj.name+' baked light',width=size,height=size)
    for slot in obj.material_slots:
        nt=slot.material.node_tree; node=nt.nodes.new('ShaderNodeTexImage'); node.image=img; nt.nodes.active=node
    scene.render.bake.target='IMAGE_TEXTURES'; scene.render.bake.margin=2
    bpy.ops.object.bake(type='DIFFUSE')
    img.filepath_raw=str(OUT/(obj.name+'-light.png')); img.file_format='PNG'; img.save()
    m=bpy.data.materials.new(obj.name+'_Baked'); m.use_nodes=True
    n=m.node_tree.nodes; n.clear(); output=n.new('ShaderNodeOutputMaterial'); tex=n.new('ShaderNodeTexImage'); tex.image=img
    m.node_tree.links.new(tex.outputs['Color'],output.inputs['Surface'])
    obj.data.materials.clear(); obj.data.materials.append(m)
    for p in obj.data.polygons: p.material_index=0

cam_data=bpy.data.cameras.new('Hero camera'); cam=bpy.data.objects.new('Hero camera',cam_data)
bpy.context.collection.objects.link(cam); scene.camera=cam
target=Vector((0,0,0)); cam.location=(8,-60,52)
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam_data.type='ORTHO'; cam_data.ortho_scale=59
scene.render.resolution_x=1800; scene.render.resolution_y=1125; scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
scene.render.image_settings.file_format='PNG'; scene.render.film_transparent=True
if '--preview' in sys.argv:
    scene.cycles.samples=16
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'composition-source.blend'))
    scene.render.filepath=str(OUT/'composition.png')
    bpy.ops.render.render(write_still=True)
    print('COMPOSITION PREVIEW COMPLETE',flush=True)
    sys.exit(0)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'pune-source.blend'))
print('BAKING GROUND',flush=True)
for o in TEMPLATES: o.hide_render=True
bake_ground(ground)
flat_vertices(paint)
print('BAKING ARCHITECTURE',flush=True)
bake_ground(city,8192)
for o in TEMPLATES: o.hide_render=False
for i,o in enumerate(TEMPLATES):
    print('BAKING VEHICLE',i,flush=True); bake_vertices(o)

# Camera is intentionally orthographic and matches the diagonal reference view.
scene.render.resolution_x=1800; scene.render.resolution_y=1125; scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
scene.render.image_settings.file_format='PNG'; scene.render.film_transparent=True
scene.render.filepath=str(OUT/'hero.png')

scene['description']='Review 2 — Camp-inspired Pune neighbourhood. Illustrative geography.'
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'pune-baked.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'pune-raw.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_extras=True,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
render_script=Path(__file__).with_name('render_views.py')
exec(compile(render_script.read_text(),str(render_script),'exec'))
mobile_script=Path(__file__).with_name('export_mobile.py')
exec(compile(mobile_script.read_text(),str(mobile_script),'exec'))

metadata={'anchors':anchors,'traffic':[{'name':o.name,'direction':d,'start':x} for o,d,x in traffic],
          'route':{'points':main,'length':route_length,'laneOffset':.58},
          'camera':{'position':[8,52,60],'target':[0,0,0],'span':59},
          'vehicleCount':len(TEMPLATES),'buildingPlots':len(FOOTPRINTS),'trees':len(tree_positions),
          'sourcePolygons':sum(len(o.data.polygons) for o in [city,ground]+TEMPLATES),
          'blender':bpy.app.version_string,'seed':41}
(OUT/'scene.json').write_text(json.dumps(metadata,indent=2))
print('BUILD COMPLETE',flush=True)
