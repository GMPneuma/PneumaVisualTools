import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {actionEffects} from '../dist/weapon-effect-events.js';
const effect=actionEffects('area-1',{'pneuma-combattools':{rollsRevealed:true,aoe:{phase:'responses',attackDiceRevealed:true,kind:'explosive',ammoType:'teargas',scene:'s',area:{origin:{x:100,y:100}},exchange:{attacker:'a',thrownSource:true}}}})[0];
assert.equal(effect.areaMessage,'area-1');assert.equal(effect.areaAmmo,'teargas');
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:900,height:780}});
 await page.setContent('<style>body{margin:0;background:#101e26;color:#eee}canvas{display:block}</style><canvas width="900" height="780"></canvas>');
 await page.addScriptTag({content:(await readFile('dist/weapon-effect-player.js','utf8')).replace(/^export /gm,'')});
 const result=await page.evaluate(()=>{
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),results=[];
  const cells=[];for(let row=0;row<3;row++)for(let col=0;col<3;col++){if(row===0&&col===2)continue;const x=20+col*60,y=20+row*60;cells.push([{x,y},{x:x+60,y},{x:x+60,y:y+60},{x,y:y+60}]);}
  Object.keys(grenadeVisuals).forEach((ammo,i)=>{
   const sample=document.createElement('canvas');sample.width=sample.height=220;const c=sample.getContext('2d');createAreaBurst()(c,cells,ammo,.3,false);
   const alpha=(x,y)=>c.getImageData(x,y,1,1).data[3];
   results.push({ammo,outside:alpha(150,40),edge:alpha(21,50),inside:alpha(50,50),seam:alpha(80,50)});
   const ox=i%3*300,oy=Math.floor(i/3)*260;ctx.save();ctx.translate(ox,oy+25);ctx.strokeStyle='#405563';
   for(const poly of cells){ctx.strokeRect(poly[0].x,poly[0].y,60,60)}ctx.drawImage(sample,0,0);ctx.fillStyle='#e5eff1';ctx.font='16px system-ui';ctx.fillText(grenadeVisuals[ammo].name,20,225);ctx.restore();
  });return results;
 });
 for(const r of result){assert.equal(r.outside,0,r.ammo+' does not spill into excluded square');assert.ok(r.inside>r.edge,r.ammo+' inward feather');assert.ok(r.seam>0,r.ammo+' continuous across internal cell boundary');}
 await page.screenshot({path:'docs/grenade-area-preview.png'});
 await page.goto(new URL('../docs/bullet-animation-preview.html',import.meta.url).href);await page.selectOption('#weapon','grenade');
 assert.equal(await page.locator('#ammo option').count(),9);await page.selectOption('#ammo','incendiary');await page.uncheck('#sound');await page.click('#play');await page.waitForSelector('.pneuma-weapon-effects');await page.waitForFunction(()=>!document.getElementById('resolve').disabled);await page.click('#resolve');await page.waitForSelector('.pneuma-weapon-effects',{state:'detached'});
 console.log('Grenade types, saved ammo identity, inward feather, excluded cells, shared edges and preview playback passed.');
}finally{await browser.close();}
