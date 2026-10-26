"""Keep the quieter candidate's south-facing frontage legible from review angles.

Runs after static assembly. Can also repair the unbaked source using
--repair-source, without changing streets, buildings or other materials.
"""
import bpy
import bmesh
import sys
from mathutils import Vector

obj=bpy.data.objects['Pune_Architecture']
data=obj.data
parents=list(range(len(data.vertices)))
def find_component(i):
    while parents[i]!=i:
        parents[i]=parents[parents[i]];i=parents[i]
    return i
for e in data.edges:
    a,b=map(find_component,e.vertices)
    if a!=b:parents[b]=a
groups={}
for v in data.vertices:groups.setdefault(find_component(v.index),[]).append(v.index)
vegetation=set()
for face in data.polygons:
    name=data.materials[face.material_index].name
    if name.startswith(('leaf','trunk')):vegetation.add(find_component(face.vertices[0]))
remove=set()
for key in vegetation:
    ids=groups[key]
    center=obj.matrix_world @ (sum((data.vertices[i].co for i in ids),Vector())/len(ids))
    if -10.5<center.x<-5.5 and -12.1<center.y<-9.45:
        remove.update(ids)
bm=bmesh.new();bm.from_mesh(data);bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm,geom=[bm.verts[i] for i in remove],context='VERTS')
bm.to_mesh(data);bm.free();data.update()
print('Cleared café sightline:',len(remove),'vegetation vertices',flush=True)
if '--repair-source' in sys.argv:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
