"""Composition derived visually from the approved illustration; Blender builder include."""
MODE=GROUND
box('Bevelled sandstone island',0,0,-.58,50,38,1.1,P['sand'],.18)
box('Ground surface',0,0,-.035,49.85,37.85,.08,P['ground'])

def smooth(points,steps=8):
    out=[]
    for i in range(len(points)-1):
        p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(i+2,len(points)-1)])
        for j in range(steps):
            t=j/steps
            p=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)
            out.append(tuple(p))
    out.append(points[-1]);return out

main=smooth([(-23,18.9),(-22.8,15),(-21.6,11.5),(-18,9.3),(-12,8.3),(-5,7.8),(2,6.8),(10,5.5),(18,4.1),(24.9,2.8)])
left=smooth([(-5.2,7.8),(-5.6,5.2),(-4.8,1.8),(-4.4,-2.8),(-5,-6.5),(-3.9,-10),(-2.2,-14),(-.8,-18.9)])
right=smooth([(6.6,18.9),(6.5,13),(6.6,6.2),(5.6,1.8),(5,-2),(5.5,-5),(9,-6.5),(11.8,-10.5),(12,-14),(11,-18.9)])
south=smooth([(-24.9,-8),(-18,-7.2),(-11,-7.2),(-5,-6.5),(1,-5.8),(5.5,-5)])
roads=[('Main road',main,2.45),('Synagogue west lane',left,1.15),('Synagogue east lane',right,1.4),('Residential spine',south,1.1),
 ('West street',smooth([(-18.5,9.5),(-18,4),(-17,0),(-16,-7),(-15,-12),(-15,-18.9)]),.95),
 ('Garden lane',smooth([(-24.9,1),(-20,1),(-15,0),(-10,-1),(-4.8,-1)]),.9),
 ('South west lane',smooth([(-24.9,-13),(-18,-13),(-11,-12),(-3.2,-12)]),.85),
 ('East market lane',smooth([(5.2,0),(11,-1),(18,-2),(24.9,-3)]),.95),
 ('Eastern residential lane',smooth([(18,-2),(18,-7),(19,-12),(19,-18.9)]),1),
 ('Mall service lane',smooth([(10,18.9),(10,13),(11,7),(12,5.1)]),.85)]

def sample_path(points,distance):
    for a,b in zip(points,points[1:]):
        a=Vector(a);b=Vector(b);length=(b-a).length
        if distance<=length:
            t=(b-a).normalized();p=a+t*distance
            return p,t
        distance-=length
    return Vector(points[-1]),(Vector(points[-1])-Vector(points[-2])).normalized()

route_length=sum((Vector(b)-Vector(a)).length for a,b in zip(main,main[1:]))
for ri,(name,path,w) in enumerate(roads):
    strip(name+' footpaths',path,w+.46,.025,P['pavement'])
    # Roads all above footpaths, so intersecting roads do not get a pavement stripe.
    strip(name,path,w,.052+ri*.0003,P['road'])
    if ri<4:
        length=sum((Vector(b)-Vector(a)).length for a,b in zip(path,path[1:]))
        for j in range(int(length/1.3)):
            p,t=sample_path(path,j*1.3+.3)
            o=box('Road centre dash',p.x,p.y,.065,.42,.04,.008,P['line']);o.rotation_euler.z=math.atan2(t.y,t.x)
    if ri==0:
        for side in [-1,1]:
            edge=[]
            for j,p in enumerate(path):
                t=(Vector(path[min(j+1,len(path)-1)])-Vector(path[max(j-1,0)])).normalized()
                edge.append((p[0]-t.y*side*(w/2-.04),p[1]+t.x*side*(w/2-.04)))
            strip('Main yellow edge line',edge,.035,.066,P['yellow'])
for distance in [20.3,32.0,40.5]:
    p,t=sample_path(main,distance)
    for j in range(9):
        q=p+Vector((-t.y,t.x))*(-1.03+j*.25)
        o=box('Zebra crossing',q.x,q.y,.071,.66,.14,.009,P['line']);o.rotation_euler.z=math.atan2(t.y,t.x)
poly('Synagogue garden',[(-3.6,-4),(3.8,-4),(4.5,4.9),(-3.4,5.8)],.073,P['lawn'])
poly('Synagogue front path',[(1.5,-4),(3,-4),(3,1),(1.5,1)],.078,P['pavement'])
lawns=[(-.5,13,7.3,5.6),(-11,-3.9,6.8,4),(-21.7,-9.8,4,3.2)]
for x,y,w,d in lawns:
    box('Neighbourhood open ground',x,y,.048,w,d,.02,P['lawn'])
    # Sparse worn earth patches retain the open-ground silhouette in the reference.
    for j in range(15):
        xx=x+random.uniform(-w*.43,w*.43);yy=y+random.uniform(-d*.42,d*.42)
        cylinder('Dry grass patch',xx,yy,.064,random.uniform(.12,.45),.012,P['soil'],7)

def road_clear(x,y,margin):
    p=Vector((x,y))
    for _,path,w in roads:
        for a,b in zip(path,path[1:]):
            a=Vector(a);v=Vector(b)-a
            t=max(0,min(1,(p-a).dot(v)/v.length_squared))
            if (p-(a+t*v)).length<w/2+margin:return False
    return True

MODE=STATIC
FOOTPRINTS.append((.3,.5,3.8,4.7))
