"""Correct the first Review 2 source export without rebuilding its placements.

The main authoring function also contains this fix, so clean rebuilds agree.
Run only against the unbaked Review 2 source.
"""
import bpy
from mathutils import Vector
obj=bpy.data.objects['Pune_Architecture']
fixed=0
for face in obj.data.polygons:
    if len(face.vertices)!=7:continue
    world=obj.matrix_world @ face.center
    normal=obj.matrix_world.to_3x3() @ face.normal
    if -1.86<world.y<-1.78 and -2<world.x<4 and .6<world.z<2.5 and normal.y>.9:
        face.flip();fixed+=1
obj.data.update()
print('Corrected hero-facing lancet normals:',fixed,flush=True)
assert fixed==8, 'Unexpected landmark face count; inspect source before continuing'
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
