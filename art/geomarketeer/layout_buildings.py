"""Individually placed masses, with reusable authored residential details."""
def residence(name,x,y,w,d,floors,color,variant=0):
    start=len(STATIC)
    style=variant%12
    pitched=style in [0,7] and floors<3
    h=building(name,x,y,w,d,floors,color,style not in [0,3,6,7,11],pitched,style)
    if style in [1,8] and not pitched:
        # Terraced upper floor, instead of every mass ending in the same box.
        box('Terraced penthouse',x+w*.18,y+d*.18,h+.8,w*.6,d*.55,1.0,P[color],.025)
        box('Penthouse roof',x+w*.18,y+d*.18,h+1.34,w*.64,d*.59,.12,P['white'],.02)
        window(x+w*.18,y-d*.095,h+.82,w*.35,.5)
    if style in [2,6]:
        # Vertical bay and projecting shades give older Camp residences a different silhouette.
        box('Projecting stair bay',x-w*.38,y-d*.48,h*.5,w*.23,.4,h*.93,P['ochre'],.02)
        for z in [i*.91+.65 for i in range(floors)]:
            window(x-w*.38,y-d*.7,z,w*.15,.45)
    if style in [5,10] and not pitched:
        for k in range(3):
            box('Terrace pergola',x+w*.12,y-.3+k*.23,h+.88,w*.65,.07,.09,P['white'],.01)
        for xx in [x-w*.18,x+w*.42]:box('Pergola column',xx,y-.07,h+.53,.065,.5,.7,P['ivory'])
    if style in [3,11] and not name.startswith('Cafe'):
        # Camp's mixed-use streets: a recessed shop with a deep chajja below homes.
        front=y-d/2
        box('Shopfront timber fascia',x,front-.09,.95,w*.92,.13,.19,P['teal'] if style==3 else P['roof'],.01)
        box('Shop entrance glazing',x,front-.045,.44,w*.65,.04,.72,P['glassDark'])
        box('Deep shop chajja',x,front-.29,1.10,w+.14,.68,.11,P['ivory'],.025)
        for xx in [x-w*.35,x+w*.35]:box('Shopfront pier',xx,front-.08,.48,.10,.14,.85,P['white'])
    if style==4:
        # A wraparound corner screen breaks the otherwise straight frontage rhythm.
        for fl in range(1,floors):
            box('Corner balcony return',x+w*.51,y-d*.20,.65+fl*.91,.13,d*.6,.40,P['cream'],.02)
        box('Corner vertical blade',x+w*.48,y-d*.49,h*.52,.16,.27,h*.97,P['white'],.02)
    if style==6:
        for z in [h*.55,h*.55+.14,h+.28]:
            box('Deco horizontal band',x,y-d*.51,z,w+.22,.16,.065,P['white'],.018)
        box('Deco raised parapet',x-w*.25,y-d*.46,h+.42,w*.32,.20,.45,P[color],.035)
    if style==9:
        for xx in [x-w*.39,x+w*.39]:
            box('Sunshade vertical fin',xx,y-d*.5-.14,h*.58,.10,.38,h*.78,P['white'],.02)
    if style in [0,7]:
        # Painted shutters for older homes rather than another apartment façade.
        for fl in range(floors):
            for xx in [x-w*.27,x+w*.27]:
                for side in [-1,1]:
                    box('Wooden shutter',xx+side*.29,y-d*.5-.08,.65+fl*.91,.13,.065,.57,P['teal'],.012)
    # Compound edge and an entrance break. These make blocks read as individual plots.
    for xx in [x-w/2-.23,x+w/2+.23]:
        box('Residential boundary',xx,y,.28,.11,d+.45,.48,P['cream'],.018)
    box('Rear compound wall',x,y+d/2+.23,.28,w+.55,.12,.48,P['cream'],.018)
    # Keep the authoring scene responsive as well as the exported browser scene.
    assembled=join(STATIC[start:],name)
    angle=math.radians([-5,0,4,0,0,7][variant%6]) if not name.startswith('Cafe') else 0
    assembled.matrix_world=Matrix.Translation((x,y,0)) @ Matrix.Rotation(angle,4,'Z') @ Matrix.Translation((-x,-y,0)) @ assembled.matrix_world
    STATIC[start:]=[assembled]
    print('ASSEMBLED',name,flush=True)
    return h

# Curated positions. Left/right street relationships mirror the reference;
# architectural designs remain illustrative, rather than claims of surveyed buildings.
plots=[
 (-19,16,2.5,2.7,2),(-15.8,16.8,2.6,2.3,3),(-12.3,17,2.8,2.9,3),(-8.5,16.3,2.7,2.8,2),
 (-5,17,2.5,2.4,1),(3.7,16.9,2.4,3,4),(8.3,17,2,2.9,3),(13,17.3,2.2,2.3,4),(16,17.5,2.2,2.2,2),(20,17.3,2.6,2.4,3),(23,17,2,2.3,2),
 (-17.2,12.1,2.7,2.4,2),(-13.6,11.8,2.9,2.2,1),(-9.8,11.7,2.7,2.2,2),(-6.2,12.2,2.4,2.6,2),(3.8,10,2,2.7,2),
 (-22.3,6.2,2.8,2.5,3),(-22.5,3.2,2.5,2.2,2),(-15.5,5.7,2.5,2.5,2),(-11.9,4.8,2.8,2.5,3),(-8.3,4.4,2.5,2.4,2),
 (-21.9,-2.5,3.2,2.5,2),(-21.5,-5.5,2.6,2.2,1),(-18.9,-3.4,1.8,2.5,2),(-14.5,-2.4,2.1,2.5,2),(-7,-2.7,2,2.7,2),
 (-12.4,-9.6,2.2,2.1,3),
 (-22.4,-15.5,3.1,2.4,2),(-18.6,-16.2,2.9,2.7,3),(-11.8,-15.8,2.6,2.6,3),(-8.5,-15.9,2.7,2.6,2),(-4.9,-16,2.4,2.7,3),
 (1.5,-9,2.6,2.5,3),(5.1,-9.2,2.7,2.5,3),(8,-9.5,2,2.5,2),
 (1.8,-13,2.5,2.5,3),(5.2,-13,2.8,2.6,2),(8.2,-13.3,2,2.5,3),
 (2.4,-16.7,2.7,2.4,2),(6,-16.7,2.7,2.4,3),(8.8,-17,1.7,2.2,2),
 (8.5,2.4,2.3,2.5,3),(11.5,2,2,2.1,2),(14.4,1.1,2.1,2.1,2),(17.2,.5,2,2,3),(21.7,.0,2.8,2.3,2),
 (8,-3.1,2.1,2.4,2),(11.1,-3.7,2.4,2.1,2),(14.4,-4.5,2.5,2.6,3),(21.4,-5.7,3,2.5,2),
 (15.1,-9,2.4,2.6,3),(22,-9.2,2.8,2.5,3),(15.5,-13.1,2.4,2.7,2),(22.5,-13,2.4,2.7,3),
 (15.4,-17,2.8,2.4,3),(22.4,-17,2.8,2.4,2),
]
for i,(x,y,w,d,f) in enumerate(plots):
    residence('Camp residence %02d'%i,x,y,w,d,f,['ivory','cream','peach','cream','ivory','ochre'][i%6],i)

# The broad commercial volume is a compositional anchor, not a narrow office tower.
FOOTPRINTS.append((17,12,4.3,4.1))
FOOTPRINTS.extend([(11.7,12,.8,3.7),(22,11,.8,3.3)])
box('Mall main mass',17,12,2.35,8.4,7.8,4.7,P['ivory'],.05)
box('Mall roof cornice',17,12,4.77,8.65,8.05,.18,P['white'],.035)
box('Mall inset flat roof',17,12,4.88,8.1,7.5,.09,P['terrace'])
for xx in [12.77,21.23]:box('Mall parapet',xx,12,5.04,.13,7.9,.35,P['ivory'],.015)
for yy in [8.04,15.96]:box('Mall parapet',17,yy,5.04,8.5,.13,.35,P['ivory'],.015)
for x,y,w,d,h in [(15,13.8,2.8,2.9,.7),(19.6,13.5,1.4,1.5,.8),(18,10.8,1,1,.5)]:
    box('Mall rooftop service room',x,y,4.95+h/2,w,d,h,P['cream'],.03)
    box('Mall plant room cap',x,y,4.98+h,w+.12,d+.12,.1,P['white'])
box('Mall blue glass entrance',16.7,8.07,2.6,4.5,.05,3.8,P['glass'])
for x in [14.45+i*.55 for i in range(9)]:box('Mall glazing mullion',x,8.025,2.6,.035,.045,3.8,P['white'])
for z in [1,1.7,2.4,3.1,3.8,4.5]:box('Mall glazing transom',16.7,8.01,z,4.5,.05,.035,P['white'])
for x in [13.7,19.8,20.6]:
    for z in [1,2,3,4]:box('Mall side window',x,8.04,z,.5,.03,.63,P['glass'])
for yy in [9+i*.9 for i in range(7)]:
    box('Mall side glazing',21.21,yy,2.7,.03,.66,3.2,P['glass'])
box('Mall entrance canopy',16.7,7.69,.9,4.7,.9,.11,P['white'],.025)
# Parking surfaces and marked individual bays remain readable around the large block.
MODE=GROUND
box('Mall west parking',11.7,12,.07,1.3,7,.03,P['road'])
box('Mall east parking',22,11,.07,1.2,6,.03,P['road'])
for x in [11.7,22]:
    for y in [8+i*.95 for i in range(8)]:box('Parking bay line',x,y,.09,1.05,.025,.01,P['line'])
MODE=STATIC

def cafe(x,y,label,primary):
    residence('Cafe '+label,x,y,3.0,1.55,1,'ochre',3)
    fy=y-.79
    box('Cafe fascia',x,fy-.08,.99,3.03,.18,.32,P['teal'],.015)
    sign(label,x,fy-.181,.94,.15,P['ivory'])
    for xx in [x-.94,x,x+.94]:
        box('Shopfront glazing',xx,fy-.015,.46,.78,.06,.74,P['glassDark'])
        box('Shopfront divider',xx+.40,fy-.07,.47,.055,.08,.82,P['white'])
    for i in range(12):
        o=box('Canvas awning stripe',x-1.38+i*.25,fy-.38,1.25,.25,.75,.045,P['ivory'] if i%2 else P['awning']);o.rotation_euler.x=.16
    if primary:
        box('Lease sign',x+.9,fy-.095,.55,.51,.035,.30,P['ivory'],.01)
        sign('FOR LEASE',x+.9,fy-.12,.52,.07,P['teal'])
    for xx in [x-1.2,x+1.2]:
        cylinder('Cafe planter',xx,fy-.62,.2,.17,.32,P['roof'],8,.22)
        cylinder('Clipped shrub',xx,fy-.62,.46,.25,.35,P['leaf2'],8,.16)
cafe(16,6.7,'CORNER COFFEE',True)
cafe(-8,-8.7,'THE LITTLE CUP',False)

# A warm, low bungalow beside the north open ground breaks the apartment rhythm.
residence('Camp garden bungalow',-5.5,10.8,2.8,2.1,1,'peach',7)
