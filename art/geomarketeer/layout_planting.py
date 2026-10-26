"""Grounded planting in the leftover spaces, keeping every road and footprint clear."""
def planting_clear(x,y):
    if not road_clear(x,y,.48):return False
    if any(abs(x-a)<w+.22 and abs(y-b)<d+.22 for a,b,w,d in FOOTPRINTS):return False
    if any(abs(x-a)<w/2-.3 and abs(y-b)<d/2-.3 for a,b,w,d in lawns):return False
    if any((x-a)**2+(y-b)**2<.8**2 for a,b in tree_positions):return False
    return True

# Reproducible planting is constrained by authored lots and streets, not random scattering over geometry.
for attempt in range(3200):
    if len(tree_positions)>=240:break
    x=random.uniform(-24.4,24.4);y=random.uniform(-18.4,18.4)
    if planting_clear(x,y):
        tree_positions.append((x,y))
        if len(tree_positions)%9==0:palm(x,y,random.uniform(.8,1.1))
        else:tree(x,y,random.uniform(.72,1.14))
for x,y in [(-3.2,4.5),(3.5,-2.4),(13,7.5),(20,6.3),(-10,13.5),(3,15.5)]:palm(x,y,.85)
print('PLACED',len(FOOTPRINTS),'building plots;',len(tree_positions),'trees',flush=True)
