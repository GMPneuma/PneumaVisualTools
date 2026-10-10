import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
export async function checkPreview(weapons){
 const runtime=await readFile(new URL('../dist/weapon-effect-player.js',import.meta.url),'utf8');
 const preview=await readFile(new URL('../docs/bullet-animation-preview.html',import.meta.url),'utf8');
 assert.equal(preview,await readFile(new URL('../docs/combat-sound-preview.html',import.meta.url),'utf8'),'both bookmarks use the same preview');
 assert.equal(preview.split('/* MODULE_RUNTIME_START */\n')[1].split('\n/* MODULE_RUNTIME_END */')[0],runtime,'preview contains the exact current module runtime');
 const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('../docs/bullet-animation-preview.html',import.meta.url).href);
  assert.equal(await page.locator('#weapon option').count(),15);
  assert.equal(await page.locator('#ammo option').count(),6);
  await page.uncheck('#sound');
  for(const weapon of weapons)for(const outcome of ['play','miss']){
   await page.selectOption('#weapon',weapon);await page.click('#'+outcome);
   await page.waitForSelector('.pneuma-weapon-effects');
   if(['grenade','rocket'].includes(weapon)){await page.waitForFunction(()=>!document.getElementById('resolve').disabled);await page.click('#resolve');}
   await page.waitForSelector('.pneuma-weapon-effects',{state:'detached'});
  }
  for(const size of [{width:1100,height:760},{width:600,height:800}]){
   await page.setViewportSize(size);await page.selectOption('#weapon','blade');
   const positions=await page.evaluate(()=>{const a=document.getElementById('source').getBoundingClientRect(),b=document.getElementById('target').getBoundingClientRect();return {gap:b.x-a.right,aligned:Math.abs(b.y-a.y)<1}});
   assert.ok(positions.gap>0&&positions.aligned,'melee tokens align without overlap at either viewport size');
   await page.click('#play');await page.waitForSelector('.pneuma-weapon-effects');await page.click('#stop');
   assert.equal(await page.locator('.pneuma-weapon-effects').count(),0);
  }
  await page.setViewportSize({width:1100,height:760});
  await page.selectOption('#weapon','rifle');await page.selectOption('#mode','auto');await page.click('#play');await page.waitForSelector('.pneuma-weapon-effects');await page.click('#stop');
  await page.selectOption('#mode','suppression');await page.click('#miss');await page.waitForSelector('.pneuma-weapon-effects');await page.click('#stop');
  await page.selectOption('#weapon','pistol');assert.equal(await page.locator('#mode option').count(),1);
  await page.selectOption('#weapon','melee');assert.ok(await page.locator('#ammo').isDisabled());
  await page.selectOption('#weapon','rifle');assert.ok(await page.locator('#ammo').isEnabled());
  await page.emulateMedia({reducedMotion:'reduce'});await page.click('#play');await page.waitForSelector('.pneuma-weapon-effects');await page.click('#stop');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.check('#sound');await page.click('#all');await page.click('#stop');await page.waitForTimeout(3200);
  assert.equal(await page.locator('.pneuma-weapon-effects').count(),0,'stop cancels play-all and pending audio unlock');
  await page.screenshot({path:'docs/combat-map-preview.png'});assert.deepEqual(errors,[]);
  console.log('Runtime parity, map layout, hit/miss playback, controls, reduced motion, and cancellation passed.');
 }finally{await browser.close();}
}
