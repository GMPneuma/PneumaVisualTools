import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const runtime=await readFile(new URL('../dist/weapon-effect-player.js',import.meta.url),'utf8');
const preview=await readFile(new URL('../docs/bullet-animation-preview.html',import.meta.url),'utf8');
const helper=source=>source.slice(source.indexOf('function closeStrike('),source.indexOf('function dataStream(')).replace(/\s/g,'').replaceAll(';','');
assert.equal(helper(runtime),helper(preview),'preview and runtime use the same strike renderer');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1100,height:1050}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(new URL('../docs/bullet-animation-preview.html',import.meta.url).href);
 await page.uncheck('#sound');
 await page.evaluate(()=>{window.contacts=0;const original=physicalImpact;physicalImpact=(...args)=>{window.contacts++;original(...args)}});
 for(const weapon of ['melee','blade','punch','martial'])for(const hit of [false,true]){
  await page.selectOption('#gun',weapon);
  await page.evaluate(()=>{window.contacts=0});
  await page.click(hit?'#hit':'#miss');
  await page.waitForFunction(()=>shot===null);
  assert.equal(await page.evaluate(()=>window.contacts>0),hit,weapon+' contact matches outcome');
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.selectOption('#gun','blade');await page.click('#hit');
 assert.equal(await page.evaluate(()=>shot.reduced),true);
 await page.click('#stop');
 await page.evaluate(()=>{
  canvas.width=1000;canvas.height=800;ctx.fillStyle='#101e26';ctx.fillRect(0,0,1000,800);
  const families=['melee','blade','punch','martial'],names=['MELEE / BATON','KATANA','BRAWLING / FIST','MARTIAL ARTS / OPEN HAND'];
  families.forEach((family,row)=>[.42,1.03].forEach((progress,column)=>{
   const x=column*500,y=row*200;ctx.save();ctx.translate(x,y);
   ctx.strokeStyle='#344a55';ctx.strokeRect(0,0,500,200);ctx.fillStyle='#b4cbd6';ctx.font='14px system-ui';ctx.textAlign='left';ctx.fillText(names[row]+' · '+(column?'CONTACT':'WIND-UP'),22,27);
   token(190,112,'ATTACKER','#71bdcc');token(330,112,'TARGET','#d17b7b');
   closeStrike(ctx,family,296,112,0,progress,1.1,1);
   if(column)physicalImpact(296,112,.06,family==='blade'?'#b6eaff':family==='martial'?'#8ee7ff':'#efbf87',{gun:weaponProfiles[family],reduced:false,p:{kind:'spark'}},1,0);
   ctx.restore();
  }));
 });
 await page.locator('canvas').screenshot({path:new URL('../docs/close-combat-upgrade.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
 assert.deepEqual(errors,[]);
 console.log('Close combat: preview/runtime parity, four hit/miss outcomes, reduced motion, and visual review sheet passed.');
} finally {await browser.close()}
