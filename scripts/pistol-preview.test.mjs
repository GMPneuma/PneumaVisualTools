import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('../docs/bullet-animation-preview.html',import.meta.url).href);
 for(const gun of ['pistol','rifle']) {
 await page.selectOption('#gun',gun);
 for(const ammo of ['basic','armorPiercing','incendiary','expansive','rubber','smart']) {
  await page.selectOption('#ammo',ammo);
  for(const result of ['hit','miss']) {
   await page.click('#'+result);
   await page.waitForFunction(()=>shot!==null);
   assert.equal(await page.evaluate(()=>shot.gun.name),gun==='rifle'?'Rifle':'Pistol');
   assert.deepEqual(await page.evaluate(()=>audioEvents.map(event=>event.stage)),['launch',result]);
   await page.waitForFunction(()=>shot===null);
   assert.equal(await page.evaluate(()=>nodes.size),0);
  }
 }
 }
 for(const weapon of ['smg','shotgun','sniper','bow','crossbow','grenade','rocket','melee','blade','punch','grapple','martial','quickhack']) {
  await page.selectOption('#gun',weapon);
  for(const outcome of ['hit','miss']) {
   await page.click('#'+outcome);await page.waitForFunction(()=>shot!==null);
   assert.equal(await page.evaluate(()=>shot.gun===weaponProfiles[weaponSelect.value]),true);
   await page.waitForFunction(()=>shot===null);assert.equal(await page.evaluate(()=>nodes.size),0);
  }
 }
 for(const weapon of ['smg','rifle'])for(const mode of ['auto','suppression']) {
  await page.selectOption('#gun',weapon);await page.selectOption('#mode',mode);await page.click('#hit');
  await page.waitForFunction(()=>shot!==null);
  assert.equal(await page.evaluate(()=>shot.rounds.length),mode==='auto'?5:8);
  assert.equal(await page.evaluate(()=>audioEvents.filter(e=>e.stage==='launch').length),mode==='auto'?5:8);
  await page.waitForFunction(()=>shot===null);assert.equal(await page.evaluate(()=>nodes.size),0);
 }
 await page.selectOption('#gun','pistol');
 assert.equal(await page.locator('#mode option').count(),1,'unsupported automatic modes are removed');
 await page.selectOption('#gun','melee');assert.equal(await page.locator('#ammo').isDisabled(),true);
 await page.selectOption('#gun','rifle');assert.equal(await page.locator('#ammo').isDisabled(),false);
 const reports=await page.evaluate(()=>Object.fromEntries(Object.entries(reportBuffers).map(([key,buffer])=>{
  const data=buffer.getChannelData(0);let peak=0,energy=0;for(const sample of data){peak=Math.max(peak,Math.abs(sample));energy+=sample*sample}
  return [key,{peak,rms:Math.sqrt(energy/data.length),finite:data.every(Number.isFinite)}];
 })));
 for(const report of Object.values(reports)){assert.ok(report.finite);assert.ok(report.peak<=.821);assert.ok(report.rms>.005);}
 assert.notEqual(reports.pistol.rms,reports.rifle.rms,'weapon reports have distinct envelopes');
 await page.check('#slow');await page.click('#hit');await page.waitForFunction(()=>shot!==null);
 await page.screenshot({path:new URL('../docs/pistol-effect-preview.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
 await page.click('#stop');assert.equal(await page.evaluate(()=>shot),null);assert.equal(await page.evaluate(()=>nodes.size),0);
 await page.uncheck('#sound');await page.uncheck('#slow');await page.click('#miss');
 assert.deepEqual(await page.evaluate(()=>audioEvents),[]);
 await page.emulateMedia({reducedMotion:'reduce'});await page.click('#hit');
 assert.equal(await page.evaluate(()=>shot.reduced),true);
 assert.deepEqual(errors,[]);
 console.log('Weapon preview: all 15 weapon choices, six ammo profiles, hit/miss, automatic/suppression sequences, cleanup, stop, mute, reduced motion, and browser errors passed.');
} finally {await browser.close()}
