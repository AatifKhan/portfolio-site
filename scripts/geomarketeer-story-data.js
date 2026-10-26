// One source image and one coordinate system for the live story and its exports.
export const SOURCE = Object.freeze({
    src: 'assets/portfolio/geomarketeer/story-opening/master.png',
    width: 1536,
    height: 1024,
});

export const STORY = Object.freeze([
    {
        id: 'idea', label: 'The idea',
        title: 'Sid wanted a café of his own.',
        body: 'This busy café lane looked like a promising place.',
        description: 'A close view of a busy café lane. Sid’s vacant blue-awning unit sits between operating cafés.',
        camera: { cx: 0.324, cy: 0.862, zoom: 2.35 },
    },
    {
        id: 'assumption', label: 'The assumption',
        title: 'The cafés next door were busy.',
        body: 'Surely there was room for one more?',
        description: 'A closer view of the same vacant unit, highlighted between its busy café neighbors.',
        camera: { cx: 0.327, cy: 0.845, zoom: 2.85 },
    },
    {
        id: 'doubt', label: 'The doubt',
        title: 'But what was bringing people here?',
        body: 'The metro explained some of the crowd. It didn’t tell Sid who would buy.',
        description: 'The view widens from Sid’s café lane to the shared parking, crossing and nearby underground metro entrance.',
        camera: { cx: 0.535, cy: 0.76, zoom: 1.36 },
    },
    {
        id: 'context', label: 'The context',
        title: 'He needed more than footfall.',
        body: 'Who lives and works nearby? What do they spend? What do the existing cafés already offer?',
        description: 'The full neighborhood reveals residential towers, offices, the metro and café lane. People, spending and competition are questions about this whole area.',
        camera: { cx: 0.5, cy: 0.5, zoom: 0.98 },
    },
    {
        id: 'response', label: 'The response',
        title: 'Same lane. A clearer picture.',
        body: 'GeoMarketeer helps businesses understand a neighborhood before choosing where to open.',
        description: 'The same full neighborhood, with Sid’s original vacant unit gently emphasized. No different location or business outcome is shown.',
        camera: { cx: 0.5, cy: 0.5, zoom: 0.98 },
    },
]);

export function cameraTransform(camera, width, height) {
    const scale = Math.min(width / SOURCE.width, height / SOURCE.height) * camera.zoom;
    return {
        scale,
        x: width / 2 - camera.cx * SOURCE.width * scale,
        y: height / 2 - camera.cy * SOURCE.height * scale,
    };
}

export function cameraCSS(camera, width, height) {
    const { x, y, scale } = cameraTransform(camera, width, height);
    return `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
}

// These are annotations, not new artwork or demographic measurements.
// All elements remain registered to the original 1536 × 1024 image plane.
export function overlayMarkup(index) {
    const candidate = `<rect x="416" y="744" width="166" height="198" rx="10" fill="#4564d8" fill-opacity=".065" stroke="#4564d8" stroke-width="2.2"/>`;
    if (index === 1) return candidate;
    if (index === 2) return `<path d="M 1250 647 L 1160 710 L 1054 784 L 936 854 L 836 912" fill="none" stroke="#4564d8" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 12" opacity=".8"/>`;
    if (index !== 3 && index !== 4) return '';
    const quiet = index === 4 ? '.42' : '.9';
    return `<g opacity="${quiet}">
        <rect x="20" y="22" width="1496" height="982" rx="24" fill="none" stroke="#6c80d0" stroke-width="2" stroke-dasharray="10 16" opacity=".55"/>
        <g font-family="Arial, sans-serif" font-size="34" font-weight="500" text-anchor="middle" fill="#3d4f8f">
            <rect x="610" y="20" width="184" height="62" rx="12" fill="white" fill-opacity=".96"/><text x="702" y="62">People</text>
            <rect x="817" y="20" width="223" height="62" rx="12" fill="white" fill-opacity=".96"/><text x="929" y="62">Spending</text>
            <rect x="1063" y="20" width="265" height="62" rx="12" fill="white" fill-opacity=".96"/><text x="1195" y="62">Competition</text>
        </g>
    </g>${index === 4 ? candidate : ''}`;
}
