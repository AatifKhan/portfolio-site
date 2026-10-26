import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SOURCE, STORY, cameraTransform, overlayMarkup } from '../../scripts/geomarketeer-story-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetDirectory = path.join(root, 'assets/portfolio/geomarketeer/story-opening');
const reviewDirectory = path.join(root, 'art/geomarketeer/story-opening');
const width = 1120;
const height = 630;
const master = await fs.readFile(path.join(root, SOURCE.src));
const metadata = await sharp(master).metadata();
if (metadata.width !== SOURCE.width || metadata.height !== SOURCE.height) {
    throw new Error('Master dimensions differ from the shared source coordinate system.');
}
const imageURL = `data:image/png;base64,${master.toString('base64')}`;
await fs.mkdir(assetDirectory, { recursive: true });
await fs.mkdir(reviewDirectory, { recursive: true });

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const escapeHTML = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const files = [];
for (const [index, step] of STORY.entries()) {
    const { x, y, scale } = cameraTransform(step.camera, width, height);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" overflow="hidden">
        <rect width="${width}" height="${height}" fill="white"/>
        <g transform="translate(${x} ${y}) scale(${scale})">
            <image href="${imageURL}" width="${SOURCE.width}" height="${SOURCE.height}"/>
            ${overlayMarkup(index)}
        </g>
    </svg>`;
    const filename = `frame-${String(index + 1).padStart(2, '0')}.png`;
    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    await fs.writeFile(path.join(assetDirectory, filename), png);
    files.push({ beat: index + 1, id: step.id, filename, width, height, bytes: png.length, sha256: hash(png), camera: step.camera });
}

const copy = STORY.map((step, index) => `${String(index + 1).padStart(2, '0')} — ${step.label}\n${step.title}\n${step.body}\n`).join('\n');
await fs.writeFile(path.join(reviewDirectory, 'copy.txt'), copy);
const sourceHash = hash(master);
await fs.writeFile(path.join(reviewDirectory, 'exports.json'), JSON.stringify({
    source: SOURCE.src, sourceWidth: SOURCE.width, sourceHeight: SOURCE.height, sourceSha256: sourceHash,
    displayWidth: 560, displayHeight: 315, exportScale: 2,
    note: 'The five exports use the live story camera data and registered overlay markup. They are 2× presentation renders of one unchanged 1536×1024 image, not newly detailed or independently generated artwork.',
    files,
}, null, 2) + '\n');

const cards = STORY.map((step, index) => `<article>
    <img src="../../../assets/portfolio/geomarketeer/story-opening/${files[index].filename}" width="1120" height="630" alt="${escapeHTML(step.description)}">
    <div class="copy"><p class="step">${String(index + 1).padStart(2, '0')} / ${escapeHTML(step.label)}</p><h2>${escapeHTML(step.title)}</h2><p>${escapeHTML(step.body)}</p></div>
</article>`).join('\n');
await fs.writeFile(path.join(reviewDirectory, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoMarketeer — five story frames</title>
<style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#202420;font:15px/1.6 system-ui,sans-serif}main{max-width:608px;margin:64px auto;padding:0 24px}header{margin-bottom:40px}h1{font:400 30px/1.2 Georgia,serif;letter-spacing:-.025em;margin:0 0 14px}header p{color:#6b706a;font-size:13px}a{color:#4257a5}article{margin:0 0 56px}img{display:block;width:100%;height:auto;background:#fff}h2{font:400 26px/1.2 Georgia,serif;letter-spacing:-.025em;margin:12px 0}p{margin:0}.copy{padding-top:22px}.step{color:#6b706a;font-size:11px;letter-spacing:.12em;text-transform:uppercase}footer{font-size:12px;color:#6b706a;border-top:1px solid #e6e8e3;padding:24px 0}@media(max-width:420px){main{margin-top:32px}h2{font-size:24px}}</style></head>
<body><main><header><h1>One neighborhood. Five views.</h1><p>Presentation frames from the live story’s camera data, shown at the case study’s 560px maximum width.</p><p><a href="../../../minimal_portfolio.html?project=geomarketeer">Open the interactive case study</a> · <a href="copy.txt">Story copy</a> · <a href="exports.json">Export details</a></p></header>
${cards}
<footer>The master artwork is unchanged. These 1120 × 630 PNGs are 2× presentation exports, not new illustration detail. People, spending and competition annotations describe questions about the study area; they are not measured demographic results.</footer></main></body></html>\n`);
await fs.writeFile(path.join(reviewDirectory, 'README.md'), `# GeoMarketeer — story opening exports\n\nRun \`node art/geomarketeer/export-story-opening.mjs\` after changing the shared story camera data.\n\n- [Review all five frames with copy](index.html)\n- [Exact story copy](copy.txt)\n- [Source and output details](exports.json)\n- PNGs: \`assets/portfolio/geomarketeer/story-opening/frame-01.png\` through \`frame-05.png\`.\n\nThe live page and exports share \`scripts/geomarketeer-story-data.js\`: camera coordinates, copy and registered annotations. The source is the unchanged reduced-tree illustration. The exports are 2× renders of that raster, with no new artwork, new image synthesis or added detail. Prior artwork stays preserved.\n`);
console.log(JSON.stringify({ source: SOURCE.src, sourceSha256: sourceHash, files, review: 'art/geomarketeer/story-opening/index.html' }, null, 2));
