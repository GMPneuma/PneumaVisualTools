import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const runtime=(await readFile(new URL('../dist/weapon-effect-player.js',import.meta.url),'utf8')).replace(/^export /gm,'');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.addScriptTag({content:runtime+`
 window.renderSound=async(key,hit,mode='single',ammo='basic',muted=false,stop=false)=>{
  audio=new OfflineAudioContext(2,48000*3,48000);master=audio.createGain();master.gain.value=.65;master.connect(audio.destination);
  noise=audio.createBuffer(1,48000,48000);let seed=17;const data=noise.getChannelData(0);for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;data[i]=(seed>>>0)/2147483648-1;}
  reportBuffers=undefined;nodes.clear();Object.defineProperty(audio,'state',{get:()=> 'running'});
  const cancel=playWeaponEffect({weapon:key,hit,mode,ammo,sound:!muted,visuals:false,volume:1,intensity:1,positions:()=>({source:{x:10,y:10},target:{x:500,y:10}})});
  if(stop)stopWeaponAudio();const buffer=await audio.startRendering();cancel();let peak=0,energy=0,tail=0;
  for(let c=0;c<2;c++)for(const [i,v] of buffer.getChannelData(c).entries()){peak=Math.max(peak,Math.abs(v));energy+=v*v;if(i>48000*1.2)tail+=v*v;}
  return {peak,energy,tail,remaining:nodes.size};
 };window.keys=Object.keys(weaponProfiles);`});
 for(const key of await page.evaluate(()=>keys))for(const hit of [true,false]){
  const result=await page.evaluate(({key,hit})=>renderSound(key,hit),{key,hit});
  assert.ok(Number.isFinite(result.peak)&&result.peak>.005&&result.peak<1,`${key}/${hit}: bounded audible PCM ${JSON.stringify(result)}`);
  assert.ok(result.energy>0);assert.equal(result.remaining,0,`${key}: sources released`);
  if(key==='grenade'||key==='rocket')assert.ok(result.tail>0,'explosion has an audible decay');
 }
 for(const ammo of ['armorPiercing','incendiary','expansive','rubber','smart'])assert.ok((await page.evaluate(ammo=>renderSound('pistol',true,'single',ammo),ammo)).energy>0);
 for(const mode of ['auto','suppression'])assert.ok((await page.evaluate(mode=>renderSound('smg',true,mode),mode)).energy>0);
 assert.equal((await page.evaluate(()=>renderSound('pistol',true,'single','basic',true))).energy,0,'sound switch mutes');
 assert.equal((await page.evaluate(()=>renderSound('smg',true,'auto','basic',false,true))).energy,0,'stop cancels scheduled burst');
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(new URL('../docs/combat-sound-preview.html',import.meta.url).href);
 assert.equal(await page.locator('#weapon option').count(),15);
 await page.selectOption('#weapon','rocket');await page.click('#play');
 assert.equal(await page.locator('.pneuma-weapon-effects').count(),1);
 await page.click('#stop');assert.equal(await page.locator('.pneuma-weapon-effects').count(),0);
 await page.click('#all');await page.click('#stop');assert.deepEqual(errors,[]);
 console.log('All 15 attacks: hit/miss PCM, ammo, burst modes, explosion tails, mute, stop, and source cleanup passed.');
}finally{await browser.close();}
