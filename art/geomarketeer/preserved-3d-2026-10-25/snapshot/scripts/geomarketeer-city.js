const CITY_IMAGE = 'assets/portfolio/geomarketeer/pune-approved-reference.png';

const STORY = [
    {
        title: 'Siddharth wants to open a café. This corner looks promising.',
        body: 'There is traffic, a large commercial building, and plenty of movement. From here, it feels like an easy yes.',
        scale: 1, x: 0, y: 0, labels: ['candidate']
    },
    {
        title: 'Plenty of people pass this shop. How many could become customers?',
        body: 'A busy road proves that people are moving. It does not prove that they want coffee—or can conveniently stop for it.',
        scale: 1.62, x: -29, y: 7, labels: ['candidate', 'passing']
    },
    {
        title: 'Who actually lives and works around here?',
        body: 'Homes and offices may sit close together, yet represent very different routines, budgets, and reasons to visit.',
        scale: 1.25, x: -8, y: 2, labels: ['homes', 'offices', 'candidate']
    },
    {
        title: 'Are those people nearby when the café needs them?',
        body: 'A location can feel alive at rush hour and strangely empty at lunch. Demand changes throughout the day.',
        scale: 1.42, x: -23, y: 5, labels: ['candidate', 'morning', 'lunch', 'evening']
    },
    {
        title: 'Nearby does not always mean easy to reach.',
        body: 'Entrances, crossings, parking, and the side of the road can turn a short distance into a surprisingly inconvenient trip.',
        scale: 1.55, x: -17, y: 2, labels: ['candidate', 'crossing', 'access']
    },
    {
        title: 'Where do people already get their coffee?',
        body: 'Competition is not automatically bad. It can reveal demand—but it also shows where habits and loyalty already exist.',
        scale: 1.18, x: -2, y: -2, labels: ['candidate', 'competitorA', 'competitorB']
    },
    {
        title: 'A few streets away, a quieter storefront becomes interesting.',
        body: 'It attracts less passing traffic, but sits closer to the customers, routines, and access points that matter.',
        scale: 1.58, x: 7, y: -19, labels: ['alternative', 'homes', 'accessAlt']
    },
    {
        title: 'The city did not change. The quality of the decision did.',
        body: 'Before committing to a place, understand what surrounds it. That is the problem GeoMarketeer set out to make easier.',
        scale: 1.08, x: -2, y: -1, labels: ['candidate', 'alternative']
    }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function initGeoStory() {
    const story = document.getElementById('geoStory');
    if (!story || story.dataset.bound === 'true') return;
    const walkthrough = story.closest('details');
    if (walkthrough && !walkthrough.open) {
        walkthrough.addEventListener('toggle', () => {
            if (walkthrough.open) initGeoStory();
        }, { once: true });
        return;
    }

    const viewport = story.querySelector('.geo-story-viewport');
    const plane = story.querySelector('.geo-story-image-plane');
    const images = Array.from(story.querySelectorAll('.geo-story-image'));
    const beats = Array.from(story.querySelectorAll('.geo-story-beat'));
    const prev = story.querySelector('[data-geo-action="prev"]');
    const next = story.querySelector('[data-geo-action="next"]');
    const zoomOut = story.querySelector('[data-geo-action="zoom-out"]');
    const zoomIn = story.querySelector('[data-geo-action="zoom-in"]');
    const reset = story.querySelector('[data-geo-action="reset"]');
    const progress = story.querySelector('.geo-story-progress-fill');
    const current = story.querySelector('.geo-story-current');
    const status = story.querySelector('.geo-story-status');
    const response = story.querySelector('.geo-story-response');

    if (!viewport || !plane || images.length < 2 || !beats.length) return;
    story.dataset.bound = 'true';

    let activeBeat = 0;
    let activeImage = 0;
    let manualScale = 1;
    let manualX = 0;
    let manualY = 0;
    let dragStart = null;
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    images.forEach((image) => {
        image.src = CITY_IMAGE;
        image.decoding = 'async';
    });

    function isMobile() {
        return window.matchMedia('(max-width: 899px), (max-height: 650px)').matches;
    }

    function renderView(instant = false) {
        const beat = STORY[activeBeat];
        const scale = clamp(beat.scale * manualScale, 1, 2.05);
        const x = clamp(beat.x + manualX, -38, 22);
        const y = clamp(beat.y + manualY, -28, 22);

        plane.style.transitionDuration = instant || reducedMotion ? '0ms' : '760ms';
        plane.style.setProperty('--geo-scale', scale.toFixed(3));
        plane.style.setProperty('--geo-x', `${x.toFixed(2)}%`);
        plane.style.setProperty('--geo-y', `${y.toFixed(2)}%`);
        story.dataset.beat = String(activeBeat);
        story.dataset.labels = beat.labels.join(' ');
        viewport.setAttribute('aria-label', `${beat.title} ${beat.body}`);

        beats.forEach((element, index) => {
            const selected = index === activeBeat;
            element.classList.toggle('is-active', selected);
            element.setAttribute('aria-current', selected ? 'step' : 'false');
        });

        if (current) current.textContent = String(activeBeat + 1).padStart(2, '0');
        if (progress) progress.style.width = `${((activeBeat + 1) / STORY.length) * 100}%`;
        if (prev) prev.disabled = activeBeat === 0;
        if (next) {
            next.disabled = activeBeat === STORY.length - 1;
            next.textContent = activeBeat === STORY.length - 1 ? 'End' : 'Next';
        }
        if (status) status.textContent = `Story view ${activeBeat + 1} of ${STORY.length}: ${beat.title}`;
    }

    function swapImage(nextSource) {
        if (images[activeImage].getAttribute('src') === nextSource) return;
        const nextIndex = 1 - activeImage;
        const incoming = images[nextIndex];
        const show = () => {
            images[activeImage].classList.remove('is-active');
            incoming.classList.add('is-active');
            activeImage = nextIndex;
        };
        if (incoming.getAttribute('src') === nextSource && incoming.complete) show();
        else {
            incoming.onload = show;
            incoming.src = nextSource;
        }
    }

    function selectBeat(index, options = {}) {
        const nextBeat = clamp(index, 0, STORY.length - 1);
        if (nextBeat !== activeBeat) {
            activeBeat = nextBeat;
            manualScale = 1;
            manualX = 0;
            manualY = 0;
        }
        swapImage(STORY[activeBeat].image || CITY_IMAGE);
        renderView(Boolean(options.instant));

        if (options.scroll) {
            const target = isMobile() ? story.querySelector('.geo-story-stage') : beats[activeBeat];
            target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: isMobile() ? 'start' : 'center' });
        }
    }

    function adjustZoom(delta) {
        manualScale = clamp(manualScale + delta, 0.82, 1.3);
        renderView();
    }

    prev?.addEventListener('click', () => selectBeat(activeBeat - 1, { scroll: true }));
    next?.addEventListener('click', () => selectBeat(activeBeat + 1, { scroll: true }));
    zoomOut?.addEventListener('click', () => adjustZoom(-0.1));
    zoomIn?.addEventListener('click', () => adjustZoom(0.1));
    reset?.addEventListener('click', () => {
        manualScale = 1;
        manualX = 0;
        manualY = 0;
        renderView();
    });

    viewport.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || event.target.closest('button')) return;
        viewport.setPointerCapture(event.pointerId);
        dragStart = { x: event.clientX, y: event.clientY, panX: manualX, panY: manualY };
        viewport.classList.add('is-dragging');
    });

    viewport.addEventListener('pointermove', (event) => {
        if (!dragStart) return;
        const rect = viewport.getBoundingClientRect();
        manualX = clamp(dragStart.panX + ((event.clientX - dragStart.x) / rect.width) * 48, -18, 18);
        manualY = clamp(dragStart.panY + ((event.clientY - dragStart.y) / rect.height) * 34, -14, 14);
        renderView(true);
    });

    function stopDragging(event) {
        if (event && viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
        dragStart = null;
        viewport.classList.remove('is-dragging');
    }

    viewport.addEventListener('pointerup', stopDragging);
    viewport.addEventListener('pointercancel', stopDragging);

    viewport.addEventListener('keydown', (event) => {
        const amount = event.shiftKey ? 4 : 2;
        if (event.key === 'ArrowLeft') manualX = clamp(manualX - amount, -18, 18);
        else if (event.key === 'ArrowRight') manualX = clamp(manualX + amount, -18, 18);
        else if (event.key === 'ArrowUp') manualY = clamp(manualY - amount, -14, 14);
        else if (event.key === 'ArrowDown') manualY = clamp(manualY + amount, -14, 14);
        else if (event.key === '+' || event.key === '=') manualScale = clamp(manualScale + 0.1, 0.82, 1.3);
        else if (event.key === '-') manualScale = clamp(manualScale - 0.1, 0.82, 1.3);
        else if (event.key === '0' || event.key === 'Escape') {
            manualScale = 1;
            manualX = 0;
            manualY = 0;
        } else return;
        event.preventDefault();
        renderView();
    });

    beats.forEach((beat, index) => {
        beat.addEventListener('click', () => selectBeat(index, { scroll: !isMobile() }));
    });

    story.querySelectorAll('[data-geo-response]').forEach((button) => {
        button.addEventListener('click', () => {
            story.querySelectorAll('[data-geo-response]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
            if (response) response.textContent = button.dataset.geoResponse === 'more'
                ? 'Good instinct. The useful information is mostly invisible from the street.'
                : 'Fair. It looks convincing—which is exactly why the missing context matters.';
        });
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            if (isMobile()) return;
            const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) selectBeat(Number(visible.target.dataset.geoBeat));
        }, { threshold: [0.35, 0.55, 0.75], rootMargin: '-18% 0px -28% 0px' });
        beats.forEach((beat) => observer.observe(beat));
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener?.('change', (event) => {
        reducedMotion = event.matches;
        renderView(true);
    });

    window.addEventListener('resize', () => renderView(true), { passive: true });
    selectBeat(0, { instant: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeoStory, { once: true });
} else {
    initGeoStory();
}
