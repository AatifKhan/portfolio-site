"""Rebake an existing editable source without rebuilding the neighbourhood."""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/portfolio/geomarketeer/review-2'
source=Path(__file__).with_name('build_scene.py').read_text()
scene=bpy.context.scene
exec(source[source.index('def bake_vertices'):source.index("cam_data=bpy.data.cameras.new")])
vehicles=[o for o in scene.objects if o.name.startswith('Traffic_')]
for o in vehicles:o.hide_render=True
bake_ground(bpy.data.objects['Pune_Ground'])
flat_vertices(bpy.data.objects['Pune_RoadPaint'])
bake_ground(bpy.data.objects['Pune_Architecture'],8192)
for o in vehicles:o.hide_render=False;bake_vertices(o)
scene.render.resolution_x=1800;scene.render.resolution_y=1125;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard';scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'pune-baked.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'pune-raw.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_extras=True,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
exec(compile(Path(__file__).with_name('render_views.py').read_text(),'render_views.py','exec'))
exec(compile(Path(__file__).with_name('export_mobile.py').read_text(),'export_mobile.py','exec'))
