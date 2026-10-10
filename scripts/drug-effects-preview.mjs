import {readFile,writeFile} from 'node:fs/promises';
const mosaic=process.argv.includes('--mosaic');
const runtime=(await Promise.all(['screen-effect-area','condition-renderers','remaining-renderers','token-effect-mask'].map(name=>readFile(new URL('../dist/'+name+'.js',import.meta.url),'utf8')))).map(code=>code.replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')).join('\n');
const output=mosaic?'primetime-mosaic-preview':'drug-effects-preview';
let html=`<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Drug effects preview</title>
<style>body{margin:0;background:#192128;color:#dde6eb;font:16px system-ui;background-image:linear-gradient(#ffffff06 1px,transparent 1px),linear-gradient(90deg,#ffffff06 1px,transparent 1px);background-size:48px 48px}header{position:relative;z-index:100;padding:18px 24px;background:#0e151be8}h1{font-size:22px;margin:0 0 8px}button,select{font:inherit;padding:7px 12px;margin-right:8px;background:#27333d;color:#e2e9ef;border:1px solid #61717d;border-radius:4px}#token{position:absolute;left:50%;top:55%;transform:translate(-50%,-50%)}#note{position:absolute;left:30%;right:30%;bottom:8%;text-align:center;color:#b8c9d3}p{margin:12px 0 0}</style>
<header><h1>Drug effects preview</h1><select id="drug"><option value="radiation">Radiation</option><option value="emp">EMP</option><option value="choking1">Choking 1</option><option value="choking2">Choking 2</option><option value="blackLace">Black Lace</option><option value="boost">Boost</option><option value="berserker">Berserker</option><option value="primeTime">Prime Time</option><option value="sixgun">Sixgun</option><option value="timewarp">Timewarp</option></select><select id="mode"><option value="both">Screen + token</option><option value="screen">Screen only</option><option value="token">Token only</option></select><button id="play">Preview</button><button id="stop">Stop</button><p id="description"></p></header>
<div id="token"></div><p id="note">Local visual preview. The token overlay uses the runtime artwork transparency mask.</p>
<script src="../node_modules/.pnpm/pixi.js@7.4.3/node_modules/pixi.js/dist/pixi.min.js"></script>
<script>
${runtime}
const app=new PIXI.Application({width:260,height:260,backgroundAlpha:0,antialias:true,preserveDrawingBuffer:true});document.getElementById('token').append(app.view);
const art=document.createElement('canvas');art.width=art.height=160;const ctx=art.getContext('2d');
ctx.fillStyle='#3b4c59';ctx.beginPath();ctx.moveTo(80,6);ctx.lineTo(147,44);ctx.lineTo(147,116);ctx.lineTo(80,154);ctx.lineTo(13,116);ctx.lineTo(13,44);ctx.closePath();ctx.fill();ctx.strokeStyle='#8296a5';ctx.lineWidth=3;ctx.stroke();
ctx.fillStyle='#9cadb8';ctx.beginPath();ctx.arc(80,58,24,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(80,116,40,28,0,Math.PI,Math.PI*2);ctx.fill();
const mesh=new PIXI.Sprite(PIXI.Texture.from(art));mesh.position.set(50,50);app.stage.addChild(mesh);
const overlay=new PIXI.Graphics();overlay.position.set(50,50);app.stage.addChild(overlay);const mask=createTokenEffectMask({mesh},overlay);
const kinds=['radiation','emp','choking1','choking2','blackLace','boost','berserker','primeTime','sixgun','timewarp'],screens=new Map(kinds.map(kind=>[kind,kind==='emp'?createConditionScreen(kind):createPatternScreen(kind)]));
const descriptions={radiation:'Yellow-green contamination haze and sparse drifting particles.',emp:'Bright pixel faults with a typed monospace diagnostic readout.',choking1:'Slow dark breathing pulses around the edges.',choking2:'Stronger, tighter dark pulses around the edges.',blackLace:'Dark openwork lace with clear gaps, subtle movement and fading edges.',boost:'Stylized yellow jet flames stream downward along both full-height edges.',berserker:'Dark green aggressive cuts with a pulsing red halo.',primeTime:'Softly shaded triangles with amber junction diamonds; four cyan highlights fade on each side.',sixgun:'Six moving data packets with cyan circuits and amber accents.',timewarp:'Cyan-violet trailing contours and stretched peripheral motion.'};
let pattern,elapsed=0;
function stop(){for(const screen of screens.values())screen.stop();pattern?.destroy();pattern=undefined;}
function show(){stop();const kind=document.getElementById('drug').value,mode=document.getElementById('mode').value;document.getElementById('description').textContent=descriptions[kind];if(mode!=='token')screens.get(kind).start();if(mode!=='screen'){pattern=kind==='emp'?createConditionToken(kind):createPatternToken(kind);overlay.addChild(pattern.container);}}
app.ticker.add(delta=>{elapsed+=Math.min(delta,3)/60;pattern?.update(160,160,elapsed,0,matchMedia('(prefers-reduced-motion: reduce)').matches)});
document.getElementById('play').onclick=show;document.getElementById('drug').onchange=show;document.getElementById('mode').onchange=show;document.getElementById('stop').onclick=stop;
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',()=>{stop();mask.destroy();app.destroy(true,{children:true,texture:true,baseTexture:true})});
window.drugPreview={show,stop,app,overlay,kinds};show();
</script></html>`;
if(mosaic)html=html.replace('<title>Drug effects preview</title>','<title>Prime Time - shield lattice</title>').replace('<h1>Drug effects preview</h1>','<h1>Prime Time - shield lattice</h1>').replace('value="primeTime"','value="primeTime" selected').replace('Softly shaded triangles with amber junction diamonds; four cyan highlights fade on each side.','Softly shaded triangles with amber junction diamonds; four cyan highlights fade on each side.').replace('Local visual preview. The token overlay uses the runtime artwork transparency mask.','Module preview. Cyan highlights fade over 4.5 seconds.');
await writeFile(new URL('../docs/'+output+'.html',import.meta.url),html);
console.log('Generated docs/'+output+'.html');
