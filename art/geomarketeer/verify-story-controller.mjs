import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { SOURCE, STORY, cameraCSS, overlayMarkup } from '../../scripts/geomarketeer-story-data.js';

// Exercise the actual browser controller's event boundary without introducing
// a browser dependency. Layout, media-query CSS and visual quality still need
// real-browser inspection; this fixture only supplies those platform inputs.
const source = fs.readFileSync(new URL('../../scripts/geomarketeer-story.js', import.meta.url), 'utf8')
    .replace(/^import .*?;\s*/s, '');
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};

class Element {
    constructor() {
        this.attrs = new Map();
        this.dataset = {};
        this.style = {};
        this.hidden = false;
        this.disabled = false;
        this.textContent = '';
        this.events = new Map();
        this.classes = new Set();
        this.children = [];
        this.classList = {
            add: name => this.classes.add(name),
            remove: name => this.classes.delete(name),
            toggle: (name, force) => {
                const on = force ?? !this.classes.has(name);
                if (on) this.classes.add(name); else this.classes.delete(name);
                return on;
            },
        };
    }
    setAttribute(name, value) { this.attrs.set(name, value); }
    getAttribute(name) { return this.attrs.get(name) ?? null; }
    removeAttribute(name) { this.attrs.delete(name); }
    addEventListener(name, fn) {
        if (!this.events.has(name)) this.events.set(name, []);
        this.events.get(name).push(fn);
    }
    click() {
        if (this.disabled) return;
        for (const fn of this.events.get('click') ?? []) fn({ preventDefault() {} });
    }
}

function fixture({ reduced = false, hidden = false } = {}) {
    const selectors = [
        '.geo-story-viewport', '.geo-story-plane', '.geo-story-master',
        '.geo-story-overlays', '.geo-story-copy', '.geo-story-nav',
        '[data-geo-action="prev"]', '[data-geo-action="next"]',
        '.geo-story-current', '.geo-story-status', '.geo-story-loading',
        '.geo-story-error', '[data-geo-action="skip"]', '[data-geo-action="retry"]',
    ];
    const nodes = Object.fromEntries(selectors.map(key => [key, new Element()]));
    const root = new Element();
    const beats = STORY.map(() => new Element());
    root.querySelector = key => nodes[key];
    root.querySelectorAll = key => key === '.geo-story-beat' ? beats : [];
    const viewport = nodes['.geo-story-viewport'];
    let width = hidden ? 0 : 560;
    viewport.getBoundingClientRect = () => ({ width, height: width * 9 / 16 });
    const overlays = nodes['.geo-story-overlays'];
    Object.defineProperty(overlays, 'innerHTML', {
        set(value) { this.children = [...value.matchAll(/<svg\b/g)].map(() => new Element()); },
    });
    const copy = nodes['.geo-story-copy'];
    copy.animations = [];
    copy.animate = (...args) => {
        const animation = { args, cancelled: false, cancel() { this.cancelled = true; } };
        copy.animations.push(animation);
        return animation;
    };
    const master = nodes['.geo-story-master'];
    const decodes = [];
    master.naturalWidth = SOURCE.width;
    master.decode = () => { const d = deferred(); decodes.push(d); return d.promise; };
    const font = deferred();
    const media = { matches: reduced, listener: null, addEventListener(_, fn) { this.listener = fn; } };
    const raf = [];
    const timers = new Map();
    let timerId = 0;
    const pages = [Object.assign(new Element(), { id: 'homePage' }), Object.assign(new Element(), { id: 'caseStudyPage' })];
    const heading = new Element();
    const section = new Element();
    let focused = null;
    heading.focus = options => { focused = { heading, options }; };
    section.querySelector = () => heading;
    section.scrollIntoView = options => { section.lastScroll = options; };
    const caseViews = [];
    let resize;
    const context = {
        SOURCE, STORY, cameraCSS, overlayMarkup, URLSearchParams,
        document: {
            readyState: 'complete', fonts: { ready: font.promise },
            getElementById: id => id === 'geoStory' ? root : id === 'geoCaseResearch' ? section : null,
            querySelectorAll: () => pages,
        },
        location: { search: '?project=geomarketeer' },
        window: { setActiveNav() {}, setCaseStudyView: (...args) => caseViews.push(args) },
        matchMedia: () => media,
        ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} },
        requestAnimationFrame: fn => raf.push(fn),
        setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; },
        clearTimeout: id => timers.delete(id),
        Date,
    };
    vm.runInNewContext(source, context, { filename: 'geomarketeer-story.js' });
    return {
        root, nodes, beats, viewport, master, decodes, font, media, copy, pages, caseViews, section,
        next: nodes['[data-geo-action="next"]'], prev: nodes['[data-geo-action="prev"]'],
        retry: nodes['[data-geo-action="retry"]'], skip: nodes['[data-geo-action="skip"]'],
        plane: nodes['.geo-story-plane'],
        focused: () => focused,
        flushFrames: () => { while (raf.length) raf.shift()(); },
        flushTimers: () => { for (const fn of timers.values()) fn(); timers.clear(); },
        resizeTo: nextWidth => { width = nextWidth; resize([{ contentRect: { width } }]); },
    };
}

async function microtasks() { await Promise.resolve(); await Promise.resolve(); }
async function ready(f) { f.decodes[0].resolve(); await microtasks(); f.flushFrames(); }

const normal = fixture();
assert.equal(normal.root.dataset.beat, '0');
assert.equal(normal.prev.disabled, true);
assert.equal(normal.root.dataset.image, 'loading');
assert.equal(normal.pages[0].classes.has('hidden'), true);
assert.equal(normal.pages[1].classes.has('hidden'), false);
await ready(normal);
assert.equal(normal.root.dataset.image, 'ready');
normal.next.click(); normal.next.click(); normal.prev.click();
assert.equal(normal.root.dataset.beat, '1', 'rapid reversal settles on latest selected beat');
assert.equal(normal.beats.filter(beat => !beat.hidden).length, 1);
assert.equal(normal.plane.style.transitionDuration, '850ms');
assert.equal(normal.plane.style.transform, cameraCSS(STORY[1].camera, 560, 315));
normal.flushTimers();
assert.match(normal.nodes['.geo-story-status'].textContent, /Step 2 of 5/);
normal.resizeTo(342);
assert.equal(normal.root.dataset.beat, '1');
assert.equal(normal.plane.style.transform, cameraCSS(STORY[1].camera, 342, 342 * 9 / 16));
normal.next.click(); normal.next.click(); normal.next.click();
assert.equal(normal.root.dataset.beat, '4');
assert.equal(normal.next.textContent, 'Read the case study');
normal.next.click(); normal.flushFrames();
assert.equal(normal.caseViews.at(-1)[0], 'full');
assert.equal(normal.focused().heading != null, true);
assert.equal(normal.section.lastScroll.behavior, 'smooth');

const reduced = fixture({ reduced: true });
await ready(reduced);
reduced.next.click();
assert.equal(reduced.plane.style.transitionDuration, '0ms');
assert.equal(reduced.copy.animations.length, 0);
reduced.skip.click(); reduced.flushFrames();
assert.equal(reduced.section.lastScroll.behavior, 'auto');

const hidden = fixture({ hidden: true });
await ready(hidden);
hidden.resizeTo(560);
assert.equal(hidden.plane.style.transform, cameraCSS(STORY[0].camera, 560, 315));
hidden.resizeTo(0);
assert.equal(hidden.root.dataset.beat, '0');

const failing = fixture();
failing.decodes[0].reject(new Error('network failure'));
await microtasks();
assert.equal(failing.root.dataset.image, 'error');
assert.equal(failing.nodes['.geo-story-error'].hidden, false);
failing.next.click();
assert.equal(failing.root.dataset.beat, '1', 'story text remains navigable when image fails');
failing.retry.click();
assert.equal(failing.root.dataset.image, 'loading');
failing.decodes[1].resolve(); await microtasks(); failing.flushFrames();
assert.equal(failing.root.dataset.image, 'ready');
assert.equal(failing.root.dataset.beat, '1');

const stale = fixture();
stale.retry.click();
stale.decodes[1].resolve(); await microtasks(); stale.flushFrames();
stale.decodes[0].reject(new Error('stale failure')); await microtasks();
assert.equal(stale.root.dataset.image, 'ready', 'stale decode failure cannot overwrite newer success');
stale.retry.click(); stale.retry.click();
stale.decodes[2].resolve(); await microtasks(); stale.flushFrames();
assert.equal(stale.root.dataset.image, 'loading', 'stale success cannot expose newer pending image');
stale.decodes[3].resolve(); await microtasks(); stale.flushFrames();
assert.equal(stale.root.dataset.image, 'ready');

const lateFonts = fixture();
await ready(lateFonts);
lateFonts.next.click();
lateFonts.font.resolve(); await microtasks();
assert.equal(lateFonts.plane.style.transitionDuration, '850ms', 'font completion must not snap an active camera transition');

console.log('Story controller checks passed: routing, five-beat navigation, rapid reversal, resize/reveal, reduced motion, image failure/retry, stale decode protection, fifth-action focus, and late fonts.');
console.log('Limits: fake layout/media inputs do not verify visual interpolation, CSS media queries, browser accessibility trees, or real network behavior.');
