const places = [
    { id: 'cafe', name: 'Corner café', kind: 'Café frontage', x: 47, y: 50, focus: [47, 62], zoom: 1.9, bounds: [36, 42, 24, 37], body: 'A striped awning, an open storefront, and tables at the junction. Look closer at the counter, seating, and the pavement around the entrance.' },
    { id: 'offices', name: 'Office block', kind: 'Workplace', x: 28.5, y: 16, focus: [28.5, 29], zoom: 1.7, bounds: [16, 4, 25, 48], body: 'The taller building anchors this side of the neighborhood. A glazed lobby, rows of workspaces, and a planted entrance give the block its everyday character.' },
    { id: 'apartments', name: 'Apartments', kind: 'Residential', x: 83, y: 39, focus: [83, 49], zoom: 1.9, bounds: [72, 31, 21, 30], body: 'Balconies, window plants, and a sheltered entrance bring the residential edge to life. The homes face the same streets as the café and offices.' },
    { id: 'house', name: 'Terrace house', kind: 'Residential', x: 70.5, y: 27, focus: [70.5, 37], zoom: 2.1, bounds: [63, 21, 15, 25], body: 'A rooftop water tank, terrace seating, and small planted edges make this quieter home distinct from the larger apartment block.' },
    { id: 'shop', name: 'Local shop', kind: 'Street-level retail', x: 49, y: 19, focus: [49, 26], zoom: 2.2, bounds: [42, 13, 16, 21], body: 'A small awning-front shop sits across the junction. Its scale, entrance, and pavement offer a different kind of street frontage to explore.' },
    { id: 'garden', name: 'Pocket garden', kind: 'Public space', x: 16, y: 53, focus: [16, 54], zoom: 2, bounds: [4, 48, 22, 16], body: 'Benches, planting, and street trees create a small place to stop between the office entrance and the crossing.' },
    { id: 'crossing', name: 'Crossings', kind: 'Walking and access', x: 47, y: 90, focus: [47, 85], zoom: 1.9, bounds: [31, 83, 32, 12], body: 'Zebra markings, curb transitions, and bollards connect the café to its surroundings. Follow the street edge to see how people approach the corner.' },
];

function initExplorer(root) {
    const viewport = root.querySelector('.geo-map-viewport');
    const plane = root.querySelector('.geo-map-plane');
    const art = root.querySelector('.geo-map-art');
    const inspector = root.querySelector('.geo-map-inspector');
    const title = root.querySelector('#geoMapPlaceTitle');
    const kind = root.querySelector('.geo-map-inspector-kind');
    const body = root.querySelector('.geo-map-inspector-body');
    const status = root.querySelector('.geo-map-status');
    const zoomReadout = root.querySelector('.geo-map-zoom');
    const zoomIn = root.querySelector('[data-map-action="zoom-in"]');
    const zoomOut = root.querySelector('[data-map-action="zoom-out"]');
    const fullscreen = root.querySelector('[data-map-action="fullscreen"]');
    const moveToggle = root.querySelector('[data-map-action="move"]');
    const labelToggle = root.querySelector('[data-map-labels]');
    const error = root.querySelector('.geo-map-error');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const pointers = new Map();
    const minScale = 1;
    const maxScale = 2.8;
    const camera = { x: 0, y: 0, scale: 1 };
    let destination = { ...camera };
    let selected = null;
    let fitWidth = 0;
    let fitHeight = 0;
    let frame = 0;
    let drag = null;
    let pinch = null;
    let expanded = false;
    let placeholder = null;
    let previousFocus = null;
    let previousOverflow = '';
    let backgroundNodes = [];
    let failed = false;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function bounded(next) {
        const scale = clamp(next.scale, minScale, maxScale);
        const maxX = Math.max(0, (fitWidth * scale - viewport.clientWidth) / 2) + viewport.clientWidth * 0.12;
        const maxY = Math.max(0, (fitHeight * scale - viewport.clientHeight) / 2) + viewport.clientHeight * 0.12;
        return { scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
    }

    function render() {
        plane.style.transform = `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`;
        plane.style.setProperty('--map-inverse-scale', String(1 / camera.scale));
        zoomReadout.value = `${Math.round(camera.scale * 100)}%`;
        zoomIn.disabled = failed || camera.scale >= maxScale - 0.01;
        zoomOut.disabled = failed || camera.scale <= minScale + 0.01;
        places.forEach((place) => {
            const x = viewport.clientWidth / 2 + (place.x / 100 - 0.5) * fitWidth * camera.scale + camera.x;
            const y = viewport.clientHeight / 2 + (place.y / 100 - 0.5) * fitHeight * camera.scale + camera.y;
            root.querySelector(`.geo-map-place[data-map-place="${place.id}"]`).tabIndex = x >= 22 && x <= viewport.clientWidth - 22 && y >= 22 && y <= viewport.clientHeight - 22 ? 0 : -1;
        });
    }

    function moveTo(next, instant = false) {
        cancelAnimationFrame(frame);
        frame = 0;
        const end = bounded(next);
        destination = end;
        if (instant || reduced.matches) {
            Object.assign(camera, end);
            render();
            return;
        }
        const start = { ...camera };
        const started = performance.now();
        const tick = (now) => {
            const progress = Math.min((now - started) / 620, 1);
            const eased = 1 - (1 - progress) ** 4;
            camera.x = start.x + (end.x - start.x) * eased;
            camera.y = start.y + (end.y - start.y) * eased;
            camera.scale = start.scale + (end.scale - start.scale) * eased;
            render();
            frame = progress < 1 ? requestAnimationFrame(tick) : 0;
        };
        frame = requestAnimationFrame(tick);
    }

    function placeCamera(place) {
        return {
            scale: place.zoom,
            x: -(place.focus[0] / 100 - 0.5) * fitWidth * place.zoom,
            y: -(place.focus[1] / 100 - 0.5) * fitHeight * place.zoom,
        };
    }

    function fit() {
        if (!viewport.clientWidth || !viewport.clientHeight) return;
        const ratio = art.naturalWidth / art.naturalHeight || 4 / 3;
        const previousWidth = fitWidth;
        fitWidth = Math.min(viewport.clientWidth, viewport.clientHeight * ratio);
        fitHeight = fitWidth / ratio;
        plane.style.width = `${fitWidth}px`;
        plane.style.height = `${fitHeight}px`;
        plane.style.left = `${(viewport.clientWidth - fitWidth) / 2}px`;
        plane.style.top = `${(viewport.clientHeight - fitHeight) / 2}px`;
        if (selected) moveTo(placeCamera(selected), true);
        else moveTo({ ...camera, x: previousWidth ? camera.x * fitWidth / previousWidth : 0, y: previousWidth ? camera.y * fitWidth / previousWidth : 0 }, true);
    }

    function updateSelection() {
        root.querySelectorAll('button[data-map-place]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.mapPlace === (selected?.id || 'all')));
        });
    }

    function selectPlace(id) {
        if (failed) return;
        selected = places.find((place) => place.id === id) || null;
        updateSelection();
        inspector.hidden = !selected;
        if (!expanded && root.getBoundingClientRect().top < 0) {
            root.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
        }
        if (!selected) {
            moveTo({ scale: 1, x: 0, y: 0 });
            status.textContent = 'Full neighborhood view.';
            return;
        }
        title.textContent = selected.name;
        kind.textContent = selected.kind;
        body.textContent = selected.body;
        moveTo(placeCamera(selected));
        status.textContent = `${selected.name} selected. ${selected.body}`;
    }

    function closeInspector() {
        const previous = selected;
        inspector.hidden = true;
        status.textContent = 'Place details closed.';
        root.querySelector(`.geo-map-places [data-map-place="${previous?.id || 'all'}"]`)?.focus({ preventScroll: true });
    }

    function zoomBy(amount, point = null) {
        const base = frame && !point ? destination : camera;
        const scale = clamp(base.scale + amount, minScale, maxScale);
        const ratio = scale / base.scale;
        moveTo({ scale, x: point ? point.x - (point.x - base.x) * ratio : base.x * ratio, y: point ? point.y - (point.y - base.y) * ratio : base.y * ratio });
    }

    function toggleExpanded() {
        expanded = !expanded;
        if (expanded) {
            previousFocus = document.activeElement;
            placeholder = document.createComment('GeoMarketeer explorer');
            root.before(placeholder);
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            document.body.append(root);
            backgroundNodes = [...document.body.children].filter((element) => element !== root && element.tagName !== 'SCRIPT').map((element) => ({ element, inert: element.inert }));
            backgroundNodes.forEach(({ element }) => { element.inert = true; });
            root.classList.add('is-expanded');
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-modal', 'true');
            fullscreen.textContent = 'Exit fullscreen';
            requestAnimationFrame(() => { fit(); viewport.focus({ preventScroll: true }); });
        } else {
            root.classList.remove('is-expanded');
            root.removeAttribute('role');
            root.removeAttribute('aria-modal');
            placeholder.replaceWith(root);
            backgroundNodes.forEach(({ element, inert }) => { element.inert = inert; });
            backgroundNodes = [];
            document.body.style.overflow = previousOverflow;
            fullscreen.textContent = 'Fullscreen';
            requestAnimationFrame(fit);
            previousFocus?.focus({ preventScroll: true });
        }
        fullscreen.setAttribute('aria-pressed', String(expanded));
    }

    root.addEventListener('click', (event) => {
        const place = event.target.closest('[data-map-place]');
        if (place) selectPlace(place.dataset.mapPlace);
        const action = event.target.closest('[data-map-action]')?.dataset.mapAction;
        if (action === 'reset') selectPlace('all');
        if (action === 'zoom-in') zoomBy(0.3);
        if (action === 'zoom-out') zoomBy(-0.3);
        if (action === 'close') closeInspector();
        if (action === 'fullscreen') toggleExpanded();
        if (action === 'move') {
            const enabled = viewport.dataset.manipulating !== 'true';
            viewport.dataset.manipulating = String(enabled);
            moveToggle.setAttribute('aria-pressed', String(enabled));
            moveToggle.textContent = enabled ? 'Done moving' : 'Move map';
        }
        if (action === 'retry') {
            error.hidden = true;
            art.src = `assets/portfolio/geomarketeer/cafe-corner/cafe-corner-detailed.webp?retry=${Date.now()}`;
        }
    });

    labelToggle.addEventListener('change', () => { root.dataset.labels = String(labelToggle.checked); });

    const hitLayer = root.querySelector('.geo-map-hits');
    places.forEach((place) => {
        const hit = document.createElement('div');
        hit.className = 'geo-map-hit';
        hit.dataset.mapPlace = place.id;
        const [left, top, width, height] = place.bounds;
        Object.assign(hit.style, { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` });
        if (!['garden', 'crossing'].includes(place.id)) hit.style.clipPath = 'polygon(46% 0, 100% 23%, 100% 76%, 49% 100%, 0 73%, 0 24%)';
        const label = root.querySelector(`.geo-map-place[data-map-place="${place.id}"]`);
        hit.addEventListener('pointerenter', () => label.classList.add('is-hovered'));
        hit.addEventListener('pointerleave', () => label.classList.remove('is-hovered'));
        hitLayer.append(hit);
    });

    function beginGesture() {
        const points = [...pointers.values()];
        if (points.length >= 2) {
            pinch = { distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y), center: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }, camera: { ...camera } };
            drag = null;
        } else if (points.length === 1) {
            drag = { ...points[0], camera: { ...camera }, last: points[0], velocity: { x: 0, y: 0 }, moved: false };
            pinch = null;
        } else {
            drag = null;
            pinch = null;
        }
    }

    viewport.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || event.target.closest('button') || failed) return;
        if (event.pointerType === 'touch' && viewport.dataset.manipulating !== 'true') return;
        cancelAnimationFrame(frame);
        frame = 0;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, time: performance.now(), place: event.target.closest('[data-map-place]')?.dataset.mapPlace });
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add('is-dragging');
        beginGesture();
        event.preventDefault();
    });

    viewport.addEventListener('pointermove', (event) => {
        if (!pointers.has(event.pointerId)) return;
        const point = { x: event.clientX, y: event.clientY, time: performance.now() };
        pointers.set(event.pointerId, point);
        if (pinch && pointers.size >= 2) {
            const points = [...pointers.values()];
            const box = viewport.getBoundingClientRect();
            const scale = clamp(pinch.camera.scale * Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) / Math.max(1, pinch.distance), minScale, maxScale);
            const ratio = scale / pinch.camera.scale;
            const origin = { x: pinch.center.x - box.left - box.width / 2, y: pinch.center.y - box.top - box.height / 2 };
            const center = { x: (points[0].x + points[1].x) / 2 - box.left - box.width / 2, y: (points[0].y + points[1].y) / 2 - box.top - box.height / 2 };
            moveTo({ scale, x: center.x - (origin.x - pinch.camera.x) * ratio, y: center.y - (origin.y - pinch.camera.y) * ratio }, true);
        } else if (drag) {
            const elapsed = Math.max(1, point.time - drag.last.time);
            drag.velocity = { x: (point.x - drag.last.x) / elapsed, y: (point.y - drag.last.y) / elapsed };
            drag.moved ||= Math.hypot(point.x - drag.x, point.y - drag.y) > 5;
            drag.last = point;
            moveTo({ ...drag.camera, x: drag.camera.x + point.x - drag.x, y: drag.camera.y + point.y - drag.y }, true);
        }
    });

    function endGesture(event) {
        if (!pointers.has(event.pointerId)) return;
        const lastDrag = drag;
        pointers.delete(event.pointerId);
        if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
        if (!pointers.size) {
            viewport.classList.remove('is-dragging');
            if (event.type === 'pointerup' && lastDrag) {
                if (!lastDrag.moved && lastDrag.place) selectPlace(lastDrag.place);
                else if (lastDrag.moved && !reduced.matches && performance.now() - lastDrag.last.time < 80) {
                    moveTo({ ...camera, x: camera.x + clamp(lastDrag.velocity.x * 110, -120, 120), y: camera.y + clamp(lastDrag.velocity.y * 110, -120, 120) });
                }
            }
        }
        beginGesture();
    }
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => viewport.addEventListener(type, endGesture));

    viewport.addEventListener('wheel', (event) => {
        if (!expanded && !event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        const box = viewport.getBoundingClientRect();
        zoomBy(-clamp(event.deltaY * 0.008, -0.25, 0.25), { x: event.clientX - box.left - box.width / 2, y: event.clientY - box.top - box.height / 2 });
    }, { passive: false });

    root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (expanded) toggleExpanded();
            else if (selected && !inspector.hidden) closeInspector();
            else selectPlace('all');
            event.preventDefault();
            return;
        }
        if (event.key === 'Tab' && expanded) {
            const focusable = [...root.querySelectorAll('button:not(:disabled), input, [tabindex="0"]')].filter((element) => element.getClientRects().length && !element.closest('[hidden]'));
            const first = focusable[0];
            const last = focusable.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
        if (event.target !== viewport) return;
        const amount = event.shiftKey ? 70 : 35;
        if (event.key === 'ArrowLeft') moveTo({ ...camera, x: camera.x + amount });
        else if (event.key === 'ArrowRight') moveTo({ ...camera, x: camera.x - amount });
        else if (event.key === 'ArrowUp') moveTo({ ...camera, y: camera.y + amount });
        else if (event.key === 'ArrowDown') moveTo({ ...camera, y: camera.y - amount });
        else if (event.key === '+' || event.key === '=') zoomBy(0.3);
        else if (event.key === '-') zoomBy(-0.3);
        else if (event.key === '0' || event.key === 'Home') selectPlace('all');
        else return;
        event.preventDefault();
    });

    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(viewport);
    reduced.addEventListener('change', () => moveTo(camera, true));
    window.addEventListener('blur', () => { pointers.clear(); beginGesture(); viewport.classList.remove('is-dragging'); });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(frame); frame = 0; pointers.clear(); beginGesture(); viewport.classList.remove('is-dragging'); }
    });
    art.addEventListener('load', () => {
        failed = false;
        error.hidden = true;
        root.querySelectorAll('button[data-map-place]').forEach((button) => { button.disabled = false; });
        fit();
    });
    art.addEventListener('error', () => {
        failed = true;
        error.hidden = false;
        inspector.hidden = true;
        root.querySelectorAll('button[data-map-place]').forEach((button) => { button.disabled = true; });
        render();
    });
    fit();

    if (new URLSearchParams(location.search).get('project') === 'geomarketeer') {
        document.querySelectorAll('main .page').forEach((page) => page.classList.toggle('hidden', page.id !== 'caseStudyPage'));
        window.setActiveNav?.('work');
        window.setCaseStudyView?.('full', true);
        Promise.allSettled([art.decode(), document.fonts?.ready]).then(() => {
            fit();
            root.scrollIntoView({ block: 'start', behavior: 'auto' });
        });
    }
}

const explorer = document.getElementById('geoExplorer');
if (explorer) initExplorer(explorer);
