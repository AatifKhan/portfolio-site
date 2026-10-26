"""Isolate ground self-shadowing in the quick composition preview."""
import bpy
from pathlib import Path
scene=bpy.context.scene
for name in ['Pune_Ground','Pune_RoadPaint']:
    bpy.data.objects[name].visible_shadow=False
scene.render.resolution_x=1800
scene.render.resolution_y=1125
scene.render.filepath=str(Path(__file__).resolve().parents[2]/'assets/portfolio/geomarketeer/review-2/ground-check.png')
bpy.ops.render.render(write_still=True)
