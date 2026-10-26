"""Apply the hero-facing tower detail to an existing unbaked source, then rebake."""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parents[2]/'assets/portfolio/geomarketeer/review-1'
source=Path(__file__).with_name('build_scene.py').read_text()
P={m.name:m for m in bpy.data.materials};STATIC=[];MODE=STATIC
exec(source[source.index('def mesh'):source.index('# Reference-registered')])
exec(source[source.index('def arch'):source.index('for y in [-1.0')])
exec(compile(Path(__file__).with_name('landmark_facades.py').read_text(),'landmark_facades.py','exec'))
join([bpy.data.objects['Pune_Architecture']]+STATIC,'Pune_Architecture')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'pune-source.blend'))
exec(compile(Path(__file__).with_name('rebake.py').read_text(),'rebake.py','exec'))
