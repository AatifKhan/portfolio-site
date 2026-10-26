import * as THREE from '../assets/vendor/three/three.module.js';
import { FontLoader } from '../assets/vendor/three/addons/loaders/FontLoader.js';
import { createCafeBlock } from './geomarketeer-block-model.js';

const PLACES = [
    { id: 'cafe', name: 'Corner café', kind: 'The café', zoom: 2.25, body: 'A striped awning, an open entrance, and a counter behind the glass. Turn the block to inspect both street façades, or look closer at the tables and planting.' },
    { id: 'offices', name: 'Office block', kind: 'The neighbor', zoom: 1.7, body: 'Recessed entrances, rows of windows, rooftop services, and a small planted forecourt. Each side of the building is part of the same scene.' },
    { id: 'garden', name: 'Pocket garden', kind: 'The public realm', zoom: 2.05, body: 'Bent-metal benches, planters, trees, and a place to pause between the office and the café. Small details continue around the block.' },
    { id: 'crossing', name: 'Street life', kind: 'Around the corner', zoom: 1.8, body: 'A slow loop of little cars, walking figures, zebra crossings, and the street edge. Pause the traffic to take a closer look.' },
];

function init(root) {
    const viewport = root.querySelector('.geo-map-viewport');
    const host = root.querySelector('.geo-map-render-target');
    const loading = root.querySelector('.geo-map-loading');
    const error = root.querySelector('.geo-map-error');
    const inspector = root.querySelector('.geo-map-inspector');
    const title = root.querySelector('#geoMapPlaceTitle');
    const kind = root.querySelector('.geo-map-inspector-kind');
    const body = root.querySelector('.geo-map-inspector-body');
    const status = root.querySelector('.geo-map-status');
    const zoomOutput = root.querySelector('.geo-map-zoom');
    const fullscreen = root.querySelector('[data-map-action="fullscreen"]');
    const moveToggle = root.querySelector('[data-map-action="move"]');
    const labelToggle = root.querySelector('[data-map-labels]');
    const trafficToggle = root.querySelector('[data-map-traffic]');
    const interiorButton = root.querySelector('[data-map-action="interior"]');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const pitch = Math.atan(1 / Math.sqrt(2));
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointers = new Map();
    const state = { x: 0, y: 2, z: 0, yaw: Math.PI / 4, zoom: 1, span: 26 };
    const target = { ...state };
    const labels = new Map(PLACES.map(place => [place.id, root.querySelector(`.geo-map-place[data-map-place="${place.id}"]`)]));
    const temp = new THREE.Vector3();
    let renderer, camera, scene, model, framing;
    let selected = null, hovered = null, hoverPoint = null;
    let interiorOpen = false;
    let visible = false, booting = false, failed = false, ready = false;
    let frame = 0, lastTime = 0, motionTime = 0;
    let drag = null, pinch = null, expanded = false;
    let touchTap = null, hadPinch = false;
    let placeholder, previousFocus, previousOverflow = '', background = [];
    let samples = [], sampleTime = 0;
    let targetAspect = 1;
    const clamp = THREE.MathUtils.clamp;

    trafficToggle.checked = !reduce.matches;
    root.dataset.sceneState = 'waiting';

    function setEnabled(enabled) {
        root.querySelectorAll('button[data-map-place], [data-map-action="turn-left"], [data-map-action="turn-right"], [data-map-action="zoom-in"], [data-map-action="zoom-out"]').forEach(button => { button.disabled = !enabled; });
        trafficToggle.disabled = !enabled;
    }
    setEnabled(false);

    function collectFraming() {
        const points = [];
        model.scene.updateMatrixWorld(true);
        model.scene.traverse(object => {
            if (!object.isMesh || object.isLineSegments2 || object.layers.mask !== 1) return;
            const vertices = object.geometry.getAttribute('position');
            for (let i = 0; i < vertices.count; i += 2) {
                temp.fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld);
                points.push(temp.x, temp.y, temp.z);
            }
        });
        framing = new Float32Array(points);
    }

    function frameFor(yaw) {
        const c = Math.cos(yaw), s = Math.sin(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < framing.length; i += 3) {
            const x = c * framing[i] - s * framing[i + 2];
            const y = -s * sp * framing[i] + cp * framing[i + 1] - c * sp * framing[i + 2];
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
        const x = -1 + c * (midX + c), z = -s * (midX + c);
        const y = (midY + sp * (s * x + c * z)) / cp;
        return { x, y, z, span: Math.max(maxY - minY, (maxX - minX) / targetAspect) * 1.09 };
    }

    function updateProjection() {
        if (!ready) return;
        const width = Math.max(1, viewport.clientWidth), height = Math.max(1, viewport.clientHeight);
        const aspect = width / height;
        camera.left = -state.span * aspect / 2;
        camera.right = state.span * aspect / 2;
        camera.top = state.span / 2;
        camera.bottom = -state.span / 2;
        camera.zoom = state.zoom;
        camera.position.set(state.x + Math.sin(state.yaw) * Math.cos(pitch) * 75, state.y + Math.sin(pitch) * 75, state.z + Math.cos(state.yaw) * Math.cos(pitch) * 75);
        camera.lookAt(state.x, state.y, state.z);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        model.materials.resize(width, height, state.span, state.zoom);
        zoomOutput.value = `${Math.round(state.zoom * 100)}%`;
        root.querySelector('[data-map-action="zoom-out"]').disabled = state.zoom <= 1.005;
        root.querySelector('[data-map-action="zoom-in"]').disabled = state.zoom >= 2.595;
        root.dataset.viewAngle = String(Math.round(state.yaw * 180 / Math.PI));
        for (const [id, label] of labels) {
            temp.copy(model.anchors[id]);
            if (id === 'cafe') temp.y = 5.15;
            if (id === 'offices') temp.y = 9.7;
            temp.project(camera);
            const x = (temp.x + 1) / 2 * width, y = (1 - temp.y) / 2 * height;
            label.style.left = `${x}px`;
            label.style.top = `${y}px`;
            label.hidden = x < 22 || x > width - 22 || y < 22 || y > height - 22;
            label.tabIndex = label.hidden ? -1 : 0;
        }
    }

    function resize() {
        if (!ready || !viewport.clientWidth || !viewport.clientHeight) return;
        targetAspect = viewport.clientWidth / viewport.clientHeight;
        renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
        const fit = frameFor(target.yaw);
        target.span = fit.span;
        if (!selected) Object.assign(target, fit);
        Object.assign(state, target);
        updateProjection();
        wake();
    }

    function hitAt(x, y) {
        if (!ready) return null;
        const rect = viewport.getBoundingClientRect();
        raycaster.setFromCamera(new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), camera);
        return raycaster.intersectObjects(model.picks, false)[0]?.object.userData.place || null;
    }

    function updateHover() {
        if (!hoverPoint || drag || pinch) return;
        const id = hitAt(hoverPoint.x, hoverPoint.y);
        hoverPoint = null;
        if (id !== hovered) {
            hovered = id;
            for (const [key, label] of labels) label.classList.toggle('is-hovered', key === id);
            model.materials.highlight(id || selected?.id);
            viewport.style.cursor = id ? 'pointer' : '';
        }
    }

    function wake() {
        if (!ready || frame || !visible || document.hidden) return;
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
    }

    function tick(now) {
        frame = 0;
        if (!visible || document.hidden || !ready) return;
        const elapsed = Math.max(0, now - lastTime);
        if (elapsed < 1000 / 60 - 0.8) { frame = requestAnimationFrame(tick); return; }
        const dt = Math.min(elapsed / 1000, 0.05);
        lastTime = now;
        const blend = reduce.matches || drag || pinch ? 1 : 1 - Math.exp(-dt * 8.5);
        let settling = false;
        for (const key of ['x', 'y', 'z', 'yaw', 'zoom', 'span']) {
            const delta = target[key] - state[key];
            if (Math.abs(delta) > 0.0001) { state[key] += delta * blend; settling = true; }
            else state[key] = target[key];
        }
        if (trafficToggle.checked) motionTime += dt;
        model.update(motionTime, true);
        updateProjection();
        model.scene.updateMatrixWorld(true);
        updateHover();
        renderer.render(scene, camera);
        root.dataset.sceneState = 'ready';
        if (elapsed < 100 && elapsed > 0) samples.push(elapsed);
        if (now - sampleTime > 2000 && samples.length) {
            const sorted = samples.toSorted((a,b) => a-b);
            root.dataset.frameMs = sorted[Math.floor(sorted.length / 2)].toFixed(1);
            root.dataset.drawCalls = String(renderer.info.render.calls);
            root.dataset.triangles = String(renderer.info.render.triangles);
            samples = []; sampleTime = now;
        }
        if (trafficToggle.checked || settling || hoverPoint) frame = requestAnimationFrame(tick);
    }

    async function boot() {
        if (booting || ready || failed) return;
        booting = true;
        root.dataset.sceneState = 'building';
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
            renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.setClearColor('#ffffff', 1);
            renderer.domElement.tabIndex = -1;
            renderer.domElement.setAttribute('role', 'img');
            renderer.domElement.setAttribute('aria-label', 'Live three-dimensional line-art scene of a café, neighboring office, garden, moving cars, and people. Use the place and turn controls to explore.');
            renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); fail('The scene was interrupted. Reload it to continue.'); });
            let font = null;
            try {
                const data = await fetch('assets/vendor/three/fonts/droid_sans_regular.typeface.json').then(response => { if (!response.ok) throw new Error('Font unavailable'); return response.json(); });
                font = new FontLoader().parse(data);
            } catch { /* The authored building remains usable without its small sign. */ }
            model = createCafeBlock({ font });
            scene = new THREE.Scene();
            scene.background = new THREE.Color('#ffffff');
            scene.add(model.scene);
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
            collectFraming();
            host.append(renderer.domElement);
            ready = true;
            root.dataset.renderer = 'three-webgl';
            root.dataset.textures = '0';
            loading.hidden = true;
            error.hidden = true;
            setEnabled(true);
            resize();
        } catch (problem) {
            console.error('GeoMarketeer scene failed:', problem);
            fail('The scene could not start in this browser. Please try again.');
        }
    }

    function fail(message) {
        failed = true; ready = false;
        cancelAnimationFrame(frame); frame = 0;
        loading.hidden = true; error.hidden = false;
        error.querySelector('p').textContent = message;
        setEnabled(false);
        root.dataset.sceneState = 'error';
    }

    function pressed() {
        root.querySelectorAll('button[data-map-place]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapPlace === (selected?.id || 'all'))));
    }

    function select(id) {
        if (!ready) return;
        selected = PLACES.find(place => place.id === id) || null;
        interiorOpen=false;model.setInterior(false);interiorButton.hidden=selected?.id!=='cafe';
        interiorButton.textContent='Look inside';interiorButton.setAttribute('aria-pressed','false');root.dataset.interior='false';
        inspector.hidden = !selected;
        if (!selected) {
            Object.assign(target, frameFor(target.yaw), { zoom: 1 });
            status.textContent = 'The whole café block.';
        } else {
            const anchor = model.anchors[selected.id];
            Object.assign(target, { x: anchor.x, y: anchor.y, z: anchor.z, zoom: selected.zoom });
            title.textContent = selected.name; kind.textContent = selected.kind; body.textContent = selected.body;
            status.textContent = `${selected.name}. ${selected.body}`;
        }
        model.materials.highlight(selected?.id);
        pressed();
        if (!expanded && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
        wake();
    }

    function turn(direction) {
        target.yaw += direction * Math.PI / 2;
        const framing = frameFor(target.yaw);
        target.span = framing.span;
        if (!selected) Object.assign(target, framing);
        status.textContent = direction > 0 ? 'Turning the block left.' : 'Turning the block right.';
        wake();
    }

    function expand() {
        expanded = !expanded;
        if (expanded) {
            previousFocus = document.activeElement;
            placeholder = document.createComment('GeoMarketeer café block'); root.before(placeholder);
            previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
            document.body.append(root);
            background = [...document.body.children].filter(element => element !== root && element.tagName !== 'SCRIPT').map(element => ({ element, inert: element.inert }));
            background.forEach(({element}) => { element.inert = true; });
            root.classList.add('is-expanded'); root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true');
            fullscreen.textContent = 'Exit fullscreen';
            requestAnimationFrame(() => { resize(); viewport.focus({ preventScroll:true }); });
        } else {
            root.classList.remove('is-expanded'); root.removeAttribute('role'); root.removeAttribute('aria-modal');
            placeholder.replaceWith(root); background.forEach(({element,inert}) => { element.inert = inert; }); background=[];
            document.body.style.overflow=previousOverflow; fullscreen.textContent='Fullscreen';
            requestAnimationFrame(resize); previousFocus?.focus({preventScroll:true});
        }
        fullscreen.setAttribute('aria-pressed',String(expanded));
    }

    root.addEventListener('click', event => {
        const place=event.target.closest('button[data-map-place]');
        if(place)select(place.dataset.mapPlace);
        const action=event.target.closest('[data-map-action]')?.dataset.mapAction;
        if(action==='fullscreen'){expand();return;}
        if(action==='retry'){location.reload();return;}
        if(!ready)return;
        if(action==='turn-left')turn(1);
        if(action==='turn-right')turn(-1);
        if(action==='zoom-in'){target.zoom=clamp(target.zoom+0.25,1,2.6);wake();}
        if(action==='zoom-out'){target.zoom=clamp(target.zoom-0.25,1,2.6);wake();}
        if(action==='reset'){target.yaw=Math.PI/4;select('all');}
        if(action==='interior'){
            interiorOpen=!interiorOpen;model.setInterior(interiorOpen);
            interiorButton.textContent=interiorOpen?'Close interior':'Look inside';interiorButton.setAttribute('aria-pressed',String(interiorOpen));
            root.dataset.interior=String(interiorOpen);target.y=interiorOpen?1.0:model.anchors.cafe.y;target.zoom=interiorOpen?2.6:2.25;
            status.textContent=interiorOpen?'The café interior is open for inspection.':'The complete café is restored.';wake();
        }
        if(action==='close'){
            inspector.hidden=true;root.querySelector(`.geo-map-places [data-map-place="${selected?.id||'all'}"]`)?.focus({preventScroll:true});
        }
        if(action==='move'){
            const enabled=viewport.dataset.manipulating!=='true';viewport.dataset.manipulating=String(enabled);
            moveToggle.setAttribute('aria-pressed',String(enabled));moveToggle.textContent=enabled?'Done moving':'Move map';
        }
    });
    labelToggle.addEventListener('change',()=>{root.dataset.labels=String(labelToggle.checked);wake();});
    trafficToggle.addEventListener('change',wake);

    function beginGesture() {
        const points=[...pointers.values()];
        if(points.length>=2){pinch={distance:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),zoom:state.zoom};drag=null;}
        else if(points.length===1){drag={...points[0],state:{...state},last:points[0],velocity:{x:0,z:0},moved:false};pinch=null;}
        else {drag=null;pinch=null;}
    }
    viewport.addEventListener('pointerdown',event=>{
        if(!ready||event.button!==0||event.target.closest('button'))return;
        if(event.pointerType==='touch'&&viewport.dataset.manipulating!=='true'){
            if(touchTap&&touchTap.id!==event.pointerId)touchTap.moved=true;
            else touchTap={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now(),moved:false};
            return;
        }
        if(!pointers.size)hadPinch=false;
        Object.assign(target,state);
        pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,time:performance.now()});
        if(pointers.size>1)hadPinch=true;
        viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');beginGesture();event.preventDefault();
    });
    viewport.addEventListener('pointermove',event=>{
        if(!ready)return;
        if(touchTap?.id===event.pointerId&&Math.hypot(event.clientX-touchTap.x,event.clientY-touchTap.y)>8)touchTap.moved=true;
        if(!pointers.has(event.pointerId)){if(event.pointerType!=='touch'){hoverPoint={x:event.clientX,y:event.clientY};wake();}return;}
        const point={x:event.clientX,y:event.clientY,time:performance.now()};pointers.set(event.pointerId,point);
        if(pinch&&pointers.size>=2){const points=[...pointers.values()];target.zoom=clamp(pinch.zoom*Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)/Math.max(1,pinch.distance),1,2.6);state.zoom=target.zoom;}
        else if(drag){
            const u=-(point.x-drag.x)/viewport.clientHeight*drag.state.span/drag.state.zoom;
            const v=(point.y-drag.y)/viewport.clientHeight*drag.state.span/drag.state.zoom/Math.sin(pitch);
            const x=clamp(drag.state.x+Math.cos(drag.state.yaw)*u+Math.sin(drag.state.yaw)*v,-16,16);
            const z=clamp(drag.state.z-Math.sin(drag.state.yaw)*u+Math.cos(drag.state.yaw)*v,-16,16);
            const elapsed=Math.max(1,point.time-drag.last.time);drag.velocity={x:(x-state.x)/elapsed,z:(z-state.z)/elapsed};
            drag.moved ||= Math.hypot(point.x-drag.x,point.y-drag.y)>5;drag.last=point;
            state.x=target.x=x;state.z=target.z=z;
        }
        wake();
    });
    function release(event){
        if(touchTap?.id===event.pointerId){
            const tap=touchTap;touchTap=null;
            if(event.type==='pointerup'&&!tap.moved&&performance.now()-tap.time<650)select(hitAt(event.clientX,event.clientY));
            return;
        }
        if(!pointers.has(event.pointerId))return;
        const previous=drag;pointers.delete(event.pointerId);
        if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
        if(!pointers.size){
            viewport.classList.remove('is-dragging');
            if(event.type==='pointerup'&&previous&&!hadPinch){
                if(!previous.moved)select(hitAt(event.clientX,event.clientY));
                else if(!reduce.matches&&performance.now()-previous.last.time<80){target.x=clamp(state.x+previous.velocity.x*90,-16,16);target.z=clamp(state.z+previous.velocity.z*90,-16,16);}
            }
        }
        beginGesture();wake();
    }
    ['pointerup','pointercancel','lostpointercapture'].forEach(event=>viewport.addEventListener(event,release));
    viewport.addEventListener('pointerleave',()=>{
        if(drag||pinch)return;hoverPoint=null;hovered=null;for(const label of labels.values())label.classList.remove('is-hovered');
        model?.materials.highlight(selected?.id);viewport.style.cursor='';wake();
    });
    // Touch keeps native page scrolling until Move map is explicitly enabled.
    viewport.addEventListener('wheel',event=>{
        if(!ready||(!expanded&&!event.ctrlKey&&!event.metaKey))return;
        event.preventDefault();target.zoom=clamp(target.zoom-event.deltaY*0.004,1,2.6);wake();
    },{passive:false});
    root.addEventListener('keydown',event=>{
        if(event.key==='Escape'){
            if(expanded)expand();else if(!inspector.hidden)inspector.hidden=true;else select('all');event.preventDefault();return;
        }
        if(event.key==='Tab'&&expanded){
            const items=[...root.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')].filter(item=>item.getClientRects().length&&!item.closest('[hidden]'));
            if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus();}
            else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}
        }
        if(event.target!==viewport||!ready)return;
        const amount=event.shiftKey?1.8:0.8;
        if(event.key==='[')turn(1);else if(event.key===']')turn(-1);
        else if(event.key==='+'||event.key==='='){target.zoom=clamp(target.zoom+0.25,1,2.6);wake();}
        else if(event.key==='-'){target.zoom=clamp(target.zoom-0.25,1,2.6);wake();}
        else if(event.key==='0'||event.key==='Home'){target.yaw=Math.PI/4;select('all');}
        else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
            const u=event.key==='ArrowLeft'?-amount:event.key==='ArrowRight'?amount:0;
            const v=event.key==='ArrowUp'?-amount:event.key==='ArrowDown'?amount:0;
            target.x=clamp(target.x+Math.cos(target.yaw)*u+Math.sin(target.yaw)*v,-16,16);
            target.z=clamp(target.z-Math.sin(target.yaw)*u+Math.cos(target.yaw)*v,-16,16);wake();
        }else return;
        event.preventDefault();
    });

    new ResizeObserver(resize).observe(viewport);
    const observer=new IntersectionObserver(entries=>{
        visible=entries[0]?.isIntersecting||false;
        if(visible){if(!ready)boot();else wake();}else{cancelAnimationFrame(frame);frame=0;}
    },{threshold:0.01});
    observer.observe(viewport);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
    window.addEventListener('blur',()=>{pointers.clear();touchTap=null;beginGesture();viewport.classList.remove('is-dragging');});
    reduce.addEventListener('change',()=>{if(reduce.matches)trafficToggle.checked=false;Object.assign(state,target);wake();});
    window.addEventListener('pagehide',event=>{if(event.persisted)return;cancelAnimationFrame(frame);observer.disconnect();model?.dispose();renderer?.dispose();},{once:true});

    if(new URLSearchParams(location.search).get('project')==='geomarketeer'){
        document.querySelectorAll('main .page').forEach(page=>page.classList.toggle('hidden',page.id!=='caseStudyPage'));
        window.setActiveNav?.('work');window.setCaseStudyView?.('full',true);
        Promise.resolve(document.fonts?.ready).then(()=>root.scrollIntoView({block:'start',behavior:'auto'}));
    }
}

const root=document.getElementById('geoExplorer');
if(root)init(root);
