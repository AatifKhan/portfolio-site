import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Controlled compositing of the approved still. This is not a generated
// character-animation clip or a render of a reconstructed 3D environment.
const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '../cinematic-blue-refinement-v1/preview.png');
const output = join(here, 'opening-loop.mp4');
const width = 1600;
const height = 900;
const fps = 24;
const seconds = 4;
const effectWidth = 800;
const effectHeight = 450;
const sx = effectWidth / 1672;
const sy = effectHeight / 941;
const clamp = (x) => `min(1,max(0,${x}))`;
const minimum = (terms) => terms.reduce((a,b) => `min(${a},${b})`);

function polygon(points, feather = 1.2) {
  const p = points.map(([x,y]) => [x*sx,y*sy]);
  const distances = p.map(([x,y],i) => {
    const [xx,yy] = p[(i+1)%p.length];
    const dx = xx-x;
    const dy = yy-y;
    return `((${dx.toFixed(5)})*(Y-${y.toFixed(5)})-(${dy.toFixed(5)})*(X-${x.toFixed(5)}))/${Math.hypot(dx,dy).toFixed(5)}`;
  });
  return clamp(`(${minimum(distances)})/${feather}`);
}

const leftPane = polygon([[697,449],[838,437],[838,680],[697,677]]);
const rightPane = polygon([[861,435],[1037,422],[1038,685],[861,683]]);
const founder = polygon([[731,503],[827,503],[832,726],[730,726]], 4);
const mask = `min(1,(${rightPane})+(${leftPane})*(1-(${founder})))`;

// One closed periodic movement, with zero velocity at the loop boundary.
// Reflections belong only to the glass, behind the model figure and mullions.
const phase = `(2*PI*T/${seconds})`;
const drift = `(14*(1-cos(${phase})))`;
const axis = `(X+0.10*(Y-250))`;
const softReflection = `(48*exp(-pow((${axis}-432-${drift})/25,2))+16*exp(-pow((${axis}-381-${drift})/16,2)))`;
const faintGlint = `(15*exp(-pow((${axis}-458-${drift})/6,2)))`;
const alpha = `(${mask})*(${softReflection}+${faintGlint})`;

const filters = [
  `[0:v]scale=${width}:${height}:flags=lanczos,setsar=1,format=yuv444p[base]`,
  `[1:v]format=rgba,geq=r='185':g='211':b='242':a='${alpha}',scale=${width}:${height}:flags=bicubic[reflection]`,
  '[base][reflection]overlay=shortest=1:format=auto,format=yuv420p[out]',
].join(';\n');

writeFileSync(join(here,'reflection-filter.txt'),filters+'\n');
const args = [
  '-hide_banner','-loglevel','warning','-y',
  '-loop','1','-framerate',String(fps),'-i',source,
  '-f','lavfi','-i',`nullsrc=s=${effectWidth}x${effectHeight}:r=${fps}:d=${seconds}`,
  '-filter_complex',filters,'-map','[out]',
  '-frames:v',String(fps*seconds),'-r',String(fps),'-an',
  '-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',
  '-movflags','+faststart','-video_track_timescale','24000',
  '-metadata','title=GeoMarketeer — opening loop',
  '-metadata','comment=Four-second controlled reflection animation of the approved blue miniature still.',
  output,
];
const render = spawnSync('ffmpeg',args,{stdio:'inherit'});
if (render.status !== 0) process.exit(render.status ?? 1);

const poster = spawnSync('ffmpeg',[
  '-hide_banner','-loglevel','error','-y','-i',output,
  '-frames:v','1','-update','1',join(here,'poster.png'),
],{stdio:'inherit'});
if (poster.status !== 0) process.exit(poster.status ?? 1);

writeFileSync(join(here,'clip-info.json'),JSON.stringify({
  title:'Would you open a café here?',
  type:'Controlled animation of an approved still image',
  source:'../cinematic-blue-refinement-v1/preview.png',
  file:'opening-loop.mp4',
  width,height,fps,seconds,audio:false,
  animation:'Soft blue window reflections move through one periodic cycle. Camera, architecture and figures remain fixed.',
  generation:'Local FFmpeg compositing. No Sora API call was made.',
},null,2)+'\n');
console.log(output);
