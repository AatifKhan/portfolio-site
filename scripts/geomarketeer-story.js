import { SOURCE, STORY, cameraCSS, overlayMarkup } from './geomarketeer-story-data.js?v=story5-2';

function openCaseStudyRoute() {
    if (new URLSearchParams(location.search).get('project') !== 'geomarketeer') return;
    // Routing no longer depends on the former WebGL initializer.
    document.querySelectorAll('main .page').forEach(page => {
        page.classList.toggle('hidden', page.id !== 'caseStudyPage');
    });
    window.setActiveNav?.('work');
    window.setCaseStudyView?.('full', true);
}

function initGeoStory() {
    openCaseStudyRoute();
    const root = document.getElementById('geoStory');
    if (!root || root.dataset.bound === 'true') return;
    const viewport = root.querySelector('.geo-story-viewport');
    const plane = root.querySelector('.geo-story-plane');
    const master = root.querySelector('.geo-story-master');
    const overlayHost = root.querySelector('.geo-story-overlays');
    const copy = root.querySelector('.geo-story-copy');
    const beats = [...root.querySelectorAll('.geo-story-beat')];
    const nav = root.querySelector('.geo-story-nav');
    const prev = root.querySelector('[data-geo-action="prev"]');
    const next = root.querySelector('[data-geo-action="next"]');
    const count = root.querySelector('.geo-story-current');
    const status = root.querySelector('.geo-story-status');
    const loading = root.querySelector('.geo-story-loading');
    const error = root.querySelector('.geo-story-error');
    if (!viewport || !plane || !master || !overlayHost || beats.length !== STORY.length) return;

    root.dataset.bound = 'true';
    root.classList.add('is-enhanced');
    nav.hidden = false;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0;
    let ready = false;
    let request = 0;
    let loadRequest = 0;
    let announceTimer;
    let lastWidth = 0;
    let lastTarget = '';
    let copyAnimation;

    // Crossfade registered annotations without swapping the underlying image.
    overlayHost.innerHTML = STORY.map((_, index) =>
        `<svg class="geo-story-overlay" data-overlay="${index}" width="${SOURCE.width}" height="${SOURCE.height}" viewBox="0 0 ${SOURCE.width} ${SOURCE.height}" aria-hidden="true">${overlayMarkup(index)}</svg>`
    ).join('');
    const overlays = [...overlayHost.children];

    function position(instant = false) {
        const { width, height } = viewport.getBoundingClientRect();
        if (!width || !height) return;
        const immediate = instant || motion.matches || !ready;
        const target = cameraCSS(STORY[active].camera, width, height);
        if (immediate) root.dataset.motion = 'idle';
        // CSS serializes fractional transforms with rounding. Compare our
        // original targets so beats 4 → 5 (same camera) do not await an event
        // for a transform that has not actually changed.
        else if (lastTarget !== target) root.dataset.motion = 'moving';
        plane.style.transitionDuration = immediate ? '0ms' : '850ms';
        plane.style.transform = target;
        lastTarget = target;
        lastWidth = width;
    }

    plane.addEventListener('transitionend', event => {
        if (event.target === plane && event.propertyName === 'transform') root.dataset.motion = 'idle';
    });

    function select(index, { instant = false, announce = true } = {}) {
        const requested = Math.max(0, Math.min(STORY.length - 1, index));
        const changed = requested !== active;
        active = requested;
        const token = ++request;
        root.dataset.beat = String(active);
        const step = STORY[active];
        beats.forEach((beat, index) => {
            const selected = index === active;
            beat.hidden = !selected;
            beat.classList.toggle('is-active', selected);
            if (selected) beat.setAttribute('aria-current', 'step');
            else beat.removeAttribute('aria-current');
        });
        overlays.forEach((overlay, index) => overlay.classList.toggle('is-active', index === active));
        viewport.setAttribute('aria-label', root.dataset.image === 'error'
            ? `Illustration unavailable. ${step.description}` : step.description);
        count.textContent = String(active + 1).padStart(2, '0');
        prev.disabled = active === 0;
        next.textContent = active === STORY.length - 1 ? 'Read the case study' : 'Next';
        next.setAttribute('aria-label', active === STORY.length - 1 ? 'Read the case study' : `Next: ${STORY[active + 1].label}`);
        position(instant);
        copyAnimation?.cancel();
        if (changed && !instant && !motion.matches && copy.animate) {
            copyAnimation = copy.animate([
                { opacity: 0, transform: 'translateY(3px)' },
                { opacity: 1, transform: 'translateY(0)' },
            ], { duration: 220, easing: 'ease-out' });
        }
        clearTimeout(announceTimer);
        if (announce && changed) {
            announceTimer = setTimeout(() => {
                if (token === request) status.textContent = `Step ${active + 1} of ${STORY.length}. ${step.title} ${step.body}`;
            }, motion.matches ? 0 : 230);
        }
    }

    function continueToResearch(event) {
        event?.preventDefault();
        window.setCaseStudyView?.('full', true);
        const section = document.getElementById('geoCaseResearch');
        if (!section) return;
        const heading = section.querySelector('h3, h2');
        requestAnimationFrame(() => {
            heading?.focus({ preventScroll: true });
            section.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
        });
    }

    async function loadIllustration(retry = false) {
        const token = ++loadRequest;
        root.dataset.image = 'loading';
        // An img role hides its descendants from accessibility APIs. During
        // loading/failure, expose the status and retry button as real content.
        viewport.setAttribute('role', 'group');
        loading.hidden = false;
        error.hidden = true;
        if (retry) master.src = `${SOURCE.src}?retry=${Date.now()}`;
        try {
            await master.decode();
            if (!master.naturalWidth) throw new Error('Illustration did not load');
            if (token !== loadRequest) return;
            ready = false;
            position(true);
            // Expose the decoded image only after applying the opening camera.
            requestAnimationFrame(() => {
                if (token !== loadRequest) return;
                ready = true;
                root.dataset.image = 'ready';
                viewport.setAttribute('role', 'img');
                viewport.setAttribute('aria-label', STORY[active].description);
                loading.hidden = true;
            });
        } catch {
            if (token !== loadRequest) return;
            ready = false;
            root.dataset.image = 'error';
            viewport.setAttribute('role', 'group');
            viewport.setAttribute('aria-label', `Illustration unavailable. ${STORY[active].description}`);
            loading.hidden = true;
            error.hidden = false;
        }
    }

    prev.addEventListener('click', () => select(active - 1));
    next.addEventListener('click', event => {
        if (active === STORY.length - 1) continueToResearch(event);
        else select(active + 1);
    });
    root.querySelector('[data-geo-action="skip"]')?.addEventListener('click', continueToResearch);
    root.querySelector('[data-geo-action="retry"]')?.addEventListener('click', () => loadIllustration(true));

    new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width || 0;
        if (width > 0 && Math.abs(width - lastWidth) > 0.1) position(true);
    }).observe(viewport);
    motion.addEventListener('change', () => {
        copyAnimation?.cancel();
        position(true);
    });
    // Font loading changes the copy, not this fixed-ratio viewport. The
    // ResizeObserver handles real geometry changes without a late font-ready
    // callback snapping an in-flight camera transition.
    select(0, { instant: true, announce: false });
    loadIllustration();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGeoStory, { once: true });
else initGeoStory();
