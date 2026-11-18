import { connectSound } from './sound.js';

const rail = document.querySelector('#portfolio');
const panels = Array.from(rail.querySelectorAll('.panel'));
const controls = document.querySelector('.column-controls');
const previous = controls.querySelector('[data-step="-1"]');
const next = controls.querySelector('[data-step="1"]');
const sectionPicker = document.querySelector('.section-select');
const mobileNavigation = window.matchMedia('(max-width: 767px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const playCue = connectSound();
const tolerance = 2;
let requestedOffset = null;
let settleTimer;

function scrollLimit() {
    return rail.scrollWidth - rail.clientWidth;
}

function panelOffset(panel) {
    return Math.min(scrollLimit(), panel.getBoundingClientRect().left - panels[0].getBoundingClientRect().left);
}

function columnStops() {
    return panels.reduce((offsets, panel) => {
        const offset = panelOffset(panel);
        if (offsets.length === 0 || offset - offsets.at(-1) > tolerance) offsets.push(offset);
        return offsets;
    }, []);
}

function updateControls() {
    const position = requestedOffset ?? rail.scrollLeft;
    previous.setAttribute('aria-disabled', String(position <= tolerance));
    next.setAttribute('aria-disabled', String(position >= scrollLimit() - tolerance));

    if (sectionPicker && mobileNavigation.matches) {
        let current = panels[0];
        let distance = Infinity;
        for (const panel of panels) {
            const panelDistance = Math.abs(panelOffset(panel) - position);
            if (panelDistance >= distance) continue;
            current = panel;
            distance = panelDistance;
        }
        sectionPicker.value = `#${current.id}`;
    }
}

function releaseDestination() {
    clearTimeout(settleTimer);
    requestedOffset = null;
    updateControls();
}

function scrollToOffset(destination, behavior = reducedMotion.matches ? 'instant' : 'smooth') {
    requestedOffset = destination;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(releaseDestination, 500);
    rail.scrollTo({ left: destination, behavior });
    updateControls();
}

function moveColumn(direction) {
    const position = requestedOffset ?? rail.scrollLeft;
    const stops = columnStops();
    const destination = direction > 0
        ? stops.find((offset) => offset > position + tolerance)
        : stops.findLast((offset) => offset < position - tolerance);

    if (destination === undefined) return;
    scrollToOffset(destination);
    playCue('navigate');
}

function panelForHash(hash) {
    return panels.find((panel) => `#${panel.id}` === hash);
}

function showLinkedPanel(hash, behavior, focusFirstWork = false) {
    const panel = panelForHash(hash);
    if (!panel) return false;
    const destination = panelOffset(panel);
    const position = requestedOffset ?? rail.scrollLeft;
    const firstWork = focusFirstWork && panel.querySelector('.project-card');
    if (firstWork) panel.querySelector('.project-list').scrollTop = 0;
    (firstWork || panel).focus({ preventScroll: true });
    scrollToOffset(destination, behavior);
    return Math.abs(destination - position) > tolerance;
}

if (sectionPicker) {
    sectionPicker.addEventListener('change', () => {
        const hash = sectionPicker.value;
        const panel = panelForHash(hash);
        if (!panel) return;

        const changedHash = window.location.hash !== hash;
        if (changedHash) history.pushState(null, '', hash);
        const destination = panelOffset(panel);
        const moved = Math.abs(destination - (requestedOffset ?? rail.scrollLeft)) > tolerance;
        scrollToOffset(destination);
        if (moved || changedHash) playCue('navigate');
    });

    sectionPicker.closest('.section-nav').hidden = false;
    document.documentElement.toggleAttribute('data-section-nav', true);
}

for (const link of document.querySelectorAll('[data-column-link], [data-jump-work]')) {
    link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        const changedHash = window.location.hash !== link.hash;
        if (changedHash) history.pushState(null, '', link.hash);
        const moved = showLinkedPanel(link.hash, undefined, link.hasAttribute('data-jump-work'));
        if (moved || changedHash) playCue('navigate');
    });
}

previous.addEventListener('click', () => moveColumn(-1));
next.addEventListener('click', () => moveColumn(1));
rail.addEventListener('keydown', (event) => {
    if (event.target !== rail || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveColumn(event.key === 'ArrowRight' ? 1 : -1);
});

rail.addEventListener('scroll', () => {
    if (requestedOffset !== null && Math.abs(rail.scrollLeft - requestedOffset) <= tolerance) {
        releaseDestination();
    } else {
        updateControls();
    }
}, { passive: true });

rail.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('a, button, summary')) releaseDestination();
}, { passive: true });
rail.addEventListener('pointercancel', releaseDestination, { passive: true });
rail.addEventListener('wheel', releaseDestination, { passive: true });
window.addEventListener('resize', releaseDestination);
window.addEventListener('hashchange', () => showLinkedPanel(window.location.hash || '#about', 'instant'));

if (window.location.hash) showLinkedPanel(window.location.hash, 'instant');
updateControls();
controls.hidden = false;

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) entry.target.toggleAttribute('data-edge', entry.intersectionRatio < 0.3);
    }, { root: rail, threshold: 0.3 });
    for (const panel of panels) observer.observe(panel);
}

const copyButton = document.querySelector('[data-copy-link]');
const copyStatus = document.querySelector('.contact-actions [role="status"]');
const copyUrl = document.querySelector('link[rel="canonical"]')?.href || copyButton.dataset.copyLink;
let copyTimer;
copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(copyUrl);
        copyButton.textContent = 'Copied!';
        copyStatus.textContent = 'Portfolio link copied.';
        playCue('confirm');
    } catch {
        copyButton.textContent = 'Copy failed';
        copyStatus.textContent = 'The browser could not copy the portfolio link.';
    }

    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
        copyButton.textContent = 'Copy link';
        copyStatus.textContent = '';
    }, 1800);
});

const workPanel = document.querySelector('#work');
const projects = Array.from(workPanel.querySelectorAll('.project'));
const careerPanel = document.querySelector('#experience');
const careerLinks = Array.from(careerPanel.querySelectorAll('.timeline a[href^="#career-"]'));
const sheet = document.querySelector('.project-sheet');
const sheetTitle = sheet.querySelector('#project-sheet-title');
const sheetScroll = sheet.querySelector('.sheet-scroll');
const sheetContent = sheet.querySelector('.sheet-content');
const sheetActions = sheet.querySelector('.sheet-actions');
const previousDetail = sheet.querySelector('[data-project-step="-1"]');
const nextDetail = sheet.querySelector('[data-project-step="1"]');
const closeSheetButton = sheet.querySelector('.sheet-close');
const grip = sheet.querySelector('.sheet-grip');
const workDetails = { panel: workPanel, entries: projects, read: readProject, itemName: 'project' };
const careerDetails = { panel: careerPanel, entries: careerLinks, read: readCareerEntry, itemName: 'entry' };
let activeDetails = null;
let detailIndex = 0;
let sheetTrigger = null;
let sheetClosing = false;
let sheetDrag = null;

const sheetRestingClip = 'inset(0 0 0% 0)';
const sheetHiddenClip = 'inset(0 0 100% 0)';

function alignSheet() {
    if (requestedOffset !== null) {
        rail.scrollTo({ left: requestedOffset, behavior: 'instant' });
        releaseDestination();
    }

    const viewport = rail.getBoundingClientRect();
    const { panel } = activeDetails;
    let bounds = panel.getBoundingClientRect();
    if (bounds.right > viewport.right + tolerance) {
        const edge = rail.scrollLeft + bounds.right - viewport.right;
        const stop = columnStops().find((offset) => offset >= edge - tolerance);
        scrollToOffset(stop ?? scrollLimit(), 'instant');
        bounds = panel.getBoundingClientRect();
    } else if (bounds.left < viewport.left - tolerance) {
        scrollToOffset(panelOffset(panel), 'instant');
        bounds = panel.getBoundingClientRect();
    }

    const bottom = Math.min(window.innerHeight, bounds.bottom);
    sheet.style.setProperty('--sheet-left', `${bounds.left}px`);
    sheet.style.setProperty('--sheet-bottom', `${window.innerHeight - bottom}px`);
    sheet.style.setProperty('--sheet-width', `${bounds.width}px`);
    sheet.style.setProperty('--sheet-height', `${bounds.height * 0.965}px`);
}

function readProject(project) {
    const title = project.querySelector('.project-title').textContent;
    const detail = project.querySelector('.project-detail').cloneNode(true);
    const projectImage = project.querySelector('.project-image');
    if (!detail.querySelector('.project-gallery') && projectImage) {
        const cover = projectImage.cloneNode();
        cover.removeAttribute('class');
        cover.alt = `Cover image for ${title}`;
        const galleryTitle = document.createElement('h3');
        galleryTitle.className = 'gallery-heading';
        galleryTitle.textContent = 'Selected work';
        const group = document.createElement('div');
        group.className = 'project-gallery';
        const figure = document.createElement('figure');
        const link = document.createElement('a');
        link.href = cover.src;
        const caption = document.createElement('figcaption');
        caption.textContent = 'Project cover';
        link.append(cover);
        figure.append(link, caption);
        group.append(figure);
        detail.append(galleryTitle, group);
    }

    return { title, detail };
}

function readCareerEntry(link) {
    const source = document.getElementById(link.hash.slice(1));
    const detail = source.cloneNode(true);
    const role = detail.querySelector('h5');
    const title = role.textContent;
    detail.removeAttribute('id');
    detail.removeAttribute('tabindex');
    role.remove();

    if (source.classList.contains('career-role')) {
        detail.prepend(source.closest('.career-entry').querySelector('header').cloneNode(true));
    }

    const organization = detail.querySelector('h4');
    const name = document.createElement('p');
    name.className = 'career-organization';
    name.textContent = organization.textContent;
    organization.replaceWith(name);
    return { title, detail };
}

function renderDetail(index) {
    const entry = activeDetails?.entries[index];
    if (!entry || sheetClosing) return false;

    detailIndex = index;
    const { title, detail } = activeDetails.read(entry);
    sheetTitle.textContent = title;
    sheetContent.replaceChildren(detail);
    sheetScroll.scrollTop = 0;
    previousDetail.setAttribute('aria-disabled', String(index === 0));
    nextDetail.setAttribute('aria-disabled', String(index === activeDetails.entries.length - 1));
    return true;
}

function stepDetail(direction) {
    if (renderDetail(detailIndex + direction)) playCue('navigate');
}

function openSheet(details, index, trigger) {
    if (sheet.open) return;

    activeDetails = details;
    sheetTrigger = trigger;
    const { panel, itemName } = details;
    sheetActions.setAttribute('aria-label', itemName === 'project' ? 'Project navigation' : 'Career navigation');
    previousDetail.setAttribute('aria-label', `Previous ${itemName}`);
    nextDetail.setAttribute('aria-label', `Next ${itemName}`);
    closeSheetButton.textContent = itemName === 'project' ? 'Close project' : 'Close details';
    renderDetail(index);
    alignSheet();
    panel.dataset.sheetOpen = '';
    sheet.showModal();
    playCue('open');
    sheetScroll.scrollTop = 0;
    sheetTitle.focus({ preventScroll: true });
    if (!reducedMotion.matches) {
        sheet.animate(
            [
                { transform: 'translateY(100%)', clipPath: sheetHiddenClip },
                { transform: 'translateY(0)', clipPath: sheetRestingClip }
            ],
            { duration: 330, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
        );
    }
}

async function closeSheet() {
    if (!sheet.open || sheetClosing) return;
    sheetClosing = true;
    playCue('close');

    if (!reducedMotion.matches) {
        const animation = sheet.animate(
            [
                { transform: getComputedStyle(sheet).transform, clipPath: sheet.style.clipPath || sheetRestingClip },
                { transform: 'translateY(100%)', clipPath: sheetHiddenClip }
            ],
            { duration: 230, easing: 'ease-in', fill: 'forwards' }
        );
        try { await animation.finished; } catch { /* Closing is still valid if playback is canceled. */ }
        animation.cancel();
    }

    sheet.close();
    sheet.style.removeProperty('transform');
    sheet.style.removeProperty('clip-path');
    sheetDrag = null;
    sheetClosing = false;
    activeDetails.panel.removeAttribute('data-sheet-open');
    activeDetails = null;
    sheetTrigger.focus({ preventScroll: true });
    sheetTrigger = null;
}

if (typeof sheet.showModal === 'function') {
    projects.forEach((project, index) => {
        const card = project.querySelector('summary');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-haspopup', 'dialog');
        card.addEventListener('click', (event) => {
            event.preventDefault();
            openSheet(workDetails, index, card);
        });
    });

    careerLinks.forEach((link, index) => {
        link.setAttribute('aria-haspopup', 'dialog');
        link.addEventListener('click', (event) => {
            if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            event.preventDefault();
            openSheet(careerDetails, index, link);
        });
    });

    previousDetail.addEventListener('click', () => stepDetail(-1));
    nextDetail.addEventListener('click', () => stepDetail(1));
    closeSheetButton.addEventListener('click', closeSheet);
    grip.addEventListener('click', (event) => {
        if (event.detail === 0) closeSheet();
    });
    sheet.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeSheet();
    });

    sheet.addEventListener('click', (event) => {
        if (event.target !== sheet) return;
        const { left, right, top, bottom } = sheet.getBoundingClientRect();
        if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) closeSheet();
    });

    sheet.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        stepDetail(event.key === 'ArrowRight' ? 1 : -1);
    });

    grip.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || sheetClosing) return;
        sheetDrag = { pointer: event.pointerId, start: event.clientY, distance: 0 };
        grip.setPointerCapture(event.pointerId);
    });

    grip.addEventListener('pointermove', (event) => {
        if (event.pointerId !== sheetDrag?.pointer) return;
        sheetDrag.distance = Math.max(0, event.clientY - sheetDrag.start);
        if (!reducedMotion.matches) {
            sheet.style.transform = `translateY(${sheetDrag.distance}px)`;
            sheet.style.clipPath = `inset(0 0 ${sheetDrag.distance}px 0)`;
        }
    });

    grip.addEventListener('pointerup', (event) => {
        if (event.pointerId !== sheetDrag?.pointer) return;
        const distance = sheetDrag.distance;
        sheetDrag = null;
        if (distance >= 72) closeSheet();
        else {
            sheet.style.removeProperty('transform');
            sheet.style.removeProperty('clip-path');
        }
    });

    grip.addEventListener('lostpointercapture', () => {
        sheetDrag = null;
        if (!sheetClosing) {
            sheet.style.removeProperty('transform');
            sheet.style.removeProperty('clip-path');
        }
    });

    window.addEventListener('resize', () => {
        if (sheet.open) alignSheet();
    });
}

const viewer = document.querySelector('.image-viewer');
const viewerImage = viewer.querySelector('img');
const viewerCaption = viewer.querySelector('figcaption');
const previousImage = viewer.querySelector('.image-previous');
const nextImage = viewer.querySelector('.image-next');
let gallery = [];
let galleryIndex = 0;
let imageTrigger = null;

function showImage(index) {
    const item = gallery[index];
    if (!item) return false;
    galleryIndex = index;
    viewerImage.src = item.href;
    viewerImage.alt = item.querySelector('img').alt;
    viewerCaption.textContent = item.closest('figure').querySelector('figcaption').textContent;
    previousImage.setAttribute('aria-disabled', String(index === 0));
    nextImage.setAttribute('aria-disabled', String(index === gallery.length - 1));
    return true;
}

function stepImage(direction) {
    if (showImage(galleryIndex + direction)) playCue('navigate');
}

if (typeof viewer.showModal === 'function') {
    sheetContent.addEventListener('click', (event) => {
        const link = event.target.closest('.project-gallery a');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        gallery = Array.from(sheetContent.querySelectorAll('.project-gallery a'));
        imageTrigger = link;
        showImage(gallery.indexOf(link));
        viewer.showModal();
        playCue('open');
    });

    previousImage.addEventListener('click', () => stepImage(-1));
    nextImage.addEventListener('click', () => stepImage(1));
    viewer.querySelector('.image-close').addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
    viewer.addEventListener('close', () => {
        playCue('close');
        imageTrigger?.focus({ preventScroll: true });
        imageTrigger = null;
    });
    viewer.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        stepImage(event.key === 'ArrowRight' ? 1 : -1);
    });
}
