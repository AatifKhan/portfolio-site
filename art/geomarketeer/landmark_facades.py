"""The tower face toward the hero camera needs its own windows and clock."""
cx,fy=2.15,.738
for xx in [cx-.23,cx+.23]:
    arch(xx,fy,4.78,.30,.65,P['trim'])
    arch(xx,fy-.012,4.83,.19,.51,P['shadow'])
    arch(xx,fy,1.0,.30,1.1,P['trim'])
    arch(xx,fy-.012,1.08,.19,.91,P['shadow'])
for name,r,m,depth in [('Clock hero rim',.29,P['trim'],.023),('Clock hero dial',.235,P['ivory'],.045)]:
    o=cylinder(name,0,0,0,r,.035,m,32);o.rotation_euler.x=math.pi/2;o.location=(cx,fy-depth,4.16)
for i in range(12):
    a=i*math.tau/12
    o=box('Clock hero hour',cx+math.sin(a)*.194,fy-.075,4.16+math.cos(a)*.194,.018,.012,.044,P['shadow']);o.rotation_euler.y=a
beam('Clock hero hour hand',(cx,fy-.085,4.16),(cx-.09,fy-.085,4.22),.012,P['shadow'])
beam('Clock hero minute hand',(cx,fy-.085,4.16),(cx+.035,fy-.085,4.32),.009,P['shadow'])
