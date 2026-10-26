"""Authored detail-based mobile LOD, preserving landmark and major silhouettes.

The batched architectural mesh consists of disconnected modeled components.
Remove only sub-pixel narrow components (railings, mullions, tiny AC grilles),
not a global collapse that changes roofs, walls or landmark proportions.
"""
import bpy
import bmesh
from pathlib import Path
OUT=Path(__file__).resolve().parents[2]/'assets/portfolio/geomarketeer/review-2'
obj=bpy.data.objects['Pune_Architecture'];mesh_data=obj.data
parents=list(range(len(mesh_data.vertices)))
def root(i):
    while parents[i]!=i:
        parents[i]=parents[parents[i]];i=parents[i]
    return i
for edge in mesh_data.edges:
    a,b=map(root,edge.vertices)
    if a!=b:parents[b]=a
groups={}
for v in mesh_data.vertices:groups.setdefault(root(v.index),[]).append(v.index)
remove=set()
for indices in groups.values():
    lo=[min(mesh_data.vertices[i].co[k] for i in indices) for k in range(3)]
    hi=[max(mesh_data.vertices[i].co[k] for i in indices) for k in range(3)]
    dims=sorted(hi[k]-lo[k] for k in range(3))
    from mathutils import Vector
    center=obj.matrix_world @ Vector([(lo[k]+hi[k])/2 for k in range(3)])
    landmark=-2.5<center.x<3.7 and -2.1<center.y<2.4 and center.z>.6
    if not landmark and ((dims[1]<.24 and dims[2]<5) or (dims[2]<.24)):
        remove.update(indices)
bm=bmesh.new();bm.from_mesh(mesh_data);bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm,geom=[bm.verts[i] for i in remove],context='VERTS')
bm.to_mesh(mesh_data);bm.free();mesh_data.update()
print('MOBILE LOD removed',len(remove),'vertices from',len(groups),'components',flush=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'pune-mobile-raw.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_extras=True,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
