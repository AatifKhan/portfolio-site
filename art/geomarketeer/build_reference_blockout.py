"""Image-space massing study. Does not modify Review 2 or its source files.

Run: Blender --background --python art/geomarketeer/build_reference_blockout.py
Roof envelopes are manually observed; height, hidden ground and rear faces are inferred.
Perspective is a diagnostic proposal, NOT a change to the production camera contract.
"""
import bpy, json, math
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/portfolio/geomarketeer/reference-blockout'
OUT.mkdir(parents=True, exist_ok=True)
data = json.loads(Path(__file__).with_name('reference-blockout.json').read_text())
W,H = data['imageSize']
observed = np.array(data['islandCorners'], dtype=float)
world = np.array([[-25,19,0],[25,19,0],[25,-19,0],[-25,-19,0]],dtype=float)

def basis(q):
    a,e=q[:2]
    return (np.array([math.cos(a),math.sin(a),0]),
            np.array([-math.sin(a)*math.sin(e),math.cos(a)*math.sin(e),math.cos(e)]),
            np.array([math.sin(a)*math.cos(e),-math.cos(a)*math.cos(e),math.sin(e)]))

def project(points,q,perspective=True):
    r,u,n=basis(q)
    den=q[2]-points@n if perspective else np.ones(len(points))*q[2]
    return np.column_stack((q[4]+q[3]*(points@r)/den,q[5]-q[3]*(points@u)/den))

def fit(perspective):
    q=np.array([.04,.72,170.,4700.,836.,460.])
    damping=.01
    for _ in range(500):
        error=(project(world,q,perspective)-observed).ravel()
        jac=np.zeros((8,6))
        for i in range(6):
            step=1e-5*max(abs(q[i]),1)
            v=q.copy();v[i]+=step
            jac[:,i]=(project(world,v,perspective)-project(world,q,perspective)).ravel()/step
        normal=jac.T@jac
        delta=np.linalg.solve(normal+damping*np.diag(np.maximum(np.diag(normal),1e-9)), -jac.T@error)
        cand=q+delta
        if not (.2<cand[1]<1.4 and 40<cand[2]<2000 and 100<cand[3]<60000):
            damping*=5;continue
        if np.sum((project(world,cand,perspective)-observed)**2)<error@error:
            q=cand;damping=max(1e-10,damping*.5)
            if np.linalg.norm(delta)<1e-7:break
        else:damping=min(1e10,damping*5)
    return q

q=fit(True);oq=fit(False)
r,u,n=basis(q)
def unproject(pixel,z=0):
    x=(pixel[0]-q[4])/q[3]; y=(q[5]-pixel[1])/q[3]
    A=np.array([r+x*n,u+y*n])
    xy=np.linalg.solve(A[:,:2],np.array([x*q[2],y*q[2]])-A[:,2]*z)
    return (float(xy[0]),float(xy[1]),float(z))

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=.85
    return m
clay=material('Neutral clay',(.62,.65,.66));landmark=material('Landmark clay',(.47,.51,.53))
road=material('Road mass',(.20,.23,.25));ground=material('Island',(.76,.76,.73));garden=material('Open ground',(.55,.60,.56))
def mesh(name,verts,faces,mat):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(mat)
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
    return o
def prism(name,pts,bottom,top,mat):
    nn=len(pts);verts=[(x,y,z) for z in [bottom,top] for x,y in pts]
    faces=[tuple(reversed(range(nn))),tuple(range(nn,nn*2))]+[(i,(i+1)%nn,(i+1)%nn+nn,i+nn) for i in range(nn)]
    return mesh(name,verts,faces,mat)

prism('Island with observed cut corner',[unproject(p)[:2] for p in data['islandOutline']],-1.15,0,ground)
for g in data['grounds']:
    p=[unproject(v,.012) for v in g['points']]
    mesh(g['id']+' '+g['name'],p,[tuple(range(len(p)))],garden)
for road_index,road_item in enumerate(data['roadPolygons']):
    p=[unproject(v,.025+road_index*.002) for v in road_item['points']]
    road_obj=mesh(road_item['id']+' '+road_item['name'],p,[tuple(range(len(p)))],road)
    road_obj.visible_shadow=False

records=[]
for item in data['roofs']:
    id,label,x,y,w,d,skew,slope,drop,floors,form,confidence=item
    pixels=[[x,y],[x+w,y+slope],[x+w+skew,y+slope+d],[x+skew,y+d]]
    if id=='N07':
        pixels=[[716,155],[738,157],[732,169],[733,180],[751,188],[785,189],[798,181],[815,186],[824,200],[820,214],[804,221],[785,213],[753,219],[730,209],[715,194],[707,178]]
    center=np.mean(pixels,axis=0)
    # Infer height from manually observed facade drop at the roof centroid.
    base=np.array(unproject(center));p1=project(np.array([base,base+[0,0,1]]),q)
    height=float(drop/abs(p1[1,1]-p1[0,1]))
    top=[unproject(p,height) for p in pixels]
    m=landmark if id.startswith(('L','M')) else clay
    o=prism(id+' '+label,[(p[0],p[1]) for p in top],0,height,m)
    o['reference_id']=id;o['confidence']=confidence;o['height_inferred']=True;o['roof_form']=form
    if form=='tower':
        apex=np.mean(top,axis=0);apex[2]+=.95
        mesh(id+' tower roof silhouette',[*top,tuple(apex)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],m)
    # This pass only models major roof silhouettes; no windows or decorative details.
    if form in ['gable','hip']:
        a,b,c,dv=map(np.array,top)
        rise=min(.6,height*.22)
        ridge1=(a+dv)/2+[0,0,rise];ridge2=(b+c)/2+[0,0,rise]
        if form=='hip':
            mid=(ridge1+ridge2)/2;ridge1=mid+(ridge1-mid)*.65;ridge2=mid+(ridge2-mid)*.65
        mesh(id+' roof silhouette',[*top,tuple(ridge1),tuple(ridge2)],[(0,1,5,4),(3,4,5,2),(0,4,3),(1,2,5)],m)
    records.append({'id':id,'label':label,'zone':id[0],'roofPixels':pixels,'height':round(height,3),'storeysInferred':floors,'form':form,'confidence':confidence,'center':[float(v) for v in center]})

scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=W;scene.render.resolution_y=H;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.world.color=(.7,.7,.7)
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.82,.83,.82,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.8
ld=bpy.data.lights.new('Large softbox','AREA');ld.energy=4500;ld.size=24
lo=bpy.data.objects.new('Large softbox',ld);bpy.context.collection.objects.link(lo);lo.location=(-18,-20,45)
lo.rotation_euler=(-lo.location).to_track_quat('-Z','Y').to_euler()
scene.view_settings.view_transform='Standard'
def camera(name,values,perspective):
    camdata=bpy.data.cameras.new(name);cam=bpy.data.objects.new(name,camdata);bpy.context.collection.objects.link(cam)
    rr,uu,nn=basis(values);cam.location=tuple(nn*values[2]);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler()
    camdata.type='PERSP' if perspective else 'ORTHO';camdata.sensor_width=36;camdata.sensor_fit='HORIZONTAL'
    camdata.lens=float(values[3]*36/W);camdata.ortho_scale=float(W*values[2]/values[3])
    camdata.shift_x=float((W/2-values[4])/W);camdata.shift_y=float((values[5]-H/2)/W)
    camdata.clip_end=3000
    return cam
hero=camera('Diagnostic perspective fit',q,True);ortho=camera('Orthographic contract comparison',oq,False)
scene.camera=hero
scene['scope']='Grey massing checkpoint only. Perspective is a proposal; production remains orthographic.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'reference-blockout.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'reference-blockout.glb'),export_format='GLB',export_cameras=True,export_lights=False,export_extras=True)
def fit_report(values,perspective):
    predicted=project(world,values,perspective);errors=np.linalg.norm(predicted-observed,axis=1)
    return {'parameters':values.tolist(),'predictedCorners':predicted.tolist(),'cornerErrorsPixels':errors.tolist(),'rmsCornerPixels':float(np.sqrt(np.mean(errors**2)))}
report={'source':data['source'],'width':W,'height':H,'islandOutline':data['islandOutline'],'buildings':records,'roads':data['roadPolygons'],'grounds':data['grounds'],'zones':data['zones'],
        'perspective':fit_report(q,True),'orthographic':fit_report(oq,False),
        'warning':'Camera fitting uses a rectangular hypothesis against four selected boundary landmarks, including the cut corner. The source is not a consistent rectangle. The five-point island outline is separately traced and back-projected. Fit error is NOT a fidelity score or independent validation. Roof geometry is back-projected from traced envelopes; hidden geometry and heights require review.'}
(OUT/'inventory.json').write_text(json.dumps(report,indent=2))
for name,cam in [('grey-perspective',hero),('grey-orthographic',ortho)]:
    scene.camera=cam;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('BLOCKOUT_READY',len(records),json.dumps(report['perspective']),flush=True)
