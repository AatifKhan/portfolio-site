"""Render evidence and view-matched static fallbacks from the baked Blender file."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

OUT=Path(__file__).resolve().parents[2]/'assets/portfolio/geomarketeer/review-2'
scene=bpy.context.scene
scene.view_settings.view_transform='Standard'
cam=scene.camera
if bpy.data.filepath.endswith('pune-baked.blend'):
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
views=[('hero',(0,0,0),59,0),('left',(0,0,0),59,-14),('right',(0,0,0),59,14),
       ('detail',(.7,.5,1.4),17,0),('cafe',(16,7.5,1.1),17,0),('homes',(-9,-10,1.5),19,0),
       ('alternative',(-8,-8.7,1.1),17,0)]
for name,point,span,degrees in views:
    target=Vector(point);a=math.radians(degrees)
    v=Vector((8,-60,52))
    cam.location=target+Vector((v.x*math.cos(a)-v.y*math.sin(a),v.x*math.sin(a)+v.y*math.cos(a),v.z))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=span
    scene.render.filepath=str(OUT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
